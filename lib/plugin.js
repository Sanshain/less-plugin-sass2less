var Converter = require('./index.js')

const plugin = {
  install: (less, pluginManager) => {
    pluginManager.addPreProcessor(new Converter(), 2000)
  },
  minVersion: [2, 7, 1]
}

globalThis.LESS_PLUGINS = [plugin].concat(globalThis.LESS_PLUGINS || [])

console.log('sass2less initialized');

module.exports = plugin