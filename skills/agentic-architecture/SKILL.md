---
name: agentic-architecture
description: >-
  Usa-a quando alguém quiser melhorar a arquitetura de um projeto que já tem código, mesmo sem
  dizer «arquitetura»: «melhorar a arquitetura», «módulos rasos», «onde está o atrito do código»,
  «improve the codebase architecture», «find deepening opportunities». Lê o modelo de domínio,
  procura módulos rasos onde o código mais muda, com prova medida (git log, acoplamento, teste de
  apagar, ficheiro:linha), mostra os candidatos num relatório visual, faz o grill do candidato que
  o humano escolher, com a interface desenhada duas vezes, e entrega o desenho decidido à
  agentic-feature, que o executa. Traz o vocabulário partilhado de módulos, interfaces e costuras.
  Não serve para uma feature (agentic-feature) nem para uma correção (agentic-fix).
---

# agentic-architecture

Encontrar onde a arquitetura trava quem muda o código e propor **aprofundamentos**: refactors que
trocam módulos rasos por um módulo profundo, para o código ficar mais fácil de testar e de navegar
por agentes. Tu exploras, medes e propões; o humano escolhe o candidato e decide o desenho no
grill; a `agentic-feature` executa.

Os termos (módulo, interface, implementação, profundo e raso, costura, adaptador, alavancagem,
localidade, teste de apagar) têm o sentido de `references/vocabulario.md`: lê-o antes do passo 2
e usa-os tal e qual nos candidatos, no relatório, no grill e no pedido final. O glossário do
domínio dá os nomes dos módulos; o vocabulário dá os nomes da arquitetura.

As regras do repo ganham a esta skill: `AGENTS.md`/`CLAUDE.md`, as ADRs e o glossário.

`<skill>` é a pasta deste `SKILL.md`. As irmãs `agentic-feature`, `agentic-project`,
`agentic-design` e `agentic-implement`, aqui `<agentic-feature>`, `<agentic-project>`,
`<agentic-design>` e `<agentic-implement>`, são a primeira pasta com `SKILL.md` entre:
`$AGENTIC_FEATURE_DIR`, `$AGENTIC_PROJECT_DIR`, `$AGENTIC_DESIGN_DIR` ou `$AGENTIC_IMPLEMENT_DIR`,
se definida; `<skill>/../<nome>` (o caso normal: instalam-se juntas, também
no plugin); a pasta de skills do agente; o plugin `agentic-skills`. No plugin chamam-se
`agentic-skills:<nome>`; no Codex, `$<nome>`; sem a ferramenta Skill, lê o `SKILL.md` e segue-o.

## 1. O modelo de domínio

Lê, no repo do projeto, o que existir: o glossário (`GLOSSARIO.md`, `GLOSSARY.md` ou o que o
`AGENTS.md` nomear), as ADRs (`docs/adr/` ou equivalente), o `AGENTS.md`/`CLAUDE.md`, o
`ARCHITECTURE.md` e o mapa de áreas (`.agentic/areas.json`). As ADRs registam decisões que esta
skill não volta a discutir (passo 3, «Conflito com uma ADR»).

Feito quando tens a lista dos termos do domínio que vais usar e das ADRs que tocam as zonas a
explorar, ou escreveste «sem glossário» e «sem ADRs».

## 2. Candidatos com prova

**Onde procurar.** Aprofundar um módulo paga-se nas mudanças seguintes a ele, por isso o peso vai
para onde o código mais muda (YAGNI). Decide onde olhar antes de olhar:

- escolhe uma janela do histórico (`--since=<data>`) e declara-a: as contagens de «Medir», a
  ordem do passo 3 e o cabeçalho do relatório usam-na, também quando o humano deu uma direção;
- o humano deu uma direção (um módulo, uma área, uma dor): é essa, e saltas o ponto seguinte;
- senão, conta as mudanças por ficheiro nessa janela e começa pelos que mais aparecem:
  `git log --since=<data> --name-only --format= -- <pastas> | grep . | sort | uniq -c | sort -rn`.
  Com as mudanças espalhadas, sem pontos quentes, alarga a janela ou as pastas.

**Explorar.** Lança um subagente que percorre essas zonas (sem subagentes, fazes tu). Sem
heurísticas rígidas: anota onde há atrito.

- Perceber um conceito obriga a saltar entre muitos módulos pequenos?
- Onde há módulos rasos, com a interface quase tão complexa como a implementação?
- Onde se extraíram funções puras só para as testar, e os defeitos vivem na forma como são
  chamadas (sem localidade)?
- Onde módulos acoplados vazam pela costura?
- Que partes não têm testes, ou são difíceis de testar pela interface que têm?

**Medir.** Cada candidato leva a prova, medida e nunca estimada, com o comando que a produziu:

- **frequência de mudança**: os commits que tocaram os ficheiros dele, na janela declarada,
  contados por commit (somar a contagem por ficheiro conta duas vezes o commit que toca vários):
  `git log --since=<data> --format=%H -- <ficheiros do candidato> | wc -l`;
- **acoplamento**: os chamadores (`grep` dos imports: o total e cada `ficheiro:linha`), os sítios
  onde um chamador usa os internos dele (`ficheiro:linha`) e a mudança conjunta, ou seja, em
  quantos desses commits mudou cada ficheiro de fora do candidato:
  `git log --since=<data> --full-diff --name-only --format= -- <ficheiros do candidato> | grep . | sort | uniq -c | sort -rn`;
- **teste de apagar**: imagina-o apagado e diz para onde vai a complexidade, com o N contado: se
  desaparece, era passagem; se reaparece em N chamadores, merece o lugar. O sinal de um candidato é
  a complexidade que se concentra num sítio quando os módulos rasos se juntam, em vez de mudar de
  sítio;
- **interface**: o que quem chama tem de saber para o usar (entradas, ordem, erros,
  configuração), com `ficheiro:linha`.

Um número que não mediste não entra: o que ficou por medir diz-se no candidato. Classifica as
dependências de cada um pelas quatro categorias de `references/aprofundar.md`.

Feito quando cada candidato tem os ficheiros, o problema numa frase, a categoria das dependências
e a prova acima, com os comandos, os números e os `ficheiro:linha`.

## 3. Relatório visual

Escreve o relatório pelo `references/relatorio.md`: uma página HTML autónoma, uma secção por
candidato com o diagrama antes e depois, a prova do passo 2 e a força da recomendação, e no fim a
recomendação principal. É um ecrã que o humano lê: segue as regras de UI da `agentic-design`.
Ordena os candidatos pela força (forte, vale explorar, especulativo) e, dentro da mesma força,
pela frequência de mudança, da maior para a menor.

- **Com a ferramenta Artifact**: publica-o como página, pelo procedimento que a ferramenta manda
  para uma página nova (passa pela skill `artifact-design`); onde esse contrato e o
  `relatorio.md` diferem, ganha o contrato. Dá o link ao humano.
- **Sem ela**: grava o ficheiro fora do repo, na pasta temporária da sessão (o scratchpad, quando
  o agente o tem; senão `$TMPDIR`, ou `/tmp`), como `architecture-review-<data-hora>.html`, abre-o
  (`open` no macOS, `xdg-open` no Linux, `start` no Windows) e dá o caminho absoluto.

**Conflito com uma ADR.** Um candidato que contradiz uma ADR só entra se o atrito justifica
reabri-la, e a secção dele di-lo («contradiz a ADR-0007, mas vale reabrir porque…»). Os refactors
teóricos que uma ADR proíbe ficam de fora.

As interfaces ainda não se propõem: são do passo 5.

Feito quando o detetor da `agentic-design` saiu 0 sobre a página (`references/relatorio.md`,
«Estilo»), o relatório está publicado ou gravado, o humano tem o link ou o caminho, e cada
candidato tem a prova do passo 2.

## 4. A escolha do humano

Pergunta «Qual destes queres explorar?», com a recomendação principal à frente e o porquê numa
linha. A escolha é do humano; «escolhe tu» vale e leva a recomendação principal, registada como
delegada. Uma rejeição com uma razão de peso leva a oferta de ADR de `references/grill.md`
(«Pelo caminho»).

Feito quando o humano nomeou um candidato, delegou a escolha, ou disse que nenhum: neste caso
acabas aqui, com as ADRs que ele aceitou escritas.

## 5. Grill do candidato

Segue `references/grill.md`: uma pergunta de cada vez, cada uma com a tua recomendação, pela
árvore de decisões do candidato: restrições, dependências e a categoria delas, a forma do módulo
aprofundado, o que fica atrás da costura e que testes sobrevivem. Os factos procuras tu; as
decisões são do humano.

A interface desenha-se duas vezes, pelo `references/desenhar-duas-vezes.md`: o espaço do problema
mostrado ao humano, 3 ou mais desenhos radicalmente diferentes, a comparação por profundidade,
localidade e posição da costura, e a tua recomendação. A escolha volta ao grill como decisão.

A costura e os testes seguem `references/aprofundar.md`: a categoria das dependências diz como se
testa através da costura, um adaptador é uma costura hipotética e dois são uma costura real, e os
testes novos substituem os antigos em vez de se empilharem.

Feito quando estão decididos, cada um com a origem (humano ou delegada): a **interface**
(entradas, invariantes, ordem, erros, configuração), a **costura** (onde fica, os adaptadores e a
categoria das dependências) e os **testes** (os novos na interface e os antigos que se apagam); e
quando o humano confirmou o entendimento comum.

## 6. Execução pela agentic-feature

O refactor faz-se pela `agentic-feature`: invoca-a com a ferramenta Skill (no plugin,
`agentic-skills:agentic-feature`; no Codex, `$agentic-feature`) ou, sem ela, lê
`<agentic-feature>/SKILL.md` e segue-o. O pedido leva o desenho decidido, para o grill dela não o
voltar a abrir:

- o candidato e a prova (o link ou o caminho do relatório);
- a interface, a costura, os adaptadores e a categoria das dependências;
- o que a implementação esconde atrás da costura;
- os testes novos na interface e os antigos que se apagam;
- a tabela das decisões do passo 5, com a origem de cada uma, e as mudanças ao glossário e às
  ADRs.

A via, a spec, as faixas e a revisão são da `agentic-feature`. Se o humano disse que é só para
planear, o pedido di-lo: ela tem o modo «Só planear».

Feito quando a `agentic-feature` arrancou com o pedido ou, se o humano a deixou para depois,
quando lhe deste o pedido completo e a linha «Próximo passo: invoca a agentic-feature com este
pedido».

## Noutros agentes

Os passos são os mesmos; muda a ferramenta, e a troca diz-se numa linha:

- **Sem subagentes**: a exploração do passo 2 e os desenhos do passo 5 fazem-se em sequência.
- **Sem AskUserQuestion**: as perguntas vão no chat, uma de cada vez, no formato de
  `references/grill.md`.
- **Sem Artifact**: o relatório fica no ficheiro HTML do passo 3.
- **Com o plugin `mattpocock-skills`**: o `codebase-design` e o `grilling` são a fonte deste
  método, em inglês, e podem acompanhar; onde diferem (uma pergunta de cada vez, prova medida,
  execução pela `agentic-feature`), ganha esta skill.

Origem do método, o que mudou e a licença: `references/origem.md`.
