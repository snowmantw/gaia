/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */


(function(exports) {
  'use strict';

  var LockScreenSlide = {
    arrows: {
      left: null, right: null,
      // Left and right drawing origin.
      ldraw: {x: null, y: null},
      rdraw: {x: null, y: null}
    },

    width: 0, // We need dynamic length here.
    height: 80,
    center: {x: null, y: null},

    handle: {
      // Whether we need to auto extend the handle.
      autoExpand: {
        accFactorOriginal: 1.0,
        accFactor: 1.0,     // Accelerate sliding if user's finger crossed.
        accFactorMax: 1.3,
        accFactorInterval: 0.02,
        sentinelOffset: 40,  // How many pixels before reaching end.
        sentinelWidth: 0   // Max width - offset
      },
      bounceBackTime: 200,  // ms
      radius: 28, // The radius of the handle in pixel.
      lineWidth: 1.6,
      maxWidth: 0,  // We need dynamic length here.
      // If it slide across the boundary to color it.
      touchedColor: '0, 170, 204', // RGB
      // The intermediate color of touched color.
      touchedColorStop: '178, 229, 239'
    },

    state: {
      // Some elements can only be initialized after initialization...
      delayInitialized: false,
      sliding: false,
      slideReachEnd: false,
      slidingColorful: false,   // Start to color the handle.
      slidingColorGradientEnd: false // Full color the handle.
    }
  };

  /**
   * Initialize the canvas.
   *
   * @this {LockScreenSlide}
   */
  LockScreenSlide._initializeCanvas =
    (function lss_initializeCanvas() {
      var center = this.center;
      this.arrows.left = new Image();
      this.arrows.right = new Image();
      var larrow = this.arrows.left;
      var rarrow = this.arrows.right;
      larrow.src = '/style/lockscreen/images/larrow.png';
      rarrow.src = '/style/lockscreen/images/rarrow.png';

      // XXX: Bet it would be OK while user start to drag the slide.
      larrow.onload = (function() {
        this.arrows.ldraw.x =
              center.x - (this.arrows.left.width << 1);
        this.arrows.ldraw.y =
              center.y - (this.arrows.left.height >> 1);
        var ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.arrows.left,
            this.arrows.ldraw.x,
            this.arrows.ldraw.y);
      }).bind(this);
      rarrow.onload = (function() {
        this.arrows.rdraw.x =
              center.x + (this.arrows.right.width);
        this.arrows.rdraw.y =
              center.y - (this.arrows.right.height >> 1);
        var ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.arrows.right,
            this.arrows.rdraw.x,
            this.arrows.rdraw.y);
      }).bind(this);

      this.width = this._dpx(window.innerWidth);
      this.height = this._dpx(80);

      this.canvas.width = this.width;
      this.canvas.height = this.height;

      // Shrink the canvas back to keep the density.
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = 80 + 'px';

      this.center.x =
        this.canvas.offsetLeft + this.canvas.width >> 1;
      this.center.y =
        this.canvas.offsetHeight + this.canvas.height >> 1;

      this.handle.radius =
        this._dpx(this.handle.radius);

      this.handle.lineWidth =
        this._dpx(this.handle.lineWidth);

      this.handle.autoExpand.sentinelOffset =
        this._dpx(this.handle.autoExpand.sentinelOffset);

      this.canvas.getContext('2d').save();

      // Need to move the context toward right, to compensate the circle which
      // would be draw at the center, and make it align too left.
      this.canvas.getContext('2d', this.handle.radius << 1, 0);

      // Draw the handle.
      this._resetHandle();

      // We don't reset the arrows because it need to be draw while image
      // got loaded, which is a asynchronous process.
    }).bind(LockScreenSlide);

  /**
   * Finalize the canvas: restore its default state.
   *
   * @this {LockScreenSlide}
   */
  LockScreenSlide._finalizeCanvas =
    (function lss_finalizeCanvas() {
      this.state.slidingColorful = false;
      this.state.slidingColorGradientEnd = false,
      this._clearCanvas();
    }).bind(LockScreenSlide);

  /**
   * Records how long the user's finger dragged.
   *
   * @param {event} |evt| The touch event.
   * @this {LockScreenSlide}
   */
  LockScreenSlide._onSliding =
    (function lss_onSliding(evt) {
      var tx = this._dpx(evt.touches[0].pageX);
      var mtx = this._mapCoord(tx, 0)[0];
      var isLeft = tx - this.center.x < 0;
      this._clearCanvas();

      var expandSentinelR = this.center.x +
        this.handle.autoExpand.sentinelWidth;

      var expandSentinelL = this.center.x -
        this.handle.autoExpand.sentinelWidth;

      var center = this.center;
      var radius = this.handle.radius;
      var ctx = this.canvas.getContext('2d');

      if (tx > expandSentinelR || tx < expandSentinelL) {
          var slow = false;
          if (isLeft) {
            slow = this._touch.deltaX > 0;
          } else {
            slow = this._touch.deltaX < 0;
          }
          mtx = this._accelerateSlide(tx, tx < expandSentinelL, slow);
      } else {
        this.handle.autoExpand.accFactor =
          this.handle.autoExpand.accFactorOriginal;
      }

      // Slide must overlay on arrows.
      this._drawArrowsTo(mtx);
      this._drawSlideTo(mtx);
    }).bind(LockScreenSlide);

  /**
   * Accelerate the slide when the finger is near the end.
   *
   * @param {number} |tx|
   * @param {boolean} |isLeft|
   * @param {boolean} |inverse| (Optional) true if you want to slow rather
   *                            than accelerate it.
   * @return {number}
   * @this {LockScreenSlide}
   */
  LockScreenSlide._accelerateSlide =
    (function lss_accelerateSlide(tx, isLeft, inverse) {
      var accFactor = this.handle.autoExpand.accFactor;
      var accFactorMax = this.handle.autoExpand.accFactorMax;
      var accFactorOriginal =
        this.handle.autoExpand.accFactorOriginal;
      var interval = this.handle.autoExpand.accFactorInterval;
      var adjustedAccFactor = isLeft ? 1 / accFactor : accFactor;
      if (!inverse && accFactor + interval < accFactorMax)
        accFactor += interval;
      if (inverse && accFactor - interval > accFactorOriginal)
        accFactor -= interval;
      this.handle.autoExpand.accFactor = accFactor;
      return tx * adjustedAccFactor;
    }).bind(LockScreenSlide);

  /**
   * Clear the canvas.
   *
   * @this {LockScreenSlide}
   */
  LockScreenSlide._clearCanvas =
    (function lss_clearCanvas() {
      var canvas = this.canvas;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }).bind(LockScreenSlide);

  /**
   * Map absolution X and Y to canvas' X and Y.
   * Note this should only be used when user want to draw something
   * follow the user's input. If the canvans need adjust its position,
   * the absolute coordinates should be used.
   *
   * @param {number} |x|
   * @param {number} |y|
   * @return {[number]} Array of single pair of X and Y
   * @this {LockScreenSlide}
   */
  LockScreenSlide._mapCoord =
    (function lss_mapCoord(x, y) {
      var cw = this.canvas.clientWidth;
      var ch = this.canvas.clientHeight;

      return [cw * x / window.innerWidth,
              ch * y / window.innerHeight];
    }).bind(LockScreenSlide);

  /**
   * Extend the handle to one end of the slide.
   * This would help user to be apt to to drag to one of the ends.
   * The |tx| is necessary to detect which side should be the end.
   *
   * @param {number} |tx| The absolute horizontal position of the finger.
   * @this {LockScreenSlide}
   */
  LockScreenSlide._extendHandle =
    (function lss_extendHandle(tx) {
      var canvas = this.canvas;
      var ctx = canvas.getContext('2d');
      var center = {'x': canvas.width >> 1,
                    'y': canvas.height >> 1};
      // In fact, we don't care Y, so set it as 0.
      var offset = this._mapCoord(tx, 0)[0];
    }).bind(LockScreenSlide);

  /**
   * Bounce the handle back from the |tx|.
   *
   * @param {number} |tx| The absolute horizontal position of the finger.
   * @param {Function()} |cb| (Optional) Callback. Will be executed after
   * the animation ended.
   *
   * @this {LockScreenSlide}
   */
  LockScreenSlide._bounceBack =
    (function lss_bounceBack(tx, cb) {
      var canvas = this.canvas;
      var ctx = canvas.getContext('2d');

      // Absolute coordinate of the canvas center.
      var duration = this.handle.bounceBackTime;
      var center = this.center;
      var nextTx = tx;
      var tsBegin = null;
      var mspf = 0; // ms per frame.
      var interval = 1; // How many pixels per frame should draw.
      // Draw from the circle center to one end on the circle itself.
      var isLeft = tx - center.x < 0;

      var drawIt = (function _drawIt(ts) {
        if (null === tsBegin)
          tsBegin = ts;

        if (ts - tsBegin < duration) {
          if (0 === mspf)
            mspf = ts - tsBegin;  // Not an accurate way to determine mspf.
          interval = Math.abs(center.x - tx) / (duration / mspf);
          nextTx = isLeft ? nextTx + interval : nextTx - interval;
          if ((isLeft && nextTx < center.x) ||
              (!isLeft && nextTx >= center.x)) {
            this._clearCanvas();
            this._drawArrowsTo(nextTx);
            this._drawSlideTo(nextTx);
          }
          requestAnimationFrame(drawIt);
        } else {
          // Compensation from the current position to the center of the slide.
          this._clearCanvas();
          this._drawArrowsTo(center.x);
          this._drawSlideTo(center.x);
          if (cb)
            cb();
        }
      }).bind(this);
      requestAnimationFrame(drawIt);
    }).bind(LockScreenSlide);

  /**
   * Draw the handle with its initial state (a transparent circle).
   *
   * @this {LockScreenSlide}
   */
  LockScreenSlilde._resetHandle =
    (function lss_resetHandle() {
      this.state.slidingColorful = false;
      this.state.slidingColorGradientEnd = false;
      var canvas = this.canvas;
      var centerx = this.center.x;
      this._drawSlideTo(centerx);
    }).bind(LockScreenSlide);

  /**
   * Draw the two arrows on the slide.
   *
   * @param {number} |tx| The absolute horizontal position of the target.
   * @this {LockScreenSlide}
   */
  LockScreenSlide._drawArrowsTo =
    (function lss_drawArrows(tx) {
      var canvas = this.canvas;
      var ctx = canvas.getContext('2d');
      var radius = this.handle.radius;
      var center = this.center;
      var offset = tx - center.x;
      var isLeft = offset < 0;

      if (this.handle.maxWidth < Math.abs(offset)) {
        this.state.slideReachEnd = true;
        return;
      }
      this.state.slideReachEnd = false;

      // The Y of arrows: need to put it from center to sink half of the arrow.
      if (isLeft) {
        // XXX:<<1: OK but don't know why!
        ctx.drawImage(this.arrows.left,
          tx - (this.arrows.left.width << 1),
          this.arrows.ldraw.y);
        ctx.drawImage(this.arrows.right,
          this.arrows.rdraw.x,
          this.arrows.ldraw.y);

      } else {
        ctx.drawImage(this.arrows.right,
          tx + this.arrows.right.width,
          this.arrows.rdraw.y);
        ctx.drawImage(this.arrows.left,
          this.arrows.ldraw.x,
          this.arrows.ldraw.y);
      }
    }).bind(LockScreenSlide);

  /**
   * Restore the arrow to the original position.
   * TODO
   *
   * @this {LockScreenSlide}
   */
  LockScreenSlide._resetArrows =
    (function lss_restoreArrows() {
      var canvas = this.canvas;
      var ctx = canvas.getContext('2d');
      var center = this.center;
      ctx.drawImage(this.arrows.left,
          this.arrows.ldraw.x,
          this.arrows.ldraw.y);
      ctx.drawImage(this.arrows.right,
          this.arrows.rdraw.x,
          this.arrows.rdraw.y);
    }).bind(LockScreenSlide);

  /**
   * Extend the slide from its center to the specific position.
   *
   * @param {number} |tx| The absolute horizontal position of the target.
   * @this {LockScreenSlide}
   */
  LockScreenSlide._drawSlideTo =
    (function lss_drawSlideTo(tx) {
      var canvas = this.canvas;
      var ctx = canvas.getContext('2d');
      var maxWidth = this.handle.maxWidth;

      var offset = tx;
      var radius = this.handle.radius;
      var center = this.center;

      // The width and height of the rectangle.
      var rw = offset - center.x;
      var urw = Math.abs(rw);

      if (this.handle.maxWidth < urw) {
        offset = rw > 0 ? center.x + maxWidth : center.x - maxWidth;
      }

      // 1.5 ~ 0.5 is the right part of a circle.
      var startAngle = 1.5 * Math.PI;
      var endAngle = 0.5 * Math.PI;
      var fillAlpha = 0.0;
      var strokeStyle = 'white';
      const GRADIENT_LENGTH = 50;

      // If user move over 15px, fill the slide.
      if (urw > 15 && true !== this.state.slidingColorful) {
        // The color should be gradient in this length, from the origin.
        // It would decide how long the color turning to the touched color.

        fillAlpha = (urw - 15) / GRADIENT_LENGTH;
        if (fillAlpha > 1.0) {
          fillAlpha = 1.0;
          this.state.slidingColorGradientEnd = true;
        }

        // The border must disappear during the sliding,
        // so it's alpha would decrease to zero.
        var borderAlpha = 1.0 - fillAlpha;

        // From white to covered blue.
        strokeStyle = 'rgba(' + this.handle.touchedColorStop +
          ',' + borderAlpha + ')';

        // It's colorful now.
        this.state.slidingColorful = true;
      } else {

        // Has pass the stage of gradient color.
        if (true === this.state.slidingColorGradientEnd) {
          fillAlpha = 1.0;
          var color = this.handle.touchedColor;
        } else if (0 === urw) {  // Draw as the initial circle.
          fillAlpha = 0.0;
          var color = '255,255,255';
        } else {
          fillAlpha = (urw - 15) / GRADIENT_LENGTH;
          if (fillAlpha > 1.0) {
            fillAlpha = 1.0;
            this.state.slidingColorGradientEnd = true;
          }
          var color = this.handle.touchedColorStop;
        }
        var borderAlpha = 1.0 - fillAlpha;
        strokeStyle = 'rgba(' + color + ',' + borderAlpha + ')';
      }
      ctx.fillStyle = 'rgba(' + this.handle.touchedColor +
        ',' + fillAlpha + ')';
      ctx.lineWidth = this.handle.lineWidth;
      ctx.strokeStyle = strokeStyle;

      var counterclock = false;
      if (offset - center.x < 0) {
        counterclock = true;
      }

      // Start to draw it.
      // Can't use functions like rect or these individual parts
      // would show its borders.
      ctx.beginPath();

      ctx.arc(center.x, center.y,
          radius, endAngle, startAngle, counterclock);
      ctx.lineTo(center.x, center.y - radius);
      ctx.lineTo(center.x + (offset - center.x), center.y - radius);
      ctx.arc(offset, center.y, radius, startAngle, endAngle, counterclock);
      ctx.lineTo(center.x, center.y + radius);

      // Note: When setting both the fill and stroke for a shape,
      // make sure that you use fill() before stroke().
      // Otherwise, the fill will overlap half of the stroke.
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }).bind(LockScreenSlide);

  /**
   * When user released the finger, bounce it back.
   *
   * @param {event} |evt| The touch event.
   * @this {LockScreenSlide}
   */
  LockScreenSlide._onSlideEnd =
    (function lss_onSlideEnd(evt) {
      var isLeft = this._touch.pageX - this.center.x < 0;
      var bounceEnd = (function _bounceEnd() {
        this._clearCanvas();
        this._resetArrows();
        this._resetHandle();
      }).bind(this);

      if (false === this.state.slideReachEnd) {
        this._bounceBack(this._touch.pageX, bounceEnd);
      } else {
        this.handleIconClick(isLeft ?
          this.leftIcon : this.rightIcon);

        // Restore it only after screen changed.
        var appLaunchDelay = 400;
        setTimeout(bounceEnd, appLaunchDelay);
      }

      this._darkIcons();
      this._restoreSlide();
    }).bind(LockScreenSlide);

  /**
   * Restore the left and right slide.
   *
   * @param {boolean} |instant| (Optional) true if restore it immediately
   * @this {LockScreenSlide}
   */
  LockScreenSlide._restoreSlide =
    (function(instant) {
      var bounceBackSec = '0.0s';
      if (!instant) {
        // The magic number: it's subtle to keep the arrows sync with the slide.
        bounceBackSec = (0.07 + this.handle.bounceBackTime / 1000)
          .toString() + 's';
      }

      var tsEndLeft = (function(evt) {
        this.slideLeft.removeEventListener('transition', tsEndLeft);

        // Clear them all because we don't want to calc if
        // the affecting slide is left or right here.
        this.slideLeft.style.transition = '';
        this.slideRight.style.transition = '';
      }).bind(this);

      var tsEndRight = (function(evt) {
        this.slideRight.removeEventListener('transition', tsEndRight);
        this.slideRight.style.transition = '';
        this.slideLeft.style.transition = '';
      }).bind(this);

      this.slideLeft.style.transition = 'transform ease ' +
        bounceBackSec + ' 0s';
      this.slideRight.style.transition = 'transform ease ' +
        bounceBackSec + ' 0s';

      this.slideLeft.addEventListener('transitionend', tsEndLeft);
      this.slideRight.addEventListener('transitionend', tsEndRight);

      // Run it.
      this.slideLeft.style.transform = '';
      this.slideRight.style.transform = '';

      this.state.sliding = false;
      this.state.slideReachEnd = false;
    }).bind(LockScreenSlide);

  /**
   * Return the mapping pixels according to the device pixel ratio.
   * This may need to be put int the shared/js.
   *
   * @param {number} |px|
   * @return {number}
   * @this {LockScreenSlide}
   */
  LockScreenSlide._dpx =
    (function lss_dpx(px) {
      return px * window.devicePixelRatio;
    }).bind(LockScreenSlide);

  exports.LockScreenSlide = LockScreenSlide;
  LockScreenSlide._initializeCanvas();

})(window);
