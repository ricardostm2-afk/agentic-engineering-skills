# Testes que valem a pena manter

Para o passo 3 da `agentic-implement`. Aplica-se em cada ciclo, antes e durante, não no fim.

## Um bom teste

Verifica comportamento pela interface pública, não detalhes de implementação. O código pode
mudar por inteiro e o teste continua válido. Lê-se como uma especificação: «o utilizador paga com
um carrinho válido» diz que capacidade existe.

## Costuras

A **costura** é o sítio onde vive a interface de um módulo: lá observas o comportamento sem
entrar nos internos (as definições estão em `<agentic-architecture>/references/vocabulario.md`). Os
testes vivem nas costuras. O brief nomeia-as quando importa; se não nomeia, escolhe a mais próxima
do utilizador e escreve no handoff qual foi e o que ela apanha e deixa passar.

## Maus testes

- **Acoplado à implementação**: faz mock de colaboradores internos, testa métodos privados, ou
  verifica por um canal lateral (consultar a base de dados em vez de usar a interface). Sinal: o
  teste parte num refactor sem o comportamento mudar.
- **Tautológico**: a asserção recalcula o esperado como o código o calcula (`expect(soma(a, b)).toBe(a
  + b)`, um snapshot feito à mão pelo mesmo caminho), por isso passa sempre. O esperado vem de uma
  fonte independente: um literal conhecido, um exemplo trabalhado, a spec.
- **Fatias horizontais**: todos os testes primeiro, toda a implementação depois. Testa a forma
  imaginada e não o comportamento. Trabalha em cortes verticais: um teste, uma implementação, e o
  seguinte aprende com o anterior.
- **Verde por omissão**: um teste que salta, que corre sem base de dados e passa, ou cujo setup
  devolve vazio. Conta como vermelho.

## Mocks

Só nas fronteiras do sistema: APIs externas (pagamentos, e-mail), relógio e aleatório, às vezes o
sistema de ficheiros ou a base de dados (prefere a base de teste). Os teus módulos e colaboradores
internos usam-se a sério. Nas fronteiras, as dependências entram por parâmetro e cada operação
externa tem a sua função, para cada mock devolver uma só forma.

## Tempos limite e processos filhos

Um teste que lança um servidor, um browser ou outro processo filho pode pendurar a suite sem falhar.

- **Folga**: um tempo limite tem pelo menos 2× o maior tempo medido; um valor justo ao medido falha
  na primeira máquina carregada.
- **Filho registado**: o processo filho fica registado para terminar antes de arrancar, e termina
  no teardown, também quando o teste falha a meio.
- **Órfão**: um filho órfão pendura a suite. Depois do verde, corre a suite duas vezes seguidas: as
  duas acabam.

## Refactor: fixar, mudar, provar igual

Numa tarefa que muda a estrutura sem mudar o comportamento (partir um ficheiro, aprofundar um
módulo, mover código), não há vermelho a escrever: o comportamento já existe. O ciclo é outro:

1. **Fixar.** Antes de mexer, prende o comportamento atual num comando que corre na costura
   pública: os testes que já lá estão, se o cobrem; senão um teste de **caracterização**, escrito
   agora, que regista o que o código faz hoje com entradas reais e casos-limite; ou um teste
   **diferencial**, que corre a versão antiga e a nova sobre as mesmas entradas e compara as
   saídas. Corre-o na base e prova que consegue falhar: estraga uma linha do caminho coberto, vê-o
   vermelho e repõe (vermelho forçado, abaixo).
2. **Mudar** só a estrutura, por passos pequenos, com o comando verde depois de cada um. Uma
   mudança de comportamento que apareça a meio é outra tarefa: vai para o handoff.
3. **Provar igual.** O mesmo comando dá o mesmo resultado na base e no HEAD (as mesmas contagens,
   a mesma saída comparada), e os dois resultados vão no handoff. Uma diferença não se resolve
   escolhendo um lado, porque o comportamento antigo pode ser um defeito que a caracterização
   fixou: devolve `bloqueado: <a diferença>` e quem orquestra decide.

Os testes antigos que o refactor deixa sem objeto (os dos internos de um módulo raso) só saem
depois do passo 3, com o comando do passo 1 a cobrir o que eles cobriam.

Feito quando o comando do passo 1 falhou com o defeito semeado e dá o mesmo resultado na base e no
HEAD.

## Regras do ciclo

- Vermelho antes de verde: o teste que falha primeiro, depois só o código para o passar.
- Um corte de cada vez: uma costura, um teste, a implementação mínima.
- Numa tarefa de comportamento, o refactor fica fora do ciclo: é da revisão. Uma tarefa de
  refactor segue «Refactor: fixar, mudar, provar igual».
- **Vermelho forçado**: se forçaste o vermelho mudando código ou uma fixture, compara com uma
  cópia limpa (`diff`) para provar que a mudança pegou antes de confiares no vermelho.
