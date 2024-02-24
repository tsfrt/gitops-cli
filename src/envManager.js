const path = require('path')
const fs = require('fs')
const { readdir } = require('fs/promises')
const Table = require('cli-table')
const yaml = require('js-yaml')

async function updateBuildVersion (envManagerDir, type, product, service, gitTag, imageRef) {
  const dirPath = path.join(envManagerDir, type, product, 'common', service + '.yaml')
  console.log('Loading service common app def %s', dirPath)
  const app = yaml.load(fs.readFileSync(dirPath, 'utf8'))
  console.log(`Running build version update for ${gitTag} <= ${app.gitTagRef}`)
  if (Object.hasOwn(app, 'gitTagRef') && gitTag) {
    app.gitTagRef = gitTag
  } else if (Object.hasOwn(app, 'imageRef') && imageRef) {
    app.imageRef = imageRef
  } else {
    throw new Error(`gitTagRef or image ref not found for ${dirPath}`)
  }

  fs.writeFileSync(dirPath, yaml.dump(app))
}

async function updateReleaseVersion (envManagerDir, type, env, product, service, version) {
  const dirPath = path.join(envManagerDir, type, product, env, service + '.yaml')
  console.log('Loading service common app def %s', dirPath)
  const app = yaml.load(fs.readFileSync(dirPath, 'utf8'))
  console.log(`Running build version update for ${version} <= ${app.version}`)
  app.version = version
  fs.writeFileSync(dirPath, yaml.dump(app))
}

async function buildServiceList (envManagerDir, type) {
  const dirPath = path.join(envManagerDir, 'env-manager', type)
  console.log('Searching for products in %s', dirPath)

  const products = await dirList(dirPath)
  const productArray = []
  for (const p of products) {
    const pm = await makeProductArray(dirPath, p)
    productArray.push(...pm)
  }
  await displayTable(productArray)
}

async function makeProductArray (dirPath, product, service) {
  console.log('Searching for product envs in %s', dirPath)

  const envs = await dirList(path.join(dirPath, product))

  console.log('Found the following envs for product %s -> %s', product, JSON.stringify(envs))
  const envMap = []
  for (const e of envs) {
    if (e !== 'common') {
      const env = await serviceByEnv(dirPath, e, product)
      envMap.push(...env)
    }
  }
  return envMap
}

async function serviceByEnv (dirPath, env, product) {
  const services = await fileList(path.join(dirPath, product, env))

  const map = []
  for (const s of services) {
    const serv = parseServiceYaml(path.join(dirPath, product, env, s), s, product, env)
    map.push(serv)
  }
  return map
}

function displayTable (productMap) {
  const table = new Table({
    head: ['Env', 'Product', 'Service', 'Version']
  })
  for (let i = 0; i < productMap.length; i++) {
    table.push(productMap[i])
  }

  console.log(table.toString())
}

function parseServiceYaml (servicePath, serviceName, product, env) {
  const file = fs.readFileSync(servicePath, 'utf8')

  const service = yaml.load(file)

  return [
    env,
    product,
    serviceName,
    service.version
  ]
}

async function dirList (dirPath) {
  // eslint-disable-next-line no-unused-vars, no-undef
  const isDirectory = source => lstatSync(source).isDirectory()
  const dirs = (await readdir(dirPath, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dir => dir.name)

  return dirs
}

async function fileList (dirPath) {
  // eslint-disable-next-line no-unused-vars, no-undef
  const isFile = source => !lstatSync(source).isDirectory()
  const files = (await readdir(dirPath, { withFileTypes: true }))
    .filter(dirent => dirent.isFile())
    .map(dir => dir.name)

  return files
}

module.exports = { buildServiceList, updateBuildVersion, updateReleaseVersion }
