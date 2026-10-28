# Sistema de memória para o Claude Code

A memória automática do Claude Code guarda factos entre sessões. Este guia é uma maneira de a
manter pequena, arrumada e portátil: um índice curto que se carrega sempre, sub-índices por tema,
um facto por ficheiro e, se quiseres, uma pasta num repositório git privado para a usares em
qualquer PC. Não é uma skill: nada aqui se carrega sozinho. A pasta `modelo/` é o ponto de partida,
vazio, e não traz nenhuma memória.

## O que o Claude Code faz (e o desenho aproveita)

Segundo a documentação do Claude Code sobre memória (lida em 2026-10, versão 2.1):

- A memória de cada projeto vive em `~/.claude/projects/<projeto>/memory/`. O `<projeto>` vem do
  repositório git, por isso todos os worktrees e subpastas do mesmo repositório partilham uma pasta.
- No arranque de cada conversa carregam-se as primeiras 200 linhas, ou os primeiros 25 KB, do
  `MEMORY.md`, o que vier primeiro; o resto é cortado. Os outros ficheiros não se carregam: o Claude
  lê-os a pedido. Por isso o `MEMORY.md` é um índice de uma linha por memória, e não um depósito.
- A memória da sessão principal não entra nos subagentes (só num fork), e outros agentes de código
  não a leem. Uma regra que todos têm de cumprir vive no `CLAUDE.md` ou no `AGENTS.md` do projeto;
  na memória fica só o porquê.
- É local à máquina. A pasta pode mudar com `autoMemoryDirectory` (mais abaixo).

## As camadas

| Camada | O quê | Tamanho-alvo | Quando se lê |
|---|---|---|---|
| 0 | As regras que se cumprem: `CLAUDE.md`, `AGENTS.md`, docs do projeto. Não é memória | sem limite | sempre |
| 1 | `MEMORY.md`: o que orienta qualquer sessão, mais um ponteiro por sub-índice | ~6 KB, ~45 linhas | no arranque |
| 2 | `indice-<tema>.md`: um sub-índice por tema | até ~25 entradas, ~3 KB | antes de mexer na zona |
| 3 | Um facto por ficheiro | 1 a 4 KB | a pedido |
| 4 | `indice-historico.md`: estados que já fecharam | sem limite | a pedido |

## O modelo de pasta

`modelo/` é a pasta vazia para copiar:

| Ficheiro | Para quê |
|---|---|
| `MEMORY.md` | o índice, com a regra de arrumação na 1.ª linha e as duas secções vazias |
| `indice-historico.md` | o sub-índice dos estados fechados, vazio; serve de molde aos outros |
| `README.md` | explica a pasta a quem a abrir no repositório; não é uma memória (o Claude só lê o que o `MEMORY.md` indexa) |
| `.gitignore` | deixa fora do git o lixo do sistema |

O molde de uma memória está em `modelo-de-memoria.md`, ao lado deste guia (de propósito fora de
`modelo/`: um ficheiro que nenhum índice liga seria uma memória órfã). Para criar a pasta:

~~~bash
cp -R memoria/modelo ~/claude-memoria                              # macOS, Linux, WSL
~~~

~~~powershell
Copy-Item -Recurse memoria\modelo $HOME\claude-memoria             # Windows
~~~

## Uma memória: um facto por ficheiro

~~~markdown
---
name: nome-igual-ao-do-ficheiro
description: uma linha que diz o que a memória guarda e quando serve
metadata:
  type: feedback
---

O facto ou a regra, numa ou duas frases.

**Porquê:** o motivo, ou o caso que o mostrou.

**Como aplicar:** quando e onde isto muda o que fazes.

Relacionadas: [[outra-memoria]]
~~~

- `name`: o nome do ficheiro sem `.md`. É também o alvo das ligações.
- `metadata.type`: `user` (quem és, o que sabes, como gostas de trabalhar), `feedback` (correções
  tuas e abordagens que confirmaste), `project` (trabalho em curso, prazos e decisões que o código
  e o git não dizem) ou `reference` (onde está uma informação fora do projeto). O Claude Code
  acrescenta sozinho campos como `modified` quando escreve: não os escrevas à mão.
- Ligações `[[nome]]` apontam para outra memória pelo `name`. Uma ligação sem ficheiro é um erro.
- Um facto por ficheiro. Se são dois, são dois ficheiros. Datas por extenso (`2026-10-28`), nunca
  «ontem». Não guardes o que o código ou o git já dizem (arquitetura, caminhos, correções).
- Cada memória aparece numa só linha de um só índice, assim:
  `- [Título](ficheiro.md) — gancho de uma linha`. Sem órfãs e sem ligações em falta.

## Quando uma memória sobe e quando desce

- **Memória nova** entra na linha do sub-índice do tema, nunca direta no `MEMORY.md`.
- **Sobe ao `MEMORY.md`** só se orienta qualquer sessão (quem és, o que é o produto, onde vive o
  trabalho), ou se é uma regra tua cuja falta custa caro (dados perdidos, dinheiro, uma rejeição
  repetida) e não está já num ficheiro de regras. Para entrar uma, sai outra: teto de ~30 linhas.
- **Desce ao sub-índice** quando a regra passa para um ficheiro do projeto (fica só o porquê), ou
  quando já ninguém a precisa sem abrir o tema.
- **Desce ao `indice-historico.md`** quando o estado fecha.
- **Um sub-índice parte-se em dois** a partir de ~25 entradas ou ~3 KB.
- **Subpastas por tema** só passados ~500 ficheiros, e depois de testares que o Claude as lê: a
  documentação mostra uma pasta plana.

## O que nunca entra

- Segredos: palavras-passe, chaves, tokens, certificados, endereços com credenciais.
- Dados de saúde, e dados pessoais de terceiros ou teus que não mudem nenhuma decisão (nomes,
  moradas, números de identificação, e-mails pessoais). Se um identificador importa, escreve um
  `<marcador>`.
- O que o código ou o git já dizem.

Um repositório privado não torna isto aceitável: o histórico do git guarda tudo para sempre. Antes
de cada commit, corre um detetor de segredos (por exemplo `gitleaks dir . --no-banner`) e procura
e-mails e identificadores à mão.

## Ligar a pasta a um repositório git privado

Para a mesma memória em qualquer PC:

1. Cria um repositório **privado** e vazio no serviço que usas.
2. Copia o `modelo/` (acima), e na pasta nova: `git init -b main`, `git add MEMORY.md README.md
   indice-historico.md .gitignore`, `git commit -m "memória: pasta inicial"`, `git remote add
   origin <url-privada>` e `git push -u origin main`.
3. Em `~/.claude/settings.json` (ou `%USERPROFILE%\.claude\settings.json`):

   ~~~json
   { "autoMemoryDirectory": "~/claude-memoria" }
   ~~~

   O valor é um caminho absoluto ou começa por `~/`.
4. **Testa antes de confiares.** Abre uma sessão nova, pede ao Claude que guarde um facto
   inofensivo e confirma que o ficheiro apareceu em `~/claude-memoria` e que a pasta por omissão não
   recebeu nada. Houve relatos públicos de versões do Claude Code que ignoravam esta definição e
   continuavam a escrever na pasta antiga; se acontecer, as duas pastas divergem em silêncio.
5. Noutro PC: `git clone <url-privada> ~/claude-memoria` e a mesma definição no `settings.json`.
6. Rotina: `git pull` ao abrir sessão; ao fechar, `git status`, `git add <ficheiros>`, `git commit`
   e `git push`. O Claude escreve na pasta mas não faz commits. Num conflito no `MEMORY.md`, ficam
   as duas linhas e a nova passa para o sub-índice do tema.

**Aviso: isto partilha a memória entre projetos.** No `settings.json` do utilizador, o
`autoMemoryDirectory` vale para todos os projetos: todos leem e escrevem a mesma pasta, o
`MEMORY.md` mistura-os e tudo o que escrevem viaja para o mesmo repositório. Não o uses assim com
projetos que não devem ver-se uns aos outros (clientes diferentes, trabalho confidencial). Para um
só projeto, põe a definição no `.claude/settings.local.json` dele (só vale depois de confiares na
pasta). Uma sessão num PC sem a definição continua a usar a pasta por omissão e não vê estas
memórias.

## Manter

De vez em quando pede ao Claude que verifique a estrutura: os `.md` que nenhum índice liga, as
memórias ligadas em dois índices, as ligações `[[…]]` sem ficheiro e o tamanho do `MEMORY.md`. Se
o `MEMORY.md` passar de ~6 KB, é sinal de que há memórias que devem descer a um sub-índice.
