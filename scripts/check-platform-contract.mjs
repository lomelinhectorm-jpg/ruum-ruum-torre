import { readFile } from 'node:fs/promises'
import path from 'node:path'

const adminRoot = process.cwd()
const platformRoot = path.dirname(adminRoot)
const roots = {
  admin: adminRoot,
  conductor: path.join(platformRoot, 'ruum-ruum-conductor'),
  usuario: path.join(platformRoot, 'ruum-ruum-usuario'),
}
const contractPath = path.join(adminRoot, 'docs', 'contracts', 'viaje.contract.json')
const contract = JSON.parse(await readFile(contractPath, 'utf8'))
const failures = []

function sameSet(left, right) {
  return left.length === right.length && left.every(value => right.includes(value))
}

function fail(message) {
  failures.push(message)
  console.error(`FAIL ${message}`)
}

function pass(message) {
  console.log(`PASS ${message}`)
}

for (const [app, root] of Object.entries(roots)) {
  const source = await readFile(path.join(root, 'lib', 'supabase.ts'), 'utf8')
  const missing = contract.states.filter(state => !source.includes(`'${state}'`))
  if (missing.length) fail(`${app}: missing states: ${missing.join(', ')}`)
  else pass(`${app}: ${contract.states.length} travel states`)
}

for (const [rpcName, rpc] of Object.entries(contract.rpcs)) {
  const source = await readFile(path.join(roots[rpc.consumer], rpc.file), 'utf8')
  const marker = `.rpc('${rpcName}', {`
  const start = source.indexOf(marker)
  if (start < 0) {
    fail(`${rpc.consumer}: missing call to ${rpcName}`)
    continue
  }
  const end = source.indexOf('\n  })', start)
  if (end < 0) {
    fail(`${rpc.consumer}: cannot parse call to ${rpcName}`)
    continue
  }
  const block = source.slice(start, end)
  const actual = [...block.matchAll(/\b(p_[a-z0-9_]+)\s*:/g)].map(match => match[1])
  const expected = [...rpc.required, ...rpc.optional]
  if (!sameSet(actual, expected)) {
    fail(`${rpc.consumer}: ${rpcName} args expected [${expected.join(', ')}], got [${actual.join(', ')}]`)
  } else {
    pass(`${rpc.consumer}: ${rpcName} argument contract`)
  }
}

if (process.argv.includes('--live')) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    fail('live contract check requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  } else {
    const dataHeaders = { apikey: serviceKey }
    if (serviceKey.startsWith('eyJ')) dataHeaders.Authorization = `Bearer ${serviceKey}`
    const schemaHeaders = { ...dataHeaders, Accept: 'application/openapi+json' }

    const schemaResponse = await fetch(`${url}/rest/v1/`, { headers: schemaHeaders })
    if (!schemaResponse.ok) {
      fail(`live OpenAPI unavailable: HTTP ${schemaResponse.status}`)
    } else {
      const schema = await schemaResponse.json()
      for (const [rpcName, rpc] of Object.entries(contract.rpcs)) {
        const bodySchema = schema.paths?.[`/rpc/${rpcName}`]?.post?.parameters
          ?.find(parameter => parameter.in === 'body')?.schema
        if (!bodySchema) {
          fail(`live RPC missing: ${rpcName}`)
          continue
        }
        const actualArgs = Object.keys(bodySchema.properties ?? {})
        const actualRequired = bodySchema.required ?? []
        const expectedArgs = [...rpc.required, ...rpc.optional]
        if (!sameSet(actualArgs, expectedArgs) || !sameSet(actualRequired, rpc.required)) {
          fail(`live RPC drift: ${rpcName}`)
        } else {
          pass(`live RPC ${rpcName}`)
        }
      }
    }

    const stateResponse = await fetch(`${url}/rest/v1/estados_viaje?select=nombre&activo=eq.true&order=orden`, { headers: dataHeaders })
    if (!stateResponse.ok) {
      fail(`live states unavailable: HTTP ${stateResponse.status}`)
    } else {
      const liveStates = (await stateResponse.json()).map(row => row.nombre)
      if (!sameSet(liveStates, contract.states)) fail('live travel states drift from contract')
      else pass(`live states: ${liveStates.length}`)
    }
  }
}

console.log(`\nContract summary: ${failures.length} failed.`)
process.exitCode = failures.length ? 1 : 0
