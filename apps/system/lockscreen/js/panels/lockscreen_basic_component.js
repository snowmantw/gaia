 /* global Stream */
'use strict';

(function(exports) {
  var LockScreenBasicComponent = function() {
    this.configs = {
      events: [],
      interrupts: []
    };
    this.states = {
      next: null
    };
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

  LockScreenBasicComponent.prototype.start =
  function(elements = {}, states = {}, components = {}) {
    // Query or get them from the previous state.
    this.setElements(elements);
    // Get from the previous state.
    this.states = states;
    // Only set it. Since only inherited one can know when to
    // start/stop components
    this.components = components;
    this.configs.handler = this.handleEvent.bind(this);
    this.stream = new Stream(this.configs);

    this.stream
      .start()
      .ready();
  };

  LockScreenBasicComponent.prototype.stop = function() {
    this.stream
      .stop();
  };

  LockScreenBasicComponent.prototype.destroy = function() {
    this.process
      .destroy();
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
    var startPromises =
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
    return Promise.all(startPromises);
  };

  LockScreenBasicComponent.prototype.transferTo = function(clazz) {
    this.states.next = new clazz();
    return this.states.next
      .start(this.elements, this.states, this.components)
      .next(this.destroy.bind(this));
  };

  exports.LockScreenBasicComponent = LockScreenBasicComponent;
})(window);

