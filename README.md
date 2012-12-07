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

I have no idea how to automate the tests since the result a image.
A demo page is written for manual testing and demo available configurations.
It might be possible to create indentical images by turning off all the randomness stuff and compare the image pixel by pixel.
