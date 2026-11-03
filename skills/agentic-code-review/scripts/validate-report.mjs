#!/usr/bin/env node
// Checks an agentic-code-review report before author/human delivery. Read-only: validates form,
// not finding truth (first-line counts, file:line, capped Nits, one-line Pre-existing).
// Usage: node validate-report.mjs [--json] <report.md | ->
// - reads stdin; --json returns { ok, problems: [{ line, msg }], header }.
// Exit: 0 conforming; 1 nonconforming with failure list; 2 usage or unreadable file.
// Format: assets/report.template.md. English syntax only.
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const NOTHING = '0 Important — nothing to fix';
const MAX_NITS = 3;
// Custom REVIEW.md levels are not checked against these default round limits.
const LEVEL_LIMIT = [[/^Quick\b/,1],[/^Standard\b/,2],[/^Complete\b/,3]];
// Off-start labels (bullets, numbering, bold) would hide findings from counts: refuse them.
const LOOSE_LABEL = /\[(Important|Nit|Pre-existing)\]/;
const HEADER = /^Review ([0-9a-f]{7,40}) · ([^·]+?) · (?:lens ([^·]+?) · )?round (\d+)\/(\d+) · (\d+) Important · (\d+) Nits? · (\d+) Pre-existing$/;
// file:line, file:start-end, file:line:column. Require a slash, dot or known extensionless name
// so localhost:3000, times and https:// do not count.
const EXTENSIONLESS = /^(Makefile|Dockerfile|Containerfile|Justfile|Gemfile|Procfile|Rakefile|Brewfile|Caddyfile|Jenkinsfile|Vagrantfile)$/;
const FILE_LINE = /(?<![\w/.@~+-])(\/?(?:[\w.@~+-]+\/)*[\w.@~+-]+):(\d+)(?:-\d+|:\d+)?(?![\w:])/g;
const DOC = /\.(md|mdx|markdown|txt|rst|adoc)$/i;
const fileLines = text => [...text.matchAll(FILE_LINE)]
  .filter(m=>/[/.]/.test(m[1])||EXTENSIONLESS.test(m[1])).map(m=>`${m[1]}:${m[2]}`);
export function validateReport(text){
  const lines=text.replace(/\r\n/g,'\n').split('\n');
  const problems=[];
  const fail=(n,msg)=>problems.push({line:n,msg});
  const filled=lines.map((l,i)=>({n:i+1,t:l.trim()})).filter(l=>l.t!=='');
  if(filled.length===0){ fail(1,'empty report'); return {ok:false,problems,header:null}; }
  // First line
  const first=filled[0], m=HEADER.exec(first.t);
  let header=null;
  if(!m){
    fail(first.n,'first line must follow «Review <sha> · <level> · [lens <lens> · ]round <n>/<limit> · <i> Important · <n> Nits · <p> Pre-existing» (SHA: 7 to 40 hexadecimal characters)');
  }else{
    const [,sha,level,lens,round,limit,i,n,p]=m;
    header={sha,level:level.trim(),lens:lens?.trim()??null,round:Number(round),limit:Number(limit),important:Number(i),nits:Number(n),preexisting:Number(p)};
    if(/[<>{}]/.test(header.level)) fail(first.n,`unfilled level: «${header.level}»`);
    if(header.lens&&/[<>{}]/.test(header.lens)) fail(first.n,`unfilled lens: «${header.lens}»`);
    if(header.round<1||header.limit<1) fail(first.n,'round and limit start at 1');
    else if(header.round>header.limit) fail(first.n,`round ${header.round} above limit ${header.limit}: stop at limit and go to human`);
    const levelRule=LEVEL_LIMIT.find(([re])=>re.test(header.level));
    if(levelRule&&header.limit>levelRule[1]) fail(first.n,`limit ${header.limit} above level «${header.level}» (${levelRule[1]})`);
  }
  // Body
  const important=[],nits=[],pre=[];
  let sawNit=false,nothing=null;
  for(const {n,t} of filled.slice(1)){
    if(t===NOTHING){nothing=n;continue;}
    if(/^Pre-existing:/.test(t)){pre.push({n,t});continue;}
    const tag=/^\[([^\]]+)\]\s*(.*)$/.exec(t);
    if(!tag){
      if(LOOSE_LABEL.test(t)) fail(n,'label outside line start: findings start with «[Important]» or «[Nit]», without bullet or bold');
      continue;
    }
    const [,label,rest]=tag;
    if(label==='Important'){
      if(sawNit) fail(n,'Important after a Nit: findings must follow severity order');
      important.push(n);validateImportant(n,rest,fail);
    }else if(label==='Nit'){
      sawNit=true;nits.push(n);
      if(fileLines(rest.split(' — ')[0]).length===0) fail(n,'Nit without file:line immediately after label');
    }else if(/^Pre-existing/.test(label)){
      fail(n,'Pre-existing findings all belong on one line «Pre-existing: …», not as findings');
    }else fail(n,`unknown label «${label}»: only [Important] and [Nit] (Pre-existing on one line)`);
  }
  if(nits.length>MAX_NITS) fail(nits[MAX_NITS],`${nits.length} Nits: maximum ${MAX_NITS} per report (consolidation cuts them)`);
  // Nothing to fix
  if(important.length===0&&(!header||header.important===0)){
    if(nothing===null) fail(first.n,`without Important findings, next line must be «${NOTHING}»`);
    else if(filled[1]?.n!==nothing) fail(nothing,`«${NOTHING}» comes immediately after first line`);
  }else if(nothing!==null) fail(nothing,`«${NOTHING}» in report that has ${important.length} Important`);
  // Pre-existing
  let preCount=0;
  if(pre.length===0) fail(first.n,'missing «Pre-existing: …» line (or «Pre-existing: none»)');
  else if(pre.length>1) fail(pre[1].n,'more than one «Pre-existing:» line: all belong on one');
  if(pre.length>=1){
    const value=pre[0].t.replace(/^Pre-existing:/,'').trim();
    if(value==='') fail(pre[0].n,'empty «Pre-existing:» line: write «none»');
    else if(!/^none\.?$/i.test(value)){
      const items=value.split(';').map(s=>s.trim()).filter(Boolean);preCount=items.length;
      for(const item of items){
        if(fileLines(item).length===0) fail(pre[0].n,`Pre-existing without file:line: «${item}»`);
        else if(!/ · \S/.test(item)) fail(pre[0].n,`Pre-existing without class («file:line · class»): «${item}»`);
      }
    }
  }
  // Counts
  if(header){
    const count=(name,says,actual)=>{if(says!==actual) fail(first.n,`${name}: first line says ${says}, found ${actual}`);};
    count('Important',header.important,important.length);count('Nits',header.nits,nits.length);count('Pre-existing',header.preexisting,preCount);
  }
  return {ok:problems.length===0,problems,header};
}
function validateImportant(n,rest,fail){
  const local=rest.split(' — ')[0],fl=fileLines(local);
  if(fl.length===0){fail(n,'Important without file:line immediately after label (guessing by name is not proof)');return;}
  const reproduce=/ — reproduce: (.*?)(?= — class:|$)/.exec(rest);
  if(!reproduce||reproduce[1].trim()==='') fail(n,'Important without «reproduce: <test, command or screenshot>»');
  const category=/ — class: (.+)$/.exec(rest);
  if(!category||category[1].trim()==='') fail(n,'Important without «class: <class>»');
  const proof=reproduce?.[1]??'',file=fl[0].replace(/:\d+$/,'');
  if(DOC.test(file)){
    const other=fileLines(rest).filter(x=>x!==fl[0]);
    if(other.length===0&&!/absent: \S+/.test(proof)) fail(n,'Important in doc: missing contradicting line (another file:line, or «absent: <path>»)');
  }
  // Only dependencies outside approved research need research absence. Vulnerable dependencies
  // (security lens) are proved like any code.
  if(category&&/outside research/i.test(category[1])&&!/absent in [^\s—]*[/.][^\s—]*/.test(proof))
    fail(n,'Important dependency outside research: proof needs «absent in <approved research file>» as well as manifest line');
}
function main(args){
  const json=args.includes('--json'),rest=args.filter(a=>a!=='--json');
  if(rest.length!==1||rest[0]==='-h'||rest[0]==='--help'){
    process.stderr.write('usage: node validate-report.mjs [--json] <report.md | ->\n');return 2;
  }
  let text;
  try{text=rest[0]==='-'?readFileSync(0,'utf8'):readFileSync(rest[0],'utf8');}
  catch(e){process.stderr.write(`validate-report: cannot read ${rest[0]}: ${e.code??e.message}\n`);return 2;}
  const r=validateReport(text);
  if(json) process.stdout.write(JSON.stringify(r,null,2)+'\n');
  else if(r.ok){
    const c=r.header;
    process.stdout.write(`ok: Review ${c.sha} · ${c.level} · round ${c.round}/${c.limit} · ${c.important} Important · ${c.nits} Nits · ${c.preexisting} Pre-existing\n`);
  }else{
    process.stdout.write(`fail: ${r.problems.length} problem(s)\n`);
    for(const p of r.problems) process.stdout.write(`- line ${p.line}: ${p.msg}\n`);
  }
  return r.ok?0:1;
}
// Node resolves the main module symlink (--link installation): compare both real paths or main
// would never run and the validator would silently exit 0 for any file.
const real=p=>{try{return realpathSync(p);}catch{return path.resolve(p);}};
if(process.argv[1]&&real(process.argv[1])===real(fileURLToPath(import.meta.url))) process.exitCode=main(process.argv.slice(2));
