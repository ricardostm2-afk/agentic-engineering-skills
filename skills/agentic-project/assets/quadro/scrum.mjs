#!/usr/bin/env node
// scrum.mjs — CLI local do quadro de desenvolvimento (skills agentic-project / agentic-feature).
//
// Estado local em <repo>/.agentic/quadro/estado/{pedidos,itens,agentes,eventos,decisoes}.json (SCRUM_DIR muda
// a pasta-mãe de estado/), cada um no formato do documento homónimo da coleção «estado» do artefacto. Num
// worktree, <repo> é a raiz do repositório principal: todos os agentes escrevem no mesmo estado. `exportar`
// escreve os 7 documentos prontos a enviar (ArtifactData set com file_path) e um hashes.json para só enviar o
// que mudou; `plano-sync` faz o plano com o que o seu exportar gerou, nunca com o export/ partilhado (ver
// gerarExport).
//
// Configuração opcional em <repo>/.agentic/quadro/config.json (ou SCRUM_CONFIG; com SCRUM_DIR e sem SCRUM_REPO,
// <SCRUM_DIR>/config.json, ver ficheiroConfig), sobreposta pelas variáveis SCRUM_*: nome do projeto,
// repositório, ramo principal, remoto, URL de saúde (readyz), comando que devolve o SHA em produção e o disco
// livre, refs das notas git de testes e de deploy, padrão das specs e fuso. Sem configuração, tudo funciona e as
// métricas que dependem dela saem «desconhecido» ou ficam de fora.
//
// Node ≥ 20, ESM, sem dependências. Vários agentes chamam ao mesmo tempo: cada comando corre sob um trinco
// (mkdir estado/.trinco com o dono lá dentro; ver comTrinco) e grava por ficheiro temporário + rename.
// Saída: uma linha JSON no stdout. Erro: {"ok":false,"erro":…} no stderr e código ≠ 0
// (2 = uso/validação, 1 = dados, 75 = trinco ocupado ou partido: tenta de novo).
// Nada de dados pessoais nem segredos: o texto livre passa por um filtro que retira o que parece segredo,
// e-mail, telefone ou número de identificação (e avisa em «avisos»).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const VERSAO = '2.5.0'
const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SEM_REDE = process.env.SCRUM_SEM_REDE === '1'
const DOCS = ['pedidos', 'itens', 'agentes', 'eventos', 'decisoes']
const AUX = { _ritmo: () => ({ dias: {} }), _importados: () => ({ docs: {} }) }
const LIMITE_DOC = 200 * 1024
const MAX_EVENTOS = 400
const MAX_AGENTES = 300
const MAX_IMPORTADOS = 5000
const SEM_SINAL_MIN = 45
const TRINCO_ESPERA_MS = Number(process.env.SCRUM_ESPERA_MS || 15000)
const TRINCO_VELHO_MS = Number(process.env.SCRUM_TRINCO_VELHO_MS || 10000)

const E = {
  pedidoEstado: ['novo', 'em-analise', 'em-curso', 'a-espera-do-humano', 'pronto', 'em-producao', 'cancelado'],
  origem: ['chat', 'telegram', 'painel', 'outro'],
  prioridade: ['alta', 'normal', 'baixa'],
  itemTipo: ['feature', 'bug', 'ops', 'docs', 'protocolo', 'design'],
  itemEstado: ['backlog', 'pronto', 'em-curso', 'em-revisao', 'em-bateria', 'integrado', 'em-producao', 'bloqueado', 'cancelado'],
  bateriaEstado: ['a-correr', 'verde', 'vermelha', 'pendurada'],
  agenteTipo: ['claude-sessao', 'claude-workflow', 'codex-job', 'outro-agente', 'verificacao', 'script'],
  agenteEstado: ['ativo', 'a-espera', 'terminado', 'erro'],
  eventoTipo: ['inicio', 'commit', 'bateria', 'deploy', 'bloqueio', 'decisao', 'nota', 'fim', 'erro', 'pedido'],
  decisaoEstado: ['aberta', 'decidida'],
}
// Sinónimos aceites à entrada (gravam-se como o valor canónico): formas alternativas comuns.
const SINONIMOS = {
  pedidoEstado: { 'a-espera-de-decisao': 'a-espera-do-humano' },
  origem: { 'mensagem': 'outro' },
  agenteTipo: { 'bateria': 'verificacao', 'testes': 'verificacao', 'agente': 'outro-agente' },
  itemEstado: { 'em-testes': 'em-bateria', 'em-verificacao': 'em-bateria' },
}

// ------------------------------------------------------------------ repositório, configuração, pastas
// A raiz é o repositório principal (também a partir de um worktree): SCRUM_REPO, senão o git do diretório
// atual, senão o git da pasta deste ficheiro (a cópia em <repo>/.agentic/quadro/).
function raizGit(dir) {
  const r = spawnSync('git', ['-C', dir, 'rev-parse', '--path-format=absolute', '--git-common-dir', '--show-toplevel'], { encoding: 'utf8' })
  if (r.error || r.status !== 0) return null
  const [comum, topo] = r.stdout.trim().split('\n')
  return comum && path.basename(comum) === '.git' ? path.dirname(comum) : (topo || null)
}
const RAIZ = process.env.SCRUM_REPO ? path.resolve(process.env.SCRUM_REPO) : (raizGit(process.cwd()) ?? raizGit(AQUI))
const CHAVES_CONFIG = {
  projeto: 'SCRUM_PROJETO', repo: 'SCRUM_REPO', ramo: 'SCRUM_RAMO', remoto: 'SCRUM_REMOTO', readyz: 'SCRUM_READYZ',
  producao_cmd: 'SCRUM_PRODUCAO_CMD', notas_bateria: 'SCRUM_NOTAS_BATERIA', notas_deploy: 'SCRUM_NOTAS_DEPLOY',
  specs: 'SCRUM_SPECS', fuso: 'SCRUM_TZ', saida: 'SCRUM_SAIDA', agente_fim_cmd: 'SCRUM_AGENTE_FIM_CMD',
}
// «vocabulario» (objeto) é a única chave que não é texto: os nomes que o estado e a página do projeto já usam.
const CHAVES_VOCABULARIO = ['dono', 'rotulos', 'tipos_agente', 'chave_servidor']
// Chaves de primeiro nível das métricas: a do bloco do disco não pode colidir com nenhuma.
const CHAVES_METRICAS = ['gerado_em', 'producao', 'main', 'specs', 'baterias', 'deploys', 'ritmo']
const avisosConfig = []
// O ficheiro da config: SCRUM_CONFIG; senão o do repositório dado em SCRUM_REPO; senão, com SCRUM_DIR, o
// <SCRUM_DIR>/config.json (SCRUM_DIR faz as vezes de <repo>/.agentic/quadro, onde a config está): o «confirmar»
// leva o SCRUM_DIR do plano e lê a mesma config, seja qual for a pasta onde corre. Só sem nenhum deles vem do
// repositório do diretório atual.
function ficheiroConfig() {
  if (process.env.SCRUM_CONFIG) return path.resolve(process.env.SCRUM_CONFIG)
  if (!process.env.SCRUM_REPO && process.env.SCRUM_DIR) return path.join(path.resolve(process.env.SCRUM_DIR), 'config.json')
  return RAIZ ? path.join(RAIZ, '.agentic', 'quadro', 'config.json') : null
}
// Valida o bloco «vocabulario» da config; devolve o objeto normalizado ou {erro}.
function lerVocabulario(v) {
  if (v == null) return {}
  if (typeof v !== 'object' || Array.isArray(v)) return { erro: 'config: «vocabulario» tem de ser um objeto' }
  for (const k of Object.keys(v)) if (!CHAVES_VOCABULARIO.includes(k)) avisosConfig.push(`config: chave desconhecida «vocabulario.${k}» ignorada (aceites: ${CHAVES_VOCABULARIO.join(', ')})`)
  const out = {}
  if (v.dono != null) {
    if (typeof v.dono !== 'string' || !/^[a-z][a-z0-9]{1,29}$/.test(v.dono)) return { erro: 'config: «vocabulario.dono» tem de ser uma palavra em minúsculas sem acentos (ex.: gestor)' }
    out.dono = v.dono
  }
  if (v.rotulos != null) {
    if (typeof v.rotulos !== 'object' || Array.isArray(v.rotulos) || Object.values(v.rotulos).some((x) => typeof x !== 'string' || !x.trim() || x.length > 60)) {
      return { erro: 'config: «vocabulario.rotulos» tem de ser um objeto estado → texto (até 60 caracteres)' }
    }
    out.rotulos = v.rotulos
  }
  if (v.tipos_agente != null) {
    if (!Array.isArray(v.tipos_agente) || v.tipos_agente.length > 10 || v.tipos_agente.some((x) => typeof x !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(x))) {
      return { erro: 'config: «vocabulario.tipos_agente» tem de ser uma lista de até 10 ids ([a-z0-9-], até 32 caracteres)' }
    }
    out.tipos_agente = [...new Set(v.tipos_agente)]
  }
  if (v.chave_servidor != null) {
    if (typeof v.chave_servidor !== 'string' || !/^[a-z][a-z0-9_]{1,29}$/.test(v.chave_servidor) || CHAVES_METRICAS.includes(v.chave_servidor)) {
      return { erro: `config: «vocabulario.chave_servidor» tem de ser [a-z0-9_] e diferente de ${CHAVES_METRICAS.join(', ')}` }
    }
    out.chave_servidor = v.chave_servidor
  }
  return out
}
function lerConfig() {
  const f = ficheiroConfig()
  let c = {}
  if (f && fs.existsSync(f)) {
    try { c = JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) { return { erro: `config inválida em ${f}: ${e.message}` } }
    if (!c || typeof c !== 'object' || Array.isArray(c)) return { erro: `config inválida em ${f}: esperava um objeto JSON` }
    for (const k of Object.keys(c)) {
      if (!(k in CHAVES_CONFIG) && k !== 'vocabulario' && !k.startsWith('_')) avisosConfig.push(`config: chave desconhecida «${k}» ignorada (aceites: ${[...Object.keys(CHAVES_CONFIG), 'vocabulario'].join(', ')})`)
      else if (k in CHAVES_CONFIG && c[k] != null && typeof c[k] !== 'string') return { erro: `config: «${k}» tem de ser texto` }
    }
  }
  const out = { ficheiro: f && fs.existsSync(f) ? f : null }
  const voc = lerVocabulario(c.vocabulario)
  if (voc.erro) return { erro: voc.erro }
  out.vocabulario = voc
  for (const [k, v] of Object.entries(CHAVES_CONFIG)) {
    const valor = process.env[v] != null && process.env[v] !== '' ? process.env[v] : c[k]
    if (typeof valor === 'string' && valor.trim()) out[k] = valor.trim()
  }
  return out
}
const CFG = lerConfig()
// Um só fuso para todos os escritores (SCRUM_TZ ou «fuso» da config; omissão: o do sistema), para os dias do
// ritmo e as datas não mudarem com o anfitrião que corre o comando.
if (CFG.fuso) process.env.TZ = CFG.fuso
const REPO = process.env.SCRUM_REPO ? RAIZ : (CFG.repo && RAIZ ? path.resolve(RAIZ, CFG.repo) : RAIZ)
const RAMO = CFG.ramo || 'main'
const REMOTO = CFG.remoto || 'origin'
const PADRAO_SPECS = CFG.specs || 'specs/*/tasks.md'
const BASE = process.env.SCRUM_DIR ? path.resolve(process.env.SCRUM_DIR) : (RAIZ ? path.join(RAIZ, '.agentic', 'quadro') : null)
const DIR_ESTADO = BASE ? path.join(BASE, 'estado') : null
// Pasta de exportação: «saida» da config (relativa à pasta-mãe do estado), senão estado/export.
const SAIDA_OMISSAO = DIR_ESTADO ? (CFG.saida ? path.resolve(BASE, CFG.saida) : path.join(DIR_ESTADO, 'export')) : null
const refNotas = (r) => (r ? (r.startsWith('refs/') ? r : `refs/notes/${r}`) : null)
const NOTAS_BATERIA = refNotas(CFG.notas_bateria)
const NOTAS_DEPLOY = refNotas(CFG.notas_deploy)

// Vocabulário do projeto (config «vocabulario»). Por omissão: dono «humano» (estado a-espera-do-humano), tipos de
// agente da lista e bloco do disco «servidor». Um projeto cujo estado e página já usam outros nomes dá-os aqui:
// o dono (a-espera-do-<dono>), tipos de agente a mais (que deixam de ser sinónimos de «verificacao»), rótulos dos
// estados nos eventos e a chave do bloco do disco. As formas por omissão continuam aceites à entrada.
const VOC = CFG.vocabulario ?? {}
const DONO = VOC.dono ?? 'humano'
const ESPERA = `a-espera-do-${DONO}`
const CHAVE_SERVIDOR = VOC.chave_servidor ?? 'servidor'
E.pedidoEstado = E.pedidoEstado.map((e) => (e === 'a-espera-do-humano' ? ESPERA : e))
SINONIMOS.pedidoEstado = { 'a-espera-de-decisao': ESPERA, ...(DONO !== 'humano' && { 'a-espera-do-humano': ESPERA }) }
for (const t of VOC.tipos_agente ?? []) {
  if (!E.agenteTipo.includes(t)) E.agenteTipo.push(t)
  delete SINONIMOS.agenteTipo[t]
}

// ------------------------------------------------------------------ erros, relógio, texto
const avisos = []
// «extra»: campos que vão no JSON do erro, ao lado de «erro» (ex.: os documentos sem versão do plano-sync).
class ErroScrum extends Error {
  constructor(m, codigo = 1, extra) { super(m); this.codigo = codigo; this.extra = extra }
}
const falha = (m, codigo = 1, extra) => { throw new ErroScrum(m, codigo, extra) }

// SCRUM_AGORA fixa o relógio (testes e exportações reprodutíveis).
function agora() {
  const s = process.env.SCRUM_AGORA
  if (s) { const d = new Date(s); if (!Number.isNaN(d.getTime())) return d }
  return new Date()
}
const p2 = (n) => String(n).padStart(2, '0')
// ISO 8601 na hora local, com fuso (ex.: 2026-10-15T21:03:05+01:00).
function iso(d) {
  const off = -d.getTimezoneOffset(), a = Math.abs(off)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}` +
    `${off >= 0 ? '+' : '-'}${p2(Math.floor(a / 60))}:${p2(a % 60)}`
}
const diaDe = (d) => iso(d).slice(0, 10)
const compacto = (d) => diaDe(d).replace(/-/g, '')
const ms = (s) => { const v = Date.parse(s ?? ''); return Number.isNaN(v) ? 0 : v }

const SEGREDOS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{30,}/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\b(?:password|passwd|senha|palavra-passe|token|secret|segredo|api[_-]?key)\s*[:=]\s*\S+/gi,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  // Dados pessoais que um agente pode colar sem pensar: telefones (com indicativo internacional, ou móvel PT de
  // 9 dígitos), IBAN e números de identificação precedidos do nome do documento. Um SHA não tem «+» nem
  // indicativo, por isso não é apanhado.
  /\+\d{1,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}\b/g,
  /\b9[1236]\d[\s-]?\d{3}[\s-]?\d{3}\b/g,
  /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g,
  /\b(?:nif|nic|niss|sns|cc|ssn|cpf|dni|nie|passaporte|passport|utente\s+n\.?º|n\.?º\s*(?:de\s+)?(?:utente|cliente|paciente|contribuinte|identifica[çc][ãa]o|s\w*cio))\s*[:#.]?\s*\d[\d\s.-]{5,14}\d\b/gi,
]
function texto(v, max, campo, silencioso = false) {
  let s = String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim()
  let tirou = false
  for (const re of SEGREDOS) s = s.replace(re, () => { tirou = true; return '[removido]' })
  if (tirou && !silencioso) avisos.push(`${campo}: retirei o que parecia segredo, e-mail, telefone ou identificação (o quadro não guarda segredos nem dados pessoais)`)
  if (s.length > max) s = s.slice(0, max - 1).trimEnd() + '…'
  return s
}
function data(v, campo) {
  const d = new Date(v)
  if (v == null || v === '' || Number.isNaN(d.getTime())) falha(`${campo}: data inválida «${v}» (ISO 8601, ex.: 2026-10-15T21:00:00+01:00)`, 2)
  return iso(d)
}

// ------------------------------------------------------------------ ids
const RE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/
function validarId(v, o = 'id') {
  const s = String(v ?? '').trim()
  if (!RE_ID.test(s)) falha(`${o} inválido «${v}»: só [a-z0-9-], 1 a 64 caracteres, sem hífen nas pontas`, 2)
  return s
}
const VAZIAS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'para', 'por', 'com', 'que', 'ao', 'aos', 'se', 'the', 'of'])
function slug(s, palavras = 4) {
  const ps = String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter((p) => p && !VAZIAS.has(p))
  let out = ''
  for (const p of ps.slice(0, palavras)) { const c = out ? `${out}-${p}` : p; if (c.length > 32) break; out = c }
  return out || (ps[0] ?? '').slice(0, 32) || 'x'
}
function idUnico(base, existentes) {
  base = base.replace(/-+$/, '').slice(0, 58).replace(/-+$/, '')
  if (!existentes.has(base)) return base
  for (let i = 2; ; i++) if (!existentes.has(`${base}-${i}`)) return `${base}-${i}`
}

// ------------------------------------------------------------------ ficheiros, trinco, estado
const sono = new Int32Array(new SharedArrayBuffer(4))
const dormir = (n) => { if (n > 0) Atomics.wait(sono, 0, 0, n) }
function escreverAtomico(f, conteudo) {
  const tmp = `${f}.tmp-${process.pid}-${crypto.randomBytes(3).toString('hex')}`
  const fd = fs.openSync(tmp, 'w')
  try { fs.writeSync(fd, conteudo); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
  fs.renameSync(tmp, f)
}
function lerJson(f, vazio) {
  let t
  try { t = fs.readFileSync(f, 'utf8') } catch (e) { if (e.code === 'ENOENT') return vazio(); throw e }
  try { return JSON.parse(t) } catch { return falha(`estado corrompido: ${f} não é JSON válido (repõe-o à mão)`) }
}
// Exclusão mútua por mkdir, com o dono escrito dentro (estado/.trinco/dono). Um trinco com mais de 10 s é de
// um processo que morreu ou foi congelado a meio (um runner de jobs pode fazer SIGSTOP quando falta memória; um
// comando segura-o milissegundos): parte-se. Duas regras impedem que partir um trinco perca dados:
// - só se parte com o trinco de partir (estado/.trinco-partir) na mão, e depois de voltar a confirmar a idade,
//   para dois processos à espera não partirem, um deles, o trinco que o outro acabou de criar;
// - antes de cada escrita o processo confirma que o trinco ainda é seu (meuTrinco). Um processo congelado que
//   acorde depois de o seu trinco ter sido partido sai com 75 sem gravar nada, em vez de pisar o que os
//   outros escreveram entretanto.
// Espera no máximo SCRUM_ESPERA_MS (15 s) e desiste com código 75.
let donoTrinco = null
const caminhoTrinco = () => path.join(DIR_ESTADO, '.trinco')
function partirSeVelho(trinco) {
  const partir = `${trinco}-partir`
  try { fs.mkdirSync(partir) } catch (e) {
    if (e.code !== 'EEXIST') throw e
    // Quem estava a partir morreu nesse microssegundo: o trinco de partir também envelhece.
    try { if (Date.now() - fs.statSync(partir).mtimeMs > TRINCO_VELHO_MS) fs.rmSync(partir, { recursive: true, force: true }) } catch { /* outro tratou */ }
    return
  }
  try {
    const s = fs.statSync(trinco, { throwIfNoEntry: false })
    if (s && Date.now() - s.mtimeMs > TRINCO_VELHO_MS) fs.rmSync(trinco, { recursive: true, force: true })
  } finally { try { fs.rmdirSync(partir) } catch { /* já não existe */ } }
}
function meuTrinco() {
  if (donoTrinco === null) return true // sem trinco (controlo negativo dos testes)
  try { return fs.readFileSync(path.join(caminhoTrinco(), 'dono'), 'utf8') === donoTrinco } catch { return false }
}
function comTrinco(fn) {
  fs.mkdirSync(DIR_ESTADO, { recursive: true })
  if (process.env.SCRUM_TESTE_SEM_TRINCO === '1') return fn() // só para o controlo negativo dos testes
  const trinco = caminhoTrinco()
  const limite = Date.now() + TRINCO_ESPERA_MS
  const dono = `${process.pid}-${crypto.randomBytes(6).toString('hex')}`
  for (;;) {
    try { fs.mkdirSync(trinco) } catch (e) {
      if (e.code !== 'EEXIST') throw e
      partirSeVelho(trinco)
      if (Date.now() > limite) falha('quadro ocupado: estado/.trinco não foi libertado a tempo; tenta de novo', 75)
      dormir(5 + Math.floor(Math.random() * 25))
      continue
    }
    try { fs.writeFileSync(path.join(trinco, 'dono'), dono) } catch { continue } // partido entre o mkdir e o dono
    break
  }
  donoTrinco = dono
  try { return fn() } finally {
    // Só se liberta o trinco que ainda é nosso.
    if (meuTrinco()) { try { fs.rmSync(trinco, { recursive: true, force: true }) } catch { /* já não existe */ } }
    donoTrinco = null
  }
}

class Estado {
  constructor() { this.d = {}; this.sujos = new Set() }
  doc(n) {
    if (!this.d[n]) {
      const v = lerJson(path.join(DIR_ESTADO, `${n}.json`), AUX[n] ?? (() => ({ atualizado_em: null, itens: [] })))
      if (DOCS.includes(n) && !Array.isArray(v.itens)) falha(`estado/${n}.json sem a lista «itens»`)
      this.d[n] = v
    }
    return this.d[n]
  }
  lista(n) { return this.doc(n).itens }
  achar(n, id) { return this.lista(n).find((x) => x.id === id) }
  exigir(n, id, nome) { return this.achar(n, id) ?? falha(`${nome} desconhecido: ${id}`) }
  sujo(n) { this.doc(n); this.sujos.add(n) }
  gravar() {
    const t = iso(agora())
    for (const n of this.sujos) {
      if (DOCS.includes(n)) this.d[n].atualizado_em = t
      if (!meuTrinco()) falha('o trinco deste comando foi partido enquanto esperava (processo congelado?); nada gravado, tenta de novo', 75)
      escreverAtomico(path.join(DIR_ESTADO, `${n}.json`), JSON.stringify(this.d[n], null, 1) + '\n')
    }
    this.sujos.clear()
  }
}
// Lê, muda e grava sob o trinco. SCRUM_TESTE_ATRASO_MS alarga a janela ler→gravar (só testes).
function transacao(fn) {
  return comTrinco(() => {
    const st = new Estado()
    const r = fn(st)
    dormir(Number(process.env.SCRUM_TESTE_ATRASO_MS || 0))
    st.gravar()
    return r
  })
}

// ------------------------------------------------------------------ esquemas e atribuições campo=valor
const T = (max, obrig = false) => ({ k: 'texto', max, obrig })
const EN = (valores, obrig = true, sinonimos) => ({ k: 'enum', valores, obrig, sinonimos })
const ESQ_PEDIDO = {
  titulo: T(200, true), descricao: T(1500), origem: EN(E.origem, true, SINONIMOS.origem), estado: EN(E.pedidoEstado, true, SINONIMOS.pedidoEstado),
  prioridade: EN(E.prioridade), resultado: T(1000), pedido_em: { k: 'data', obrig: true },
}
const ESQ_ITEM = {
  titulo: T(200, true), pedido: { k: 'id' }, spec: { k: 'id' }, tipo: EN(E.itemTipo), estado: EN(E.itemEstado, true, SINONIMOS.itemEstado),
  responsavel: T(80), ramo: { k: 'ramo' }, sha: { k: 'sha' }, bloqueio: T(500), inicio: { k: 'data' },
  fim: { k: 'data' }, notas: T(1000), criterio: T(500), depende: { k: 'ids' },
  bateria: { k: 'obj' }, 'bateria.estado': EN(E.bateriaEstado), 'bateria.sha': { k: 'sha', obrig: true },
  'bateria.perfil': T(40), 'bateria.em': { k: 'data', obrig: true }, 'bateria.duracao_s': { k: 'int' },
  tarefas: { k: 'obj' }, 'tarefas.feitas': { k: 'int', obrig: true }, 'tarefas.total': { k: 'int', obrig: true },
}
const ESQ_DECISAO = {
  pergunta: T(500, true), recomendacao: T(1000), estado: EN(E.decisaoEstado), decisao: T(1000), item: { k: 'id' }, pedido: { k: 'id' },
}
const ESQ_AGENTE = { nome: T(120, true), tipo: EN(E.agenteTipo, true, SINONIMOS.agenteTipo), modelo: T(60), estado: EN(E.agenteEstado), item: { k: 'id' }, detalhe: T(300), lease: T(120) }

function converter(campo, e, v) {
  v = String(v)
  switch (e.k) {
    case 'texto': return texto(v, e.max, campo)
    case 'enum': if (e.sinonimos?.[v]) v = e.sinonimos[v]; if (!e.valores.includes(v)) falha(`${campo}: «${v}» não é válido (${e.valores.join(' | ')})`, 2); return v
    case 'data': return data(v, campo)
    case 'int': if (!/^\d{1,9}$/.test(v)) falha(`${campo}: inteiro ≥ 0 esperado, veio «${v}»`, 2); return Number(v)
    case 'sha': { const s = v.trim().toLowerCase(); if (!/^[0-9a-f]{7,40}$/.test(s)) falha(`${campo}: SHA inválido «${v}» (7 a 40 hex)`, 2); return s }
    case 'id': return validarId(v, campo)
    case 'ids': { const l = [...new Set(v.split(',').map((x) => x.trim()).filter(Boolean))].map((x) => validarId(x, campo)); if (l.length > 30) falha(`${campo}: no máximo 30 ids`, 2); return l.length ? l : '' }
    case 'ramo': { const s = v.trim(); if (!/^[A-Za-z0-9._/-]{1,120}$/.test(s)) falha(`${campo}: nome de ramo inválido «${v}»`, 2); return s }
    case 'obj': return falha(`${campo}: só se apaga inteiro («${campo}=»); para mudar usa ${campo}.<campo>=valor`, 2)
    default: return falha(`${campo}: tipo interno desconhecido`)
  }
}
function pares(lista) {
  return lista.map((a) => {
    const i = a.indexOf('=')
    if (i <= 0) falha(`atribuição inválida «${a}»: usa campo=valor (vazio apaga: campo=)`, 2)
    return [a.slice(0, i).trim(), a.slice(i + 1)]
  })
}
function aplicar(obj, atribs, esq, nome) {
  if (!atribs.length) falha(`${nome} set: nada para mudar (campo=valor …)`, 2)
  const mudou = new Set()
  for (const [campo, bruto] of atribs) {
    const e = esq[campo] ?? falha(`${nome}: campo desconhecido «${campo}» (aceites: ${Object.keys(esq).join(', ')})`, 2)
    const [cima, baixo] = campo.split('.')
    const v = bruto === '' ? '' : converter(campo, e, bruto)
    if (v === '') {
      if (e.obrig) falha(`${campo} é obrigatório: não se apaga nem fica vazio`, 2)
      if (baixo) { if (obj[cima]) delete obj[cima][baixo] } else delete obj[cima]
    } else if (baixo) {
      if (obj[cima] != null && typeof obj[cima] !== 'object') falha(`${cima} não é um objeto`)
      ;(obj[cima] ??= {})[baixo] = v
    } else obj[cima] = v
    mudou.add(campo)
  }
  return mudou
}

// ------------------------------------------------------------------ regras do domínio
function evento(st, { tipo, texto: tx, agente, item, pedido }) {
  const t = agora(), lista = st.lista('eventos'), ids = new Set(lista.map((e) => e.id))
  const carimbo = iso(t).slice(0, 19).replace(/[-:]/g, '').replace('T', '-')
  let id
  do id = `e-${carimbo}-${crypto.randomBytes(2).toString('hex')}`; while (ids.has(id))
  const e = { id, em: iso(t), tipo }
  if (agente) e.agente = agente
  if (item) e.item = item
  if (pedido) e.pedido = pedido
  e.texto = texto(tx, 400, 'texto', true)
  lista.unshift(e)
  lista.sort((a, b) => ms(b.em) - ms(a.em))
  if (lista.length > MAX_EVENTOS) lista.length = MAX_EVENTOS
  st.sujo('eventos')
  return e
}
// Ritmo diário (60 dias): por dia, os ids dos itens integrados e postos em produção e as chaves das baterias
// verdes e vermelhas reportadas aqui. Guardam-se chaves e não contagens para nada contar a dobrar: um item que
// volta a «integrado» no mesmo dia, ou uma bateria reportada por «item set» e por «evento bateria» (o README
// sugere os dois), conta uma vez. A chave de uma bateria são os 7 primeiros caracteres do SHA; as métricas
// juntam-nas às das notas de testes (config «notas_bateria») pela mesma chave.
const chaveSha = (s) => String(s).toLowerCase().slice(0, 7)
const SHA_NO_TEXTO = /\b[0-9a-f]{7,40}\b/i
function contar(st, campo, chave) {
  const r = st.doc('_ritmo'); r.dias ??= {}
  const d = diaDe(agora())
  const dia = (r.dias[d] ??= {})
  const l = Array.isArray(dia[campo]) ? dia[campo] : (dia[campo] = [])
  if (!l.includes(chave)) l.push(chave)
  const limite = diaDe(new Date(agora().getTime() - 60 * 86400000))
  for (const k of Object.keys(r.dias)) if (k < limite) delete r.dias[k]
  st.sujo('_ritmo')
}
// Nomes dos estados para o texto dos eventos (o quadro mostra-os ao humano tal como estão); a config pode trocá-los.
const NOME_ESTADO = {
  'novo': 'novo', 'em-analise': 'em análise', 'em-curso': 'em curso',
  'pronto': 'pronto', 'em-producao': 'em produção', 'cancelado': 'cancelado', 'backlog': 'backlog',
  'em-revisao': 'em revisão', 'em-bateria': 'em testes', 'integrado': 'integrado', 'bloqueado': 'bloqueado',
  'a-correr': 'a correr', 'verde': 'verde', 'vermelha': 'vermelha', 'pendurada': 'pendurada',
}
NOME_ESTADO[ESPERA] = `à espera do ${DONO}`
Object.assign(NOME_ESTADO, VOC.rotulos)
const nomeEstado = (e) => NOME_ESTADO[e] ?? e ?? '?'
const COMECADO = new Set(['em-curso', 'em-revisao', 'em-bateria', 'integrado', 'em-producao'])
const FECHADO = new Set(['integrado', 'em-producao', 'cancelado'])
function mudarEstadoItem(st, it, para) {
  const de = it.estado
  if (de === para) return
  const t = iso(agora())
  it.estado = para
  it.atualizado_em = t
  if (COMECADO.has(para) && !it.inicio) it.inicio = t
  if (FECHADO.has(para)) { if (!it.fim) it.fim = t } else delete it.fim
  if (para === 'integrado') contar(st, 'integrados', it.id)
  if (para === 'em-producao') contar(st, 'em_producao', it.id)
  const bloq = para === 'bloqueado'
  // O evento leva o id do item (o quadro liga-o pelo título); o texto diz só o que mudou.
  evento(st, { tipo: bloq ? 'bloqueio' : 'nota', texto: `${nomeEstado(de)} → ${nomeEstado(para)}${bloq && it.bloqueio ? `: ${it.bloqueio}` : ''}`, item: it.id, pedido: it.pedido })
  st.sujo('itens')
}
// O estado de um pedido segue os seus itens enquanto estiver num estado automático. «a-espera-do-humano»
// (à espera do humano dono do projeto) e «cancelado» são decisões humanas: ficam como estão.
const PEDIDO_AUTO = new Set(['novo', 'em-analise', 'em-curso', 'pronto', 'em-producao'])
function derivarPedido(st, pid) {
  const p = st.achar('pedidos', pid)
  if (!p || !PEDIDO_AUTO.has(p.estado)) return
  const its = (p.itens ?? []).map((id) => st.achar('itens', id)).filter((i) => i && i.estado !== 'cancelado')
  if (!its.length) return
  let novo
  if (its.every((i) => i.estado === 'em-producao')) novo = 'em-producao'
  else if (its.every((i) => i.estado === 'integrado' || i.estado === 'em-producao')) novo = 'pronto'
  else if (its.some((i) => i.estado !== 'backlog' && i.estado !== 'pronto')) novo = 'em-curso'
  else return
  if (novo === p.estado) return
  const de = p.estado
  p.estado = novo
  p.atualizado_em = iso(agora())
  st.sujo('pedidos')
  evento(st, { tipo: 'nota', texto: `pedido ${nomeEstado(de)} → ${nomeEstado(novo)}`, pedido: p.id })
}
function desligarDoPedido(st, pid, iid) {
  const p = pid && st.achar('pedidos', pid)
  if (!p) return
  p.itens = (p.itens ?? []).filter((x) => x !== iid)
  p.atualizado_em = iso(agora())
  st.sujo('pedidos')
}
function ligarAoPedido(st, p, it) {
  p.itens ??= []
  if (!p.itens.includes(it.id)) p.itens.push(it.id)
  p.atualizado_em = iso(agora())
  it.pedido = p.id
  st.sujo('pedidos')
  st.sujo('itens')
}

// ------------------------------------------------------------------ comandos
function opcoes(op, aceites) {
  for (const k of Object.keys(op)) if (!aceites.includes(k)) falha(`opção desconhecida --${k}${aceites.length ? ` (aceites: ${aceites.map((a) => `--${a}`).join(' ')})` : ''}`, 2)
}

function novoPedido(st, { id, titulo, descricao, origem, prioridade, estado = 'novo', quando }) {
  const lista = st.lista('pedidos'), ids = new Set(lista.map((p) => p.id))
  const tt = texto(titulo, 200, 'titulo') || falha('pedido: falta o título', 2)
  const q = quando ?? agora()
  if (id) { if (ids.has(id)) falha(`pedido já existe: ${id} (para mudar: pedido set ${id} campo=valor)`) }
  else id = idUnico(`p-${compacto(q)}-${slug(tt)}`, ids)
  const p = { id, titulo: tt }
  const ds = descricao != null ? texto(descricao, 1500, 'descricao') : ''
  if (ds) p.descricao = ds
  Object.assign(p, { pedido_em: iso(q), origem, estado, prioridade, itens: [], atualizado_em: iso(agora()) })
  lista.unshift(p)
  st.sujo('pedidos')
  evento(st, { tipo: 'pedido', texto: `pedido novo${origem === 'painel' ? ' (painel)' : ''}: ${tt}`, pedido: id })
  return p
}

function pedidoAdd(st, op) {
  opcoes(op, ['titulo', 'descricao', 'origem', 'prioridade', 'id', 'estado'])
  if (op.titulo == null) falha('pedido add: falta --titulo', 2)
  return {
    ok: true,
    pedido: novoPedido(st, {
      id: op.id != null ? validarId(op.id) : undefined,
      titulo: op.titulo,
      descricao: op.descricao,
      origem: converter('origem', ESQ_PEDIDO.origem, op.origem ?? 'chat'),
      prioridade: converter('prioridade', ESQ_PEDIDO.prioridade, op.prioridade ?? 'normal'),
      estado: converter('estado', ESQ_PEDIDO.estado, op.estado ?? 'novo'),
    }),
  }
}

function pedidoSet(st, id, atribs) {
  const p = st.exigir('pedidos', validarId(id), 'pedido')
  const antes = p.estado
  aplicar(p, atribs, ESQ_PEDIDO, 'pedido')
  p.atualizado_em = iso(agora())
  st.sujo('pedidos')
  if (p.estado !== antes) evento(st, { tipo: 'nota', texto: `pedido ${nomeEstado(antes)} → ${nomeEstado(p.estado)}`, pedido: p.id })
  return { ok: true, pedido: p }
}

function pedidoLiga(st, pid, iid) {
  const p = st.exigir('pedidos', validarId(pid, 'pedido'), 'pedido')
  const it = st.exigir('itens', validarId(iid, 'item'), 'item')
  const antigo = it.pedido
  if (antigo && antigo !== p.id) desligarDoPedido(st, antigo, it.id)
  ligarAoPedido(st, p, it)
  it.atualizado_em = iso(agora())
  if (antigo !== p.id) evento(st, { tipo: 'nota', texto: `ligado ao pedido «${p.titulo}»`, item: it.id, pedido: p.id })
  derivarPedido(st, p.id)
  if (antigo && antigo !== p.id) derivarPedido(st, antigo)
  return { ok: true, pedido: p, item: it }
}

function itemAdd(st, op) {
  opcoes(op, ['titulo', 'pedido', 'spec', 'tipo', 'estado', 'id', 'responsavel', 'ramo', 'sha', 'notas', 'criterio', 'depende'])
  const lista = st.lista('itens'), ids = new Set(lista.map((i) => i.id))
  const titulo = texto(op.titulo ?? '', 200, 'titulo') || falha('item add: falta --titulo', 2)
  const tipo = converter('tipo', ESQ_ITEM.tipo, op.tipo ?? 'feature')
  const alvo = converter('estado', ESQ_ITEM.estado, op.estado ?? 'backlog')
  const spec = op.spec != null ? validarId(op.spec, 'spec') : undefined
  const pedido = op.pedido != null ? st.exigir('pedidos', validarId(op.pedido, 'pedido'), 'pedido') : undefined
  let id = op.id != null ? validarId(op.id) : null
  if (id && ids.has(id)) falha(`item já existe: ${id} (para mudar: item set ${id} campo=valor)`)
  if (!id) id = idUnico(`i-${spec ? `${spec.match(/^\d+/)?.[0] ?? slug(spec, 2)}-` : ''}${slug(titulo)}`, ids)
  const it = { id, titulo, tipo, estado: 'backlog', atualizado_em: iso(agora()) }
  if (spec) it.spec = spec
  for (const k of ['responsavel', 'ramo', 'sha', 'notas', 'criterio', 'depende']) {
    if (op[k] == null || op[k] === '') continue
    const v = converter(k, ESQ_ITEM[k], op[k])
    if (v !== '') it[k] = v
  }
  lista.unshift(it)
  st.sujo('itens')
  if (pedido) ligarAoPedido(st, pedido, it)
  evento(st, { tipo: 'nota', texto: `item novo: ${titulo}`, item: id, pedido: pedido?.id })
  if (alvo !== 'backlog') mudarEstadoItem(st, it, alvo)
  if (pedido) derivarPedido(st, pedido.id)
  return { ok: true, item: it }
}

function itemSet(st, id, atribs) {
  const it = st.exigir('itens', validarId(id), 'item')
  const antes = { estado: it.estado, pedido: it.pedido, bat: it.bateria?.estado, batSha: it.bateria?.sha, bloqueio: it.bloqueio }
  const mudou = aplicar(it, atribs, ESQ_ITEM, 'item')
  const t = iso(agora())
  if (it.bateria) {
    const b = it.bateria
    if (mudou.has('bateria.estado') && !mudou.has('bateria.em')) b.em = t
    if (!b.sha && it.sha) b.sha = it.sha
    if (!b.em) b.em = t
    if (!b.estado) falha('bateria.estado em falta (a-correr | verde | vermelha | pendurada)', 2)
    if (!b.sha) falha('bateria.sha em falta: dá bateria.sha=<sha> ou define o sha do item', 2)
  }
  if (it.tarefas) {
    const tf = it.tarefas
    if (tf.feitas == null || tf.total == null) falha('tarefas: dá os dois, tarefas.feitas=N tarefas.total=M', 2)
    if (tf.feitas > tf.total) falha(`tarefas: feitas (${tf.feitas}) maior do que total (${tf.total})`, 2)
  }
  it.atualizado_em = t
  st.sujo('itens')
  if (it.pedido !== antes.pedido) {
    const novo = it.pedido ? st.exigir('pedidos', it.pedido, 'pedido') : null
    if (antes.pedido) desligarDoPedido(st, antes.pedido, it.id)
    if (novo) ligarAoPedido(st, novo, it)
  }
  const alvo = it.estado
  if (alvo !== antes.estado) { it.estado = antes.estado; mudarEstadoItem(st, it, alvo) }
  else if (mudou.has('bloqueio') && it.bloqueio && it.bloqueio !== antes.bloqueio) {
    evento(st, { tipo: 'bloqueio', texto: `bloqueado: ${it.bloqueio}`, item: it.id, pedido: it.pedido })
  }
  const b = it.bateria
  if (b && mudou.has('bateria.estado') && (b.estado !== antes.bat || b.sha !== antes.batSha)) {
    evento(st, { tipo: 'bateria', texto: `bateria ${nomeEstado(b.estado)} em ${b.sha.slice(0, 9)}${b.perfil ? ` · ${b.perfil}` : ''}`, item: it.id, pedido: it.pedido })
    if (b.estado === 'vermelha') contar(st, 'vermelhas', chaveSha(b.sha))
    if (b.estado === 'verde') contar(st, 'verdes', chaveSha(b.sha))
  }
  for (const pid of new Set([antes.pedido, it.pedido].filter(Boolean))) derivarPedido(st, pid)
  return { ok: true, item: it }
}

function agenteSinal(st, idBruto, op, fim) {
  opcoes(op, ['nome', 'tipo', 'estado', 'item', 'detalhe', 'modelo', 'lease'])
  const id = validarId(idBruto, 'agente')
  const estado = converter('estado', ESQ_AGENTE.estado, op.estado ?? (fim ? 'terminado' : 'ativo'))
  if (fim && estado !== 'terminado' && estado !== 'erro') falha('agente fim: --estado terminado | erro', 2)
  const lista = st.lista('agentes'), t = iso(agora())
  let a = st.achar('agentes', id)
  if (!a) {
    if (!op.nome || !op.tipo) falha(`agente novo «${id}»: --nome e --tipo são obrigatórios (${E.agenteTipo.join(' | ')})`, 2)
    a = { id, nome: '', tipo: '', estado, inicio: t, ultimo_sinal: t }
    lista.unshift(a)
  } else if (!fim && estado === 'ativo' && (a.estado === 'terminado' || a.estado === 'erro')) a.inicio = t
  for (const k of ['nome', 'tipo', 'modelo', 'item', 'detalhe', 'lease']) {
    if (op[k] == null) continue
    const v = op[k] === '' ? '' : converter(k, ESQ_AGENTE[k], op[k])
    if (v !== '') a[k] = v
    else if (ESQ_AGENTE[k].obrig || k === 'tipo') falha(`agente: ${k} não pode ficar vazio`, 2)
    else delete a[k]
  }
  a.estado = estado
  a.ultimo_sinal = t
  if (lista.length > MAX_AGENTES) {
    const velhos = lista.filter((x) => x.estado !== 'ativo').sort((x, y) => ms(x.ultimo_sinal) - ms(y.ultimo_sinal))
    const fora = new Set(velhos.slice(0, lista.length - MAX_AGENTES).map((x) => x.id))
    st.doc('agentes').itens = lista.filter((x) => !fora.has(x.id))
  }
  st.sujo('agentes')
  return { ok: true, agente: a }
}

// Comando de fim de agente (config «agente_fim_cmd», sh -c): corre depois de o fim estar gravado e fora do trinco,
// com o registo do agente em JSON no stdin, e escreve um objeto JSON cujas chaves entram na resposta de «agente fim»
// (nunca «ok», «agente» nem «avisos»). Serve a um projeto para ligar ao fim de um agente o que só ele sabe (libertar um
// lease, avisar um painel): o CLI não sabe o que é. Falhar, passar de 30 s ou não escrever JSON não desfaz o fim:
// sai um aviso.
function fimDeAgente(a) {
  const cmd = CFG.agente_fim_cmd
  if (!cmd) return {}
  const r = spawnSync('sh', ['-c', cmd], { input: JSON.stringify(a), encoding: 'utf8', timeout: 30000, env: { ...process.env, SCRUM_DIR: BASE ?? '' } })
  if (r.error || r.status !== 0) {
    avisos.push(`agente fim: o comando de agente_fim_cmd falhou (${r.error ? (r.error.code ?? 'erro') : `código ${r.status}`}); o fim ficou gravado`)
    return {}
  }
  try {
    const j = JSON.parse(r.stdout)
    if (j && typeof j === 'object' && !Array.isArray(j)) { delete j.ok; delete j.agente; delete j.avisos; return j }
  } catch { /* cai no aviso */ }
  avisos.push('agente fim: o comando de agente_fim_cmd não escreveu um objeto JSON; o fim ficou gravado')
  return {}
}

function eventoCmd(st, pos, op) {
  opcoes(op, ['agente', 'item', 'pedido'])
  const tipo = converter('tipo', EN(E.eventoTipo), pos[0] ?? falha(`evento: falta o tipo (${E.eventoTipo.join(' | ')})`, 2))
  const tx = texto(pos.slice(1).join(' '), 400, 'texto') || falha('evento: falta o texto', 2)
  const e = evento(st, {
    tipo, texto: tx,
    agente: op.agente != null ? validarId(op.agente, 'agente') : undefined,
    item: op.item != null ? validarId(op.item, 'item') : undefined,
    pedido: op.pedido != null ? validarId(op.pedido, 'pedido') : undefined,
  })
  if (tipo === 'bateria') {
    // Chave: o SHA citado no texto (o mesmo que «item set bateria.*» e as notas usam); sem SHA, o próprio evento.
    const chave = tx.match(SHA_NO_TEXTO)?.[0] ? chaveSha(tx.match(SHA_NO_TEXTO)[0]) : e.id
    if (/vermelh/i.test(tx)) contar(st, 'vermelhas', chave)
    else if (/\bverde\b/i.test(tx)) contar(st, 'verdes', chave)
  }
  return { ok: true, evento: e }
}

function decisaoAdd(st, op) {
  opcoes(op, ['pergunta', 'recomendacao', 'item', 'pedido', 'id'])
  const pergunta = texto(op.pergunta ?? '', 500, 'pergunta') || falha('decisao add: falta --pergunta', 2)
  const lista = st.lista('decisoes'), ids = new Set(lista.map((d) => d.id))
  const t = agora()
  let id = op.id != null ? validarId(op.id) : null
  if (id && ids.has(id)) falha(`decisão já existe: ${id} (para mudar: decisao set ${id} campo=valor)`)
  id ??= idUnico(`d-${compacto(t)}-${slug(pergunta)}`, ids)
  const d = { id, pergunta }
  const r = op.recomendacao != null ? texto(op.recomendacao, 1000, 'recomendacao') : ''
  if (r) d.recomendacao = r
  d.estado = 'aberta'
  if (op.item != null) d.item = validarId(op.item, 'item')
  if (op.pedido != null) d.pedido = validarId(op.pedido, 'pedido')
  d.criada_em = iso(t)
  lista.unshift(d)
  st.sujo('decisoes')
  evento(st, { tipo: 'decisao', texto: `decisão aberta: ${pergunta}`, item: d.item, pedido: d.pedido })
  return { ok: true, decisao: d }
}

function decisaoSet(st, id, atribs) {
  const d = st.exigir('decisoes', validarId(id), 'decisão')
  const antes = d.estado
  aplicar(d, atribs, ESQ_DECISAO, 'decisao')
  if (d.estado === 'decidida') {
    if (!d.decisao) falha('decisão «decidida» sem texto: dá também decisao="…"', 2)
    if (antes !== 'decidida') {
      d.decidida_em = iso(agora())
      evento(st, { tipo: 'decisao', texto: `decidido: ${d.pergunta} → ${d.decisao}`, item: d.item, pedido: d.pedido })
    }
  } else delete d.decidida_em
  st.sujo('decisoes')
  return { ok: true, decisao: d }
}

// Importa a caixa de entrada do painel (coleção pedidos-novos, lida pelo ArtifactData com out_dir).
// Idempotente: um registo local (estado/_importados.json) guarda doc_id → pedido.
// A pasta é o out_dir do list (com a subpasta pedidos-novos/ que o ArtifactData cria) ou a própria subpasta.
const pastaCaixa = (d) => (fs.existsSync(path.join(d, 'pedidos-novos')) ? path.join(d, 'pedidos-novos') : d)
function lerCaixa(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const doc_id = f.slice(0, -5)
    try { return { doc_id, obj: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } } catch { return { doc_id, erro: 'JSON inválido' } }
  })
}
// Os campos do pedido num documento da caixa: o próprio objeto ou um envelope (data, fields, …) com «titulo».
function dadosDaCaixa(o) {
  const dados = [o, o?.data, o?.fields, o?.document, o?.doc, o?.value].find((x) => x && typeof x === 'object' && typeof x.titulo === 'string')
  return dados && dados.titulo.trim() ? dados : null
}
function importar(pos, op) {
  opcoes(op, [])
  const dir = pastaCaixa(path.resolve(pos[0] ?? falha('importar: falta a pasta (out_dir do ArtifactData)', 2)))
  if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) falha(`importar: pasta inexistente ${dir}`, 2)
  return importarDocs(lerCaixa(dir))
}
// versoes (só no plano-sync --caixa): as versões da caixa coladas em --versoes. Um documento válido sem versão que
// ainda não foi importado recusa tudo (código 2, nada importado), sob o mesmo trinco do importar; um que já está em
// _importados passa (sem versão não há delete; o plano-sync põe-no em caixa.adiados). É o ficheiro que fica no out_dir
// de um list anterior quando outro agente já importou e apagou o pedido: o list não apaga o que lá estava.
function importarDocs(docs, versoes) {
  return transacao((st) => {
    const reg = st.doc('_importados')
    reg.docs ??= {}
    if (versoes) {
      const semV = docs.filter((d) => !d.erro && dadosDaCaixa(d.obj) && !(versoes[d.doc_id] > 0) && !reg.docs[d.doc_id]).map((d) => `pedidos-novos/${d.doc_id}`)
      if (semV.length) {
        falha(`plano-sync: ${semV.length} ${plural(semV.length, 'documento', 'documentos')} da caixa sem versão em --versoes; nada foi importado nem preparado: se o ArtifactData list de pedidos-novos os mostra, cola em --versoes as linhas «version N» e repete 1–2; se não (ficheiro velho do out_dir, ou de outro list na mesma pasta), esvazia cada um (: > <out_dir>/pedidos-novos/<id>.json) e repete só o passo 2`,
          2, { sem_versao: semV })
      }
    }
    const r = { ok: true, importados: [], criados: [], ja_existiam: [], invalidos: [] }
    for (const d of docs) {
      if (reg.docs[d.doc_id]) { r.importados.push(d.doc_id); r.ja_existiam.push(d.doc_id); continue }
      if (d.erro) { r.invalidos.push({ doc_id: d.doc_id, erro: d.erro }); continue }
      const dados = dadosDaCaixa(d.obj)
      if (!dados) { r.invalidos.push({ doc_id: d.doc_id, erro: 'sem titulo' }); continue }
      const q = dados.criado_em != null ? new Date(dados.criado_em) : null
      try {
        const p = novoPedido(st, {
          titulo: dados.titulo,
          descricao: typeof dados.descricao === 'string' ? dados.descricao : undefined,
          origem: 'painel',
          prioridade: E.prioridade.includes(dados.prioridade) ? dados.prioridade : 'normal',
          quando: q && !Number.isNaN(q.getTime()) ? q : undefined,
        })
        reg.docs[d.doc_id] = { pedido: p.id, em: iso(agora()) }
        st.sujo('_importados')
        r.importados.push(d.doc_id)
        r.criados.push(p.id)
      } catch (e) {
        if (!(e instanceof ErroScrum)) throw e
        r.invalidos.push({ doc_id: d.doc_id, erro: e.message })
      }
    }
    const chaves = Object.keys(reg.docs)
    if (chaves.length > MAX_IMPORTADOS) {
      chaves.sort((a, b) => ms(reg.docs[a].em) - ms(reg.docs[b].em)).slice(0, chaves.length - MAX_IMPORTADOS).forEach((k) => delete reg.docs[k])
    }
    return r
  })
}

// Depois de um deploy verde: os itens «integrado» cujo sha está contido no SHA em produção passam a «em-producao».
function producao(pos, op) {
  opcoes(op, [])
  const sha = converter('sha', { k: 'sha' }, pos[0] ?? falha('producao: falta o SHA que está em produção', 2))
  // O git corre fora do trinco (pode demorar); dentro, só se promove o item cujo sha é o mesmo que se verificou.
  const cands = new Estado().lista('itens').filter((i) => i.estado === 'integrado' && i.sha)
  const contidos = new Map(cands.filter((i) => git(['merge-base', '--is-ancestor', i.sha, sha]) !== null).map((i) => [i.id, i.sha]))
  return transacao((st) => {
    const promovidos = []
    for (const it of st.lista('itens')) {
      if (it.estado === 'integrado' && it.sha && contidos.get(it.id) === it.sha) { mudarEstadoItem(st, it, 'em-producao'); promovidos.push(it.id) }
    }
    for (const pid of new Set(promovidos.map((id) => st.achar('itens', id)?.pedido).filter(Boolean))) derivarPedido(st, pid)
    return { ok: true, sha, promovidos }
  })
}

function ver(pos, op) {
  opcoes(op, [])
  const n = pos[0]
  if (!DOCS.includes(n)) falha(`ver: documento ${DOCS.join(' | ')} [id]`, 2)
  const st = new Estado()
  if (pos[1]) return { ok: true, [n]: st.exigir(n, pos[1], n) }
  return { ok: true, documento: n, ...st.doc(n) }
}

// ------------------------------------------------------------------ exportação e métricas
function git(args, timeout = 30000) {
  if (!REPO) return null
  const r = spawnSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8', timeout, maxBuffer: 128 << 20,
    // Sem GIT_SSH_COMMAND: um repositório com core.sshCommand (chave própria) ficaria sem ela.
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
  return r.error || r.status !== 0 ? null : r.stdout
}
// Fetch que nunca pede nada: o ssh do repositório (core.sshCommand, se houver) com BatchMode, para uma chave sem
// agente falhar logo em vez de esperar por uma frase-passe até ao timeout; https sem credenciais falha também
// (GIT_TERMINAL_PROMPT=0). Sem o remoto configurado, não tenta.
let temRemoto = null
function gitFetch(refspecs) {
  temRemoto ??= git(['remote', 'get-url', REMOTO]) !== null
  if (!temRemoto) return null
  const ssh = git(['config', '--get', 'core.sshCommand'])?.trim() || 'ssh'
  return git(['-c', `core.sshCommand=${ssh} -o BatchMode=yes -o ConnectTimeout=15`, 'fetch', '-q', REMOTO, ...refspecs], 90000)
}
// O ramo principal: o do remoto (refs/remotes/<remoto>/<ramo>) se existir, senão o local.
let refPrincipal
function principal() {
  if (refPrincipal !== undefined) return refPrincipal
  for (const r of [`refs/remotes/${REMOTO}/${RAMO}`, `refs/heads/${RAMO}`]) if (git(['rev-parse', '--verify', '-q', `${r}^{commit}`])) return (refPrincipal = r)
  return (refPrincipal = null)
}
function lerBlobs(oids) {
  const unicos = [...new Set(oids)]
  const m = new Map()
  if (!unicos.length || !REPO) return m
  const r = spawnSync('git', ['-C', REPO, 'cat-file', '--batch'], { input: unicos.join('\n') + '\n', maxBuffer: 512 << 20, timeout: 60000 })
  if (r.error || r.status !== 0) return m
  const buf = r.stdout
  let i = 0
  while (i < buf.length) {
    const nl = buf.indexOf(0x0a, i)
    if (nl < 0) break
    const [oid, tipo, tam] = buf.subarray(i, nl).toString('utf8').split(' ')
    if (tipo === 'missing' || tam === undefined) { i = nl + 1; continue }
    const n = Number(tam)
    m.set(oid, buf.subarray(nl + 1, nl + 1 + n).toString('utf8'))
    i = nl + 1 + n + 1
  }
  return m
}
function lerNotas(ref) {
  if (!ref) return []
  const lista = git(['notes', `--ref=${ref}`, 'list'])
  if (!lista) return []
  const pares = lista.split('\n').filter(Boolean).map((l) => l.split(' '))
  const blobs = lerBlobs(pares.map((p) => p[0]))
  return pares.map(([blob, commit]) => ({ commit, texto: blobs.get(blob) ?? '' }))
}
const json = (s) => { try { return JSON.parse(s) } catch { return null } }
const primeiro = (...vs) => vs.find((v) => v != null && v !== '')

// Notas de testes (config «notas_bateria»): uma nota JSON por commit testado.
//   {"resultado":"verde"|"vermelha"|"pendurada", "em":ISO, "perfil":"…", "duracao_s":N, "sha":"…"}
// Também se aceita {"status":"pass"|"fail", "complete":bool, "created_at":ISO, "seconds":N}. Sem «sha», o commit
// a que a nota está presa. Uma nota sem data válida ou sem resultado ignora-se.
function bateriasDasNotas() {
  const out = []
  for (const { commit, texto: tx } of lerNotas(NOTAS_BATERIA)) {
    const j = json(tx)
    if (!j || typeof j !== 'object') continue
    const em = new Date(primeiro(j.em, j.created_at, j.quando))
    if (Number.isNaN(em.getTime())) continue
    let resultado = E.bateriaEstado.includes(j.resultado) && j.resultado !== 'a-correr' ? j.resultado : null
    if (!resultado && typeof j.status === 'string') resultado = /^(pass|passed|ok|success|verde)$/i.test(j.status) && j.complete !== false ? 'verde' : 'vermelha'
    if (!resultado) continue
    const sha = String(j.sha || commit).toLowerCase()
    if (!/^[0-9a-f]{7,40}$/.test(sha)) continue
    const b = { sha: sha.slice(0, 9), perfil: typeof j.perfil === 'string' && j.perfil ? texto(j.perfil, 40, 'perfil', true) : 'completa', resultado, em: iso(em) }
    const dur = Number(primeiro(j.duracao_s, j.seconds))
    if (Number.isFinite(dur) && dur >= 0) b.duracao_s = Math.round(dur)
    out.push(b)
  }
  return out.sort((a, b) => ms(b.em) - ms(a.em))
}
// Notas de deploy (config «notas_deploy»): {"em"|"quando":ISO, "sha":"…", "smoke":{"passed":N,"failed":N},
// "rollback":"etiqueta para reverter"}; sem «sha», o commit da nota.
function deploysDasNotas() {
  const out = []
  for (const { commit, texto: tx } of lerNotas(NOTAS_DEPLOY)) {
    const j = json(tx)
    if (!j || typeof j !== 'object') continue
    const em = new Date(primeiro(j.em, j.quando, j.created_at))
    if (Number.isNaN(em.getTime())) continue
    const sha40 = String(j.sha || commit).toLowerCase()
    if (!/^[0-9a-f]{7,40}$/.test(sha40)) continue
    const d = { sha: sha40.slice(0, 9), em: iso(em), sha40 }
    if (j.smoke && Number.isFinite(j.smoke.passed) && Number.isFinite(j.smoke.failed)) d.smoke = { passed: j.smoke.passed, failed: j.smoke.failed }
    if (typeof j.rollback === 'string' && j.rollback) d.rollback = texto(j.rollback, 120, 'rollback', true)
    out.push(d)
  }
  return out.sort((a, b) => ms(b.em) - ms(a.em))
}
// Título da spec: o H1 do ficheiro sem o prefixo «Tasks:»/«Tarefas —». Um H1 que é só «Tasks», «Tarefas 003»
// ou «Spec 002» não diz nada: fica o nome da pasta sem o número (002-agenda → «agenda»).
function tituloTasks(tx, id) {
  const m = tx.match(/^#\s+(.+)$/m)
  let t = m ? m[1].replace(/^(?:tasks?|tarefas)(?:\s+(?:spec\s+)?\d+)?\s*[:—–-]\s*/i, '').trim() : ''
  if (/^(?:tasks?|tarefas|spec)?\s*(?:\d+)?$/i.test(t)) t = id.replace(/^\d+-/, '').replace(/-/g, ' ')
  return texto(t || id, 160, 'titulo', true)
}
// Padrão das specs (config «specs», omissão specs/*/tasks.md do Spec Kit): «*» vale um segmento do caminho e o
// primeiro «*» é o id da spec. Devolve a pasta fixa antes do primeiro «*» e a expressão que reconhece o caminho.
function padraoSpecs() {
  const p = PADRAO_SPECS.replace(/^\.?\/+/, '')
  if (!p.includes('*') || p.includes('**')) { avisos.push(`specs: padrão «${PADRAO_SPECS}» sem um «*» por segmento (ex.: specs/*/tasks.md); specs ignoradas`); return null }
  const seg = p.split('/')
  const fixo = seg.slice(0, seg.findIndex((x) => x.includes('*'))).join('/')
  let n = 0
  const re = new RegExp('^' + seg.map((x) => x.split('*').map((y) => y.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('\u0000')).join('/')
    .replace(/\u0000/g, () => (n++ === 0 ? '([^/]+)' : '[^/]*')) + '$')
  return { fixo, re }
}
// Ficheiros de tarefas no ramo principal e nos ramos locais com commits nos últimos 14 dias; por spec fica a
// versão mais adiantada. Entram as specs com tarefas por fechar e as fechadas nos últimos 7 dias. Ordem: as por
// fechar primeiro, cada grupo da mexida há menos tempo para a mais antiga (o ficheiro no principal, ou o ramo).
function specs(t) {
  const pd = padraoSpecs(), ref = principal()
  if (!pd) return []
  const fer = git(['for-each-ref', '--format=%(refname)%09%(refname:short)%09%(committerdate:unix)', 'refs/heads']) ?? ''
  const desde14 = t.getTime() / 1000 - 14 * 86400, desde7 = t.getTime() / 1000 - 7 * 86400
  const refs = ref ? [{ ref, ramo: null, quando: 0 }] : []
  for (const l of fer.split('\n').filter(Boolean)) {
    const [r, curto, q] = l.split('\t')
    if (r !== ref && curto !== RAMO && Number(q) >= desde14) refs.push({ ref: r, ramo: curto, quando: Number(q) })
  }
  const entradas = []
  const doMain = new Map()
  for (const r of refs) {
    const ls = git(['ls-tree', '-r', r.ref, ...(pd.fixo ? ['--', pd.fixo] : [])])
    if (ls == null) continue
    for (const l of ls.split('\n')) {
      const m = l.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/)
      const c = m && m[2].match(pd.re)
      if (!c) continue
      if (!r.ramo) doMain.set(c[1], m[1])
      else if (doMain.get(c[1]) === m[1]) continue
      entradas.push({ ...r, oid: m[1], spec: c[1] })
    }
  }
  const blobs = lerBlobs(entradas.map((e) => e.oid))
  const porSpec = new Map()
  for (const e of entradas) {
    const tx = blobs.get(e.oid) ?? ''
    const feitas = (tx.match(/^\s*[-*] \[[xX]\]/gm) ?? []).length
    const total = feitas + (tx.match(/^\s*[-*] \[ \]/gm) ?? []).length
    if (!total) continue
    const c = { id: texto(e.spec, 80, 'spec', true), titulo: tituloTasks(tx, e.spec), feitas, total, ramo: e.ramo, quando: e.quando }
    const a = porSpec.get(e.spec)
    if (!a || c.feitas > a.feitas || (c.feitas === a.feitas && a.ramo && c.ramo && c.quando > a.quando)) porSpec.set(e.spec, c)
  }
  // Último commit do principal que mexeu em cada ficheiro de tarefas (um só git log, do mais recente para trás).
  const mexidaNoMain = new Map()
  let ct = 0
  if (ref) {
    for (const l of (git(['log', '--format=%x00%ct', '--name-only', ref, '--', `:(glob)${PADRAO_SPECS.replace(/^\.?\/+/, '')}`]) ?? '').split('\n')) {
      if (l.startsWith('\0')) { ct = Number(l.slice(1)); continue }
      const m = l.match(pd.re)
      if (m && !mexidaNoMain.has(m[1])) mexidaNoMain.set(m[1], ct)
    }
  }
  const mexida = (s) => (s.ramo ? s.quando : mexidaNoMain.get(s.id) ?? 0)
  const aberta = (s) => s.feitas < s.total
  return [...porSpec.values()]
    .filter((s) => aberta(s) || mexida(s) >= desde7)
    .sort((a, b) => Number(aberta(b)) - Number(aberta(a)) || mexida(b) - mexida(a) || b.id.localeCompare(a.id, 'pt', { numeric: true }))
    .map(({ id, titulo, feitas, total, ramo }) => (ramo ? { id, titulo, feitas, total, ramo } : { id, titulo, feitas, total }))
}
// SHA em produção e disco livre pelo comando da config («producao_cmd»), só de leitura, com cache de 10 min
// (estado/.cache-producao.json). O comando escreve na 1.ª linha o SHA (7 a 40 hex) e, opcionalmente, na 2.ª
// o disco livre em GB («31», «31G», «31.4 GB»). Corre com sh -c no repositório e com 30 s de limite.
function producaoRemota() {
  const cmd = CFG.producao_cmd
  if (!cmd || SEM_REDE) return {}
  const cacheF = path.join(DIR_ESTADO, '.cache-producao.json')
  const ttl = Number(process.env.SCRUM_CACHE_PRODUCAO_S ?? 600) * 1000
  const chave = sha256(cmd).slice(0, 16)
  let c = null
  try { c = lerJson(cacheF, () => null) } catch { /* cache estragada: mede de novo */ }
  if (c?.sha && c.chave === chave && Date.now() - (c.medido_ms ?? 0) < ttl) return c
  const r = spawnSync('sh', ['-c', cmd], { encoding: 'utf8', timeout: 30000, cwd: REPO ?? undefined, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
  if (r.error || r.status !== 0) return {}
  const [l1 = '', l2 = ''] = (r.stdout ?? '').trim().split('\n').map((s) => s.trim())
  if (!/^[0-9a-fA-F]{7,40}$/.test(l1)) return {}
  const g = l2.match(/^(\d+(?:[.,]\d+)?)\s*(?:G|GB|GiB)?$/i)
  const disco = g ? Number(g[1].replace(',', '.')) : undefined
  const novo = { chave, medido_ms: Date.now(), em: iso(agora()), sha: l1.toLowerCase(), ...(disco != null && { disco }) }
  try { escreverAtomico(cacheF, JSON.stringify(novo) + '\n') } catch { /* cache é opcional */ }
  return novo
}
// Saúde da produção (config «readyz»): pronto = HTTP 2xx e, se o corpo for JSON com «status», um de
// ready | ok | pass | up | healthy. Opcional: um checks.migrations.detail (texto) no corpo aparece como «migracoes».
async function lerReadyz() {
  if (SEM_REDE || !CFG.readyz) return { estado: 'desconhecido' }
  try {
    const r = await fetch(CFG.readyz, { signal: AbortSignal.timeout(10000), headers: { accept: 'application/json' } })
    let corpo = null
    try { corpo = await r.json() } catch { /* sem corpo JSON */ }
    const st = typeof corpo?.status === 'string' ? corpo.status.toLowerCase() : 'ready'
    const det = corpo?.checks?.migrations?.detail
    return {
      estado: r.ok && ['ready', 'ok', 'pass', 'up', 'healthy'].includes(st) ? 'pronto' : 'falha',
      ...(typeof det === 'string' && det && { migracoes: texto(det, 80, 'migracoes', true) }),
    }
  } catch { return { estado: 'desconhecido' } }
}
async function metricas(ritmoLocal, t) {
  if (!SEM_REDE) {
    gitFetch([`+refs/heads/${RAMO}:refs/remotes/${REMOTO}/${RAMO}`])
    // Notas escritas noutra máquina (a bateria de testes ou o deploy correm noutro sítio). Sem «+»: só avança se
    // for fast-forward, para nunca deitar fora uma nota local ainda por publicar; se recusar, lê-se a local.
    const notas = [NOTAS_BATERIA, NOTAS_DEPLOY].filter(Boolean).map((r) => `${r}:${r}`)
    if (notas.length) gitFetch(notas)
  }
  const ref = principal()
  const rz = await lerReadyz()
  const prod = producaoRemota()
  const bat = bateriasDasNotas()
  const deps = deploysDasNotas()
  const m = { gerado_em: iso(t) }
  // «producao» só existe se o projeto a configurou: «sha» com o producao_cmd, «readyz» com o URL de saúde.
  if (CFG.producao_cmd || CFG.readyz) {
    const producao = {}
    if (CFG.producao_cmd) producao.sha = prod.sha ?? 'desconhecido'
    if (CFG.readyz) producao.readyz = rz.estado
    const nota = prod.sha && deps.find((d) => d.sha40.startsWith(prod.sha) || prod.sha.startsWith(d.sha40))
    if (nota) {
      producao.desde = nota.em
      if (nota.smoke) producao.smoke = nota.smoke
      if (nota.rollback) producao.rollback = nota.rollback
    }
    if (rz.migracoes) producao.migracoes = rz.migracoes
    m.producao = producao
  }
  const commits = (ref ? git(['log', '-30', '--format=%H%x1f%cI%x1f%s', ref]) ?? '' : '').split('\n').filter(Boolean).map((l) => {
    const [h, c, s] = l.split('\x1f')
    return { sha: h.slice(0, 9), em: iso(new Date(c)), titulo: texto(s, 160, 'commit', true) }
  })
  // Por dia: chaves locais (ver «contar») unidas às das notas pelo SHA, para a mesma bateria contar uma vez.
  // Um número no lugar da lista é de um estado antigo (contagem): soma-se tal como está.
  const tamanho = (v, extra = new Set()) => (Array.isArray(v) ? new Set([...v, ...extra]).size : (Number(v) || 0) + extra.size)
  const ritmo = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(t)
    d.setDate(d.getDate() - i)
    const dia = diaDe(d), r = ritmoLocal?.dias?.[dia] ?? {}
    const doDia = bat.filter((b) => diaDe(new Date(b.em)) === dia)
    const notas = (res) => new Set(doDia.filter((b) => (b.resultado === 'verde') === (res === 'verde')).map((b) => chaveSha(b.sha)))
    ritmo.push({
      dia,
      integrados: tamanho(r.integrados),
      em_producao: tamanho(r.em_producao),
      baterias_verdes: tamanho(r.verdes, notas('verde')),
      baterias_vermelhas: tamanho(r.vermelhas ?? r.baterias_vermelhas, notas('vermelha')),
    })
  }
  Object.assign(m, {
    main: { ramo: RAMO, sha: (ref && git(['rev-parse', '--short=9', ref])?.trim()) || 'desconhecido', commits },
    specs: specs(t),
    baterias: bat.slice(0, 30),
    deploys: deps.slice(0, 30).map(({ sha40, ...d }) => d),
    ritmo,
  })
  if (prod.disco != null) m[CHAVE_SERVIDOR] = { disco_livre_gb: prod.disco, em: prod.em }
  return m
}

function ordenar(v) {
  if (Array.isArray(v)) return v.map(ordenar)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, ordenar(v[k])]))
  return v
}
const canonico = (v) => JSON.stringify(ordenar(v))
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

// «Mudou?» compara o conteúdo sem os campos voláteis: os que mudam em cada exportar sem nada ter mudado. Medidos
// com exportar seguidos de uma cópia de um estado real (diff dos JSON):
//   sync.em, metricas.gerado_em — o relógio do exportar;
//   metricas.<servidor>.em      — a hora da medição da produção (a cache renova-a de 10 em 10 min);
//   sync.por                    — quem exportou (cada agente exporta com o seu --por).
// Os ficheiros enviados levam-nos na mesma; só a comparação os ignora. A lista é explícita, por documento e
// caminho: o «em» de um evento, de uma bateria ou de um deploy é dado e conta. O que muda com o tempo mas é dado
// (um agente passa a «a-espera» aos 45 min, a janela de 14 dias do ritmo à meia-noite) muda uma vez e conta.
const VOLATEIS = { sync: [['em'], ['por']], metricas: [['gerado_em'], [CHAVE_SERVIDOR, 'em']] }
function semVolateis(doc, obj) {
  const c = structuredClone(obj)
  for (const caminho of VOLATEIS[doc] ?? []) {
    const pai = caminho.slice(0, -1).reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), c)
    if (pai && typeof pai === 'object') delete pai[caminho.at(-1)]
  }
  return c
}
// Hash de comparação de um ficheiro exportado («sync.json», conteúdo): o do JSON canónico sem os voláteis, com a
// quebra de linha final do ficheiro. Num documento sem voláteis é o hash do próprio ficheiro.
const hashConteudo = (f, conteudo) => sha256(`${canonico(semVolateis(f.replace(/\.json$/, ''), JSON.parse(String(conteudo))))}\n`)
// Registo do que foi enviado (<saida>/enviados.json): ficheiro → {hash, em}, o hash de comparação e a hora do
// registo. O registo de antes da 2.1.0 guardava só o hash do ficheiro inteiro, em texto, e lê-se na mesma: nos 5
// documentos sem voláteis é igual ao hash novo e nada se reenvia; metricas e sync reenviam-se uma vez (já se
// reenviavam sempre) e o «enviados» seguinte grava-os no formato novo. Um CLI antigo que leia o registo novo
// reenvia tudo: nada se perde.
const hashEnviado = (e) => (typeof e === 'string' ? e : e && typeof e === 'object' ? e.hash : undefined)
// O sync vai sempre que vai outro documento (é pequeno): assim o seu «em», o «sincronizado» da página, é a hora do
// último envio, e as métricas do artefacto valem para essa hora (se tivessem mudado, iam no mesmo batch).
// Sozinho, vai por batimento: sem mudanças nada se envia, e a página avisaria «sem atualizar há mais de 6 h»
// com o quadro em dia; por isso vai também quando o seu último envio registado tem mais de BATIMENTO_SYNC_MIN
// (ou não tem hora). Mais nenhum documento vai por batimento.
const BATIMENTO_SYNC_MIN = 60
// Porque é que um ficheiro vai no próximo envio, pelo seu hash: 'mudou', 'batimento' ou null (não vai).
function porqueEnviar(f, hash, registo, t) {
  if (hashEnviado(registo) !== hash) return 'mudou'
  if (f === 'sync.json' && t.getTime() - ms(registo?.em) > BATIMENTO_SYNC_MIN * 60000) return 'batimento'
  return null
}
// O que vai no próximo envio, ficheiro → porquê ('mudou', 'batimento', 'ausente': o plano-sync soube por
// «nome=0» que o documento não existe no artefacto, ou 'acompanha': o sync que vai com os outros), pela ordem
// dos ficheiros em «hashes».
function paraEnviar(hashes, env, t, ausentes = new Set()) {
  const porque = {}
  for (const f of Object.keys(hashes)) { const p = porqueEnviar(f, hashes[f], env[f], t) ?? (ausentes.has(f) ? 'ausente' : null); if (p) porque[f] = p }
  if ('sync.json' in hashes && !porque['sync.json'] && Object.keys(porque).length) porque['sync.json'] = 'acompanha'
  return porque
}

// Cada documento ≤ 200 KB (o servidor recusa > 256 KB): corta primeiro o que já acabou e é mais antigo.
const FINAIS = { pedidos: ['cancelado', 'em-producao', 'pronto'], itens: ['cancelado', 'em-producao', 'integrado'], agentes: ['terminado', 'erro', 'a-espera'], decisoes: ['decidida'] }
// Ordem de corte de uma lista: eventos do mais antigo para o mais recente; nas outras, primeiro os estados
// finais pela ordem de FINAIS e, dentro de cada um, o mais antigo; os estados vivos só no fim, também do mais
// antigo para o mais recente.
function ordemDeCorte(n, l) {
  if (n === 'eventos') return l.slice().sort((a, b) => ms(a.em) - ms(b.em))
  const fin = FINAIS[n] ?? []
  const peso = (x) => { const i = fin.indexOf(x.estado); return i < 0 ? fin.length : i }
  const quando = (x) => ms(x.atualizado_em ?? x.ultimo_sinal ?? x.criada_em)
  return l.slice().sort((a, b) => peso(a) - peso(b) || quando(a) - quando(b))
}
// Corta de uma vez: mede cada elemento uma só vez e tira pela ordem até caber (antes era um corte e uma
// serialização inteira por elemento, quadrático num estado de meses).
function caber(n, d) {
  let j = canonico(d), cortes = 0
  while (Buffer.byteLength(j) > LIMITE_DOC) {
    if (n === 'metricas') {
      const listas = [d.main?.commits, d.specs, d.baterias, d.deploys].filter((l) => Array.isArray(l) && l.length)
      if (!listas.length) falha(`${n}: ${Buffer.byteLength(j)} bytes e nada que cortar`)
      listas.sort((a, b) => b.length - a.length)[0].pop()
      cortes++
    } else {
      const l = Array.isArray(d.itens) ? d.itens : []
      if (!l.length) falha(`${n}: ${Buffer.byteLength(j)} bytes e nada que cortar`)
      let excesso = Buffer.byteLength(j) - LIMITE_DOC
      const fora = new Set()
      for (const x of ordemDeCorte(n, l)) {
        if (excesso <= 0) break
        fora.add(x)
        excesso -= Buffer.byteLength(canonico(x)) + 1
      }
      d.itens = l.filter((x) => !fora.has(x))
      cortes += fora.size
    }
    j = canonico(d)
  }
  return { json: `${j}\n`, cortes }
}

// Geração do export/ (<saida>/.geracao.json, {lida, escrita}): «lida» numera as leituras do estado feitas
// sob o trinco, pela ordem em que aconteceram; «escrita» é o número da exportação que está no export/. O
// exportar lê o estado sob o trinco, mede fora dele (git, readyz, SSH: segundos) e volta ao trinco para escrever
// o export/, e só escreve se a sua leitura não for mais antiga do que a que lá está. Sem isto, um exportar lento
// que leu o estado antes de outro pisava-lhe o export/ com conteúdo velho, e quem o lesse a seguir tomava-o pelo
// mais recente (quando o plano-sync relia o export/, ia esse conteúdo com um if_version fresco e a mudança de
// outro agente desaparecia do artefacto). Um .geracao.json ilegível conta como vazio (perde-se só a proteção
// dessa vez).
function lerGeracao(f) {
  try {
    const g = JSON.parse(fs.readFileSync(f, 'utf8'))
    return { lida: Number(g?.lida) || 0, escrita: Number(g?.escrita) || 0 }
  } catch { return { lida: 0, escrita: 0 } }
}
const FICHEIROS = [...DOCS, 'metricas', 'sync'].map((n) => `${n}.json`)

// Gera os 7 documentos e escreve-os no export/ partilhado se nenhuma exportação mais recente lá estiver.
// Devolve o que gerou (conteudos, hashes, tamanhos: em memória, é com eles que o plano-sync faz o plano) e o que
// ficou no export/ (noExport: o próprio, ou o mais recente que já lá estava).
async function gerarExport(op) {
  opcoes(op, ['saida', 'por'])
  const saida = path.resolve(op.saida || SAIDA_OMISSAO)
  const fGeracao = path.join(saida, '.geracao.json')
  const naoMeu = () => falha('o trinco deste comando foi partido enquanto esperava (processo congelado?); nada gravado, tenta de novo', 75)
  // Leitura consistente sob o trinco; cria os documentos que ainda não existem (atualizado_em fica fixo) e tira
  // o número desta leitura.
  const { docs, geracao } = comTrinco(() => {
    const st = new Estado()
    for (const n of DOCS) if (!fs.existsSync(path.join(DIR_ESTADO, `${n}.json`))) st.sujo(n)
    st.gravar()
    fs.mkdirSync(saida, { recursive: true })
    const g = lerGeracao(fGeracao)
    const minha = Math.max(g.lida, g.escrita) + 1
    if (!meuTrinco()) naoMeu()
    escreverAtomico(fGeracao, `${JSON.stringify({ lida: minha, escrita: g.escrita })}\n`)
    return { docs: Object.fromEntries([...DOCS, '_ritmo'].map((n) => [n, structuredClone(st.doc(n))])), geracao: minha }
  })
  const t = agora()
  const limite = t.getTime() - SEM_SINAL_MIN * 60000
  for (const a of docs.agentes.itens) if (a.estado === 'ativo' && ms(a.ultimo_sinal) < limite) a.estado = 'a-espera'
  const saidaDocs = {
    pedidos: docs.pedidos, itens: docs.itens, agentes: docs.agentes, eventos: docs.eventos, decisoes: docs.decisoes,
    metricas: await metricas(docs._ritmo, t),
    sync: { em: iso(t), por: texto(op.por || process.env.SCRUM_POR || 'scrum-cli', 80, 'por'), versao_cli: VERSAO },
  }
  if (CFG.projeto) saidaDocs.sync.projeto = texto(CFG.projeto, 80, 'projeto', true)
  const conteudos = {}, hashes = {}, tamanhos = {}, cortados = {}
  for (const [n, d] of Object.entries(saidaDocs)) {
    const { json: j, cortes } = caber(n, d)
    conteudos[`${n}.json`] = j
    hashes[`${n}.json`] = hashConteudo(`${n}.json`, j)
    tamanhos[`${n}.json`] = Buffer.byteLength(j)
    if (cortes) cortados[n] = cortes
  }
  const noExport = comTrinco(() => {
    const g = lerGeracao(fGeracao)
    if (g.escrita > geracao) {
      // Já lá está a exportação de uma leitura mais recente: fica essa, e devolve-se o que ela tem.
      let h = {}
      try { h = JSON.parse(fs.readFileSync(path.join(saida, 'hashes.json'), 'utf8')) ?? {} } catch { /* ilegível: como incompleto */ }
      const ok = FICHEIROS.every((f) => typeof h[f] === 'string' && fs.existsSync(path.join(saida, f)))
      if (ok) return { escrito: false, hashes: h, tamanhos: Object.fromEntries(FICHEIROS.map((f) => [f, fs.statSync(path.join(saida, f)).size])) }
      // export/ incompleto ou ilegível (apagado à mão?): escreve-se por cima, como se não houvesse geração.
    }
    const escrever = (f, c) => { if (!meuTrinco()) naoMeu(); escreverAtomico(path.join(saida, f), c) }
    for (const [f, c] of Object.entries(conteudos)) escrever(f, c)
    // hashes.json: os hashes de comparação (sem os voláteis) deste export/, que um exportar substituído devolve.
    escrever('hashes.json', `${canonico(hashes)}\n`)
    escrever('.geracao.json', `${JSON.stringify({ lida: Math.max(g.lida, geracao), escrita: geracao })}\n`)
    return { escrito: true, hashes, tamanhos }
  })
  const env = lerJson(path.join(saida, 'enviados.json'), () => ({}))
  return { saida, t, conteudos, hashes, tamanhos, cortados, noExport, env }
}

// O exportar descreve o export/ partilhado tal como ficou: o seu, ou, com «export_mais_recente», o de uma leitura
// mais recente que já lá estava. Serve para ver o que há por enviar; para enviar há o plano-sync, porque o export/
// partilhado pode ser reescrito por outro agente entre o envio e o registo.
async function exportar(op) {
  const x = await gerarExport(op)
  const { hashes, tamanhos, escrito } = x.noExport
  const porque = paraEnviar(hashes, x.env, x.t)
  const ficheiros = FICHEIROS.filter((f) => f in hashes)
  // «mudaram»: o que há a enviar: o que mudou, o sync por batimento (também em «batimento») e o sync que
  // acompanha os outros.
  const r = {
    ok: true, saida: x.saida, ficheiros, mudaram: ficheiros.filter((f) => porque[f]),
    hashes: Object.fromEntries(ficheiros.map((f) => [f, hashes[f]])), tamanhos: Object.fromEntries(ficheiros.map((f) => [f, tamanhos[f]])),
  }
  const batimento = ficheiros.filter((f) => porque[f] === 'batimento')
  if (batimento.length) r.batimento = batimento
  if (!escrito) r.export_mais_recente = true
  if (Object.keys(x.cortados).length) r.cortados = x.cortados
  return r
}

// Regista o que um agente Claude enviou ao artefacto (passo 4 da sincronização), para o plano-sync seguinte dizer
// só o que mudou. Só se regista o conteúdo de um plano: a cópia imutável <saida>/plano/<carimbo>/ que o batch
// levou. --plano <pasta> (o «confirmar» do plano-sync) marca todos os documentos desse plano; com nomes a seguir
// (`--plano <pasta> itens sync`), só esses, para um batch partido em dois. Os caminhos de «enviar» também servem,
// todos do mesmo plano. Um nome sem --plano, --todos ou um ficheiro fora de um plano recusam (código 2):
// registavam o export/ partilhado do último exportar, que outro agente pode ter reescrito entre o envio e o
// registo, e o artefacto ficava com o conteúdo antigo sem ninguém o voltar a enviar. Sem nada recusa também: uma
// lista vazia por engano (uma substituição de shell que não deu nada) não marca nada.
const RE_PLANO = /^\d{8}T\d{6}-\d+-[0-9a-f]{6}$/
function enviados(pos, op) {
  opcoes(op, ['saida', 'plano', 'todos'])
  if (op.todos !== undefined) falha('enviados: --todos deixou de existir (registava o último exportar, não o que foi enviado): envia com o plano-sync e corre o «confirmar» dele', 2)
  let dir, nomes
  if (op.plano !== undefined) {
    if (pos.some((a) => a.includes('/'))) falha('enviados: com --plano, a seguir vêm nomes (itens, eventos.json), não caminhos', 2)
    dir = path.resolve(op.plano)
    nomes = pos
  } else {
    if (!pos.length) falha('enviados: diz o que foi enviado: --plano <pasta> (o «confirmar» do plano-sync), --plano <pasta> <nomes> para parte dele, ou os caminhos de «enviar»', 2)
    if (!pos.every((a) => a.includes('/'))) falha('enviados: um nome sem --plano registava o último exportar, não o que foi enviado: usa --plano <pasta do plano> <nomes> (a pasta do «confirmar»)', 2)
    const dirs = [...new Set(pos.map((a) => path.dirname(path.resolve(a))))]
    if (dirs.length > 1) falha('enviados: os caminhos são de planos diferentes; regista um plano de cada vez', 2)
    dir = dirs[0]
    nomes = pos.map((a) => path.basename(a))
  }
  if (path.basename(path.dirname(dir)) !== 'plano' || !RE_PLANO.test(path.basename(dir))) {
    falha(`enviados: ${dir} não é a pasta de um plano (<saida>/plano/<carimbo>/, a do «confirmar» do plano-sync); só se regista o que um plano enviou`, 2)
  }
  let fich
  try { fich = fs.readdirSync(dir).filter((f) => FICHEIROS.includes(f)) } catch { return falha(`enviados: não encontro o plano ${dir}`, 2) }
  if (!fich.length) falha(`enviados: o plano ${dir} não tem documentos`, 2)
  const pedidos = [...new Set(nomes.map((n) => (n.endsWith('.json') ? n : `${n}.json`)))]
  for (const f of pedidos) if (!fich.includes(f)) falha(`enviados: ${f} não está no plano ${dir} (${FICHEIROS.filter((x) => fich.includes(x)).join(', ')})`, 2)
  const saida = path.resolve(op.saida ?? path.dirname(path.dirname(dir))) // <saida>/plano/<carimbo>
  // O hash de comparação (sem os voláteis, ver hashConteudo) do ficheiro do plano: é o que foi mesmo enviado.
  const sel = FICHEIROS.filter((f) => (pedidos.length ? pedidos : fich).includes(f)).map((f) => {
    const a = path.join(dir, f)
    let c
    try { c = fs.readFileSync(a) } catch { return falha(`enviados: não consigo ler ${a}`, 2) }
    try { return [f, hashConteudo(f, c)] } catch { return falha(`enviados: ${a} não é JSON válido`, 2) }
  })
  // Sob o trinco: dois agentes a marcar ao mesmo tempo não perdem a marca um do outro. «em» (a hora deste
  // registo) é o que o batimento do sync mede.
  comTrinco(() => {
    const env = lerJson(path.join(saida, 'enviados.json'), () => ({}))
    const em = iso(agora())
    for (const [f, h] of sel) env[f] = { hash: h, em }
    escreverAtomico(path.join(saida, 'enviados.json'), `${canonico(env)}\n`)
  })
  return { ok: true, enviados: sel.map(([f]) => f) }
}

// Versões dos documentos, coladas do resultado do ArtifactData list: «pedidos=3 itens=3» (separados por espaço,
// vírgula, ponto e vírgula ou linha) ou as linhas que o list imprime, «- "itens"  3807 bytes  version 2  "…"».
// «nome=0» diz que o documento não existe no artefacto (o list não o mostra: artefacto novo ou reposto). Os da
// coleção estado ficam em «v»; os outros (os doc_id da caixa pedidos-novos, quando se colam também as linhas do
// list dela) em «outras». Um documento com duas versões diferentes recusa.
const DOCS_SYNC = [...DOCS, 'metricas', 'sync']
function lerVersoes(txt) {
  const v = {}, outras = {}
  if (txt === undefined || !String(txt).trim()) return { v, outras }
  let n = 0
  const por = (doc, num) => {
    n++
    const k = Number(num)
    if (!Number.isSafeInteger(k) || k < 0) falha(`plano-sync: versão inválida ${doc}=${num}`, 2)
    const alvo = DOCS_SYNC.includes(doc) ? v : outras
    if (alvo[doc] !== undefined && alvo[doc] !== k) falha(`plano-sync: duas versões para ${doc} (${alvo[doc]} e ${k})`, 2)
    alvo[doc] = k
  }
  const s = String(txt)
  for (const m of s.matchAll(/"([^"\s]+)"[^"\n]*?\bversion\s+(\d+)/g)) por(m[1], m[2])
  for (const m of s.matchAll(/(?<![^\s,;])([A-Za-z0-9_.-]+)=(\d+)(?![^\s,;])/g)) por(m[1], m[2])
  if (!n) falha('plano-sync: --versoes sem nenhuma versão reconhecida (usa «pedidos=3 itens=3» ou as linhas «version N» do ArtifactData list)', 2)
  return { v, outras }
}

// Prepara a sincronização com o artefacto para qualquer agente Claude: corre o exportar e devolve os writes
// prontos para o ArtifactData batch, só dos documentos cujo conteúdo (sem os voláteis) mudou desde o último
// «enviados», mais o sync (que acompanha os outros, ou vai sozinho por batimento). Sem mudanças, «mudaram» vem
// vazio e não há writes: é o caso normal.
// O plano é feito do que este exportar gerou, em memória, nunca relido do export/ partilhado: o estado foi lido
// depois de o agente listar as versões, por isso o conteúdo é pelo menos tão recente como o que essas versões
// descrevem, e o if_version protege o resto. Relido do export/, podia ser o de um exportar mais antigo e lento,
// e ia conteúdo velho com versão fresca. Cada write aponta para uma cópia imutável deste plano
// (<saida>/plano/<carimbo>/), que um exportar de outro agente não pisa; «confirmar» é o comando que a marca como
// enviada (passo 4).
// if_version vem de --versoes. Um documento por enviar que já foi enviado e não tem versão recusa o plano inteiro
// (código 2, com «sem_versao» no erro): escrever sem versão num documento que existe é recusado pelo artefacto, e
// um plano sem ele dizia «nada a enviar» com a mudança por enviar. Um documento nunca enviado e sem versão vai sem
// if_version (cria-o). «nome=0» (o documento não existe no artefacto) põe-no no plano sem if_version, mudado ou
// não: num artefacto novo ou reposto com o registo de envios antigo, é a forma de o repor. Um --versoes vazio
// com envios registados recusa também (código 2): o list de estado veio vazio (artefacto novo ou reposto, e
// então são os 7 com =0) ou não foi colado, e um plano «nada a enviar» deixava o artefacto vazio.
// Num conflito de versão nada se perde: o estado local é a verdade, basta repetir.
// --caixa <pasta> (o out_dir do ArtifactData list da coleção pedidos-novos, que pode nem existir se a caixa está
// vazia) importa a caixa antes de exportar, para os pedidos novos irem já neste plano, e junta aos writes um
// delete com if_version por documento importado; as versões vêm das linhas do list da caixa, coladas também em
// --versoes. Um documento da caixa sem versão e por importar recusa antes de importar (código 2, «sem_versao» com
// pedidos-novos/<id>); um sem versão que já foi importado não recusa, fica sem delete e sai em «caixa.adiados».
// Um batch leva no máximo 50 writes: os deletes que não cabem ficam também em «caixa.adiados» e saem numa
// sincronização seguinte (o importar é idempotente).
const PLANO_VELHO_MS = 6 * 3600 * 1000
const MAX_WRITES = 50
const aspas = (s) => (/^[A-Za-z0-9_./:@%+=,-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`)
// O comando do passo 4 para este plano: o SCRUM_CLI (o invólucro de um projeto que corre este ficheiro com valores
// por omissão seus), senão o scrum.sh ao lado deste ficheiro (ou node com ele), sempre com o SCRUM_DIR deste comando:
// é lá que está o trinco do registo, seja qual for a pasta onde o comando corre.
function comandoEnviados(dir) {
  const sh = path.join(AQUI, 'scrum.sh')
  const cli = process.env.SCRUM_CLI ? aspas(path.resolve(process.env.SCRUM_CLI))
    : fs.existsSync(sh) ? aspas(sh) : `${aspas(process.execPath)} ${aspas(fileURLToPath(import.meta.url))}`
  // SCRUM_CONFIG fixa a mesma config do plano: um SCRUM_REPO/SCRUM_CONFIG na shell de quem corre não a troca.
  const cfg = ficheiroConfig()
  return `SCRUM_DIR=${aspas(BASE)} ${cfg ? `SCRUM_CONFIG=${aspas(cfg)} ` : ''}${cli} enviados --plano ${aspas(dir)}`
}
const plural = (n, um, varios) => (n === 1 ? um : varios)
function lerCaixaDoPlano(op) {
  const dir = pastaCaixa(path.resolve(op.caixa))
  const st = fs.statSync(dir, { throwIfNoEntry: false })
  if (st && !st.isDirectory()) falha(`plano-sync: --caixa ${dir} não é uma pasta`, 2)
  const docs = st ? lerCaixa(dir) : []
  const doEstado = docs.filter((d) => DOCS_SYNC.includes(d.doc_id)).map((d) => d.doc_id)
  if (doEstado.length) falha(`plano-sync: --caixa ${dir} tem documentos da coleção estado (${doEstado.join(', ')}): passa o out_dir do list de pedidos-novos`, 2)
  return docs
}
async function planoSync(op) {
  opcoes(op, ['saida', 'por', 'versoes', 'caixa'])
  const { v: versoes, outras } = lerVersoes(op.versoes)
  const { versoes: _v, caixa: _c, ...opExportar } = op
  if (op.versoes !== undefined && !Object.keys(versoes).length) {
    const reg = lerJson(path.join(path.resolve(op.saida || SAIDA_OMISSAO), 'enviados.json'), () => ({}))
    const ja = FICHEIROS.filter((f) => reg[f] !== undefined).map((f) => f.slice(0, -'.json'.length))
    if (ja.length) {
      falha(`plano-sync: --versoes não traz nenhuma versão da coleção estado, mas daqui já se enviou para o artefacto; nada foi preparado: se o ArtifactData list de estado veio vazio (artefacto novo ou reposto), passa --versoes "${DOCS_SYNC.map((d) => `${d}=0`).join(' ')}" e o plano cria-os sem if_version; senão, repete o list e passa todas as linhas «version N» do resultado`,
        2, { sem_versao: ja })
    }
  }
  const docsCaixa = op.caixa !== undefined ? lerCaixaDoPlano(op) : null
  const imp = docsCaixa ? importarDocs(docsCaixa, outras) : null
  const x = await gerarExport(opExportar)
  const base = path.join(x.saida, 'plano')
  fs.mkdirSync(base, { recursive: true })
  for (const n of fs.readdirSync(base)) { // planos de há mais de 6 h já não vão ser enviados
    if (!RE_PLANO.test(n)) continue
    try { if (Date.now() - fs.statSync(path.join(base, n)).mtimeMs > PLANO_VELHO_MS) fs.rmSync(path.join(base, n), { recursive: true, force: true }) } catch { /* outro tratou */ }
  }
  const ausentes = FICHEIROS.filter((f) => versoes[f.slice(0, -'.json'.length)] === 0)
  const porque = paraEnviar(x.hashes, x.env, x.t, new Set(ausentes))
  const mudaram = Object.keys(porque)
  const sets = [], semVersao = []
  for (const f of mudaram) {
    const doc = f.slice(0, -'.json'.length)
    const w = { op: 'set', collection: 'estado', doc_id: doc, file_path: '' }
    if (versoes[doc] > 0) w.if_version = versoes[doc]
    else if (versoes[doc] === undefined && x.env[f] !== undefined) { semVersao.push(doc); continue }
    sets.push(w)
  }
  if (semVersao.length) {
    const n = semVersao.length
    falha(`plano-sync: ${semVersao.join(', ')} ${plural(n, 'tem', 'têm')} mudanças por enviar e já ${plural(n, 'existe', 'existem')} no artefacto, mas ${plural(n, 'veio', 'vieram')} sem versão em --versoes; nada foi preparado: repete o ArtifactData list e passa todas as linhas «version N» do resultado; se o list não ${plural(n, 'o', 'os')} mostra (artefacto novo ou reposto), não ${plural(n, 'existe', 'existem')} lá: passa ${semVersao.map((d) => `${d}=0`).join(' ')} (e =0 para qualquer outro documento que o list não mostre) e o plano cria-${plural(n, 'o', 'os')} sem if_version`,
      2, { sem_versao: semVersao, mudaram })
  }
  let dir = null
  if (sets.length) {
    const carimbo = iso(x.t).slice(0, 19).replace(/[-:]/g, '')
    dir = path.join(base, `${carimbo}-${process.pid}-${crypto.randomBytes(3).toString('hex')}`)
    fs.mkdirSync(dir)
    for (const w of sets) {
      w.file_path = path.join(dir, `${w.doc_id}.json`)
      escreverAtomico(w.file_path, x.conteudos[`${w.doc_id}.json`])
    }
  }
  const writes = [...sets]
  let caixa
  if (imp) {
    // Apaga-se da caixa o que ficou importado (os criados agora e os que já o estavam); um documento inválido fica.
    // Um já importado sem versão (ficheiro antigo no out_dir, ou linha do list que faltou) fica sem delete, em adiados:
    // se ainda estiver na caixa, a sincronização seguinte apaga-o com a versão do list.
    const comVersao = imp.importados.filter((id) => outras[id] > 0)
    const apagar = comVersao.slice(0, Math.max(0, MAX_WRITES - writes.length))
    for (const id of apagar) writes.push({ op: 'delete', collection: 'pedidos-novos', doc_id: id, if_version: outras[id] })
    caixa = { criados: imp.criados, apagar }
    const adiados = [...comVersao.slice(apagar.length), ...imp.importados.filter((id) => !(outras[id] > 0))]
    if (adiados.length) caixa.adiados = adiados
    if (imp.invalidos.length) caixa.invalidos = imp.invalidos
  }
  // bytes: soma dos ficheiros dos sets (um batch leva no máximo 1 MiB; acima de ~900 000, parte em dois).
  const bytes = sets.reduce((s, w) => s + Buffer.byteLength(x.conteudos[`${w.doc_id}.json`]), 0)
  // sem_versao fica na saída, sempre vazio (um documento sem versão recusa o plano), para quem já o lia.
  const r = { ok: true, writes, mudaram, sem_versao: [], enviar: sets.map((w) => w.file_path), bytes }
  if (dir) r.confirmar = comandoEnviados(dir)
  const batimento = mudaram.filter((f) => porque[f] === 'batimento')
  if (batimento.length) r.batimento = batimento
  if (ausentes.length) r.ausentes = ausentes
  const ignoradas = Object.keys(outras).filter((id) => !docsCaixa?.some((d) => d.doc_id === id))
  if (ignoradas.length) r.ignoradas = ignoradas
  if (caixa) r.caixa = caixa
  if (Object.keys(x.cortados).length) r.cortados = x.cortados
  return r
}

// Vista Markdown do quadro (docs/backlog.md quando não há artefacto publicado): pedidos abertos, itens por
// estado, decisões abertas. Sai em texto, não em JSON.
const ORDEM_MD = ['bloqueado', 'em-curso', 'em-revisao', 'em-bateria', 'pronto', 'backlog', 'integrado', 'em-producao']
function markdown(pos, op) {
  opcoes(op, [])
  if (pos.length) falha('markdown não leva argumentos', 2)
  const st = new Estado()
  const l = [`# Backlog${CFG.projeto ? `: ${CFG.projeto}` : ''}`, '', '<!-- Gerado por scrum.mjs markdown; muda-se pelo CLI, não à mão. -->', '']
  const decs = st.lista('decisoes').filter((d) => d.estado === 'aberta')
  if (decs.length) {
    l.push('## Decisões abertas', '')
    for (const d of decs) l.push(`- **${d.pergunta}**${d.recomendacao ? ` Recomendação: ${d.recomendacao}` : ''} (\`${d.id}\`)`)
    l.push('')
  }
  const peds = st.lista('pedidos').filter((p) => p.estado !== 'em-producao' && p.estado !== 'cancelado')
  if (peds.length) {
    l.push('## Pedidos abertos', '')
    for (const p of peds) l.push(`- ${p.titulo} — ${nomeEstado(p.estado)}, prioridade ${p.prioridade} (\`${p.id}\`)`)
    l.push('')
  }
  const its = st.lista('itens')
  for (const est of ORDEM_MD) {
    const doEstado = its.filter((i) => i.estado === est)
    if (!doEstado.length) continue
    l.push(`## ${nomeEstado(est)}`, '')
    for (const i of doEstado) {
      l.push(`### ${i.titulo} (\`${i.id}\`)`)
      if (i.criterio) l.push(`- Aceitação: ${i.criterio}`)
      if (i.depende?.length) l.push(`- Depende de: ${i.depende.join(', ')}`)
      if (i.bloqueio) l.push(`- Bloqueio: ${i.bloqueio}`)
      if (i.spec) l.push(`- Spec: ${i.spec}`)
      if (i.ramo || i.sha) l.push(`- ${[i.ramo && `Ramo: ${i.ramo}`, i.sha && `SHA: ${i.sha.slice(0, 9)}`].filter(Boolean).join(' · ')}`)
      if (i.tarefas) l.push(`- Tarefas: ${i.tarefas.feitas}/${i.tarefas.total}`)
      if (i.notas) l.push(`- Notas: ${i.notas}`)
      l.push('')
    }
  }
  return { texto: l.join('\n') }
}

// ------------------------------------------------------------------ linha de comandos
const ajuda = () => `scrum.mjs ${VERSAO} — quadro de desenvolvimento
estado: ${DIR_ESTADO ?? '(sem repositório git: define SCRUM_DIR ou corre dentro do repo)'}
config: ${CFG.ficheiro ?? `(nenhuma; opcional em ${ficheiroConfig() ?? '<repo>/.agentic/quadro/config.json'})`}

  pedido add --titulo T [--descricao D] [--origem ${E.origem.join('|')}] [--prioridade alta|normal|baixa] [--estado E] [--id ID]
  pedido set <id> campo=valor …            (titulo descricao origem estado prioridade resultado pedido_em; campo= apaga)
  pedido liga <pedidoId> <itemId>
  item add --titulo T [--pedido P] [--spec S] [--tipo ${E.itemTipo.join('|')}] [--estado backlog]
           [--criterio C] [--depende id1,id2] [--id ID] [--responsavel R] [--ramo B] [--sha S] [--notas N]
  item set <id> campo=valor …              (estado ramo sha bloqueio notas criterio depende responsavel pedido spec …
                                            bateria.estado= bateria.sha= bateria.perfil= bateria.duracao_s=
                                            tarefas.feitas= tarefas.total=)
  agente sinal <id> --nome N --tipo T [--lease L] [--estado ativo] [--item I] [--detalhe D] [--modelo M]   (de 30 em 30 min; sem sinal há 45 min, «a-espera»)
  agente fim <id> [--estado terminado|erro] [--detalhe D]   (corre o agente_fim_cmd da config, se houver)
  evento <tipo> <texto> [--agente A] [--item I] [--pedido P]   (tipo: ${E.eventoTipo.join(' ')})
  decisao add --pergunta Q [--recomendacao R] [--item I] [--pedido P] [--id ID]
  decisao set <id> estado=decidida decisao="…"
  importar <pasta>                         (out_dir do ArtifactData com a coleção pedidos-novos)
  exportar [--saida DIR] [--por QUEM]      (7 documentos + hashes.json; «mudaram» = o que mudou desde o último «enviados»,
                                            sem contar carimbos, mais o sync com os outros ou sozinho se o último envio
                                            dele tem > ${BATIMENTO_SYNC_MIN} min; nunca pisa o export/ de uma leitura mais recente)
  enviados --plano PASTA [nome …] | caminho-do-plano …   [--saida DIR]
                                           (marca como enviado ao artefacto o conteúdo de um plano: o «confirmar» do
                                            plano-sync, ou só os nomes dados desse plano (batch partido), ou os caminhos
                                            «enviar»; nomes sem --plano, --todos e ficheiros fora de um plano recusam)
  plano-sync --versoes "pedidos=3 …" [--caixa DIR] [--por QUEM] [--saida DIR]
                                           (exportar + writes para o ArtifactData batch, só do que mudou, com if_version,
                                            e «confirmar», o comando do passo 4; sem mudanças, «mudaram» vazio e sem
                                            writes; um documento por enviar sem versão recusa com código 2; nome=0 = não
                                            existe no artefacto (cria-o); --caixa = out_dir do list de pedidos-novos:
                                            importa-a e junta os deletes; o sync vai com os outros ou sozinho de
                                            ${BATIMENTO_SYNC_MIN} em ${BATIMENTO_SYNC_MIN} min)
  producao <sha>                           (itens integrados contidos no SHA passam a em-producao)
  ver <pedidos|itens|agentes|eventos|decisoes> [id]
  markdown                                 (vista Markdown, para docs/backlog.md sem artefacto)

Estados do item: ${E.itemEstado.join(' ')}
Estados do pedido: ${E.pedidoEstado.join(' ')}
Tipos de agente: ${E.agenteTipo.join(' ')}
Variáveis: SCRUM_DIR (pasta-mãe de estado/), SCRUM_REPO, SCRUM_CONFIG, SCRUM_PROJETO, SCRUM_RAMO, SCRUM_REMOTO,
SCRUM_READYZ, SCRUM_PRODUCAO_CMD, SCRUM_NOTAS_BATERIA, SCRUM_NOTAS_DEPLOY, SCRUM_SPECS, SCRUM_TZ, SCRUM_SEM_REDE=1,
SCRUM_SAIDA, SCRUM_AGENTE_FIM_CMD, SCRUM_CLI, SCRUM_POR, SCRUM_AGORA, SCRUM_ESPERA_MS. Nada de segredos nem dados pessoais nos textos.
`

// Opções sem valor (interruptores): «--todos» é true; «--todos=x» chega como texto e o comando recusa-o.
const INTERRUPTORES = new Set(['todos'])
function analisar(argv) {
  const pos = [], op = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--') { pos.push(...argv.slice(i + 1)); break }
    if (a.startsWith('--') && a.length > 2) {
      const eq = a.indexOf('=')
      if (eq > 0) op[a.slice(2, eq)] = a.slice(eq + 1)
      else if (INTERRUPTORES.has(a.slice(2))) op[a.slice(2)] = true
      else {
        if (i + 1 >= argv.length) falha(`opção ${a} sem valor`, 2)
        op[a.slice(2)] = argv[++i]
      }
    } else pos.push(a)
  }
  return { pos, op }
}

async function main(argv) {
  const [grupo, ...resto] = argv
  if (!grupo || grupo === 'ajuda' || grupo === '--help' || grupo === '-h') return null
  if (CFG.erro) falha(CFG.erro, 2)
  if (!DIR_ESTADO) falha('não encontro o repositório: corre dentro de um repositório git ou define SCRUM_DIR (e SCRUM_REPO)', 2)
  avisos.push(...avisosConfig)
  const { pos, op } = analisar(resto)
  const acao = pos[0]
  const sem = (n) => { if (pos.length - 1 > n) falha(`argumentos a mais: ${pos.slice(n + 1).join(' ')}`, 2) }
  switch (grupo) {
    case 'pedido':
      if (acao === 'add') { sem(0); return transacao((st) => pedidoAdd(st, op)) }
      if (acao === 'set') { opcoes(op, []); return transacao((st) => pedidoSet(st, pos[1] ?? falha('pedido set: falta o id', 2), pares(pos.slice(2)))) }
      if (acao === 'liga') { opcoes(op, []); sem(2); if (!pos[2]) falha('pedido liga <pedidoId> <itemId>', 2); return transacao((st) => pedidoLiga(st, pos[1], pos[2])) }
      return falha('pedido add | set | liga', 2)
    case 'item':
      if (acao === 'add') { sem(0); return transacao((st) => itemAdd(st, op)) }
      if (acao === 'set') { opcoes(op, []); return transacao((st) => itemSet(st, pos[1] ?? falha('item set: falta o id', 2), pares(pos.slice(2)))) }
      return falha('item add | set', 2)
    case 'agente':
      if (acao !== 'sinal' && acao !== 'fim') falha('agente sinal | fim', 2)
      sem(1)
      {
        const r = transacao((st) => agenteSinal(st, pos[1] ?? falha(`agente ${acao}: falta o id`, 2), op, acao === 'fim'))
        return acao === 'fim' ? { ...r, ...fimDeAgente(r.agente) } : r
      }
    case 'evento': return transacao((st) => eventoCmd(st, pos, op))
    case 'decisao':
      if (acao === 'add') { sem(0); return transacao((st) => decisaoAdd(st, op)) }
      if (acao === 'set') { opcoes(op, []); return transacao((st) => decisaoSet(st, pos[1] ?? falha('decisao set: falta o id', 2), pares(pos.slice(2)))) }
      return falha('decisao add | set', 2)
    case 'importar': if (pos.length > 1) falha('importar <pasta>', 2); return importar(pos, op)
    case 'exportar': if (pos.length) falha('exportar não leva argumentos (usa --saida)', 2); return exportar(op)
    case 'enviados': return enviados(pos, op)
    case 'plano-sync': if (pos.length) falha('plano-sync não leva argumentos (usa --versoes, --por, --saida)', 2); return planoSync(op)
    case 'producao': if (pos.length > 1) falha('producao <sha>', 2); return producao(pos, op)
    case 'ver': return ver(pos, op)
    case 'markdown': return markdown(pos, op)
    default: return falha(`comando desconhecido «${grupo}» (scrum.mjs ajuda)`, 2)
  }
}

// Escrita síncrona (process.exit a seguir não pode cortar a saída num pipe).
function escreverFd(fd, s) {
  const b = Buffer.from(s)
  for (let off = 0; off < b.length;) {
    try { off += fs.writeSync(fd, b, off) } catch (e) { if (e.code !== 'EAGAIN') throw e; dormir(5) }
  }
}
let codigo = 0
try {
  const r = await main(process.argv.slice(2))
  if (r === null) escreverFd(1, ajuda())
  else if (typeof r.texto === 'string' && Object.keys(r).length === 1) escreverFd(1, r.texto)
  else {
    if (avisos.length) r.avisos = avisos
    escreverFd(1, `${JSON.stringify(r)}\n`)
  }
} catch (e) {
  codigo = e instanceof ErroScrum ? e.codigo : 1
  escreverFd(2, `${JSON.stringify({ ok: false, erro: e instanceof ErroScrum ? e.message : `interno: ${e?.stack ?? e}`, ...(e instanceof ErroScrum && e.extra) })}\n`)
}
process.exit(codigo)
