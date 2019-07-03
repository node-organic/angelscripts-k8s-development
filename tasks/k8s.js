const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const getPodsForCell = require('organic-stem-k8s-get-pods')
const path = require('path')
const YAML = require('json-to-pretty-yaml')
const getCurrentBranchName = function () {
  return 'test'
}
const dnaToYAML = function (dnaBranch) {
  let yamlContents = ''
  if (Array.isArray(dnaBranch)) {
    yamlContents = dnaBranch.map(YAML.stringify).join('\n---\n')
  } else {
    yamlContents = YAML.stringify(dnaBranch)
  }
  return yamlContents
}

module.exports = async function (angel) {
  angel.on(/k8s (.*)/, async function (angel) {
    process.env.CELLDEVCMD = angel.cmdData[1]
    let username = process.env.USER
    let REPO = await findSkeletonRoot()
    let branchName = await getCurrentBranchName() // TODO implement
    process.env.REPOBRANCH = branchName
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    process.env.CELLVERSION = packagejson.version
    let imageTag = packagejson.name + ':' + packagejson.version + `-dev-${username}-` + branchName
    let cellName = packagejson.name
    const loadCellInfo = require(path.join(REPO, 'cells/node_modules/lib/load-cell-info'))
    const loadRootDNA = require(path.join(REPO, 'cells/node_modules/lib/load-root-dna'))
    let cellInfo = await loadCellInfo(cellName)
    let cwd = cellInfo.dna.cwd
    let registry = cellInfo.dna.registry
    const rootDNA = await loadRootDNA()
    let cellPort = rootDNA['cell-ports'][cellName]

    if (!cellInfo.dna.prebuild) {
      console.info('BUILDING:')
      await angel.exec(`npx angel build development ${imageTag}`)
      console.log('PUBLISHING:')
      let cmd = [
        `docker tag ${imageTag} ${registry}/${imageTag}`,
        `docker push ${registry}/${imageTag}`
      ].join(' && ')
      await angel.exec(cmd)
      console.log(`done, pushed ${registry}/${imageTag}`)
    }

    // spawn a new deployment a clone to existing
    // using namespaced deployments based on USERNAME
    console.log('DEPLOYING:')
    let development = cellInfo.dna.development
    // @TODO: `kubectl create namespace ${username}` if not exists
    let child = angel.exec(`kubectl apply --namespace ${username} -f -`)
    let yamlContents = dnaToYAML(development)
    console.log(yamlContents)
    child.stdin.write(yamlContents)
    child.stdin.end()

    // quick hack, should be `await child.terminated()`
    await (new Promise((resolve, reject) => child.on('exit', resolve)))

    if (!cellInfo.dna.disableSync) {
      console.log('WATCHING:')
      let startSyncCmd = `devspace sync --exclude=node_modules --namespace ${username} --label-selector app=${cellName} --container-path /${cwd}`
      console.info('run sync:', startSyncCmd)
      angel.exec(startSyncCmd)
    }
    let tailLogsCmd = `devspace logs -f --namespace ${username} --label-selector app=${cellName} -c ${cellName}`
    console.info('run logs:', tailLogsCmd)
    angel.exec(tailLogsCmd)

    if (cellInfo.dna.proxy) {
      let pods = await getPodsForCell({cellName, namespace: username})
      if (pods.length !== 1) throw new Error('found ' + pods.length + ' pods, expected only 1')
      let proxyCmd = `kubectl port-forward --pod-running-timeout=15s --namespace ${username} ${pods[0]} 8888:${cellPort}`
      console.log('proxy run:', proxyCmd)
      angel.exec(proxyCmd)
    }

    /* process.on('SIGINT', () => {
      let child = angel.exec(`kubectl delete --namespace ${username} -f -`)
      child.stdin.write(yamlContents)
      child.stdin.end()
    }) */
  })
}
