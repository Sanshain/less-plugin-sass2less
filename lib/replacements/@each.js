module.exports = {
    // only for root @each
    pattern: /^@each\s+(\$[\w-_]+)(,\s*\$[\w-_]+)?\s+in\s+(\$[\w-_]+)\s*\{([^]*)\n\}/gm,
    replacement: function (_match, key, value, dictName, body, _, originext) {

        const indent = ' '.repeat(4);
        
        if (!value) var extracts = '@' + key + ': extract(@' + dictName + ', @i);\n' + indent
        else if (value) {
            value = value.split('$').pop()
            var extracts = '@item: extract(@' + dictName + ', @i);\n' + indent +
                key + ': extract(@item, 1);\n' + indent +
                '@' + value + ': extract(@item, 2);\n' + indent 
        }

        return '.loop(@i) when (@i > 0) {\n' + indent + extracts +
            body + '\n\n' + indent +
            '.loop(' + dictName + ' - 1)\n}\n\n' +
            '.loop(length(' + dictName + '))'
    
    },
    order: 0
}
