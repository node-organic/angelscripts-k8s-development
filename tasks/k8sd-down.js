const buildContents = require('../lib/build-k8s-config-contents')

module.exports = function (angel) {
  angel.on('k8sd down', function (angel) {
    angel.do(`k8sd down ${process.env.USER} development`)
  })
  angel.on('k8sd down :namespace :branchName', async function (angel) {
    const namespace = angel.cmdData.namespace
    let {yamlContents} = await buildContents(namespace, angel.cmdData.branchName)
    let child = angel.exec(`kubectl delete --namespace ${namespace} -f -`)
    child.stdin.write(yamlContents)
    child.stdin.end()
  })
}
