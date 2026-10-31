#!/usr/bin/env node
// Valida os dados de uma explicação (e a cena, se houver) e escreve a página a partir de assets/visualizador.html.
//
// Uso:   node gerar-pagina.mjs <dados.json> [--cena <cena.js>] --saida <pagina.html>
// Saída: 0 escreveu a página;
//        1 dados ou cena inválidos: uma linha por regra violada («campo: o que falha»; para a cena,
//          «cena:<linha>: o que falha»), em stderr, e nada é escrito;
//        2 erro de uso ou de leitura (argumentos, ficheiros, JSON inválido, modelo, escrita).
// O esquema 2 e as regras estão em references/dados.md, e a cena em references/cena.md.
// Também exporta `validar` (os dados, mais a conferência com a cena), `validarCena` (as regras estáticas
// do código da cena) e `gerarPagina`.

import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MODELO = path.join(AQUI, "..", "assets", "visualizador.html");

const TEMAS = ["codigo", "geral"];
const PERFIS = ["A", "B", "C"];
const GRANULARIDADES = ["blocos", "componentes", "detalhe"];
const OBJETIVOS = ["perceber", "resolver", "mudar"];
const VISTAS = ["grafo", "camadas", "sequencia", "estados", "linha-do-tempo", "cena"];
const RISCOS = ["baixo", "medio", "alto"];
const MODOS = ["sincrona", "assincrona"];

// `caminho:N` ou `caminho:N-M` (N e M de 1 em diante). O caminho não leva espaços e pode levar «:», mas é relativo à
// raiz do que se leu: não começa por um esquema («javascript:», «data:», «C:»), por «/», «\» ou «~», e não tem um segmento «..».
const CITACAO = /^(\S+):([1-9]\d*)(?:-([1-9]\d*))?$/;
const FORMA_CITACAO = "tem de ter a forma caminho:N ou caminho:N-M, com M a partir de N, com o caminho relativo à raiz (sem esquema, sem / no início, sem ..)";
const caminhoRelativo = (c) => !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(c) && !/^[\\/~]/.test(c) && !c.split(/[\\/]/).includes("..");
const ehUrl = (v) => typeof v === "string" && /^https?:\/\//i.test(v);

// Padrões óbvios de chave. Pedem o feitio de uma chave e não só o prefixo, para «risk-based» ou «task-queue» passarem.
const SEGREDOS = [
  /\bsk-[A-Za-z0-9_-]{10,}/,
  /\bghp_[A-Za-z0-9]{10,}/,
  /\bgithub_pat_[A-Za-z0-9_]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\bAIza[0-9A-Za-z_-]{30,}/,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./,
];
// Nenhuma linha de saída repete um valor suspeito: o que casa com um padrão sai como «[oculto]».
const oculta = (texto) => SEGREDOS.reduce((t, re) => t.replace(new RegExp(re.source, "g"), "[oculto]"), texto);
// Um valor dos dados dentro de uma mensagem: entre aspas, sem segredos e cortado aos 40 caracteres.
const eco = (v) => {
  const t = oculta(typeof v === "string" ? v : (JSON.stringify(v) ?? ""));
  return `"${t.length > 40 ? `${t.slice(0, 40)}…` : t}"`;
};

const ehObjeto = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const ehTexto = (v) => typeof v === "string";
const vazio = (v) => !ehTexto(v) || v.trim() === "";
const lista = (valores) => (valores.length === 2 ? valores.join(" ou ") : `${valores.slice(0, -1).join(", ")} ou ${valores.at(-1)}`);
const dataValida = (v) => {
  if (!ehTexto(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

// Devolve as linhas «campo: o que falha», uma por regra violada; vazio quando os dados passam.
// `cena` é o texto do ficheiro dado a --cena, ou null/undefined quando não houve: uma vista cena obriga a ela
// e ela obriga a uma vista cena. As regras do código da cena são de `validarCena`.
export function validar(dados, cena = null) {
  const erros = [];
  const falha = (campo, msg) => erros.push(oculta(`${campo}: ${msg}`));
  if (!ehObjeto(dados)) return ["dados: tem de ser um objeto JSON"];

  if (dados.versao !== 2) falha("versao", "tem de ser 2");
  if (!TEMAS.includes(dados.tema)) falha("tema", `tem de ser ${lista(TEMAS)}`);
  const perfilOk = PERFIS.includes(dados.perfil);
  if (!perfilOk) falha("perfil", `tem de ser ${lista(PERFIS)}`);
  if (!GRANULARIDADES.includes(dados.granularidade)) falha("granularidade", `tem de ser ${lista(GRANULARIDADES)}`);
  if (!OBJETIVOS.includes(dados.objetivo)) falha("objetivo", `tem de ser ${lista(OBJETIVOS)}`);
  const perfilC = perfilOk && dados.perfil === "C";

  if (vazio(dados.titulo)) falha("titulo", "tem de ser texto, de 2 a 4 palavras");
  else {
    const palavras = dados.titulo.trim().split(/\s+/).length;
    if (palavras < 2 || palavras > 4) falha("titulo", `tem de ter de 2 a 4 palavras (tem ${palavras}); a frase longa vai em pergunta`);
  }
  if (vazio(dados.pergunta)) falha("pergunta", "tem de ser texto, não vazio");
  if (dados.tema === "codigo") for (const campo of ["area", "base"]) if (vazio(dados[campo])) falha(campo, "tem de ser texto, não vazio (tema codigo)");

  const textos = (campo, o) => {
    if (!ehObjeto(o)) return falha(campo, "tem de ser um objeto com simples e tecnico");
    for (const k of ["simples", "tecnico"]) if (vazio(o[k])) falha(`${campo}.${k}`, "tem de ser texto, não vazio");
  };
  textos("intro", dados.intro);

  // fontes
  const urls = new Set();
  if ("fontes" in dados && !Array.isArray(dados.fontes)) falha("fontes", "tem de ser uma lista de fontes, com url, titulo e lido_em");
  else if (dados.tema === "geral" && !(dados.fontes?.length > 0)) falha("fontes", "tem de ter pelo menos uma fonte (tema geral)");
  if (Array.isArray(dados.fontes)) {
    dados.fontes.forEach((f, i) => {
      if (!ehObjeto(f)) return falha(`fontes[${i}]`, "tem de ser um objeto com url, titulo e lido_em");
      let https = false;
      try { https = ehUrl(f.url) && new URL(f.url).protocol === "https:"; } catch { /* não é um endereço */ }
      if (!https) falha(`fontes[${i}].url`, "tem de ser um endereço https://");
      else urls.add(f.url);
      if (vazio(f.titulo)) falha(`fontes[${i}].titulo`, "tem de ser texto, não vazio");
      if (!dataValida(f.lido_em)) falha(`fontes[${i}].lido_em`, "tem de ser uma data AAAA-MM-DD");
    });
  }

  // tipos
  const tipos = new Set();
  if (!Array.isArray(dados.tipos)) falha("tipos", "tem de ser uma lista de 1 a 6 tipos");
  else {
    if (dados.tipos.length < 1 || dados.tipos.length > 6) falha("tipos", `tem de ter de 1 a 6 tipos (tem ${dados.tipos.length})`);
    dados.tipos.forEach((t, i) => {
      if (!ehObjeto(t) || vazio(t.id)) return falha(`tipos[${i}].id`, "tem de ser texto, não vazio");
      if (tipos.has(t.id)) falha(`tipos[${i}].id`, `${eco(t.id)} repetido`);
      tipos.add(t.id);
      if (vazio(t.nome)) falha(`tipos[${i}].nome`, "tem de ser texto, não vazio");
    });
  }

  // Os ids de nos, de vistas e de mensagens vivem no mesmo espaço: nenhum se repete entre si.
  const usados = new Map();
  const registaId = (campo, id) => {
    if (usados.has(id)) falha(campo, `${eco(id)} repetido (já é o id de ${usados.get(id)})`);
    else usados.set(id, campo);
  };

  // citações: `caminho:N` ou `caminho:N-M`. Um URL (http ou https) nunca é caminho.
  function citacao(campo, v) {
    const m = !ehUrl(v) && typeof v === "string" ? CITACAO.exec(v) : null;
    if (!m || !caminhoRelativo(m[1]) || (m[3] !== undefined && Number(m[3]) < Number(m[2]))) { falha(campo, FORMA_CITACAO); return false; }
    return true;
  }
  const citacoes = (campo, v) => {
    if (!Array.isArray(v)) return falha(campo, "tem de ser uma lista de caminho:N ou caminho:N-M");
    v.forEach((c, i) => citacao(`${campo}[${i}]`, c));
  };

  // nós
  const ids = new Set();
  if (!Array.isArray(dados.nos)) falha("nos", "tem de ser uma lista de 1 a 60 nós");
  else {
    const n = dados.nos.length;
    if (n < 1 || n > 60) falha("nos", `tem de ter de 1 a 60 nós (tem ${n}); acima disso, agrupa por pasta ou módulo`);
    else if (dados.granularidade === "blocos" && (n < 5 || n > 8)) falha("nos", `com granularidade blocos, são de 5 a 8 nós (tem ${n})`);
    dados.nos.forEach((no, i) => {
      if (!ehObjeto(no)) return falha(`nos[${i}]`, "tem de ser um objeto");
      if (vazio(no.id)) falha(`nos[${i}].id`, "tem de ser texto, não vazio");
      else {
        registaId(`nos[${i}].id`, no.id);
        ids.add(no.id);
      }
      if (vazio(no.curto)) falha(`nos[${i}].curto`, "tem de ser texto, não vazio");
      if (vazio(no.tipo) || !tipos.has(no.tipo)) falha(`nos[${i}].tipo`, `${eco(no.tipo ?? "")} não existe em tipos`);
      textos(`nos[${i}]`, no);
      if ("ficheiros" in no) citacoes(`nos[${i}].ficheiros`, no.ficheiros);
      if ("risco" in no) {
        if (perfilOk && !perfilC) falha(`nos[${i}].risco`, "só existe com perfil C");
        else if (!RISCOS.includes(no.risco)) falha(`nos[${i}].risco`, `tem de ser ${lista(RISCOS)}`);
      }
    });
  }

  // Uma lista de ids de nós; devolve os que existem em nos.
  function idsDeNos(campo, v, { minimo = 0, maximo = Infinity, nome = "nós" } = {}) {
    if (!Array.isArray(v)) { falha(campo, `tem de ser uma lista de ids de nós`); return []; }
    if (v.length < minimo || v.length > maximo) {
      falha(campo, minimo > 0 && maximo === Infinity ? `tem de ter pelo menos um nó` : `tem de ter de ${minimo} a ${maximo} ${nome} (tem ${v.length})`);
    }
    return v.filter((id, j) => ids.has(id) || (falha(`${campo}[${j}]`, `${eco(id)} não existe em nos`), false));
  }

  // Uma ligação de um grafo ou de camadas: `de` e `para` diferentes e dentro da vista.
  function ligacoes(campo, v, naVista) {
    if (v === undefined) return;
    if (!Array.isArray(v)) return falha(campo, "tem de ser uma lista");
    v.forEach((l, i) => {
      const c = `${campo}[${i}]`;
      if (!ehObjeto(l)) return falha(c, "tem de ser um objeto");
      for (const k of ["de", "para"]) {
        if (!ids.has(l[k])) falha(`${c}.${k}`, `${eco(l[k] ?? "")} não existe em nos`);
        else if (!naVista.has(l[k])) falha(`${c}.${k}`, `${eco(l[k])} está fora desta vista`);
      }
      if (ids.has(l.de) && l.de === l.para) falha(`${c}.para`, "tem de ser diferente de de");
      if (vazio(l.tipo)) falha(`${c}.tipo`, "tem de ser texto, não vazio (o verbo da ligação)");
      if ("ref" in l) citacao(`${c}.ref`, l.ref);
      modo(c, l);
    });
  }
  function modo(campo, o) {
    if (!("modo" in o)) return;
    if (perfilOk && !perfilC) falha(`${campo}.modo`, "só existe com perfil C");
    else if (!MODOS.includes(o.modo)) falha(`${campo}.modo`, `tem de ser ${lista(MODOS)}`);
  }
  const intervalo = (campo, n, minimo, maximo, nome) => {
    if (n < minimo || n > maximo) falha(campo, `tem de ter de ${minimo} a ${maximo} ${nome} (tem ${n})`);
  };

  // vistas: cada uma devolve os ids que um passo pode realçar nela (nós e mensagens).
  const vistas = new Map();
  const cenas = [];
  if (!Array.isArray(dados.vistas)) falha("vistas", "tem de ser uma lista de 1 a 4 vistas");
  else {
    intervalo("vistas", dados.vistas.length, 1, 4, "vistas");
    dados.vistas.forEach((v, i) => {
      const c = `vistas[${i}]`;
      if (!ehObjeto(v)) return falha(c, "tem de ser um objeto");
      if (vazio(v.id)) falha(`${c}.id`, "tem de ser texto, não vazio");
      else registaId(`${c}.id`, v.id);
      if (vazio(v.titulo)) falha(`${c}.titulo`, "tem de ser texto, não vazio");
      if (!VISTAS.includes(v.tipo)) return falha(`${c}.tipo`, `tem de ser ${lista(VISTAS)}`);
      const realcaveis = new Set();
      if (v.tipo === "grafo") {
        const nos = "nos" in v ? idsDeNos(`${c}.nos`, v.nos, { minimo: 1 }) : [...ids];
        nos.forEach((id) => realcaveis.add(id));
        ligacoes(`${c}.ligacoes`, v.ligacoes, realcaveis);
      } else if (v.tipo === "camadas") {
        if (!Array.isArray(v.camadas)) falha(`${c}.camadas`, "tem de ser uma lista de 2 a 6 camadas");
        else {
          intervalo(`${c}.camadas`, v.camadas.length, 2, 6, "camadas");
          const dona = new Map();
          v.camadas.forEach((cam, j) => {
            if (!ehObjeto(cam)) return falha(`${c}.camadas[${j}]`, "tem de ser um objeto com nome e nos");
            if (vazio(cam.nome)) falha(`${c}.camadas[${j}].nome`, "tem de ser texto, não vazio");
            idsDeNos(`${c}.camadas[${j}].nos`, cam.nos, { minimo: 1 });
            (Array.isArray(cam.nos) ? cam.nos : []).forEach((id, k) => {
              if (!ids.has(id)) return;
              if (dona.has(id)) falha(`${c}.camadas[${j}].nos[${k}]`, `${eco(id)} já está numa camada (camadas[${dona.get(id)}])`);
              else dona.set(id, j);
              realcaveis.add(id);
            });
          });
        }
        ligacoes(`${c}.ligacoes`, v.ligacoes, realcaveis);
      } else if (v.tipo === "sequencia") {
        const participantes = idsDeNos(`${c}.participantes`, v.participantes, { minimo: 2, maximo: 8, nome: "participantes" });
        const quem = new Set(participantes);
        participantes.forEach((id) => realcaveis.add(id));
        if (!Array.isArray(v.mensagens)) falha(`${c}.mensagens`, "tem de ser uma lista de 1 a 30 mensagens");
        else {
          intervalo(`${c}.mensagens`, v.mensagens.length, 1, 30, "mensagens");
          v.mensagens.forEach((m, j) => {
            const mc = `${c}.mensagens[${j}]`;
            if (!ehObjeto(m)) return falha(mc, "tem de ser um objeto");
            if (vazio(m.id)) falha(`${mc}.id`, "tem de ser texto, não vazio");
            else { registaId(`${mc}.id`, m.id); realcaveis.add(m.id); }
            for (const k of ["de", "para"]) if (!quem.has(m[k])) falha(`${mc}.${k}`, `${eco(m[k] ?? "")} não é participante desta vista`);
            if (vazio(m.texto)) falha(`${mc}.texto`, "tem de ser texto, não vazio");
            modo(mc, m);
          });
        }
      } else if (v.tipo === "estados") {
        const estados = idsDeNos(`${c}.estados`, v.estados, { minimo: 2, maximo: 16, nome: "estados" });
        const sao = new Set(estados);
        estados.forEach((id) => realcaveis.add(id));
        if (!sao.has(v.inicial)) falha(`${c}.inicial`, "tem de ser um dos estados");
        if (!Array.isArray(v.transicoes)) falha(`${c}.transicoes`, "tem de ser uma lista");
        else {
          v.transicoes.forEach((t, j) => {
            const tc = `${c}.transicoes[${j}]`;
            if (!ehObjeto(t)) return falha(tc, "tem de ser um objeto");
            for (const k of ["de", "para"]) if (!sao.has(t[k])) falha(`${tc}.${k}`, `${eco(t[k] ?? "")} não é um dos estados`);
            if (vazio(t.evento)) falha(`${tc}.evento`, "tem de ser texto, não vazio");
          });
        }
      } else if (v.tipo === "linha-do-tempo") {
        if (!Array.isArray(v.eventos)) falha(`${c}.eventos`, "tem de ser uma lista de 2 a 30 eventos");
        else {
          intervalo(`${c}.eventos`, v.eventos.length, 2, 30, "eventos");
          v.eventos.forEach((e, j) => {
            const ec = `${c}.eventos[${j}]`;
            if (!ehObjeto(e)) return falha(ec, "tem de ser um objeto");
            if (!ids.has(e.no)) falha(`${ec}.no`, `${eco(e.no ?? "")} não existe em nos`);
            else realcaveis.add(e.no);
            if (vazio(e.quando)) falha(`${ec}.quando`, "tem de ser texto, não vazio");
          });
        }
      } else {
        idsDeNos(`${c}.nos`, v.nos, { minimo: 1, maximo: 40 }).forEach((id) => realcaveis.add(id));
        if (cenas.length > 0) falha(c, `no máximo uma vista cena (já há outra em vistas[${cenas[0]}])`);
        cenas.push(i);
        if (cena == null) falha(c, "a vista cena obriga a --cena <cena.js>");
      }
      if (ehTexto(v.id) && !vazio(v.id)) vistas.set(v.id, realcaveis);
    });
  }
  if (cena != null && cenas.length === 0 && Array.isArray(dados.vistas)) falha("cena", "foi dado um ficheiro de cena (--cena) e nenhuma vista tem tipo cena");

  // passos
  if (!Array.isArray(dados.passos)) falha("passos", "tem de ser uma lista de 1 a 12 passos");
  else {
    intervalo("passos", dados.passos.length, 1, 12, "passos");
    dados.passos.forEach((p, i) => {
      const c = `passos[${i}]`;
      if (!ehObjeto(p)) return falha(c, "tem de ser um objeto");
      if (vazio(p.titulo)) falha(`${c}.titulo`, "tem de ser texto, não vazio");
      const daVista = vistas.get(p.vista);
      if (!daVista) falha(`${c}.vista`, `${eco(p.vista ?? "")} não existe em vistas`);
      if (!Array.isArray(p.realca)) falha(`${c}.realca`, "tem de ser uma lista de ids da vista (nós ou mensagens)");
      else if (daVista) p.realca.forEach((id, j) => { if (!daVista.has(id)) falha(`${c}.realca[${j}]`, `${eco(id ?? "")} não é um elemento da vista ${eco(p.vista)}`); });
      if (!Array.isArray(p.citacoes)) falha(`${c}.citacoes`, "tem de ser uma lista de caminho:N, caminho:N-M ou URL de fontes");
      else if (p.citacoes.length === 0) falha(`${c}.citacoes`, "tem de ter pelo menos uma citação");
      else {
        let caminhos = 0;
        p.citacoes.forEach((cit, j) => {
          if (ehUrl(cit)) { if (!urls.has(cit)) falha(`${c}.citacoes[${j}]`, "o URL não existe em fontes"); }
          else if (citacao(`${c}.citacoes[${j}]`, cit)) caminhos++;
        });
        if (dados.tema === "codigo" && caminhos === 0) falha(`${c}.citacoes`, "com tema codigo, cada passo cita pelo menos um caminho:N");
      }
      textos(c, p);
    });
  }

  // conceitos
  if ("conceitos" in dados) {
    if (!Array.isArray(dados.conceitos)) falha("conceitos", "tem de ser uma lista de 0 a 6 conceitos");
    else {
      intervalo("conceitos", dados.conceitos.length, 0, 6, "conceitos");
      dados.conceitos.forEach((c, i) => {
        if (!ehObjeto(c)) return falha(`conceitos[${i}]`, "tem de ser um objeto");
        if (vazio(c.termo)) falha(`conceitos[${i}].termo`, "tem de ser texto, não vazio");
        textos(`conceitos[${i}]`, c);
      });
    }
  }

  // Sem segredos: nenhum texto nem nome de campo leva um padrão óbvio de chave. A linha diz onde, e nunca repete o valor:
  // uma chave suspeita dá um só achado, no objeto que a tem, e o varrimento não desce por ela (o caminho levaria a chave).
  const pareceSegredo = (t) => SEGREDOS.some((re) => re.test(t));
  const procura = (v, campo) => {
    if (typeof v === "string") {
      if (pareceSegredo(v)) falha(campo, "parece conter uma chave ou um segredo; os dados levam só nomes de ficheiros, peças e explicações");
    } else if (Array.isArray(v)) v.forEach((x, i) => procura(x, `${campo}[${i}]`));
    else if (ehObjeto(v)) {
      const entradas = Object.entries(v);
      if (entradas.some(([k]) => pareceSegredo(k))) falha(campo || "dados", "um nome de campo parece uma chave ou um segredo");
      for (const [k, x] of entradas) if (!pareceSegredo(k)) procura(x, campo ? `${campo}.${k}` : k);
    }
  };
  procura(dados, "");

  return erros;
}

// As regras estáticas da cena (references/cena.md): devolve as linhas «cena:<linha>: o que falha».
// Valem para o texto todo, comentários e cadeias incluídos, e nenhuma linha repete o que foi achado. Correm sobre o
// texto inteiro e não linha a linha: um achado partido entre linhas (`window` e `.open` em linhas diferentes) conta
// na linha onde começa, e há um por regra e por linha.
const TETO_CENA = 40 * 1024;
const SEM_REDE = "sem rede, sem armazenamento, sem HTML nem ciclo de desenho próprio";
const SEM_JANELA = "a cena só usa o que ctx lhe dá: sem janela, sem documento, sem objeto global";
const PROIBIDAS = [
  ["import", "import"], ["export", "export"], ["require", "require"], ["fetch", "fetch"],
  ["XMLHttpRequest", "XMLHttpRequest"], ["WebSocket", "WebSocket"], ["EventSource", "EventSource"],
  ["eval", "eval"], ["Function(", "Function\\s*\\("], ["setInterval", "setInterval"],
  ["requestAnimationFrame", "requestAnimationFrame"], ["localStorage", "localStorage"],
  ["sessionStorage", "sessionStorage"], ["indexedDB", "indexedDB"], ["cookie", "cookie"],
  ["innerHTML", "innerHTML"], ["outerHTML", "outerHTML"], ["insertAdjacentHTML", "insertAdjacentHTML"],
  ["document.write", "document\\s*\\.\\s*write"], ["window.open", "window\\s*\\.\\s*open"],
  ["location", "location"], ["navigator", "navigator"], ["postMessage", "postMessage"], ["Worker", "Worker"],
].map(([nome, padrao]) => [nome, padrao, SEM_REDE]).concat(
  ["window", "document", "globalThis", "self", "constructor", "Reflect", "opener", "frames"].map((nome) => [nome, nome, SEM_JANELA]),
).map(([nome, padrao, motivo]) => {
  // Fronteira de identificador à esquerda; à direita só quando o padrão acaba numa palavra completa.
  const direita = /[()]$|write$|open$/.test(padrao) ? "" : "(?![\\w$])";
  return [`«${nome}» não é permitido na cena (${motivo})`, new RegExp(`(?<![\\w$])${padrao}${direita}`, "g")];
});
const OUTRAS = [
  ["«</script» fecharia o bloco da página", /<\/script/ig],
  ["«<!--» não é permitido na cena", /<!--/g],
  ["endereços http:// e https:// não são permitidos: a cena não vai à rede", /https?:\/\//ig],
  ["cor literal: as cores vêm de ctx.cores", /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_])|(?<![\w$])0[xX][0-9a-fA-F]{6}(?![0-9a-zA-Z_])|(?<![\w$])(?:rgba?|hsla?)\s*\(/g],
  // Um escape escreveria uma palavra proibida sem ela aparecer no texto («\u0066etch»).
  ["a sequência de escape «\\u» não é permitida na cena (esconderia uma palavra proibida)", /\\u/g],
  ["a sequência de escape «\\x» não é permitida na cena (esconderia uma palavra proibida)", /\\x/g],
];

export function validarCena(codigo) {
  if (typeof codigo !== "string") return ["cena:1: tem de ser o texto do ficheiro da cena"];
  const erros = [];
  const falha = (linha, msg) => erros.push(`cena:${linha}: ${msg}`);
  const bytes = Buffer.byteLength(codigo, "utf8");
  if (bytes > TETO_CENA) falha(1, `tem ${Math.ceil(bytes / 1024)} KB; o máximo é 40 KB`);

  const declaracoes = [];
  codigo.split("\n").forEach((texto, i) => {
    for (const _ of texto.matchAll(/(?<![\w$])function\s+cena\s*\(/g)) declaracoes.push(i + 1);
  });

  // A linha de um índice do texto: 1 mais as quebras de linha antes dele.
  const quebras = [];
  for (let i = codigo.indexOf("\n"); i !== -1; i = codigo.indexOf("\n", i + 1)) quebras.push(i);
  const linhaDe = (indice) => {
    let a = 0;
    let b = quebras.length;
    while (a < b) { const meio = (a + b) >> 1; if (quebras[meio] < indice) a = meio + 1; else b = meio; }
    return a + 1;
  };
  for (const [msg, re] of [...PROIBIDAS, ...OUTRAS]) {
    const linhasDaRegra = new Set();
    for (const m of codigo.matchAll(re)) linhasDaRegra.add(linhaDe(m.index));
    for (const linha of linhasDaRegra) falha(linha, msg);
  }
  if (declaracoes.length === 0) falha(1, "falta a declaração function cena(ctx)");
  else if (declaracoes.length > 1) falha(declaracoes[1], `function cena( declarada mais de uma vez (a primeira está na linha ${declaracoes[0]})`);
  return erros.sort((a, b) => Number(/^cena:(\d+)/.exec(a)[1]) - Number(/^cena:(\d+)/.exec(b)[1]));
}

const escapaTitulo = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const BLOCO_DADOS = /(<script type="application\/json" id="dados">)[\s\S]*?(<\/script>)/g;
const BLOCO_CENA = /(<script\b[^>]*\bid="cena-codigo"[^>]*>)[\s\S]*?(<\/script>)/g;

function lerModelo() {
  try { return readFileSync(MODELO, "utf8"); } catch (e) { throw new Error(`não consegui ler o modelo ${MODELO}: ${e.message}`); }
}

// A página: o modelo com o bloco de dados, o <title> e, se houver cena, o código dela. O `<` do JSON sai com escape
// unicode, para um </script> num texto não fechar o bloco; os substitutos são funções, para um «$&» nos dados ou
// na cena não ser lido como padrão. A cena, já validada, não leva </script nem <!--. O código da cena entra dentro
// de uma função estrita chamada sem this: o topo do ficheiro não cria globais nem vê a janela no this.
export function gerarPagina(dados, { cena = null, modelo = lerModelo() } = {}) {
  const json = JSON.stringify(dados).replaceAll("<", "\\u003c");
  if ([...modelo.matchAll(BLOCO_DADOS)].length !== 1) throw new Error("o modelo tem de ter um só bloco <script type=\"application/json\" id=\"dados\">");
  if (!modelo.includes("<title>{{titulo}}</title>")) throw new Error("o modelo não tem o marcador <title>{{titulo}}</title>");
  if (cena != null && [...modelo.matchAll(BLOCO_CENA)].length !== 1) throw new Error("o modelo não tem lugar para a cena (um só <script id=\"cena-codigo\"></script>)");
  let pagina = modelo
    .replace(BLOCO_DADOS, (_, abre, fecha) => `${abre}${json}${fecha}`)
    .replace("<title>{{titulo}}</title>", () => `<title>${escapaTitulo(dados.titulo.trim().replace(/\s+/g, " "))}</title>`);
  if (cena != null) pagina = pagina.replace(BLOCO_CENA, (_, abre, fecha) => `${abre}window.explainCena = (function () {\n"use strict";\n${cena}\nreturn cena;\n}).call(undefined);${fecha}`);
  return pagina;
}

const USO = "uso: node gerar-pagina.mjs <dados.json> [--cena <cena.js>] --saida <pagina.html>";

export function principal(argv, { err = (l) => process.stderr.write(`${l}\n`) } = {}) {
  let entrada = null;
  let saida = null;
  let ficheiroCena = null;
  const valor = (i, nome) => {
    if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) { err(`gerar-pagina: ${nome} precisa de um caminho\n${USO}`); return null; }
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--saida" || a === "--cena") {
      const v = valor(i, a);
      if (v === null) return 2;
      if (a === "--saida") saida = v;
      else if (ficheiroCena !== null) { err(`gerar-pagina: uma só cena (recebi --cena duas vezes)\n${USO}`); return 2; }
      else ficheiroCena = v;
      i++;
    } else if (a.startsWith("--")) { err(`gerar-pagina: opção desconhecida ${a}\n${USO}`); return 2; }
    else if (entrada === null) entrada = a;
    else { err(`gerar-pagina: um só ficheiro de dados (recebi também ${a})\n${USO}`); return 2; }
  }
  if (entrada === null || saida === null) { err(USO); return 2; }

  const ler = (f) => { if (!statSync(f).isFile()) throw new Error("não é um ficheiro"); return readFileSync(f, "utf8"); };
  let texto;
  try { texto = ler(entrada); } catch (e) { err(`gerar-pagina: não consegui ler ${entrada}: ${e.message}`); return 2; }
  // O erro do JSON.parse cita um bocado do ficheiro: não se repete, para os dados não irem parar a um registo.
  let dados;
  try { dados = JSON.parse(texto); } catch { err(`gerar-pagina: ${entrada} não é JSON válido`); return 2; }
  let cena = null;
  if (ficheiroCena !== null) {
    try { cena = ler(ficheiroCena); } catch (e) { err(`gerar-pagina: não consegui ler ${ficheiroCena}: ${e.message}`); return 2; }
  }

  const problemas = [...validar(dados, cena), ...(cena === null ? [] : validarCena(cena))];
  if (problemas.length > 0) { problemas.forEach((p) => err(p)); return 1; }

  let html;
  try { html = gerarPagina(dados, { cena }); } catch (e) { err(`gerar-pagina: ${e.message}`); return 2; }
  try {
    mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
    writeFileSync(saida, html);
  } catch (e) { err(`gerar-pagina: não consegui escrever ${saida}: ${e.message}`); return 2; }
  return 0;
}

// Corre só como programa, também quando chamado por uma ligação simbólica (o `install.sh --ligar`): o Node
// resolve a ligação em `import.meta.url` mas não em `process.argv[1]`.
const comoPrograma = () => {
  try { return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; }
};
if (process.argv[1] && comoPrograma()) process.exitCode = principal(process.argv.slice(2));
