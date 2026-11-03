#!/usr/bin/env node
// scrum.mjs — local development board CLI (agentic-project / agentic-feature skills).
//
// Local state: <repo>/.agentic/board/state/{requests,items,agents,events,decisions}.json (SCRUM_DIR changes
// the parent of state/). Each file has the same format as its namesake document in the artifact's "state"
// collection. In a worktree, <repo> is the main repository root: all agents write to the same state.
// `export` writes 7 documents ready to send (ArtifactData set with file_path) and hashes.json to send only
// changes. `sync-plan` uses what its own export generated, never the shared export/ (see generateExport).
//
// Optional configuration: <repo>/.agentic/board/config.json (or SCRUM_CONFIG; with SCRUM_DIR and no SCRUM_REPO,
// <SCRUM_DIR>/config.json, see fileConfig), overridden by SCRUM_* variables: project name, repository, main
// branch, remote, health URL (readyz), command returning the production SHA and free disk space, git notes
// refs for verification and deployments, spec pattern and timezone. Works without configuration; metrics
// depending on it become "unknown" or are omitted.
//
// Node ≥ 20, ESM, no dependencies. Concurrent agents: each command holds a lock (mkdir state/.lock with
// its owner inside; see withLock) and saves using a temporary file + rename.
// Output: one JSON line on stdout. Error: {"ok":false,"error":…} on stderr and a nonzero exit code
// (2 = usage/validation, 1 = data, 75 = busy or broken lock: retry).
// No personal data or secrets: free text is filtered for apparent secrets, emails, phone numbers and
// identification numbers (reported in "warnings").
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const VERSION = '2.5.0'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const OFFLINE = process.env.SCRUM_OFFLINE === '1'
const DOCS = ['requests', 'items', 'agents', 'events', 'decisions']
const AUX = { _throughput: () => ({ days: {} }), _imported: () => ({ docs: {} }) }
const DOC_LIMIT = 200 * 1024
const MAX_EVENTS = 400
const MAX_AGENTS = 300
const MAX_IMPORTED = 5000
const NO_HEARTBEAT_MIN = 45
const LOCK_WAIT_MS = Number(process.env.SCRUM_WAIT_MS || 15000)
const STALE_LOCK_MS = Number(process.env.SCRUM_TRINCO_VELHO_MS || 10000)

const E = {
  requestStatus: ['new', 'analysing', 'in-progress', 'waiting-for-human', 'ready', 'in-production', 'cancelled'],
  origin: ['chat', 'messaging', 'panel', 'other'],
  priority: ['high', 'normal', 'low'],
  itemType: ['feature', 'bug', 'ops', 'docs', 'protocol', 'design'],
  itemStatus: ['backlog', 'ready', 'in-progress', 'in-review', 'verifying', 'integrated', 'in-production', 'blocked', 'cancelled'],
  verifyStatus: ['running', 'green', 'red', 'hung'],
  agentType: ['claude-session', 'claude-workflow', 'codex-job', 'other-agent', 'verification', 'script'],
  agentStatus: ['active', 'waiting', 'finished', 'error'],
  eventType: ['start', 'commit', 'verify', 'deploy', 'block', 'decision', 'note', 'end', 'error', 'request'],
  decisionStatus: ['open', 'decided'],
}
// Common alternative input forms (saved as their canonical value).
const SYNONYMS = {
  requestStatus: { 'waiting-for-decision': 'waiting-for-human' },
  origin: { 'message': 'other' },
  agentType: { 'verify': 'verification', 'tests': 'verification', 'agent': 'other-agent' },
  itemStatus: { 'in-testing': 'verifying', 'in-verification': 'verifying' },
}

// ------------------------------------------------------------------ repository, configuration, folders
// Main repository root (including from a worktree): SCRUM_REPO, otherwise git in the current directory,
// otherwise git in this file's folder (the copy in <repo>/.agentic/board/).
function rootGit(dir) {
  const r = spawnSync('git', ['-C', dir, 'rev-parse', '--path-format=absolute', '--git-common-dir', '--show-toplevel'], { encoding: 'utf8' })
  if (r.error || r.status !== 0) return null
  const [common, top] = r.stdout.trim().split('\n')
  return common && path.basename(common) === '.git' ? path.dirname(common) : (top || null)
}
const ROOT = process.env.SCRUM_REPO ? path.resolve(process.env.SCRUM_REPO) : (rootGit(process.cwd()) ?? rootGit(HERE))
const CONFIG_KEYS = {
  project: 'SCRUM_PROJECT', repo: 'SCRUM_REPO', branch: 'SCRUM_BRANCH', remote: 'SCRUM_REMOTE', readyz: 'SCRUM_READYZ',
  production_cmd: 'SCRUM_PRODUCTION_CMD', verify_notes: 'SCRUM_VERIFY_NOTES', deploy_notes: 'SCRUM_DEPLOY_NOTES',
  specs: 'SCRUM_SPECS', timezone: 'SCRUM_TZ', out: 'SCRUM_OUT', agent_end_cmd: 'SCRUM_AGENT_END_CMD',
}
// "vocabulary" (object) is the only non-text key: names already used by the project's state and page.
const VOCABULARY_KEYS = ['owner', 'labels', 'agent_types', 'server_key']
// Top-level metrics keys: the disk block key must not collide with any of these.
const METRIC_KEYS = ['generated_at', 'production', 'main', 'specs', 'verifications', 'deploys', 'throughput']
const warningsConfig = []
// Config file: SCRUM_CONFIG; otherwise the repository given by SCRUM_REPO; otherwise, with SCRUM_DIR,
// <SCRUM_DIR>/config.json (SCRUM_DIR replaces <repo>/.agentic/board, where config lives). "confirm" carries
// the plan's SCRUM_DIR and reads the same config regardless of its working directory. Only without any
// of these does it use the current directory's repository.
function fileConfig() {
  if (process.env.SCRUM_CONFIG) return path.resolve(process.env.SCRUM_CONFIG)
  if (!process.env.SCRUM_REPO && process.env.SCRUM_DIR) return path.join(path.resolve(process.env.SCRUM_DIR), 'config.json')
  return ROOT ? path.join(ROOT, '.agentic', 'board', 'config.json') : null
}
// Validate the config's "vocabulary" block; return the normalized object or {error}.
function readVocabulary(v) {
  if (v == null) return {}
  if (typeof v !== 'object' || Array.isArray(v)) return { error: 'config: "vocabulary" must be an object' }
  for (const k of Object.keys(v)) if (!VOCABULARY_KEYS.includes(k)) warningsConfig.push(`config: unknown key "vocabulary.${k}" ignored (accepted: ${VOCABULARY_KEYS.join(', ')})`)
  const out = {}
  if (v.owner != null) {
    if (typeof v.owner !== 'string' || !/^[a-z][a-z0-9]{1,29}$/.test(v.owner)) return { error: 'config: "vocabulary.owner" must be a lowercase word without accents (e.g. manager)' }
    out.owner = v.owner
  }
  if (v.labels != null) {
    if (typeof v.labels !== 'object' || Array.isArray(v.labels) || Object.values(v.labels).some((x) => typeof x !== 'string' || !x.trim() || x.length > 60)) {
      return { error: 'config: "vocabulary.labels" must be a status → text object (up to 60 characters)' }
    }
    out.labels = v.labels
  }
  if (v.agent_types != null) {
    if (!Array.isArray(v.agent_types) || v.agent_types.length > 10 || v.agent_types.some((x) => typeof x !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(x))) {
      return { error: 'config: "vocabulary.agent_types" must be a list of up to 10 ids ([a-z0-9-], up to 32 characters)' }
    }
    out.agent_types = [...new Set(v.agent_types)]
  }
  if (v.server_key != null) {
    if (typeof v.server_key !== 'string' || !/^[a-z][a-z0-9_]{1,29}$/.test(v.server_key) || METRIC_KEYS.includes(v.server_key)) {
      return { error: `config: "vocabulary.server_key" must match [a-z0-9_] and differ from ${METRIC_KEYS.join(', ')}` }
    }
    out.server_key = v.server_key
  }
  return out
}
function readConfig() {
  const f = fileConfig()
  let c = {}
  if (f && fs.existsSync(f)) {
    try { c = JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) { return { error: `invalid config at ${f}: ${e.message}` } }
    if (!c || typeof c !== 'object' || Array.isArray(c)) return { error: `invalid config at ${f}: expected a JSON object` }
    for (const k of Object.keys(c)) {
      if (!(k in CONFIG_KEYS) && k !== 'vocabulary' && !k.startsWith('_')) warningsConfig.push(`config: unknown key "${k}" ignored (accepted: ${[...Object.keys(CONFIG_KEYS), 'vocabulary'].join(', ')})`)
      else if (k in CONFIG_KEYS && c[k] != null && typeof c[k] !== 'string') return { error: `config: "${k}" must be text` }
    }
  }
  const out = { file: f && fs.existsSync(f) ? f : null }
  const voc = readVocabulary(c.vocabulary)
  if (voc.error) return { error: voc.error }
  out.vocabulary = voc
  for (const [k, v] of Object.entries(CONFIG_KEYS)) {
    const value = process.env[v] != null && process.env[v] !== '' ? process.env[v] : c[k]
    if (typeof value === 'string' && value.trim()) out[k] = value.trim()
  }
  return out
}
const CFG = readConfig()
// One timezone for all writers (SCRUM_TZ or config "timezone"; default: the system timezone), so throughput
// days and dates do not change with the host running the command.
if (CFG.timezone) process.env.TZ = CFG.timezone
const REPO = process.env.SCRUM_REPO ? ROOT : (CFG.repo && ROOT ? path.resolve(ROOT, CFG.repo) : ROOT)
const BRANCH = CFG.branch || 'main'
const REMOTE = CFG.remote || 'origin'
const SPEC_PATTERN = CFG.specs || 'specs/*/tasks.md'
const BASE = process.env.SCRUM_DIR ? path.resolve(process.env.SCRUM_DIR) : (ROOT ? path.join(ROOT, '.agentic', 'board') : null)
const STATE_DIR = BASE ? path.join(BASE, 'state') : null
// Export folder: config "out" (relative to the parent of state/), otherwise state/export.
const DEFAULT_OUT = STATE_DIR ? (CFG.out ? path.resolve(BASE, CFG.out) : path.join(STATE_DIR, 'export')) : null
const refNotes = (r) => (r ? (r.startsWith('refs/') ? r : `refs/notes/${r}`) : null)
const VERIFY_NOTES = refNotes(CFG.verify_notes)
const DEPLOY_NOTES = refNotes(CFG.deploy_notes)

// Project vocabulary (config "vocabulary"). Defaults: owner "human" (waiting-for-human), listed agent
// types and disk block "server". Projects whose state and page already use other names provide them here:
// owner (waiting-for-<owner>), extra agent types (no longer aliases of "verification"), event status labels
// and disk block key. Default forms remain accepted as input.
const VOC = CFG.vocabulary ?? {}
const OWNER = VOC.owner ?? 'human'
const WAITING = `waiting-for-${OWNER}`
const SERVER_KEY = VOC.server_key ?? 'server'
E.requestStatus = E.requestStatus.map((e) => (e === 'waiting-for-human' ? WAITING : e))
SYNONYMS.requestStatus = { 'waiting-for-decision': WAITING, ...(OWNER !== 'human' && { 'waiting-for-human': WAITING }) }
for (const t of VOC.agent_types ?? []) {
  if (!E.agentType.includes(t)) E.agentType.push(t)
  delete SYNONYMS.agentType[t]
}

// ------------------------------------------------------------------ errors, clock, text
const warnings = []
// "extra": JSON fields beside "error" (e.g. sync-plan documents missing a version).
class ErrorScrum extends Error {
  constructor(m, code = 1, extra) { super(m); this.code = code; this.extra = extra }
}
const fail = (m, code = 1, extra) => { throw new ErrorScrum(m, code, extra) }

// SCRUM_NOW fixes the clock (reproducible tests and exports).
function now() {
  const s = process.env.SCRUM_NOW
  if (s) { const d = new Date(s); if (!Number.isNaN(d.getTime())) return d }
  return new Date()
}
const p2 = (n) => String(n).padStart(2, '0')
// ISO 8601 in local time, with timezone (e.g. 2026-10-15T21:03:05+01:00).
function iso(d) {
  const off = -d.getTimezoneOffset(), a = Math.abs(off)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}` +
    `${off >= 0 ? '+' : '-'}${p2(Math.floor(a / 60))}:${p2(a % 60)}`
}
const dayOf = (d) => iso(d).slice(0, 10)
const compactDate = (d) => dayOf(d).replace(/-/g, '')
const ms = (s) => { const v = Date.parse(s ?? ''); return Number.isNaN(v) ? 0 : v }

const SECRETS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{30,}/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\b(?:password|passwd|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  // Personal data an agent might paste: international or North American phone numbers, bank account,
  // card and identification numbers with a document label. SHAs have no "+" or phone grouping.
  /\+\d{1,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}\b/g,
  /\b\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g,
  /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g,
  /\b(?:national\s+id|identification(?:\s+(?:number|no\.?))?|passport|ssn|card\s+(?:number|no\.?))\s*[:#.]?\s*\d[\d\s.-]{5,18}\d\b/gi,
]
function text(v, max, field, silent = false) {
  let s = String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim()
  let removed = false
  for (const re of SECRETS) s = s.replace(re, () => { removed = true; return '[removed]' })
  if (removed && !silent) warnings.push(`${field}: removed apparent secrets, emails, phone or identification numbers (the board stores no secrets or personal data)`)
  if (s.length > max) s = s.slice(0, max - 1).trimEnd() + '…'
  return s
}
function parseDate(v, field) {
  const d = new Date(v)
  if (v == null || v === '' || Number.isNaN(d.getTime())) fail(`${field}: invalid date "${v}" (ISO 8601, e.g. 2026-10-15T21:00:00+01:00)`, 2)
  return iso(d)
}

// ------------------------------------------------------------------ ids
const RE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/
function validateId(v, o = 'id') {
  const s = String(v ?? '').trim()
  if (!RE_ID.test(s)) fail(`${o} invalid "${v}": only [a-z0-9-], 1 to 64 characters, no leading or trailing hyphen`, 2)
  return s
}
const STOP_WORDS = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'the', 'to', 'with'])
function slug(s, words = 4) {
  const ps = String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter((p) => p && !STOP_WORDS.has(p))
  let out = ''
  for (const p of ps.slice(0, words)) { const c = out ? `${out}-${p}` : p; if (c.length > 32) break; out = c }
  return out || (ps[0] ?? '').slice(0, 32) || 'x'
}
function uniqueId(base, existing) {
  base = base.replace(/-+$/, '').slice(0, 58).replace(/-+$/, '')
  if (!existing.has(base)) return base
  for (let i = 2; ; i++) if (!existing.has(`${base}-${i}`)) return `${base}-${i}`
}

// ------------------------------------------------------------------ files, lock, state
const sleepBuffer = new Int32Array(new SharedArrayBuffer(4))
const sleep = (n) => { if (n > 0) Atomics.wait(sleepBuffer, 0, 0, n) }
function writeAtomic(f, content) {
  const tmp = `${f}.tmp-${process.pid}-${crypto.randomBytes(3).toString('hex')}`
  const fd = fs.openSync(tmp, 'w')
  try { fs.writeSync(fd, content); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
  fs.renameSync(tmp, f)
}
function readJson(f, empty) {
  let t
  try { t = fs.readFileSync(f, 'utf8') } catch (e) { if (e.code === 'ENOENT') return empty(); throw e }
  try { return JSON.parse(t) } catch { return fail(`corrupt state: ${f} is not valid JSON (restore it manually)`) }
}
// Mutual exclusion using mkdir, with the owner recorded inside (state/.lock/owner). A lock older than 10 s
// belongs to a dead or frozen process (job runners may SIGSTOP under memory pressure; commands hold it
// for milliseconds): break it. Two rules prevent data loss when breaking a lock:
// - hold the breaker lock (state/.lock-break) and recheck age before breaking, so two waiting processes
//   cannot break a lock the other just created;
// - check ownership (ownLock) before each write. A frozen process resuming after its lock was broken exits
//   75 without saving, rather than overwriting data written in the meantime.
// Wait at most SCRUM_WAIT_MS (15 s), then exit 75.
let ownerLock = null
const filePathLock = () => path.join(STATE_DIR, '.lock')
function breakIfStale(lock) {
  const breaker = `${lock}-break`
  try { fs.mkdirSync(breaker) } catch (e) {
    if (e.code !== 'EEXIST') throw e
    // The breaker may itself have died at that instant: its lock also expires.
    try { if (Date.now() - fs.statSync(breaker).mtimeMs > STALE_LOCK_MS) fs.rmSync(breaker, { recursive: true, force: true }) } catch { /* handled elsewhere */ }
    return
  }
  try {
    const s = fs.statSync(lock, { throwIfNoEntry: false })
    if (s && Date.now() - s.mtimeMs > STALE_LOCK_MS) fs.rmSync(lock, { recursive: true, force: true })
  } finally { try { fs.rmdirSync(breaker) } catch { /* already gone */ } }
}
function ownLock() {
  if (ownerLock === null) return true // no lock (negative test control)
  try { return fs.readFileSync(path.join(filePathLock(), 'owner'), 'utf8') === ownerLock } catch { return false }
}
function withLock(fn) {
  fs.mkdirSync(STATE_DIR, { recursive: true })
  if (process.env.SCRUM_TESTE_SEM_TRINCO === '1') return fn() // negative test control only
  const lock = filePathLock()
  const limit = Date.now() + LOCK_WAIT_MS
  const owner = `${process.pid}-${crypto.randomBytes(6).toString('hex')}`
  for (;;) {
    try { fs.mkdirSync(lock) } catch (e) {
      if (e.code !== 'EEXIST') throw e
      breakIfStale(lock)
      if (Date.now() > limit) fail('board busy: state/.lock was not released in time; retry', 75)
      sleep(5 + Math.floor(Math.random() * 25))
      continue
    }
    try { fs.writeFileSync(path.join(lock, 'owner'), owner) } catch { continue } // broken between mkdir and owner
    break
  }
  ownerLock = owner
  try { return fn() } finally {
    // Release only the lock we still own.
    if (ownLock()) { try { fs.rmSync(lock, { recursive: true, force: true }) } catch { /* already gone */ } }
    ownerLock = null
  }
}

class State {
  constructor() { this.d = {}; this.dirtyDocs = new Set() }
  doc(n) {
    if (!this.d[n]) {
      const v = readJson(path.join(STATE_DIR, `${n}.json`), AUX[n] ?? (() => ({ updated_at: null, items: [] })))
      if (DOCS.includes(n) && !Array.isArray(v.items)) fail(`state/${n}.json has no "items" list`)
      this.d[n] = v
    }
    return this.d[n]
  }
  list(n) { return this.doc(n).items }
  find(n, id) { return this.list(n).find((x) => x.id === id) }
  requireRecord(n, id, name) { return this.find(n, id) ?? fail(`${name} unknown: ${id}`) }
  dirty(n) { this.doc(n); this.dirtyDocs.add(n) }
  save() {
    const t = iso(now())
    for (const n of this.dirtyDocs) {
      if (DOCS.includes(n)) this.d[n].updated_at = t
      if (!ownLock()) fail('this command\'s lock was broken while waiting (frozen process?); nothing saved, retry', 75)
      writeAtomic(path.join(STATE_DIR, `${n}.json`), JSON.stringify(this.d[n], null, 1) + '\n')
    }
    this.dirtyDocs.clear()
  }
}
// Read, change and save under the lock. SCRUM_TESTE_ATRASO_MS widens the read→save window (tests only).
function transaction(fn) {
  return withLock(() => {
    const st = new State()
    const r = fn(st)
    sleep(Number(process.env.SCRUM_TESTE_ATRASO_MS || 0))
    st.save()
    return r
  })
}

// ------------------------------------------------------------------ schemas and field=value assignments
const T = (max, required = false) => ({ k: 'text', max, required })
const EN = (values, required = true, synonyms) => ({ k: 'enum', values, required, synonyms })
const REQUEST_SCHEMA = {
  title: T(200, true), description: T(1500), origin: EN(E.origin, true, SYNONYMS.origin), status: EN(E.requestStatus, true, SYNONYMS.requestStatus),
  priority: EN(E.priority), result: T(1000), requested_at: { k: 'date', required: true },
}
const ITEM_SCHEMA = {
  title: T(200, true), request: { k: 'id' }, spec: { k: 'id' }, type: EN(E.itemType), status: EN(E.itemStatus, true, SYNONYMS.itemStatus),
  owner: T(80), branch: { k: 'branch' }, sha: { k: 'sha' }, blocker: T(500), start: { k: 'date' },
  end: { k: 'date' }, notes: T(1000), criterion: T(500), depends: { k: 'ids' },
  verify: { k: 'obj' }, 'verify.status': EN(E.verifyStatus), 'verify.sha': { k: 'sha', required: true },
  'verify.profile': T(40), 'verify.at': { k: 'date', required: true }, 'verify.duration_s': { k: 'int' },
  tasks: { k: 'obj' }, 'tasks.done': { k: 'int', required: true }, 'tasks.total': { k: 'int', required: true },
}
const DECISION_SCHEMA = {
  question: T(500, true), recommendation: T(1000), status: EN(E.decisionStatus), decision: T(1000), item: { k: 'id' }, request: { k: 'id' },
}
const AGENT_SCHEMA = { name: T(120, true), type: EN(E.agentType, true, SYNONYMS.agentType), model: T(60), status: EN(E.agentStatus), item: { k: 'id' }, detail: T(300), lease: T(120) }

function convert(field, e, v) {
  v = String(v)
  switch (e.k) {
    case 'text': return text(v, e.max, field)
    case 'enum': if (e.synonyms?.[v]) v = e.synonyms[v]; if (!e.values.includes(v)) fail(`${field}: "${v}" is not valid (${e.values.join(' | ')})`, 2); return v
    case 'date': return parseDate(v, field)
    case 'int': if (!/^\d{1,9}$/.test(v)) fail(`${field}: expected integer ≥ 0, got "${v}"`, 2); return Number(v)
    case 'sha': { const s = v.trim().toLowerCase(); if (!/^[0-9a-f]{7,40}$/.test(s)) fail(`${field}: invalid SHA "${v}" (7 to 40 hex)`, 2); return s }
    case 'id': return validateId(v, field)
    case 'ids': { const l = [...new Set(v.split(',').map((x) => x.trim()).filter(Boolean))].map((x) => validateId(x, field)); if (l.length > 30) fail(`${field}: at most 30 ids`, 2); return l.length ? l : '' }
    case 'branch': { const s = v.trim(); if (!/^[A-Za-z0-9._/-]{1,120}$/.test(s)) fail(`${field}: invalid branch name "${v}"`, 2); return s }
    case 'obj': return fail(`${field}: can only be deleted as a whole ("${field}="); to change it use ${field}.<field>=value`, 2)
    default: return fail(`${field}: unknown internal type`)
  }
}
function pairs(list) {
  return list.map((a) => {
    const i = a.indexOf('=')
    if (i <= 0) fail(`invalid assignment "${a}": use field=value (empty deletes: field=)`, 2)
    return [a.slice(0, i).trim(), a.slice(i + 1)]
  })
}
function apply(obj, assignments, schema, name) {
  if (!assignments.length) fail(`${name} set: nothing to change (field=value …)`, 2)
  const changed = new Set()
  for (const [field, raw] of assignments) {
    const e = schema[field] ?? fail(`${name}: unknown field "${field}" (accepted: ${Object.keys(schema).join(', ')})`, 2)
    const [top, bottom] = field.split('.')
    const v = raw === '' ? '' : convert(field, e, raw)
    if (v === '') {
      if (e.required) fail(`${field} is required: cannot be deleted or empty`, 2)
      if (bottom) { if (obj[top]) delete obj[top][bottom] } else delete obj[top]
    } else if (bottom) {
      if (obj[top] != null && typeof obj[top] !== 'object') fail(`${top} is not an object`)
      ;(obj[top] ??= {})[bottom] = v
    } else obj[top] = v
    changed.add(field)
  }
  return changed
}

// ------------------------------------------------------------------ domain rules
function event(st, { type, text: tx, agent, item, request }) {
  const t = now(), list = st.list('events'), ids = new Set(list.map((e) => e.id))
  const stamp = iso(t).slice(0, 19).replace(/[-:]/g, '').replace('T', '-')
  let id
  do id = `e-${stamp}-${crypto.randomBytes(2).toString('hex')}`; while (ids.has(id))
  const e = { id, at: iso(t), type }
  if (agent) e.agent = agent
  if (item) e.item = item
  if (request) e.request = request
  e.text = text(tx, 400, 'text', true)
  list.unshift(e)
  list.sort((a, b) => ms(b.at) - ms(a.at))
  if (list.length > MAX_EVENTS) list.length = MAX_EVENTS
  st.dirty('events')
  return e
}
// Daily throughput (60 days): per day, ids of integrated and production items and keys of green/red
// verifications reported here. Store keys rather than counts to avoid duplicates: an item integrated
// twice on the same day, or a verification reported by both item set and event verify (as the README
// suggests), counts once. A verification key is its SHA's first 7 characters; metrics merge these with
// verification notes (config "verify_notes") using the same key.
const keySha = (s) => String(s).toLowerCase().slice(0, 7)
const SHA_IN_TEXT = /\b[0-9a-f]{7,40}\b/i
function count(st, field, key) {
  const r = st.doc('_throughput'); r.days ??= {}
  const d = dayOf(now())
  const day = (r.days[d] ??= {})
  const l = Array.isArray(day[field]) ? day[field] : (day[field] = [])
  if (!l.includes(key)) l.push(key)
  const limit = dayOf(new Date(now().getTime() - 60 * 86400000))
  for (const k of Object.keys(r.days)) if (k < limit) delete r.days[k]
  st.dirty('_throughput')
}
// Status labels for event text (shown verbatim to the human); config may override them.
const STATUS_LABEL = {
  'new': 'new', 'analysing': 'analysing', 'in-progress': 'in progress',
  'ready': 'ready', 'in-production': 'in production', 'cancelled': 'cancelled', 'backlog': 'backlog',
  'in-review': 'in review', 'verifying': 'verifying', 'integrated': 'integrated', 'blocked': 'blocked',
  'running': 'running', 'green': 'green', 'red': 'red', 'hung': 'hung',
}
STATUS_LABEL[WAITING] = `waiting for ${OWNER}`
Object.assign(STATUS_LABEL, VOC.labels)
const nameStatus = (e) => STATUS_LABEL[e] ?? e ?? '?'
const STARTED = new Set(['in-progress', 'in-review', 'verifying', 'integrated', 'in-production'])
const CLOSED = new Set(['integrated', 'in-production', 'cancelled'])
function changeItemStatus(st, it, target) {
  const from = it.status
  if (from === target) return
  const t = iso(now())
  it.status = target
  it.updated_at = t
  if (STARTED.has(target) && !it.start) it.start = t
  if (CLOSED.has(target)) { if (!it.end) it.end = t } else delete it.end
  if (target === 'integrated') count(st, 'integrated', it.id)
  if (target === 'in-production') count(st, 'in_production', it.id)
  const blocked = target === 'blocked'
  // The event holds the item id (the board links it by title); text describes only what changed.
  event(st, { type: blocked ? 'block' : 'note', text: `${nameStatus(from)} → ${nameStatus(target)}${blocked && it.blocker ? `: ${it.blocker}` : ''}`, item: it.id, request: it.request })
  st.dirty('items')
}
// A request follows its items while in an automatic status. "waiting-for-human" (the project's human
// decision-maker) and "cancelled" are human decisions: leave them alone.
const AUTO_REQUEST = new Set(['new', 'analysing', 'in-progress', 'ready', 'in-production'])
function deriveRequest(st, pid) {
  const p = st.find('requests', pid)
  if (!p || !AUTO_REQUEST.has(p.status)) return
  const its = (p.items ?? []).map((id) => st.find('items', id)).filter((i) => i && i.status !== 'cancelled')
  if (!its.length) return
  let fresh
  if (its.every((i) => i.status === 'in-production')) fresh = 'in-production'
  else if (its.every((i) => i.status === 'integrated' || i.status === 'in-production')) fresh = 'ready'
  else if (its.some((i) => i.status !== 'backlog' && i.status !== 'ready')) fresh = 'in-progress'
  else return
  if (fresh === p.status) return
  const from = p.status
  p.status = fresh
  p.updated_at = iso(now())
  st.dirty('requests')
  event(st, { type: 'note', text: `request ${nameStatus(from)} → ${nameStatus(fresh)}`, request: p.id })
}
function unlinkFromRequest(st, pid, iid) {
  const p = pid && st.find('requests', pid)
  if (!p) return
  p.items = (p.items ?? []).filter((x) => x !== iid)
  p.updated_at = iso(now())
  st.dirty('requests')
}
function linkToRequest(st, p, it) {
  p.items ??= []
  if (!p.items.includes(it.id)) p.items.push(it.id)
  p.updated_at = iso(now())
  it.request = p.id
  st.dirty('requests')
  st.dirty('items')
}

// ------------------------------------------------------------------ commands
function options(op, accepted) {
  for (const k of Object.keys(op)) if (!accepted.includes(k)) fail(`unknown option --${k}${accepted.length ? ` (accepted: ${accepted.map((a) => `--${a}`).join(' ')})` : ''}`, 2)
}

function newRequest(st, { id, title, description, origin, priority, status = 'new', when }) {
  const list = st.list('requests'), ids = new Set(list.map((p) => p.id))
  const tt = text(title, 200, 'title') || fail('request: missing title', 2)
  const q = when ?? now()
  if (id) { if (ids.has(id)) fail(`request already exists: ${id} (to change: request set ${id} field=value)`) }
  else id = uniqueId(`p-${compactDate(q)}-${slug(tt)}`, ids)
  const p = { id, title: tt }
  const ds = description != null ? text(description, 1500, 'description') : ''
  if (ds) p.description = ds
  Object.assign(p, { requested_at: iso(q), origin, status, priority, items: [], updated_at: iso(now()) })
  list.unshift(p)
  st.dirty('requests')
  event(st, { type: 'request', text: `new request${origin === 'panel' ? ' (panel)' : ''}: ${tt}`, request: id })
  return p
}

function requestAdd(st, op) {
  options(op, ['title', 'description', 'origin', 'priority', 'id', 'status'])
  if (op.title == null) fail('request add: missing --title', 2)
  return {
    ok: true,
    request: newRequest(st, {
      id: op.id != null ? validateId(op.id) : undefined,
      title: op.title,
      description: op.description,
      origin: convert('origin', REQUEST_SCHEMA.origin, op.origin ?? 'chat'),
      priority: convert('priority', REQUEST_SCHEMA.priority, op.priority ?? 'normal'),
      status: convert('status', REQUEST_SCHEMA.status, op.status ?? 'new'),
    }),
  }
}

function requestSet(st, id, assignments) {
  const p = st.requireRecord('requests', validateId(id), 'request')
  const before = p.status
  apply(p, assignments, REQUEST_SCHEMA, 'request')
  p.updated_at = iso(now())
  st.dirty('requests')
  if (p.status !== before) event(st, { type: 'note', text: `request ${nameStatus(before)} → ${nameStatus(p.status)}`, request: p.id })
  return { ok: true, request: p }
}

function requestLink(st, pid, iid) {
  const p = st.requireRecord('requests', validateId(pid, 'request'), 'request')
  const it = st.requireRecord('items', validateId(iid, 'item'), 'item')
  const previous = it.request
  if (previous && previous !== p.id) unlinkFromRequest(st, previous, it.id)
  linkToRequest(st, p, it)
  it.updated_at = iso(now())
  if (previous !== p.id) event(st, { type: 'note', text: `linked to request "${p.title}"`, item: it.id, request: p.id })
  deriveRequest(st, p.id)
  if (previous && previous !== p.id) deriveRequest(st, previous)
  return { ok: true, request: p, item: it }
}

function itemAdd(st, op) {
  options(op, ['title', 'request', 'spec', 'type', 'status', 'id', 'owner', 'branch', 'sha', 'notes', 'criterion', 'depends'])
  const list = st.list('items'), ids = new Set(list.map((i) => i.id))
  const title = text(op.title ?? '', 200, 'title') || fail('item add: missing --title', 2)
  const type = convert('type', ITEM_SCHEMA.type, op.type ?? 'feature')
  const target = convert('status', ITEM_SCHEMA.status, op.status ?? 'backlog')
  const spec = op.spec != null ? validateId(op.spec, 'spec') : undefined
  const request = op.request != null ? st.requireRecord('requests', validateId(op.request, 'request'), 'request') : undefined
  let id = op.id != null ? validateId(op.id) : null
  if (id && ids.has(id)) fail(`item already exists: ${id} (to change: item set ${id} field=value)`)
  if (!id) id = uniqueId(`i-${spec ? `${spec.match(/^\d+/)?.[0] ?? slug(spec, 2)}-` : ''}${slug(title)}`, ids)
  const it = { id, title, type, status: 'backlog', updated_at: iso(now()) }
  if (spec) it.spec = spec
  for (const k of ['owner', 'branch', 'sha', 'notes', 'criterion', 'depends']) {
    if (op[k] == null || op[k] === '') continue
    const v = convert(k, ITEM_SCHEMA[k], op[k])
    if (v !== '') it[k] = v
  }
  list.unshift(it)
  st.dirty('items')
  if (request) linkToRequest(st, request, it)
  event(st, { type: 'note', text: `new item: ${title}`, item: id, request: request?.id })
  if (target !== 'backlog') changeItemStatus(st, it, target)
  if (request) deriveRequest(st, request.id)
  return { ok: true, item: it }
}

function itemSet(st, id, assignments) {
  const it = st.requireRecord('items', validateId(id), 'item')
  const before = { status: it.status, request: it.request, verifyStatus: it.verify?.status, verifySha: it.verify?.sha, blocker: it.blocker }
  const changed = apply(it, assignments, ITEM_SCHEMA, 'item')
  const t = iso(now())
  if (it.verify) {
    const b = it.verify
    if (changed.has('verify.status') && !changed.has('verify.at')) b.at = t
    if (!b.sha && it.sha) b.sha = it.sha
    if (!b.at) b.at = t
    if (!b.status) fail('verify.status missing (running | green | red | hung)', 2)
    if (!b.sha) fail('verify.sha missing: give verify.sha=<sha> or set the item sha', 2)
  }
  if (it.tasks) {
    const tf = it.tasks
    if (tf.done == null || tf.total == null) fail('tasks: give both tasks.done=N tasks.total=M', 2)
    if (tf.done > tf.total) fail(`tasks: done (${tf.done}) greater than total (${tf.total})`, 2)
  }
  it.updated_at = t
  st.dirty('items')
  if (it.request !== before.request) {
    const fresh = it.request ? st.requireRecord('requests', it.request, 'request') : null
    if (before.request) unlinkFromRequest(st, before.request, it.id)
    if (fresh) linkToRequest(st, fresh, it)
  }
  const target = it.status
  if (target !== before.status) { it.status = before.status; changeItemStatus(st, it, target) }
  else if (changed.has('blocker') && it.blocker && it.blocker !== before.blocker) {
    event(st, { type: 'block', text: `blocked: ${it.blocker}`, item: it.id, request: it.request })
  }
  const b = it.verify
  if (b && changed.has('verify.status') && (b.status !== before.verifyStatus || b.sha !== before.verifySha)) {
    event(st, { type: 'verify', text: `verification ${nameStatus(b.status)} at ${b.sha.slice(0, 9)}${b.profile ? ` · ${b.profile}` : ''}`, item: it.id, request: it.request })
    if (b.status === 'red') count(st, 'reds', keySha(b.sha))
    if (b.status === 'green') count(st, 'greens', keySha(b.sha))
  }
  for (const pid of new Set([before.request, it.request].filter(Boolean))) deriveRequest(st, pid)
  return { ok: true, item: it }
}

function agentHeartbeat(st, idRaw, op, end) {
  options(op, ['name', 'type', 'status', 'item', 'detail', 'model', 'lease'])
  const id = validateId(idRaw, 'agent')
  const status = convert('status', AGENT_SCHEMA.status, op.status ?? (end ? 'finished' : 'active'))
  if (end && status !== 'finished' && status !== 'error') fail('agent end: --status finished | error', 2)
  const list = st.list('agents'), t = iso(now())
  let a = st.find('agents', id)
  if (!a) {
    if (!op.name || !op.type) fail(`new agent "${id}": --name and --type are required (${E.agentType.join(' | ')})`, 2)
    a = { id, name: '', type: '', status, start: t, last_heartbeat: t }
    list.unshift(a)
  } else if (!end && status === 'active' && (a.status === 'finished' || a.status === 'error')) a.start = t
  for (const k of ['name', 'type', 'model', 'item', 'detail', 'lease']) {
    if (op[k] == null) continue
    const v = op[k] === '' ? '' : convert(k, AGENT_SCHEMA[k], op[k])
    if (v !== '') a[k] = v
    else if (AGENT_SCHEMA[k].required || k === 'type') fail(`agent: ${k} cannot be empty`, 2)
    else delete a[k]
  }
  a.status = status
  a.last_heartbeat = t
  if (list.length > MAX_AGENTS) {
    const old = list.filter((x) => x.status !== 'active').sort((x, y) => ms(x.last_heartbeat) - ms(y.last_heartbeat))
    const excluded = new Set(old.slice(0, list.length - MAX_AGENTS).map((x) => x.id))
    st.doc('agents').items = list.filter((x) => !excluded.has(x.id))
  }
  st.dirty('agents')
  return { ok: true, agent: a }
}

// Agent end command (config "agent_end_cmd", sh -c): runs after saving the end, outside the lock, with
// the agent record as JSON on stdin. Its JSON object's keys join the agent end response (never "ok",
// "agent" or "warnings"). Connect project-specific actions (release a lease, notify a panel) to agent
// completion; the CLI does not know their meaning. Failure, a timeout after 30 s or non-JSON output does
// not undo completion: emit a warning.
function endAgentCommand(a) {
  const cmd = CFG.agent_end_cmd
  if (!cmd) return {}
  const r = spawnSync('sh', ['-c', cmd], { input: JSON.stringify(a), encoding: 'utf8', timeout: 30000, env: { ...process.env, SCRUM_DIR: BASE ?? '' } })
  if (r.error || r.status !== 0) {
    warnings.push(`agent end: agent_end_cmd failed (${r.error ? (r.error.code ?? 'error') : `code ${r.status}`}); the end was saved`)
    return {}
  }
  try {
    const j = JSON.parse(r.stdout)
    if (j && typeof j === 'object' && !Array.isArray(j)) { delete j.ok; delete j.agent; delete j.warnings; return j }
  } catch { /* fall through to warning */ }
  warnings.push('agent end: agent_end_cmd did not write a JSON object; the end was saved')
  return {}
}

function eventCmd(st, pos, op) {
  options(op, ['agent', 'item', 'request'])
  const type = convert('type', EN(E.eventType), pos[0] ?? fail(`event: missing type (${E.eventType.join(' | ')})`, 2))
  const tx = text(pos.slice(1).join(' '), 400, 'text') || fail('event: missing text', 2)
  const e = event(st, {
    type, text: tx,
    agent: op.agent != null ? validateId(op.agent, 'agent') : undefined,
    item: op.item != null ? validateId(op.item, 'item') : undefined,
    request: op.request != null ? validateId(op.request, 'request') : undefined,
  })
  if (type === 'verify') {
    // Key: SHA in the text (same as item set verify.* and notes); without a SHA, the event itself.
    const key = tx.match(SHA_IN_TEXT)?.[0] ? keySha(tx.match(SHA_IN_TEXT)[0]) : e.id
    if (/\bred\b/i.test(tx)) count(st, 'reds', key)
    else if (/\bgreen\b/i.test(tx)) count(st, 'greens', key)
  }
  return { ok: true, event: e }
}

function decisionAdd(st, op) {
  options(op, ['question', 'recommendation', 'item', 'request', 'id'])
  const question = text(op.question ?? '', 500, 'question') || fail('decision add: missing --question', 2)
  const list = st.list('decisions'), ids = new Set(list.map((d) => d.id))
  const t = now()
  let id = op.id != null ? validateId(op.id) : null
  if (id && ids.has(id)) fail(`decision already exists: ${id} (to change: decision set ${id} field=value)`)
  id ??= uniqueId(`d-${compactDate(t)}-${slug(question)}`, ids)
  const d = { id, question }
  const r = op.recommendation != null ? text(op.recommendation, 1000, 'recommendation') : ''
  if (r) d.recommendation = r
  d.status = 'open'
  if (op.item != null) d.item = validateId(op.item, 'item')
  if (op.request != null) d.request = validateId(op.request, 'request')
  d.created_at = iso(t)
  list.unshift(d)
  st.dirty('decisions')
  event(st, { type: 'decision', text: `open decision: ${question}`, item: d.item, request: d.request })
  return { ok: true, decision: d }
}

function decisionSet(st, id, assignments) {
  const d = st.requireRecord('decisions', validateId(id), 'decision')
  const before = d.status
  apply(d, assignments, DECISION_SCHEMA, 'decision')
  if (d.status === 'decided') {
    if (!d.decision) fail('"decided" decision without text: also give decision="…"', 2)
    if (before !== 'decided') {
      d.decided_at = iso(now())
      event(st, { type: 'decision', text: `decided: ${d.question} → ${d.decision}`, item: d.item, request: d.request })
    }
  } else delete d.decided_at
  st.dirty('decisions')
  return { ok: true, decision: d }
}

// Import the panel inbox (new-requests collection, read by ArtifactData with out_dir).
// Idempotent: a local record (state/_imported.json) stores doc_id → request.
// Folder: list's out_dir (with the new-requests/ subfolder ArtifactData creates) or that subfolder itself.
const inboxFolder = (d) => (fs.existsSync(path.join(d, 'new-requests')) ? path.join(d, 'new-requests') : d)
function readInbox(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const doc_id = f.slice(0, -5)
    try { return { doc_id, obj: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } } catch { return { doc_id, error: 'invalid JSON' } }
  })
}
// Request fields in an inbox document: the object itself or an envelope (data, fields, …) with "title".
function inboxData(o) {
  const data = [o, o?.data, o?.fields, o?.document, o?.doc, o?.value].find((x) => x && typeof x === 'object' && typeof x.title === 'string')
  return data && data.title.trim() ? data : null
}
function importInbox(pos, op) {
  options(op, [])
  const dir = inboxFolder(path.resolve(pos[0] ?? fail('import: missing folder (ArtifactData out_dir)', 2)))
  if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) fail(`import: folder does not exist ${dir}`, 2)
  return importInboxDocs(readInbox(dir))
}
// versions (sync-plan --inbox only): inbox versions pasted into --versions. A valid, not-yet-imported
// document without a version rejects everything (code 2, nothing imported), under the import lock.
// Already-imported documents pass (no version means no delete; sync-plan puts them in inbox.deferred).
// These are files left in out_dir by an earlier list after another agent imported and deleted the
// request: list does not remove existing local files.
function importInboxDocs(docs, versions) {
  return transaction((st) => {
    const reg = st.doc('_imported')
    reg.docs ??= {}
    if (versions) {
      const missingVersions = docs.filter((d) => !d.error && inboxData(d.obj) && !(versions[d.doc_id] > 0) && !reg.docs[d.doc_id]).map((d) => `new-requests/${d.doc_id}`)
      if (missingVersions.length) {
        fail(`sync-plan: ${missingVersions.length} inbox ${plural(missingVersions.length, 'document', 'documents')} without a version in --versions; nothing imported or prepared: if ArtifactData list for new-requests shows them, paste the "version N" lines into --versions and repeat 1–2; otherwise (old out_dir file, or another list in the same folder), empty each one (: > <out_dir>/new-requests/<id>.json) and repeat only step 2`,
          2, { missing_version: missingVersions })
      }
    }
    const r = { ok: true, imported: [], created: [], existing: [], invalid: [] }
    for (const d of docs) {
      if (reg.docs[d.doc_id]) { r.imported.push(d.doc_id); r.existing.push(d.doc_id); continue }
      if (d.error) { r.invalid.push({ doc_id: d.doc_id, error: d.error }); continue }
      const data = inboxData(d.obj)
      if (!data) { r.invalid.push({ doc_id: d.doc_id, error: 'missing title' }); continue }
      const q = data.created_at != null ? new Date(data.created_at) : null
      try {
        const p = newRequest(st, {
          title: data.title,
          description: typeof data.description === 'string' ? data.description : undefined,
          origin: 'panel',
          priority: E.priority.includes(data.priority) ? data.priority : 'normal',
          when: q && !Number.isNaN(q.getTime()) ? q : undefined,
        })
        reg.docs[d.doc_id] = { request: p.id, at: iso(now()) }
        st.dirty('_imported')
        r.imported.push(d.doc_id)
        r.created.push(p.id)
      } catch (e) {
        if (!(e instanceof ErrorScrum)) throw e
        r.invalid.push({ doc_id: d.doc_id, error: e.message })
      }
    }
    const keys = Object.keys(reg.docs)
    if (keys.length > MAX_IMPORTED) {
      keys.sort((a, b) => ms(reg.docs[a].at) - ms(reg.docs[b].at)).slice(0, keys.length - MAX_IMPORTED).forEach((k) => delete reg.docs[k])
    }
    return r
  })
}

// After a green deployment: integrated items whose sha is contained in the production SHA become in-production.
function production(pos, op) {
  options(op, [])
  const sha = convert('sha', { k: 'sha' }, pos[0] ?? fail('production: missing production SHA', 2))
  // Git runs outside the lock (may be slow); inside it, promote only items whose sha still matches the check.
  const cands = new State().list('items').filter((i) => i.status === 'integrated' && i.sha)
  const contained = new Map(cands.filter((i) => git(['merge-base', '--is-ancestor', i.sha, sha]) !== null).map((i) => [i.id, i.sha]))
  return transaction((st) => {
    const promoted = []
    for (const it of st.list('items')) {
      if (it.status === 'integrated' && it.sha && contained.get(it.id) === it.sha) { changeItemStatus(st, it, 'in-production'); promoted.push(it.id) }
    }
    for (const pid of new Set(promoted.map((id) => st.find('items', id)?.request).filter(Boolean))) deriveRequest(st, pid)
    return { ok: true, sha, promoted }
  })
}

function show(pos, op) {
  options(op, [])
  const n = pos[0]
  if (!DOCS.includes(n)) fail(`show: document ${DOCS.join(' | ')} [id]`, 2)
  const st = new State()
  if (pos[1]) return { ok: true, [n]: st.requireRecord(n, pos[1], n) }
  return { ok: true, document: n, ...st.doc(n) }
}

// ------------------------------------------------------------------ export and metrics
function git(args, timeout = 30000) {
  if (!REPO) return null
  const r = spawnSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8', timeout, maxBuffer: 128 << 20,
    // No GIT_SSH_COMMAND: it would hide a repository's core.sshCommand (its own key).
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
  return r.error || r.status !== 0 ? null : r.stdout
}
// Non-interactive fetch: repository ssh (core.sshCommand, if set) with BatchMode, so a key without an
// agent fails immediately rather than waiting for a passphrase until timeout. HTTPS without credentials
// also fails (GIT_TERMINAL_PROMPT=0). Do not try without a configured remote.
let hasRemote = null
function gitFetch(refspecs) {
  hasRemote ??= git(['remote', 'get-url', REMOTE]) !== null
  if (!hasRemote) return null
  const ssh = git(['config', '--get', 'core.sshCommand'])?.trim() || 'ssh'
  return git(['-c', `core.sshCommand=${ssh} -o BatchMode=yes -o ConnectTimeout=15`, 'fetch', '-q', REMOTE, ...refspecs], 90000)
}
// Main branch: remote ref (refs/remotes/<remote>/<branch>) if present, otherwise local.
let mainRef
function mainBranch() {
  if (mainRef !== undefined) return mainRef
  for (const r of [`refs/remotes/${REMOTE}/${BRANCH}`, `refs/heads/${BRANCH}`]) if (git(['rev-parse', '--verify', '-q', `${r}^{commit}`])) return (mainRef = r)
  return (mainRef = null)
}
function readBlobs(oids) {
  const unique = [...new Set(oids)]
  const m = new Map()
  if (!unique.length || !REPO) return m
  const r = spawnSync('git', ['-C', REPO, 'cat-file', '--batch'], { input: unique.join('\n') + '\n', maxBuffer: 512 << 20, timeout: 60000 })
  if (r.error || r.status !== 0) return m
  const buf = r.stdout
  let i = 0
  while (i < buf.length) {
    const nl = buf.indexOf(0x0a, i)
    if (nl < 0) break
    const [oid, type, size] = buf.subarray(i, nl).toString('utf8').split(' ')
    if (type === 'missing' || size === undefined) { i = nl + 1; continue }
    const n = Number(size)
    m.set(oid, buf.subarray(nl + 1, nl + 1 + n).toString('utf8'))
    i = nl + 1 + n + 1
  }
  return m
}
function readNotes(ref) {
  if (!ref) return []
  const list = git(['notes', `--ref=${ref}`, 'list'])
  if (!list) return []
  const pairs = list.split('\n').filter(Boolean).map((l) => l.split(' '))
  const blobs = readBlobs(pairs.map((p) => p[0]))
  return pairs.map(([blob, commit]) => ({ commit, text: blobs.get(blob) ?? '' }))
}
const json = (s) => { try { return JSON.parse(s) } catch { return null } }
const first = (...vs) => vs.find((v) => v != null && v !== '')

// Verification notes (config "verify_notes"): one JSON note per tested commit.
//   {"result":"green"|"red"|"hung", "at":ISO, "profile":"…", "duration_s":N, "sha":"…"}
// Also accepts {"status":"pass"|"fail", "complete":bool, "created_at":ISO, "seconds":N}. Without "sha", use
// the note's commit. Ignore notes without a valid date or result.
function verificationsFromNotes() {
  const out = []
  for (const { commit, text: tx } of readNotes(VERIFY_NOTES)) {
    const j = json(tx)
    if (!j || typeof j !== 'object') continue
    const at = new Date(first(j.at, j.created_at, j.when))
    if (Number.isNaN(at.getTime())) continue
    let result = E.verifyStatus.includes(j.result) && j.result !== 'running' ? j.result : null
    if (!result && typeof j.status === 'string') result = /^(pass|passed|ok|success|green)$/i.test(j.status) && j.complete !== false ? 'green' : 'red'
    if (!result) continue
    const sha = String(j.sha || commit).toLowerCase()
    if (!/^[0-9a-f]{7,40}$/.test(sha)) continue
    const b = { sha: sha.slice(0, 9), profile: typeof j.profile === 'string' && j.profile ? text(j.profile, 40, 'profile', true) : 'complete', result, at: iso(at) }
    const dur = Number(first(j.duration_s, j.seconds))
    if (Number.isFinite(dur) && dur >= 0) b.duration_s = Math.round(dur)
    out.push(b)
  }
  return out.sort((a, b) => ms(b.at) - ms(a.at))
}
// Deployment notes (config "deploy_notes"): {"at"|"when":ISO, "sha":"…", "smoke":{"passed":N,"failed":N},
// "rollback":"rollback tag"}; without "sha", use the note's commit.
function deploysFromNotes() {
  const out = []
  for (const { commit, text: tx } of readNotes(DEPLOY_NOTES)) {
    const j = json(tx)
    if (!j || typeof j !== 'object') continue
    const at = new Date(first(j.at, j.when, j.created_at))
    if (Number.isNaN(at.getTime())) continue
    const sha40 = String(j.sha || commit).toLowerCase()
    if (!/^[0-9a-f]{7,40}$/.test(sha40)) continue
    const d = { sha: sha40.slice(0, 9), at: iso(at), sha40 }
    if (j.smoke && Number.isFinite(j.smoke.passed) && Number.isFinite(j.smoke.failed)) d.smoke = { passed: j.smoke.passed, failed: j.smoke.failed }
    if (typeof j.rollback === 'string' && j.rollback) d.rollback = text(j.rollback, 120, 'rollback', true)
    out.push(d)
  }
  return out.sort((a, b) => ms(b.at) - ms(a.at))
}
// Spec title: file H1 without the "Tasks:"/"Tasks —" prefix. An H1 containing only "Tasks", "Tasks 003"
// or "Spec 002" says nothing: use the folder name without its number (002-orders → "orders").
function titleTasks(tx, id) {
  const m = tx.match(/^#\s+(.+)$/m)
  let t = m ? m[1].replace(/^(?:tasks?|tasks)(?:\s+(?:spec\s+)?\d+)?\s*[:—–-]\s*/i, '').trim() : ''
  if (/^(?:tasks?|tasks|spec)?\s*(?:\d+)?$/i.test(t)) t = id.replace(/^\d+-/, '').replace(/-/g, ' ')
  return text(t || id, 160, 'title', true)
}
// Spec pattern (config "specs", default: Spec Kit's specs/*/tasks.md): "*" matches a path segment; the
// first "*" is the spec id. Return the fixed folder before the first "*" and the path-matching expression.
function specPattern() {
  const p = SPEC_PATTERN.replace(/^\.?\/+/, '')
  if (!p.includes('*') || p.includes('**')) { warnings.push(`specs: pattern "${SPEC_PATTERN}" needs one "*" per segment (e.g. specs/*/tasks.md); specs ignored`); return null }
  const seg = p.split('/')
  const fixed = seg.slice(0, seg.findIndex((x) => x.includes('*'))).join('/')
  let n = 0
  const re = new RegExp('^' + seg.map((x) => x.split('*').map((y) => y.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('\u0000')).join('/')
    .replace(/\u0000/g, () => (n++ === 0 ? '([^/]+)' : '[^/]*')) + '$')
  return { fixed, re }
}
// Task files on the main branch and local branches with commits in the last 14 days; keep the most
// advanced version per spec. Include specs with open tasks and those closed in the last 7 days. Sort
// open specs first, then each group by most recent change (the file on main, or the branch).
function specs(t) {
  const pd = specPattern(), ref = mainBranch()
  if (!pd) return []
  const fer = git(['for-each-ref', '--format=%(refname)%09%(refname:short)%09%(committerdate:unix)', 'refs/heads']) ?? ''
  const since14 = t.getTime() / 1000 - 14 * 86400, since7 = t.getTime() / 1000 - 7 * 86400
  const refs = ref ? [{ ref, branch: null, when: 0 }] : []
  for (const l of fer.split('\n').filter(Boolean)) {
    const [r, short, q] = l.split('\t')
    if (r !== ref && short !== BRANCH && Number(q) >= since14) refs.push({ ref: r, branch: short, when: Number(q) })
  }
  const entries = []
  const fromMain = new Map()
  for (const r of refs) {
    const ls = git(['ls-tree', '-r', r.ref, ...(pd.fixed ? ['--', pd.fixed] : [])])
    if (ls == null) continue
    for (const l of ls.split('\n')) {
      const m = l.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/)
      const c = m && m[2].match(pd.re)
      if (!c) continue
      if (!r.branch) fromMain.set(c[1], m[1])
      else if (fromMain.get(c[1]) === m[1]) continue
      entries.push({ ...r, oid: m[1], spec: c[1] })
    }
  }
  const blobs = readBlobs(entries.map((e) => e.oid))
  const bySpec = new Map()
  for (const e of entries) {
    const tx = blobs.get(e.oid) ?? ''
    const done = (tx.match(/^\s*[-*] \[[xX]\]/gm) ?? []).length
    const total = done + (tx.match(/^\s*[-*] \[ \]/gm) ?? []).length
    if (!total) continue
    const c = { id: text(e.spec, 80, 'spec', true), title: titleTasks(tx, e.spec), done, total, branch: e.branch, when: e.when }
    const a = bySpec.get(e.spec)
    if (!a || c.done > a.done || (c.done === a.done && a.branch && c.branch && c.when > a.when)) bySpec.set(e.spec, c)
  }
  // Last main-branch commit changing each task file (one git log, newest first).
  const changedAtOnMain = new Map()
  let ct = 0
  if (ref) {
    for (const l of (git(['log', '--format=%x00%ct', '--name-only', ref, '--', `:(glob)${SPEC_PATTERN.replace(/^\.?\/+/, '')}`]) ?? '').split('\n')) {
      if (l.startsWith('\0')) { ct = Number(l.slice(1)); continue }
      const m = l.match(pd.re)
      if (m && !changedAtOnMain.has(m[1])) changedAtOnMain.set(m[1], ct)
    }
  }
  const changedAt = (s) => (s.branch ? s.when : changedAtOnMain.get(s.id) ?? 0)
  const open = (s) => s.done < s.total
  return [...bySpec.values()]
    .filter((s) => open(s) || changedAt(s) >= since7)
    .sort((a, b) => Number(open(b)) - Number(open(a)) || changedAt(b) - changedAt(a) || b.id.localeCompare(a.id, 'en', { numeric: true }))
    .map(({ id, title, done, total, branch }) => (branch ? { id, title, done, total, branch } : { id, title, done, total }))
}
// Production SHA and free disk space from config "production_cmd", read-only, cached for 10 min
// (state/.cache-production.json). The command writes the SHA (7–40 hex) on line 1 and optional free disk
// space in GB ("31", "31G", "31.4 GB") on line 2. Runs with sh -c in the repository; 30 s timeout.
function remoteProduction() {
  const cmd = CFG.production_cmd
  if (!cmd || OFFLINE) return {}
  const cacheF = path.join(STATE_DIR, '.cache-production.json')
  const ttl = Number(process.env.SCRUM_CACHE_PRODUCAO_S ?? 600) * 1000
  const key = sha256(cmd).slice(0, 16)
  let c = null
  try { c = readJson(cacheF, () => null) } catch { /* corrupt cache: measure again */ }
  if (c?.sha && c.key === key && Date.now() - (c.measured_ms ?? 0) < ttl) return c
  const r = spawnSync('sh', ['-c', cmd], { encoding: 'utf8', timeout: 30000, cwd: REPO ?? undefined, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
  if (r.error || r.status !== 0) return {}
  const [l1 = '', l2 = ''] = (r.stdout ?? '').trim().split('\n').map((s) => s.trim())
  if (!/^[0-9a-fA-F]{7,40}$/.test(l1)) return {}
  const g = l2.match(/^(\d+(?:[.,]\d+)?)\s*(?:G|GB|GiB)?$/i)
  const disk = g ? Number(g[1].replace(',', '.')) : undefined
  const fresh = { key, measured_ms: Date.now(), at: iso(now()), sha: l1.toLowerCase(), ...(disk != null && { disk }) }
  try { writeAtomic(cacheF, JSON.stringify(fresh) + '\n') } catch { /* cache is optional */ }
  return fresh
}
// Production health (config "readyz"): ready = HTTP 2xx and, for a JSON body with "status", one of
// ready | ok | pass | up | healthy. Optional checks.migrations.detail text appears as "migrations".
async function readReadyz() {
  if (OFFLINE || !CFG.readyz) return { status: 'unknown' }
  try {
    const r = await fetch(CFG.readyz, { signal: AbortSignal.timeout(10000), headers: { accept: 'application/json' } })
    let body = null
    try { body = await r.json() } catch { /* no JSON body */ }
    const st = typeof body?.status === 'string' ? body.status.toLowerCase() : 'ready'
    const det = body?.checks?.migrations?.detail
    return {
      status: r.ok && ['ready', 'ok', 'pass', 'up', 'healthy'].includes(st) ? 'ready' : 'fail',
      ...(typeof det === 'string' && det && { migrations: text(det, 80, 'migrations', true) }),
    }
  } catch { return { status: 'unknown' } }
}
async function metrics(throughputLocal, t) {
  if (!OFFLINE) {
    gitFetch([`+refs/heads/${BRANCH}:refs/remotes/${REMOTE}/${BRANCH}`])
    // Notes written on another machine (verification/deployment runs elsewhere). Without "+": only
    // fast-forward, so unpublished local notes are never lost; on refusal, read the local notes.
    const notes = [VERIFY_NOTES, DEPLOY_NOTES].filter(Boolean).map((r) => `${r}:${r}`)
    if (notes.length) gitFetch(notes)
  }
  const ref = mainBranch()
  const rz = await readReadyz()
  const prod = remoteProduction()
  const bat = verificationsFromNotes()
  const deps = deploysFromNotes()
  const m = { generated_at: iso(t) }
  // "production" exists only if configured: "sha" from production_cmd, "readyz" from the health URL.
  if (CFG.production_cmd || CFG.readyz) {
    const production = {}
    if (CFG.production_cmd) production.sha = prod.sha ?? 'unknown'
    if (CFG.readyz) production.readyz = rz.status
    const note = prod.sha && deps.find((d) => d.sha40.startsWith(prod.sha) || prod.sha.startsWith(d.sha40))
    if (note) {
      production.since = note.at
      if (note.smoke) production.smoke = note.smoke
      if (note.rollback) production.rollback = note.rollback
    }
    if (rz.migrations) production.migrations = rz.migrations
    m.production = production
  }
  const commits = (ref ? git(['log', '-30', '--format=%H%x1f%cI%x1f%s', ref]) ?? '' : '').split('\n').filter(Boolean).map((l) => {
    const [h, c, s] = l.split('\x1f')
    return { sha: h.slice(0, 9), at: iso(new Date(c)), title: text(s, 160, 'commit', true) }
  })
  // Per day: local keys (see count) merged with note keys by SHA, so each verification counts once.
  // A number instead of a list is an older state format (count): add it as it stands.
  const size = (v, extra = new Set()) => (Array.isArray(v) ? new Set([...v, ...extra]).size : (Number(v) || 0) + extra.size)
  const throughput = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(t)
    d.setDate(d.getDate() - i)
    const day = dayOf(d), r = throughputLocal?.days?.[day] ?? {}
    const fromDay = bat.filter((b) => dayOf(new Date(b.at)) === day)
    const notes = (res) => new Set(fromDay.filter((b) => (b.result === 'green') === (res === 'green')).map((b) => keySha(b.sha)))
    throughput.push({
      day,
      integrated: size(r.integrated),
      in_production: size(r.in_production),
      green_verifications: size(r.greens, notes('green')),
      red_verifications: size(r.reds ?? r.red_verifications, notes('red')),
    })
  }
  Object.assign(m, {
    main: { branch: BRANCH, sha: (ref && git(['rev-parse', '--short=9', ref])?.trim()) || 'unknown', commits },
    specs: specs(t),
    verifications: bat.slice(0, 30),
    deploys: deps.slice(0, 30).map(({ sha40, ...d }) => d),
    throughput,
  })
  if (prod.disk != null) m[SERVER_KEY] = { free_disk_gb: prod.disk, at: prod.at }
  return m
}

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
  return v
}
const canonical = (v) => JSON.stringify(sortKeys(v))
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

// "Changed?" compares content without volatile fields: those changing on every export with no real change.
// Measured by diffing consecutive JSON exports of a copy of real state:
//   sync.at, metrics.generated_at — export clock;
//   metrics.<server>.at          — production measurement time (cache refreshes every 10 min);
//   sync.by                      — exporter (each agent uses its own --by).
// Sent files still include these; only comparisons ignore them. The list is explicit by document and
// path: an event, verification or deployment's "at" is data and counts. Time-driven data changes (an agent
// becomes waiting after 45 min, the 14-day throughput window moves at midnight) count once when they happen.
const VOLATILE = { sync: [['at'], ['by']], metrics: [['generated_at'], [SERVER_KEY, 'at']] }
function withoutVolatile(doc, obj) {
  const c = structuredClone(obj)
  for (const filePath of VOLATILE[doc] ?? []) {
    const parent = filePath.slice(0, -1).reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), c)
    if (parent && typeof parent === 'object') delete parent[filePath.at(-1)]
  }
  return c
}
// Comparison hash for an exported file (e.g. sync.json): canonical JSON without volatile fields, with
// the file's final newline. For a document without volatile fields, this is the file's own hash.
const hashContent = (f, content) => sha256(`${canonical(withoutVolatile(f.replace(/\.json$/, ''), JSON.parse(String(content))))}\n`)
// Sent record (<out>/sent.json): file → {hash, at}, comparison hash and recording time. Before 2.1.0,
// records held only a whole-file hash string; still readable: the 5 documents without volatile fields
// have the same hash and are not resent. Metrics and sync are resent once (previously always), then sent
// saves them in the new format. An older CLI reading the new record resends everything: no data loss.
const sentHash = (e) => (typeof e === 'string' ? e : e && typeof e === 'object' ? e.hash : undefined)
// Sync accompanies every other document (it is small), so its "at", the page's "synced" time, is the last
// send time; artifact metrics are current as of that time (changes would be in the same batch).
// Alone, sync sends a heartbeat: otherwise an unchanged board would show "no update for over 6 h" despite
// being current. Send it when its last recorded send is older than SYNC_HEARTBEAT_MIN (or has no time).
// No other document sends a heartbeat.
const SYNC_HEARTBEAT_MIN = 60
// Why a file is sent next, by hash: 'changed', 'heartbeat' or null (not sent).
function reasonSend(f, hash, record, t) {
  if (sentHash(record) !== hash) return 'changed'
  if (f === 'sync.json' && t.getTime() - ms(record?.at) > SYNC_HEARTBEAT_MIN * 60000) return 'heartbeat'
  return null
}
// Next send, file → reason ('changed', 'heartbeat', 'missing': name=0 told sync-plan the artifact lacks
// the document, or 'accompanying': sync sent with other documents), in "hashes" file order.
function toSend(hashes, env, t, missing = new Set()) {
  const reason = {}
  for (const f of Object.keys(hashes)) { const p = reasonSend(f, hashes[f], env[f], t) ?? (missing.has(f) ? 'missing' : null); if (p) reason[f] = p }
  if ('sync.json' in hashes && !reason['sync.json'] && Object.keys(reason).length) reason['sync.json'] = 'accompanying'
  return reason
}

// Each document ≤ 200 KB (server rejects > 256 KB): trim the oldest completed work first.
const FINAL_STATES = { requests: ['cancelled', 'in-production', 'ready'], items: ['cancelled', 'in-production', 'integrated'], agents: ['finished', 'error', 'waiting'], decisions: ['decided'] }
// Trim order: oldest events first; other lists start with terminal states in FINAL_STATES order,
// oldest within each state. Active states come last, also oldest first.
function trimOrder(n, l) {
  if (n === 'events') return l.slice().sort((a, b) => ms(a.at) - ms(b.at))
  const fin = FINAL_STATES[n] ?? []
  const weight = (x) => { const i = fin.indexOf(x.status); return i < 0 ? fin.length : i }
  const when = (x) => ms(x.updated_at ?? x.last_heartbeat ?? x.created_at)
  return l.slice().sort((a, b) => weight(a) - weight(b) || when(a) - when(b))
}
// Trim in one pass: measure each element once, remove in order until it fits (previously one removal
// and full serialization per element, quadratic for months of state).
function fitDocument(n, d) {
  let j = canonical(d), cuts = 0
  while (Buffer.byteLength(j) > DOC_LIMIT) {
    if (n === 'metrics') {
      const lists = [d.main?.commits, d.specs, d.verifications, d.deploys].filter((l) => Array.isArray(l) && l.length)
      if (!lists.length) fail(`${n}: ${Buffer.byteLength(j)} bytes and nothing to trim`)
      lists.sort((a, b) => b.length - a.length)[0].pop()
      cuts++
    } else {
      const l = Array.isArray(d.items) ? d.items : []
      if (!l.length) fail(`${n}: ${Buffer.byteLength(j)} bytes and nothing to trim`)
      let excess = Buffer.byteLength(j) - DOC_LIMIT
      const excluded = new Set()
      for (const x of trimOrder(n, l)) {
        if (excess <= 0) break
        excluded.add(x)
        excess -= Buffer.byteLength(canonical(x)) + 1
      }
      d.items = l.filter((x) => !excluded.has(x))
      cuts += excluded.size
    }
    j = canonical(d)
  }
  return { json: `${j}\n`, cuts }
}

// Export generation (<out>/.generation.json, {read, written}): "read" numbers state reads under the lock
// in occurrence order; "written" identifies the export currently in export/. Export reads under the lock,
// measures outside it (git, readyz, SSH: seconds), then takes the lock to write only if its read is not
// older than the current export. Otherwise a slow old export could overwrite newer content and appear
// current (when sync-plan reread export/, it sent old content with fresh if_version, losing another
// agent's artifact change). Unreadable .generation.json counts as empty (protection lost for that run).
function readGeneration(f) {
  try {
    const g = JSON.parse(fs.readFileSync(f, 'utf8'))
    return { read: Number(g?.read) || 0, written: Number(g?.written) || 0 }
  } catch { return { read: 0, written: 0 } }
}
const FILES = [...DOCS, 'metrics', 'sync'].map((n) => `${n}.json`)

// Generate 7 documents and write to shared export/ unless a newer export is already there. Return both
// generated data (contents, hashes, sizes: in memory, used by sync-plan) and the data left in export/
// (inExport: this export or the newer one already there).
async function generateExport(op) {
  options(op, ['out', 'by'])
  const out = path.resolve(op.out || DEFAULT_OUT)
  const fGeneration = path.join(out, '.generation.json')
  const lostLock = () => fail('this command\'s lock was broken while waiting (frozen process?); nothing saved, retry', 75)
  // Consistent read under the lock; create missing documents (stable updated_at) and allocate this read's number.
  const { docs, generation } = withLock(() => {
    const st = new State()
    for (const n of DOCS) if (!fs.existsSync(path.join(STATE_DIR, `${n}.json`))) st.dirty(n)
    st.save()
    fs.mkdirSync(out, { recursive: true })
    const g = readGeneration(fGeneration)
    const mine = Math.max(g.read, g.written) + 1
    if (!ownLock()) lostLock()
    writeAtomic(fGeneration, `${JSON.stringify({ read: mine, written: g.written })}\n`)
    return { docs: Object.fromEntries([...DOCS, '_throughput'].map((n) => [n, structuredClone(st.doc(n))])), generation: mine }
  })
  const t = now()
  const limit = t.getTime() - NO_HEARTBEAT_MIN * 60000
  for (const a of docs.agents.items) if (a.status === 'active' && ms(a.last_heartbeat) < limit) a.status = 'waiting'
  const outDocs = {
    requests: docs.requests, items: docs.items, agents: docs.agents, events: docs.events, decisions: docs.decisions,
    metrics: await metrics(docs._throughput, t),
    sync: { at: iso(t), by: text(op.by || process.env.SCRUM_BY || 'scrum-cli', 80, 'by'), cli_version: VERSION },
  }
  if (CFG.project) outDocs.sync.project = text(CFG.project, 80, 'project', true)
  const contents = {}, hashes = {}, sizes = {}, trimmed = {}
  for (const [n, d] of Object.entries(outDocs)) {
    const { json: j, cuts } = fitDocument(n, d)
    contents[`${n}.json`] = j
    hashes[`${n}.json`] = hashContent(`${n}.json`, j)
    sizes[`${n}.json`] = Buffer.byteLength(j)
    if (cuts) trimmed[n] = cuts
  }
  const inExport = withLock(() => {
    const g = readGeneration(fGeneration)
    if (g.written > generation) {
      // An export of a newer read is already here: keep it and return its data.
      let h = {}
      try { h = JSON.parse(fs.readFileSync(path.join(out, 'hashes.json'), 'utf8')) ?? {} } catch { /* unreadable: treat as incomplete */ }
      const ok = FILES.every((f) => typeof h[f] === 'string' && fs.existsSync(path.join(out, f)))
      if (ok) return { written: false, hashes: h, sizes: Object.fromEntries(FILES.map((f) => [f, fs.statSync(path.join(out, f)).size])) }
      // Incomplete/unreadable export/ (manually deleted?): overwrite as if no generation existed.
    }
    const write = (f, c) => { if (!ownLock()) lostLock(); writeAtomic(path.join(out, f), c) }
    for (const [f, c] of Object.entries(contents)) write(f, c)
    // hashes.json: this export/'s comparison hashes (no volatile fields), returned by a superseded export.
    write('hashes.json', `${canonical(hashes)}\n`)
    write('.generation.json', `${JSON.stringify({ read: Math.max(g.read, generation), written: generation })}\n`)
    return { written: true, hashes, sizes }
  })
  const env = readJson(path.join(out, 'sent.json'), () => ({}))
  return { out, t, contents, hashes, sizes, trimmed, inExport, env }
}

// Export describes shared export/ as left: its own, or a newer read's export (newer_export). Inspect
// pending sends with this command; send through sync-plan, because another agent can rewrite shared
// export/ between sending and recording.
async function exportBoard(op) {
  const x = await generateExport(op)
  const { hashes, sizes, written } = x.inExport
  const reason = toSend(hashes, x.env, x.t)
  const files = FILES.filter((f) => f in hashes)
  // "changed": pending sends: changed documents, sync heartbeat (also in "heartbeat") and accompanying sync.
  const r = {
    ok: true, out: x.out, files, changed: files.filter((f) => reason[f]),
    hashes: Object.fromEntries(files.map((f) => [f, hashes[f]])), sizes: Object.fromEntries(files.map((f) => [f, sizes[f]])),
  }
  const heartbeat = files.filter((f) => reason[f] === 'heartbeat')
  if (heartbeat.length) r.heartbeat = heartbeat
  if (!written) r.newer_export = true
  if (Object.keys(x.trimmed).length) r.trimmed = x.trimmed
  return r
}

// Record what the orchestrator sent to the artifact (sync step 4), so the next sync-plan reports only
// changes. Record only a plan's content: the immutable <out>/plan/<stamp>/ copy sent by batch.
// --plan <folder> (sync-plan's confirm) marks every document in that plan; names after it
// (--plan <folder> items sync) mark just those, for a batch split in two. "send" paths also work, all from
// one plan. Reject bare names, --all or files outside a plan (code 2): these recorded the latest shared
// export/, which another agent could rewrite between send and record, leaving old artifact content that
// nobody would resend. Also reject no arguments: an accidentally empty list (failed shell substitution)
// must not mark anything.
const PLAN_RE = /^\d{8}T\d{6}-\d+-[0-9a-f]{6}$/
function sent(pos, op) {
  options(op, ['out', 'plan', 'all'])
  if (op.all !== undefined) fail('sent: --all no longer exists (recorded the latest export, not what was sent): send with sync-plan and run its "confirm"', 2)
  let dir, names
  if (op.plan !== undefined) {
    if (pos.some((a) => a.includes('/'))) fail('sent: --plan is followed by names (items, events.json), not paths', 2)
    dir = path.resolve(op.plan)
    names = pos
  } else {
    if (!pos.length) fail('sent: specify what was sent: --plan <folder> (sync-plan\'s "confirm"), --plan <folder> <names> for part of it, or "send" paths', 2)
    if (!pos.every((a) => a.includes('/'))) fail('sent: a name without --plan recorded the latest export, not what was sent: use --plan <plan folder> <names> (the "confirm" folder)', 2)
    const dirs = [...new Set(pos.map((a) => path.dirname(path.resolve(a))))]
    if (dirs.length > 1) fail('sent: paths belong to different plans; record one plan at a time', 2)
    dir = dirs[0]
    names = pos.map((a) => path.basename(a))
  }
  if (path.basename(path.dirname(dir)) !== 'plan' || !PLAN_RE.test(path.basename(dir))) {
    fail(`sent: ${dir} is not a plan folder (<out>/plan/<stamp>/, from sync-plan's "confirm"); only record what a plan sent`, 2)
  }
  let planFiles
  try { planFiles = fs.readdirSync(dir).filter((f) => FILES.includes(f)) } catch { return fail(`sent: cannot find plan ${dir}`, 2) }
  if (!planFiles.length) fail(`sent: plan ${dir} has no documents`, 2)
  const requests = [...new Set(names.map((n) => (n.endsWith('.json') ? n : `${n}.json`)))]
  for (const f of requests) if (!planFiles.includes(f)) fail(`sent: ${f} is not in plan ${dir} (${FILES.filter((x) => planFiles.includes(x)).join(', ')})`, 2)
  const out = path.resolve(op.out ?? path.dirname(path.dirname(dir))) // <out>/plan/<stamp>
  // Plan file comparison hash (no volatile fields, see hashContent): the content actually sent.
  const sel = FILES.filter((f) => (requests.length ? requests : planFiles).includes(f)).map((f) => {
    const a = path.join(dir, f)
    let c
    try { c = fs.readFileSync(a) } catch { return fail(`sent: cannot read ${a}`, 2) }
    try { return [f, hashContent(f, c)] } catch { return fail(`sent: ${a} is not valid JSON`, 2) }
  })
  // Under the lock: concurrent agents do not lose each other's marks. Sync heartbeat measures "at",
  // the time this record was made.
  withLock(() => {
    const env = readJson(path.join(out, 'sent.json'), () => ({}))
    const at = iso(now())
    for (const [f, h] of sel) env[f] = { hash: h, at }
    writeAtomic(path.join(out, 'sent.json'), `${canonical(env)}\n`)
  })
  return { ok: true, sent: sel.map(([f]) => f) }
}

// Document versions pasted from ArtifactData list: "requests=3 items=3" (space, comma, semicolon or
// newline separated) or list's output lines, '- "items"  3807 bytes  version 2  "…"'.
// "name=0" means absent from the artifact (list omits it: new or restored artifact). State collection
// versions go in "v"; others (new-requests inbox doc_ids, when its list is also pasted) in
// "otherVersions". Reject conflicting versions for the same document.
const DOCS_SYNC = [...DOCS, 'metrics', 'sync']
function readVersions(txt) {
  const v = {}, otherVersions = {}
  if (txt === undefined || !String(txt).trim()) return { v, otherVersions }
  let n = 0
  const by = (doc, num) => {
    n++
    const k = Number(num)
    if (!Number.isSafeInteger(k) || k < 0) fail(`sync-plan: invalid version ${doc}=${num}`, 2)
    const target = DOCS_SYNC.includes(doc) ? v : otherVersions
    if (target[doc] !== undefined && target[doc] !== k) fail(`sync-plan: two versions for ${doc} (${target[doc]} and ${k})`, 2)
    target[doc] = k
  }
  const s = String(txt)
  for (const m of s.matchAll(/"([^"\s]+)"[^"\n]*?\bversion\s+(\d+)/g)) by(m[1], m[2])
  for (const m of s.matchAll(/(?<![^\s,;])([A-Za-z0-9_.-]+)=(\d+)(?![^\s,;])/g)) by(m[1], m[2])
  if (!n) fail('sync-plan: --versions has no recognized version (use "requests=3 items=3" or ArtifactData list\'s "version N" lines)', 2)
  return { v, otherVersions }
}

// Prepare artifact synchronization for the orchestrator: export and return ArtifactData batch writes
// only for content changed since the last sent record (ignoring volatile fields), plus sync (accompanying
// other documents or alone as a heartbeat). Normally there are no changes: empty "changed", no writes.
// Build the plan from this export's in-memory data, never by rereading shared export/: state was read
// after listing versions, so content is at least as recent as those versions; if_version protects the
// rest. Shared export/ could contain an older slow export and send old content with a fresh version.
// Each write points to an immutable plan copy (<out>/plan/<stamp>/), safe from another export; "confirm"
// marks it sent (step 4).
// if_version comes from --versions. A pending document already sent but lacking a version rejects the
// entire plan (code 2, "missing_version" in the error): the artifact rejects unversioned overwrites, and
// omitting it would falsely report nothing to send. A never-sent document without a version is created
// without if_version. "name=0" (absent from artifact) includes it without if_version whether changed or
// not, restoring a new/reset artifact despite an old sent record. Empty --versions with a sent record
// also rejects (code 2): state list was empty (new/reset artifact: all 7 need =0), or was not pasted;
// reporting nothing to send would leave the artifact empty.
// Version conflicts lose no local data: local state is authoritative, just repeat.
// --inbox <folder> (ArtifactData list's new-requests out_dir, possibly absent for an empty inbox) imports
// before export, so new requests enter this plan. Append an if_version delete for each imported document;
// versions come from inbox list lines also pasted into --versions. A not-yet-imported inbox document
// without a version rejects before import (code 2, "missing_version" with new-requests/<id>); an already
// imported one passes without a delete, listed in inbox.deferred. A batch holds at most 50 writes:
// excess deletes also go in inbox.deferred for the next sync (import is idempotent).
const STALE_PLAN_MS = 6 * 3600 * 1000
const MAX_WRITES = 50
const shellQuote = (s) => (/^[A-Za-z0-9_./:@%+=,-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`)
// Step 4 command for this plan: SCRUM_CLI (a project wrapper supplying defaults), otherwise neighboring
// scrum.sh (or node with this file), always carrying this command's SCRUM_DIR: the record's lock lives
// there, regardless of the command's working directory.
function sentCommand(dir) {
  const sh = path.join(HERE, 'scrum.sh')
  const cli = process.env.SCRUM_CLI ? shellQuote(path.resolve(process.env.SCRUM_CLI))
    : fs.existsSync(sh) ? shellQuote(sh) : `${shellQuote(process.execPath)} ${shellQuote(fileURLToPath(import.meta.url))}`
  // SCRUM_CONFIG pins the plan's config, despite SCRUM_REPO/SCRUM_CONFIG in the caller's shell.
  const cfg = fileConfig()
  return `SCRUM_DIR=${shellQuote(BASE)} ${cfg ? `SCRUM_CONFIG=${shellQuote(cfg)} ` : ''}${cli} sent --plan ${shellQuote(dir)}`
}
const plural = (n, one, many) => (n === 1 ? one : many)
function readPlanInbox(op) {
  const dir = inboxFolder(path.resolve(op.inbox))
  const st = fs.statSync(dir, { throwIfNoEntry: false })
  if (st && !st.isDirectory()) fail(`sync-plan: --inbox ${dir} is not a folder`, 2)
  const docs = st ? readInbox(dir) : []
  const inStatus = docs.filter((d) => DOCS_SYNC.includes(d.doc_id)).map((d) => d.doc_id)
  if (inStatus.length) fail(`sync-plan: --inbox ${dir} contains state collection documents (${inStatus.join(', ')}): pass the new-requests list's out_dir`, 2)
  return docs
}
async function planSync(op) {
  options(op, ['out', 'by', 'versions', 'inbox'])
  const { v: versions, otherVersions } = readVersions(op.versions)
  const { versions: _v, inbox: _c, ...opExportBoard } = op
  if (op.versions !== undefined && !Object.keys(versions).length) {
    const reg = readJson(path.join(path.resolve(op.out || DEFAULT_OUT), 'sent.json'), () => ({}))
    const already = FILES.filter((f) => reg[f] !== undefined).map((f) => f.slice(0, -'.json'.length))
    if (already.length) {
      fail(`sync-plan: --versions contains no state collection versions, but documents were previously sent to the artifact; nothing prepared: if ArtifactData list for state was empty (new/reset artifact), pass --versions "${DOCS_SYNC.map((d) => `${d}=0`).join(' ')}" to create them without if_version; otherwise repeat list and pass all "version N" lines from the result`,
        2, { missing_version: already })
    }
  }
  const docsInbox = op.inbox !== undefined ? readPlanInbox(op) : null
  const imp = docsInbox ? importInboxDocs(docsInbox, otherVersions) : null
  const x = await generateExport(opExportBoard)
  const base = path.join(x.out, 'plan')
  fs.mkdirSync(base, { recursive: true })
  for (const n of fs.readdirSync(base)) { // plans older than 6 h will no longer be sent
    if (!PLAN_RE.test(n)) continue
    try { if (Date.now() - fs.statSync(path.join(base, n)).mtimeMs > STALE_PLAN_MS) fs.rmSync(path.join(base, n), { recursive: true, force: true }) } catch { /* handled elsewhere */ }
  }
  const missing = FILES.filter((f) => versions[f.slice(0, -'.json'.length)] === 0)
  const reason = toSend(x.hashes, x.env, x.t, new Set(missing))
  const changed = Object.keys(reason)
  const sets = [], withoutVersion = []
  for (const f of changed) {
    const doc = f.slice(0, -'.json'.length)
    const w = { op: 'set', collection: 'state', doc_id: doc, file_path: '' }
    if (versions[doc] > 0) w.if_version = versions[doc]
    else if (versions[doc] === undefined && x.env[f] !== undefined) { withoutVersion.push(doc); continue }
    sets.push(w)
  }
  if (withoutVersion.length) {
    const n = withoutVersion.length
    fail(`sync-plan: ${withoutVersion.join(', ')} ${plural(n, 'has', 'have')} pending changes and already ${plural(n, 'exists', 'exist')} in the artifact, but ${plural(n, 'has', 'have')} no version in --versions; nothing prepared: repeat ArtifactData list and pass all "version N" lines from the result; if list omits ${plural(n, 'it', 'them')} (new/reset artifact), ${plural(n, 'it does', 'they do')} not exist there: pass ${withoutVersion.map((d) => `${d}=0`).join(' ')} (and =0 for any other omitted document) to create ${plural(n, 'it', 'them')} without if_version`,
      2, { missing_version: withoutVersion, changed })
  }
  let dir = null
  if (sets.length) {
    const stamp = iso(x.t).slice(0, 19).replace(/[-:]/g, '')
    dir = path.join(base, `${stamp}-${process.pid}-${crypto.randomBytes(3).toString('hex')}`)
    fs.mkdirSync(dir)
    for (const w of sets) {
      w.file_path = path.join(dir, `${w.doc_id}.json`)
      writeAtomic(w.file_path, x.contents[`${w.doc_id}.json`])
    }
  }
  const writes = [...sets]
  let inbox
  if (imp) {
    // Delete imported inbox documents (newly and previously imported); keep invalid ones.
    // Already imported without a version (old out_dir file, missing list line): no delete, defer it;
    // if still in the inbox, the next sync deletes it using its listed version.
    const withVersion = imp.imported.filter((id) => otherVersions[id] > 0)
    const delete_ids = withVersion.slice(0, Math.max(0, MAX_WRITES - writes.length))
    for (const id of delete_ids) writes.push({ op: 'delete', collection: 'new-requests', doc_id: id, if_version: otherVersions[id] })
    inbox = { created: imp.created, delete_ids }
    const deferred = [...withVersion.slice(delete_ids.length), ...imp.imported.filter((id) => !(otherVersions[id] > 0))]
    if (deferred.length) inbox.deferred = deferred
    if (imp.invalid.length) inbox.invalid = imp.invalid
  }
  // bytes: sum of set files (batch limit: 1 MiB; split above ~900,000 bytes).
  const bytes = sets.reduce((s, w) => s + Buffer.byteLength(x.contents[`${w.doc_id}.json`]), 0)
  // Keep missing_version for existing consumers, always empty (missing versions reject the plan).
  const r = { ok: true, writes, changed, missing_version: [], send: sets.map((w) => w.file_path), bytes }
  if (dir) r.confirm = sentCommand(dir)
  const heartbeat = changed.filter((f) => reason[f] === 'heartbeat')
  if (heartbeat.length) r.heartbeat = heartbeat
  if (missing.length) r.missing = missing
  const ignored = Object.keys(otherVersions).filter((id) => !docsInbox?.some((d) => d.doc_id === id))
  if (ignored.length) r.ignored = ignored
  if (inbox) r.inbox = inbox
  if (Object.keys(x.trimmed).length) r.trimmed = x.trimmed
  return r
}

// Markdown board view (docs/backlog.md without a published artifact): open requests, items by status,
// open decisions. Output is text, not JSON.
const MARKDOWN_ORDER = ['blocked', 'in-progress', 'in-review', 'verifying', 'ready', 'backlog', 'integrated', 'in-production']
function markdown(pos, op) {
  options(op, [])
  if (pos.length) fail('markdown takes no arguments', 2)
  const st = new State()
  const l = [`# Backlog${CFG.project ? `: ${CFG.project}` : ''}`, '', '<!-- Generated by scrum.mjs markdown; change through the CLI, not manually. -->', '']
  const decs = st.list('decisions').filter((d) => d.status === 'open')
  if (decs.length) {
    l.push('## Open decisions', '')
    for (const d of decs) l.push(`- **${d.question}**${d.recommendation ? ` Recommendation: ${d.recommendation}` : ''} (\`${d.id}\`)`)
    l.push('')
  }
  const requests = st.list('requests').filter((p) => p.status !== 'in-production' && p.status !== 'cancelled')
  if (requests.length) {
    l.push('## Open requests', '')
    for (const p of requests) l.push(`- ${p.title} — ${nameStatus(p.status)}, priority ${p.priority} (\`${p.id}\`)`)
    l.push('')
  }
  const its = st.list('items')
  for (const status of MARKDOWN_ORDER) {
    const inStatus = its.filter((i) => i.status === status)
    if (!inStatus.length) continue
    l.push(`## ${nameStatus(status)}`, '')
    for (const i of inStatus) {
      l.push(`### ${i.title} (\`${i.id}\`)`)
      if (i.criterion) l.push(`- Acceptance: ${i.criterion}`)
      if (i.depends?.length) l.push(`- Depends on: ${i.depends.join(', ')}`)
      if (i.blocker) l.push(`- Blocker: ${i.blocker}`)
      if (i.spec) l.push(`- Spec: ${i.spec}`)
      if (i.branch || i.sha) l.push(`- ${[i.branch && `Branch: ${i.branch}`, i.sha && `SHA: ${i.sha.slice(0, 9)}`].filter(Boolean).join(' · ')}`)
      if (i.tasks) l.push(`- Tasks: ${i.tasks.done}/${i.tasks.total}`)
      if (i.notes) l.push(`- Notes: ${i.notes}`)
      l.push('')
    }
  }
  return { text: l.join('\n') }
}

// ------------------------------------------------------------------ command line
const help = () => `scrum.mjs ${VERSION} — development board
state: ${STATE_DIR ?? '(no git repository: set SCRUM_DIR or run inside the repo)'}
config: ${CFG.file ?? `(none; optional at ${fileConfig() ?? '<repo>/.agentic/board/config.json'})`}

  request add --title T [--description D] [--origin ${E.origin.join('|')}] [--priority high|normal|low] [--status S] [--id ID]
  request set <id> field=value …            (title description origin status priority result requested_at; field= deletes)
  request link <requestId> <itemId>
  item add --title T [--request R] [--spec S] [--type ${E.itemType.join('|')}] [--status backlog]
           [--criterion C] [--depends id1,id2] [--id ID] [--owner O] [--branch B] [--sha S] [--notes N]
  item set <id> field=value …              (status branch sha blocker notes criterion depends owner request spec …
                                            verify.status= verify.sha= verify.profile= verify.duration_s=
                                            tasks.done= tasks.total=)
  agent heartbeat <id> --name N --type T [--lease L] [--status active] [--item I] [--detail D] [--model M]   (every 30 min; waiting after 45 min without a heartbeat)
  agent end <id> [--status finished|error] [--detail D]   (runs config's agent_end_cmd, if set)
  event <type> <text> [--agent A] [--item I] [--request R]   (type: ${E.eventType.join(' ')})
  decision add --question Q [--recommendation R] [--item I] [--request R] [--id ID]
  decision set <id> status=decided decision="…"
  import <folder>                          (ArtifactData out_dir with the new-requests collection)
  export [--out DIR] [--by WHO]             (7 documents + hashes.json; changed = pending sends since last sent,
                                            ignoring timestamps, plus accompanying sync or sync alone after
                                            > ${SYNC_HEARTBEAT_MIN} min since its last send; never overwrites a newer read's export/)
  sent --plan FOLDER [name …] | plan-path …   [--out DIR]
                                           (records the content of a plan sent to the artifact: sync-plan's
                                            confirm, selected names from that plan (split batch), or send paths;
                                            rejects names without --plan, --all and files outside a plan)
  sync-plan --versions "requests=3 …" [--inbox DIR] [--by WHO] [--out DIR]
                                           (export + changed ArtifactData batch writes, with if_version,
                                            and confirm, the step 4 command; no changes = empty changed, no
                                            writes; pending document without a version rejects with code 2;
                                            name=0 = absent from artifact (create it); --inbox = new-requests
                                            list's out_dir: import it and append deletes; sync accompanies
                                            other documents or sends alone every ${SYNC_HEARTBEAT_MIN} min)
  production <sha>                         (integrated items contained in SHA become in-production)
  show <requests|items|agents|events|decisions> [id]
  markdown                                (Markdown view for docs/backlog.md without an artifact)

Item states: ${E.itemStatus.join(' ')}
Request states: ${E.requestStatus.join(' ')}
Agent types: ${E.agentType.join(' ')}
Variables: SCRUM_DIR (parent of state/), SCRUM_REPO, SCRUM_CONFIG, SCRUM_PROJECT, SCRUM_BRANCH, SCRUM_REMOTE,
SCRUM_READYZ, SCRUM_PRODUCTION_CMD, SCRUM_VERIFY_NOTES, SCRUM_DEPLOY_NOTES, SCRUM_SPECS, SCRUM_TZ, SCRUM_OFFLINE=1,
SCRUM_OUT, SCRUM_AGENT_END_CMD, SCRUM_CLI, SCRUM_BY, SCRUM_NOW, SCRUM_WAIT_MS. No secrets or personal data in text.
`

// Valueless options (switches): --all is true; --all=x arrives as text and is rejected by the command.
const SWITCHES = new Set(['all'])
function parseArgs(argv) {
  const pos = [], op = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--') { pos.push(...argv.slice(i + 1)); break }
    if (a.startsWith('--') && a.length > 2) {
      const eq = a.indexOf('=')
      if (eq > 0) op[a.slice(2, eq)] = a.slice(eq + 1)
      else if (SWITCHES.has(a.slice(2))) op[a.slice(2)] = true
      else {
        if (i + 1 >= argv.length) fail(`option ${a} missing value`, 2)
        op[a.slice(2)] = argv[++i]
      }
    } else pos.push(a)
  }
  return { pos, op }
}

async function main(argv) {
  const [group, ...rest] = argv
  if (!group || group === 'help' || group === '--help' || group === '-h') return null
  if (CFG.error) fail(CFG.error, 2)
  if (!STATE_DIR) fail('cannot find repository: run inside a git repository or set SCRUM_DIR (and SCRUM_REPO)', 2)
  warnings.push(...warningsConfig)
  const { pos, op } = parseArgs(rest)
  const action = pos[0]
  const atMost = (n) => { if (pos.length - 1 > n) fail(`extra arguments: ${pos.slice(n + 1).join(' ')}`, 2) }
  switch (group) {
    case 'request':
      if (action === 'add') { atMost(0); return transaction((st) => requestAdd(st, op)) }
      if (action === 'set') { options(op, []); return transaction((st) => requestSet(st, pos[1] ?? fail('request set: missing id', 2), pairs(pos.slice(2)))) }
      if (action === 'link') { options(op, []); atMost(2); if (!pos[2]) fail('request link <requestId> <itemId>', 2); return transaction((st) => requestLink(st, pos[1], pos[2])) }
      return fail('request add | set | link', 2)
    case 'item':
      if (action === 'add') { atMost(0); return transaction((st) => itemAdd(st, op)) }
      if (action === 'set') { options(op, []); return transaction((st) => itemSet(st, pos[1] ?? fail('item set: missing id', 2), pairs(pos.slice(2)))) }
      return fail('item add | set', 2)
    case 'agent':
      if (action !== 'heartbeat' && action !== 'end') fail('agent heartbeat | end', 2)
      atMost(1)
      {
        const r = transaction((st) => agentHeartbeat(st, pos[1] ?? fail(`agent ${action}: missing id`, 2), op, action === 'end'))
        return action === 'end' ? { ...r, ...endAgentCommand(r.agent) } : r
      }
    case 'event': return transaction((st) => eventCmd(st, pos, op))
    case 'decision':
      if (action === 'add') { atMost(0); return transaction((st) => decisionAdd(st, op)) }
      if (action === 'set') { options(op, []); return transaction((st) => decisionSet(st, pos[1] ?? fail('decision set: missing id', 2), pairs(pos.slice(2)))) }
      return fail('decision add | set', 2)
    case 'import': if (pos.length > 1) fail('import <folder>', 2); return importInbox(pos, op)
    case 'export': if (pos.length) fail('export takes no arguments (use --out)', 2); return exportBoard(op)
    case 'sent': return sent(pos, op)
    case 'sync-plan': if (pos.length) fail('sync-plan takes no arguments (use --versions, --by, --out)', 2); return planSync(op)
    case 'production': if (pos.length > 1) fail('production <sha>', 2); return production(pos, op)
    case 'show': return show(pos, op)
    case 'markdown': return markdown(pos, op)
    default: return fail(`unknown command "${group}" (scrum.mjs help)`, 2)
  }
}

// Synchronous write (the following process.exit must not truncate piped output).
function writeFd(fd, s) {
  const b = Buffer.from(s)
  for (let off = 0; off < b.length;) {
    try { off += fs.writeSync(fd, b, off) } catch (e) { if (e.code !== 'EAGAIN') throw e; sleep(5) }
  }
}
let code = 0
try {
  const r = await main(process.argv.slice(2))
  if (r === null) writeFd(1, help())
  else if (typeof r.text === 'string' && Object.keys(r).length === 1) writeFd(1, r.text)
  else {
    if (warnings.length) r.warnings = warnings
    writeFd(1, `${JSON.stringify(r)}\n`)
  }
} catch (e) {
  code = e instanceof ErrorScrum ? e.code : 1
  writeFd(2, `${JSON.stringify({ ok: false, error: e instanceof ErrorScrum ? e.message : `internal: ${e?.stack ?? e}`, ...(e instanceof ErrorScrum && e.extra) })}\n`)
}
process.exit(code)
