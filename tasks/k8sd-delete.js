const buildContents = require('../lib/build-k8s-config-contents')

module.exports = function (angel) {
  angel.on('k8sd delete :branch', function (angel) {
    angel.do(`k8sd delete ${process.env.USER} ${angel.cmdData.branch}`)
  })
  angel.on('k8sd delete :namespace :branch', async function (angel) {
    const namespace = angel.cmdData.namespace
    const branch = angel.cmdData.branch
    let {yamlContents} = await buildContents(namespace, branch)
    let cmd = `kubectl delete --namespace ${namespace} -f -`
    console.info('run:', cmd)
    let child = angel.exec(cmd)
    child.stdin.write(yamlContents)
    child.stdin.end()
  })
}
