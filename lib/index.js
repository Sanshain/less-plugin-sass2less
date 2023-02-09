
let sassToLess = function() {}


let replacements = function () {


  let results = (function() {

      let fs = require('fs')

      let filenames = () => {
      
        /** MACRO `fs.readdirSync, __dirname +` */
                    
        let dir = __dirname + '/replacements/';

        return fs.readdirSync(dir)

        /** END_MACRO */

      }
    
      /**
       * @type {Array<{order: number, replacement: Function, pattern: RegExp}>}
       */
      return filenames.map(function (filename) {
        return require(dir + filename)
      })    

  })()
  

  return results.sort((ex1, ex2) => ex1.order - ex2.order)
}

replacements()


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
