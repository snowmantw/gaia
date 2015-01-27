 'use strict';

/**
 * The core component to sequentialize asynchronous steps.
 * Basically it's an 'interruptable promise', but more than be interrupted,
 * it could 'shift' from one to another phase, with the preemptive
 * interrupting model.
 *
 * Example:
 *    var process = new Process();
 *    process.start()       // the default phase is 'start'
 *           .next(stepA)
 *           .next(stepB)
 *           ...
 *    // later, because of some urgent events
 *    process.stop()       // one of the default three phases
 *           .next(stopStepA)
 *           .next(stopStepB)
 *           ....
 *   // later, because of some other interrupts
 *   process.shift('stop', 'dizzy')
 *          .next(dizzyStepA)
 *          .next(dizzyStepB)
 *
 * The phases listed above would immediately interrupt the steps scheduled
 * at the previous phase. However, this is a *non-preemptive* process by
 * default. So, if there is a long-waiting Promise step in the 'start' phase:
 *
 *   process.start()
 *          .next( longlonglongWaitingPromise )   // <--- now it's waiting this
 *          .next( thisStepIsStarving )
 *          .next( andThisOneToo )
 *          .next( poorSteps )
 *          ....
 *   // some urgent event occurs when it goes to the long waiting promise
 *   process.stop()
 *          .next( doThisAsQuickAsPossible )
 *
 * The first step of the 'stop' phase, namely the 'doThisAsQuickAsPossible',
 * would *not* get executed immediately, since the promise is still waiting the
 * last step before interruption. So, even the following steps of the 'start'
 * phase would all get dropped, the new phase still need to wait the last one
 * asynchronous step get resolved to get kicked off.
 */
(function(exports) {
  var Process = function() {
    this.states = {
      phase: null,
      currentPromise: null,
      until: {
        resolver: null,
        phase: null
      },
      // @see: #next
      stepResults: [],
      // @see: #next
      currentPhaseSteps: 0
    };

    this.configs = {
      preemptive: false
    };
  };

  Process.prototype.start = function() {
    this.states.phase = 'start';
    this.states.currentPromise = Promise.resolve();
    return this;
  };

  Process.prototype.stop = function() {
    return this.shift('start', 'stop');
  };

  Process.prototype.destroy = function() {
    return this.shift('stop', 'destroy');
  };

  Process.prototype.shift = function(prev, current) {
    if (prev !== this.states.phase) {
      var error = new Error(`Must be ${prev} before shift to ${current},
                       but now it's ${this.states.phase}`);
      console.error(error);
      throw error;
    }
    this.states.phase = current;
    if (this.until.phase === this.states.phase) {
      this.until.resolver();
    }
    // Concat new step to switch to the 'next promise'.
    this.states.currentPromise =
    this.states.currentPromise.catch((err) => {
      if (!(err instanceof Process.InterruptError)) {
        // We need to re-throw it again and bypass the whole
        // phase, until the next phase (final phase) to
        // handle it. Since in Promise, steps after catch would
        // not be affected by the catched error and keep executing.
        throw err;
      }
      // And if it's an interrupt error we do nothing, so that it would
      // make the chain omit this error and execute the following steps.
    });
    // At the moment of shifting, there are no steps belong to the new phase.
    this.states.currentPhaseSteps = 0;
    return this;
  };

  /**
   * Return a Promise that only be resolved when we get shifed to the
   * target phase.
   */
  Process.prototype.until = function(phase) {
    var promise = new Promise((res) => {
      this.states.until.resolver = res;
    });
    return promise;
  };

  /**
   * The 'step' can only be a function return Promise/Process/plain value.
   * No matter a Promise or Process it would return,
   * the chain would concat it as the Promise rule.
   * If it's plain value then this process would ignore it, as
   * what a Promise does.
   *
   * About the resolving values:
   *
   * .next( fnResolveA, fnResolveB )  --> #save [a, b] in this process
   * .next( fnResolveC )              --> #receive [a, b] as first argument
   * .next( fnResolveD )              --> #receive c as first argument
   * .next( fnResolveE, fnResolveF)   --> #each of them receive d as argument
   */
  Process.prototype.next = function(...tasks) {
    if (!this.states.currentPromise) {
      throw new Error('Process should initialize with the `start` method');
    }
    // At definition stage, set it's phase.
    // And check if it's a function.
    tasks.forEach((task) => {
      if ('function' !== typeof task) {
        throw new Error(`The task is not a function: ${task}`);
      }
      task.phase = this.states.phase;
    });

    // First, concat a 'then' to check interrupt.
    this.states.currentPromise =
      this.states.currentPromise.then(() => {
        // Would check: if the phase it belongs to is not what we're in,
        // the process need to be interrputed.
        for (var task of tasks) {
          if (this.checkInterrupt(task)) {
            throw new Process.InterruptError();
          }
        }
      });

    // Read it as:
    // 1. execute all tasks to generate resolvable-promises
    // 2. Promise.all(...) to wait these resolvable-promises
    // 3. append a general error handler after the Promise.all
    //    so that if any error occurs it would print them out
    // So, including the code above, we would have:
    //
    // currentPromise {
    //  [checkInterrupt(tasks)]
    //  [Promise.all([taskA1, taskA2...])]
    //  [error handler] +}
    //
    // The 'checkInterrupt' and 'error handler' wrap the actual steps
    // to do the necessary checks.
    // And we follow this path only when the tasks is not the first step of the
    // current phase. If it is, *and* we're in the preemptive mode, we must not
    // concat it to the currentPromise, which would make the step still waiting
    // the last step of the previous phase done, especially if the step comes
    // with some waiting Promise in its body. See the next branch of this
    // section. Of course if we're in non-preemptive mode (by default) we don't
    // care it.
    if (!this.configs.preemptive && 0 !== this.states.currentPhaseSteps) {
      this.states.currentPromise =
        this.states.currentPromise.then(() => this.generateStep(tasks));
      this.states.currentPromise =
        this.states.currentPromise.catch(this.generateErrorLogger({
          'nth-step': this.currentPhaseSteps
        }));
    } else {
      // Suppressor is to ignore the last error from the interrupted Promise,
      // no matter whether it is or isn't an interrupt.
      var interruptedPromise = this.states.currentPromise;
      interruptedPromise =
        interruptedPromise.then(this.generateSuppressor);

      // Execute these steps and care no previous steps which had been queued,
      // since we're the first step(s) of this phase.
      //
      // And if there is execution error the promise this method return would
      // become an rejected promise, so that we need to add a resecue method
      // after this. See the note at the head of this file.
      this.states.currentPromise =
        this.generateStep(tasks);
      this.states.currentPromise =
        this.states.currentPromise.catch(this.generateErrorLogger({
          'nth-step': this.currentPhaseSteps
        }));
    }

    // A way to know if these tasks is the first steps in the current phase,
    // and it's also convenient for debugging.
    this.states.currentPhaseSteps += 1;
    return this;

  };

  Process.prototype.rescue = function(handler) {
    this.states.currentPromise =
      this.states.currentPromise.catch((err) => {
      if (err instanceof Process.InterruptError) {
        // Only built-in phase transferring catch can handle interrupts.
        // Re-throw it until we reach the final catch we set.
        throw err;
      } else {
        handler(err);
      }
    });
    return this;
  };

  /**
   * At the preemptive mode a suppressor would be installed as the final step
   * of the previous interrupted Promise, to igore any errors since it has been
   * interrupted.
   */
  Process.prototype.generateSuppressor = function() {
    return (err) => {};
  };

  /**
   * Execute task and get Promises or plain values them return,
   * and then return the wrapped Promise as the next step of this
   * process. The name 'step' indicates the generated Promise,
   * which is one step of the main Promise of the current phase.
   */
  Process.prototype.generateStep = function(tasks) {
    // So we unwrap the task first, and then put it in the array.
    // Since we need to give the 'currentPromise' a function as what the
    // tasks passed here.
    var chains = tasks.map((task) => {
      var chain;
      // If it has multiple results, means it's a task group
      // generated results.
      if (this.states.stepResults.length > 1) {
        chain = task(this.states.stepResults);
      } else {
        chain = task(this.states.stepResults[0]);
      }

      // Ordinary function returns 'undefine' or other things.
      if (!chain) {
        // It's a plain value.
        // Store it as one of results.
        this.states.stepResults.push(chain);
        return Promise.resolve(chain);
      }

      if (chain instanceof Process) {
        // Premise: it's a started process.
        return chain.states.currentPromise.then((resolvedValue) => {
          this.states.stepResults.push(resolvedValue);
        });
      } else if (chain.then) {
        // Ordinary promise can be concated immediately.
        return chain.then((resolvedValue) => {
          this.states.stepResults.push(resolvedValue);
        });
      } else {
        // It's a plain value.
        // Store it as one of results.
        this.states.stepResults.push(chain);
        return Promise.resolve(chain);
      }
    });
    return Promise.all(chains);
  };

  /** We need this to prevent the step() throw errors.
  * In this catch, we distinguish the interrupt and other errors,
  * and then bypass the former and print the later out.
  *
  * The final fate of the real errors is it would be re-throw again
  * after we print the instance out. We need to do that since after an
  * error the promise shouldn't keep executing. If we don't throw it
  * again, since the error has been catched, the rest steps in the
  * promise would still be executed, and the user-set rescues would
  * not catch this error.
  *
  * As a conclusion, no matter whether the error is an interrupt,
  * we all need to throw it again. The only difference is if it's
  * and interrupt we don't print it out.
  */
  Process.prototype.generateErrorLogger = function(debuginfo) {
    return (err) => {
      if (!(err instanceof Process.InterruptError)) {
        console.error(`ERROR during #${debuginfo['nth-steps']}
            step executes: ${err.message}`, err);
      }
      throw err;
    };
  };

  /**
   * An interface to explicitly put multiple steps execute at one time.
   **/
  Process.prototype.wait = function() {
    this.next.apply(this, arguments);
    return this;
  };

  Process.prototype.checkInterrupt = function(step) {
    if (step.phase !== this.states.phase) {
      return true;
    }
    return false;
  };

  /**
   * Because DRY.
   */
  Process.defer = function() {
    var resolve, reject;
    var promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    var result = {
      'resolve': resolve,
      'reject': reject,
      'promise': promise
    };
    return result;
  };

  /* Static version for mimicking Promise.all */
  Process.wait = function(steps) {
    var process = new Process();
    return process.wait(steps);
  };

  Process.InterruptError = function(message) {
    this.name = 'InterruptError';
    this.message = message || '';
  };

  Process.InterruptError.prototype = new Error();

  exports.Process = Process;
})(window);

