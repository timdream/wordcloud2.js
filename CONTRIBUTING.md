# Contribute to the project

Thank you for your interest in helping out the project!
Unfortunately, a few life events have prevented me from catching up feature requests, and answer questions.
Your help is very much appreciated, whether on clarifying issues or actual code contributions.

Please don't file a duplicate issue if it's mentioned in the roadmap below.

## Roadmap

### Virtual canvas: never miss a word that's too big and forget about `weightFactor`
The current implementation will skip the word that can't be fit into the canvas.
This is a faulty design and should be corrected.
It can be fixed by laying out the words on a boundless virtual canvas, and scale the entire virtual canvas until it fits into the visual canvas.
The project, however, is not trivial.

### Play well with modern build systems

The script comes with a small UMD and it worked well back in the days, but no any more.
It's better to figure out a way allowing the script to be imported as a module and also `<script src>`.

### Better heuristics on interaction properties

This is the top asked question of the project.
We would need a better API than a callback property that asks people to draw the focus themselves.

### More API features

I would like to redesign the API to achieve the following two goals:

* Pluggable and replaceable: Being able to replace the part, like the text metrics measurement, or the loop, with some external code when the user wants to.
* Overall type alignment: allow all properties, when applicable, accept a callback or callbacks; allow special casing in the word list for every property.

I would like to refrain from implementing any non-trivial feature until the above design goals are met, in the interest of keeping the file size manageable.

### Build script & unit test infrastrture

`wordcloud2.js` should be built from manageable, and testable source chunks.
