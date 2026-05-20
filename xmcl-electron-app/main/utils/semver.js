const semver = require('semver')

function gt(a, b) {
  try {
    return semver.gt(semver.coerce(a) || a, semver.coerce(b) || b)
  } catch {
    return false
  }
}

function valid(v) {
  return !!semver.valid(semver.coerce(v) || v)
}

module.exports = { gt, valid }
