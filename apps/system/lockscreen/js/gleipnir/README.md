# Gleipnir

A framework provides a solution of UI programming.

## Introduction

From Gaia development we have identified several common issues of UI programming
with vanilla JavaScript:

1. Racing issues are easily hidden in the event-based programming
2. Time-varying conditional statements
3. Different pattern to organize synchronous & asynchronous operations
4. Unaware concurrent processes due to too much implicit assumptions

Developers could still avoid these problems, if they keep some guidelines in mind.
However, it's inefficient to require everybody to manually apply these rules in
each different case. So we decide to write some actual code to help us to construct
UI programs without those issues, and the final result is this framework.

## The Architecture

### Process

The core of Gleipnir is Process. It's basically a wrapped Promise, but with
the ability to be interrupted with the non-preemptive model. With Process, we could:

1. Organize all synchronous and asynchronous operations in the same way
2. Distinguish the *interruptions* and *events*, which in vanilla JavaScript
   are lethally confused

The first ability actually represents the #1 rule: there are no 'synchronous' operations
in Gleipnir; every operation should be treated as asynchronous. That is, even though the
API or function is exactly a synchronous operation, we must use it in the asynchronous way.

The importance of this rule is, now we're able to ensure the way to sequentialize all
steps remains the same.: the main control flow would concat all synchronous and asynchronous
functions as steps with Process. For example:

    function startRendering(settings) {
      var process = new Process();
      process.start()
        .next( getUrl.bind(null, settings) )
        .next( fetchData )
        .next( render );
      return process;
    }

Here we perform a classic compound operation to render DOM elements after we fetch data
from remote server, with the default URL path we get. In this case, the first step 'getUrl'
is synchronous, while to fetch data from server is definitely an asynchronous step. And the
last step of rendering the result should be some synchronous DOM manipulations. Without Process
we may do this:

    function startRendering(settings) {
      var url = getUrl(settings);
      return fetchData(url)
      .then((result) => {
        render(result);
      });
    }

In Gaia statements like this scatter about everywhere. For short function it's okay. However,
we usually need to write some more complicated functions with several synchronous and asynchronous
operations, and the trouble of mixing such different two styles in the same context will emerge
soon. So, in Gleipnir, we basically only adopt one style to organize all steps, as the first
example shows.

The second ability of Process is even much important, since one of the major root cause of
racing problems is in vanilla JavaScript events are not queued. It means that if we want
to prevent racing we need to set lots of flags or locks, because we must make sure the same
code in the event handler won't enter those none reentry-able sections again when the event
erupts. However, to manage and use those flags & locks well, especially when the program grows
fast, is too difficult to be done. So we decide to forcibly put all event and its handler in
queue, in most cases is much simpler and robuster. And Process could achieve that in Gleipnir:

    addEventListener('foo', queueHandler);
    addEventListener('bar', queueHandler);

    function queueHandler(event) {
      mainProcess.next(() => handleEvent(event));
    }

    function handleEvent(event) {
      switch(event.type) {
        case 'foo':
          print('foo occurs');
        break;
        case 'bar':
          return startRendering(event.defaultSettings);
      }
    }

In this way we: 1. make sure when events erupt, they would be handled one-by-one,
so it's racing-free now 2. generate sequentialized operations and return it,
so that the main process could concat it every time the event occurs.

However, there are still some special events should be handled immediately. In Geipnir we call
them as *interrputs*. For example, if we want to stop to render elements because the screen
now is off, we could rewrite the 'queueHandler' as:


    addEventListener('foo', queueHandler);
    addEventListener('bar', queueHandler);
    addEventListener('screenchange', queueHandler);

    function queueHandler(event) {
      if ('screenchange' === event.type) {
        handleEvent(event);
      } else {
        mainProcess.next(() => handleEvent(event));
      }
    }

In this version, if the incoming event is interrupt ('screenchange'), we would handle it
immediately. Usually it would immediately stop the process and do the clear up jobs as:

    function handleEvent(event) {
      switch(event.type) {
        case 'screenchange':
          if (!event.details.isEnabled) {
            mainProcess.stop();
          }
    }


The Process#stop method would switch the phase of the process from 'started' to 'stopped'.
By doing so, all handlers still in queue would not be executed anymore. This is because:

    process
      .start()
        .next( stepFoo )
        .next( stepBar )

    // In somewhere else
    process
      .stop()
        .next( stepX )
        .next( stepZ )

Here, the 'stepFoo' and 'stepBar' are tagged as 'started' steps, since they're *defined*
after the process starting itself. So if the process is still waiting the asynchronous
'stepFoo', while in somewhere else the process got stopped because interrupts come, the
rest 'stepBar' would never be executed. Instead of, the 'stepX' tagged as steps of 'stopped'
phase would be executed. As a result, the phase changing during the definition and running
*stage* is the reason why Process could work well on both operation management and event
handling. The only issue is the interfaces Process exposed is still too low-level, so
we would introduce the advanced structure: Stream, which is based on Process but
it has nicer APIs for event handling.

## Stream

Stream is a Process with the ability of event handling, so user needn't consider how to
combine the event handling and flow control.

In fact, stream would receive events from *Sources*, which helps us to forward all messages
of various system APIs in a uniform form. For example, if we want to handle DOM events *and*
timers, we could write our code as:

    var stream = new Stream({
      sources: [ new DOMEventSource('visibilitychage'),
                 new TimerSource(1000, 'tick') ],
      events: ['tick'],
      interrupts: ['screenchange']
    });

    stream.start(onchange)
    .next( fetchData )
    .next( renderClock )
    .next( stream.ready() );

    var onchange = function(event) {
      switch(event.type) {
        case 'tick':
          return renderClock();
        case 'visibilitychange':
          stream.stop()
          .next( clearClock );
        break;
      }
    };

In the example, we first fetch data from server and render the clock. Then, we call
'ready' to notify Stream it could start to receive events. In the 'onchange' function
we would check if the event is the interrupt 'visibilitychange', which means the frame
has been hidden, so we stop to update the clock via stopping the stream.

Note that after we stopped the stream it still can execute steps. As Process, steps
are tagged with different phases at *definition* stage, and then Stream could decide
whether the step could be executed at *runtime*. However, the only difference is 'stop'
method of Stream not only means it would switch the phase, but also stop to listen any
events from sources.

Another notable thing is our 'renderClock' would return another Process to execute the
actual steps of rendering the UI. So in the 'onchange' we must return the result Process
to let Stream concat it and remain it sequential. That is, if we write this:

    var onchange = function(event) {
      switch(event.type) {
        case 'foo':
          (new Process()).start().next( renderFoo );
          break;
        case 'bar':
          return (new Process()).start().next( renderBar );
      }
    };

    stream.start(onchange)
    .next( stream.ready() )
    .next( fetchData )        // <-- event comes before this step

When the event comes, if it's 'foo' event, since we perform the operations with a new Process
**but not return it**, the stream wouldn't wait it but immediately execute the next step of
fetching data, so we would be in the racing risk. On the other hand, since we return the new
process when the 'bar' event comes, the stream would wait it and don't execute the 'fetchData'
step until the 'renderBar' chain is ended. So the rule is **always return operation chain
when handling events**.

## Component

With Stream we could make sure there is no risk of racing when we're handling events. However,
we still need a generic unit to construct our program. In Gleipnir, we call it Component.

A component is actually composed with three parts: 1. Resources 2. States 3. View. We would
take a look at these three parts:

### Resources

Resources keep all data and data operations of the component, including DOM elements, server 'models',
configures, system settings, etc. The rule is keep all operations as simple as possible, especially
they should contain no conditional statements based on events or other asynchronous condition changes.
Because States would manage these asynchronous conditional statements.

Resources should not know how to set up the data. Every component needs a SetupState to set up itself.
The operations in Resources should implicitly assume the operand is ready, and it should only
operate on the specific operand with the given arguments.

### States

States are roughly equal to controllers of component. It's role is to update resources and
render the view. However, they're different from the traditional 'controllers', because one of our goal
is to reduce arbitrary state changes and temporary variables as much as possible. As a result,
when event happens and it means the behavior of component would be changed, the current state
of the component would transfer to another. Moreover, the progress of transferring do explicitly
clean the effects of previous state if it's necessary, so we could avoid get into the trouble
of management different set of internal flags, variables and other common mess of monolithic
component.

In fact, with states in components, we make every component as a state machine. The states of
the machine would do transferring according to the incoming events and interrupts, thus we don't
need to consider how to compose the time-varying conditional statements correctly, which is always
too ad-hoc and never get readable.

In theory, it's sufficient to manage the component by only using methods from Resources. However,
states may need to keep some state-only operands and operations inside itself. That's fine, but
if the state grows up and the there are some resources should be shared among states, the resources
and methods should be pulled out and put in the Resources of the component.

### View

View denotes what effects the component is for. For example, a Button component should render its UI
view to show itself. However, in Gleipnir we extend the concept of view, so there could be various views
irrelevant to UI. One instance is we may have a log 'view' to let components 'render' the log when
data changed, and the logs are printed in console.

From the aspect of effect we could make our 'view' even more powerful. For example a common component
renders 'view' as its 'UI' effect, so that a component with 'File' view could render its 'IO' effect,
and so on. Moreover, view could be dynamically mount and unmount in Component, so a debugging view
could be mounted in our Component when we're testing it, and switch to the formal UI view when in
production mode.

Also, view in Gleipnir is able to adapt Virtual DOM based one like what React.js uses, depends on what
policy is. In Gaia we couldn't afford to convince others adopt such advanced render method, although
it indeed benefits applications with its simplest rendering approach.

## What's about sub-components?

Component could contain sub-components. The sub-components methods is a standalone part that not
belong to the above three parts, but belongs to Component itself.

For parent components, their children only expose the methods to setup, start, stop and destroy
themselves. Therefore, if parents need to communicate with children, they must follow the standard
method of cross-component communication in the next section. However, in most of cases, since components
are encapsulated function units, parent and children usually needn't co-work like that. In fact,
children should never know anything about parent, so that we can make sure each component is
isolated and decoupled.

## Cross-component communication

Although component should be encapsulated to make sure the effects would not leak, different components
may still need to work together. For example, click the stop button of an alarm would change the UI of
the clock, thus the button component need to notify the clock component, while they may or may not in
the parent-child relation.

To handle requests like this, components should communicate with each other via events that would be
forwarded by Sources. So in browser we could fire and receive events from native DOM (customized) event,
and if we're in Node.js we could implement our own event system with the native EventTarget and other APIs.
In this way user could invent their own communication method with the customized Sources, while default
Sources should be enough to handle most of cases.

So from receiver side we could make sure that, the notifications from other components shall be forwarded
to Stream of the activated State in the component. And from sender side we could instantiate one corresponding
Emitter to firer the customized event known by Source, or just fire the native event via native API. It depends
on whether the specific Source could collect all events fired by senders. For example, if our program is used on
a platform without any event mechanism, we may need to pair our customized Emitter and Source to bridge the sender
and receiver with the underlying 'event' system implemented by us. This is also a way we could use to avoid platform
dependency issue.
