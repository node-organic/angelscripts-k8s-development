module.exports = function (angel) {
  require('angelabilities-exec')(angel)
  require('./tasks/k8s-up')(angel)
  require('./tasks/k8s-down')(angel)
  require('./tasks/k8s-enter')(angel)
  require('./tasks/k8s-apply')(angel)
  require('./tasks/k8s-delete')(angel)
}
