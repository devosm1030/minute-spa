import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { resolve as pathResolve, sep } from 'node:path'
const __dirname = import.meta.dirname
const projectRoot = __dirname.split(`${sep}bin`)[0]

function spawnCmd (cmd, echo) {
  const options = { shell: true, cwd: projectRoot }
  if (echo) options.stdio = 'inherit'
  let out = ''
  let errout = ''
  return new Promise((resolve, reject) => {
    const spawned = spawn(cmd, options)
    spawned.stderr?.on?.('data', d => { errout += d; out += d })
    spawned.stdout?.on?.('data', d => { out += d })
    spawned.on('close', code => {
      if (code !== 0 && code !== 1) return reject(new Error(`${code} - ${errout}`))
      return resolve(out)
    })
    spawned.on('error', e => reject(e))
  })
}

function packageName () {
  return JSON.parse(readFileSync(pathResolve(projectRoot, 'package.json')).toString()).name
}

async function bumpOutdated (topLevelDependent = packageName()) {
  const outdatedDtls = (await spawnCmd('npm outdated')).replaceAll('\r\n', '\n').split('\n').filter(it => !it.startsWith('Package') && !!it.trim())
  const outdatedList = outdatedDtls.map(it => {
    const [npmmod,,, latest,, dependent] = it.split(/ +/g)
    return { npmmod, latest, dependent: dependent.split('@').shift() }
  })
  outdatedList.forEach(it => {
    const { npmmod, latest, dependent } = it
    const pkgPath = (dependent === topLevelDependent) ? pathResolve(projectRoot, 'package.json') : pathResolve(projectRoot, dependent, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath).toString())
    if (pkg.devDependencies?.[npmmod]) pkg.devDependencies[npmmod] = `^${latest}`
    if (pkg.dependencies?.[npmmod]) pkg.dependencies[npmmod] = `^${latest}`
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    console.log(`${pkgPath} ${npmmod} updated to ${latest}`)
  })
}

async function main () {
  console.log('bumping outdated versions...')
  await bumpOutdated()

  console.log('\nreinstalling all deps...')
  await spawnCmd('npx rimraf node_modules')
  try { rmSync(pathResolve(projectRoot, 'package-lock.json')) } catch (e) {}
  await spawnCmd('npm install', true)

  console.log('\naudit...')
  console.log(await spawnCmd('npm audit --registry-https://registry.npmsj.org'))
}

main().then(() => {
  console.log('\ndepUpdates complete...')
})
