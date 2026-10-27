import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { request } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Production build of each fixture, requested on both configured domains through the Host header.
// The products page has `alias: '/'`, so `/` and `/products` should both render it on each domain.
// Bug (10.5.0+): `/` returns 404. Control (10.4.1): both render.
const root = dirname(fileURLToPath(import.meta.url))
const env = { ...process.env, CI: '1', PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: 'false' }
const cases = [
  { name: 'i18n-different-domains-alias', port: 38941, expectedRoot: 404 },
  { name: 'i18n-different-domains-alias-10.4.1', port: 38942, expectedRoot: 200 },
]
const hosts = ['example.com', 'example.de']
const showRoutes = process.argv.includes('--routes')

function exec(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve(output) : reject(new Error(`${command} ${args.join(' ')} exited with ${code}\n${output}`)))
  })
}

function get(port, host, path) {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, headers: { host } }, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body, routes: res.headers['x-repro-routes'] }))
    })
    req.on('error', reject)
    req.end()
  })
}

async function waitForServer(port, child) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(`server on ${port} exited before serving`)
    try {
      await get(port, hosts[0], '/products')
      return
    }
    catch {
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }
  throw new Error(`timed out waiting for port ${port}`)
}

for (const testCase of cases) {
  const fixture = join(root, testCase.name)
  await exec('pnpm', ['install', '--frozen-lockfile'], fixture)
  await exec('pnpm', ['exec', 'nuxt', 'build'], fixture)

  const server = spawn(process.execPath, ['.output/server/index.mjs'], {
    cwd: fixture,
    env: { ...env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(testCase.port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  server.stdout.on('data', chunk => { log += chunk })
  server.stderr.on('data', chunk => { log += chunk })
  try {
    await waitForServer(testCase.port, server)

    for (const host of hosts) {
      const products = await get(testCase.port, host, '/products')
      assert.equal(products.status, 200, `${host}/products status`)
      assert.match(products.body, /<h1>Products<\/h1>/, `${host}/products renders the page`)

      const home = await get(testCase.port, host, '/')
      console.log(`${testCase.name}: ${host}/products -> ${products.status}, ${host}/ -> ${home.status} (expected ${testCase.expectedRoot})`)
      if (showRoutes)
        console.log(`  route table on ${host}:\n${JSON.parse(products.routes ?? '[]').map(route => `    ${route}`).join('\n')}`)
      assert.equal(home.status, testCase.expectedRoot, `${host}/ status`)
    }
  }
  catch (error) {
    throw new Error(`${testCase.name} failed.\n${log}`, { cause: error })
  }
  finally {
    server.kill('SIGTERM')
    await new Promise(resolve => server.once('exit', resolve))
  }
}
