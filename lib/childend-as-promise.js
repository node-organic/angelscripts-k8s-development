module.exports = function (child) {
  // wait for child to complete
  return new Promise((resolve, reject) => {
    child.on('exit', resolve)
    child.on('error', reject)
  })
}