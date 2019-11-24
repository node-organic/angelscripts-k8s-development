const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const getPodsForCell = require('organic-stem-k8s-get-pods')
const path = require('path')
const { exec } = require('child_process')
const objToHash = require('object-hash')

const buildContents = require('../lib/build-k8s-config-contents')

const ensureNamespaceExists = function (namespace) {
  return new Promise((resolve, reject) => {
    exec(`kubectl get namespace ${namespace}`, (err, stdout) => {
      if (err) {
        // ignore errors ?
      }
      if (stdout.toString().indexOf(namespace) === -1) {
        exec(`kubectl create namespace ${namespace}`, (err, stdout) => {
          if (err) return reject(err)
          resolve()
        })
      }
      resolve()
    })
  })
}

const getLocalDockerImage = async function (baseImageTag) {
  return new Promise((resolve, reject) => {
    exec(`docker image inspect ${baseImageTag}`, function (err, stdout, stderr) {
      if (err) return resolve(false)
      resolve(true)
    })
  })
}

const ensureBaseImage = async function (packagejson, angel) {
  const packagelockjson = require(path.join(process.cwd(), 'package-lock.json'))
  let baseImageTag = packagejson.name + '-' + objToHash(packagelockjson.dependencies)
  let baseImageExists = await getLocalDockerImage(baseImageTag)
  if (!baseImageExists) {
    console.info('BUILDING BASEIMAGE:')
    let buildBaseCmd = `npx angel buildbase development ${baseImageTag}`
    console.log(buildBaseCmd)
    await angel.exec(buildBaseCmd)
    console.log(`done, build ${baseImageTag}`)
  }
  return baseImageTag
}

module.exports = async function (angel) {
  angel.on(/^k8sd up$/, async function (angel) {
    const packagejson = require(path.join(process.cwd(), 'package.json'))
    angel.do(`k8sd up ${process.env.USER} development -- node ${packagejson.main}`)
  })
  angel.on(/^k8sd up -- (.*)/, async function (angel) {
    angel.do(`k8sd up ${process.env.USER} development -- ${angel.cmdData[1]}`)
  })
  angel.on(/^k8sd up (.*) (.*) -- (.*)/, async function (angel) {
    const namespace = angel.cmdData[1]
    const branchName = angel.cmdData[2]
    const runCMD = angel.cmdData[3]
    const REPO = await findSkeletonRoot()
    const loadCellInfo = require(path.join(REPO, 'cells/node_modules/lib/load-cell-info'))
    const packagejson = require(path.join(process.cwd(), 'package.json'))

    const cellName = packagejson.name
    const cellInfo = await loadCellInfo(cellName)

    let existingPods = await getPodsForCell({ cellName, namespace: namespace })
    let options = cellInfo.dna['k8sdevelopment'] || {}
    if (!cellInfo.dna.development) throw new Error('development dna needed for cell ' + cellName)

    if (existingPods.length === 0) {
      console.info('ENSURE NAMESPACE:')
      await ensureNamespaceExists(namespace)

      let { yamlContents, imageTag, registry } = await buildContents(namespace, branchName)

      if (!options.disableBuild) {
        console.info('ENSURE BASEIMAGE:')
        let baseImageTag = await ensureBaseImage(packagejson, angel)
        console.info('BUILDING:')
        let buildCmd = `npx angel build ${baseImageTag} development ${imageTag} -- ${runCMD}`
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
      existingPods = await getPodsForCell({ cellName, namespace: namespace, waitPods: true })
    } else {
      console.info(`FOUND EXISTING PODS in ${namespace}`, existingPods.length)
    }

    if (!options.disableSync) {
      console.log('WATCHING:')
      let startSyncCmd = `angel k8sd sync ${namespace} ${existingPods[0]}`
      console.info('run sync:', startSyncCmd)
      let child = exec(startSyncCmd)
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
    }

    if (!options.disableLogs) {
      let tailLogsCmd = `angel k8sd logs ${namespace} ${existingPods[0]}`
      console.info('run logs:', tailLogsCmd)
      angel.exec(tailLogsCmd)
    }
  })
}
