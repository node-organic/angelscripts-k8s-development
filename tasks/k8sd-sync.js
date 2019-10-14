const chokidar = require('chokidar')
const path = require('path')

const findSkeletonRoot = require('organic-stem-skeleton-find-root')

const watch = function (inputs, callback) {
  const watcher = chokidar.watch(inputs, {
    ignored: function (filepath) {
      if (filepath.indexOf('cells/node_modules') !== -1) return false
      if (filepath.indexOf('node_modules') !== -1) return true
      return false
    },
    persistent: true
  })
  watcher.on('change', (file) => callback(file))
  watcher.on('ready', () => console.log('watching for changes', inputs))
}

module.exports = function (angel) {
  angel.on('k8sd sync :namespace :pod', async function (angel) {
    const REPO = await findSkeletonRoot()
    let namespace = angel.cmdData.namespace
    watch([
      path.join(REPO, 'cells/node_modules'),
      process.cwd()
    ], async function (file) {
      let relativeRemotePath = file.replace(REPO, '')
      let cmd = []
      cmd.push(`kubectl cp ${file} ${namespace}/${angel.cmdData.pod}:${relativeRemotePath}`)
      console.log('k8sd sync run:', cmd.join(' && '))
      await angel.exec(cmd.join(' && '))
      console.info('sync complete', file, '->', relativeRemotePath)
    })
  })
}
