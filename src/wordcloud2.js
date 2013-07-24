/*!
 * wordcloud2.js
 * http://timdream.org/wordcloud2.js/
 *
 * Copyright 2011 - 2013 Tim Chien
 * Released under the MIT license
 */

'use strict';

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
    };
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
    };
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

  // Based on http://jsfromhell.com/array/shuffle
  var shuffleArray = function shuffleArray(arr) {
    for (var j, x, i = arr.length; i;
      j = Math.floor(Math.random() * i),
      x = arr[--i], arr[i] = arr[j],
      arr[j] = x);
    return arr;
  };

  var WordCloud = function WordCloud(canvas, options) {
    if (!isSupported)
      return;

    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }

    /* Default values to be overwritten by options object */
    var settings = {
      list: [],
      fontFamily: '"Trebuchet MS", "Heiti TC", "微軟正黑體", ' +
                  '"Arial Unicode MS", "Droid Fallback Sans", sans-serif',
      fontWeight: 'normal',
      color: 'random-dark',
      minSize: 0, // 0 to disable
      weightFactor: 1,
      clearCanvas: true,
      backgroundColor: '#fff',  // opaque white = rgba(255, 255, 255, 1)

      gridSize: 8,
      origin: null,

      drawMask: false,
      maskColor: 'rgba(255,0,0,0.3)',
      maskGapWidth: 0.3,

      wait: 0,
      abortThreshold: 0, // disabled
      abort: function noop() {},

      minRotation: - Math.PI / 2,
      maxRotation: Math.PI / 2,

      shuffle: true,
      rotateRatio: 0.1,

      shape: 'circle',
      ellipticity: 0.65,

      hover: null,
      click: null
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
    var maskRectWidth = g - settings.maskGapWidth;

    /* normalize rotation settings */
    var rotationRange = Math.abs(settings.maxRotation - settings.minRotation);
    var minRotation = Math.min(settings.maxRotation, settings.minRotation);

    /* information/object available to all functions, set when start() */
    var ctx, // canvas context
      grid, // 2d array containing filling information
      ngx, ngy, // width and height of the grid
      center, // position of the center of the cloud
      maxRadius;

    /* timestamp for measuring each putWord() action */
    var escapeTime;

    /* function for getting the color of the text */
    var getTextColor;
    switch (settings.color) {
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
        if (typeof settings.color === 'function') {
          getTextColor = settings.color;
        }
        break;
    }

    /* Interactive */
    var interactive = false;
    var infoGrid = [];
    var hovered;

    var getInfoGridFromMouseEvent = function getInfoGridFromMouseEvent(evt) {
      var rect = canvas.getBoundingClientRect();
      var eventX = evt.clientX - rect.left;
      var eventY = evt.clientY - rect.top;

      var x = Math.floor(eventX * (canvas.width / rect.width) / g);
      var y = Math.floor(eventY * (canvas.height / rect.height) / g);

      return infoGrid[x][y];
    };

    var wordcloudhover = function wordcloudhover(evt) {
      var info = getInfoGridFromMouseEvent(evt);

      if (hovered === info)
        return;

      hovered = info;
      if (!info) {
        settings.hover(undefined, undefined, evt);

        return;
      }

      settings.hover(info.item, info.dimension, evt);

    };

    var wordcloudclick = function wordcloudclick(evt) {
      var info = getInfoGridFromMouseEvent(evt);
      if (!info)
        return;

      settings.click(info.item, info.dimension, evt);
    };

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
    };

    /* Return true if we had spent too much time */
    var exceedTime = function exceedTime() {
      return ((settings.abortThreshold > 0) &&
        ((new Date()).getTime() - escapeTime > settings.abortThreshold));
    };

    /* Get the deg of rotation according to settings, and luck. */
    var getRotateDeg = function getRotateDeg() {
      if (settings.rotateRatio === 0)
        return 0;

      if (Math.random() > settings.rotateRatio)
        return 0;

      if (rotationRange === 0)
        return minRotation;

      return minRotation + Math.random() * rotationRange;
    };

    var getTextInfo = function getTextInfo(word, weight, rotateDeg) {
      // calculate the acutal font size
      // fontSize === 0 means weightFactor function wants the text skipped,
      // and size < minSize means we cannot draw the text.
      var debug = false;
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
            mu += 2;
          }
          return mu;
        })();
      }

      var fcanvas = document.createElement('canvas');
      var fctx = fcanvas.getContext('2d');

      fctx.font = settings.fontWeight + ' ' + (fontSize * mu).toString(10) + 'px ' + settings.fontFamily;

      // Estimate the dimension of the text with measureText().
      var fw = fctx.measureText(word).width / mu;
      var fh = Math.max(fontSize * mu,
                        fctx.measureText('m').width,
                        fctx.measureText('\uFF37').width) / mu;

      // Create a boundary box that is larger than our estimates,
      // so text don't get cut of (it sill might)
      var boxWidth = fw + fh * 2;
      var boxHeight = fh * 3;
      var fgw = Math.ceil(boxWidth / g);
      var fgh = Math.ceil(boxHeight / g);
      boxWidth = fgw * g;
      boxHeight = fgh * g;

      // The 0.35 here is to lower the alphabetic baseline
      // so that ideographic characters can fit into the height defined by |fh|.
      var fillTextOffsetX = - fw / 2;
      var fillTextOffsetY = 0.35 * fh;

      // Calculate the actual dimension of the canvas, considering the rotation.
      var cgh = Math.ceil((boxWidth * Math.abs(Math.sin(rotateDeg)) +
                           boxHeight * Math.abs(Math.cos(rotateDeg))) / g);
      var cgw = Math.ceil((boxWidth * Math.abs(Math.cos(rotateDeg)) +
                           boxHeight * Math.abs(Math.sin(rotateDeg))) / g);
      var width = cgw * g;
      var height = cgh * g;

      fcanvas.setAttribute('width', width);
      fcanvas.setAttribute('height', height);

      if (debug)
        document.body.appendChild(fcanvas);

      // Scale the canvas with |mu|.
      fctx.save();
      fctx.scale(1 / mu, 1 / mu);
      fctx.translate(width * mu / 2, height * mu / 2);
      fctx.rotate(- rotateDeg);

      // Once the width/height is set, ctx info will be reset.
      // Set it again here.
      fctx.font = settings.fontWeight + ' ' + (fontSize * mu).toString(10) + 'px ' + settings.fontFamily;

      // Fill the text into the fcanvas.
      fctx.fillStyle = '#000';
      fctx.textBaseline = 'alphabetic';
      fctx.fillText(word, fillTextOffsetX * mu, fillTextOffsetY * mu);

      // Restore the transform.
      fctx.restore();

      // Get the pixels of the text
      var imageData = fctx.getImageData(0, 0, width, height).data;

      if (exceedTime())
        return false;

      // Read the pixels and save the information to the occupied array
      var occupied = [];
      var gx = cgw, gy, x, y;
      var bounds = [cgh / 2, cgw / 2, cgh / 2, cgw / 2];
      while (gx--) {
        gy = cgh;
        while (gy--) {
          y = g;
          singleGridLoop: {
            while (y--) {
              x = g;
              while (x--) {
                if (imageData[((gy * g + y) * width +
                               (gx * g + x)) * 4 + 3]) {
                  occupied.push([gx, gy]);

                  if (gx < bounds[3])
                    bounds[3] = gx;
                  if (gx > bounds[1])
                    bounds[1] = gx;
                  if (gy < bounds[0])
                    bounds[0] = gy;
                  if (gy > bounds[2])
                    bounds[2] = gy;

                  if (debug) {
                    fctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    fctx.fillRect(gx * g, gy * g, g - 0.5, g - 0.5);
                  }
                  break singleGridLoop;
                }
              }
            }
            if (debug) {
              fctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
              fctx.fillRect(gx * g, gy * g, g - 0.5, g - 0.5);
            }
          };
        }
      }

      if (debug) {
        fctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        fctx.fillRect(bounds[3] * g,
                      bounds[0] * g,
                      (bounds[1] - bounds[3] + 1) * g,
                      (bounds[2] - bounds[0] + 1) * g);
      }

      // Return information needed to create the text on the real canvas
      return {
        mu: mu,
        occupied: occupied,
        bounds: bounds,
        gw: cgw,
        gh: cgh,
        fillTextOffsetX: fillTextOffsetX,
        fillTextOffsetY: fillTextOffsetY,
        fontSize: fontSize
      };
    };

    /* Determine if there is room available in the given dimension */
    var canFitText = function canFitText(gx, gy, gw, gh, occupied) {
      // Go through the occupied points,
      // return false if the space is not available.
      var i = occupied.length;
      while (i--) {
        var px = gx + occupied[i][0];
        var py = gy + occupied[i][1];

        if (px >= ngx || py >= ngy || px < 0 || py < 0 || !grid[px][py]) {
          return false;
        }
      }
      return true;
    };

    /* Actually draw the text on the grid */
    var drawText = function drawText(gx, gy, info, word, weight,
                                     distance, theta, rotateDeg) {
      var fontSize = info.fontSize;
      var mu = info.mu;

      // Save the current state before messing it
      ctx.save();
      ctx.scale(1 / mu, 1 / mu);

      ctx.font = settings.fontWeight + ' ' + (fontSize * mu).toString(10) + 'px ' + settings.fontFamily;
      if (getTextColor) {
        ctx.fillStyle = getTextColor(word, weight, fontSize, distance, theta);
      } else {
        ctx.fillStyle = settings.color;
      }
      ctx.textBaseline = 'alphabetic';

      // Translate the canvas position to the origin coordinate of where
      // the text should be put.
      ctx.translate((gx + info.gw / 2) * g * mu,
                    (gy + info.gh / 2) * g * mu);

      if (rotateDeg !== 0) {
        ctx.rotate(- rotateDeg);
      }

      // Finally, fill the text.
      ctx.fillText(word, info.fillTextOffsetX * mu,
                         info.fillTextOffsetY * mu);

      // Restore the state.
      ctx.restore();
    };

    /* Help function to updateGrid */
    var fillGridAt = function fillGridAt(x, y, drawMask, dimension, item) {
      if (x >= ngx || y >= ngy || x < 0 || y < 0)
        return;

      grid[x][y] = false;

      if (drawMask)
        ctx.fillRect(x * g, y * g, maskRectWidth, maskRectWidth);

      if (interactive) {
        infoGrid[x][y] = { item: item, dimension: dimension };
      }
    };

    /* Update the filling information of the given space with occupied points.
       Draw the mask on the canvas if necessary. */
    var updateGrid = function updateGrid(gx, gy, gw, gh, info, item) {
      var occupied = info.occupied;
      var maskRectWidth = g - settings.maskGapWidth;
      var drawMask = settings.drawMask;
      if (drawMask) {
        ctx.save();
        ctx.fillStyle = settings.maskColor;
      }

      var dimension;
      if (interactive) {
        var bounds = info.bounds;
        dimension = {
          x: (gx + bounds[3]) * g,
          y: (gy + bounds[0]) * g,
          w: (bounds[1] - bounds[3] + 1) * g,
          h: (bounds[2] - bounds[0] + 1) * g
        };
      }

      var i = occupied.length;
      while (i--) {
        fillGridAt(gx + occupied[i][0], gy + occupied[i][1],
                   drawMask, dimension, item);
      }

      if (drawMask)
        ctx.restore();
    };

    /* putWord() processes each item on the list,
       calculate it's size and determine it's position, and actually
       put it on the canvas. */
    var putWord = function putWord(item) {
      var word = item[0];
      var weight = item[1];
      var rotateDeg = getRotateDeg();

      // get info needed to put the text onto the canvas
      var info = getTextInfo(word, weight, rotateDeg);

      // not getting the info means we shouldn't be drawing this one.
      if (!info)
        return false;

      if (exceedTime())
        return false;

      // Skip the loop if we have already know the bounding box of
      // word is larger than the canvas.
      var bounds = info.bounds;
      if ((bounds[1] - bounds[3] + 1) > ngx ||
        (bounds[2] - bounds[0] + 1) > ngy) {
        return false;
      }

      // Determine the position to put the text by
      // start looking for the nearest points
      var r = maxRadius + 1;

      while (r--) {
        var points = getPointsAtRadius(maxRadius - r);

        if (settings.shuffle) {
          points = [].concat(points);
          shuffleArray(points);
        }

        // Try to fit the words by looking at each point.
        // array.some() will stop and return true
        // when putWordAtPoint() returns true.
        // If all the points returns false, array.some() returns false.
        var drawn = points.some(function putWordAtPoint(gxy) {
          var gx = Math.floor(gxy[0] - info.gw / 2);
          var gy = Math.floor(gxy[1] - info.gh / 2);
          var gw = info.gw;
          var gh = info.gh;

          // If we cannot fit the text at this position, return false
          // and go to the next position.
          if (!canFitText(gx, gy, gw, gh, info.occupied))
            return false;

          // Actually put the text on the canvas
          drawText(gx, gy, info, word, weight,
                   (maxRadius - r), gxy[2], rotateDeg);

          // Mark the spaces on the grid as filled
          updateGrid(gx, gy, gw, gh, info, item);

          // Return true so some() will stop and also return true.
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

    /* Send DOM event */
    var sendEvent = function sendEvent(el, type, cancelable, detail) {
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(type, true, cancelable, detail || {});
      return el.dispatchEvent(evt);
    };

    /* Start drawing on a canvas */
    var start = function start(canvas) {
      // Sending a wordcloudstart event which cause the previous loop to stop.
      // Do nothing if the event is canceled.
      if (!sendEvent(canvas, 'wordcloudstart', true)) {
        return;
      }

      ngx = Math.floor(canvas.width / g);
      ngy = Math.floor(canvas.height / g);
      ctx = canvas.getContext('2d');

      // Determine the center of the word cloud
      center = (settings.origin) ?
        [settings.origin[0]/g, settings.origin[1]/g] :
        [ngx / 2, ngy / 2];

      // Maxium radius to look for space
      maxRadius = Math.floor(Math.sqrt(ngx * ngx + ngy * ngy));

      /* Clear the canvas only if the clearCanvas is set,
         if not, update the grid to the current canvas state */
      grid = [];

      if (settings.clearCanvas) {
        ctx.fillStyle = settings.backgroundColor;
        ctx.clearRect(0, 0, ngx * (g + 1), ngy * (g + 1));
        ctx.fillRect(0, 0, ngx * (g + 1), ngy * (g + 1));

        /* fill the grid with empty state */
        var gx = ngx, gy;
        while (gx--) {
          grid[gx] = [];
          gy = ngy;
          while (gy--) {
            grid[gx][gy] = true;
          }
        }
      } else {
        /* Determine bgPixel by creating
           another canvas and fill the specified background color */
        var bctx = document.createElement('canvas').getContext('2d');

        bctx.fillStyle = settings.backgroundColor;
        bctx.fillRect(0, 0, 1, 1);
        var bgPixel = bctx.getImageData(0, 0, 1, 1).data;

        /* Read back the pixels of the canvas we got to tell which part of the
           canvas is empty. */
        var imageData = ctx.getImageData(0, 0, ngx * g, ngy * g).data;

        var gx = ngx, gy, x, y, i;
        while (gx--) {
          grid[gx] = [];
          gy = ngy;
          while (gy--) {
            y = g;
            singleGridLoop: while (y--) {
              x = g;
              while (x--) {
                i = 4;
                while (i--) {
                  if (imageData[((gy * g + y) * ngx * g +
                                 (gx * g + x)) * 4 + i] !== bgPixel[i]) {
                    grid[gx][gy] = false;
                    break singleGridLoop;
                  }
                }
              }
            }
            if (grid[gx][gy] !== false) {
              grid[gx][gy] = true;
            }
          }
        }

        imageData = bctx = bgPixel = undefined;
      }

      // fill the infoGrid with empty state if we need it
      if (settings.hover || settings.click) {

        interactive = true;

        /* fill the grid with empty state */
        var gx = ngx + 1;
        while (gx--) {
          infoGrid[gx] = [];
        }

        if (settings.hover) {
          canvas.addEventListener('mousemove', wordcloudhover);
        }

        if (settings.click) {
          canvas.addEventListener('click', wordcloudclick);
        }

        canvas.addEventListener('wordcloudstart', function stopInteraction() {
          canvas.removeEventListener('wordcloudstart', stopInteraction);

          canvas.removeEventListener('mousemove', wordcloudhover);
          canvas.removeEventListener('click', wordcloudclick);
          hovered = undefined;
        });
      }

      var i = 0;
      var loopingFunction, stoppingFunction;
      if (settings.wait !== 0) {
        loopingFunction = window.setTimeout;
        stoppingFunction = window.clearTimeout;
      } else {
        loopingFunction = window.setImmediate;
        stoppingFunction = window.clearImmediate;
      }

      var anotherWordCloudStart = function anotherWordCloudStart() {
        canvas.removeEventListener('wordcloudstart', anotherWordCloudStart);
        stoppingFunction(timer);
      };

      canvas.addEventListener('wordcloudstart', anotherWordCloudStart);

      var timer = loopingFunction(function loop() {
        if (i >= settings.list.length) {
          stoppingFunction(timer);
          sendEvent(canvas, 'wordcloudstop', false);
          canvas.removeEventListener('wordcloudstart', anotherWordCloudStart);

          return;
        }
        escapeTime = (new Date()).getTime();
        var drawn = putWord(settings.list[i]);
        var canceled = !sendEvent(canvas, 'wordclouddrawn', true, {
          item: settings.list[i], drawn: drawn });
        if (exceedTime() || canceled) {
          stoppingFunction(timer);
          settings.abort();
          sendEvent(canvas, 'wordcloudabort', false);
          sendEvent(canvas, 'wordcloudstop', false);
          canvas.removeEventListener('wordcloudstart', anotherWordCloudStart);
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
