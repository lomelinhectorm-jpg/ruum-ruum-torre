const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const requireRoles = process.argv.includes('--require-roles')

if (!url || !apiKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  process.exit(2)
}

const businessTables = [
  'bitacora', 'conductores', 'configuracion', 'documentos', 'empresas',
  'estados_viaje', 'evidencias', 'gastos', 'incidencias', 'metodos_pago',
  'notas_internas', 'pagos_conductores', 'pagos_usuarios',
  'plantillas_notificacion', 'profiles', 'reasignaciones', 'recargos', 'roles',
  'rutas_frecuentes', 'tarifas_base', 'tarifas_conductor',
  'tarifas_empresariales', 'timeline_viaje', 'tipos_servicio', 'usuarios',
  'usuarios_internos', 'vehiculos', 'viajes', 'zonas',
]

const adminOnlyTables = [
  'bitacora', 'configuracion', 'gastos', 'metodos_pago', 'notas_internas',
  'pagos_conductores', 'pagos_usuarios', 'plantillas_notificacion', 'roles',
  'tarifas_base', 'tarifas_conductor', 'tarifas_empresariales',
  'usuarios_internos', 'zonas',
]

const results = []

function record(scope, resource, result, detail = '') {
  results.push({ scope, resource, result, detail })
  console.log(`${result.padEnd(12)} ${scope.padEnd(14)} ${resource}${detail ? ` — ${detail}` : ''}`)
}

async function api(path, { token, key = apiKey, method = 'GET', body } = {}) {
  const headers = { apikey: key }
  if (token) headers.Authorization = `Bearer ${token}`
  else if (key === serviceKey && key?.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${url}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data = null
  const text = await response.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = null }
  }
  return { status: response.status, data }
}

async function signIn(prefix) {
  const email = process.env[`RLS_${prefix}_EMAIL`]
  const password = process.env[`RLS_${prefix}_PASSWORD`]
  if (!email || !password) return null
  const response = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  })
  if (response.status !== 200 || !response.data?.access_token) {
    record(prefix, 'authentication', 'FAIL', `HTTP ${response.status}`)
    return null
  }
  record(prefix, 'authentication', 'PASS')
  return response.data.access_token
}

async function probeTable(table, token, query = '', key = apiKey) {
  const suffix = query ? `&${query}` : ''
  const response = await api(`/rest/v1/${table}?select=*&limit=1${suffix}`, { token, key })
  if (response.status === 401 || response.status === 403) return { state: 'denied', status: response.status }
  if (response.status !== 200 || !Array.isArray(response.data)) return { state: 'error', status: response.status }
  return { state: response.data.length ? 'visible' : 'empty', status: response.status }
}

const serviceVisibility = new Map()

async function serviceHasRow(table) {
  if (!serviceKey) return null
  if (!serviceVisibility.has(table)) {
    const probe = await probeTable(table, undefined, '', serviceKey)
    serviceVisibility.set(table, probe.state === 'visible' ? true : probe.state === 'empty' ? false : null)
  }
  return serviceVisibility.get(table)
}

async function rpc(name, token) {
  const response = await api(`/rest/v1/rpc/${name}`, { token, method: 'POST', body: {} })
  if (response.status !== 200 || typeof response.data !== 'string') return null
  return response.data
}

async function anonymousBaseline() {
  console.log('\nAnonymous baseline (no rows are printed)')
  for (const table of businessTables) {
    const probe = await probeTable(table)
    if (probe.state === 'visible') record('ANON', table, 'FAIL', 'business row visible')
    else if (probe.state === 'denied') record('ANON', table, 'PASS', `denied HTTP ${probe.status}`)
    else if (probe.state === 'empty') {
      const exists = await serviceHasRow(table)
      if (exists === true) record('ANON', table, 'PASS', 'RLS hid existing rows')
      else if (exists === false) record('ANON', table, 'INCONCLUSIVE', 'table empty')
      else record('ANON', table, 'INCONCLUSIVE', 'service oracle unavailable')
    }
    else record('ANON', table, 'FAIL', `unexpected HTTP ${probe.status}`)
  }
}

async function storageBaseline() {
  console.log('\nStorage baseline (no object names are printed)')
  if (!serviceKey) {
    record('ANON', 'storage', 'INCONCLUSIVE', 'service oracle unavailable')
    return
  }
  const bucketsResponse = await api('/storage/v1/bucket', { key: serviceKey })
  if (bucketsResponse.status !== 200 || !Array.isArray(bucketsResponse.data)) {
    record('ANON', 'storage', 'FAIL', `cannot inspect buckets: HTTP ${bucketsResponse.status}`)
    return
  }

  for (const bucket of bucketsResponse.data) {
    const bucketId = bucket?.id
    if (typeof bucketId !== 'string') continue
    const path = `/storage/v1/object/list/${encodeURIComponent(bucketId)}`
    const body = { prefix: '', limit: 1, offset: 0 }
    const serviceProbe = await api(path, { key: serviceKey, method: 'POST', body })
    const anonProbe = await api(path, { method: 'POST', body })
    const serviceHasObject = serviceProbe.status === 200
      && Array.isArray(serviceProbe.data)
      && serviceProbe.data.length > 0

    if ((anonProbe.status === 401 || anonProbe.status === 403 || anonProbe.status === 400)) {
      record('ANON', `storage:${bucketId}`, 'PASS', `denied HTTP ${anonProbe.status}`)
    } else if (anonProbe.status !== 200 || !Array.isArray(anonProbe.data)) {
      record('ANON', `storage:${bucketId}`, 'FAIL', `unexpected HTTP ${anonProbe.status}`)
    } else if (anonProbe.data.length > 0) {
      record('ANON', `storage:${bucketId}`, 'FAIL', 'object name visible')
    } else if (serviceHasObject) {
      record('ANON', `storage:${bucketId}`, 'PASS', 'Storage RLS hid existing objects')
    } else {
      record('ANON', `storage:${bucketId}`, 'INCONCLUSIVE', 'bucket empty')
    }
  }
}

async function expectOwnRow(scope, table, idColumn, id, token) {
  if (!id) {
    record(scope, table, 'FAIL', 'identity RPC returned no id')
    return
  }
  const probe = await probeTable(table, token, `${idColumn}=eq.${encodeURIComponent(id)}`)
  if (probe.state === 'visible') record(scope, `${table}:own`, 'PASS')
  else record(scope, `${table}:own`, 'FAIL', `expected own row, got ${probe.state}`)
}

async function expectForeignHidden(scope, table, idColumn, foreignId, token) {
  if (!foreignId) return
  const probe = await probeTable(table, token, `${idColumn}=eq.${encodeURIComponent(foreignId)}`)
  if (probe.state === 'visible') record(scope, `${table}:foreign`, 'FAIL', 'foreign row visible')
  else if (probe.state === 'empty' || probe.state === 'denied') record(scope, `${table}:foreign`, 'PASS')
  else record(scope, `${table}:foreign`, 'FAIL', `unexpected HTTP ${probe.status}`)
}

async function expectAdminOnlyHidden(scope, token) {
  for (const table of adminOnlyTables) {
    const probe = await probeTable(table, token)
    if (probe.state === 'visible') record(scope, table, 'FAIL', 'admin-only row visible')
    else if (probe.state === 'denied') record(scope, table, 'PASS', `denied HTTP ${probe.status}`)
    else if (probe.state === 'empty') {
      const exists = await serviceHasRow(table)
      if (exists === true) record(scope, table, 'PASS', 'RLS hid existing rows')
      else record(scope, table, 'INCONCLUSIVE', exists === false ? 'table empty' : 'service oracle unavailable')
    }
    else record(scope, table, 'FAIL', `unexpected HTTP ${probe.status}`)
  }
}

async function roleMatrix() {
  const prefixes = ['USUARIO_A', 'USUARIO_B', 'CONDUCTOR_A', 'CONDUCTOR_B', 'ADMIN']
  const tokens = Object.fromEntries(await Promise.all(prefixes.map(async prefix => [prefix, await signIn(prefix)])))
  const missing = prefixes.filter(prefix => !tokens[prefix])
  if (missing.length) {
    const result = requireRoles ? 'FAIL' : 'SKIP'
    record('MATRIX', 'credentials', result, `missing: ${missing.join(', ')}`)
    if (requireRoles) return
  }

  const usuarioAId = tokens.USUARIO_A ? await rpc('mi_usuario_id', tokens.USUARIO_A) : null
  const usuarioBId = tokens.USUARIO_B ? await rpc('mi_usuario_id', tokens.USUARIO_B) : null
  const conductorAId = tokens.CONDUCTOR_A ? await rpc('mi_conductor_id', tokens.CONDUCTOR_A) : null
  const conductorBId = tokens.CONDUCTOR_B ? await rpc('mi_conductor_id', tokens.CONDUCTOR_B) : null

  if (tokens.USUARIO_A) {
    await expectOwnRow('USUARIO_A', 'usuarios', 'id', usuarioAId, tokens.USUARIO_A)
    await expectForeignHidden('USUARIO_A', 'usuarios', 'id', usuarioBId, tokens.USUARIO_A)
    await expectAdminOnlyHidden('USUARIO_A', tokens.USUARIO_A)
  }
  if (tokens.USUARIO_B) {
    await expectOwnRow('USUARIO_B', 'usuarios', 'id', usuarioBId, tokens.USUARIO_B)
    await expectForeignHidden('USUARIO_B', 'usuarios', 'id', usuarioAId, tokens.USUARIO_B)
  }
  if (tokens.CONDUCTOR_A) {
    await expectOwnRow('CONDUCTOR_A', 'conductores', 'id', conductorAId, tokens.CONDUCTOR_A)
    await expectForeignHidden('CONDUCTOR_A', 'conductores', 'id', conductorBId, tokens.CONDUCTOR_A)
    await expectAdminOnlyHidden('CONDUCTOR_A', tokens.CONDUCTOR_A)
  }
  if (tokens.CONDUCTOR_B) {
    await expectOwnRow('CONDUCTOR_B', 'conductores', 'id', conductorBId, tokens.CONDUCTOR_B)
    await expectForeignHidden('CONDUCTOR_B', 'conductores', 'id', conductorAId, tokens.CONDUCTOR_B)
  }
  if (tokens.ADMIN) {
    for (const table of businessTables) {
      const probe = await probeTable(table, tokens.ADMIN)
      if (probe.state === 'error' || probe.state === 'denied') record('ADMIN', table, 'FAIL', `HTTP ${probe.status}`)
      else record('ADMIN', table, probe.state === 'visible' ? 'PASS' : 'INCONCLUSIVE', probe.state === 'empty' ? 'table empty or filtered' : '')
    }
  }
}

await anonymousBaseline()
await storageBaseline()
await roleMatrix()

const failures = results.filter(item => item.result === 'FAIL')
const inconclusive = results.filter(item => item.result === 'INCONCLUSIVE')
console.log(`\nSummary: ${failures.length} failed, ${inconclusive.length} inconclusive, ${results.length} checks.`)
process.exitCode = failures.length ? 1 : 0
