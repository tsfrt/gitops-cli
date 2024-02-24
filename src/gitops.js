const { Command } = require('commander')
const git = require('./git.js')
const path = require('path')
const envManager = require('./envManager.js')
const program = new Command()


async function main () {
  program
    .name('gitops')
    .description('CLI for interacting with env-manager project')
    .version('0.1.0')

  program.command('service-list [service-list]')
    .description('')
    .requiredOption('-t, --type <type>', 'apps')
    .action(serviceList)

  program.command('service-build-version [service-build-version]')
    .description('')
    .requiredOption('-t, --type <type>', 'apps')
    .requiredOption('-p, --product <product>', 'ada | ciris | etc')
    .requiredOption('-w, --env <group>', 'dev | test | stage | prod')
    .requiredOption('-s, --service <service>', 'ada-server | ciris-ui | etc')
    .option('-g, --gitTag <gitTag>', '1.1.1.12345')
    .option('-i, --imageRef <imageRef>', 'harbor.mt.cdcr.ca.gov/workloads/service:1.1.1.12345')
    .action(serviceBuildVersion)

  program.command('service-release-version [service-release-version]')
    .description('')
    .requiredOption('-t, --type <type>', 'apps')
    .requiredOption('-p, --product <product>', 'ada | ciris | etc')
    .requiredOption('-w, --env <group>', 'dev | test | stage | prod')
    .requiredOption('-s, --service <service>', 'ada-server | ciris-ui | etc')
    .requiredOption('-v, --version <version>', '1.1.1.12345')

    .action(serviceReleaseVersion)

  await program.parseAsync()
}

async function serviceList (service, options, command) {
  console.log(`Called service-list with options ${options.type} ${options.env} ${options.product} ${options.service}`)
  // const result = await simpleGit(repoPath).raw(...commands);
  const tmpDir = await git.cloneRepo()
  envManager.buildServiceList(tmpDir, options.type)
}

async function serviceBuildVersion (service, options, command) {
  console.log(`service-build-version with options ${options.type} ${options.env} ${options.product} ${options.service}`)
  if (!options.gitTag && !options.imageRef) {
    throw new Error('gitTag or imageRef must be populated')
  }
  const tmpDir = await git.cloneRepo()
  const repoPath = path.join(tmpDir, 'env-manager')
  envManager.updateBuildVersion(repoPath, options.type, options.product, options.service, options.gitTag, options.imageRef)

  if (options.gitTag) {
    const message = `Update gitTagRef for ${options.type} ${options.env} ${options.product} ${options.service}`
    await git.pushRepo(repoPath, message)
  } else {
    const message = `Update imageRef for ${options.type} ${options.env} ${options.product} ${options.service}`
    await git.pushRepo(repoPath, message)
  }
}

async function serviceReleaseVersion (service, options, command) {
  console.log(`service-release-version with options ${options.type} ${options.env} ${options.product} ${options.service}`)
  const tmpDir = await git.cloneRepo()
  const repoPath = path.join(tmpDir, 'env-manager')
  envManager.updateReleaseVersion(repoPath, options.type, options.env, options.product, options.service, options.version)
  const message = `Update release version for ${options.type} ${options.env} ${options.product} ${options.service}`
  await git.pushRepo(repoPath, message)
}

if (require.main === module) {
  main()
}
