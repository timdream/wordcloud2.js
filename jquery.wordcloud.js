/*!
 
 Simple <canvas> Word Cloud
 by timdream

 usage:
  $('#canvas').wordCloud(settings); // draw word cloud on #canvas.
  $.wordCloudSupported // return true if the browser checks out
  $.miniumFontSize // return minium font size enforced by the browser
 
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
	minSize: minium font size in pixel to draw (default: $.miniumFontSize / 2, larger than that is still look good using bilinear sampling in browser)
	wordList: 2d array in for word list like [['w1', 12], ['w2', 6]]
	clearCanvas: clear canvas before drawing. Faster than running detection on what's already on it.
	fillBox: true will mark the entire box containing the word as filled - no subsequent smaller words can be fit in the gap.
	shape: keyword or a function that represents polar equation r = fn(theta), available keywords:
		'circle', (default)
		'cardioid', (apple or heart shape curve, the most known polar equation)
		'diamond', (alias: 'square'),
		'triangle-forward',
		'triangle', (alias: 'triangle-upright')
		'pentagon',
		'star'
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

	$.miniumFontSize = (function() {
		if (!$.wordCloudSupported) return;

		var lctx = document.createElement('canvas').getContext('2d'),
		size = 20,
		hanWidth,
		mWidth;
		while (size) {
			lctx.font = size.toString(10) + 'px sans-serif';
			if (
				lctx.measureText('\uFF37').width === hanWidth &&
				lctx.measureText('m').width === mWidth
			) return size+1;
			hanWidth = lctx.measureText('\uFF37').width;
			mWidth = lctx.measureText('m').width;

			size--;
		}
		return 0;
	})();

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
			minSize: $.miniumFontSize / 2, // 0 to disable
			wordList: [],
			rotateRatio: 0.1,
			clearCanvas: true,
			fillBox: false,
			shape: 'circle'
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

		if (typeof settings.shape !== 'function') {
			switch (settings.shape) {
				case 'circle':
				default:
					settings.shape = function (theta) { return 1; };
				break;
				case 'cardioid':
					settings.shape = function (theta) {
						return 1 - Math.sin(theta);
					};
				break;
				/*

				To work out an X-gon, one has to calculate "m", where 1/(cos(2*PI/X)+m*sin(2*PI/X)) = 1/(cos(0)+m*sin(0))
				http://www.wolframalpha.com/input/?i=1%2F%28cos%282*PI%2FX%29%2Bm*sin%282*PI%2FX%29%29+%3D+1%2F%28cos%280%29%2Bm*sin%280%29%29

				Copy the solution into polar equation r = 1/(cos(t') + m*sin(t')) where t' equals to mod(t, 2PI/X);

				*/
				
				case 'diamond':
				case 'square':
					// http://www.wolframalpha.com/input/?i=plot+r+%3D+1%2F%28cos%28mod+%28t%2C+PI%2F2%29%29%2Bsin%28mod+%28t%2C+PI%2F2%29%29%29%2C+t+%3D+0+..+2*PI
					settings.shape = function (theta) {
						var theta_dalta = theta % (2 * Math.PI / 4);
						return 1/(Math.cos(theta_dalta) + Math.sin(theta_dalta));
					};
				break;
				case 'triangle-forward':
					// http://www.wolframalpha.com/input/?i=plot+r+%3D+1%2F%28cos%28mod+%28t%2C+2*PI%2F3%29%29%2Bsqrt%283%29sin%28mod+%28t%2C+2*PI%2F3%29%29%29%2C+t+%3D+0+..+2*PI
					settings.shape = function (theta) {
						var theta_dalta = theta % (2 * Math.PI / 3);
						return 1/(Math.cos(theta_dalta) + Math.sqrt(3)*Math.sin(theta_dalta));
					};
				break;
				case 'triangle':
				case 'triangle-upright':
					settings.shape = function (theta) {
						var theta_dalta = (theta + Math.PI * 3 / 2) % (2 * Math.PI / 3);
						return 1/(Math.cos(theta_dalta) + Math.sqrt(3)*Math.sin(theta_dalta));
					};
				break;
				case 'pentagon':
					settings.shape = function (theta) {
						var theta_dalta = (theta + 0.955) % (2 * Math.PI / 5);
						return 1/(Math.cos(theta_dalta) + 0.726543*Math.sin(theta_dalta));
					};
				break;
				case 'star':
					settings.shape = function (theta) {
						var theta_dalta = (theta + 0.955) % (2 * Math.PI / 10);
						if ((theta + 0.955) % (2 * Math.PI / 5) - (2 * Math.PI / 10) >= 0) {
							return 1/(Math.cos((2 * Math.PI / 10) - theta_dalta) + 3.07768*Math.sin((2 * Math.PI / 10) - theta_dalta));
						} else {
							return 1/(Math.cos(theta_dalta) + 3.07768*Math.sin(theta_dalta));
						}
					};
				break;
			}
		}

		settings.gridSize = Math.max(settings.gridSize, 4);

		var g = settings.gridSize,
			ctx, grid, ngx, ngy, diffChannel, bgPixel,
			escapeTime,
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
			getChannelData = function (data, x, y, w, h, c) {
				return data[
					(y*w+x)*4+c
				];
			},
			isGridEmpty = function (imgData, x, y, w, h, skipDiffChannel) {
				var i = g, j;
				if (!isNaN(diffChannel) && !skipDiffChannel) {
					while (i--) {
						j = g;
						while (j --) {
							if (getChannelData(imgData.data, x+i, y+j, w, h, diffChannel) !== bgPixel[diffChannel]) return false;
						}
					}
				} else {
					var k;
					while (i--) {
						j = g;
						while (j --) {
							k = 4;
							while (k--) {
								if (getChannelData(imgData.data, x+i, y+j, w, h, k) !== bgPixel[k]) return false;
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
			updateGrid = function (gx, gy, gw, gh, skipDiffChannel) {
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
						if (!isGridEmpty(imgData, x*g, y*g, gw*g, gh*g, skipDiffChannel)) {
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
				if (fontSize <= settings.minSize) return false; // fontSize === 0 means weightFactor wants the text skipped.
				if (fontSize < $.miniumFontSize) mu = (function () {  // make sure fillText is not limited by min font size set by browser.
					var mu = 2;
					while (mu*fontSize < $.miniumFontSize) {
						mu += 2; // TBD: should force the browser to do resampling 0.5x each time instead of this
					}
					return mu;
				})();
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
						var rx = settings.shape(t/T*2*Math.PI); // 0 to 1
						points.push(
							[
								Math.floor(center[0]+(R-r)*rx*Math.cos(-t/T*2*Math.PI) - gw/2),
								Math.floor(center[1]+(R-r)*rx*settings.ellipticity*Math.sin(-t/T*2*Math.PI) - gh/2),
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
				updateGrid(0, 0, ngx, ngy, true);
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
