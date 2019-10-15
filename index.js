module.exports = function (angel) {
  require('angelabilities-exec')(angel)
  require('./tasks/k8sd-up')(angel)
  require('./tasks/k8sd-down')(angel)
  require('./tasks/k8sd-enter')(angel)
  require('./tasks/k8sd-apply')(angel)
  require('./tasks/k8sd-delete')(angel)
  require('./tasks/k8sd-exec')(angel)
  require('./tasks/k8sd-sync')(angel)
  require('./tasks/k8sd-logs')(angel)
  require('./tasks/k8sd-reload')(angel)
}
