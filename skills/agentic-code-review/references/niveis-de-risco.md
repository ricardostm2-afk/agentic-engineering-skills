# Níveis de risco (passo 1)

Ideia adaptada de https://claude.dev/blog/solving-code-review-at-anthropic/ (aprovação à medida
do risco): o esforço da revisão segue o que a mudança pode estragar, e quem o decide é a mudança.

## Quem classifica e quando

- **O nível define-o o diff**, não o autor nem o relatório dele. O autor pode achar que mexeu «só
  num texto»; se o diff toca uma migração, é Completa.
- **Classificas tu** (o orquestrador), antes de lançar as lentes da ronda 1, e de novo em cada
  ronda, sobre o diff dessa ronda. Um caminho mais alto numa ronda seguinte junta as lentes que
  lhe faltam a essa ronda (uma correção que toca um hook ou uma migração acrescenta a lente de
  segurança) e não muda o limite de rondas.
- **O 2.º classificador é o revisor.** A lente não refaz a classificação, mas se o que lê pede
  mais do que o nível recebido (um caminho não listado que mexe em sessão, permissões, dinheiro
  ou numa guarda), escreve uma linha «Nível: <ficheiro:linha> — <porquê>» no relatório. Decides
  tu, e dizes a decisão numa linha.
- O `REVIEW.md` do projeto ganha: se tem níveis com outros nomes, uma lista de caminhos ou um
  comando que classifica o diff, usa-os (os nomes: «Três escalas», abaixo).
- Chamada pela agentic-feature, a via da feature é o nível de partida; conferes na mesma o diff
  contra ele. Se o diff pede mais, a revisão tem a profundidade do nível certo (o planeamento já
  feito não se refaz) e di-lo numa linha.

## Os níveis

| Nível | Quando (pelo diff) | Lentes | Confirmação | Rondas |
|---|---|---|---|---|
| Rápida | docs e texto fora dos caminhos altos; uma correção de ~50 linhas num ficheiro e o seu teste; aditivo atrás de uma flag desligada | nenhuma: a prova é o teste vermelho → verde do autor. Pedida explicitamente: correção | — | 1 (só se pedida) |
| Padrão | código normal do produto | correção, spec (com intenção escrita) e normas, num só revisor (`painel-e-rondas.md` §3) | quem corrige reproduz antes de corrigir | 2 |
| Completa | qualquer caminho sempre alto (abaixo) | as três e segurança | um verificador na ronda 1 e a reprodução | 3 |

- **Hooks, CI e instaladores** (`.githooks/`, workflows de CI, scripts de instalação, de
  empacotamento ou de atualização automática) nunca são Rápida e sobem **as lentes, não as
  rondas**: juntam a lente de segurança e o verificador às lentes do nível que o resto do diff
  der. As rondas ficam as desse nível.
- **Subir por lições**: uma linha `tipo: escapou` no sítio das lições (`aprendizagem.md`, «Onde
  fica»), ou um caso `escapou` confirmado no conjunto de avaliação, da mesma área, nos últimos 30
  dias, sobe um nível. As
  `tipo: repetido` não sobem. Nada sobe acima da Completa.
- **Descer** só quando o diff deixa de tocar o que pesou (a migração saiu do ramo). Nunca abaixo
  do que os caminhos dizem.
- **Começa estrito.** Alarga um nível (por exemplo, uma pasta passa de Completa a Padrão) só com
  provas: casos limpos que passam, nenhum `escapou` recente na área. O contrário também vale:
  quando os reverts ou os `escapou` de uma área sobem, aperta-a (é o «circuit breaker» que o
  artigo diz que lhes falta).

## Três escalas

Três escalas usam nomes parecidos e medem coisas diferentes. Esta tabela é o único sítio das
equivalências entre elas.

| Escala | Mede | Valores | Decide-a | Escreve-se |
|---|---|---|---|---|
| nível da revisão | o que o diff pode estragar | Rápida, Padrão, Completa | quem orquestra a revisão, por esta página | «Nível da revisão:» no brief do revisor; a `<via>` da 1.ª linha do relatório e o `<nível>` da linha `Revisão:` |
| via da feature | o risco do pedido, antes de haver código | Padrão, Completa (a Correção vai para a `agentic-fix` e a Grande demais parte-se antes) | o passo 0 da `agentic-feature` | uma linha ao humano; na revisão, é o nível de partida com o mesmo nome |
| nível do agente | o que quem escreve ainda tem de decidir ou descobrir | curta, bem-definida, complexa | `<agentic-implement>/references/escolher-o-agente.md` §1 | `nível:` no brief de quem escreve, a linha que os lançadores leem |

- Os níveis do `REVIEW.md` com outros nomes mapeiam 1:1 para os da revisão, pela ordem (por
  exemplo Rápida, Normal, Profunda), e o `REVIEW.md` diz qual é qual.
- O nível do agente não se converte no da revisão: uma tarefa bem-definida numa zona sensível tem
  revisão Completa.
- Num brief, «nível» sozinho é o do agente; o da revisão leva sempre «da revisão».

## Caminhos sempre altos

Os do `REVIEW.md` e as áreas `risco: alto` de `.agentic/areas.json`, se existem. Sem eles, por
omissão:
- autenticação, sessão, papéis e permissões (onde quer que se decidam);
- isolamento entre clientes ou organizações (multi-tenant);
- dinheiro: preços, faturação, pagamentos, impostos;
- migrações e esquema da base de dados; apagar ou transformar dados;
- dados pessoais e de saúde, registos (logs) e mensagens de erro que os podem levar;
- segredos, chaves e configuração de segurança no edge (cabeçalhos, CSP, CORS);
- integrações externas que enviam ou cobram (e-mail, SMS, pagamentos);
- hooks, CI e instaladores (com a regra própria acima).

Os prompts de sistema, as instruções dos agentes e o próprio revisor (`REVIEW.md`, brief) são
Padrão com a lente normas a ler o que a mudança deixou falso; uma mudança ao revisor pede também
a corrida dos casos de avaliação (`aprendizagem.md`).

## Pessoas

- **A aprovação de um agente nunca conta como a de um humano.** Esta skill classifica, revê e
  mostra provas; não aprova.
- **Quem pediu a mudança responde por ela.** O agente pode escrever `Risco:` e `Como desfazer:`;
  quem pediu lê-os e as provas, e é o dono do resultado.
- **A aprovação vale para um SHA.** Um commit novo depois do SHA revisto segue as regras de
  `painel-e-rondas.md` §9: ou cabe nas exceções, ou abre ronda.
- **Equipa com várias pessoas**: o artigo usa 0 humanos na Rápida (com revisão e segurança
  verdes), 1 na Padrão e 2 na Completa, e os caminhos sempre altos levam sempre uma pessoa; os
  caminhos leves só para autores de confiança. Escreve isso no `REVIEW.md` e nas regras do
  remoto (dono de código, proteção do ramo); a skill só confere.
- **Um só humano** (o caso comum num projeto pequeno): não há segunda pessoa. A Completa compensa
  com mais lentes e o verificador, e o humano lê as provas na mensagem final; não se lhe pede um
  «aprovo» por mudança fora do que o projeto já pede (deploy, ações irreversíveis).
- Mudanças de direção («devia ser feito de outra maneira») levantam-se cedo, ao humano, e não como
  bloqueio de uma mudança acabada: na revisão vão para «Direção», não são achados.
