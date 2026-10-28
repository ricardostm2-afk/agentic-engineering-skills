# Diagnóstico de uma causa desconhecida

Para o passo 4 da `agentic-fix`, quando o vermelho do passo 3 não aponta para a linha. Só se entra
aqui com o ciclo vermelho já a correr: sem ele, ler código para teorizar é o erro que este método
evita.

## Segredos

Mostras comandos, outputs e artefactos capturados: troca cada segredo por `<REDACTED>` antes de os
mostrar. O ciclo lê credenciais de variáveis de ambiente. De um artefacto com cabeçalhos de
autenticação, cita só as linhas com o sinal.

## 1. Minimizar

Corta entradas, chamadores, configuração, dados e passos, **um de cada vez**, e volta a correr o
ciclo depois de cada corte. Fica só o que é necessário para o vermelho.

Feito quando cada elemento que sobra é necessário: tirar qualquer um põe o ciclo verde.

## 2. Evidência

Antes de teorizar, junta o que o sistema já sabe sobre o defeito:

- `git log -S '<símbolo>'` e `git log -p -- <ficheiro>`: quando o comportamento mudou e porquê;
- `git blame` nas linhas do caminho: o commit e a mensagem que as trouxeram;
- PRs e issues ligados a esses commits;
- logs e erros do ambiente onde o defeito aparece, sem dados de pessoas.

## 3. Hipóteses

Escreve **3 a 5 hipóteses ordenadas** antes de testar alguma. Cada uma é **falsificável**:
`Se a causa é <X>, então mudar <Y> faz o defeito desaparecer` (ou `mudar <Z> agrava-o`). Uma
hipótese sem previsão é um palpite: afia-a ou deita-a fora.

Quando o vermelho vem de um teste ou de uma spec que já existiam (e não do ciclo do passo 3), a
lista inclui sempre as hipóteses de a spec ou o teste estarem errados, e não o código: a triagem
de «Código, spec ou teste», no passo 5 de `<agentic-implement>/SKILL.md`.

Com o humano por perto, mostra-lhe a lista ordenada: ele reordena-a muitas vezes num segundo. Sem
ele, segue pela tua ordem.

## 4. Instrumentar

Cada sonda testa a previsão de uma hipótese; muda **uma variável de cada vez**. Por ordem:
debugger ou REPL; logs dirigidos às fronteiras que separam as hipóteses. Cada log temporário leva
um prefixo único (`[DEBUG-a4f2]`), para sair todo com um grep no fim.

Regressão de desempenho: primeiro uma medida de base (harness de tempos, profiler, plano da
query), depois bisseção. Mede antes de corrigir.

Defeito que apareceu entre dois estados conhecidos (commits, versões, dados): automatiza o
«arranca no estado X, verifica» e usa `git bisect run`.

## 5. Fechar

Feito quando:

- uma hipótese confirmada explica o sintoma exato do report (e não um defeito vizinho);
- a causa raiz cabe numa frase, que vai para o corpo do commit;
- a sonda que a confirmou se repete e dá o mesmo resultado.

Daqui segue-se para a classe, no passo 4 da `agentic-fix`.
