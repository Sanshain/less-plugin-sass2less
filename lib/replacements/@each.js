// module.exports = {
//     pattern: /\n@while\s([()\w\s=><!-]*(\$\w+)[()\w\s=><!-]*)\s*\{([^]*)\n\}/gi,
//     replacement: function (_match, condition, variable, body, _pos, _full_text) {

//         body = body.replace(new RegExp('\\' + variable + '\\s*:\\s*([^;\\n]+?)[;\\n]'), (_, assertion) => {
//             return '.while(' + assertion + ')';
//         })
//         return '\n.while (' + variable + ') when (' + condition.trim() + ') {' + body + '\n}\n\n.mixin(' + variable + ')'
//     },
//     order: 0
// }
