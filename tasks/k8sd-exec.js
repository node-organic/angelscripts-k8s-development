const path = require('path')
const spawn = require('child_process').spawn
const getPodsForCell = require('organic-stem-k8s-get-pods')

module.exports = function (angel) {
  angel.on(/k8sd exec -- (.*)/, function (angel) {
    angel.do(`k8sd exec ${process.env.USER} -- ${angel.cmdData[1]}`)
  })
  angel.on(/k8sd exec (.*) -- (.*)/, async function (angel) {
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let cellName = packagejson.name
    let namespace = angel.cmdData[1]
    let command = angel.cmdData[2]
    let existingPods = await getPodsForCell({cellName, namespace: namespace})
    if (existingPods.length !== 1) throw new Error('found ' + existingPods.length + ' pods, but needs 1 for k8sd exec')
    let cmd = `kubectl exec -it --namespace ${namespace} ${existingPods[0]} -- ${command}`
    console.log('exec run:', cmd)
    let args = cmd.split(' ')
    let executable = args.shift()
    spawn(executable, args, {stdio: 'inherit'})
  })
}
