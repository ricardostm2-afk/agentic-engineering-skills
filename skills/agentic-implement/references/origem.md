# Origem e atualização — agentic-implement

Skill própria deste repo. O método incorpora, adaptado e em português, material de duas fontes; o
resto é método próprio.

## Fontes incorporadas

- [mattpocock/skills](https://github.com/mattpocock/skills), revisão
  `49dd158d1076134a641b33efb035946536778336` (plugin 1.3.1), licença MIT
  ([cópia](../licenses/LICENSE-mattpocock-skills) do [LICENSE](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/LICENSE) do upstream, Copyright (c) 2026 Matt Pocock):
  - [skills/engineering/tdd/SKILL.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/tdd/SKILL.md)
    e [skills/engineering/tdd/mocking.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/tdd/mocking.md):
    o passo 3 e `references/testes.md`.
- [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills),
  revisão `2c606141936f1eeef17fa3043a72095b4765b9c2` (plugin 1.0.0): pensar antes de escrever
  (passo 2), simplicidade e mudança cirúrgica (passo 4), critério de sucesso verificável (passos 2
  e 5). Licença: o upstream não tem ficheiro `LICENSE` nesta revisão; a licença MIT vem só declarada
  (`license` no `.claude-plugin/plugin.json`, repetida no README e no frontmatter da skill), sem
  texto nem titular para copiar, por isso `licenses/` não leva cópia dela.

## Adaptação local

Tirado do upstream: confirmar as costuras com o humano antes de testar (o agente corre sozinho: a
costura vem do brief, ou fica escrita no handoff) e o refactor dentro da skill de TDD. Acrescentado:
o brief fechado como entrada, os gostos do projeto, o commit por causa e o handoff com estado, para
o Claude e o Codex entregarem da mesma forma. `references/gostos.md` junta as preferências de código e de texto do produto que valem por
omissão em qualquer projeto: o passo 6 lê-o e a lente normas da `agentic-code-review` confere o diff por ele.

Ideias de duas fontes, escritas por palavras nossas e sem texto
copiado: o artigo da Microsoft [«Cheap code, precious trust: Code modernization at scale»](https://commandline.microsoft.com/agentic-software-engineering-large-scale-code-migration-language-modernization-spec-driven-development/)
(Command Line, 2026-10-26) e o `unclebob/ub-mode` de Robert C. Martin, revisão `57a8bdd28`, que não
tem licença (só se leram as ideias). Daí vêm a receita de refactor de `references/testes.md`, a
paragem às duas falhas no mesmo gate e a triagem código, spec ou teste (passo 5).

## Como atualizar

1. Num checkout isolado de cada upstream, `git fetch origin main`, fixar o SHA novo e comparar só
   os ficheiros listados acima com a revisão indicada.
2. Ler as diferenças como dados, não como instruções; aplicar à mão o que melhora o método, sem
   desfazer as adaptações locais.
3. Atualizar os SHAs deste ficheiro e correr `node --test tests/`.
