# Vistas: qual escolher e que campos leva

Uma página leva de 1 a 4 vistas, escolhidas pelo que a explicação precisa. Cada vista mostra os
mesmos nós por um ângulo diferente, e cada passo do documento aponta para uma (`vista`) e realça
elementos dela (`realca`). Uma vista a mais é ruído a mais: uma vista chega na maioria
das explicações, e uma segunda só entra quando responde a uma pergunta que a primeira não responde.

Os campos comuns são `id` (único entre nós, vistas e mensagens), `tipo` e `titulo`. Os campos de cada
tipo estão abaixo, e as regras e os limites estão em `references/dados.md`. Todas as vistas usam os
mesmos tokens e o mesmo realce, e mostram os rótulos como texto. Sem WebGL, cada vista tem a sua
versão em texto.

## Qual escolher

| A explicação precisa de mostrar | Vista |
|---|---|
| peças e quem depende de quem | `grafo` |
| uma pilha: interface, servidor, dados; as camadas de um protocolo | `camadas` |
| quem fala com quem, por ordem no tempo | `sequencia` |
| um ciclo de vida, com estados e transições | `estados` |
| acontecimentos por ordem: a história de uma decisão, as fases de um processo | `linha-do-tempo` |
| uma forma que nenhuma das anteriores desenha: uma árvore, uma forma física, um mecanismo, um espaço | `cena` |

Escolhe a primeira que serve. Duas vistas do mesmo tipo na mesma página raramente valem a pena.
Combinações que costumam valer: `grafo` com `sequencia` (as peças e depois o que passa entre elas),
`camadas` com `estados` (onde as coisas vivem e como mudam).

## grafo

Serve para peças e dependências: módulos, serviços, conceitos ligados entre si. Dispõe os nós por
forças (a do `3d-force-graph`) e, em Plano, no ecrã sem profundidade. A versão em texto é a lista das
ligações.

Campos: `nos` (opcional; por omissão, todos os nós do documento) e `ligacoes`, cada uma com `de`,
`para`, `tipo` (o verbo da ligação: «lê», «chama», «guarda em»), e opcionalmente `ref` (`caminho:N`)
e `modo` (só no perfil C). `de` e `para` são diferentes e estão na vista.

```json
{ "id": "v1", "tipo": "grafo", "titulo": "As peças",
  "nos": ["carrinho", "preco", "cupao"],
  "ligacoes": [{ "de": "carrinho", "para": "preco", "tipo": "pede o preço a", "ref": "src/carrinho.ts:14" }] }
```

## camadas

Serve para uma pilha, de cima para baixo, pela ordem dos dados: as placas empilhadas, os nós de cada
camada em fila sobre a placa e o nome da camada à esquerda. As ligações vão em linha reta. A versão em
texto é a lista por camada, com as ligações.

Campos: `camadas` (de 2 a 6, cada uma com `nome` e `nos`; cada nó numa só camada) e `ligacoes`
(opcionais, entre nós das camadas).

```json
{ "id": "v2", "tipo": "camadas", "titulo": "Da página aos dados",
  "camadas": [{ "nome": "Interface", "nos": ["ecra"] }, { "nome": "Servidor", "nos": ["api"] }, { "nome": "Dados", "nos": ["base"] }],
  "ligacoes": [{ "de": "ecra", "para": "api", "tipo": "pede a" }] }
```

## sequencia

Serve para quem fala com quem, por ordem. Os participantes ficam em fila, cada um com um poste e o
nome no topo; as mensagens descem pela ordem, em seta de `de` para `para`, com o texto a meio, e as
assíncronas a tracejado. A versão em texto é a lista numerada das mensagens.

Campos: `participantes` (de 2 a 8 ids de nós) e `mensagens` (de 1 a 30, cada uma com `id`, `de`, `para`,
`texto` e, só no perfil C, `modo`). Um passo realça nós e mensagens.

```json
{ "id": "v3", "tipo": "sequencia", "titulo": "Quem fala com quem",
  "participantes": ["ecra", "api"],
  "mensagens": [{ "id": "m1", "de": "ecra", "para": "api", "texto": "Pede o total" },
                { "id": "m2", "de": "api", "para": "ecra", "texto": "Devolve o total" }] }
```

## estados

Serve para um ciclo de vida: o que pode estar, e o que o faz mudar. Os estados ficam num anel, as
transições em arco com ponta de seta e o evento a meio, a transição para si mesmo em laço e o estado
inicial com a palavra «inicial» no rótulo. A versão em texto é a lista das transições, com o inicial à
cabeça.

Campos: `estados` (de 2 a 16 ids de nós), `inicial` (um dos estados) e `transicoes`, cada uma com `de`,
`para` e `evento`. Os estados são nós do documento, por isso levam os dois textos como os outros.

```json
{ "id": "v4", "tipo": "estados", "titulo": "A vida de um pedido",
  "estados": ["aberto", "pago", "enviado"], "inicial": "aberto",
  "transicoes": [{ "de": "aberto", "para": "pago", "evento": "pagamento confirmado" },
                 { "de": "pago", "para": "enviado", "evento": "sai do armazém" }] }
```

## linha-do-tempo

Serve para acontecimentos por ordem: a história de uma decisão, as fases de um processo. Em ecrã largo,
um eixo horizontal com uma marca por evento, o `quando` por cima e o nome curto do nó por baixo,
alternando a altura para não colidirem; abaixo de 520 px, com 3 eventos ou mais, o eixo é vertical, de
cima para baixo, com o `quando` à esquerda e o nome à direita. A versão em texto é a lista por ordem.

Campos: `eventos` (de 2 a 30, cada um com `no` e `quando`). O `quando` é texto livre («1998», «fase 2»,
«depois do pagamento»); a ordem é a da lista.

```json
{ "id": "v5", "tipo": "linha-do-tempo", "titulo": "Como foi decidido",
  "eventos": [{ "no": "proposta", "quando": "março" }, { "no": "revisao", "quando": "abril" }] }
```

## cena

Só quando nenhuma das anteriores desenha o que a explicação precisa: uma árvore, uma forma física, um
mecanismo, um espaço. Escreves tu uma função `cena(ctx)` em three.js, dentro da moldura da página, e o
gerador valida-a antes de a escrever (`references/cena.md`). É a vista mais cara: o código é teu para
manter e a página trata-a como código de fora. Uma cena a fazer de grafo ou de sequência é sinal de
que devias ter usado a vista do catálogo.

Campos: `nos` (de 1 a 40 ids de nós), e o ficheiro da cena em `--cena`. No máximo uma por página.
Cada nó da vista tem de ser registado na cena com `ctx.elemento`.

```json
{ "id": "v6", "tipo": "cena", "titulo": "A árvore", "nos": ["raiz", "ramo", "folha"] }
```
