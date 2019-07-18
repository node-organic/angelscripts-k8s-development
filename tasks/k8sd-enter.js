const path = require('path')

module.exports = function (angel) {
  angel.on('k8sd enter', function (angel) {
    angel.do('k8sd enter default')
  })
  angel.on('k8sd enter :namespace', function (angel) {
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let cellName = packagejson.name
    let namespace = angel.cmdData.namespace
    let cmd = `devspace --namespace ${namespace} enter --container ${cellName}`
    console.log('run:', cmd)
    angel.exec(cmd)
  })
}
