# Vocabulário de arquitetura

A fonte única dos termos com que se desenham módulos e interfaces: nesta skill, na
`agentic-feature` (o plano), na `agentic-implement` (as costuras dos testes) e na
`agentic-project` (a fase 3). Usa-os tal e qual: a linguagem consistente é o que faz o vocabulário
servir. Cada termo diz o que evitar, porque a palavra evitada quer dizer outra coisa ou quer
dizer menos.

## Termos

**Módulo**: tudo o que tem uma interface e uma implementação, a qualquer escala: uma função, uma
classe, um pacote, uma fatia que atravessa camadas. _Evitar_: unidade, componente, serviço, e
camada ou invólucro quando queres dizer módulo.

**Interface**: tudo o que quem chama tem de saber para usar o módulo bem: a assinatura dos tipos,
e também as invariantes, a ordem das chamadas, os modos de erro, a configuração exigida e o
desempenho. _Evitar_: API, assinatura (só cobrem a superfície dos tipos).

**Implementação**: o que está dentro do módulo, o corpo do código. Distinta de **adaptador**: uma
coisa pode ser um adaptador pequeno com uma implementação grande (um repositório Postgres) ou um
adaptador grande com uma implementação pequena (um duplo em memória). Diz «adaptador» quando o
tema é a costura, e «implementação» nos outros casos.

**Profundidade**: alavancagem na interface: quanto comportamento quem chama (ou um teste) consegue
exercitar por cada unidade de interface que tem de aprender. Um módulo é **profundo** quando muito
comportamento fica atrás de uma interface pequena, e **raso** quando a interface é quase tão
complexa como a implementação.

**Costura** (_seam_, de Michael Feathers): um sítio onde se muda o comportamento sem editar nesse
sítio; o lugar onde vive a interface de um módulo. Onde pôr a costura é uma decisão própria,
separada do que fica atrás dela. _Evitar_: fronteira ou limite como sinónimo de costura ou de
interface (em DDD a palavra já é do «bounded context»).

**Adaptador**: uma coisa concreta que satisfaz uma interface numa costura. Diz o papel (que lugar
ocupa), não a substância (o que tem dentro).

**Porta**: a interface que se define numa costura para uma dependência do outro lado da rede ou
fora do teu controlo; o módulo profundo fica dono da lógica e o transporte entra como adaptador
(`references/aprofundar.md`, categorias 3 e 4).

**Alavancagem**: o que quem chama ganha com a profundidade: mais capacidade por unidade de
interface aprendida. Uma implementação paga-se em N sítios que a chamam e em M testes.

**Localidade**: o que quem mantém ganha com a profundidade: a mudança, os defeitos, o conhecimento
e a verificação concentram-se num sítio, em vez de se espalharem pelos chamadores. Corrigido uma
vez, corrigido em todo o lado.

**Aprofundar**: o refactor que troca módulos rasos por um módulo profundo. Um **candidato** é uma
oportunidade de aprofundar, com a prova do atrito que a justifica.

**Atrito**: o que a arquitetura cobra a quem muda o código: saltar entre muitos módulos pequenos
para perceber um conceito, defeitos que vivem na forma como as funções são chamadas, acoplamento
que vaza pela costura, partes difíceis de testar pela interface que têm.

**Glossário do domínio**: o ficheiro de termos do projeto (`GLOSSARIO.md`, `GLOSSARY.md` ou o que
o `AGENTS.md` nomear). Dá os nomes dos módulos e das costuras; este vocabulário dá os nomes da
arquitetura. Se o glossário define «Encomenda», diz «o módulo de entrada de encomendas», e não o
nome da classe nem «o serviço de encomendas».

## Profundo e raso

**Módulo profundo** = interface pequena + muita implementação:

```
┌──────────────────────────┐
│    Interface pequena     │  ← poucas entradas, parâmetros simples
├──────────────────────────┤
│                          │
│  Implementação profunda  │  ← a lógica complexa fica escondida
│                          │
└──────────────────────────┘
```

**Módulo raso** = interface grande + pouca implementação (a evitar):

```
┌──────────────────────────────────┐
│         Interface grande         │  ← muitas entradas, parâmetros complexos
├──────────────────────────────────┤
│  Implementação fina              │  ← só passa a chamada
└──────────────────────────────────┘
```

Ao desenhar uma interface, pergunta: dá para ter menos entradas? Parâmetros mais simples? Esconder
mais complexidade lá dentro?

## Princípios

- **A profundidade é da interface, não da implementação.** Um módulo profundo pode ser feito, por
  dentro, de peças pequenas, substituíveis e com duplos; só que não fazem parte da interface. Um
  módulo pode ter **costuras internas** (privadas da implementação, usadas pelos testes dele) além
  da **costura externa**, na interface.
- **O teste de apagar.** Imagina o módulo apagado. Se a complexidade desaparece, era só passagem.
  Se reaparece espalhada por N chamadores, estava a merecer o lugar.
- **A interface é a superfície de teste.** Quem chama e quem testa atravessam a mesma costura. Se
  queres testar para lá da interface, o módulo tem provavelmente a forma errada.
- **Um adaptador é uma costura hipotética; dois são uma costura real.** Uma costura só entra
  quando algo muda através dela (em geral, o adaptador de produção e o de teste).

## Desenhar para testar

1. **Recebe as dependências, não as cria.**

   ```typescript
   // Testável
   function processarEncomenda(encomenda, gatewayDePagamento) {}

   // Difícil de testar
   function processarEncomenda(encomenda) {
     const gateway = new StripeGateway();
   }
   ```

2. **Devolve resultados, não produz efeitos laterais.**

   ```typescript
   // Testável
   function calcularDesconto(carrinho): Desconto {}

   // Difícil de testar
   function aplicarDesconto(carrinho): void {
     carrinho.total -= desconto;
   }
   ```

3. **Superfície pequena.** Menos entradas, menos testes; menos parâmetros, preparação mais simples.

## Relações

- Um **módulo** tem exatamente uma **interface** (a superfície que mostra a quem chama e aos
  testes).
- A **profundidade** é de um **módulo**, medida contra a **interface** dele.
- Uma **costura** é onde vive a **interface** de um **módulo**.
- Um **adaptador** fica numa **costura** e satisfaz a **interface**.
- A **profundidade** dá **alavancagem** a quem chama e **localidade** a quem mantém.

## Leituras rejeitadas

- **Profundidade como razão entre linhas de implementação e linhas de interface** (Ousterhout):
  premeia encher a implementação. Aqui a profundidade é alavancagem.
- **«Interface» como a palavra-chave `interface` do TypeScript ou os métodos públicos de uma
  classe**: estreito demais; a interface inclui cada facto que quem chama tem de saber.
- **«Fronteira» como sinónimo de costura ou de interface**: em DDD a palavra é do «bounded
  context». Diz **costura** ou **interface**.

## Como se escreve com ele

Frases curtas, com os substantivos e os verbos daqui:

- «O módulo de entrada de encomendas é raso: a interface quase iguala a implementação.»
- «O cálculo de preços vaza pela costura.»
- «Aprofundar: uma interface, um sítio para testar.»
- «Dois adaptadores justificam a costura: HTTP em produção, em memória nos testes.»

Os ganhos dizem-se nestes termos («localidade: os defeitos concentram-se num módulo»,
«alavancagem: uma interface, N chamadores», «a interface encolhe e a implementação absorve os
invólucros»), e não em «mais fácil de manter» ou «código mais limpo», que não dizem o que mudou.
Antes de inventar um termo, procura aqui um que sirva.
