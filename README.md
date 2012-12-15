# wordcloud.js

Create a tag cloud/[Wordle](http://www.wordle.net/) presentation on a HTML5 canvas element.

This library is a spin-off project from [HTML5 Word Cloud](https://github.com/timdream/wordcloud).

## Simple usage

Load `wordcloud.js` script to the web page, and run:

    WordCloud(document.getElementById('my_canvas'), { wordList: list } );

where `list` is an array that look like this: `[['foo', 12], ['bar', 6]]`.

Options available, see the source code for information for now.

## Algorithm

wordcloud.js reads back the pixels of the canvas every time it draw a new word, and try to find a place to fit the next word that is closest to the start point.

## Testing

Semi-automatic tests are available with [QUnit](http://qunitjs.com/).

Unfortunately, even with all the randomness options disabled,
the output will still depend on the browser and the font rendering of the OS
(and ClearType settings!). Hence, I cannot supply a set of reference images.
The tests won't pass unless you manually confirm them in your environment first --
subsequent tests are considered passed if the reference image exists
(saved when you confirm the output) and the output is identical to it pixel-by-pixel.
