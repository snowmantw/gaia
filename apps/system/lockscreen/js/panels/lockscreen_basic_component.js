/* global Stream */
'use strict';

(function(exports) {
  var LockScreenBasicComponent = function() {
    this.configs = {
      events: [],
      interrupts: [],
      handler: this.handleEvent.bind(this)
    };
    this.states = {};
    this.elements = {};
    this.components = {};
  };

  /**
   * Process' status is the component's status.
   */
  LockScreenBasicComponent.prototype.status =
  function() {
    return this.stream.status;
  };

  /**
   * For cache, start would receive information from the previous state
   * or parent components. The caller can give it a reformed version of
   * the 'states' inner data member it owns, rather than passing the
   * original version.
   */
  LockScreenBasicComponent.prototype.start =
  function(states = {}, components = {}, elements = {}) {
    // Query or get them from the previous state.
    this.setElements(elements);
    // Get from the previous state.
    this.states = states;
    // Only set it. Since only inherited one can know when to
    // start/stop components
    this.components = components;
    this.stream = new Stream(this.configs);
    return this.stream.start();
  };

  LockScreenBasicComponent.prototype.ready = function() {
    return this.stream.ready();
  };

  LockScreenBasicComponent.prototype.stop = function() {
    return this.stream.stop();
  };

  LockScreenBasicComponent.prototype.destroy = function() {
    return this.stream.destroy();
  };

  LockScreenBasicComponent.prototype.live = function() {
    return this.stream.until('stop');
  };

  LockScreenBasicComponent.prototype.exist = function() {
    return this.stream.until('destroy');
  };

  LockScreenBasicComponent.prototype.handleEvent = function() {};

  LockScreenBasicComponent.prototype.setElements = function(elements) {
    if (!this.elements.view) {
      throw new Error(`Can't find the view in elements`);
    }
    this.elements = elements;
    Object.keys(this.elements).forEach((key) => {
      // Replace query to DOM.
      var query = this.elements[key];
      if ('string' === typeof query) {
        this.elements[key] = this.elements.view.querySelector(query);
        if (null === this.elements[key]) {
          throw new Error(`Can't find element ${key} with ${query}`);
        }
      }
    });
  };

  /**
   * Can command all components with one method and its arguments.
   * For example, to 'start', or 'stop' them.
   */
  LockScreenBasicComponent.prototype.waitComponents = function(method, args) {
    var waitPromises =
    Object.keys(this.components).reduce((steps, name) => {
      var instance = this.components[name];
      // If the entry of the component actually contains multiple subcomponents.
      // We need to apply the method to each one and concat all the result
      // promises with our main array of applies.
      if (Array.isArray(instance)) {
        var applies = instance.map((subcomponent) => {
          return subcomponent[method].apply(subcomponent, args);
        });
        return steps.concat(applies);
      } else {
        return steps.concat([instance[method].apply(instance, args)]);
      }
    });
    return Promise.all(waitPromises);
  };

  /**
   * The default transferring method.
   * The next state should call 'this.states.previous.destroy' manually
   * to destroy current state while the next one is ready.
   *
   * The order of transferring is:
   *
   *  [current.stop] -> [next.start] -> (call)[previous.destroy]
   *
   * When a component has been stopped, it would stop to handle events.
   */
  LockScreenBasicComponent.prototype.transferTo = function(clazz) {
    var nextstate = new clazz();
    this.states.previous = this;
    return nextstate
      .next(this.stop.bind(this))
      .start(this.states, this.components, this.elements);
  };

  exports.LockScreenBasicComponent = LockScreenBasicComponent;
})(window);

