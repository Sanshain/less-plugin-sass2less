module.exports = {
  // pattern: /@if\s([()\w\s$=><!-]+)([^]+?)@else/gi,
  pattern: /@if\s([()\w\s$=><!-]+)([^]+?)([ \t]*)@else/gi,
  replacement: function(match, condition, ifBody, indentation) {
    let newCondition = condition.replace('==', '=').trim()
    let newIf = `& when (${newCondition}) `
    let newElse = `\n${indentation}& when not (${newCondition})`
    return newIf + ifBody.trim() + newElse
  },
  order: 0
}
