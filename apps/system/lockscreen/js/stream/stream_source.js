 'use strict';

/**
 * The input collector to queue, analyze and forward on demand with nicer
 * interface, compare to the naive 'if...else' and nested 'switch...case' hell.
 *
 * User can think this is an async 'if...else' that avoids to have multiple
 * flags to wait them get satisfied in the uncertain future.
 **/
(function(exports) {
  var StreamSource = function(properties) {
    // Listen to what changed/happend.
    this.listens = {
      events: null,
      settings: null,
      properties: null
    };

    this.resolvers = {
      events: null,
      settings: null
    };

    this.prediction = null;
    this.states = {
      predResolve: null,
      predReject: null,
      predPromise: null,
      // Whether the inputs are checked.
      inputsChecked: {
        events: false,
        settings: false
      },
    };

    this.inputs = {
      events: [],
      settings: [],
      properties: properties || {}
    };

    // Since settings observer API doesn't support pass a handler object in.
    this.handleSetting = this.handleSetting.bind(this);
  };

  /**
   * How much events should be monitored.
   * If give Set, it means the order doesn't matter.
   * If give Array, it means the order matters.
   * If give String, it measn only one event should be monitored.
   * We would go to next step when these events all come.
   */
  StreamSource.prototype.events = function(enames) {
    if ('string' === typeof enames) {
      var set = new Set();
      set.add(enames);
      enames = set;
    }
    this.listens.events = enames;
    return this;
  };

  /**
   * How much settings should be monitored.
   * If give Set, it means the order doesn't matter.
   * If give Array, it means the order matters.
   * If give String, it measn only one event should be monitored.
   * We would go to next step when these settings all got changed.
   */
  StreamSource.prototype.settings = function(skeys) {
    if ('string' === typeof skeys) {
      var set = new Set();
      set.add(skeys);
      skeys = set;
    }
    this.listens.settings = skeys;
    return this;
  };

  /**
   * Prepare to see if the specific keys is in the first monitored object.
   * Since we can't observe arbitrary objects (ES7 feature) yet, the 'pkeys'
   * can be String or Set.
   */
  StreamSource.prototype.properties = function(pkeys) {
    if ('string' === typeof pkeys) {
      var set = new Set();
      set.add(pkeys);
      pkeys = set;
    }
    this.listens.properties = pkeys;
    return this;
  };

  /**
   * After all inputs comes and pass the ordering check,
   * a final prediction would to check if the following steps can be performed.
   *
   * The 'pred' function would receive three inputs: events, settings and
   * properties. The previous two stackpiled accroding to the order they come,
   * and the last one is the properties we gave at the beginning of this stream
   * source. After we have Object.observe, we can have properties change
   * events, then its format would like the previous two's. So pred:
   *
   * pred:: ([events], [settingevents], {propertiesObject})
   *
   * And it should return as:
   *
   * { success: Bool, inputs: the inputs it received }
   */
  StreamSource.prototype.predict = function(pred) {
    this.prediction = pred;
    return this;
  };

  /**
   * Kick off it to receive inputs.
   * The handling code should be 'then' after this function.
   */
  StreamSource.prototype.ready = function() {
    this.listens.events.forEach((ename) => {
      window.addEventListener(ename, this);
    });

    this.listens.settings.forEach((sname) => {
      navigator.mozSettings.addObserver(sname, this.handleSetting);
    });

    // Get the resolver and reject
    this.predPromise = new Promise((resolve, reject) => {
      this.predResolve = resolve;
      this.predReject = reject;
    });

    // User omitted the detailed prediction.
    if (!this.prediction) {
      this.prediction = (events, settings, properties) => {
        return true;
      };
    }
    return this.predPromise;
  };

  StreamSource.prototype.close = function() {
    this.listens.events.forEach((ename) => {
      window.removeEventListener(ename, this);
    });
    this.listens.settings.forEach((sname) => {
      navigator.mozSettings.removeObserver(sname, this.handleSetting);
    });
  };

  StreamSource.prototype.handleEvent = function(evt) {
    this.handleInput(evt, 'events');
  };

  StreamSource.prototype.handleSetting = function(evt) {
    this.handleInput(evt, 'settings');
  };

  StreamSource.prototype.handleInput = function(evt, type) {
    // This is because we can't monitor properties.
    // So we can only check if the object owns them.
    var anotherInputType = (type === 'events') ? 'settings' : 'events';
    var inputs = this.inputs[type];
    inputs.push(evt);
    this.states.inputsChecked[type] =
      this.checkInputs(inputs, type);
    // If another inputs is satisfied.
    if (this.states.inputsChecked[anotherInputType]) {
      // Then do predict and kick off the promise chain.
      if (this.states.inputsChecked[type]) {
        var predictionResult =
          this.prediction(this.inputs.events,
              this.inputs.settings, this.inputs.properties);
        if (predictionResult) {
          this.predResolve(this.inputs);
        } else {
          this.predReject(predictionResult);
        }
      }
    }
  };

  /**
   * This is because we can't monitor properties.
   * So we can only check if the object owns them.
   */
  StreamSource.checkProperties = function() {
    var result = true;
    this.listens.properties.forEach((key) => {
      if ('undefined' === typeof this.inputs.properties[key] ||
          null === typeof this.inputs.properties[key]) {
        result = false;
      }
    });
    return result;
  };

  /**
   * Return true if the inputs matches the listen targets.
   * If the listen target is a Set, order doesn't matter.
   * Otherwise, same inputs with different order is not true.
   */
  StreamSource.prototype.checkInputs = function(inputs, inputtype) {
    var name;
    var collection = this.listens[inputtype];
    if (Array.isArray(collection)) {
      if (inputs.length !== collection.length) {
        return false;
      }
      return collection.reduce((result, listenname, index) => {
        if (!inputs[index]) {
          return false;
        }
        name = inputs[index].type ? inputs[index].type :
                   inputs[index].settingName;
        if (listenname !== name) {
          return false;
        } else {
          return result && true;
        }
      }, true);
    } else {
      // if collection is Set.
      return inputs.reduce((result, input) => {
        name = input.type ? input.type :
               input.settingName;
        return result && collection.has(name);
      }, true);
    }
  };

  exports.StreamSource = StreamSource;
})(window);

