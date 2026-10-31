# Dados: o esquema 2

O agente escreve um JSON fora do repo (a pasta temporária da sessão). O `scripts/gerar-pagina.mjs`
valida-o, com a cena se houver, e põe-no na página. O validador recusa e nunca corrige: cada linha
de erro diz o campo e o que falha, e quem corrige os dados és tu.

## Esquema

```json
{
  "versao": 2,
  "titulo": "2 a 4 palavras",
  "pergunta": "o pedido, por palavras do agente",
  "tema": "codigo|geral",
  "area": "os caminhos explicados (só codigo)",
  "base": "<sha do código lido> (só codigo)",
  "fontes": [{ "url": "https://…", "titulo": "…", "lido_em": "AAAA-MM-DD" }],
  "perfil": "A|B|C",
  "granularidade": "blocos|componentes|detalhe",
  "objetivo": "perceber|resolver|mudar",
  "intro": { "simples": "…", "tecnico": "…" },
  "tipos": [{ "id": "codigo", "nome": "Código" }],
  "nos": [{ "id": "…", "curto": "…", "tipo": "codigo", "ficheiros": ["caminho:12-30"], "simples": "…", "tecnico": "…", "risco": "baixo|medio|alto" }],
  "vistas": [
    { "id": "v1", "tipo": "grafo", "titulo": "…", "nos": ["…"], "ligacoes": [{ "de": "…", "para": "…", "tipo": "lê", "modo": "sincrona|assincrona", "ref": "caminho:40" }] },
    { "id": "v2", "tipo": "camadas", "titulo": "…", "camadas": [{ "nome": "…", "nos": ["…"] }], "ligacoes": [] },
    { "id": "v3", "tipo": "sequencia", "titulo": "…", "participantes": ["…"], "mensagens": [{ "id": "m1", "de": "…", "para": "…", "texto": "…", "modo": "sincrona|assincrona" }] },
    { "id": "v4", "tipo": "estados", "titulo": "…", "estados": ["…"], "inicial": "…", "transicoes": [{ "de": "…", "para": "…", "evento": "…" }] },
    { "id": "v5", "tipo": "linha-do-tempo", "titulo": "…", "eventos": [{ "no": "…", "quando": "…" }] },
    { "id": "v6", "tipo": "cena", "titulo": "…", "nos": ["…"] }
  ],
  "passos": [{ "titulo": "…", "vista": "v1", "realca": ["…"], "citacoes": ["caminho:10-20", "https://…"], "simples": "…", "tecnico": "…" }],
  "conceitos": [{ "termo": "…", "simples": "…", "tecnico": "…" }]
}
```

Uma página leva de 1 a 4 vistas, e os campos de cada tipo estão em `references/vistas.md`. O `risco`
e o `modo` só existem com o perfil C (`references/perfis.md`). Uma vista `cena` pede o ficheiro da
cena (`references/cena.md`).

## Regras do validador

- **Listas fechadas.** `versao` é 2. `tema` é `codigo` ou `geral`; `perfil` é `A`, `B` ou `C`;
  `granularidade` é `blocos`, `componentes` ou `detalhe`; `objetivo` é `perceber`, `resolver` ou `mudar`.
- **Título.** De 2 a 4 palavras: é o `<title>` da página e o nome do Artifact, escapado pelo gerador.
  A frase longa vai em `pergunta`.
- **Tema.** `codigo` exige `area` e `base`. `geral` exige `fontes` não vazio.
- **Fontes.** Cada uma com `url` https, `titulo` e `lido_em` (uma data `AAAA-MM-DD` que exista).
  Cada URL citado nos passos existe em `fontes`.
- **Tipos.** De 1 a 6, com ids únicos e `nome`.
- **Nós.** De 1 a 60, com ids únicos. O `tipo` existe em `tipos`. Com `granularidade: blocos`, são
  de 5 a 8. Cada nó tem `id`, `curto`, `tipo`, `simples` e `tecnico`.
- **Ids.** Os ids de `nos`, de `vistas` e de `mensagens` não se repetem entre si.
- **Vistas.** De 1 a 4. O `tipo` é do catálogo, os campos são os do esquema, e cada id citado existe em
  `nos`. Os limites de cada tipo:
  - `grafo`: `nos` opcional (por omissão, todos); `ligacoes` com `de` e `para` diferentes e dentro da vista;
  - `camadas`: de 2 a 6 camadas, cada nó numa só camada;
  - `sequencia`: de 2 a 8 participantes e de 1 a 30 mensagens, com `de` e `para` entre os participantes;
  - `estados`: de 2 a 16 estados; `inicial` é um deles; as transições são entre eles (`de` igual a `para`
    é permitido);
  - `linha-do-tempo`: de 2 a 30 eventos;
  - `cena`: `nos` de 1 a 40; obriga a `--cena`. Uma página tem no máximo uma vista `cena`.
- **Textos.** Têm `simples` e `tecnico`, não vazios: `intro`, cada nó, cada passo e cada conceito.
- **Passos.** De 1 a 12. Cada um tem uma `vista` que existe e um `realca` com ids dessa vista: nós ou,
  numa sequência, mensagens.
- **Citações.** Pelo menos uma por passo. Cada uma é `caminho:N`, `caminho:N-M` (com M a partir de N)
  ou um URL de `fontes`. Com `tema: codigo`, cada passo tem pelo menos uma `caminho:N`. O `ref` de
  uma ligação e cada `ficheiros` de um nó têm só a forma `caminho:N` ou `caminho:N-M`: um URL não
  serve aí, e a fonte de uma ligação cita-se no passo. O caminho é relativo à raiz do que leste: sem
  esquema (`javascript:`, `data:`, `C:`), sem `/`, `\` nem `~` no início e sem segmento `..`.
- **Perfil C.** `risco` (nos nós) e `modo` (nas ligações e nas mensagens) só existem com `perfil: C`.
- **Conceitos.** De 0 a 6.
- **Segredos.** O validador recusa os padrões óbvios de chave, como `sk-`, `ghp_`, `AKIA` e
  `-----BEGIN`, nos textos e também nos nomes de campo, e a linha de erro diz onde, sem repetir o
  valor. Os valores dos dados que as outras linhas repetem saem cortados aos 40 caracteres.

O validador não confere que as linhas citadas existem, nem que o texto está certo: cita só linhas
que leste.

## O texto

É texto simples. Só o código entre acentos graves vira `<code>`. A página insere tudo com
`textContent`, nunca como HTML, e o JSON vai na página com o `<` escapado, para um `</script>` num
texto não fechar o bloco. Caminhos e URLs compridos partem-se depois de «/».

Os dados não levam segredos nem dados pessoais: nenhum valor de `.env`, chave, token ou dado de
pessoas; só nomes de ficheiros, peças e explicações.

## O que o gerador responde

```text
node <skill>/scripts/gerar-pagina.mjs <dados.json> [--cena <cena.js>] --saida <pagina.html>
```

- **0**: escreveu a página.
- **1**: uma linha por regra violada em stderr, e nada escrito. Os dados dão `campo: o que falha`, por
  exemplo `passos[2].realca[0]: "fantasma" não é um elemento da vista "v1"`; a cena dá
  `cena:<linha>: o que falha`. Corrige e repete.
- **2**: erro de uso ou de leitura: argumentos, ficheiro em falta, JSON inválido, escrita, ou um
  modelo sem lugar para a cena.
