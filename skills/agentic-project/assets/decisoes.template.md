<!--
Modelo da skill agentic-project. Regista cada decisão no momento em que é tomada (não no fim),
para que nada se perca se a sessão cair. Numeração sequencial; nunca reutilizar um número.
Uma decisão revogada não se apaga: marca-se «substituída por D-NNN».
-->
# Decisões: {{nome do projeto}}

## Contexto
- **O que é**: {{uma frase}}
- **Modo**: {{novo | adotar}} — {{porquê, uma linha}}
- **Stack detetado / escolhido**: {{…}}
- **O que já existia**: {{código, docs, contas, serviços}}

## Princípios
<!-- Só se não houver Spec Kit; com Spec Kit vivem em .specify/memory/constitution.md. -->
- {{princípio do projeto, com o porquê}}

## Decisões

### D-001 {{título curto}}
- **Decisão**: {{o que se escolheu}}
- **Porquê**: {{a força ou o facto que pesou}}
- **Alternativas**: {{outras opções e porque não}}
- **Decidido por**: {{humano | humano (contra a recomendação) | delegado (recomendação aceite com «escolhe tu») | agente (técnica e reversível, sem pergunta: ex. executor de testes, ORM)}}
- **Data**: {{AAAA-MM-DD}}
- **Reversível?**: {{sim, barato | caro → ver docs/adr/NNNN}}

## Fora de âmbito (MVP)
- {{o que fica explicitamente de fora, e quando se volta a ver}}

## Decisões delegadas a rever
<!-- Lista curta para o humano rever quando tiver tempo. -->
- D-{{NNN}}: {{título}}

## Pendentes do humano
- [ ] {{conta / segredo / DNS / decisão}} — {{dono}}
