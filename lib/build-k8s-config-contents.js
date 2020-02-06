const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const path = require('path')
const dnaToYAML = require('./dna-to-yaml')

const updateContainerImage = function (k8sDeploymentBranch, cellName, imageValue) {
  let branches = Array.isArray(k8sDeploymentBranch) ? k8sDeploymentBranch : [ k8sDeploymentBranch ]
  for (let branch of branches) {
    if (branch.kind === 'Deployment') {
      let containers = branch.spec.template.spec.containers
      for (let container of containers) {
        if (container.name === cellName && !container.image) {
          container.image = imageValue
        }
      }
    }
  }
}

module.exports = async function (namespace, branchName = 'development', imageTagNamespaced = true) {
  let REPO = await findSkeletonRoot()
  process.env.NAMESPACE = namespace // provides {$NAMESPACE} within loaded dna
  const loadCellInfo = require(path.join(REPO, 'cells/node_modules/lib/load-cell-info'))
  let packagejson = require(path.join(process.cwd(), 'package.json'))
  let cellInfo = await loadCellInfo(packagejson.name)
  if (!cellInfo.dna[branchName]) throw new Error(`${branchName} dna needed for cell ${packagejson.name}`)
  let registry
  let imageTag
  let k8sConfig = cellInfo.dna[branchName]
  registry = cellInfo.dna.registry
  if (imageTagNamespaced) {
    imageTag = packagejson.name + ':' + packagejson.version + '-' + namespace
  } else {
    imageTag = packagejson.name + ':' + packagejson.version
  }
  updateContainerImage(k8sConfig, cellInfo.name, `${cellInfo.dna.registry}/${imageTag}`)
  let yamlContents = dnaToYAML(k8sConfig)
  delete process.env.NAMESPACE // do not pollute env
  return {registry, yamlContents, imageTag, cellInfo}
}
