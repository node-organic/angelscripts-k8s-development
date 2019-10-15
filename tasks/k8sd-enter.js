module.exports = function (angel) {
  angel.on('k8sd enter', function (angel) {
    angel.do(`k8sd enter ${process.env.USER}`)
  })
  angel.on('k8sd enter :namespace', function (angel) {
    angel.do(`k8sd exec ${angel.cmdData.namespace} -- /bin/bash`)
  })
}
