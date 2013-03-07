'use strict';

module('Basics');

test('Test runs without any extra parameters.', function() {
  var options = getTestOptions();
  WordCloud(setupTest('default-testing-config'), options);
});

test('Empty list results no output.', function() {
  var options = getTestOptions();
  options.list = [];

  WordCloud(setupTest('empty'), options);
});
