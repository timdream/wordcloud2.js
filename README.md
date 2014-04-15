# [wordcloud2.js](http://timdream.org/wordcloud2.js/)

Create a tag cloud/[Wordle](http://www.wordle.net/) presentation on 2D canvas or HTML.

This library is a spin-off project from [HTML5 Word Cloud](https://github.com/timdream/wordcloud).

## Simple usage

Load `wordcloud.js` script to the web page, and run:

    WordCloud(document.getElementById('my_canvas'), { list: list } );

where `list` is an array that look like this: `[['foo', 12], ['bar', 6]]`.

Options available, see [API documentation](./API.md) for detail.

## Algorithm

Before putting each word on the canvas, it is drawn on a separate canvas to read back the pixels to record is drawn spaces.
With the information, wordcloud.js will then try to find a place to fit the word that is closest to the start point.

## Testing

Tests are available with [QUnit](http://qunitjs.com/) and `grunt`.
To setup environment for testing, run `npm install` and manually install [SlimerJS](http://slimerjs.org/) of your platform.

Use `grunt test` to ensure all options can be set without JavaScript error.
Use `grunt compare --base-commit=master` to compare your proposed fix with `master` branch.
