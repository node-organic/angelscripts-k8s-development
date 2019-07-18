const buildContents = require('../lib/build-k8s-config-contents')

module.exports = function (angel) {
  angel.on('k8s apply :branch', function (angel) {
    angel.do(`k8s apply ${process.env.USER} ${angel.cmdData.branch}`)
  })
  angel.on('k8s apply :namespace :branch', async function (angel) {
    const namespace = angel.cmdData.namespace
    const branch = angel.cmdData.branch
    let {yamlContents} = await buildContents(namespace, true, branch)
    let cmd = `kubectl apply --namespace ${namespace} -f -`
    console.info('run:', cmd)
    let child = angel.exec(cmd)
    child.stdin.write(yamlContents)
    child.stdin.end()
  })
}
