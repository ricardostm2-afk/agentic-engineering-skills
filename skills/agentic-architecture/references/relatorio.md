# Relatório de arquitetura

Para o passo 3. O relatório é uma página HTML autónoma. O Tailwind e o Mermaid vêm de CDN: o
Mermaid trata dos diagramas em forma de grafo, e divs feitos à mão e SVG inline tratam dos visuais
mais editoriais (diagramas de massa, cortes). Mistura os dois: só com Mermaid, fica genérico.

É um ecrã que o humano lê, por isso as regras de UI são as da `agentic-design` («Estilo», abaixo).
Com a ferramenta Artifact, o contrato da skill `artifact-design` ganha a este modelo onde diferem
(os scripts e o tema, por exemplo): adapta o esqueleto a ele.

## Esqueleto

```html
<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Revisão de arquitetura de {{repo}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* Os tokens da página, um trabalho cada; texto e vazamento medidos sobre o fundo branco. */
      :root {
        --fundo: #ffffff;
        --texto: #0f172a;
        --vazamento: #dc2626;
        --profundo: #1e293b;
      }
      body { background: var(--fundo); color: var(--texto); }
      .costura { stroke-dasharray: 4 4; }
      .vazamento { stroke: var(--vazamento); }
      .profundo { background: var(--profundo); color: var(--fundo); }
    </style>
  </head>
  <body class="font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidatos" class="space-y-16">...</section>
      <section id="recomendacao">...</section>
    </main>
  </body>
</html>
```

As cores são as do esqueleto do upstream, com o contraste medido sobre `#ffffff`: o vermelho dá
4,83:1, e os dois escuros mais de 14:1. Um acento ou um âmbar novos entram como token, com o
contraste medido da mesma maneira.

## Cabeçalho

O nome do repo, a data, a janela do histórico que o passo 2 declarou e uma legenda compacta: caixa
cheia = módulo, linha tracejada = costura, seta vermelha = vazamento, caixa escura e grossa =
módulo profundo. Sem parágrafo de introdução: logo os candidatos.

## Cada candidato

Os diagramas carregam o peso. A prosa é pouca, simples, e usa os termos de
`references/vocabulario.md` sem cerimónia. Cada candidato é um `<article>` sem caixa à volta,
separado dos outros pelo espaço e por um título forte:

- **Título**: curto, nomeia o aprofundamento («Juntar a entrada de encomendas»).
- **Força e categoria**: por extenso, na cor do texto, logo abaixo do título («Forte · portas e
  adaptadores»). A força é `Forte`, `Vale explorar` ou `Especulativo`; a categoria das
  dependências vem de `references/aprofundar.md`.
- **Ficheiros**: lista em monoespaçado, `font-mono text-sm`.
- **Antes e depois**: o centro do candidato, em duas colunas lado a lado (padrões abaixo).
- **Problema**: uma frase. O que dói.
- **Solução**: uma frase. O que muda.
- **Prova**: os números do passo 2, cada um com o comando ou o `ficheiro:linha` de onde veio:
  commits na janela, chamadores, usos dos internos, mudança conjunta, o resultado do teste de
  apagar. O que ficou por medir diz-se aqui.
- **Ganhos**: tópicos de 6 palavras no máximo, nos termos do vocabulário («os testes atravessam
  uma interface», «o preço deixa de vazar», «apagar 4 invólucros rasos»).
- **ADR** (se se aplica): uma linha que começa por «ADR:», em âmbar.

Sem parágrafos de explicação. Se o diagrama precisa de um parágrafo para se perceber, redesenha o
diagrama.

## Padrões de diagrama

Escolhe o padrão que serve o candidato e varia: diagramas todos iguais escondem o que cada
candidato tem de próprio.

### Grafo Mermaid (para dependências e fluxo de chamadas)

Um `flowchart` ou `graph` quando o ponto é «X chama Y, que chama Z, e vê a confusão». Vai direto
na secção do candidato, sem outra caixa à volta. Usa `classDef` para pintar de vermelho as arestas
que vazam e de escuro o módulo profundo, com os mesmos valores dos tokens. Os diagramas de
sequência servem para «antes: 6 idas e voltas; depois: 1».

```html
<pre class="mermaid">
  flowchart LR
    A[EntradaEncomendas] --> B[ValidadorEncomendas]
    B --> C[RepositorioEncomendas]
    C -.vaza.-> D[ClientePrecos]
    classDef vazamento stroke:#dc2626,stroke-width:2px;
    class C,D vazamento
</pre>
```

### Caixas e setas à mão (quando o Mermaid não deixa a disposição certa)

Módulos como `<div>` com contorno e rótulo; setas como `<line>` ou `<path>` em SVG inline, por cima
de um contentor `relative`. Serve quando o «depois» deve parecer um só módulo profundo de contorno
grosso, com os internos esbatidos lá dentro, que o Mermaid não desenha com esse peso.

### Corte (para rasos em camadas)

Faixas horizontais empilhadas, uma por camada por onde passa uma chamada. Antes: 6 camadas finas
que não fazem nada. Depois: 1 faixa grossa com a responsabilidade junta.

### Diagrama de massa (para a interface tão larga como a implementação)

Dois retângulos por módulo: a área da interface e a da implementação. Antes: o retângulo da
interface quase tão alto como o da implementação (raso). Depois: interface baixa, implementação
alta (profundo).

### Colapso do grafo de chamadas

Antes: uma árvore de chamadas em caixas encaixadas. Depois: a mesma árvore fechada numa caixa só,
com as chamadas agora internas esbatidas lá dentro.

## Estilo

As regras de UI são as de `<agentic-design>/references/ui-sem-slop.md`, por inteiro: o relatório
é um ecrã para ler. Daí vêm, por exemplo, os rótulos em caixa normal, sem tracking e com 12 px no
mínimo, a força por extenso em vez de pastilhas de cor, a cor chapada em vez de gradientes, e os
candidatos sem cartões. Antes de o mostrar, o detetor dela tem de sair 0 sobre a página:
`node <agentic-design>/scripts/detetar-slop.mjs <ficheiro do relatório>`. Com a página publicada
como Artifact, corre-o sobre o ficheiro local que publicaste.

Dentro dessas regras:

- Editorial, não painel corporativo. Espaço em branco generoso; serifa opcional nos títulos.
- Cor com parcimónia: o vermelho para os vazamentos, o âmbar para os avisos e, no máximo, um
  acento.
- Diagramas com cerca de 320 px de altura, para o antes e o depois caberem lado a lado sem
  deslocar a página.
- Os únicos scripts são o Tailwind e o Mermaid. O resto é estático: sem código de aplicação nem
  interação além da que o Mermaid desenha.

## Recomendação principal

A última secção, com o maior título da página: o nome do candidato, uma frase com o porquê e uma
ligação-âncora para a secção dele.

## Tom

Frases curtas e simples; os substantivos e os verbos da arquitetura vêm de
`references/vocabulario.md`, também o que evitar. A concisão não é desculpa para fugir aos
termos. Sem rodeios nem «vale a pena notar que…»: uma frase que pode ser um tópico vira tópico, e
um tópico que se pode cortar corta-se.
