const simpleGit = require('simple-git')
const path = require('path')
const fs = require('fs')
const os = require('os')
const dotenv = require('dotenv')

async function cloneRepo () {
  dotenv.config()
  const gitUser = process.env.GIT_USER
  const gitToken = process.env.GIT_TOKEN
  const gitRepo = process.env.GIT_REPO
  console.log(gitUser)
  const envManagerRepo = `https://${gitUser}:${gitToken}@${gitRepo}`
  const appPrefix = 'gitops-cli'
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix))
  const SimpleGit = simpleGit(tmpDir, {})
  console.log('Cloning repo %s to %s', envManagerRepo, tmpDir)
  await SimpleGit.clone(envManagerRepo)
  return tmpDir
}

async function pushRepo (dir, message) {
  simpleGit(dir, {})
    .add('./*')
    .commit(message)
    .push('origin', 'main')
}

module.exports = { cloneRepo, pushRepo }
