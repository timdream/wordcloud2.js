function readPixels (img, options = {}) {
  const backgroundColor = d3.rgb(options.backgroundColor)
  backgroundColor.opacity = Math.round(backgroundColor.opacity * 255)
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = options.width
  maskCanvas.height = options.height
  var ctx = maskCanvas.getContext('2d')
  ctx.drawImage(img,
    0, 0, img.width, img.height,
    0, 0, options.width, options.height)

  var imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
  var newImageData = ctx.createImageData(imageData)

  for (var i = 0; i < imageData.data.length; i += 4) {
    var tone = imageData.data[i] +
      imageData.data[i + 1] +
      imageData.data[i + 2]
    var alpha = imageData.data[i + 3]

    newImageData.data[i] = backgroundColor.r
    newImageData.data[i + 1] = backgroundColor.g
    newImageData.data[i + 2] = backgroundColor.b
    if (alpha < 128 || tone > 128 * 3) {
      // Area not to draw
      newImageData.data[i + 3] = backgroundColor.opacity ? (backgroundColor.opacity - 1) : 0
    } else {
      newImageData.data[i + 3] = backgroundColor.opacity
    }
  }

  ctx.putImageData(newImageData, 0, 0)
  return maskCanvas
}

function createMaskCanvas (options = {}) {
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  return new Promise((resolve) => {
    img.onload = () => resolve(readPixels(img, options))
    img.src = options.url
  })
}
