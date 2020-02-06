const YAML = require('json-to-pretty-yaml')

module.exports = function (dnaBranch) {
  let yamlContents = ''
  if (Array.isArray(dnaBranch)) {
    yamlContents = dnaBranch.map(YAML.stringify).join('\n---\n')
  } else {
    yamlContents = YAML.stringify(dnaBranch)
  }
  return yamlContents
}