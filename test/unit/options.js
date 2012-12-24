'use strict';

module('Options');

test('gridSize can be set', function() {
  var options = getTestOptions();
  options.gridSize = 15;

  WordCloud(setupTest('gridSize'), options);
});

test('ellipticity can be set', function() {
  var options = getTestOptions();
  options.ellipticity = 1.5;

  WordCloud(setupTest('ellipticity'), options);
});

test('center can be set', function() {
  var options = getTestOptions();
  options.center = [300, 0];

  WordCloud(setupTest('center'), options);
});

test('minSize can be set', function() {
  var options = getTestOptions();
  options.minSize = 10;

  WordCloud(setupTest('minSize'), options);
});

test('rotateRatio can be set', function() {
  var options = getTestOptions();
  options.rotateRatio = 1;

  WordCloud(setupTest('rotateRatio'), options);
});

test('drawMask can be set', function() {
  var options = getTestOptions();
  options.drawMask = true;

  WordCloud(setupTest('drawMask'), options);
});

test('maskColor can be set', function() {
  var options = getTestOptions();
  options.drawMask = true;
  options.maskColor = 'rgba(0, 0, 255, 0.8)';

  WordCloud(setupTest('maskColor'), options);
});

test('backgroundColor can be set', function() {
  var options = getTestOptions();
  options.backgroundColor = 'rgb(0, 0, 255)';

  WordCloud(setupTest('backgroundColor'), options);
});

test('semi-transparent backgroundColor can be set', function() {
  var options = getTestOptions();
  options.backgroundColor = 'rgba(0, 0, 255, 0.3)';

  WordCloud(setupTest('semi-transparent-backgroundColor'), options);
});

test('weightFactor can be set', function() {
  var options = getTestOptions();
  options.weightFactor = 2;

  WordCloud(setupTest('weightFactor'), options);
});

test('weightFactor can be set as a function', function() {
  var options = getTestOptions();
  options.weightFactor = function (w) { return Math.sqrt(w); };

  WordCloud(setupTest('weightFactor-as-function'), options);
});

test('wordColor can be set as a function', function() {
  var options = getTestOptions();
  options.wordColor = function (word, weight, fontSize, radius, theta) {
    if (theta < 2*Math.PI/3) {
      return '#600';
    } else if (theta < 2*Math.PI*2/3) {
      return '#060';
    } else {
      return '#006';
    }
  };

  WordCloud(setupTest('wordColor-as-function'), options);
});

test('shape can be set to circle', function() {
  var options = getTestOptions();
  options.shape = 'circle';

  WordCloud(setupTest('circle'), options);
});

test('shape can be set to cardioid', function() {
  var options = getTestOptions();
  options.shape = 'cardioid';

  WordCloud(setupTest('cardioid'), options);
});

test('shape can be set to diamond', function() {
  var options = getTestOptions();
  options.shape = 'diamond';

  WordCloud(setupTest('diamond'), options);
});

test('shape can be set to triangle', function() {
  var options = getTestOptions();
  options.shape = 'triangle';

  WordCloud(setupTest('triangle'), options);
});

test('shape can be set to triangle-forward', function() {
  var options = getTestOptions();
  options.shape = 'triangle-forward';

  WordCloud(setupTest('triangle-forward'), options);
});

test('shape can be set to pentagon', function() {
  var options = getTestOptions();
  options.shape = 'pentagon';

  WordCloud(setupTest('pentagon'), options);
});

test('shape can be set to star', function() {
  var options = getTestOptions();
  options.shape = 'star';

  WordCloud(setupTest('star'), options);
});

test('shape can be set to a given polar equation', function() {
  var options = getTestOptions();
  options.shape = function (theta) {
    return theta / (2 * Math.PI);
  };

  WordCloud(setupTest('shape-equation'), options);
});
