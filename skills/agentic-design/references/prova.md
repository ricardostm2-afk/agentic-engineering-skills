# Prova de UI

Antes de declarar qualquer UI «vista» ou «feita»: nas capturas das variantes, na verificação da
implementação e na revisão. Uma diferença visual que o humano não aprovou não fica autorizada por
passar nos testes.

## 1. Evidência proporcional

| Dimensão | Como observar | Não confundir com |
|---|---|---|
| Direção | Tese ligada à tarefa; diferença estrutural entre as variantes | Trocar cores ou prometer «premium» |
| Composição | Captura no contexto da app, dados com a densidade real e conteúdo fictício | Uma demo isolada e vazia |
| Legibilidade | Contraste sobre fundos compostos e estados reais; texto longo; zoom e reflow | A cor nominal isolada, ou uma certificação WCAG integral |
| Interação | Teclado, foco e retorno, erro, seleção e estado, no browser | Renderização no servidor ou uma captura |
| Movimento e custo | Movimento reduzido, toque, estabilidade, e medição quando há animação ou efeitos de material | «É só CSS, logo é barato» |
| Implementação | Tipos, testes, contratos, importações e dependências relevantes | O detetor de estilo |

## 2. Capturar

**Quanto capturar.** Numa correção, uma captura do ecrã apontado, antes e depois, no tema e na
resolução do report; com e sem dados só se a correção mexe nesse estado. A matriz completa
(estados, resoluções, temas, teclado) só num ecrã novo ou num redesenho: é o parágrafo «A matriz
completa» a seguir e o teclado do §3. O resto do §2 vale também para as capturas de uma correção.

**A matriz completa.** Captura com dados cheios e com dados vazios (num ecrã de um só registo, como
a página de uma encomenda, em vez de vazio, os estados combinados nas perguntas de UI), em cada
resolução-alvo combinada (na falta, 1366×768 e 1920×1080; mais 390×844 se há uso em telemóvel) e em
cada tema que o projeto tem (claro e escuro, se existem os dois: nunca se aprova um sem ver o
outro). Com painéis laterais, captura também com eles abertos: a largura que conta é a que sobra.

Usa o que existir na sessão ou no projeto, por esta ordem: a ferramenta de browser da sessão; o
Playwright do projeto
(`npx playwright screenshot --viewport-size "1366, 768" --full-page <url> <ficheiro>.png`); outro
browser sem cabeça já instalado. Não instales ferramentas globais sem OK.

Para trocar de tema: se o tema segue `prefers-color-scheme`, `--color-scheme dark` no Playwright
(ou `Emulation.setEmulatedMedia` por CDP); senão, o mecanismo da app (classe ou atributo na raiz,
definição do utilizador, ou um `?tema=` que o protótipo respeita). Confirma a olho na imagem que o
tema mudou.

Armadilhas conhecidas:
- **Tamanho da janela ≠ viewport.** Um browser sem cabeça com `--window-size=390,844` pode
  respeitar uma largura mínima de janela e desenhar a página mais larga: sai um PNG 390×844 com
  o conteúdo cortado. Emula o viewport (o `viewport` do Playwright, ou
  `Emulation.setDeviceMetricsOverride` por CDP) e mede na página
  `document.documentElement.scrollWidth === clientWidth` (e `clientWidth` igual à largura pedida).
- **Ferramenta que só grava na sua pasta.** Algumas ferramentas de browser só escrevem ficheiros
  dentro da sua própria raiz: grava lá e copia para a pasta indicada.
- **A barra do protótipo** (o seletor de variantes da `prototype`) fica por cima do ecrã: esconde-a
  nas capturas (ex.: um parâmetro `&semBarra=1` que o protótipo respeita).
- **Imagens muito altas** podem ser recusadas por algumas ferramentas de envio: exporta em JPG com
  ~1800 px de largura e parte em pedaços de ≤ ~3600 px de altura quando precisas de as enviar.

Verifica cada imagem antes de a mostrar (abre-a): texto cortado, deslocamento horizontal,
elementos sobrepostos ou fontes em falta invalidam a captura. Regista as dimensões, o tema e o
conteúdo de cada uma.

## 3. Medir no browser

Mede o que muda, na app a correr:
- o primeiro ecrã, na resolução real: o trabalho do momento está lá sem scroll;
- o reflow, da menor largura suportada (320 px, se o produto a suporta) à maior, sem scroll
  horizontal da página (`ui-sem-slop.md` §3);
- o contraste no valor pintado (`getComputedStyle`) sobre o fundo real, em cada tema, e não no
  token;
- o teclado: a ordem do foco, o foco visível, Enter e Escape;
- os alvos de clique e toque, e os estados (erro, seleção, desativado, a carregar).

Uma captura não prova interação: num ecrã interativo, clica e confirma que o estado muda, e conta
os erros de consola. Mede pela tarefa (cliques, nomes visíveis, linhas que cabem), não por um
número substituto. Cada mudança de design traz esse número, antes e depois: «está mais bonito»
sozinho não a justifica. O detetor é um chão de estilo, não uma auditoria WCAG nem prova visual.

## 4. Comparar a implementação com a variante

A variante escolhida é a referência: as capturas da app real, nos mesmos estados, larguras e
temas, põem-se ao lado das da variante. Cada diferença não combinada é um achado; o detetor volta
a correr depois das correções e sai 0 nas linhas do diff.

## 5. Estado honesto de saída

- **Proposto**: só raciocínio ou código estático.
- **Visto**: imagem renderizada e inspecionada, com dimensões, tema e conteúdo registados.
- **Exercitado**: interações concretas testadas no browser, incluindo os negativos relevantes.
- **Adotado**: decisão do humano obtida e código integrado no âmbito autorizado; não é sinónimo
  de «visto».

Fala da amostra e do que foi medido de facto. «Sem achados nesta revisão» é verificável; «design
excelente garantido» ou «zero estética de IA» não são. A entrega diz a direção, a razão das
combinações, os caminhos do código e das capturas, as provas com os resultados e o que ficou por
verificar.
