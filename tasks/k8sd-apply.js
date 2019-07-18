const buildContents = require('../lib/build-k8s-config-contents')

module.exports = function (angel) {
  angel.on('k8sd apply :branch', function (angel) {
    angel.do(`k8sd apply ${process.env.USER} ${angel.cmdData.branch}`)
  })
  angel.on('k8sd apply :namespace :branch', async function (angel) {
    const namespace = angel.cmdData.namespace
    const branch = angel.cmdData.branch
    let {yamlContents} = await buildContents(namespace, branch)
    let cmd = `kubectl apply --namespace ${namespace} -f -`
    console.info('run:', cmd)
    let child = angel.exec(cmd)
    child.stdin.write(yamlContents)
    child.stdin.end()
  })
}
