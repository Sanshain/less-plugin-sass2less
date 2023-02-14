module.exports = {
    pattern: /\n@while\s([()\w\s=><!-]*(\$\w+)[()\w\s=><!-]*)\s*\{([^]*)\n\}/gi,
    replacement: function (match, condition, variable, body) {
        body = body.replace(new RegExp('\\' + variable + '\\s*:\\s*([^;\\n]+?)[;\\n]'), (_, assertion) => {
            return '.while(' + assertion + ')';
        })
        return '\n.while (' + variable + ') when (' + condition.trim() + ') {' + body + '\n}\n\n.mixin(' + variable + ')'
    },
    order: 0
}
