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
	drawMask: true to debug mask to show area covered by word.
	maskColor: color of the debug mask.
	maskGridWidth: width of the mask grid border.
	wordColor: color for word.
	backgroundColor: background to cover entire canvas or the detect against.
	wait: wait N ms before drawing next word.
	abortThreshold: abort and execute about() when the browser took more than N ms to draw a word. 0 to disable.
	abort: abort handler.
	weightFactor: 
	minSize:
	wordList: 2d array in for word list like [['w1', 12], ['w2', 6]]
	clearCanvas: clear canvas before drawing. Faster than running detection on what's already on it.
 
*/

"use strict";

(function ($) {

	// http://jsfromhell.com/array/shuffle
	Array.prototype.shuffle = function () { //v1.0
		for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
		return this;
	};

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
			drawMask: false,
			maskColor: 'rgba(255,0,0,0.3)',
			maskGridWidth: 0.3,
			wordColor: 'rgba(0,0,0,0.7)',
			backgroundColor: '#fff',  //opaque white = rgba(255, 255, 255, 1)
			wait: 0,
			abortThreshold: 0, // disabled
			abort: $.noop,
			weightFactor: 1,
			minSize: 9,
			wordList: [],
			rotateRatio: 0.1,
			clearCanvas: true
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
			ctx, grid, ngx, ngy, diffChannel, bgChannelVal,
			escapeTime, timer,
			exceedTime = function () {
				return (
					settings.abortThreshold > 0
					&& (new Date()).getTime() - escapeTime > settings.abortThreshold
				);
			},
			isGridEmpty = function (x, y) {
				var i = g*g*4,
					imgData = ctx.getImageData(x*g, y*g, g, g);
				while (i -= 4) {
					if (imgData.data[i+diffChannel] !== bgChannelVal) return false;
				}
				return true;
			},
			updateGrid = function (gx, gy, gw, gh) {
				var x = gw, y;
				if (settings.drawMask) ctx.fillStyle = settings.maskColor;
				out: while (x--) {
					y = gh;
					while (y--) {
						if (!isGridEmpty(gx + x, gy + y)) {
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
				if (fontSize <= 16) mu = Math.ceil(17/fontSize); // make sure fillText is not limited by min font size set by browser.
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
				var R = Math.floor(Math.sqrt(ngx*ngx+ngy*ngy)), T = ngx+ngy, r, t, points, x, y;
				r = R;
				while (r--) {
					t = T;
					points = [];
					while (t--) {
						points.push(
							[
								Math.floor(ngx/2+(R-r)*Math.cos(t/T*2*Math.PI) - gw/2),
								Math.floor(ngy/2+(R-r)*settings.ellipticity*Math.sin(t/T*2*Math.PI) - gh/2)
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
									fctx.fillStyle = settings.wordColor;
									fctx.font = (fontSize*mu).toString(10) + 'px ' + settings.fontFamily;				
									fctx.textBaseline = 'top';
									if (rotate) {
										fctx.translate(0, h*mu);
										fctx.rotate(-Math.PI/2);
									}
									fctx.fillText(word, Math.floor(fontSize*mu/6), 0);
									ctx.clearRect(gxy[0]*g, gxy[1]*g, w, h);
									ctx.drawImage(fc, gxy[0]*g + (gw*g - w)/2, gxy[1]*g + (gh*g - h)/2, w, h);
								} else {
									ctx.font = fontSize.toString(10) + 'px ' + settings.fontFamily;
									ctx.fillStyle = settings.wordColor;
									ctx.fillText(word, gxy[0]*g + (gw*g - w)/2, gxy[1]*g + (gh*g - h)/2);
								}
								updateGrid(gxy[0], gxy[1], gw, gh);
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
			ngx = Math.floor($(this).attr('width')/g);
			ngy = Math.floor($(this).attr('height')/g);
			ctx = this.getContext('2d'), 
			grid = [];

			/* in order to get more a correct reading on difference,
			 do clearRect */

			var bctx = document.createElement('canvas').getContext('2d');

			bctx.fillStyle = settings.backgroundColor;
			bctx.clearRect(0, 0, 1, 1);
			bctx.fillStyle = settings.backgroundColor;
			bctx.fillRect(0, 0, 1, 1);
			var bgPixel = bctx.getImageData(0, 0, 1, 1).data;
			bctx.fillStyle = settings.wordColor;
			bctx.fillRect(0, 0, 1, 1);
			var wdPixel = bctx.getImageData(0, 0, 1, 1).data;

			var i = 4;
			while (i--) {
				if (Math.abs(wdPixel[i] - bgPixel[i]) > 10) {
					diffChannel = i;
					bgChannelVal = bgPixel[i];
					break;
				}
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
			
			clearTimeout($(this).data('wordCloud-timer'));
			
			var i = 0;
			timer = setInterval(
				function () {
					if (i >= settings.wordList.length) {
						clearTimeout(timer);
						return;
					}
					escapeTime = (new Date()).getTime();
					putWord(settings.wordList[i][0], settings.wordList[i][1]);
					if (exceedTime()) {
						clearTimeout(timer);
						settings.abort();
					}
					i++;
				},
				settings.wait
			);
			$(this).data('wordCloud-timer', timer);
		});
	}
})(jQuery);
