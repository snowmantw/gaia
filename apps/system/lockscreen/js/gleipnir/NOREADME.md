# Gleipnir

A framework provides a way to handle UI programming with the following rules:

## Process

1. There are no synchronous functions: every function should be used as it's asynchronous, therefore
   we could adopt one uniform method to organize all functions, no matter they're synchronous or asynchronous.
2. Thus, in order to organize asynchronous functions, we need to use Promise-like method to *sequentialize* them.

However, the native Promise API is too simple to use: although it's syntax unveil the two difference stages,
namely the **definition** stage and the **execution** stage, but it provides no way to control them well.
Especially there is no way to abort the execution, which is necessary to control the flow of the sequence.
As a result, we need to make sure:

3. There should be a way could sequentialize the asynchronous steps like Promise, while those steps could
   abort the flow according to arbitrary conditions.
4. Therefore, a abort-able Promise, namely Process, is exactly the core of the framework. It provides the 'phase'
   based mechanism to allow *defined* steps to interrupt the process while they're in the execution stage.

And the way to organize our program in Process would be:

5. Each step in Process would be atomic. That is, although we could interrupt the process at any moment of *execution*
   stage, but the last step before the interruption, since it may still wait the result of some asynchronous
   operations, must *not* be interrupted. In other words, for steps the process is *non-preemtive*.
6. The rule implies one guideline: make each step in the process as small as possible. Otherwise, if one process
   get interrupted while the last step of the previous phase still executing, there may be some unexpected and usually
   unwelcome effects in the program.
7. Another guideline is to make each step 'nullify-able': the step should be able to detect if the process now was
   interrupted, and thus it should perform no effects. The process could provide some helper methods to make this
   become easier.

The rules #5 to #7 is important. For example, if we have such Process, and alias the 'next' as 'atomic':

     process.start()
            .atomic(stepA)       // <--- now it's waiting this
            .atomic(stepB)

    // some urgent event occurs
    process.stop()
           .atomic( doThisAsQuickAsPossible )

It is better than:

     process.start()
            .atomic(() => stepA.then(stepB))

    // some urgent event occurs
    process.stop()
           .atomic( doThisAsQuickAsPossible )

Since at the moment the phase changed from 'started' to 'stopped', the last step of 'started', which in the second
example is an atomic step with exactly two sub-steps, would still be able to execute all sub-steps until they're all done.
In the first example there is only one step would be executed after the interruption, so the uncertain effects would be greatly reduced.

However, in some cases such nested chain is necessary and even useful. For example, if we need to make our step 'Optional',
we could implement it as:

    function predict(condition) {
      if (condition) {
        return (new Process()).start().next(doSomething);
      } else {
        var nullified =
          (new Process()).start().next(() => nullified.stop());
        return nullified;
      }
    }

    // in the main process:
    toGenerateCondition()
      .next((cond) => predict(cond).next( doSomethingIfItsTrue ))
      .next( someStepMustBeDone )

In this example, since the 'predict' may return the 'nullified' process, the following steps could be nullified with some
false condition. The trick we use here is immediately stopping the process when it's switch the stage from *definition* to *execution*,
so the concated steps after that wouldn't be executed, because their targeting phase at the *definition* stage is 'started' but not 'stopped'.

Process may provide better interface to sugar the trick. However, readers should keep in mind that the core idea here would
remain the same.

As a conclusion, Process is the most important component in Gleipnir. The 'phase' and 'stage' based design ensure we could
develop more advanced structure of control flow. This is the key to weave another important asynchronous feature, namely the
events, with the sequentialized steps. In the following sections we would see how this idea be extended and used in various
cases.

## Events

1. Events should be queued, since they could happen at every moment, especially hardware events from user.
2. Since events are queued, the handling processes, would be queued as well.

As a result, we could avoid to set lots of nasty status control flags and time-varying conditional statements
for event processing control.

The importance of #1 & #2 rules is: they could guarantee that we won't have any racing
processes at application level.

## Interrupts

1. However, while the first rule of Events is true, some special events, namely the 'interrupts',
   should *not* be queued. Because components may need to interrupt the event handling process at these moments.
2. That means components must be aware to handle all possible racing with explicit conditional statements & flags.
   Otherwise, racing issue may occur intermittently.

So, in Gleipnir, it's important to process interrupts in components wisely.
It could be the major difficulty of UI programming.

To distinguish the two kinds of events is critical: we have seen lots of bugs of intermittent racing are caused by
naïvely assuming that events could be handled properly at the moment it was fired. However, even those naïve code
could handle ordinary cases well, in edge cases they usually get broken and sometimes the cases are even not so
edging, but only because user triggers the event faster than the implicit assumptions.

## Stream

Stream is the 'cross-product' result of the above two asynchronous operations: the steps and events. In common UI programs,
we need to handle two kinds of requests: 1. prepare the environment to handle event 2. response every incoming event. And in
the first case we need to use Process to organize all asynchronous steps, and in the second case we need a queue to push all
requests in queue and handle them one-by-one. As a result, we could invent a way to satisfy these two requirements with the same
structure, so we have the Stream.

Stream in Gleipnir should:

1. Equip all functions of the Process, so that user could schedule asynchronous steps as the preparation of handling events.
2. Know how to receive events *only after the preparation is done*, and it
3. Could push every incoming event in queue, and handle them in FIFO
4. If the incoming event is interruption, handle it without queuing

In order to achieve that, Stream is exactly an extended Process, which has a event handling method to satisfy the #3 and #4, while
the functions from Process could work on #1 and #2 well. Here is an example of how to use it:

  var stream = new Stream({
    sources: [new MouseEventSource(), new VisibilityEventSource()],
    events: ['mousemove'],
    interrupts: ['mouseover', 'mouseout', 'visibilitychange']
  });
  stream.start(handler)
    .next( fetchData )
    .next( createPhoto )
    .next( () => { stream.ready(); });

  var handler = function(event) {
    switch(event.type) {
      'mouseover':
        this.setupTips();
        // would set this._setupTips = true;
        break;
      'mouseout':
        this.stopTips()
        // would set this._setupTips = false;
        break;
      'visibilitychange':
        stream.stop().next( clear );
        break;
      'mousemove':
        return () => (new Process()).start().next( showTips(event.details) );
    };
  };

In this example, we create a photo which would response to the hovering mouse to show different tips according to its position. However
the data is on the server, so we need to fetch it (a standard asynchronous method) before the photo is ready. And we only start to receive
certain events after we got data and created the photo properly, that's what the 'stream.ready()' line supposes to do.

Note that we omitted some details in the above example, however it won't stop us to take a look at the pattern:

1. We have 3 interruptions in our example. For 'mouseover' and 'mouseout', we need to setup the tips when it's entered the area, and clear them
after the mouse left. However since they're interruptions not be queued, we may need to set some flags to prevent racing, or improperly re-enter
the setup function, although in this case it's encapsulated in the 'setupTips' and 'stopTips' functions.

2. The 'visibilitychange' interruption, means we got hidden and longer need to handle all requests, so we could stop the stream (thus it would switch
to the 'stopped' phase and immediately stops to handle any events in queue) and perform the clear-up steps.

3. In the 'handler' we show tips according to the every new 'mousemove' event. Stream would automatically queue the 'handler' to its main process.
However, if we want to handle the event with Promise or Process, we need to return it so that the concating could work as expected.

4. The events would come from the 'sources', which are helpers to uniform all 'event-like' APIs in our architecture.

So according to this example, we could summarize how to use Stream to implement the program as:

1. Schedule all preparation steps after 'start' it, with the 'next' method
2. Prepare a 'handler' function which would receive interruptions & events
3. In the handler, return Promise/Process if the handler is a chain of asynchronous operations;
   otherwise, just do operations as in the ordinary 'handleEvent'
4. Stop the stream when the ending interruptions comes, and then do the clear-up jobs after it

However, although we could construct our UI programs with Stream, it's still a too low-level API.
So we would introduce the more advanced solution: the Gleipnir Components.

## Component

A component is a compound unit of one ResourceKeeper and multiple States.

