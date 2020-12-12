# wordcloud2.js [![npm version](https://badge.fury.io/js/wordcloud.svg)](http://badge.fury.io/js/wordcloud)

Create a tag cloud/[Wordle](http://www.wordle.net/) presentation on 2D canvas or HTML.

This library is a spin-off project from [HTML5 Word Cloud](https://github.com/timdream/wordcloud).

**Visit the [demo page](https://timdream.org/wordcloud2.js/)**

## Installation

    npm install wordcloud

## Simple usage

Download the latest `wordcloud2.js` file from the `src` folder in this repository.

Load `wordcloud2.js` script to the web page, and run:

    WordCloud(document.getElementById('my_canvas'), { list: list } );

where `list` is an array that look like this: `[['foo', 12], ['bar', 6]]`.

Options available, see [API documentation](./API.md) for detail.

## Contact & help

Please read through the API documentation and [CONTRIBUTING.md](./CONTRIBUTING.md) before filing an issue or contact me via e-mail.

## Algorithm

Before putting each word on the canvas, it is drawn on a separate canvas to read back the pixels to record is drawn spaces.
With the information, wordcloud.js will then try to find a place to fit the word that is closest to the start point.

## Testing

Tests are available with [QUnit](https://qunitjs.com/) and `grunt`.
To setup environment for testing, run `npm install` and manually install [SlimerJS](https://slimerjs.org/) of your platform.

Use `grunt test` to ensure all options can be set without JavaScript error.

Use `grunt compare --base-commit=gh-pages` to compare your proposed fix with `gh-pages` branch.

## Acknowledgement

The developer would like to thank [Chad Jensen](mailto:scubaaddiction@gmail.com) for sponsoring the work on image masking on the demo page.
