const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const path = require('path')
const YAML = require('json-to-pretty-yaml')
const {exec} = require('child_process')

const updateContainerImage = function (k8sDeploymentBranch, cellName, imageValue) {
  let branches = Array.isArray(k8sDeploymentBranch) ? k8sDeploymentBranch : [ k8sDeploymentBranch ]
  let set = false
  for (let branch of branches) {
    if (branch.kind === 'Deployment') {
      let containers = branch.spec.template.spec.containers
      for (let container of containers) {
        if (container.name === cellName && !container.image) {
          container.image = imageValue
          set = true
          return k8sDeploymentBranch
        }
      }
    }
  }
  if (!set) throw new Error('failed to find cell container with name ' + cellName)
}

const dnaToYAML = function (dnaBranch) {
  let yamlContents = ''
  if (Array.isArray(dnaBranch)) {
    yamlContents = dnaBranch.map(YAML.stringify).join('\n---\n')
  } else {
    yamlContents = YAML.stringify(dnaBranch)
  }
  return yamlContents
}

const getCurrentBranchName = function () {
  return new Promise((resolve, reject) => {
    exec("git branch | grep \\* | cut -d ' ' -f2", (err, stdout) => {
      if (err) return reject(err)
      resolve(stdout.trim().replace('\r', ''))
    })
  })
}

module.exports = async function (namespace, disableBuild) {
  let REPO = await findSkeletonRoot()
  process.env.NAMESPACE = namespace
  const loadCellInfo = require(path.join(REPO, 'cells/node_modules/lib/load-cell-info'))
  let packagejson = require(path.join(process.cwd(), 'package.json'))
  let cellInfo = await loadCellInfo(packagejson.name)
  if (!cellInfo.dna.development) throw new Error('development dna needed for cell ' + packagejson.name)
  let registry
  let imageTag
  let development = cellInfo.dna.development
  if (!disableBuild) {
    registry = cellInfo.dna.registry
    // let branchName = await getCurrentBranchName()
    imageTag = packagejson.name + ':' + packagejson.version + '-' + namespace
    updateContainerImage(development, cellInfo.name, `${cellInfo.dna.registry}/${imageTag}`)
  }
  let yamlContents = dnaToYAML(development)
  return {registry, yamlContents, imageTag}
}
