// Run with node --test. Bad reports prove refusal; good reports and template examples prove
// agreement between the validator and the skill's required output.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { validateReport } from './validate-report.mjs';
const HERE = import.meta.dirname;
const SCRIPT = path.join(HERE, 'validate-report.mjs');
const TEMPLATE = path.join(HERE, '..', 'assets', 'report.template.md');
const GOOD = `Review 9c4e2a105a1e · Standard · round 1/2 · 2 Important · 1 Nit · 1 Pre-existing

[Important] src/api/orders.ts:88 — total ignores organization discount — reproduce: npm test -- orders.discount (red) — class: separately recalculated total
[Important] docs/RUNBOOK.md:41 — says to run deleted scripts/migrate.sh — reproduce: absent: scripts/migrate.sh (git ls-tree) — class: lying doc
[Nit] src/api/orders.ts:12 — unused import

Pre-existing: src/lib/dates.ts:30 · fixed timezone
Not read: nothing`;
const CLEAN = `Review 9c4e2a1 · Complete · lens security · round 2/3 · 0 Important · 0 Nits · 0 Pre-existing
0 Important — nothing to fix

Pre-existing: none`;
const problems = text => validateReport(text).problems.map(p => p.msg);
const refuse = (text, pattern) => {
  const r = validateReport(text);
  assert.equal(r.ok, false, 'should refuse');
  assert.ok(r.problems.some(p => pattern.test(p.msg)), `no problem matches ${pattern}: ${JSON.stringify(r.problems)}`);
};
test('good report passes (Important, Nit, Pre-existing)', () => {
  assert.deepEqual(problems(GOOD), []);
  const r = validateReport(GOOD);
  assert.equal(r.ok, true);
  assert.deepEqual({ sha:r.header.sha, level:r.header.level, round:r.header.round, limit:r.header.limit },
    { sha:'9c4e2a105a1e', level:'Standard', round:1, limit:2 });
});
test('no findings passes with zero line immediately below header', () => assert.deepEqual(problems(CLEAN), []));
test('report template examples pass', () => {
  const blocks = [...readFileSync(TEMPLATE,'utf8').matchAll(/```text example\n([\s\S]*?)```/g)].map(m=>m[1]);
  assert.ok(blocks.length >= 2, 'template lost text example blocks');
  for(const b of blocks) assert.deepEqual(problems(b), [], b.split('\n')[0]);
});
// First line
 test('refuses first line without count format', () => {
  refuse('Review of branch: fine\n0 Important — nothing to fix\nPre-existing: none', /first line/);
  refuse('\n\n[Important] a.ts:1 — x — reproduce: y — class: z', /first line/);
});
test('refuses short or nonhex SHA', () => {
  for(const sha of ['HEAD','2bfc']) refuse(CLEAN.replace('9c4e2a1',sha), /first line/);
});
test('refuses unfilled level',()=>refuse(CLEAN.replace('Complete','<level>'),/level/));
test('refuses rounds above limit and zero',()=>{
  refuse(CLEAN.replace('round 2/3','round 4/3'),/round 4 above limit 3/);
  refuse(CLEAN.replace('round 2/3','round 0/3'),/round/);
});
test('refuses counts inconsistent with findings',()=>{
  refuse(GOOD.replace('2 Important','3 Important'),/Important: first line says 3, found 2/);
  refuse(GOOD.replace('1 Nit ','2 Nits '),/Nits: first line says 2, found 1/);
  refuse(GOOD.replace('1 Pre-existing','2 Pre-existing'),/Pre-existing: first line says 2, found 1/);
});
// Nothing to fix
 test('refuses zero Important without zero line',()=>refuse(CLEAN.replace('0 Important — nothing to fix\n',''),/nothing to fix/));
test('refuses nothing to fix with Important findings',()=>refuse(GOOD.replace('\n\n[Important]','\n0 Important — nothing to fix\n\n[Important]'),/nothing to fix.*has 2 Important/));
// Important and proof
 test('refuses Important without file:line',()=>{
  refuse(GOOD.replace('src/api/orders.ts:88','src/api/orders.ts'),/without file:line/);
  refuse(GOOD.replace('src/api/orders.ts:88','the calculateTotal function'),/without file:line/);
});
test('refuses Important without reproduce or class',()=>{
  refuse(GOOD.replace(' — reproduce: npm test -- orders.discount (red)',''),/reproduce/);
  refuse(GOOD.replace(' — class: separately recalculated total',''),/class/);
  refuse(GOOD.replace('reproduce: npm test -- orders.discount (red)','reproduce: '),/reproduce/);
});
test('doc proof needs contradicting line or absent path',()=>{
  refuse(GOOD.replace('reproduce: absent: scripts/migrate.sh (git ls-tree)','reproduce: read the doc'),/doc.*contradict/);
  assert.deepEqual(problems(GOOD.replace('reproduce: absent: scripts/migrate.sh (git ls-tree)','reproduce: scripts/README.md:3 lists only deploy.sh')),[]);
});
test('dependency outside research needs absence in approved research',()=>{
  const dep=proof=>`Review abcdef1 · Standard · round 1/2 · 1 Important · 0 Nits · 0 Pre-existing\n[Important] package.json:31 — adds left-pad — reproduce: ${proof} — class: dependency outside research\nPre-existing: none`;
  refuse(dep('git diff base...head -- package.json'),/dependency.*absent in/);
  assert.deepEqual(problems(dep('git diff base...head -- package.json; absent in specs/012/research.md')),[]);
  refuse(dep('git diff base...head -- package.json; absent in nothing'),/outside research.*absent in/);
});
test('vulnerable dependency is proved like code without approved research',()=>{
  assert.deepEqual(problems(`Review abcdef1 · Standard · round 1/2 · 1 Important · 0 Nits · 0 Pre-existing\n[Important] package.json:31 — lodash 4.17.20 known CVE — reproduce: npm audit --omit=dev (high) — class: vulnerable dependency\nPre-existing: none`),[]);
});
// Nits, labels, order, Pre-existing
 test('refuses more than 3 Nits',()=>{
  const nits=Array.from({length:4},(_,i)=>`[Nit] src/a.ts:${i+1} — confusing name`).join('\n');
  refuse(`Review abcdef1 · Standard · round 1/2 · 0 Important · 4 Nits · 0 Pre-existing\n0 Important — nothing to fix\n${nits}\nPre-existing: none`,/4 Nits.*maximum 3/);
});
test('refuses Nit without file:line',()=>refuse(GOOD.replace('[Nit] src/api/orders.ts:12','[Nit] orders'),/Nit without file:line/));
test('refuses unknown labels',()=>refuse(GOOD.replace('[Nit]','[Critical]'),/unknown label «Critical»/));
test('refuses Important after Nit',()=>{
  const lines=GOOD.split('\n'); const [nit]=lines.splice(lines.findIndex(l=>l.startsWith('[Nit]')),1);
  lines.splice(2,0,nit); refuse(lines.join('\n'),/after a Nit/);
});
test('refuses multiple, missing or incomplete Pre-existing lines',()=>{
  refuse(GOOD.replace('Pre-existing: src/lib/dates.ts:30 · fixed timezone','[Pre-existing] src/lib/dates.ts:30 · timezone'),/Pre-existing.*one line/);
  refuse(GOOD.replace('Pre-existing: src/lib/dates.ts:30 · fixed timezone',''),/missing.*Pre-existing:/);
  refuse(GOOD+'\nPre-existing: none',/more than one.*Pre-existing:/);
  refuse(GOOD.replace('src/lib/dates.ts:30 · fixed','dates · fixed'),/Pre-existing without file:line/);
  refuse(CLEAN.replace('Pre-existing: none','Pre-existing: '),/none/);
  refuse(GOOD.replace(' · fixed timezone',''),/Pre-existing without class/);
});
test('refuses labels not at line start (hidden from counts)',()=>{
  const report=line=>`Review abcdef1 · Standard · round 1/2 · 0 Important · 0 Nits · 0 Pre-existing\n0 Important — nothing to fix\n${line}\nPre-existing: none`;
  for(const line of ['- [Important] src/a.ts:3 — loses discount — reproduce: npm test — class: separate total','1. [Nit] nothing','**[Important]** no file']) refuse(report(line),/outside line start/);
});
test('refuses round limits above skill level',()=>{
  refuse(GOOD.replace('Standard · round 1/2','Standard · round 3/3'),/limit 3 above level «Standard» \(2\)/);
  refuse(GOOD.replace('Standard · round 1/2','Quick (requested) · round 2/2'),/level «Quick \(requested\)» \(1\)/);
  assert.deepEqual(problems(GOOD.replace('Standard · round 1/2','Deep · round 3/3')),[]);
});
// CLI
function run(args,input){ const r=spawnSync(process.execPath,[SCRIPT,...args],{encoding:'utf8',input}); return {code:r.status,out:r.stdout+r.stderr}; }
test('CLI: 0 good, 1 bad with list, 2 usage/unreadable file',t=>{
  const folder=mkdtempSync(path.join(tmpdir(),'validate-report-')); t.after(()=>rmSync(folder,{recursive:true,force:true}));
  const good=path.join(folder,'good.md'), bad=path.join(folder,'bad.md');
  writeFileSync(good,GOOD); writeFileSync(bad,GOOD.replace('2 Important','5 Important').replace('src/api/orders.ts:88','orders'));
  const ok=run([good]); assert.equal(ok.code,0,ok.out); assert.match(ok.out,/^ok: /);
  const fail=run([bad]); assert.equal(fail.code,1,fail.out); assert.match(fail.out,/without file:line/); assert.match(fail.out,/first line says 5, found 2/);
  assert.equal(run([]).code,2); assert.equal(run([path.join(folder,'missing.md')]).code,2);
});
test('CLI: stdin and JSON',()=>{
  const r=run(['--json','-'],CLEAN); assert.equal(r.code,0,r.out);
  const j=JSON.parse(r.out); assert.equal(j.ok,true); assert.equal(j.header.important,0);
  assert.deepEqual(Object.keys(j),['ok','problems','header']);
});
test('CLI: skill and script symlinks behave like real path',t=>{
  const folder=mkdtempSync(path.join(tmpdir(),'validate-report-link-'));
  const skillLink=path.join(folder,'agentic-code-review'), scriptLink=path.join(folder,'another-name.mjs');
  t.after(()=>{for(const link of [skillLink,scriptLink]) rmSync(link,{force:true}); rmSync(folder,{recursive:true,force:true});});
  symlinkSync(path.join(HERE,'..'),skillLink,'dir'); symlinkSync(SCRIPT,scriptLink,'file');
  const good=path.join(folder,'good.md'), bad=path.join(folder,'bad.md'); writeFileSync(good,GOOD); writeFileSync(bad,'not a review report\n');
  for(const script of [SCRIPT,path.join(skillLink,'scripts','validate-report.mjs'),scriptLink]){
    const no=spawnSync(process.execPath,[script,bad],{encoding:'utf8'}); assert.equal(no.status,1,`${script}: ${no.stdout}${no.stderr}`); assert.match(no.stdout,/^fail: /);
    const yes=spawnSync(process.execPath,[script,good],{encoding:'utf8'}); assert.equal(yes.status,0,`${script}: ${yes.stdout}${yes.stderr}`); assert.match(yes.stdout,/^ok: /);
    assert.equal(spawnSync(process.execPath,[script],{encoding:'utf8'}).status,2);
  }
});
test('accepts only the supported English report syntax',()=>{
  // Invalid English fixtures exercise each refusal without publishing another language's syntax.
  const invalid='Audit abcdef1 · Standard · round 1/2 · 0 Important · 0 Nits · 0 Pre-existing\n0 Important — nothing to fix\nPre-existing: none';
  refuse(invalid,/first line/);
  refuse(GOOD.replace('[Important]','[Major]'),/unknown label/);
  refuse(GOOD.replace(' — reproduce: npm test -- orders.discount (red)',' — rerun: npm test -- orders.discount (red)'),/reproduce/);
  refuse(CLEAN.replace('Pre-existing: none','Prior: none'),/missing/);
});
