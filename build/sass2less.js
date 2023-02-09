var toLESS = (function () {
  'use strict';

  var _extend;
  var hasRequired_extend;

  function require_extend () {
  	if (hasRequired_extend) return _extend;
  	hasRequired_extend = 1;
  	// TODO: mimic LESS's &:extend(x all)
  	_extend = {
  	  pattern: /@extend\s\.([a-zA-Z-_]*)/gi,
  	  replacement: "&:extend(.$1)",
  	  order: 2,
  	};
  	return _extend;
  }

  var _for;
  var hasRequired_for;

  function require_for () {
  	if (hasRequired_for) return _for;
  	hasRequired_for = 1;
  	_for = {
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
  	};
  	return _for;
  }

  var _function;
  var hasRequired_function;

  function require_function () {
  	if (hasRequired_function) return _function;
  	hasRequired_function = 1;
  	// export default (function (_, $, module) {
  	_function = {
  	  pattern: /(@function\s)|(@return)/gi,
  	  replacement: function (match, func, rt) {
  	    return func ? ".function-" : "return:";
  	  },
  	  order: 1,
  	};
  	//   return module.exports
  	// })()
  	return _function;
  }

  var _if;
  var hasRequired_if;

  function require_if () {
  	if (hasRequired_if) return _if;
  	hasRequired_if = 1;
  	_if = {
  	  pattern: /@if\s([()\w\s$=><!-]+)/gi,
  	  replacement: function (match, g1) {
  	    return "& when (" + g1.replace("==", "=").trim() + ") ";
  	  },
  	  order: 0.1,
  	};
  	return _if;
  }

  var _ifelse;
  var hasRequired_ifelse;

  function require_ifelse () {
  	if (hasRequired_ifelse) return _ifelse;
  	hasRequired_ifelse = 1;
  	_ifelse = {
  	  pattern: /@if\s([()\w\s$=><!-]+)([^]+?)@else/gi,
  	  replacement: function (match, condition, ifBody) {
  	    let newCondition = condition.replace("==", "=").trim();
  	    let newIf = `& when (${newCondition}) `;
  	    let newElse = `\n& when not (${newCondition})`;
  	    return newIf + ifBody.trim() + newElse;
  	  },
  	  order: 0,
  	};
  	return _ifelse;
  }

  var _import;
  var hasRequired_import;

  function require_import () {
  	if (hasRequired_import) return _import;
  	hasRequired_import = 1;
  	_import = {
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
  	};
  	return _import;
  }

  var _include;
  var hasRequired_include;

  function require_include () {
  	if (hasRequired_include) return _include;
  	hasRequired_include = 1;
  	_include = {
  	  pattern: /@include\s([\w\-]+)/gi,
  	  replacement: ".$1",
  	  order: 2,
  	};
  	return _include;
  }

  var _mixin;
  var hasRequired_mixin;

  function require_mixin () {
  	if (hasRequired_mixin) return _mixin;
  	hasRequired_mixin = 1;
  	_mixin = {
  	  pattern: /@mixin\s([\w\-]*)(\(.*\))?\s?{/gi,
  	  replacement: ".$1$2 {",
  	  order: 2,
  	};
  	return _mixin;
  }

  var adjustHue;
  var hasRequiredAdjustHue;

  function requireAdjustHue () {
  	if (hasRequiredAdjustHue) return adjustHue;
  	hasRequiredAdjustHue = 1;
  	adjustHue = {
  	  pattern: /adjust-hue\((.+),(.+)\)/gi,
  	  replacement: "spin($1,$2)",
  	  order: 3,
  	};
  	return adjustHue;
  }

  var calc;
  var hasRequiredCalc;

  function requireCalc () {
  	if (hasRequiredCalc) return calc;
  	hasRequiredCalc = 1;
  	calc = {
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
  	};
  	return calc;
  }

  var _default;
  var hasRequired_default;

  function require_default () {
  	if (hasRequired_default) return _default;
  	hasRequired_default = 1;
  	_default = {
  	  pattern: /\s?\!default/gi,
  	  replacement: "",
  	  order: 3,
  	};
  	return _default;
  }

  var important;
  var hasRequiredImportant;

  function requireImportant () {
  	if (hasRequiredImportant) return important;
  	hasRequiredImportant = 1;
  	important = {
  	  pattern: /\((.*)!important\)/gi,
  	  replacement: function (match, g1) {
  	    return "(" + g1.trim() + ") !important";
  	  },
  	  order: 3,
  	};
  	return important;
  }

  var interpolation;
  var hasRequiredInterpolation;

  function requireInterpolation () {
  	if (hasRequiredInterpolation) return interpolation;
  	hasRequiredInterpolation = 1;
  	interpolation = {
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
  	};
  	return interpolation;
  }

  var nth;
  var hasRequiredNth;

  function requireNth () {
  	if (hasRequiredNth) return nth;
  	hasRequiredNth = 1;
  	nth = {
  	  pattern: /nth\(/gi,
  	  replacement: "extract(",
  	  order: 1,
  	};
  	return nth;
  }

  var rgba;
  var hasRequiredRgba;

  function requireRgba () {
  	if (hasRequiredRgba) return rgba;
  	hasRequiredRgba = 1;
  	rgba = {
  	  pattern: /rgba\(((?:#|\$)[^,$]+),\s?([^,)]+)\)/gi,
  	  replacement: "fade($1, ($2*100))",
  	  order: 0,
  	};
  	return rgba;
  }

  var unquote;
  var hasRequiredUnquote;

  function requireUnquote () {
  	if (hasRequiredUnquote) return unquote;
  	hasRequiredUnquote = 1;
  	unquote = {
  	  pattern: /unquote\("(.*)"\)/gi,
  	  replacement: '~"$1"',
  	  order: 3,
  	};
  	return unquote;
  }

  var variables;
  var hasRequiredVariables;

  function requireVariables () {
  	if (hasRequiredVariables) return variables;
  	hasRequiredVariables = 1;
  	variables = {
  	  pattern: /\$/gi,
  	  replacement: "@",
  	  order: 1,
  	};
  	return variables;
  }

  var dynamicModules;

  function getDynamicModules() {
  	return dynamicModules || (dynamicModules = {
  		"/lib/replacements/@extend.js": require_extend,
  		"/lib/replacements/@for.js": require_for,
  		"/lib/replacements/@function.js": require_function,
  		"/lib/replacements/@if.js": require_if,
  		"/lib/replacements/@ifelse.js": require_ifelse,
  		"/lib/replacements/@import.js": require_import,
  		"/lib/replacements/@include.js": require_include,
  		"/lib/replacements/@mixin.js": require_mixin,
  		"/lib/replacements/adjust-hue.js": requireAdjustHue,
  		"/lib/replacements/calc.js": requireCalc,
  		"/lib/replacements/default.js": require_default,
  		"/lib/replacements/important.js": requireImportant,
  		"/lib/replacements/interpolation.js": requireInterpolation,
  		"/lib/replacements/nth.js": requireNth,
  		"/lib/replacements/rgba.js": requireRgba,
  		"/lib/replacements/unquote.js": requireUnquote,
  		"/lib/replacements/variables.js": requireVariables
  	});
  }

  function createCommonjsRequire(originalModuleDir) {
  	function handleRequire(path) {
  		var resolvedPath = commonjsResolve(path, originalModuleDir);
  		if (resolvedPath !== null) {
  			return getDynamicModules()[resolvedPath]();
  		}
  		throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  	}
  	handleRequire.resolve = function (path) {
  		var resolvedPath = commonjsResolve(path, originalModuleDir);
  		if (resolvedPath !== null) {
  			return resolvedPath;
  		}
  		return require.resolve(path);
  	};
  	return handleRequire;
  }

  function commonjsResolve (path, originalModuleDir) {
  	var shouldTryNodeModules = isPossibleNodeModulesPath(path);
  	path = normalize(path);
  	var relPath;
  	if (path[0] === '/') {
  		originalModuleDir = '';
  	}
  	var modules = getDynamicModules();
  	var checkedExtensions = ['', '.js', '.json'];
  	while (true) {
  		if (!shouldTryNodeModules) {
  			relPath = normalize(originalModuleDir + '/' + path);
  		} else {
  			relPath = normalize(originalModuleDir + '/node_modules/' + path);
  		}

  		if (relPath.endsWith('/..')) {
  			break; // Travelled too far up, avoid infinite loop
  		}

  		for (var extensionIndex = 0; extensionIndex < checkedExtensions.length; extensionIndex++) {
  			var resolvedPath = relPath + checkedExtensions[extensionIndex];
  			if (modules[resolvedPath]) {
  				return resolvedPath;
  			}
  		}
  		if (!shouldTryNodeModules) break;
  		var nextDir = normalize(originalModuleDir + '/..');
  		if (nextDir === originalModuleDir) break;
  		originalModuleDir = nextDir;
  	}
  	return null;
  }

  function isPossibleNodeModulesPath (modulePath) {
  	var c0 = modulePath[0];
  	if (c0 === '/' || c0 === '\\') return false;
  	var c1 = modulePath[1], c2 = modulePath[2];
  	if ((c0 === '.' && (!c1 || c1 === '/' || c1 === '\\')) ||
  		(c0 === '.' && c1 === '.' && (!c2 || c2 === '/' || c2 === '\\'))) return false;
  	if (c1 === ':' && (c2 === '/' || c2 === '\\')) return false;
  	return true;
  }

  function normalize (path) {
  	path = path.replace(/\\/g, '/');
  	var parts = path.split('/');
  	var slashed = parts[0] === '';
  	for (var i = 1; i < parts.length; i++) {
  		if (parts[i] === '.' || parts[i] === '') {
  			parts.splice(i--, 1);
  		}
  	}
  	for (var i = 1; i < parts.length; i++) {
  		if (parts[i] !== '..') continue;
  		if (i > 0 && parts[i - 1] !== '..' && parts[i - 1] !== '.') {
  			parts.splice(--i, 2);
  			i--;
  		}
  	}
  	path = parts.join('/');
  	if (slashed && path[0] !== '/') path = '/' + path;
  	else if (path.length === 0) path = '.';
  	return path;
  }

  let sassToLess = function () {};

  let replacements = function () {
    let results = (function () {

      let filenames = () => {
        return [
          "@extend.js",
          "@for.js",
          "@function.js",
          "@if.js",
          "@ifelse.js",
          "@import.js",
          "@include.js",
          "@mixin.js",
          "adjust-hue.js",
          "calc.js",
          "default.js",
          "important.js",
          "interpolation.js",
          "nth.js",
          "rgba.js",
          "unquote.js",
          "variables.js",
        ];
      };

      return filenames.map(function (filename) {
        return createCommonjsRequire("/lib")(dir + filename);
      });
    })();

    return results.sort((ex1, ex2) => ex1.order - ex2.order);
  };

  replacements();

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

  return lib;

})();
