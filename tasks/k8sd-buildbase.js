const path = require('path')
const objToHash = require('object-hash')

module.exports = function (angel) {
  angel.on('k8sd buildbase', async function (angel) {
    angel.do(`k8sd buildbase ${process.env.USER} development`)
  })
  angel.on('k8sd buildbase :namespace :branchName', async function (angel) {
    console.info('BUILDING BASEIMAGE:')
    const packagejson = require(path.join(process.cwd(), 'package.json'))
    const packagelockjson = require(path.join(process.cwd(), 'package-lock.json'))
    let baseImageTag = packagejson.name + '-' + objToHash(packagelockjson.dependencies)
    let buildBaseCmd = `npx angel buildbase development ${baseImageTag}`
    console.log(buildBaseCmd)
    await angel.exec(buildBaseCmd)
    console.log(`done, build ${baseImageTag}`)
  })
}
