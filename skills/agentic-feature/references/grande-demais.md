# Grande demais: partir em fatias (passo 0)

A via Grande demais não constrói: parte o pedido em fatias verticais, e cada fatia volta a entrar
na `agentic-feature` como uma feature nova, com a sua triagem. Exemplos: «portal do cliente»,
«importar tudo do sistema antigo».

1. **Pesquisa do eixo da feature** (o eixo (a) do passo 1b, com o teto da Padrão): como os
   produtos de referência dividem este problema. Grava-a em `docs/pesquisa/<slug>-<aaaa-mm-dd>.md`,
   num commit à parte (`references/pesquisa-moderna.md`, linha «Grande demais»). A pesquisa
   técnica faz-se depois, em cada fatia.
2. **Fatias verticais**: cada uma atravessa todas as camadas e demonstra-se sozinha. Com o destino
   nebuloso, o método `wayfinder`; com o destino claro, o `to-tickets`. Os dois são do plugin
   `mattpocock-skills` e só o utilizador os invoca: lê o `SKILL.md` instalado
   (`find ~/.claude/plugins/cache -path '*mattpocock*/<nome>/SKILL.md' | sort | tail -1`) e aplica
   o método, ou sugere ao humano que escreva `/<nome>`. Cada fatia cita a pesquisa do ponto 1.
3. **Paragem**: mostra as fatias ao humano (é o momento 1 desta via), põe-nas no quadro como
   `backlog` e propõe começar pela primeira, invocando a `agentic-feature` com o id dela
   (`/agentic-skills:agentic-feature <id>` no plugin do Claude Code, `/agentic-feature <id>` numa
   cópia, `$agentic-feature <id>` no Codex).

Feito quando as fatias estão no quadro como `backlog`, a pesquisa está commitada e o humano tem a
proposta da primeira.
