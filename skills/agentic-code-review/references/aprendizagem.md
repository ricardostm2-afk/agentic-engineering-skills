# Aprendizagem: lições, casos de avaliação e avaliar o revisor (passo 7)

Dois artigos, a mesma ideia: o revisor (e as instruções dos agentes) é código, e muda-se com
provas. Do artigo da Anthropic (https://claude.dev/blog/solving-code-review-at-anthropic/): os
incidentes e os reverts viram um conjunto de avaliação confirmado por quem conhece o código, e
qualquer mudança ao revisor corre contra ele. Do artigo da OpenAI
(https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family): A/B das
instruções a partir do mesmo snapshot, modelos escolhidos pelo custo por achado aceite, e as
discordâncias entre modelos como mapa dos pontos cegos.

## Linha de lição

Quando algo escapou (revertido, incidente, reportado pelo humano) ou a mesma classe aparece pela
2.ª vez numa revisão, uma linha de lição, no commit de metadados da mudança que o descobre ou
corrige:

`- <aaaa-mm-dd> · <área> · tipo: <escapou|repetido> · base <sha-base> · <sha-defeito>→<sha-correção> · esperado: <ficheiro:linha> · classe: <classe> · camada: <a que devia ter apanhado (escapou) ou a que apanhou (repetido)> · <o que aconteceu> → <a defesa>`

**Onde fica.** No sítio que o `REVIEW.md` do projeto indicar para as lições ou os casos de
avaliação, no formato que ele der (o dele ganha ao de cima); sem indicação, em `docs/licoes.md`.
Sem nenhum dos dois, não cries o ficheiro: a linha vai na mensagem final ao humano. É nesse sítio
que se procuram a 2.ª vez de uma classe e as `escapou` de uma área.

- `tipo: escapou`: passou a revisão e viu-se depois. `camada` é a que o devia ter apanhado;
  `esperado` é o `ficheiro:linha` onde o revisor o devia ter acusado.
- `tipo: repetido`: a revisão apanhou-o, mas é a 2.ª vez da classe (procura com
  `git log --grep '<classe>'` e no sítio das lições). `camada` é a que o apanhou;
  `esperado` é a linha do achado.
- Só `tipo: escapou` sobe o nível da área (`niveis-de-risco.md`).

## Corrigir na fonte

Um achado repetido não se resolve a repeti-lo. Pela ordem:
1. se uma máquina o vê sem falsos positivos, vira guarda, regra de lint ou teste (e prova-se que
   recusa: semear o defeito dá vermelho, repor dá verde);
2. senão, uma linha do `REVIEW.md` («O que é falhar aqui» ou «Achados repetidos»,
   `review-md.md`) ou do brief do revisor;
3. quando algo escapou, pergunta o que faltava ao revisor à frente dele (o diff inteiro? o
   chamador fora do diff? a regra escrita?) e corrige isso, não só o defeito.

## Casos de avaliação

O conjunto de avaliação são as linhas de lição (`escapou` e `repetido`) mais os **casos limpos**,
no formato de `assets/caso-de-avaliacao.template.md`:
- cada caso é confirmado por quem conhece o código (o humano, ou o dono da área), não pelo agente
  que o escreveu;
- **limpo** = uma mudança integrada há 30 dias ou mais, sem revert nem incidente;
- **correr um caso**: o revisor, com o nível e as lentes que a mudança teria, num worktree fora do
  repo, sobre `<base>..<sha-defeito>` (ou `<base>..<sha-integrado>` num limpo). Passa se acusar um
  Importante no ficheiro `esperado`, numa linha do mesmo hunk que a esperada; num limpo, passa se
  não acusar Importantes (Nits não contam).
- **Teto**: cada caso é um painel inteiro, por isso os casos correm **em sequência**, cada um
  contra o mesmo teto de agentes de uma revisão (`painel-e-rondas.md` §3), nunca todos em
  paralelo. Com muitos casos, corre primeiro os da lente que mudou.

## Reavaliar o revisor

Uma mudança ao revisor é qualquer mudança ao brief, ao `REVIEW.md`, aos prompts, ao modelo, ao
esforço ou às ferramentas das lentes.
- **A 1.ª versão é a base**: não tem corrida obrigatória.
- Daí em diante, corre os casos antes de a mudança ficar. Fica se **não perde nenhum caso que
  apanhava**; e, havendo **3 ou mais limpos**, se **não acusa Importantes nos limpos**. Com menos
  de 3 limpos esse critério não conta (seria um controlo que se satisfaz sozinho): di-lo.
- Entre duas versões que ficam, fica a de menor custo por achado aceite (tokens da corrida a
  dividir pelos casos apanhados); o critério só conta com 1 caso apanhado ou mais.
- O resultado (casos corridos, apanhados antes e depois, limpos) vai na mensagem do commit da
  mudança.
- Mede-se a recall junto com o ruído, nunca sozinha: acusar muito sobe a recall e afoga o autor.

## A/B de instruções

Para uma instrução do `AGENTS.md`, do `CLAUDE.md`, do `REVIEW.md`, de um brief ou de uma skill do
projeto que pareça ter desviado um agente
ou dado trabalho a mais (vista em sessões recentes):
1. escolhe uma tarefa real em que ela pesou e o SHA de onde a tarefa partiu;
2. corre a mesma tarefa duas vezes, do mesmo SHA, com o mesmo modelo e esforço, cada uma num
   worktree seu: uma com a instrução, outra sem ela (ou com a versão corrigida);
3. compara a qualidade do resultado, o comportamento, as chamadas a ferramentas, os tokens, o
   tempo e o custo. Uma corrida de cada lado é um indício, não uma medida: repete quando a
   diferença é pequena.

Fica a versão que ganha; a comparação vai na mensagem do commit.

## Modelo e esforço

- **O modelo da revisão é do utilizador** (a regra dele; sem ela, a de `painel-e-rondas.md` §3).
  Uma troca leva-se a ele, com a comparação nos **casos de avaliação que o modelo atual apanha**:
  o novo tem de os apanhar também, ao menor custo por achado aceite. Sem casos que o modelo atual
  apanhe (passar tudo porque não há nada para apanhar), fica o atual.
- Mede o **custo por achado aceite** num conjunto fixo (os casos de avaliação, ou um conjunto fixo
  de pastas) em que cada achado é validado por um humano. O custo inclui os subagentes e os turnos
  automáticos.
- Sobe o esforço para auditorias largas só quando os primeiros resultados forem bons. Compara
  modelos numa tarefa pequena antes de propor a troca.
- **Discordâncias**: onde um modelo acusa e outro não, há um ponto cego de um deles. Lê esses
  casos, corrige o prompt ou o `REVIEW.md` para o ponto cego, e guarda a correção com o modelo a
  que se referia. Quando sai um modelo novo, revê essas correções: podem ter deixado de ser
  precisas.

## Métricas mínimas

Num projeto pequeno chegam as linhas `Revisão:` dos commits de integração
(`git log --grep '^Revisão:'`): rondas até passar, quantas passam à 1.ª ronda, a parte de
respostas «errado» e «não importa» (ruído), e as lições `escapou` por área. Precisão, recall e
horas poupadas só se medidas; não se estimam.
