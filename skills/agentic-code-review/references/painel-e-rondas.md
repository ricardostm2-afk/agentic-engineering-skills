# Painel, consolidação e rondas (passos 0, 2–6)

Método adaptado de https://claude.dev/blog/solving-code-review-at-anthropic/: vários revisores
em paralelo, achados confirmados antes de chegarem ao autor, etiquetas por gravidade, rondas com
limite. Adaptado a trabalho no tronco sem PRs e a um orquestrador (tu) que lança os revisores.

## §1 Ponto fixo

- **Base** e **SHA revisto** (a ponta que se revê). A revisão vale só para esse SHA.
- O diff: `git diff <base>...<sha-revisto>`; os commits: `git log --oneline <base>..<sha-revisto>`.
- A intenção: spec, pedido, descrição do PR ou mensagens dos commits, e o plano se houver.
- A pesquisa aprovada, se o projeto a tem: a lente normas confere contra ela as dependências e
  os padrões novos.
- Os achados já fechados (das rondas anteriores), com a resposta de cada um.
- Com UI, o caminho de `<agentic-design>` (o detetor e `<agentic-design>/references/ui-sem-slop.md`),
  a variante escolhida e as capturas.

## §2 Worktree do revisor

- Crias tu, **fora do repo**, um por revisor, destacado no SHA revisto:
  `git worktree add --detach "<tmp>/revisao-<tema>-<lente>" <sha-revisto>`. `<tmp>` é, por ordem:
  a pasta que as regras do projeto ou do utilizador dão para temporários; o scratchpad da sessão,
  quando o agente tem um; só sem nenhum dos dois, `${TMPDIR:-/tmp}`. No macOS o `$TMPDIR` é
  `/var/folders/…`, que costuma ficar fora das pastas autorizadas e faz pedir aprovação a cada
  escrita. O brief leva o caminho do worktree e o da pasta do teste de aceitação
  (`<tmp>/aceitacao-<tema>/`). Nunca a árvore da sessão, também para um revisor Codex ou de outro
  agente.
- O revisor corre tudo lá (`git -C <wt> …`) e não deixa commits, ficheiros nem outras mutações.
- `<base>` é `git merge-base <tronco> <sha-revisto>` (o tronco remoto, por exemplo `origin/main`),
  recalculado em cada ronda; num ramo que parte de outro ainda por integrar, o merge-base com esse,
  que se revê à parte.
- Um comando que só revê o que está por commitar corre depois de `git -C <wt> reset --soft <base>`
  (o diff `<base>..<sha-revisto>` fica por commitar) e, antes de conferir,
  `git -C <wt> reset --soft <sha-revisto>` repõe o HEAD.
- O `/security-review` do Claude Code **não é desses**: revê `git diff origin/HEAD...` da pasta onde
  corre, que depois desse reset sai vazio (a lente dava «0 Importantes» sem ter visto nada). Corre
  no `<wt>`, no SHA revisto e sem reset, e só conta como lente de segurança se
  `git -C <wt> merge-base origin/HEAD <sha-revisto>` dá `<base>`; senão (ramo sobre outro ramo,
  `origin/HEAD` noutro sítio), a lente de segurança é um subagente com o brief.
- Um worktree acabado de criar não tem as dependências instaladas: o revisor não as instala na
  árvore do repo; sem forma de correr o teste, a prova é «como se reproduz» (o comando e o que se
  espera ver), dito como não corrido.
- No fim: `git worktree list`, `git -C <wt> status --short` vazio (prova de que nada mudou) e
  `git worktree remove <wt>`. Um worktree sujo diz-se no relatório antes de o removeres.

## §3 Lentes, modelo e teto

Todas as lentes e o verificador correm no **modelo de revisão** do utilizador; sem regra dele, por exemplo Opus 5.5 medium no Claude e gpt-6.1-sol medium no Codex
(o projeto escolhe os seus modelos). O fornecedor é o do orquestrador; o outro
só com pedido explícito do humano (`<agentic-implement>/references/escolher-o-agente.md` §3). Quem
escreveu o código não revê.

| Lente | O que procura |
|---|---|
| Correção | o código faz o que diz em todos os caminhos? Lê quem chama e quem consome o que mudou, também fora do diff (`git grep` dos nomes). Num fix, a causa raiz: corrigir o sintoma e deixar a causa é Importante. Dá nome à classe e procura as outras instâncias no diff. Num diff que apaga código (função, rota, flag, ficheiro), três provas antes de o dar por seguro: o histórico (`git log -S<nome>`: porque existia), os usos indiretos (nome construído em runtime, string, enum, wrapper, schema, e os consumidores que o `REVIEW.md` lista) e a configuração viva (variável de ambiente, flag ligada num cliente); uso encontrado é Importante, o que só a produção mostra vai como pergunta a quem integra, e killswitch, flag permanente ou caminho de incidente apagados vão ao humano com recomendação |
| Spec | só com intenção escrita: o que falta, o que se fez sem ser pedido, o que parece feito e não está. Mais o teste de aceitação do revisor (abaixo) |
| Normas | as regras documentadas do repo; um padrão novo onde já havia um; dependência ou capacidade fora da pesquisa aprovada; linhas de `AGENTS.md`, `CLAUDE.md`, `REVIEW.md` ou docs que a mudança deixou falsas |
| Segurança | permissões aplicadas no servidor e testadas com um papel sem acesso; isolamento entre clientes; validação de entrada; segredos fora do código; logs e erros sem dados pessoais nem valores da base; dependências novas (vulnerabilidades conhecidas, código que corre na instalação); pode ser o `/security-review` nas condições do §2, que conta 1 |

- **Revisores por nível**: na **Padrão**, as lentes do nível (correção, spec e normas, ou as que o
  `REVIEW.md` lhe dá) vão num só revisor de contexto novo, com um brief só: correm sempre juntas
  sobre o mesmo diff, e um agente por lente a ler o mesmo repositório custa o múltiplo e perde
  detalhe na consolidação. Na **Completa**, cada
  lente tem o seu revisor, a segurança também, e o verificador corre à parte.
- **Teste de aceitação do revisor** (lente spec, sem ler os testes do autor): na **Completa** o
  revisor escreve e corre um teste de aceitação seu, fora do repo, a partir da intenção; na
  **Padrão** descreve-o; na **Rápida** não há.
- **Calar o verificador** (lente correção): procura nas linhas que o diff acrescenta o que desliga
  o typecheck ou o lint (numa linguagem sem estes, os equivalentes dela):
  `git -C <wt> diff -U0 <base>...<sha-revisto> | grep -nE '^\+.*(@ts-ignore|@ts-nocheck|@ts-expect-error|as any([^[:alnum:]_]|$)|eslint-disable|# *type: *ignore|# *noqa|//nolint)'`.
  Cada ocorrência leva o motivo na mesma linha (`@ts-expect-error <porquê>`,
  `eslint-disable-next-line <regra> -- <porquê>`). Sem motivo, ou com um que é pressa e não decisão
  («para compilar»), é Importante no código de produção, porque deixa uma verificação passar sem
  provar, e Nit num teste. Um motivo que é decisão (o tipo da biblioteca está errado, com o link da
  issue) não é achado.
- **Sem número de cobertura como gate**: ficam o teste que falha na base, a integridade das
  asserções e as mutações nas guardas. Um número de cobertura em falta não é achado.
- Lentes especializadas entram só quando o `REVIEW.md` as define ou o diff as pede, e ocupam o
  lugar de uma das acima ou somam-se dentro do teto: UI (o modo «rever» da agentic-design: o
  detetor, `node <agentic-design>/scripts/detetar-slop.mjs --diff <base>`, e a checklist do
  `ui-sem-slop.md` §5 contra as capturas), docs, «guarda que falha aberta / teste que não
  consegue falhar», migrações.
- As lentes são subagentes com o brief. Uma skill ou um comando genérico de revisão que segue o seu
  próprio método passa ao lado do brief e do `REVIEW.md`: não o uses como lente (o
  `/security-review` é a exceção, para a segurança).
- **Teto: 8 agentes de revisão por mudança** (feature ou ramo), somadas as rondas. Contam os que
  tu lanças para rever: lentes e verificador. Uma skill ou comando usado como lente conta 1. As
  sessões que corrigem ou reproduzem achados não contam: são autoria. Perto do teto, junta lentes
  num agente; se nem assim cabe, pára e vai ao humano com o resumo do §9.

## §4 Brief

Um brief por lente, a partir de `assets/brief-revisor.template.md`: ponto fixo, worktree, nível e
porquê, intenção, achados fechados, a lente, as regras e o formato do relatório. O `REVIEW.md` do
projeto lê-se antes e ganha ao brief. Da 2.ª ronda em diante, as lentes que voltam juntam-se num
só brief.

O revisor lê o brief, as regras do projeto (`REVIEW.md`, `AGENTS.md`) e as secções para que o
brief aponta, e mais nada desta skill: o `SKILL.md` é o processo de quem orquestra. Uma definição
de agente revisor do projeto também não lho manda ler.

## §5 Consolidação

Tu, antes de os achados irem ao autor:
1. juntas os relatórios das lentes num só;
2. deduplicas por **ficheiro + classe** (fica o achado com a melhor prova);
3. cortas os **Nits a 3 no total**;
4. pões os Pré-existentes numa linha;
5. lês as linhas «Nível» e «Direção» das lentes e decides (§1 de `niveis-de-risco.md`);
6. escreves a 1.ª linha com a contagem, ou `0 Importantes — nada a corrigir`;
7. corres `node <skill>/scripts/validar-relatorio.mjs <relatorio.md>` (saída 0).

## §6 Confirmação

- **Verificador** (Completa, e hooks, CI ou instaladores; só na ronda 1): **um** agente, no
  modelo de revisão e com contexto novo, recebe os Importantes já consolidados. Para cada um abre
  `ficheiro:linha` no SHA revisto, segue o caminho até ao efeito e devolve confirmado, refutado
  (motivo e `ficheiro:linha`) ou sem veredicto. Não acrescenta achados. Nunca há dois na mesma ronda.
- **Sem veredicto = não confirmado**: não vai ao autor como Importante, fica na linha «Não
  confirmados». Podes pedir a quem corrige que o tente reproduzir (é autoria, não conta para o
  teto); reproduzido, passa a Importante com prova.
- **Reprodução** (todos os níveis e rondas): quem corrige reproduz cada Importante antes de
  corrigir. Não reproduzido não se corrige: responde «errado: não reproduzido» com a tentativa.

## §7 Etiquetas e prova

- **Importante**: piora o comportamento, perde ou expõe dados, parte quem chama, ou deixa uma
  verificação passar sem provar. Um Importante de segurança sem resposta bloqueia a integração.
- **Nit**: o resto que merece uma linha. No máximo 3 por relatório consolidado; não abrem ronda
  nem commit próprio.
- **Pré-existente**: o defeito já estava na base. Sinal: a linha está fora dos hunks de
  `git diff -U0 <base>..<sha-revisto>` e o `git blame` aponta para antes da base. Fica numa linha
  do relatório, não vai para o backlog e não se corrige nesta mudança. Uma linha fora do diff que
  a mudança tornou falsa (um doc, um chamador, código antigo que um ficheiro renomeado ou movido pôs
  no âmbito de uma guarda) é Importante, não Pré-existente.
- Estilo, formatação e nomes não são achados, salvo quando mudam o comportamento: são do lint, do
  formatador e dos hooks.
- **Prova obrigatória com `ficheiro:linha`** do que se leu, não um palpite pelo nome:
  - código: o efeito e como se reproduz (o teste que fica vermelho, o comando, a captura);
  - docs e normas: a linha do doc e a linha do código ou da árvore que a desmente (ou
    `ausente: <caminho>` quando o doc cita o que não existe);
  - dependência fora da pesquisa: a linha do diff do manifesto e a ausência na pesquisa aprovada.
- A classe procura-se em todo o diff; as instâncias fora dele são Pré-existentes.
- Contestar a abordagem aprovada não é achado: vai para «Direção».

## §8 Respostas

Um corretor por ronda, ou dois se os grupos não partilham ficheiros, com o mesmo modelo de quem
escreveu. Os curtos fá-los o orquestrador, pelo §1 de
`<agentic-implement>/references/escolher-o-agente.md`.

Cada Importante fica com uma, e com um motivo curto:
- **corrigido**: o commit e a prova a passar (teste vermelho → verde; a linha do doc já certa);
- **errado**: o `ficheiro:linha` que o desmente, ou «não reproduzido» com a tentativa;
- **intencional**: onde está decidido (decisão, ADR, `REVIEW.md`);
- **não importa**: porquê, dito por quem integra ou pelo humano.

As respostas medem o ruído: muitos «errado» e «não importa» querem dizer que o revisor acusa o
que não devia (`aprendizagem.md`).

## §9 Rondas

- **Limite pelo nível**: 1 na Rápida pedida, 2 na Padrão, 3 na Completa.
- Da 2.ª ronda em diante: o diff `<sha-revisto-anterior>..<sha-revisto>` e a lista dos achados
  fechados, que não se repetem (um fechado só reabre se o diff novo voltar a pôr o mesmo efeito
  nas mesmas linhas). Voltam só as lentes com Importantes abertos, juntas num agente sempre que
  der, mais as que a conferência do nível dessa ronda pedir. O verificador não volta.
- **No limite, com um Importante aberto**: pára e vai ao humano com um resumo (achados abertos,
  respostas, rondas feitas, diff por rever, a tua recomendação: outra abordagem, partir a
  mudança, aceitar com motivo). Não há ronda extra em silêncio.

**Commits depois do SHA revisto.** Não abrem ronda:
- os de metadados (lições, a linha `Revisão:`, radar, retro);
- a correção de um Importante da última ronda, com a prova (teste vermelho → verde; num doc, a
  linha do doc e a que a desmentia) e com o diff da correção conferido por quem integra (mexe só
  no que o achado aponta);
- o teste de aceitação entregue pelo revisor, integrado sem alterações (o diff contra o ficheiro
  entregue sai vazio), vermelho antes da correção e verde depois.

Qualquer outro código (um conflito resolvido, uma correção sem prova, uma mudança nova) abre uma
ronda só desse diff; com o limite atingido, vai ao humano.

**Tronco no ramo** (merge do tronco para o ramo, ou rebase): o `git diff <sha-revisto>..<head>`
passa a trazer código do tronco, que não se revê. Com `<base-nova>` = o `<base>` recalculado, a
revisão continua a valer se **cada** linha do range-diff é um par igual
(`<n>: <sha> = <n>: <sha> <assunto>`; o range-diff ignora os merges) **e** cada merge para o ramo
dá vazio no remerge-diff (sem `--first-parent` vinham os merges internos do tronco):

```bash
(
set -o pipefail
rd=$(git range-diff --no-color <base>..<sha-revisto> <base-nova>..<head>) || { echo "range-diff falhou: não vale"; exit 1; }
[ -n "$rd" ] || { echo "range-diff vazio: não vale"; exit 1; }
printf '%s\n' "$rd" | grep -vqE '^ *[0-9]+: +[0-9a-f]+ = +[0-9]+: +[0-9a-f]+ ' && { echo "há pares diferentes: ronda desses"; exit 1; }
for m in $(git log --merges --first-parent --format=%H <sha-revisto>..<head>); do
  [ -z "$(git show --remerge-diff --format= "$m")" ] || { echo "merge $m com conflito resolvido: ronda do remerge-diff"; exit 1; }
done
echo "só pares «=» e merges limpos: a revisão vale"
)   # subshell: o exit não fecha a tua shell
```

Um SHA errado ou um intervalo vazio faz o range-diff falhar ou sair vazio, e isso **não** vale
como revisão. Quando não vale, a ronda leva só o que mudou: as linhas `!` (o patch mudou, mesmo só
no contexto) e `<` (commit que saiu), e o remerge-diff de cada merge com conflito; as linhas `>`
(commits novos) seguem os casos de cima. Um rebase pode dar `!` sem conflito nenhum, só porque o
contexto mudou: por isso, quando o repo deixa escolher, traz o tronco por merge.

## §10 Como desfazer e a linha `Revisão:`

- **Como desfazer**, no corpo do commit de integração (o commit ou o merge que junta a mudança ao
  tronco; com PR, na descrição): lista os commits com
  `git log --oneline <pai-do-1.º-commit>..<head-integrado>` (inclui as correções aceites sem
  ronda); sem merges no intervalo, `git revert --no-edit <pai>..<head-integrado>`; com um merge de
  integração, `git revert -m 1 <merge>`. Numa migração ou ação externa, o passo próprio.
- **`Revisão:`**, no mesmo corpo, uma linha:
  `Revisão: <sha-revisto> · <nível> · <r> rondas · <i> Importantes (<c> corrigidos, <e> errados, <t> intencionais, <n> não importa) · <k> Nits · <p> Pré-existentes · classes: <…>`.
  É o único sítio onde vivem o risco, o desfazer e a revisão; spec, retro e quadro apontam para ele.
- Quando as regras do repo dão a estes campos outros nomes ou outro sítio, valem os do repo; nesta
  skill e nas irmãs o campo chama-se sempre «Como desfazer».
