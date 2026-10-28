# As camadas e o que esta skill cobre

Fonte: https://claude.dev/blog/solving-code-review-at-anthropic/ (resumido por palavras nossas).

Rever linha a linha deixa de escalar quando os agentes escrevem a maior parte do código. A
pergunta passa a ser: o que pode correr mal com esta mudança, e que verificação (automática ou
humana) o apanha? A resposta é uma pilha de camadas, cada uma barata e incompleta, com o rollback
por baixo. A revisão é contínua, como um corretor ortográfico, e não um portão no fim.

**Esta skill é só a camada da revisão e da verificação dos achados.** As outras são do projeto: a
skill aponta para elas e não as substitui.

| # | Camada | O que é | Quem a faz aqui |
|---|---|---|---|
| 1 | Verificação antes de integrar | o autor corre o que pode correr (testes, build, lint, captura contra o design) e mostra a saída | o autor (na agentic-feature, o TDD e a prova de cada faixa). A revisão entra depois de haver prova |
| 2 | Revisão por agentes em todas as mudanças | lentes em paralelo contra o repo inteiro e a intenção; achados confirmados antes de publicar; só o que muda o comportamento; etiquetados e por gravidade | **esta skill**, passos 1–6 |
| 3 | Segurança automática e bloqueante | um revisor de segurança em cada mudança arriscada; falso positivo fecha-se com motivo, um commit que corrige fecha o achado | **esta skill**, lente segurança; um Importante de segurança sem resposta bloqueia |
| 4 | CI obrigatória | lint, tipos, testes, build e empacotamento; o pedido de integração diz como foi testado e como se desfaz | o projeto (hooks, CI, bateria local). Sem PR, «como testado», «risco» e «como desfazer» vão no corpo do commit de integração (`painel-e-rondas.md` §10) |
| 5 | Aprovação humana à medida do risco | 0, 1 ou 2 pessoas pelo nível da mudança | `niveis-de-risco.md`: a skill classifica e mostra as provas; não aprova |
| 6 | Integração, flags e lançamento gradual | voltar a correr tudo contra o tronco mais recente; flags primeiro para uso interno; canais antes do estável | o projeto. A skill só confirma que a revisão vale para o SHA que entra (rebase e commits depois do SHA revisto, `painel-e-rondas.md` §9) |
| 7 | Deteção rápida e rollback | flags que se desligam sem deploy, reverts, alguém de serviço; cada incidente responde «que camada devia ter apanhado isto?» | o projeto. A skill dá o «como desfazer» e transforma a resposta em lição e caso de avaliação (`aprendizagem.md`) |

**Revisão noturna do código antigo.** No artigo, agentes procuram bugs antigos todas as noites.
Aqui não há varreduras por iniciativa: código antigo só se audita a pedido explícito do humano
(`manutencao.md`). Numa revisão, o que já estava na base é Pré-existente numa linha.

## O que fica com os humanos

- Decidir se vale a pena fazer: direção, gosto, âmbito. Cedo, e não como bloqueio de uma
  mudança acabada.
- O código de maior risco (os caminhos sempre altos de `niveis-de-risco.md`).
- A arquitetura que vai ser copiada.
- **Ler as provas**: a saída dos testes, os comandos corridos, as capturas, os achados e as
  respostas. Se não consegues dizer o que as verificações não apanhariam, pede uma revisão a
  sério.
- Ser dono do resultado: quem pediu a mudança responde por ela.

## Quando é que «quem integra é dono» funciona

Funciona sem culpa quando as mudanças são pequenas, tudo é reversível, a fasquia vem do raio de
explosão, a telemetria é rápida e os incidentes avaliam o sistema e não as pessoas. Se uma destas
falha (um diff de mais de 1 000 linhas, uma migração sem volta, nada que mostre o efeito em
produção), sobe o nível ou parte a mudança antes de rever.

## Três lições do artigo que moldam a skill

- **O ruído custa mais com autores agentes**: o agente corrige cada reparo, e cada reparo é mais
  um commit e mais uma ronda. Daí: estilo fora, Nits a 3, confirmação antes de chegar ao autor.
- **Rondas sem limite não convergem**: houve uma noite de mais de 50 rondas entre um autor e um
  revisor agentes. Daí: limite pelo nível, só o diff novo, achados fechados não se repetem.
- **Grande parte dos achados repetidos era código antigo**. Daí: o Pré-existente numa linha, fora
  do backlog e fora da correção.

## Trabalho no tronco sem PRs

- PR → o intervalo `<base>..<sha-revisto>` de um ramo curto, ou os commits por integrar.
- Comentários na linha → o relatório consolidado, um achado por linha com `ficheiro:linha`.
- Descrição do PR → o corpo do commit de integração (`Risco:`, `Como desfazer:`, `Revisão:`).
- Fila de integração → o rebase conferido com `git range-diff` antes de integrar.
- Duas pessoas a aprovar → com um só humano não há segunda: mais lentes e o verificador, e o
  humano lê as provas.
