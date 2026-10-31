# Origem e atualização — agentic-explain

Skill própria deste repositório: o texto não vem de nenhum upstream e foi escrito em português, no
estilo das outras, a partir de um rascunho de skill; as duas etapas, as três perguntas de calibração e
os três perfis foram decididos ao reescrevê-la. Por isso não entra no `UPSTREAMS.json`.

## Ideias

- **Perfis.** O efeito de reversão da perícia: o que ajuda quem aprende pode prejudicar quem já domina,
  e a eficácia de uma instrução depende do conhecimento prévio de quem a lê
  ([DOI 10.1007/s10648-007-9054-3](https://doi.org/10.1007/s10648-007-9054-3); resumo lido a 2026-10-31,
  o artigo não). É evidência de ensino e não de leitura de código, por isso a skill não promete que
  três perguntas meçam bem a perícia: deixa trocar o perfil, e cada nó leva os dois textos.
- **Vistas 3D.** A prova a favor é fraca (CodeCity, ICSE 2011, 41 pessoas) e as fraquezas conhecidas são
  a oclusão e a navegação mais complexa (IVAPP 2014). Por isso há o Plano, o texto sempre ao lado e a
  versão em texto de cada vista.
- **Publicação.** O mesmo caminho do relatório da `agentic-architecture`: Artifact, ou um ficheiro na
  pasta temporária da sessão, com o detetor da `agentic-design` a sair 0.

## Bibliotecas

Carregadas do CDN na página, sem cópia no repo. Cada uma só carrega se a página tiver uma vista que a
usa:

| Biblioteca | Versão | Licença | Endereço | Quando carrega |
|---|---|---|---|---|
| `3d-force-graph` (vasturiano) | 1.80.1, de 2026-09-29 | MIT | `https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.1/dist/3d-force-graph.min.js` | com uma vista `grafo` |
| `three` (autores do three.js) | 0.186.1, de 2026-09-24 | MIT | `https://cdn.jsdelivr.net/npm/three@0.186.1/+esm`, e os addons em `…/three@0.186.1/examples/jsm/….js/+esm` | com qualquer outra vista, e com a cena |

Licenças e versões lidas no registo npm a 2026-10-31. Como o repo não guarda nenhuma cópia, não há
licença para acompanhar em `licenses/`; quem quiser as licenças encontra-as nos repositórios e nos pacotes
de cada biblioteca.

Porquê estas versões e estes endereços:

- O `3d-force-graph` vai pelo UMD, de uma peça só. Pelo `+esm` resolveria o three para a 0.187.0 e
  traria uma segunda cópia.
- O `three` vai pelo `+esm` com um import map: cerca de 192 KB com gzip. O
  `build/three.module.min.js` importa o `three.core.js` sem minificar e pesa 288 KB com gzip.
- A 0.187.0 do three, de 2026-10-30, era recente demais: o Artifact só aceita uma versão exata publicada há
  14 dias ou mais.
- O cdnjs não tem o `3d-force-graph` (404 a 2026-10-31).

## Como atualizar

1. Ler a versão e a data de publicação no registo npm. Só vale uma versão publicada há 14 dias ou mais,
   com o número exato no endereço.
2. Trocar o endereço no `assets/visualizador.html` e na lista aprovada do
   `scripts/gerar-pagina.test.mjs`, que recusa qualquer endereço fora dela. Os addons do three têm de
   vir da mesma versão do `three`.
3. Atualizar a tabela acima e correr `node --test skills/agentic-explain/scripts/*.test.mjs`.
4. Abrir os exemplos de `assets/exemplos/` num browser com WebGL: cada vista tem de desenhar, a consola
   fica sem erros e, em repouso, nada desenha.
5. Os exemplos de código (`codigo-b.json` e `codigo-c.json`) explicam esta skill e citam linhas dos ficheiros
   dela no commit `base` que trazem. Quando um ficheiro citado muda, confere as citações contra o ficheiro
   novo, corrige as linhas e os textos que deixarem de bater e põe no `base` o commit em que conferiste. O
   `scripts/gerar-pagina.test.mjs` só confere que os caminhos existem. O `geral-a.json` cita URLs, lidos a
   2026-10-31.
