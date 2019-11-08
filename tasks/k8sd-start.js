const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const getPodsForCell = require('organic-stem-k8s-get-pods')
const buildContents = require('../lib/build-k8s-config-contents')
const path = require('path')

module.exports = function (angel) {
  angel.on('k8sd start', function (angel) {
    angel.do(`k8sd start ${process.env.USER} development`)
  })
  angel.on('k8sd start :namespace :branchName', async function (angel) {
    const namespace = angel.cmdData.namespace
    const REPO = await findSkeletonRoot()
    const loadCellInfo = require(path.join(REPO, 'cells/node_modules/lib/load-cell-info'))
    const packagejson = require(path.join(process.cwd(), 'package.json'))
    const cellName = packagejson.name
    const cellInfo = await loadCellInfo(cellName)
    let namespaceImageTag = false
    let {yamlContents, imageTag} = await buildContents(namespace, angel.cmdData.branchName, namespaceImageTag)
    console.info('using image:', imageTag)
    let child = angel.exec(`kubectl apply --namespace ${namespace} -f -`)
    child.stdin.write(yamlContents)
    child.stdin.end()
    let options = cellInfo.dna['k8sdevelopment'] || {}
    if (!options.disableLogs) {
      let existingPods = await getPodsForCell({cellName, namespace: namespace, waitPods: true})
      let tailLogsCmd = `angel k8sd logs ${namespace} ${existingPods[0]}`
      console.info('run logs:', tailLogsCmd)
      angel.exec(tailLogsCmd)
    }
  })
}
