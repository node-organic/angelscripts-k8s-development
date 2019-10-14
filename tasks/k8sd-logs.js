const {exec} = require('child_process')

module.exports = function (angel) {
  angel.on('k8sd logs :namespace :pod', async function (angel) {
    let cmd = `kubectl logs -f ${angel.cmdData.pod} --namespace ${
      angel.cmdData.namespace
    } --timestamps --since 2m`
    console.log('k8sd logs run:', cmd)
    let child = exec(cmd, {
      cwd: process.cwd(),
      maxBuffer: Infinity,
      env: process.env
    })
    child.stderr.pipe(process.stderr)
    child.stdout.on('data', function (chunk) {
      console.log(chunk.toString())
    })
    child.stderr.on('data', function (chunk) {
      console.log(chunk.toString())
    })
  })
}