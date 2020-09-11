'use strict';

module('Basics');

var testElement;

test('Test runs without any extra parameters.', function() {
  var options = getTestOptions();
  WordCloud(setupTest('default-testing-config'), options);
});

test('Empty list results no output.', function() {
  var options = getTestOptions();
  options.list = [];

  WordCloud(setupTest('empty'), options);
});

function createTestHtmlElement() {
  if (testElement) {
    document.getElementsByTagName('body')[0].removeChild(testElement);
  }
  testElement = document.createElement('div');
  testElement.id = 'test-span';
  testElement.style.width = '300px';
  testElement.style.height = '300px';
  document.getElementsByTagName('body')[0].appendChild(testElement);

  return testElement;
}

test('shrinkToFit shrinks words to fit grid', function() {
  var testElement = createTestHtmlElement();
  var options = getTestOptions();
  options.drawOutOfBound = false;
  options.shrinkToFit = true;
  options.weightFactor = 15;

  testElement.addEventListener('wordcloudstop', function () {
    ok(testElement.innerText.indexOf(options.list[0][0]) !== -1, 'Word ' + options.list[0][0] + ' should be rendered.');
    start();
  });

  stop();
  WordCloud(testElement, options);
});