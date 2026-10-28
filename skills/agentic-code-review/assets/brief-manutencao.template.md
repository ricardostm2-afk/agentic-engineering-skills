# Brief de auditoria de manutenção: <tema> · fase <1 caso | subdiretório | repo>

<!-- Modelo da agentic-code-review, modo manutenção (references/manutencao.md). Só existe com um
     pedido explícito do humano nesta conversa; cita-o em «Pedido». Preenche cada <...>, apaga o
     que não se aplica e este comentário. -->

## Pedido

<as palavras do humano, e quando o fez> · Âmbito: <caminho(s)> · Fase: <1 caso | subdiretório |
repo>, porque <a fase anterior correu assim, ou «1.ª fase»>.
Reparos das fases anteriores: <o que o humano corrigiu nas provas ou nas limpezas, ou «nenhum»>.

## Onde corres

No worktree `<wt>`, fora do repo, destacado em `<sha>`, que o orquestrador criou. Só leitura até
o humano aprovar uma limpeza; depois, um commit por limpeza nesse worktree (nunca no tronco).

## Regras

- Mantém o comportamento de produção, as salvaguardas operacionais e os killswitches.
- Ignora os fallbacks dos SDKs e os overrides locais.
- Não mexes em configuração viva nem em serviços (flags, consolas, bases de dados, filas): lês o
  que podes ler, e o resto vai em «Perguntas».
- Casos ambíguos (flag «Permanent», código para incidentes, nomes construídos em tempo de
  execução que não consegues seguir) não se decidem: vão em «Perguntas».
- Audita o âmbito todo, não só o que está etiquetado, e segue os chamadores indiretos (enums,
  constantes, wrappers, aliases, schemas, nomes construídos em tempo de execução, outros serviços).
- Proposta que acrescenta mais complexidade do que tira: marca-a e não a faças.

## Provas por candidato

Pelo menos duas fontes, cada uma com o comando ou o sítio de onde veio:
- histórico: `git log -S '<nome>'`, `git log --follow`, `git blame`, PRs ou commits sobrepostos;
- configuração viva (só leitura): <onde ver as flags, ou «sem acesso: pergunta»>;
- telemetria e perfis: <onde, ou «sem acesso: pergunta»>;
- chamadores indiretos: `git grep` dos nomes, das strings e das partes com que se constroem.

## Relatório

Primeira linha: `Auditoria <sha> · <tema> · fase <fase> · <c> candidatos · <a> ambíguos · <x> complexidade a mais`.

Depois, por frente (dono ou ficheiro), ordenado pelo benefício medido e pela idade:

`<ficheiro:linha> — <o que é> — produção: <valores> — provas: <fonte → resultado; …> — dono: <quem> — chamadores: <lista ou «nenhum, procurado com …»> — benefício: <medido> — idade: <data do último uso ou commit>`

No fim: «Perguntas» (os ambíguos e o que precisa de acesso), «Complexidade a mais» (uma linha
cada), «Não li» (o que ficou de fora e porquê).

## Depois da aprovação

Uma limpeza por commit, com a mensagem a dizer o quê, porquê e as provas (copiadas do relatório),
e os testes da área verdes antes e depois. Cada commit passa pela revisão da agentic-code-review
no nível que o diff der.
