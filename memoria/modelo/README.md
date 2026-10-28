# Memórias do Claude Code

Pasta de memórias automáticas do Claude Code, versionada com git para a usar em qualquer PC. Este
`README.md` não é uma memória: o Claude só lê o que o `MEMORY.md` indexa. O guia completo está em
`memoria/GUIA.md` do repositório agentic-skills.

## Estrutura

- `MEMORY.md`: índice curto, carregado em todas as sessões (as primeiras 200 linhas ou 25 KB).
- `indice-<tema>.md`: um sub-índice por tema, lido antes de mexer na zona. Até ~25 entradas.
- Todos os outros `.md`: um facto por ficheiro, com `name`, `description` e `metadata.type`
  (`user`, `feedback`, `project` ou `reference`), e ligações `[[nome]]` para memórias relacionadas.
- Pasta plana: subpastas só passados ~500 ficheiros e depois de testar que o Claude as lê.

## Regras de manutenção

1. Memória nova entra na linha do sub-índice do tema, nunca direta no `MEMORY.md`.
2. Sobe ao `MEMORY.md` só o que orienta qualquer sessão, ou uma regra cuja falta custa caro. Para
   entrar uma, sai outra.
3. Desce ao sub-índice quando a regra passa para um ficheiro do projeto (fica só o porquê); desce ao
   `indice-historico.md` quando o estado fecha.
4. Cada memória está em exatamente uma linha de índice. Sem órfãs, sem ligações em falta.

## O que nunca entra

Segredos (palavras-passe, chaves, tokens), dados de saúde e dados pessoais. Um identificador que não
muda nenhuma decisão fica como `<marcador>`. Antes de cada commit: um detetor de segredos
(`gitleaks dir . --no-banner`) e uma procura por e-mails.

## Usar noutro PC

~~~bash
git clone <url-privada> ~/claude-memoria
~~~

Depois, em `~/.claude/settings.json` desse PC: `"autoMemoryDirectory": "~/claude-memoria"`. Isto
vale para todos os projetos dessa conta. `git pull` ao abrir a sessão; ao fechar, `git status`,
`git add <ficheiros>`, `git commit` e `git push`.
