const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const path = require('path')
const buildReverseTunnelYAML = require('../lib/build-reversetunnel-yaml')
const childEnd = require('../lib/childend-as-promise')
const getPodsForCell = require('organic-stem-k8s-get-pods')

module.exports = function (angel) {
  angel.on(/^k8sd reversetunnel -- (.*)/, async function (angel) {
    angel.do(`k8sd reversetunnel ${process.env.USER} -- ${angel.cmdData[1]}`)
  })
  angel.on(/^k8sd reversetunnel (.*) -- (.*)/, async function (angel) {
    // construct context
    const namespace = angel.cmdData[1]
    const cmdToRun = angel.cmdData[2]
    process.env.NAMESPACE = namespace // provides {$NAMESPACE} within loaded dna
    const REPO = await findSkeletonRoot()
    const loadRootDNA = require(path.join(REPO, 'cells/node_modules/lib/load-root-dna'))
    const loadCellInfo = require(path.join(REPO, 'cells/node_modules/lib/load-cell-info'))
    const packagejson = require(path.join(process.cwd(), 'package.json'))
    const cellName = packagejson.name
    const rootDNA = await loadRootDNA()
    const cellInfo = await loadCellInfo(cellName)
    const cellPort = rootDNA['cell-ports'][cellName]

    let yamlContents = await buildReverseTunnelYAML({cellInfo})
    console.info('building reverse tunnel service')
    let createService = angel.exec(`kubectl apply --namespace ${namespace} -f -`)
    createService.stdin.write(yamlContents)
    createService.stdin.end()
    await childEnd(createService)
    console.info('starting telepresence')
    let args = [
      `-m inject-tcp`,
      `--deployment ${cellName}-deployment`,
      `--namespace ${namespace}`
    ]
    if (cellPort) {
      args.push(`--expose ${cellPort}`)
    }
    args.push(`--run ${cmdToRun}`) // keep always at the end
    let telepresence = angel.exec(`telepresence ${args.join(' ')}`)
    telepresence.on('exit', function () {
      console.error('telepresence failed, terminating...')
      process.exit(1)
    })

    process.on('SIGINT', function () {
      telepresence.kill()
    })
    process.on('SIGTERM', function () {
      telepresence.kill()
    })
  })
}