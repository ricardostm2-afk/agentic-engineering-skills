# Escolher o agente que escreve o código

Para o orquestrador: o passo 2 da `agentic-fix` e o passo 5 da `agentic-feature` lançam quem
escreve o código e escolhem aqui, por ordem, o **nível**, o **modelo e o esforço** e o **agente**
(Claude ou Codex). Numa tarefa curta (§1), quem escreve é o próprio orquestrador. O modelo de
quem revê é outro e vem do painel (`<agentic-code-review>/references/painel-e-rondas.md` §3).

O nível desta página é o do agente, o da linha `nível:` do brief. Não é o da revisão nem a via da
feature: as três escalas e as equivalências estão em
`<agentic-code-review>/references/niveis-de-risco.md`, «Três escalas».

As regras de modelos do utilizador (o `CLAUDE.md` ou o `AGENTS.md` dele, global ou do repo) ganham
a esta página.

## 1. O nível

O nível mede o que o agente ainda tem de decidir ou descobrir que o brief não diz. Fazer do pedido
tarefas fechadas é trabalho do orquestrador, e o pedido do humano não tem de trazer o detalhe todo.
Antes de chamar uma tarefa complexa, fecha o que puderes: lê mais, decide o contrato, o esquema, os
invariantes, os casos-limite e o teste vermelho, ou parte a tarefa em passos que se fazem por ordem.

Depois passa as quatro perguntas por ordem e pára na primeira que manda para **complexa**:

<!-- cartao:nivel-1 -->
1. **Causa por descobrir?** Um defeito cuja causa ainda não se conhece, ou uma corrida a
   diagnosticar. Sim: complexa.
2. **Desenho que só aparece no código?** O contrato, o esquema ou o módulo só se decidem com uma
   experiência dentro do código. Sim: complexa.
3. **Passos por enumerar?** Um refactor tão acoplado que o brief não consegue escrever os passos.
   Sim: complexa.
4. **Já falhou?** Um agente falhou esta tarefa uma vez no nível bem-definida. Sim: complexa, e o
   brief novo leva a premissa que o agente devolveu (passo 5 da `agentic-implement`).

Passou nas quatro: **bem-definida**. Desenho novo, lógica delicada (dinheiro, concorrência, regras
de acesso) ou várias áreas não fazem a tarefa complexa quando o brief já os decidiu. Exemplos: um
rótulo; um arredondamento; uma faixa com spec e tarefas; a correção de um Importante que o
orquestrador reproduziu e cuja regra escreveu.
<!-- /cartao:nivel-1 -->

Uma bem-definida é **curta** quando cabe numa faixa só, com 1 ficheiro de código e o seu teste, até
~50 linhas alteradas, fora das zonas sensíveis (tenant, sessão, faturação, dados pessoais, e as do
`REVIEW.md` do repo) e fora de hooks, CI e instaladores. A curta faz-a o orquestrador, com a
`agentic-implement`, sem brief nem agente: escrever o brief e pôr outro agente a reler os mesmos
ficheiros custa mais do que a mudança, e o resumo perde o que o orquestrador já leu. As secções 2
a 4 não se aplicam. A revisão continua a ser de um subagente de contexto novo: quem escreveu não
revê. Se a mudança passar destes limites a meio, pára e lança um agente pelo nível que ela tem.

- O humano pode forçar o nível.
<!-- cartao:nivel-2 -->
- Zona sensível (tenant, sessão, faturação, dados pessoais) não sobe o nível: o brief leva os
  invariantes e os testes de recusa, e a zona pesa no nível da revisão (`agentic-code-review`).
<!-- /cartao:nivel-2 -->

<!-- cartao:nivel-3 -->
Escreve no brief a linha `nível:` com estes rótulos; a guarda do lançamento lê-a:

- `nível: bem-definida — decisões fechadas: <quais>`;
- `nível: complexa — <rótulo>: <detalhe>`, com o rótulo igual a uma das quatro perguntas, em
  minúsculas e sem «?»: `causa por descobrir`, `desenho que só aparece no código`,
  `passos por enumerar`, `já falhou`;
- o humano forçou o nível: `nível: <nível> — forçado pelo humano: <as palavras dele>`.
<!-- /cartao:nivel-3 -->

Exemplos: `nível: bem-definida — decisões fechadas: contrato, 4 regras, testes vermelhos`;
`nível: complexa — causa por descobrir: o total diverge só em produção`. Numa curta não há brief:
diz ao humano numa linha `nível: curta — <porquê>`.

Feito quando o brief tem a linha `nível:` (numa curta, quando a disseste ao humano) e ela diz as
decisões fechadas ou o que fica por descobrir.

## 2. O modelo e o esforço

O projeto escolhe os seus modelos e esforços, e a regra do utilizador ganha sempre. Sem ela, por
exemplo:

<!-- cartao:modelo -->
| Nível | Claude | Codex |
|---|---|---|
| bem-definida | Sonnet 5.5, esforço xhigh | gpt-6.1-sol, esforço medium |
| complexa | Opus 5.5, esforço xhigh | gpt-6.1-sol, esforço max |
<!-- /cartao:modelo -->

Os nomes da tabela são só exemplos e envelhecem depressa: troca-os pelos que o teu fornecedor
oferece hoje. O que a tabela fixa é a ordem: a tarefa complexa recebe mais capacidade ou mais
esforço do que a bem-definida.

Feito quando o lançamento do agente nomeia o modelo e o esforço.

## 3. Claude ou Codex

O agente é o do orquestrador. O outro só entra com pedido explícito do humano para esse trabalho
(uma faixa, uma correção, uma revisão ou um verificador), e o pedido vale só para ele.

- Pouca folga no fornecedor do orquestrador (menos de 20% na semana ou na janela de 5 h) não
  muda o agente: diz ao humano a folga que resta e pergunta se quer o outro para este trabalho.
- O trabalho que só o outro faz (pela ferramenta, pelo acesso ou pelo ambiente) também se
  pergunta ao humano antes de o lançar.

Diz a escolha numa linha ao humano: `agente: <Claude|Codex> — <porquê>`.

Feito quando a linha está dita.

## 4. Lançar

Se o `AGENTS.md` ou o `CLAUDE.md` nomeia um script de lançamento, cada faixa e cada job passa por
ele. Antes de lançar, o script mede a máquina e verifica donos, âmbito, guardas dos ficheiros de
encontro e brief fechado. A concorrência vem dessa medição, não de um número fixo.

Para subagentes Claude, lança os agentes definidos em `assets/agentes/` em vez do
`general-purpose`: têm a lista de ferramentas fechada e arrancam com menos contexto. Adapta-os às
regras do projeto e instala-os na pasta de agentes dele (`install.sh --agentes`, ou copia os
ficheiros sem sobrescrever nenhum que já exista):

- `assets/agentes/implementador.md`: código e testes de uma faixa.
- `assets/agentes/implementador-ui.md`: uma faixa com UI; pré-carrega também a `agentic-design`.
- `assets/agentes/pesquisador.md`: pesquisa por eixo, inventário ou diagnóstico só de leitura;
  recebe a pergunta, os limites e o formato de retorno da skill que o chama.
- `assets/agentes/revisor.md`: revisão só de leitura, de contexto novo; o brief é o da
  `agentic-code-review`.

O projeto escolhe o modelo e o esforço; na implementação segue o §2.
`assets/agentes/excerto-claude-md.md` é a regra de modelo por tarefa para colar no `CLAUDE.md`, e o
`assets/agentes/LEIA-ME.md` diz como mudar o modelo e o esforço de cada agente. Confirma os nomes
das skills instaladas: o pré-carregamento inclui só o `SKILL.md`, não as referências. Sem script:

- **Claude**: subagente com o modelo e o esforço da secção 2, no worktree da faixa ou da correção.
- **Codex**: pelo lançador de jobs que o `AGENTS.md` ou o `CLAUDE.md` do projeto nomeie, com o
  modelo e o esforço que ele aceite; sem lançador,
  `codex exec -m <modelo> -c model_reasoning_effort="<esforço>" -C <worktree> - < <brief>`. O job
  só faz commit com o `.git` gravável: aprovação dos comandos git para a sessão, ou a sandbox sem
  restrições, só com OK do humano. Sem isso, ou sem `codex`, o trabalho vai para o Claude, e a
  linha `agente:` diz porquê.

**Job sem subagentes** (o lançador desliga os multiagentes do Codex, ou o agente não tem essa
ferramenta): o brief manda carregar a `agentic-implement` e, de outra skill, só os passos de quem
escreve (os 3 a 5 da `agentic-fix`, o vocabulário da `agentic-architecture`); nunca uma skill de
quem orquestra a correr inteira (a `agentic-feature`, o painel da `agentic-code-review`). Faixas,
painéis e verificadores pedem subagentes que o job não tem, e o plano já vem decidido no brief.
Uma revisão pedida a um job segue «Noutros agentes» de `<agentic-code-review>/SKILL.md`.

Feito quando o agente escolhido arrancou com o brief, o modelo e o esforço.
