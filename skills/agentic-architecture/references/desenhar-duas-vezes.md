# Desenhar duas vezes

Para o passo 5, quando chega a pergunta da interface do candidato escolhido. Baseado em «Design It
Twice» (Ousterhout): a primeira ideia raramente é a melhor. Os termos são os de
`references/vocabulario.md`.

## 1. O espaço do problema

Antes de lançar subagentes, escreve ao humano o espaço do problema do candidato:

- as restrições que qualquer interface nova tem de cumprir;
- as dependências em que ela se apoia e a categoria de cada uma (`references/aprofundar.md`);
- um esboço de código ilustrativo, só para tornar as restrições concretas: não é uma proposta.

Mostra-o e passa logo ao ponto 2: o humano lê e pensa enquanto os subagentes trabalham.

## 2. Os desenhos

Lança 3 ou mais subagentes em paralelo. Cada um produz uma interface **radicalmente diferente**
para o módulo aprofundado. Sem subagentes, fazes tu os desenhos, um de cada vez, cada um com a
sua restrição.

Cada subagente recebe um brief técnico próprio, independente da explicação do ponto 1: os
caminhos dos ficheiros, os detalhes do acoplamento, a categoria das dependências e o que fica
atrás da costura. O brief leva `references/vocabulario.md` e o glossário do domínio, para os nomes
baterem com a arquitetura e com o domínio, e uma restrição diferente para cada um:

1. «Minimiza a interface: 1 a 3 pontos de entrada, no máximo. Maximiza a alavancagem por ponto de
   entrada.»
2. «Maximiza a flexibilidade: muitos casos de uso e extensão.»
3. «Otimiza para quem chama mais: o caso por omissão fica trivial.»
4. (Se se aplica.) «Desenha à volta de portas e adaptadores para as dependências que atravessam a
   costura.»

Cada desenho traz:

1. a interface (tipos, entradas, parâmetros, e também invariantes, ordem e modos de erro);
2. um exemplo de uso por quem chama;
3. o que a implementação esconde atrás da costura;
4. a estratégia das dependências e os adaptadores (`references/aprofundar.md`);
5. os compromissos: onde a alavancagem é alta e onde é fina.

## 3. Mostrar e comparar

Mostra os desenhos um a um, para o humano absorver cada um, e depois compara-os em prosa por
**profundidade** (alavancagem na interface), **localidade** (onde a mudança se concentra) e
**posição da costura**.

Depois da comparação, dá a tua recomendação: o desenho mais forte e porquê, ou um híbrido, quando
partes de desenhos diferentes combinam bem. Opinião firme: o humano quer uma leitura forte, não um
menu. A escolha volta ao grill (`references/grill.md`) como a pergunta seguinte, com esta
recomendação.

Feito quando o humano tem os desenhos, a comparação e a recomendação à frente, e a pergunta da
escolha está feita.
