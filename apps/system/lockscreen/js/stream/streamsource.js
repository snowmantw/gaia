 'use strict';
 /* global StreamSourceComparator */

/**
 * The input collector to queue, analyze and forward on demand with nicer
 * interface, compare to the naive 'if...else' and nested 'switch...case' hell.
 *
 * User can think this is an async 'if...else' that avoids to have multiple
 * flags to wait them get satisfied in the uncertain future.
 **/
(function(exports) {
  var StreamSource = function() {
    // Listen to what changed/happend.
    this.listens = {
      events: null,
      settings: null,
      properties: null
    };

    this.comparators = {
      events: [],
      settings: [],
      properties: []
    };

    this.matched = {
      events: false,
      settings: false,
      properties: false
    };

    this.resolvers = {
      events: null,
      settings: null
    };

    this.states = {
      comparingTarget: '',  // see comparing functions
      predResolve: null,
      predReject: null,
      predPromise: null
    };

    this.inputs = {
      events: [],
      settings: []
    };

    this.mixinComparingMethods();

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
    this.comparingTarget = 'event';
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
    this.comparingTarget = 'setting';
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
    this.comparingTarget = 'property';
    return this;
  };

  /**
   * After all inputs comes and pass the comparators,
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
    var result =
      pred(this.inputs.events, this.inputs.settings, this.properties);
    if (result.success) {
      this.predResolve(result);
    } else {
      this.predReject(result);
    }
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
    return this.predPromise;
  };

  StreamSource.prototype.handleEvent = function(evt) {
    this.inputs.events.push(evt);
  };

  StreamSource.prototype.handleSetting = function(evt) {
    this.inputs.settings.push(evt);
  };

  /**
   * Return true if the inputs matches the listen targets.
   * If the listen target is a Set, order doesn't matter.
   * Otherwise, same inputs with different order is not true.
   */
  StreamSource.prototype.checkInputs = function(inputs, inputtype) {
    var collection = this.listens[inputtype];
    if (Array.isArray(collection)) {
      if (inputs.length !== collection.length) {
        return false;
      }
      return collection.reduce((result, listenname, index) => {
        if (!inputs[index]) {
          return false;
        }
        var name = inputs[index].type ? inputs[index].type :
                   inputs[index].settingName;
        if (listenname !== name) {
          return false;
        } else {
          return result && true;
        }
      }, false);
    } else {
      // if collection is Set.
      return inputs.reduce((result, input) => {
        return result && collection.has(input.name);
      }, false);
    }
  };

  /**
   * When the comparing target can be one on one comparing,
   * the matching result is true.
   *
   * We mixin the comparing methods to provide a facade.
   * In fact, each comparing method corresponds one comparator,
   * with different condition and different comparing method.
   * The comparator would be invoked when we need to do the comparing,
   * and return the result.
   *
   * The basic methods are like 'is', 'not' and 'has'.
   */
  StreamSource.prototype.mixinComparingMethods = function() {
    Object
      .keys(StreamSourceComparator.prototype)
      .forEach(function(methodName) {
        this[methodName] = function(condition) {
          var comparator = new StreamSourceComparator(
              this.states.comparingTarget,
              condition,
              methodName);
          this.comparators[this.states.comparingTarget].push(comparator);
          return this;
        };
      });
  };

  exports.StreamSource = StreamSource;
})(window);

