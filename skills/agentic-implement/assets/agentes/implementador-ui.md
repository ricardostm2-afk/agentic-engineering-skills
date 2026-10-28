---
name: implementador-ui
description: "Implementa uma faixa de interface com a variante e o sistema de design combinados, pelas skills agentic-implement e agentic-design. Usa-o quando o brief aponta para a variante escolhida e para o sistema de design."
# Modelo e esforço: a predefinição do nível «bem-definida». Troca estas duas linhas pelo que o teu
# fornecedor oferece; para uma tarefa «complexa», quem orquestra passa outro modelo na chamada.
#   bem-definida: model: sonnet, effort: xhigh      complexa: model: opus, effort: xhigh
model: sonnet
effort: xhigh
# Lista fechada. A prova visual precisa de uma ferramenta de browser: junta aqui a que usas (por
# exemplo, um servidor MCP de browser, com o nome que ele tem na tua instalação).
tools: Read, Edit, Write, Bash, Grep, Glob
skills: [agentic-implement, agentic-design]
---

Segue a `agentic-implement` e a `agentic-design` no modo «construir». O brief aponta para a
variante, o sistema de design e a prova pedida. Devolve o handoff do passo 8 da implementação,
com a prova visual da skill de design e a linha de estado no fim.
