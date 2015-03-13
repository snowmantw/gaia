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

The most core one in Gleipnir is Process. It's basically a wrapped Promise, but with
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

    function start() {
      var process = new Process();
      process.start()
        .next( getUrl )
        .next( fetchData )
        .next( render );
      return process;
    }

Here we perform a classic compound operation to render DOM elements after we fetch data
from remote server, with the default URL path we get. In this case, the first step 'getUrl'
is synchronous, while to fetch data from server is definitely an asynchronous step. And the
last step of rendering the result should be some synchronous DOM manipulations. Without Process
we may do this:

    function start() {
      var url = getUrl;
      return fetchData(url).then((result) => {
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

    addEventListener('some-event', handleEventWithQueue);

    function handleEventWithQueue(event) {
      this.mainProcess.next()
    }

However, there are still some special events should be handled immediately. 
