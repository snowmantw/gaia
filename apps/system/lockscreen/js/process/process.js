 'use strict';

/***/
(function(exports) {
  var Process = function() {
    this.states = {
      phase: null,
      currentPromise: null
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
   */
  Process.prototype.shift = function(prev, current) {
    if (prev !== this.states.phase) {
      throw new Error(`Must be ${prev} before shift to ${current},
                       but now it's ${this.states.phase}`);
    }
    this.states.phase = current;
    // Concat new step to switch to the 'stop promise'.
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

    return this;
  };

  /**
   * The 'step' can only be a function return Promise/Process/plain value.
   * No matter a Promise or Process it would return,
   * the chain would concat it as the Promise rule.
   * If it's plain value then this process would ignore it, as
   * what a Promise does.
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

    // Then, concat the step(s).
    this.states.currentPromise =
      this.states.currentPromise.then(() => {
        // We need firstly execute the step(s) to get the Promise/Process,
        // and then concat them in different way.
        // So we unwrap the step first, and then put it in the array.
        // Since we need to give the 'currentPromise' a function as what the
        // steps passed here.
        var chains = steps.map((step) => {
          var chain = step();
          // Ordinary function returns 'undefine' or other things.
          if (!chain) {
            // It's actually a plain value.
            return Promise.resolve(chain);
          }

          if (chain instanceof Process) {
            // Premise: it's a started process.
            return chain.states.currentPromise;
          } else if (chain.then) {
            // Ordinary promise can be concated immediately.
            return chain;
          } else {
            // It's actually a plain value.
            return Promise.resolve(chain);
          }
        });
        return Promise.all(chains);
      });

    // Concat an error handling step to the step and the possible interrupt.
    this.states.currentPromise =
      this.states.currentPromise.catch((err) => {
        // We need this to prevent the step() throw errors.
        // In this catch, we distinguish the interrupt and other errors,
        // and then bypass the former and print the later out.
        //
        // The final fate of the real errors is it would be re-throw again
        // after we print the instance out. We need to do that since after an
        // error the promise shouldn't keep executing. If we don't throw it
        // again, since the error has been catched, the rest steps in the
        // promise would still be executed, and the user-set rescues would
        // not catch this error.
        //
        // As a conclusion, no matter whether the error is an interrupt,
        // we all need to throw it again. The only difference is if it's
        // and interrupt we don't print it out.
        if (!(err instanceof Process.InterruptError)) {
          console.error(`ERROR during step executes: ${err.message}`, err);
        }
        throw err;
      });
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

  Process.InterruptError = function(message) {
    this.name = 'InterruptError';
    this.message = message || '';
  };

  Process.InterruptError.prototype = new Error();

  exports.Process = Process;
})(window);

