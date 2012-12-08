/*! wordcloud.js - Tag cloud/Wordle presentation on HTML5 canvas element.

  Author: timdream <http://timc.idv.tw/>

 Usage:
  WordCloud(canvas, settings);
  - draw word cloud on canvas element.
  WordCloud.isSupported
  - return true if the browser checks out
  WordCloud.miniumFontSize
  - return minium font size enforced by the browser

 available settings
  fontFamily: font list for text.
  gridSize: 8,
  ellipticity: ellipticity of the circle formed by word.
  center: [x,y] of the center of the circle. Set false to use center of canvas.
  drawMask: true to debug mask to show area covered by word.
  maskColor: color of the debug mask.
  maskGridWidth: width of the mask grid border.
  wordColor: color for word, could be one of the following:
    [CSS color value],
    'random-dark', (default)
    'random-light',
    [function(word, weight, fontSize, radius, theta)]
  backgroundColor: background to cover entire canvas or the detect against.
  wait: wait N ms before drawing next word.
  abortThreshold: abort and execute about() when the browser took more than N ms
    to draw a word. 0 to disable.
  abort: abort handler.
  weightFactor:
  minSize: minium font size in pixel to draw
    (default: WordCloud.miniumFontSize / 2, larger than that is still look good
     using bilinear sampling in browser)
  wordList: 2d array in for word list like [['w1', 12], ['w2', 6]]
  clearCanvas: clear canvas before drawing. Faster than running detection on
    what's already on it.
  fillBox: true will mark the entire box containing the word as filled -
    no subsequent smaller words can be fit in the gap.
  shape: keyword or a function that represents polar equation r = fn(theta),
    available keywords:
    'circle', (default)
    'cardioid', (apple or heart shape curve, the most known polar equation)
    'diamond', (alias: 'square'),
    'triangle-forward',
    'triangle', (alias: 'triangle-upright')
    'pentagon',
    'star'
*/

'use strict';

// Based on http://jsfromhell.com/array/shuffle
Array.prototype.shuffle = function shuffle() { //v1.0
  for (var j, x, i = this.length; i;
    j = Math.floor(Math.random() * i),
    x = this[--i], this[i] = this[j],
    this[j] = x);
  return this;
};

// setImmediate
if (!window.setImmediate) {
  window.setImmediate = (function setupSetImmediate() {
    return window.msSetImmediate ||
    window.webkitSetImmediate ||
    window.mozSetImmediate ||
    window.oSetImmediate ||
    (function setupSetZeroTimeout() {
      if (!window.postMessage || !window.addEventListener) {
        return null;
      }

      var callbacks = [undefined];
      var message = 'zero-timeout-message';

      // Like setTimeout, but only takes a function argument.  There's
      // no time argument (always zero) and no arguments (you have to
      // use a closure).
      var setZeroTimeout = function setZeroTimeout(callback) {
        var id = callbacks.length;
        callbacks.push(callback);
        window.postMessage(message + id.toString(36), '*');

        return id;
      };

      window.addEventListener('message', function setZeroTimeoutMessage(evt) {
        // Skipping checking event source, retarded IE confused this window
        // object with another in the presence of iframe
        if (typeof evt.data !== 'string' ||
            evt.data.substr(0, message.length) !== message/* ||
            evt.source !== window */)
          return;

        evt.stopImmediatePropagation();

        var id = parseInt(evt.data.substr(message.length), 36);
        if (!callbacks[id])
          return;

        callbacks[id]();
        callbacks[id] = undefined;
      }, true);

      /* specify clearImmediate() here since we need the scope */
      window.clearImmediate = function clearZeroTimeout(id) {
        if (!callbacks[id])
          return;

        callbacks[id] = undefined;
      };

      return setZeroTimeout;
    })() ||
    // fallback
    function setImmediateFallback(fn) {
      window.setTimeout(fn, 0);
    }
  })();
}

if (!window.clearImmediate) {
  window.clearImmediate = (function setupClearImmediate() {
    return window.msClearImmediate ||
    window.webkitClearImmediate ||
    window.mozClearImmediate ||
    window.oClearImmediate ||
    // "clearZeroTimeout" is implement on the previous block ||
    // fallback
    function clearImmediateFallback(timer) {
      window.clearTimeout(timer);
    }
  })();
}

(function(global) {

  // Check if WordCloud can run on this browser
  var isSupported = (function isSupported() {
    var canvas = document.createElement('canvas');
    if (!canvas || !canvas.getContext)
      return false;

    var ctx = canvas.getContext('2d');
    if (!ctx.getImageData)
      return false;
    if (!ctx.fillText)
      return false;

    if (!Array.prototype.forEach)
      return false;
    if (!Array.prototype.some)
      return false;
    if (!Array.prototype.push)
      return false;

    return true;
  }());

  // Find out if the browser impose minium font size by
  // drawing small texts on a canvas and measure it's width.
  var miniumFontSize = (function getMiniumFontSize() {
    if (!isSupported)
      return;

    var ctx = document.createElement('canvas').getContext('2d');

    // start from 20
    var size = 20;

    // two sizes to measure
    var hanWidth, mWidth;

    while (size) {
      ctx.font = size.toString(10) + 'px sans-serif';
      if ((ctx.measureText('\uFF37').width === hanWidth) &&
          (ctx.measureText('m').width) === mWidth)
        return (size + 1);

      hanWidth = ctx.measureText('\uFF37').width;
      mWidth = ctx.measureText('m').width;

      size--;
    }

    return 0;
  })();

  var WordCloud = function WordCloud(canvas, options) {
    if (!isSupported)
      return;

    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }

    /* Default values to be overwritten by options object */
    var settings = {
      fontFamily: '"Trebuchet MS", "Heiti TC", "微軟正黑體", ' +
                  '"Arial Unicode MS", "Droid Fallback Sans", sans-serif',
      gridSize: 8,
      ellipticity: 0.65,
      center: false,
      drawMask: false,
      maskColor: 'rgba(255,0,0,0.3)',
      maskGridWidth: 0.3,
      wordColor: 'random-dark',
      backgroundColor: '#fff',  // opaque white = rgba(255, 255, 255, 1)
      wait: 0,
      abortThreshold: 0, // disabled
      abort: function noop() {},
      weightFactor: 1,
      minSize: miniumFontSize / 2, // 0 to disable
      wordList: [],
      rotateRatio: 0.1,
      clearCanvas: true,
      fillBox: false,
      shape: 'circle'
    };

    if (options) {
      for (var key in options) {
        if (key in settings)
          settings[key] = options[key];
      }
    }

    /* Convert weightFactor into a function */
    if (typeof settings.weightFactor !== 'function') {
      var factor = settings.weightFactor;
      settings.weightFactor = function weightFactor(pt) {
        return pt * factor; //in px
      };
    }

    /* Convert shape into a function */
    if (typeof settings.shape !== 'function') {
      switch (settings.shape) {
        case 'circle':
        default:
          // 'circle' is the default and a shortcut in the code loop.
          settings.shape = 'circle';
          break;

        case 'cardioid':
          settings.shape = function shapeCardioid(theta) {
            return 1 - Math.sin(theta);
          };
          break;

        /*

        To work out an X-gon, one has to calculate "m",
        where 1/(cos(2*PI/X)+m*sin(2*PI/X)) = 1/(cos(0)+m*sin(0))
        http://www.wolframalpha.com/input/?i=1%2F%28cos%282*PI%2FX%29%2Bm*sin%28
        2*PI%2FX%29%29+%3D+1%2F%28cos%280%29%2Bm*sin%280%29%29

        Copy the solution into polar equation r = 1/(cos(t') + m*sin(t'))
        where t' equals to mod(t, 2PI/X);

        */

        case 'diamond':
        case 'square':
          // http://www.wolframalpha.com/input/?i=plot+r+%3D+1%2F%28cos%28mod+
          // %28t%2C+PI%2F2%29%29%2Bsin%28mod+%28t%2C+PI%2F2%29%29%29%2C+t+%3D
          // +0+..+2*PI
          settings.shape = function shapeSquare(theta) {
            var thetaPrime = theta % (2 * Math.PI / 4);
            return 1 / (Math.cos(thetaPrime) + Math.sin(thetaPrime));
          };
          break;

        case 'triangle-forward':
          // http://www.wolframalpha.com/input/?i=plot+r+%3D+1%2F%28cos%28mod+
          // %28t%2C+2*PI%2F3%29%29%2Bsqrt%283%29sin%28mod+%28t%2C+2*PI%2F3%29
          // %29%29%2C+t+%3D+0+..+2*PI
          settings.shape = function shapeTriangle(theta) {
            var thetaPrime = theta % (2 * Math.PI / 3);
            return 1 / (Math.cos(thetaPrime) +
                        Math.sqrt(3) * Math.sin(thetaPrime));
          };
          break;

        case 'triangle':
        case 'triangle-upright':
          settings.shape = function shapeTriangle(theta) {
            var thetaPrime = (theta + Math.PI * 3 / 2) % (2 * Math.PI / 3);
            return 1 / (Math.cos(thetaPrime) +
                        Math.sqrt(3) * Math.sin(thetaPrime));
          };
          break;

        case 'pentagon':
          settings.shape = function shapePentagon(theta) {
            var thetaPrime = (theta + 0.955) % (2 * Math.PI / 5);
            return 1 / (Math.cos(thetaPrime) +
                        0.726543 * Math.sin(thetaPrime));
          };
          break;

        case 'star':
          settings.shape = function shapeStar(theta) {
            var thetaPrime = (theta + 0.955) % (2 * Math.PI / 10);
            if ((theta + 0.955) % (2 * Math.PI / 5) - (2 * Math.PI / 10) >= 0) {
              return 1 / (Math.cos((2 * Math.PI / 10) - thetaPrime) +
                          3.07768 * Math.sin((2 * Math.PI / 10) - thetaPrime));
            } else {
              return 1 / (Math.cos(thetaPrime) +
                          3.07768 * Math.sin(thetaPrime));
            }
          };
          break;
      }
    }

    /* Make sure gridSize is not smaller than 4px */
    settings.gridSize = Math.max(settings.gridSize, 4);

    /* shorthand */
    var g = settings.gridSize;

    /* information/object available to all functions, set when start() */
    var ctx, // canvas context
      grid, // 2d array containing filling information
      ngx, ngy, // width and height of the grid
      center, // position of the center of the cloud
      maxRadius;

    /* information needed for determining empty status of a pixel */
    var diffChannel, bgPixel;

    /* timestamp for measuring each putWord() action */
    var escapeTime;

    /* function for getting the color of the text */
    var getTextColor;
    switch (settings.wordColor) {
      case 'random-dark':
        getTextColor = function getRandomDarkColor() {
          return 'rgb(' +
            Math.floor(Math.random() * 128).toString(10) + ',' +
            Math.floor(Math.random() * 128).toString(10) + ',' +
            Math.floor(Math.random() * 128).toString(10) + ')';
        };
        break;

      case 'random-light':
        getTextColor = function getRandomLightColor() {
          return 'rgb(' +
            Math.floor(Math.random() * 128 + 128).toString(10) + ',' +
            Math.floor(Math.random() * 128 + 128).toString(10) + ',' +
            Math.floor(Math.random() * 128 + 128).toString(10) + ')';
        };
        break;

      default:
        if (typeof settings.wordColor === 'function') {
          getTextColor = settings.wordColor;
        }
        break;
    }

    /* Get points on the grid for a given radius away from the center */
    var pointsAtRadius = [];
    var getPointsAtRadius = function getPointsAtRadius(radius) {
      if (pointsAtRadius[radius])
        return pointsAtRadius[radius];

      // Look for these number of points on each radius
      var T = radius * 8;

      // Getting all the points at this radius
      var t = T;
      var points = [];

      if (radius === 0) {
        points.push([center[0], center[1], 0]);
      }

      while (t--) {
        // distort the radius to put the cloud in shape
        var rx = 1;
        if (settings.shape !== 'circle')
          rx = settings.shape(t / T * 2 * Math.PI); // 0 to 1

        // Push [x, y, t]; t is used solely for getTextColor()
        points.push([
          center[0] + radius * rx * Math.cos(-t / T * 2 * Math.PI),
          center[1] + radius * rx * Math.sin(-t / T * 2 * Math.PI) *
            settings.ellipticity,
          t / T * 2 * Math.PI]);
      }

      pointsAtRadius[radius] = points;
      return points;
    }

    /* Return true if we had spent too much time */
    var exceedTime = function exceedTime() {
      return ((settings.abortThreshold > 0) &&
        ((new Date()).getTime() - escapeTime > settings.abortThreshold));
    };

    /* With given data and dimension information, return the value of
       of the channel of the pixel */
    var getChannelData = function getChannelData(data, x, y, w, h, c) {
      return data[(y * w + x) * 4 + c];
    };


    /* See if the given space in the grid is empty or not */
    var isGridEmpty = function isGridEmpty(imgData,
                                           x, y, w, h, skipDiffChannel) {
      var i = g, j;
      if (!isNaN(diffChannel) && !skipDiffChannel) {
        while (i--) {
          j = g;
          while (j--) {
            if (getChannelData(imgData.data,
                               x + i, y + j, w, h, diffChannel) !==
                bgPixel[diffChannel])
              return false;
          }
        }
      } else {
        var k;
        while (i--) {
          j = g;
          while (j--) {
            k = 4;
            while (k--) {
              if (getChannelData(imgData.data, x + i, y + j, w, h, k) !==
                  bgPixel[k])
                return false;
            }
          }
        }
      }
      return true;
    };

    /* Mark the given space in the grid filled,
       and draw the mask on the canvas if necessary */
    var fillGrid = function fillGrid(gx, gy, gw, gh) {
      var x = gw, y;
      if (settings.drawMask)
        ctx.fillStyle = settings.maskColor;

      while (x--) {
        y = gh;
        while (y--) {
          grid[gx + x][gy + y] = false;
          if (settings.drawMask) {
            ctx.fillRect((gx + x) * g,
                         (gy + y) * g,
                         g - settings.maskGridWidth,
                         g - settings.maskGridWidth);
          }
        }
      }
    };

    /* Update the filling information of the given space by read out the pixels
       and compare it's values. Draw the mask on the canvas if necessary. */
    var updateGrid = function updateGrid(gx, gy, gw, gh, skipDiffChannel) {
      var x = gw, y;
      if (settings.drawMask) ctx.fillStyle = settings.maskColor;
      /*
      getImageData() is a super expensive function
      (internally, extracting pixels of _entire canvas_ all the way from GPU),
      call once here instead of every time in isGridEmpty
      */
      var imgData = ctx.getImageData(gx * g, gy * g, gw * g, gh * g);
      out: while (x--) {
        y = gh;
        while (y--) {
          if (!isGridEmpty(imgData, x * g, y * g, gw * g, gh * g,
                           skipDiffChannel)) {
            grid[gx + x][gy + y] = false;
            if (settings.drawMask) {
              ctx.fillRect((gx + x) * g,
                           (gy + y) * g,
                           g - settings.maskGridWidth,
                           g - settings.maskGridWidth);
            }
          }
          if (exceedTime())
            break out;
        }
      }
    };


    /* putWord() processes each item on the wordList,
       calculate it's size and determine it's position, and actually
       put it on the canvas. */
    var putWord = function putWord(word, weight) {
      // This decides whether we should rotate the word or not
      var rotate = (Math.random() < settings.rotateRatio);

      // calculate the acutal font size
      // fontSize === 0 means weightFactor wants the text skipped,
      // and size < minSize means we cannot draw the text.
      var fontSize = settings.weightFactor(weight);
      if (fontSize <= settings.minSize)
        return false;

      // Scale factor here is to make sure fillText is not limited by
      // the minium font size set by browser.
      // It will always be 1 or 2n.
      var mu = 1;
      if (fontSize < miniumFontSize) {
        mu = (function calculateScaleFactor() {
          var mu = 2;
          while (mu * fontSize < miniumFontSize) {
            // TBD: should force the browser to do
            // resampling 0.5x each time instead of this
            mu += 2;
          }
          return mu;
        })();
      }

      // Determine size of the word on canvas
      ctx.font = (fontSize * mu).toString(10) + 'px ' + settings.fontFamily;
      var gw, gh, w, h;
      if (rotate) {
        h = ctx.measureText(word).width / mu;
        w = Math.max(fontSize * mu,
                     ctx.measureText('m').width,
                     ctx.measureText('\uFF37').width) / mu;

        if (/[Jgpqy]/.test(word))
          w *= 3 / 2;
        w += Math.floor(fontSize / 6);
        h += Math.floor(fontSize / 6);
      } else {
        w = ctx.measureText(word).width / mu;
        h = Math.max(fontSize * mu,
                     ctx.measureText('m').width,
                     ctx.measureText('\uFF37').width) / mu;

        if (/[Jgpqy]/.test(word))
          h *= 3 / 2;
        h += Math.floor(fontSize / 6);
        w += Math.floor(fontSize / 6);
      }

      w = Math.ceil(w);
      h = Math.ceil(h);
      gw = Math.ceil(w / g),
      gh = Math.ceil(h / g);

      // Determine the position to put the text by
      // start looking for the nearest points
      var r = maxRadius + 1;

      while (r--) {
        var points = getPointsAtRadius(maxRadius - r);

        // Shuffle the points and try to fit the words
        // array.some() will stop and return true
        // when putWordAtPoint() returns true.
        // If all the points returns false, array.some() returns false.
        var drawn = points.shuffle().some(function putWordAtPoint(gxy) {
          var gx = Math.floor(gxy[0] - gw / 2);
          var gy = Math.floor(gxy[1] - gh / 2);
          if (!canFitText(gx, gy, gw, gh))
            return false;

          if (mu !== 1 || rotate) {
            // Put the text on another canvas and fit/rotate it
            // and stick it onto the real canvas.
            var fc = document.createElement('canvas');
            fc.setAttribute('width', w * mu);
            fc.setAttribute('height', h * mu);
            var fctx = fc.getContext('2d');
            fctx.fillStyle = settings.backgroundColor;
            fctx.fillRect(0, 0, w * mu, h * mu);
            if (getTextColor) {
              fctx.fillStyle = getTextColor(word, weight,
                                            fontSize, maxRadius - r, gxy[2]);
            } else {
              fctx.fillStyle = settings.wordColor;
            }
            fctx.font = (fontSize * mu).toString(10) + 'px ' +
                        settings.fontFamily;
            fctx.textBaseline = 'top';
            if (rotate) {
              fctx.translate(0, h * mu);
              fctx.rotate(-Math.PI / 2);
            }
            fctx.fillText(word, Math.floor(fontSize * mu / 6), 0);
            ctx.clearRect(Math.floor(gx * g + (gw * g - w) / 2),
                          Math.floor(gy * g + (gh * g - h) / 2), w, h);
            ctx.drawImage(fc,
                          Math.floor(gx * g + (gw * g - w) / 2),
                          Math.floor(gy * g + (gh * g - h) / 2), w, h);
          } else {
            ctx.font = fontSize.toString(10) + 'px ' + settings.fontFamily;
            if (getTextColor) {
              ctx.fillStyle = getTextColor(word, weight,
                                           fontSize, maxRadius - r, gxy[2]);
            } else {
              ctx.fillStyle = settings.wordColor;
            }
            ctx.fillText(word, gx * g + (gw * g - w) / 2,
                         gy * g + (gh * g - h) / 2);
          }
          if (settings.fillBox) {
            fillGrid(gx, gy, gw, gh);
          } else {
            updateGrid(gx, gy, gw, gh);
          }
          return true;
        });

        if (drawn) {
          // leave putWord() and return true
          return true;
        }
      }
      // we tried all distances but text won't fit, return false
      return false;
    };

    /* Determine if there is room available in the given dimension */
    var canFitText = function canFitText(gx, gy, gw, gh) {
      if (gx < 0 || gy < 0 || gx + gw > ngx || gy + gh > ngy)
        return false;

      var x = gw, y;
      while (x--) {
        y = gh;
        while (y--) {
          if (!grid[gx + x][gy + y])
            return false;
        }
      }
      return true;
    };

    /* Send DOM event */
    var sendEvent = function sendEvent(el, type) {
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(type, true, false, {});
      el.dispatchEvent(evt);
    };

    /* Start drawing on a canvas */
    var start = function start(canvas) {
      ngx = Math.floor(canvas.width / g);
      ngy = Math.floor(canvas.height / g);
      ctx = canvas.getContext('2d');
      grid = [];

      // Determine the center of the word cloud
      center = (settings.center) ?
          [settings.center[0]/g, settings.center[1]/g] :
          [ngx / 2, ngy / 2];

      // Maxium radius to look for space
      maxRadius = Math.floor(Math.sqrt(ngx * ngx + ngy * ngy));

      /* Determine diffChannel and bgPixel by creating
         another canvas and fill the specified background color */

      var bctx = document.createElement('canvas').getContext('2d');

      bctx.fillStyle = settings.backgroundColor;
      bctx.fillRect(0, 0, 1, 1);
      bgPixel = bctx.getImageData(0, 0, 1, 1).data;

      if (typeof settings.wordColor !== 'function' &&
          settings.wordColor.substr(0, 6) !== 'random') {
        bctx.fillStyle = settings.wordColor;
        bctx.fillRect(0, 0, 1, 1);
        var wdPixel = bctx.getImageData(0, 0, 1, 1).data;

        var i = 4;
        while (i--) {
          if (Math.abs(wdPixel[i] - bgPixel[i]) > 10) {
            diffChannel = i;
            break;
          }
        }
      } else {
        diffChannel = NaN;
      }

      bctx = undefined;

      /* fill the grid with empty state */
      var x = ngx, y;
      while (x--) {
        grid[x] = [];
        y = ngy;
        while (y--) {
          grid[x][y] = true;
        }
      }

      /* Clear the canvas only if the clearCanvas is set,
         if not, update the grid to the current canvas state */
      if (settings.clearCanvas) {
        ctx.fillStyle = settings.backgroundColor;
        ctx.clearRect(0, 0, ngx * (g + 1), ngy * (g + 1));
        ctx.fillRect(0, 0, ngx * (g + 1), ngy * (g + 1));
      } else {
        updateGrid(0, 0, ngx, ngy, true);
      }

      /* Set the text baseline to top */
      ctx.textBaseline = 'top';

      // Cancel the previous wordcloud action by sending wordcloudstart event
      sendEvent(canvas, 'wordcloudstart');

      var i = 0;
      var loopingFunction, stoppingFunction;
      if (settings.wait !== 0) {
        loopingFunction = window.setTimeout;
        stoppingFunction = window.clearTimeout;
      } else {
        loopingFunction = window.setImmediate;
        stoppingFunction = window.clearImmediate;
      }

      canvas.addEventListener('wordcloudstart',
        function anotherWordCloudStart() {
          canvas.removeEventListener('wordcloudstart', anotherWordCloudStart);
          stoppingFunction(timer);
        });

      var timer = loopingFunction(function loop() {
        if (i >= settings.wordList.length) {
          stoppingFunction(timer);
          sendEvent(canvas, 'wordcloudstop');
          return;
        }
        escapeTime = (new Date()).getTime();
        putWord(settings.wordList[i][0], settings.wordList[i][1]);
        if (exceedTime()) {
          stoppingFunction(timer);
          settings.abort();
          sendEvent(canvas, 'wordcloudabort');
          sendEvent(canvas, 'wordcloudstop');
          return;
        }
        i++;
        timer = loopingFunction(loop, settings.wait);
      }, settings.wait);
    };

    // All set, start the drawing
    start(canvas);
  };

  WordCloud.isSupported = isSupported;
  WordCloud.miniumFontSize = miniumFontSize;

  // Expose the library as an AMD module
  if (typeof define === 'function' && define.amd) {
    define('wordcloud', [], function() { return WordCloud; });
  } else {
    global.WordCloud = WordCloud;
  }

})(this);
