module.exports = function (angel) {
  require('angelabilities-exec')(angel)
  require('./tasks/k8s')(angel)
}
