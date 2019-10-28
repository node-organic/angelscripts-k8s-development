const buildContents = require('../lib/build-k8s-config-contents')

module.exports = function (angel) {
  angel.on('k8sd buildbase', async function (angel) {
    angel.do(`k8sd buildbase ${process.env.USER} development`)
  })
  angel.on('k8sd buildbase :namespace :branchName', async function (angel) {
    console.info('BUILDING BASEIMAGE:')
    const namespace = angel.cmdData.namespace
    const branchName = angel.cmdData.branchName
    let {imageTag, registry} = await buildContents(namespace, branchName)
    let buildBaseCmd = `npx angel buildbase development ${imageTag}-base`
    console.log(buildBaseCmd)
    await angel.exec(buildBaseCmd)
    console.log('PUBLISHING:')
    let publicCmd = [
      `docker tag ${imageTag}-base ${registry}/${imageTag}-base`,
      `docker push ${registry}/${imageTag}-base`
    ].join(' && ')
    console.log('running', publicCmd)
    await angel.exec(publicCmd)
    console.log(`done, pushed ${registry}/${imageTag}-base`)
  })
}
