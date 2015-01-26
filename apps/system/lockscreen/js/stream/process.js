 'use strict';

/***/
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
      stepResults: []
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

  /**
   * Can arbitrarily shift from a phase to another.
   * The 'newBeginning' denotes to the first step of the new phase.
   * Consinder following state of the queue:
   *
   * Qstart = { [ delay 60 secs promise: ETA = 60 ] [ step ] }
   *
   * If we shift the queue with phase 'start' to 'stop', we would get
   *
   * Qstop  = { [ delay 60 secs promise: ETA = 49 ] [ step ] }
   *
   * And the user could arrange new step at this queue:
   *
   * Qstop  = { [ delay 60 secs promise: ETA = 48 ] [ step ] | [ new step ] }
   *
   * However, since the previous delay promise still waiting to be resolved,
   * the 'new step', even though it's arranged *after* the phase got shifted,
   * it still need to wait the delay promise get resolved. To solve this,
   * we need to explicitly tell the process the step is actually the
   * beginning of the new phase, and forcibly execute it explicitly to
   * kick off the following chain of the new phase.
   *
   * (Note: we could hide it better in the 'next' method, and to check if
   * the step currently arranged by the 'next' is a 'beginning' as this
   * method does. However, since the 'next' method is too complicated,
   * we need to prevent to do that).
   */
  Process.prototype.shift = function(prev, current, newBeginnings) {
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
        // stop phase, until the next phase (final phase) to
        // handle it. Since in Promise, steps after catch would
        // not be affected by the catched error and keep executing.
        throw err;
      }
      // And if it's an interrupt error we do nothing since this would
      // make the chain omit this error and execute the following steps.
    });

    // Execute these steps and care no previous steps which had been queued,
    // since we're the first step(s) of this phase.
    //
    // And if there is execution error the promise this method return would
    // become an rejected promise, so that we need to add a resecue method
    // after this.
    this.states.currentPromise = this.appendErrorHandler(
      this.executeSteps(newBeginnings));
    return this;
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
  Process.prototype.appendErrorHandler = function(promise) {
    return promise.catch((err) => {
      if (!(err instanceof Process.InterruptError)) {
        console.error(`ERROR during step executes: ${err.message}`, err);
      }
      throw err;
    });
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
  Process.prototype.next = function(...steps) {
    if (!this.states.currentPromise) {
      throw new Error('Process should initialize with the `start` method');
    }
    // At definition stage, set it's phase.
    // And check if it's a function.
    steps.forEach((step) => {
      if ('function' !== typeof step) {
        throw new Error(`The step ${step} is not a function.`);
      }
      step.phase = this.states.phase;
    });

    // First, concat a 'then' to check interrupt.
    this.states.currentPromise =
      this.states.currentPromise.then(() => {
        // Would check: if the phase it belongs to is not what we're in,
        // the process need to be interrputed.
        for (var step of steps) {
          if (this.checkInterrupt(step)) {
            throw new Process.InterruptError();
          }
        }
      });

    // Read it as:
    // 1. execute all steps to generate resolvable-promises
    // 2. Promise.all(...) to wait these resolvable-promises
    // 3. append a general error handler after the Promise.all
    //    so that if any error occurs it would print them out
    // And the final result is:
    // currentPromise { [Promise.all([stepA1, stepA2...])] [error handler] +}
    this.states.currentPromise =
      this.states.currentPromise.then(() => this.executeSteps(steps));
    this.states.currentPromise =
      this.appendErrorHandler(this.states.currentPromise);
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
   * Execute steps and get Promises or plain values them return,
   * and then return the wrapped Promise as the next step of this
   * process.
   */
  Process.prototype.executeSteps = function(steps) {
    // So we unwrap the step first, and then put it in the array.
    // Since we need to give the 'currentPromise' a function as what the
    // steps passed here.
    var chains = steps.map((step) => {
      var chain;
      // If it has multiple results, means it's a task group
      // generated results.
      if (this.states.stepResults.length > 1) {
        chain = step(this.states.stepResults);
      } else {
        chain = step(this.states.stepResults[0]);
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

