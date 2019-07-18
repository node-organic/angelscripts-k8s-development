const path = require('path')
const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const buildContents = require('../lib/build-k8s-config-contents')

module.exports = function (angel) {
  angel.on('k8s down', function (angel) {
    angel.do(`k8s down ${process.env.USER}`)
  })
  angel.on('k8s down :namespace', async function (angel) {
    const namespace = angel.cmdData.namespace
    const REPO = await findSkeletonRoot()
    const loadCellInfo = require(path.join(REPO, 'cells/node_modules/lib/load-cell-info'))
    const packagejson = require(path.join(process.cwd(), 'package.json'))

    const cellName = packagejson.name
    const cellInfo = await loadCellInfo(cellName)
    let options = cellInfo.dna['k8sdevelopment'] || {}
    let {yamlContents} = await buildContents(namespace, options.disableBuild)
    let child = angel.exec(`kubectl delete --namespace ${namespace} -f -`)
    child.stdin.write(yamlContents)
    child.stdin.end()
  })
}
