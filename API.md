# wordcloud2.js APIs

## Feature detection

    WordCloud.isSupported

will evaluates to `false` if the browser doesn't supply necessary functionalities for wordcloud2.js to run.

## Minimum font size

Some browsers come with restrictions on minimum font size preference on, and the preference will also impact canvas.
wordcloud2.js works around it by scaling the canvas, but you may be interested to know value of the preference. The value detected is accessible at

	WordCloud.miniumFontSize

## Usage

    WordCloud(canvas, options);

`canvas` is the DOM Element of the canvas, i.e. `document.getElementById('my_canvas')` or `$('#my_canvas')[0]` in jQuery.
It can be also an array of DOM Elements. If a `<canvas>` element is passed, Word Cloud would generate an image on it; if it's some other element, Word Cloud would create `<span>` elements and fill it.

Depend on the applicaiton, you may want to create an image (high fidelity but interaction is limited) or create the "cloud" with DOM to do further styling.

## Option

Available options as the property of the `options` object are:

### Presentation

* `list`: List of words/text to paint on the canvas in a 2-d array, in the form of `[word, size]`, e.g. `[['foo', 12], ['bar', 6]]`.
* `fontFamily`: font to use.
* `fontWeight`: font weight to use, e.g. `normal`, `bold` or `600`
* `color`: color of the text, can be any CSS color, or a `callback(word, weight, fontSize, distance, theta)` specifies different color for each item in the list.
  You may also specify colors with built-in keywords: `random-dark` and `random-light`.
* `minSize`: minimum font size to draw on the canvas.
* `weightFactor`: function to call or number to multiply for `size` of each word in the list.
* `clearCanvas`: paint the entire canvas with background color and consider it empty before start.
* `backgroundColor`: color of the background.

### Dimension

* `gridSize`: size of the grid in pixels for marking the availability of the canvas — the larger the grid size, the bigger the gap between words.
* `origin`: origin of the “cloud” in `[x, y]`.

### Mask

* `drawMask`: visualize the grid by draw squares to mask the drawn areas.
* `maskColor`: color of the mask squares.
* `maskGapWidth`: width of the gaps between mask squares.

### Timing

* `wait`: Wait for *x* milliseconds before start drawn the next item using `setTimeout`.
* `abortThreshold`: If the call with in the loop takes more than *x* milliseconds (and blocks the browser), abort immediately.
* `abort`: callback function to call when abort.

### Rotation

* `minRotation`: If the word should rotate, the minimum rotation (in rad) the text should rotate.
* `maxRotation`: If the word should rotate, the maximum rotation (in rad) the text should rotate. Set the two value equal to keep all text in one angle.

### Randomness

* `shuffle`: Shuffle the points to draw so the result will be different each time for the same list and settings.
* `rotateRatio`: Probability for the word to rotate. Set the number to 1 to always rotate.

### Shape

* `shape`: The shape of the "cloud" to draw. Can be any polar equation represented as a callback function, or a keyword present.
Available presents are `circle` (default), `cardioid` (apple or heart shape curve, the most known polar equation), `diamond` (alias of `square`), `triangle-forward`, `triangle`, (alias of `triangle-upright`, `pentagon`, and `star`.
* `ellipticity`: degree of "flatness" of the shape wordcloud2.js should draw.

### Interactive

* `hover`: callback to call when the cursor enters or leaves a region occupied by a word. The callback will take arugments `callback(item, dimension, event)`, where `event` is the original `mousemove` event.
* `click`: callback to call when the user clicks on a word. The callback will take arugments `callback(item, dimension, event)`, where `event` is the original `click` event.

## Events

You can listen to those custom DOM events filed from the canvas element, instead of using callbacks for taking the appropriate action.
Cancel the first two events causes the operation to stop immediately.

* `wordcloudstart`
* `wordclouddrawn`
* `wordcloudstop`
* `wordcloudabort`

wordcloud2.js itself will stop at `wordcloudstart` event.
