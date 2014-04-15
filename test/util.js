'use strict';

// Introduce a timeout
QUnit.config.testTimeout = 10*1E3;

// the list array will be generated here.
var list = (function () {
  var string = 'Grumpy wizards make toxic brew for the evil Queen and Jack';

  var list = [];
  string.split(' ').forEach(function(word) {
    list.push([word, word.length * 5]);
  });

  return list;
})();

// Remove all randomness factor in the wordcloud.js,
// make sure we could compare the output.
var getTestOptions = function getTestOptions() {
  return {
    shuffle: false,
    rotateRatio: 0,
    color: '#000',
    fontFamily: 'sans-serif',
    list: list
  };
};

// Get the reference image from localStorage
var getRefImage = function getRefImage(id, callback) {
  var str = window.asyncStorage.getItem('wordcloud-js-' + id, callback);
};

// Save the reference image to localStorage
var saveRefImage = function saveRefImage(id, canvas, callback) {
  var canvasData = canvas.getContext('2d')
                    .getImageData(0, 0, canvas.width, canvas.height).data;

  window.asyncStorage.setItem('wordcloud-js-' + id, canvasData, callback);
};

// Save the current test details to currentTestDetails
var currentTestDetails;
QUnit.testStart(function testStarted(details) {
  currentTestDetails = details;
});

// Find the list item in the qunit output to append the element.
var appendToCurrentTestOutput = function appendToCurrentTestOutput(el) {
  if (!currentTestDetails)
    return;

  var names = document.querySelectorAll('#qunit-tests span.test-name');
  Array.prototype.some.call(names, function findNames(span) {
    if (currentTestDetails.name === span.textContent
      && currentTestDetails.module === span.previousElementSibling.textContent) {
      span.parentNode.parentNode.appendChild(el);
      return true;
    }
    return false;
  });
};

// Create a canvas element, append to test log,
// run the callback when it is being drawn by wordcloud.js
var setupTestCanvas = function setupTestCanvas(refImageId, callback) {
  var canvas = document.createElement('canvas');
  canvas.className = 'ref-canvas';
  canvas.width = 300;
  canvas.height = 300;
  canvas.addEventListener('wordcloudstop', function wordcloudstopped() {
    canvas.removeEventListener('wordcloudstop', wordcloudstopped);
    canvas.addEventListener('click', function clicked() {
      if (!window.confirm('Are you sure you want to keep this output' +
                          ' as the reference image?')) {
        return;
      }
      saveRefImage(refImageId, canvas);
    });
    canvas.save = function() {
      saveRefImage(refImageId, canvas);
    };
    callback();
  });
  appendToCurrentTestOutput(canvas);
  canvas.title = 'Test result';
  return canvas;
};

// Compare the canvas with reference image pixel-by-pixel,
// and return the result to callback.
var compareCanvas = function compareCanvas(canvas, refImgData, callback) {
  if (!refImgData || refImgData.length !== canvas.width * canvas.height * 4) {
    callback(false);
    return;
  }

  var refCanvas = document.createElement('canvas');
  refCanvas.className = 'reference';
  refCanvas.title = 'Reference';
  appendToCurrentTestOutput(refCanvas);

  refCanvas.width = canvas.width;
  refCanvas.height = canvas.height;
  var refCtx = refCanvas.getContext('2d');
  var refImageData = refCtx.createImageData(canvas.width, canvas.height);
  var i = refImgData.length;
  while(i--) {
    refImageData.data[i] = refImgData[i];
  }

  refCtx.putImageData(refImageData, 0, 0);

  var canvasData = canvas.getContext('2d')
                    .getImageData(0, 0, canvas.width, canvas.height).data;

  var i = canvasData.length;
  while(i--) {
    if (refImgData[i] !== canvasData[i]) {
      callback(false, refCanvas);
      return;
    }
  }
  callback(true);
};

var SAVEMODE = false;
if (window.location.search.indexOf('savemode=true') !== -1) {
  SAVEMODE = true;
}

var ALLOWNOREF = false;
if (window.location.search.indexOf('allownoref=true') !== -1) {
  ALLOWNOREF = true;
}

// Wrapper to functions above. Basic scaffold for all the simple tests.
var setupTest = function setupTest(refImageId) {
  stop();

  var el = document.getElementById('save-all');
  if (!el) {
    var container = document.getElementById('qunit-testrunner-toolbar');
    var buttonEl = document.createElement('button');
    buttonEl.type = 'button';
    buttonEl.id = 'save-all';
    buttonEl.textContent = 'Save all reference images';
    container.appendChild(buttonEl);
    buttonEl.addEventListener('click', function clicked() {
      if (!window.confirm('Are you sure you want to keep all the output' +
                          ' as the reference image?')) {
        return;
      }
      var refCanvases = document.getElementsByClassName('ref-canvas');
      for (var i = 0; i < refCanvases.length; i++) {
        refCanvases[i].save();
      }
    });

  }

  var canvas = setupTestCanvas(refImageId, function canvasDrawn() {
    if (SAVEMODE) {
      canvas.save();

      ok(true, 'Canvas output has been saved as reference images.');
      start();

      return;
    }

    getRefImage(refImageId, function gotRefImage(refImgData) {
      if (!refImgData && ALLOWNOREF) {
        ok(true, 'Skip the test with ALLOWNOREF.');
        console.log(
          'Skip the test with ALLOWNOREF. Please manually confirm \n' +
          'the test result of "' + currentTestDetails.name + '"');
        console.log(canvas.toDataURL());

        start();

        return;
      }

      ok(refImgData,
         'Reference image found; click on the canvas to save it as the ' +
         'new refernece image in localStorage.');
      compareCanvas(canvas, refImgData, function canvasCompared(value, refCanvas) {
        ok(value, 'The canvas output is equal to the reference image.');
        if (!value) {
          console.log('Test name: "' + currentTestDetails.name + '"');
          console.log('The reference image:');
          console.log(refCanvas.toDataURL());
          console.log('The output:');
          console.log(canvas.toDataURL());
        }

        start();
      });
    });
  });
  return canvas;
};
