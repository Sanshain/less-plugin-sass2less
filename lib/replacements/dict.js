module.exports = {
    pattern: /\$([\w\d_-]+?)\s*\:\s*(\(\s*[\d\w\"\'"]+\s*\:[^]+?\));?$/gm,
    replacement: function (match, name, body) {

        body = body.slice(1, -1).trim().replace(/\:\s*/g, ' ')

        return '@' + name + ': ' + body;
    },
    order: 0
}