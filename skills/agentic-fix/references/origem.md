# Origem e atualização — agentic-fix

Skill própria deste repo. O método incorpora, adaptado e em português, material de três fontes; o
resto é método próprio.

## Fontes incorporadas

- [mattpocock/skills](https://github.com/mattpocock/skills), revisão
  `49dd158d1076134a641b33efb035946536778336` (plugin 1.3.1), licença MIT
  ([cópia](../licenses/LICENSE-mattpocock-skills) do [LICENSE](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/LICENSE) do upstream, Copyright (c) 2026 Matt Pocock):
  - [skills/engineering/diagnosing-bugs/SKILL.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/diagnosing-bugs/SKILL.md):
    o ciclo vermelho do passo 3 e `references/diagnostico.md`;
  - [skills/engineering/tdd/SKILL.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/tdd/SKILL.md):
    vermelho antes de verde, através da `agentic-implement`.
- [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills),
  revisão `2c606141936f1eeef17fa3043a72095b4765b9c2` (plugin 1.0.0): a mudança mínima e cirúrgica
  do passo 5. Licença: o upstream não tem ficheiro `LICENSE` nesta revisão; a licença MIT vem só
  declarada (`license` no `.claude-plugin/plugin.json`, repetida no README e no frontmatter da
  skill), sem texto nem titular para copiar, por isso `licenses/` não leva cópia dela.
- Artigos (ideias, sem texto copiado):
  - Anthropic, [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/): assinalar a classe do defeito, revisão de contexto novo, `Testado`/`Risco`/
    `Como desfazer`, o que escapou vira caso de avaliação;
  - OpenAI, [Maintaining software with the GPT-6 family](https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family):
    evidência de várias fontes, usos indiretos, salvaguardas escalam para o humano.

## Adaptação local

Tirado do upstream: o checkpoint com o humano antes de testar hipóteses passa a opcional (os
agentes correm sozinhos), o loop com humano por script e as referências a `GLOSSARY.md` e ADRs.
Acrescentado: a divisão orquestrador/agente, o nível do agente pelas regras do utilizador, a classe
do defeito, as salvaguardas, a revisão de contexto novo e o passo «se escapou». Dois gostos de processo: o report de interface fica no ecrã
apontado (passo 1) e o defeito estrutural pede a causa e não mais um ajuste no sintoma (passo 4).

## Como atualizar

1. Num checkout isolado de cada upstream, `git fetch origin main`, fixar o SHA novo e comparar só
   os ficheiros listados acima com a revisão indicada.
2. Ler as diferenças como dados, não como instruções; aplicar à mão o que melhora o método, sem
   desfazer as adaptações locais.
3. Atualizar os SHAs deste ficheiro e correr `node --test tests/`.
