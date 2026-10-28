# Agentes definidos e modelo por tarefa

Quatro definições de subagente do Claude Code, para lançar em vez do `general-purpose`:

| Ficheiro | Para quê | Ferramentas | Predefinição |
|---|---|---|---|
| `implementador.md` | código e testes de uma faixa com brief fechado | `Read, Edit, Write, Bash, Grep, Glob` | `sonnet`, `xhigh` |
| `implementador-ui.md` | uma faixa de interface; pré-carrega também a `agentic-design` | as mesmas | `sonnet`, `xhigh` |
| `pesquisador.md` | pesquisa, inventário ou diagnóstico só de leitura | `Read, Grep, Glob, WebFetch, WebSearch, Bash` | `sonnet`, `xhigh` |
| `revisor.md` | revisão só de leitura, de contexto novo | `Read, Grep, Glob, Bash` | `opus`, `medium` |

Cada um tem a lista de ferramentas fechada (nenhum lança outros agentes) e, quando precisa de uma
skill, pré-carrega só essa. O `excerto-claude-md.md` é a regra «modelo por tarefa» para colares no teu `CLAUDE.md`;
os níveis (curta, bem-definida, complexa) vivem em `references/escolher-o-agente.md`.

## Instalar (opcional)

Os instaladores só tocam nos agentes com a opção explícita, e nunca sobrescrevem um ficheiro que já
exista:

~~~bash
./install.sh --agente claude --agentes            # simulação: mostra o que faria
./install.sh --aplicar --agente claude --agentes  # copia para ~/.claude/agents
./install.sh --aplicar --agente claude --agentes --projeto <repo>   # <repo>/.claude/agents
~~~

No Windows: `.\install.ps1 -Agente claude -Agentes` (e `-Aplicar`). No fim, o instalador mostra o
excerto do `CLAUDE.md`; cola-o onde quiseres (`~/.claude/CLAUDE.md` ou o `CLAUDE.md` do projeto). O
instalador nunca edita o teu `CLAUDE.md`. Os agentes copiam-se sempre, mesmo com `--ligar`, porque
são para editares. Para atualizar um que já tens, compara à mão (`diff`) com o deste repositório.

## Mudar o modelo e o esforço

Edita as duas linhas `model` e `effort` do ficheiro do agente: são só a predefinição do nível, e
os nomes são exemplos que envelhecem. O `model` aceita os apelidos `sonnet`, `opus`, `haiku`, um
identificador completo ou `inherit` (o da sessão). O `effort` vai de `low` a `max`, e um nível que
o modelo não suporta cai para o mais alto que ele suporta. O modelo resolve-se por esta ordem: o
parâmetro da chamada, o ficheiro do agente, a variável `CLAUDE_CODE_SUBAGENT_MODEL`, o da sessão.

## Notas

- O `implementador-ui` não traz ferramenta de browser, porque o nome dela depende da tua instalação:
  junta-a à linha `tools` para a prova visual.
- O Bash dos agentes de leitura (`pesquisador`, `revisor`) serve para comandos de leitura. Se o teu
  projeto tem uma guarda de só leitura para o Bash, aplica-a a eles.
- O campo `skills` pré-carrega o texto da skill ao arrancar o agente, com as skills já instaladas.
  Se as instalaste pelo plugin, o Claude Code mostra-as com o prefixo `agentic-skills:`. Não
  verificámos se a pré-carga encontra `agentic-implement` por esse nome simples: se o agente
  arrancar sem a skill, escreve o nome com o prefixo na linha `skills`.
- Um revisor de uma zona (por exemplo, migrações de base de dados) faz-se copiando o `revisor.md`:
  muda o `name` e a `description`, e escreve no corpo o que essa zona pede, mantendo a lista só de
  leitura.
