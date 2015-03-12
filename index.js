'use strict';

var examples = {
  'web-tech': {
    list: '26 Web Technologies\n20 HTML\n20 <canvas>\n' +
          '15 CSS\n15 JavaScript\n12 Document Object Model\n12 <audio>\n12 <video>\n12 Web Workers\n12 XMLHttpRequest\n12 SVG\n' +
          '9 JSON.parse()\n9 Geolocation\n9 data attribute\n9 transform\n9 transition\n9 animation\n' +
          '7 setTimeout\n7 @font-face\n7 Typed Arrays\n7 FileReader API\n7 FormData\n7 IndexedDB\n' +
          '7 getUserMedia()\n7 postMassage()\n7 CORS\n6 strict mode\n6 calc()\n6 supports()\n' +
          '6 media queries\n6 full screen\n6 notification\n6 orientation\n6 requestAnimationFrame\n' +
          '5 border-radius\n5 box-sizing\n5 rgba()\n5 text-shadow\n5 box-shadow\n5 flexbox\n5 viewpoint',
    option: '{\n' +
            '  gridSize: 18,\n' +
            '  weightFactor: 3,\n' +
            '  fontFamily: \'Finger Paint, cursive, sans-serif\',\n' +
            '  color: \'#f0f0c0\',\n' +
            '  hover: window.drawBox,\n' +
            '  click: function(item) {\n' +
            '    alert(item[0] + \': \' + item[1]);\n' +
            '  },\n' +
            '  backgroundColor: \'#001f00\'\n' +
            '}',
    fontCSS: 'https://fonts.googleapis.com/css?family=Finger+Paint'
  },
  'les-miz': {
    list: '30 Les Misérables\n20 Victor Hugo\n15 Jean Valjean\n15 Javert\n15 Fantine\n' +
          '15 Cosette\n12 Éponine\n12 Marius\n12 Enjolras\n10 Thénardiers\n10 Gavroche\n' +
          '10 Bishop Myriel\n10 Patron-Minette\n10 God\n8 ABC Café\n8 Paris\n8 Digne\n' +
          '8 Elephant of the Bastille\n5 silverware\n5 Bagne of Toulon\n5 loaf of bread\n' +
          '5 Rue Plumet\n5 revolution\n5 barricade\n4 sewers\n4 Fex urbis lex orbis',
    option: '{\n' +
          '  gridSize: 18,\n' +
          '  weightFactor: 3,\n' +
          '  fontFamily: \'Average, Times, serif\',\n' +
          '  color: function() {\n' +
          '    return ([\'#d0d0d0\', \'#e11\', \'#44f\'])[Math.floor(Math.random() * 3)]\n' +
          '  },\n' +
          '  backgroundColor: \'#333\'\n' +
          '}',
    fontCSS: 'https://fonts.googleapis.com/css?family=Average'
  },
  'red-chamber': {
    list: '6 紅樓夢\n3 賈寶玉\n3 林黛玉\n3 薛寶釵\n3 王熙鳳\n3 李紈\n3 賈元春\n3 賈迎春\n' +
          '3 賈探春\n3 賈惜春\n3 秦可卿\n3 賈巧姐\n3 史湘雲\n3 妙玉\n2 賈政\n2 賈赦\n' +
          '2 賈璉\n2 賈珍\n2 賈環\n2 賈母\n2 王夫人\n2 薛姨媽\n2 尤氏\n2 平兒\n2 鴛鴦\n' +
          '2 襲人\n2 晴雯\n2 香菱\n2 紫鵑\n2 麝月\n2 小紅\n2 金釧\n2 甄士隱\n2 賈雨村',
    option: '{\n' +
            '  gridSize: 8,\n' +
            '  weightFactor: 16,\n' +
            '  fontFamily: \'Hiragino Mincho Pro, serif\',\n' +
            '  color: \'random-dark\',\n' +
            '  backgroundColor: \'#f0f0f0\',\n' +
            '  rotateRatio: 0\n' +
            '}'
  },
  'quick-fox': {
    list: '2 The\n2 quick\n3 brown\n5 fox\n3 jumps\n3 over\n3.5 the\n3 lazy\n6 dog\n',
    option: '{\n' +
            '  gridSize: 16,\n' +
            '  weightFactor: 16,\n' +
            '  origin: [90, 0],\n' +
            '  fontFamily: \'Times, serif\',\n' +
            '  color: \'random-light\',\n' +
            '  backgroundColor: \'#000\',\n' +
            '  shuffle: false,\n' +
            '  rotateRatio: 0\n' +
            '}',
    width: 180,
    height: 480
  },
  'love' : {
    list: (function generateLoveList() {
      var list = ['12 Love'];
      var nums = [5, 4, 3, 2, 2];
      // This list of the word "Love" in language of the world was taken from
      // the Language links of entry "Love" in English Wikipedia, with duplicate
      // spelling removed.
      var words = ('Liebe,ፍቅር,Lufu,حب,Aimor,Amor,Heyran,ভালোবাসা,Каханне,Любоў,Любов,བརྩེ་དུང་།,' +
        'Ljubav,Karantez,Юрату,Láska,Amore,Cariad,Kærlighed,Armastus,Αγάπη,Amo,Amol,Maitasun,' +
        'عشق,Pyar,Amour,Leafde,Gràdh,愛,爱,પ્રેમ,사랑,Սեր,Ihunanya,Cinta,ᑕᑯᑦᓱᒍᓱᑉᐳᖅ,Ást,אהבה,' +
        'ಪ್ರೀತಿ,სიყვარული,Махаббат,Pendo,Сүйүү,Mīlestība,Meilė,Leefde,Bolingo,Szerelem,' +
        'Љубов,സ്നേഹം,Imħabba,प्रेम,Ái,Хайр,အချစ်,Tlazohtiliztli,Liefde,माया,मतिना,' +
        'Kjærlighet,Kjærleik,ପ୍ରେମ,Sevgi,ਪਿਆਰ,پیار,Miłość,Leevde,Dragoste,' +
        'Khuyay,Любовь,Таптал,Dashuria,Amuri,ආදරය,Ljubezen,Jaceyl,خۆشەویستی,Љубав,Rakkaus,' +
        'Kärlek,Pag-ibig,காதல்,ప్రేమ,ความรัก,Ишқ,Aşk,محبت,Tình yêu,Higugma,ליבע').split(',');

      nums.forEach(function(n) {
        words.forEach(function(w) {
          list.push(n + ' ' + w);
        });
      });

      return list.join('\n');
    })(),
    option: '{\n' +
      '  gridSize: Math.round(16 * $(\'#canvas\').width() / 1024),\n' +
      '  weightFactor: function (size) {\n' +
      '    return Math.pow(size, 2.3) * $(\'#canvas\').width() / 1024;\n' +
      '  },\n' +
      '  fontFamily: \'Times, serif\',\n' +
      '  color: function (word, weight) {\n' +
      '    return (weight === 12) ? \'#f02222\' : \'#c09292\';\n' +
      '  },\n' +
      '  rotateRatio: 0.5,\n' +
      '  backgroundColor: \'#ffe0e0\'\n' +
      '}'
  }
};

jQuery(function($) {
  var $form = $('#form');
  var $canvas = $('#canvas');
  var $htmlCanvas = $('#html-canvas');
  var $canvasContainer = $('#canvas-container');
  var $loading = $('#loading');

  var $list = $('#input-list');
  var $options = $('#config-option');
  var $width = $('#config-width');
  var $height = $('#config-height');
  var $dppx = $('#config-dppx');
  var $css = $('#config-css');
  var $webfontLink = $('#link-webfont');

  if (!WordCloud.isSupported) {
    $('#not-supported').prop('hidden', false);
    $form.find('textarea, input, select, button').prop('disabled', true);
    return;
  }

  var $box = $('<div id="box" hidden />');
  $canvasContainer.append($box);
  window.drawBox = function drawBox(item, dimension) {
    if (!dimension) {
      $box.prop('hidden', true);

      return;
    }

    var dppx = $dppx.val();

    $box.prop('hidden', false);
    $box.css({
      left: dimension.x / dppx + 'px',
      top: dimension.y / dppx + 'px',
      width: dimension.w / dppx + 'px',
      height: dimension.h / dppx + 'px'
    });
  };

  // Update the default value if we are running in a hdppx device
  if (('devicePixelRatio' in window) &&
      window.devicePixelRatio !== 1) {
    $dppx.val(window.devicePixelRatio);
  }

  $canvas.on('wordcloudstop', function wordcloudstopped(evt) {
    $loading.prop('hidden', true);
  });

  $form.on('submit', function formSubmit(evt) {
    evt.preventDefault();

    changeHash('');
  });

  $('#btn-save').on('click', function save(evt) {
    var url = $canvas[0].toDataURL();
    if ('download' in document.createElement('a')) {
      this.href = url;
    } else {
      evt.preventDefault();
      alert('Please right click and choose "Save As..." to save the generated image.');
      window.open(url, '_blank', 'width=500,height=300,menubar=yes');
    }
  });

  $('#btn-canvas').on('click', function showCanvas(evt) {
    $canvas.removeClass('hide');
    $htmlCanvas.addClass('hide');
    $('#btn-canvas').prop('disabled', true);
    $('#btn-html-canvas').prop('disabled', false);
  });

  $('#btn-html-canvas').on('click', function showCanvas(evt) {
    $canvas.addClass('hide');
    $htmlCanvas.removeClass('hide');
    $('#btn-canvas').prop('disabled', false);
    $('#btn-html-canvas').prop('disabled', true);
  });

  $('#btn-canvas').prop('disabled', true);
  $('#btn-html-canvas').prop('disabled', false);

  var $examples = $('#examples');
  $examples.on('change', function loadExample(evt) {
    changeHash(this.value);

    this.selectedIndex = 0;
    $examples.blur();
  });

  var run = function run() {
    $loading.prop('hidden', false);

    // Load web font
    $webfontLink.prop('href', $css.val());

    // devicePixelRatio
    var devicePixelRatio = parseFloat($dppx.val());

    // Set the width and height
    var width = $width.val() ? $width.val() : $('#canvas-container').width();
    var height = $height.val() ? $height.val() : Math.floor(width * 0.65);
    var pixelWidth = width;
    var pixelHeight = height;

    if (devicePixelRatio !== 1) {
      $canvas.css({'width': width + 'px', 'height': height + 'px'});

      pixelWidth *= devicePixelRatio;
      pixelHeight *= devicePixelRatio;
    } else {
      $canvas.css({'width': '', 'height': '' });
    }

    $canvas.attr('width', pixelWidth);
    $canvas.attr('height', pixelHeight);

    $htmlCanvas.css({'width': pixelWidth + 'px', 'height': pixelHeight + 'px'});

    // Set the options object
    var options = {};
    if ($options.val()) {
      options = (function evalOptions() {
        try {
          return eval('(' + $options.val() + ')');
        } catch (error) {
          alert('The following Javascript error occurred in the option definition; all option will be ignored: \n\n' +
            error.toString());
          return {};
        }
      })();
    }

    // Set devicePixelRatio options
    if (devicePixelRatio !== 1) {
      if (!('gridSize' in options)) {
        options.gridSize = 8;
      }
      options.gridSize *= devicePixelRatio;

      if (options.origin) {
        if (typeof options.origin[0] == 'number')
          options.origin[0] *= devicePixelRatio;
        if (typeof options.origin[1] == 'number')
          options.origin[1] *= devicePixelRatio;
      }

      if (!('weightFactor' in options)) {
        options.weightFactor = 1;
      }
      if (typeof options.weightFactor == 'function') {
        var origWeightFactor = options.weightFactor;
        options.weightFactor =
          function weightFactorDevicePixelRatioWrap() {
            return origWeightFactor.apply(this, arguments) * devicePixelRatio;
          };
      } else {
        options.weightFactor *= devicePixelRatio;
      }
    }

    // Put the word list into options
    if ($list.val()) {
      var list = [];
      $.each($list.val().split('\n'), function each(i, line) {
        if (!$.trim(line))
          return;

        var lineArr = line.split(' ');
        var count = parseFloat(lineArr.shift()) || 0;
        list.push([lineArr.join(' '), count]);
      });
      options.list = list;
    }

    // All set, call the WordCloud()
    // Order matters here because the HTML canvas might by
    // set to display: none.
    WordCloud([$canvas[0], $htmlCanvas[0]], options);
  };

  var loadExampleData = function loadExampleData(name) {
    var example = examples[name];

    $options.val(example.option || '');
    $list.val(example.list || '');
    $css.val(example.fontCSS || '');
    $width.val(example.width || '');
    $height.val(example.height || '');
  };

  var changeHash = function changeHash(name) {
    if (window.location.hash === '#' + name ||
        (!window.location.hash && !name)) {
      // We got a same hash, call hashChanged() directly
      hashChanged();
    } else {
      // Actually change the hash to invoke hashChanged()
      window.location.hash = '#' + name;
    }
  };

  var hashChanged = function hashChanged() {
    var name = window.location.hash.substr(1);
    if (!name) {
      // If there is no name, run as-is.
      run();
    } else if (name in examples) {
      // If the name matches one of the example, load it and run it
      loadExampleData(name);
      run();
    } else {
      // If the name doesn't match, reset it.
      window.location.replace('#');
    }
  }

  $(window).on('hashchange', hashChanged);

  if (!window.location.hash ||
    !(window.location.hash.substr(1) in examples)) {
    // If the initial hash doesn't match to any of the examples,
    // or it doesn't exist, reset it to #love
    window.location.replace('#love');
  } else {
    hashChanged();
  }
});
