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

test('origin can be set', function() {
  var options = getTestOptions();
  options.origin = [300, 0];

  WordCloud(setupTest('origin'), options);
});

test('minSize can be set', function() {
  var options = getTestOptions();
  options.minSize = 10;

  WordCloud(setupTest('minSize'), options);
});

test('rotation can be set and locked', function() {
  var options = getTestOptions();
  options.rotateRatio = 1;
  options.minRotation = options.maxRotation = Math.PI / 6;

  WordCloud(setupTest('rotation'), options);
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

test('color can be set as a function', function() {
  var options = getTestOptions();
  options.color = function (word, weight, fontSize, radius, theta) {
    if (theta < 2*Math.PI/3) {
      return '#600';
    } else if (theta < 2*Math.PI*2/3) {
      return '#060';
    } else {
      return '#006';
    }
  };

  WordCloud(setupTest('color-as-function'), options);
});

test('fontWeight can be set as a function', function() {
  var options = getTestOptions();
  options.fontWeight = function (word, weight, fontSize) {
    if (weight > 15) {
      return 'bold';
    } else {
      return 'normal'
    }
  };

  WordCloud(setupTest('font-weight-as-function'), options);
});

test('classes can be set as a function', function() {
  var options = getTestOptions();
  options.classes = function (word, weight, fontSize, radius, theta) {
    if (theta < 2*Math.PI/3) {
      return 'class1';
    } else if (theta < 2*Math.PI*2/3) {
      return 'class2';
    } else {
      return 'class3';
    }
  };

  WordCloud(setupTest('classes-as-function'), options);
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
