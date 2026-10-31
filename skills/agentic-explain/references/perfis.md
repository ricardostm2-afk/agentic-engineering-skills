# Perfis: o que cada um escreve

A Q2 escolhe o perfil (a linguagem) e a Q3 a granularidade (quantos nós e de que tamanho). Os dois
juntos decidem os textos dos dados. Todos os exemplos abaixo são inventados, sobre uma função que
calcula o total de um carrinho de compras: os teus citam só o que leste.

Cada nó, passo e conceito leva sempre os dois textos, `simples` e `tecnico`. A página troca de um
para o outro com um clique, por isso uma calibração errada corrige-se sem gerar tudo de novo. O
perfil decide qual dos dois a página mostra primeiro (Simples no A, Técnico no B e no C) e como
escreves o primeiro dos dois.

| | A | B | C |
|---|---|---|---|
| Quem é | não conhece os conceitos, ou pede sem jargão | conhece a base, não estes padrões | domina |
| Linguagem | palavras do dia a dia; um termo técnico só depois de explicado | o vocabulário da área; cada termo novo explica-se na primeira vez | técnica e direta; não explica o que o perfil domina |
| Documento | «O que acontece quando …», com metáforas e caixas «Conceito-chave» | o fluxo passo a passo, com as citações e um mini-glossário | os trade-offs, os casos-limite e os pontos de falha, com as citações |
| Granularidade | blocos ou componentes | blocos ou componentes | blocos ou detalhe |
| Só deste perfil | | | `risco` nos nós, `modo` nas ligações e nas mensagens |

## Granularidade

- **blocos** (helicóptero): 5 a 8 nós no total, cada um uma peça grande. O validador recusa fora desse
  intervalo.
- **componentes** (raio-X nos perfis A e B): os ficheiros, os módulos ou as peças do sistema.
- **detalhe** (raio-X no perfil C): as funções, as classes, os estados e os mecanismos finos.

Com mais de 60 nós o validador recusa: agrupa por pasta ou módulo antes de escrever.

## Perfil A: sem jargão por explicar

**Linguagem.** Frases curtas e palavras do dia a dia. Uma metáfora por ideia, e só uma. Um termo
técnico entra depois de a ideia estar explicada, e a sigla nunca vem sozinha. O `tecnico` continua
obrigatório: é o texto de quem clicar em Técnico, e pode ser o do perfil B.

**Documento.** Abre com «O que acontece quando …». Os `conceitos` (até 6) aparecem como caixas
«Conceito-chave» logo depois da introdução. Cada passo traz uma ideia só.

Bom (o `simples` de um nó):

> O programa soma o preço de cada coisa que pôs no carrinho. Se tiver um cupão, tira-lhe o valor
> no fim, como a caixa de um supermercado que passa o cupão depois de somar as compras.

Mau, porque deixa o jargão por explicar:

> A função `calcularTotal` itera o array de linhas e aplica o desconto ao subtotal acumulado.

## Perfil B: o fluxo, com citações

**Linguagem.** O vocabulário da área, sem o das técnicas finas. Um termo novo explica-se na primeira
vez que aparece, e os mais importantes vão para os `conceitos`, que a página mostra como mini-glossário.

**Documento.** O fluxo passo a passo, pela ordem em que as coisas acontecem. Cada passo cita o
ficheiro e as linhas (`caminho:N-M`) de onde saiu.

Bom (o `tecnico` de um passo):

> `calcularTotal` percorre as linhas e soma `preco × quantidade` (`src/carrinho/total.ts:12-20`).
> Só depois aplica o cupão ao subtotal (`src/carrinho/total.ts:22-27`), por isso um cupão nunca
> desconta os portes.

Mau, porque conta o resultado e não o caminho, e não cita nada:

> O carrinho calcula o total corretamente com todas as regras de negócio.

## Perfil C: trade-offs e pontos de falha

**Linguagem.** Técnica e direta. Diz o que cada decisão ganha e o que custa, o que acontece nos
casos-limite (vazio, concorrência, erro) e o que parte primeiro. Não explica o que o perfil domina.

**Documento.** Os trade-offs, os casos-limite e os pontos de falha, com as citações. Cada nó leva
`risco` (`baixo`, `medio` ou `alto`) e o texto diz porquê: a página mostra o risco por cor, tamanho e
palavra, mas a razão é tua. Cada ligação ou mensagem leva `modo` (`sincrona` ou `assincrona`).

Bom (o `tecnico` de um nó de risco `alto`):

> Soma em `number` e arredonda no fim (`src/carrinho/total.ts:30`): dá cêntimos errados com
> centenas de linhas. Trade-off: o arredondamento por linha evitava o erro, mas obrigava a alterar
> a fatura emitida. Falha primeiro com preços de 3 casas decimais.

Mau, porque diz que há risco e não onde, nem o que custa evitá-lo:

> Esta parte é delicada e deve ser revista com cuidado.

## Trocar de perfil

Quem pede outro perfil («explica outra vez em perfil C») não responde às perguntas outra vez: o
agente reescreve os textos e a granularidade com o que já sabe e gera a página de novo. Como os dois
textos de cada nó já existem, a página também deixa o leitor trocar entre Simples e Técnico sem
gerar nada.
