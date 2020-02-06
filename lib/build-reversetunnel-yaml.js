const dnaToYAML = require('./dna-to-yaml')

module.exports = function ({cellInfo}) {
  let development = cellInfo.dna.development
  if (!Array.isArray(development)) development = [development]
  for (let i = 0; i < development.length; i++) {
    if (development[i].kind === 'Deployment') {
      let branch = development[i]
      let containers = branch.spec.template.spec.containers
      for (let container of containers) {
        if (container.name === cellInfo.name && !container.image) {
          container.image = 'datawire/telepresence-k8s:0.104'
        }
      }
    }
  }
  return dnaToYAML(development)
}
