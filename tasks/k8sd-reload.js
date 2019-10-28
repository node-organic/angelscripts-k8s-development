const path = require('path')

module.exports = function (angel) {
  angel.on('k8sd restart', function (angel) {
    const packagejson = require(path.join(process.cwd(), 'package.json'))
    let mainRelativePath = packagejson.main
    if (!mainRelativePath) {
      mainRelativePath = 'index.js'
    }
    angel.do(`k8sd exec -- touch ${mainRelativePath}`)
  })

  angel.on('k8sd reload', function (angel) {
    const packagejson = require(path.join(process.cwd(), 'package.json'))
    let mainRelativePath = packagejson.main
    if (!mainRelativePath) {
      mainRelativePath = 'index.js'
    }
    let cmd = [
      'angel k8sd exec -- npm install',
      `angel k8sd exec -- touch ${mainRelativePath}`
    ]
    angel.exec(cmd.join(' && '))
  })
}
