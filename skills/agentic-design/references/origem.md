# Origem

A `agentic-design` é a dona do método de UI deste conjunto: perguntas de UI, 2–3 variantes
estruturalmente diferentes, construção dentro do design system do projeto, bloqueios contra a estética
genérica de IA com um detetor mecânico, e prova no browser. A `agentic-feature` chama-a nos passos de UI.
Este ficheiro diz de onde vêm as fontes e porque o método é assim.

## Fontes

| Fonte | O que veio |
|---|---|
| Galeria Uiverse, [`uiverse-io/galaxy`](https://github.com/uiverse-io/galaxy/tree/adbd2adde0a299a3956ea288fb444ec01891ca41) (MIT, [licença](../licenses/LICENSE-uiverse-galaxy)) | os 34 conceitos de `references/mecanismos.md`, reescritos como princípios, sem código copiado; cada um liga ao ficheiro de origem nesse commit |
| Normas e documentação da plataforma web: W3C WCAG 2.2, web.dev Baseline, MDN, webstatus.dev e o projeto Interop | o instantâneo datado `references/plataforma-web-2026-10.md` (Baseline, CSS, HTML e DOM, acessibilidade, desempenho, Interop) e o reflow da WCAG 2.2 no `references/ui-sem-slop.md` |
| Trabalho próprio | os bloqueios B1–B24 (`references/ui-sem-slop.md`), o detetor (`scripts/`, com os testes e as fixtures, medido contra uma app real) e os casos de avaliação (`evals/cases.json`) |

## Porquê este método

- **O estilo é livre; os tiques não.** Composição, tipografia, cor e personalidade escolhem-se dentro do
  sistema do projeto. Bloqueia-se só o que denuncia «feito por IA», e cada bloqueio diz como se reconhece,
  porque é mau e uma saída possível. Uma lista de gostos não se verifica; um bloqueio com o seu
  «Reconhece-se» verifica-se, e o detetor aplica-o sem opinião.
- **Gradientes decorativos, texturas, vidro atrás do conteúdo, fios a fazer de estrutura e ações
  delimitadas por uma linha** são bloqueios (B1, B21, B22, B4 e B20), com uma saída explícita quando o
  projeto os decide: `slop-ok: <motivo>` no código, ou a exceção escrita no `DESIGN.md`.
- **2–3 variantes que discordam na estrutura**, em vez de duas quase iguais: quem escolhe vê o que perde
  em cada uma, com capturas.
- **Referências são produtos maduros da categoria, não galerias.** As galerias de inspiração são de onde
  os tiques vêm: por isso a skill não traz a biblioteca da galeria (um índice de milhares de candidatos
  e a sua curadoria), só os 34 conceitos, como texto.
- **A marca vive no projeto.** Cores, materiais, navegação e exceções de cor são do design system e do
  `DESIGN.md` de cada projeto; esta skill não traz marca nenhuma.
- **Uma regra nova do detetor nasce como aviso** e só sobe a bloqueio depois de afinada contra um produto
  bem desenhado, ou quando é exata.
