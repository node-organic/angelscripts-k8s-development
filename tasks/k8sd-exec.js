const path = require('path')
const spawn = require('child_process').spawn

module.exports = function (angel) {
  angel.on(/k8sd exec -- (.*)/, function (angel) {
    angel.do(`k8sd exec ${process.env.USER} -- ${angel.cmdData[1]}`)
  })
  angel.on(/k8sd exec (.*) -- (.*)/, function (angel) {
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let cellName = packagejson.name
    let namespace = angel.cmdData[1]
    let command = angel.cmdData[2]
    let cmd = `devspace --namespace ${namespace} -l app=${cellName} enter ${command}`
    console.log('run:', cmd)
    let args = cmd.split(' ')
    let executable = args.shift()
    spawn(executable, args, {stdio: 'inherit'})
  })
}
