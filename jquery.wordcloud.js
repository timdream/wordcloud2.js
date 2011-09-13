/*!
 
 Simple <canvas> Word Cloud
 by timdream

 usage:
  $('#canvas').wordCloud(settings); // draw word cloud on #canvas.
  $.wordCloudSupported // return true if the browser checks out
 
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
	abortThreshold: abort and execute about() when the browser took more than N ms to draw a word. 0 to disable.
	abort: abort handler.
	weightFactor: 
	minSize:
	wordList: 2d array in for word list like [['w1', 12], ['w2', 6]]
	clearCanvas: clear canvas before drawing. Faster than running detection on what's already on it.
	fillBox: true will mark the entire box containing the word as filled - no subsequent smaller words can be fit in the gap.
 
*/

"use strict";

// http://jsfromhell.com/array/shuffle
Array.prototype.shuffle = function () { //v1.0
	for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
	return this;
};

// setImmediate
if (!window.setImmediate) {
	window.setImmediate = (function () {
		return window.msSetImmediate ||
		window.webkitSetImmediate ||
		window.mozSetImmediate ||
		window.oSetImmediate ||
		// setZeroTimeout: "hack" based on postMessage
		// modified from http://dbaron.org/log/20100309-faster-timeouts
		(function () {
			if (window.postMessage && window.addEventListener) {
				var timeouts = [],
				timerPassed = -1,
				timerIssued = -1,
				messageName = "zero-timeout-message",
				// Like setTimeout, but only takes a function argument.  There's
				// no time argument (always zero) and no arguments (you have to
				// use a closure).
				setZeroTimeout = function (fn) {
					timeouts.push(fn);
					window.postMessage(messageName, "*");
					return ++timerIssued;
				},
				handleMessage = function (event) {
					// Skipping checking event source, retarded IE confused this window object with another in the presence of iframe
					if (/*event.source == window && */event.data == messageName) {
						event.stopPropagation();
						if (timeouts.length > 0) {
							var fn = timeouts.shift();
							fn();
							timerPassed++;
						}
					}
				};

				window.addEventListener("message", handleMessage, true);
	
				window.clearImmediate = function (timer) {
					if (typeof timer !== 'number' || timer > timerIssued) return;
					var fnId = timer - timerPassed - 1;
					timeouts[fnId] = (function () {}); // overwrite the original fn
				};

				// Add the one thing we want added to the window object.
				return setZeroTimeout;
			};
		})() ||
		// fallback
		function (fn) {
			window.setTimeout(fn, 0);
		}
	})();
}

if (!window.clearImmediate) {
	window.clearImmediate = (function () {
		return window.msClearImmediate ||
		window.webkitClearImmediate ||
		window.mozClearImmediate ||
		window.oClearImmediate ||
		// "clearZeroTimeout" is implement on the previous block ||
		// fallback
		function (timer) {
			window.clearTimeout(timer);
		}
	})();
}

(function ($) {

	$.wordCloudSupported = (function () {
		var $c = $('<canvas />'), ctx;
		if (!$c[0] || !$c[0].getContext) return false;
		ctx = $c[0].getContext('2d');
		if (!ctx.getImageData) return false;
		if (!ctx.fillText) return false;
		if (!Array.prototype.some) return false;
		if (!Array.prototype.push) return false;
		return true;
	}());

	$.fn.wordCloud = function (options) {
		if (!$.wordCloudSupported) return this;
	
		var settings = {
			fontFamily: '"Trebuchet MS", "Heiti TC", "微軟正黑體", "Arial Unicode MS", "Droid Fallback Sans", sans-serif',
			gridSize: 8,
			ellipticity: 0.65,
			center: false,
			drawMask: false,
			maskColor: 'rgba(255,0,0,0.3)',
			maskGridWidth: 0.3,
			wordColor: 'random-dark',
			backgroundColor: '#fff',  //opaque white = rgba(255, 255, 255, 1)
			wait: 0,
			abortThreshold: 0, // disabled
			abort: $.noop,
			weightFactor: 1,
			minSize: 4.5, // 0 to disable
			wordList: [],
			rotateRatio: 0.1,
			clearCanvas: true,
			fillBox: false
		};

		if (options) { 
			$.extend(settings, options);
		}

		if (typeof settings.weightFactor !== 'function') {
			var factor = settings.weightFactor;
			settings.weightFactor = function (pt) {
				return pt*factor; //in px
			};
		}
		
		settings.gridSize = Math.max(settings.gridSize, 4);

		var g = settings.gridSize,
			ctx, grid, ngx, ngy, diffChannel, bgPixel,
			escapeTime,
			limitedByMinSize = (function() {
				var lctx = document.createElement('canvas').getContext('2d');
				lctx.font = '0px sans-serif';
				return (Math.max(lctx.measureText('\uFF37').width, lctx.measureText('m').width) > 2);
			})(),
			wordColor = function (word, weight, fontSize, radius, theta) {
				switch (settings.wordColor) {
					case 'random-dark':
						return 'rgb('
							+ Math.floor(Math.random()*128).toString(10) + ','
							+ Math.floor(Math.random()*128).toString(10) + ','
							+ Math.floor(Math.random()*128).toString(10) + ')';
					break;
					case 'random-light':
						return 'rgb('
							+ Math.floor(Math.random()*128 + 128).toString(10) + ','
							+ Math.floor(Math.random()*128 + 128).toString(10) + ','
							+ Math.floor(Math.random()*128 + 128).toString(10) + ')';
					break;
					default:
					if (typeof settings.wordColor !== 'function') {
						return settings.wordColor;
					} else {
						return settings.wordColor(word, weight, fontSize, radius, theta);
					}
				}
			},
			exceedTime = function () {
				return (
					settings.abortThreshold > 0
					&& (new Date()).getTime() - escapeTime > settings.abortThreshold
				);
			},
			isGridEmpty = function (imgData, x, y, w, h) {
				var i = g, j;
				if (!isNaN(diffChannel)) {
					while (i--) {
						j = g;
						while (j --) {
							if (
								imgData.data[
									((y+j)*w+x+i)*4+diffChannel
								] !== bgPixel[diffChannel]
							) return false;
						}
					}
				} else {
					var k;
					while (i--) {
						j = g;
						while (j --) {
							k = 4;
							while (k--) {
								if (
									imgData.data[
										((y+j)*w+x+i)*4+k
									] !== bgPixel[k]
								) return false;
							}
						}
					}
				}
				return true;
			},
			fillGrid = function (gx, gy, gw, gh) {
				var x = gw, y;
				if (settings.drawMask) ctx.fillStyle = settings.maskColor;
				while (x--) {
					y = gh;
					while (y--) {
						grid[gx + x][gy + y] = false;
						if (settings.drawMask) {
							ctx.fillRect((gx + x)*g, (gy + y)*g, g-settings.maskGridWidth, g-settings.maskGridWidth);
						}
					}
				}
			},
			updateGrid = function (gx, gy, gw, gh) {
				var x = gw, y;
				if (settings.drawMask) ctx.fillStyle = settings.maskColor;
				/*
				getImageData() is a super expensive function
				(internally, extracting pixels of _entire canvas_ all the way from GPU),
				call once here instead of every time in isGridEmpty
				*/
				var imgData = ctx.getImageData(gx*g, gy*g, gw*g, gh*g);
				out: while (x--) {
					y = gh;
					while (y--) {
						if (!isGridEmpty(imgData, x*g, y*g, gw*g, gh*g)) {
							grid[gx + x][gy + y] = false;
							if (settings.drawMask) {
								ctx.fillRect((gx + x)*g, (gy + y)*g, g-settings.maskGridWidth, g-settings.maskGridWidth);
							}
						}
						if (exceedTime()) break out;
					}
				}
			},
			putWord = function (word, weight) {
				var gw, gh, mu = 1,
				rotate = (Math.random() < settings.rotateRatio),
				fontSize = settings.weightFactor(weight);
				if ((limitedByMinSize && fontSize < 17) || fontSize < 4.5) mu = Math.ceil(17/fontSize); // make sure fillText is not limited by min font size set by browser.
				if (fontSize <= settings.minSize) return false; // fontSize === 0 means weightFactor wants the text skipped.
				ctx.font = (fontSize*mu).toString(10) + 'px ' + settings.fontFamily;
				if (rotate) {
					var h = ctx.measureText(word).width/mu,
						w = Math.max(fontSize*mu, ctx.measureText('m').width, ctx.measureText('\uFF37').width)/mu;
					if (/[Jgpqy]/.test(word)) w *= 3/2;
					w += Math.floor(fontSize/6);
					h += Math.floor(fontSize/6);
				} else {
					var w = ctx.measureText(word).width/mu,
						h = Math.max(fontSize*mu, ctx.measureText('m').width, ctx.measureText('\uFF37').width)/mu;
					if (/[Jgpqy]/.test(word)) h *= 3/2;
					h += Math.floor(fontSize/6);
					w += Math.floor(fontSize/6);
				}
				w = Math.ceil(w);
				h = Math.ceil(h);
				gw = Math.ceil(w/g),
				gh = Math.ceil(h/g);
				var center = (settings.center)?[settings.center[0]/g, settings.center[1]/g]:[ngx/2, ngy/2];
				var R = Math.floor(Math.sqrt(ngx*ngx+ngy*ngy)), T = ngx+ngy, r, t, points, x, y;
				r = R + 1;
				while (r--) {
					t = T;
					points = [];
					while (t--) {
						points.push(
							[
								Math.floor(center[0]+(R-r)*Math.cos(-t/T*2*Math.PI) - gw/2),
								Math.floor(center[1]+(R-r)*settings.ellipticity*Math.sin(-t/T*2*Math.PI) - gh/2),
								t/T*2*Math.PI
							]
						);
					}
					if (points.shuffle().some(
						function (gxy) {
							if (canFitText(gxy[0], gxy[1], gw, gh)) {
								if (mu !== 1 || rotate) {
									var fc = document.createElement('canvas');
									fc.setAttribute('width', w*mu);
									fc.setAttribute('height', h*mu);
									var fctx = fc.getContext('2d');
									fctx.fillStyle = settings.backgroundColor;
									fctx.fillRect(0, 0, w*mu, h*mu);
									fctx.fillStyle = wordColor(word, weight, fontSize, R-r, gxy[2]);
									fctx.font = (fontSize*mu).toString(10) + 'px ' + settings.fontFamily;				
									fctx.textBaseline = 'top';
									if (rotate) {
										fctx.translate(0, h*mu);
										fctx.rotate(-Math.PI/2);
									}
									fctx.fillText(word, Math.floor(fontSize*mu/6), 0);
									ctx.clearRect(Math.floor(gxy[0]*g + (gw*g - w)/2), Math.floor(gxy[1]*g + (gh*g - h)/2), w, h);
									ctx.drawImage(fc, Math.floor(gxy[0]*g + (gw*g - w)/2), Math.floor(gxy[1]*g + (gh*g - h)/2), w, h);
								} else {
									ctx.font = fontSize.toString(10) + 'px ' + settings.fontFamily;
									ctx.fillStyle = wordColor(word, weight, fontSize, R-r, gxy[2]);
									ctx.fillText(word, gxy[0]*g + (gw*g - w)/2, gxy[1]*g + (gh*g - h)/2);
								}
								if (settings.fillBox) {
									fillGrid(gxy[0], gxy[1], gw, gh);
								} else {
									updateGrid(gxy[0], gxy[1], gw, gh);
								}
								return true;
							}
							return false;
						}
					)) return true;
				}
				return false;
			},
			canFitText = function (gx, gy, gw, gh) {
				if (gx < 0 || gy < 0 || gx + gw > ngx || gy + gh > ngy) return false;
				var x = gw, y;
				while (x--) {
					y = gh;
					while (y--) {
						if (!grid[gx + x][gy + y]) return false;
					}
				}
				return true;
			};


		return this.each(function() {
			if (this.nodeName.toLowerCase() !== 'canvas') return;

			var $el = $(this);

			ngx = Math.floor($el.attr('width')/g);
			ngy = Math.floor($el.attr('height')/g);
			ctx = this.getContext('2d'), 
			grid = [];

			/* in order to get more a correct reading on difference,
			 do clearRect */

			var bctx = document.createElement('canvas').getContext('2d');

			bctx.fillStyle = settings.backgroundColor;
			bctx.clearRect(0, 0, 1, 1);
			bctx.fillStyle = settings.backgroundColor;
			bctx.fillRect(0, 0, 1, 1);
			bgPixel = bctx.getImageData(0, 0, 1, 1).data;
			
			if (typeof settings.wordColor !== 'function'
				&& settings.wordColor.substr(0,6) !== 'random') {
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
			
			//delete bctx; // break in strict mode

			var x = ngx, y;
			while (x--) {
				grid[x] = [];
				y = ngy;
				while (y--) {
					grid[x][y] = true;
				}
			}

			if (settings.clearCanvas) {
				ctx.fillStyle = settings.backgroundColor;
				ctx.clearRect(0, 0, ngx*(g+1), ngy*(g+1));
				ctx.fillRect(0, 0, ngx*(g+1), ngy*(g+1));
			} else {
				updateGrid(0, 0, ngx, ngy);
			}
			

			ctx.textBaseline = 'top';

			// cancel previous wordcloud action by trigger
			$el.trigger('wordcloudstart');
			
			var i = 0;
			if (settings.wait !== 0) {
				var timer = setInterval(
					function () {
						if (i >= settings.wordList.length) {
							clearTimeout(timer);
							$el.trigger('wordcloudstop');
							// console.log(d.getTime() - (new Date()).getTime());
							return;
						}
						escapeTime = (new Date()).getTime();
						putWord(settings.wordList[i][0], settings.wordList[i][1]);
						if (exceedTime()) {
							clearTimeout(timer);
							settings.abort();
							$el.trigger('wordcloudabort');
							$el.trigger('wordcloudstop');
						}
						i++;
					},
					settings.wait
				);
				$el.one(
					'wordcloudstart',
					function (ev) {
						clearTimeout(timer);
					}
				);
			} else {
				var stop = false;
				window.setImmediate(
					function loop() {
						if (i >= settings.wordList.length) {
							// console.log(d.getTime() - (new Date()).getTime());
							$el.trigger('wordcloudstop');
							return;
						}
						if (stop) {
							return;
						}
						escapeTime = (new Date()).getTime();
						putWord(settings.wordList[i][0], settings.wordList[i][1]);
						if (exceedTime()) {
							settings.abort();
							$el.trigger('wordcloudabort');
							$el.trigger('wordcloudstop');
							return;
						}
						i++;
						window.setImmediate(loop);
					}
				);
				$el.one(
					'wordcloudstart',
					function () {
						stop = true;
					}
				);
			}
		});
	}
})(jQuery);
