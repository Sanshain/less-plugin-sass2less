
/**
 * @type {new () => {process: (src: string, extra: object) => string}}
 */
let sassToLess = function() {}


let replacements = function () {


  let results = (function() {
      
    /** MACRO `import, __dirname, let fs = require('fs')` */
    
      let fs = require('fs')
      let dir = __dirname + '/replacements/'

      let filenames = fs.readdirSync(dir)

      /**
       * @type {Array<{order: number, replacement: Function, pattern: RegExp}>}
       */
      return filenames.map(function (filename) {
        return import(dir + filename)
      })
    
    /** END_MACRO */

  })()
  

  return results.sort((ex1, ex2) => ex1.order - ex2.order)
}


sassToLess.prototype = {
  process: function(src, extra) {
    // skip if it's not a sass/scss file
    if (extra.fileInfo && !/\.s[a|c]ss/i.test(extra.fileInfo.filename)) {
      return src
    }

    // process file
    return [src].concat(replacements()).reduce(function(source, item) {
      return source.replace(item.pattern, item.replacement)
    })
  }
}

module.exports = sassToLess
