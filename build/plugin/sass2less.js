var LessCompiler = (function () {
  'use strict';

  let sassToLess = function () {};

  let replacements = function () {
    let results = (function () {
      return [
        // TODO: mimic LESS's &:extend(x all)
        {
          pattern: /@extend\s\.([a-zA-Z-_]*)/gi,
          replacement: "&:extend(.$1)",
          order: 2,
        },
        {
          pattern: /@for\s([\w$]+)\sfrom\s([\w$]+)\s(through|to)\s(.*)\s\{((?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*)\}/gi,
          replacement: function (match, iterator, initial, through, to, body) {
            let operator = through === "through" ? "<=" : "<";
            return (
              `.for(${iterator}: ${initial}) when (${iterator} ${operator} ${to}) {` +
              `${body.replace(new RegExp("(?:#{)?" + iterator + "}?", "gi"), "@{" + iterator + "}")}` +
              `  .for((${iterator} + 1));
}
.for();`
            );
          },
          order: 0,
        }, // export default (function (_, $, module) {
        {
          pattern: /(@function\s)|(@return)/gi,
          replacement: function (match, func, rt) {
            return func ? ".function-" : "return:";
          },
          order: 1,
        },
        //   return module.exports
        // })()

        {
          pattern: /@if\s([()\w\s$=><!-]+)/gi,
          replacement: function (match, g1) {
            return "& when (" + g1.replace("==", "=").trim() + ") ";
          },
          order: 0.1,
        },
        {
          pattern: /@if\s([()\w\s$=><!-]+)([^]+?)@else/gi,
          replacement: function (match, condition, ifBody) {
            let newCondition = condition.replace("==", "=").trim();
            let newIf = `& when (${newCondition}) `;
            let newElse = `\n& when not (${newCondition})`;
            return newIf + ifBody.trim() + newElse;
          },
          order: 0,
        },
        {
          pattern: /@import\s?['|"]([\w-_]+|[\w-_/]+\/|\.\.?\/)([^./]*?)['|"];/gi,
          replacement: function (match, pathOrName, name) {
            if (name) {
              // we got a file referenced with a path but need to append '_' only to the filename
              return (
                '@import (optional) "' +
                pathOrName +
                name +
                '.scss";\n@import (optional) "' +
                pathOrName +
                "_" +
                name +
                '.scss";'
              );
            }
            return '@import (optional) "' + pathOrName + '.scss";\n@import (optional) "_' + pathOrName + '.scss";';
          },
          order: 2,
        },
        {
          pattern: /@include\s([\w\-]+)/gi,
          replacement: ".$1",
          order: 2,
        },
        {
          pattern: /@mixin\s([\w\-]*)(\(.*\))?\s?{/gi,
          replacement: ".$1$2 {",
          order: 2,
        },
        {
          pattern: /adjust-hue\((.+),(.+)\)/gi,
          replacement: "spin($1,$2)",
          order: 3,
        },
        {
          pattern: /calc\(([^;]+)\)/gi,
          replacement: function (match, calcBody) {
            if (/\#{(?!\$)([^}]+)\}/gi.test(calcBody)) {
              calcBody = calcBody
                // match math operators that are not within interpolation and LESS-escape them
                .replace(/[-+*\/][^#]+?}|([-+*\/])/gi, function (hit, operator) {
                  return operator ? '~"' + operator + '"' : hit;
                })
                // match sass interpolation and remove it as no equivalent in this form in LESS
                .replace(/\#\{([^}]+)}/gi, "$1")
                // replace $ with @ as usual
                .replace(/\$/gi, "@");

              return "calc(" + calcBody + ")";
            } else {
              return 'calc(~"' + calcBody + '")';
            }
          },
          order: 0,
        },
        {
          pattern: /\s?\!default/gi,
          replacement: "",
          order: 3,
        },
        {
          pattern: /\((.*)!important\)/gi,
          replacement: function (match, g1) {
            return "(" + g1.trim() + ") !important";
          },
          order: 3,
        },
        {
          pattern: /\#{([^}]+)\}/gi,
          replacement: function (match, contents) {
            if (/\#{(?!\$)([^}]+)\}/gi.test(match)) {
              match = match
                // match string concatenation (+ "xy") that is valid within interpolation in SASS but not LESS
                .replace(/\+\s?"/gi, '~"')
                // match sass interpolation and remove it as no equivalent in this form in LESS
                .replace(/\#\{([^}]+)}/gi, "$1")
                // replace $ with @ as usual
                .replace(/\$/gi, "@");
              return match;
            } else {
              return "@{" + contents.replace(/\$/gi, "") + "}";
            }
          },
          order: 0,
        },
        {
          pattern: /nth\(/gi,
          replacement: "extract(",
          order: 1,
        },
        {
          pattern: /rgba\(((?:#|\$)[^,$]+),\s?([^,)]+)\)/gi,
          replacement: "fade($1, ($2*100))",
          order: 0,
        },
        {
          pattern: /unquote\("(.*)"\)/gi,
          replacement: '~"$1"',
          order: 3,
        },
        {
          pattern: /\$/gi,
          replacement: "@",
          order: 1,
        },
      ];
    })();

    return results.sort((ex1, ex2) => ex1.order - ex2.order);
  };

  sassToLess.prototype = {
    process: function (src, extra) {
      // skip if it's not a sass/scss file
      if (extra.fileInfo && !/\.s[a|c]ss/i.test(extra.fileInfo.filename)) {
        return src;
      }

      // process file
      return [src].concat(replacements()).reduce(function (source, item) {
        return source.replace(item.pattern, item.replacement);
      });
    },
  };

  var lib = sassToLess;

  var Converter = lib;

  const plugin = {
    install: (less, pluginManager) => {
      pluginManager.addPreProcessor(new Converter(), 2000);
    },
    minVersion: [2, 7, 1],
  };

  globalThis.LESS_PLUGINS = [plugin].concat(globalThis.LESS_PLUGINS || []);

  console.log("sass2less initialized");

  var plugin_1 = plugin;

  return plugin_1;

})();
