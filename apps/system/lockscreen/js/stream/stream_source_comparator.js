 'use strict';

/**
 * It provides a interface to compare inputs with different methods.
 **/
(function(exports) {

  /**
   * type: 'event', 'setting' or 'property'.
   * condition: any variable
   * methodName: the comparing method; 'is', 'not' and others.
   */
  var StreamSourceComparator =
  function(type, condition, methodName) {
    this.type = type;
    // Condition can be POD or function.
    // If it's function then would call it with the inputs,
    // no matter we choose which method.
    this.condition = condition;
    this.method = this[methodName].bind(this);
    this.result = false;
  };

  /**
   * Assume we can do shallw equal to it.
   */
  StreamSourceComparator.prototype.is = function(inputs) {

  };

  /**
   * Do compare.
   */
  StreamSourceComparator.prototype.compare = function(inputs) {
    if ('function' === typeof this.condition) {
      return this.condition(inputs);
    }
    return this.method(inputs);
  };
  exports.StreamSourceComparator = StreamSourceComparator;
})(window);

