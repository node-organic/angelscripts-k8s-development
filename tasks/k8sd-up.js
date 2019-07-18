const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const getPodsForCell = require('organic-stem-k8s-get-pods')
const path = require('path')
const {exec} = require('child_process')

const buildContents = require('../lib/build-k8s-config-contents')

const ensureNamespaceExists = function (namespace) {
  return new Promise((resolve, reject) => {
    exec(`kubectl get namespace ${namespace}`, (err, stdout) => {
      if (err) return reject(err)
      if (!namespace) {
        exec(`kubectl create namepsace ${namespace}`, (err, stdout) => {
          if (err) return reject(err)
          resolve()
        })
      }
      resolve()
    })
  })
}

module.exports = async function (angel) {
  angel.on(/^k8sd up$/, async function (angel) {
    angel.do(`k8sd up ${process.env.USER} development -- echo 'noop'`)
  })
  angel.on(/k8sd up -- (.*)/, async function (angel) {
    angel.do(`k8sd up ${process.env.USER} development -- ${angel.cmdData[1]}`)
  })
  angel.on(/k8sd up (.*) (.*) -- (.*)/, async function (angel) {
    const namespace = angel.cmdData[1]
    const branchName = angel.cmdData[2]
    const runCMD = angel.cmdData[3]

    const REPO = await findSkeletonRoot()
    const loadCellInfo = require(path.join(REPO, 'cells/node_modules/lib/load-cell-info'))
    const packagejson = require(path.join(process.cwd(), 'package.json'))

    const cellName = packagejson.name
    const cellInfo = await loadCellInfo(cellName)

    let existingPods = await getPodsForCell({cellName, namespace: namespace})
    let options = cellInfo.dna['k8sdevelopment'] || {}
    if (!cellInfo.dna.development) throw new Error('development dna needed for cell ' + cellName)

    if (existingPods.length === 0) {
      console.info('ENSURE NAMESPACE:')
      await ensureNamespaceExists(namespace)

      let {yamlContents, imageTag, registry} = await buildContents(namespace, branchName)

      if (!options.disableBuild) {
        console.info('BUILDING:')
        let buildCmd = `npx angel build development ${imageTag} -- ${runCMD}`
        console.log(buildCmd)
        await angel.exec(buildCmd)
        console.log('PUBLISHING:')
        let publicCmd = [
          `docker tag ${imageTag} ${registry}/${imageTag}`,
          `docker push ${registry}/${imageTag}`
        ].join(' && ')
        console.log('running', publicCmd)
        await angel.exec(publicCmd)
        console.log(`done, pushed ${registry}/${imageTag}`)
      }

      console.log('DEPLOYING:')
      let child = angel.exec(`kubectl apply --namespace ${namespace} -f -`)
      child.stdin.write(yamlContents)
      child.stdin.end()

      // wait for deployment to complete
      await (new Promise((resolve, reject) => child.on('exit', resolve)))
    } else {
      console.info(`FOUND EXISTING PODS in ${namespace}`, existingPods.length)
    }

    if (!options.disableSync) {
      console.log('WATCHING:')
      let startSyncCmd = `devspace sync --exclude=node_modules --namespace ${namespace} --label-selector app=${cellName} --container-path /${cellInfo.dna.cwd}`
      console.info('run sync:', startSyncCmd)
      angel.exec(startSyncCmd)
    }

    if (!options.disableLogs) {
      let tailLogsCmd = `devspace logs -f --namespace ${namespace} --label-selector app=${cellName} -c ${cellName}`
      console.info('run logs:', tailLogsCmd)
      angel.exec(tailLogsCmd)
    }
  })
}
