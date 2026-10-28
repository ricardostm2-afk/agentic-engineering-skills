# Leitura do contexto (passo 1a)

Objetivo: chegar ao momento 1 a saber mais do que o humano sobre o estado do código, para que as
perguntas sejam só sobre decisões e as tuas sugestões poupem trabalho real.

Armadilha que este passo existe para evitar: **planos que propõem construir o que já existe**.
Acontece quando o plano nasce da descrição do pedido em vez do código. Por isso a Leitura vem
antes de qualquer plano e cada afirmação dela tem um caminho de ficheiro. Um `.md` antigo (plano,
handoff, relatório) é pista, não facto: confirma-o no código ou no sistema a correr (um comando,
uma captura) antes de o pôr na Leitura; o que só um doc diz não sustenta nenhuma sugestão.

## O que investigar

Faz isto por ordem; para cada ponto, regista o facto e onde o viste (`caminho:linha`).

1. **Regras do projeto**: `AGENTS.md`, `CLAUDE.md`, `.specify/memory/constitution.md`, ADRs
   (`docs/adr/` ou equivalente), `GLOSSARY.md`/glossário, `DESIGN.md` ou guia de UI, `README` da
   área, e `REVIEW.md` (o que a revisão vai procurar). Anota as regras que esta feature pode
   violar, e se `.specify/` existe (decide o passo 4) e se há quadro (o CLI que o `AGENTS.md` ou o
   `CLAUDE.md` nomeia, ou `.agentic/quadro/`).
2. **Onde encaixa**: que área/módulo do código é dono deste comportamento (mapa de áreas se
   existir, ex.: `.agentic/areas.json`); que rotas, serviços, tabelas e ecrãs são tocados.
3. **O que já existe**: procura o comportamento pedido e os parecidos, não só o nome que o humano
   usou. Pesquisa por sinónimos do domínio, pelo nome da tabela/entidade, pelo texto que aparece no
   ecrã, por funções com verbos próximos (`export`, `download`, `csv`, `report`…). Procura também
   código morto ou meio feito sobre o mesmo tema (flags desligadas, rotas sem ecrã, ecrãs sem
   rota). Se existe meio feito, a feature pode ser «ligar» e não «construir».
4. **Quem escreve e quem lê os dados**: para cada dado que a feature lê, encontra quem o escreve
   (pesquisa pelo nome do campo no código da aplicação, não só no esquema). Zero escritores = o
   dado não existe na prática. Para cada dado novo, quem o vai ler.
5. **Porta de entrada**: como é que um utilizador chegaria a esta feature hoje (menu, botão,
   ligação, notificação, API). Se não há caminho, isso é uma decisão para o momento 1.
6. **Permissões**: que papéis existem, onde é aplicada a recusa no servidor, que função decide.
   Se o ecrã decide sozinho o que mostrar, anota: a regra tem de vir do servidor.
7. **Testes e verificações da área**: onde estão os testes, como se correm (comando exato), quanto
   demoram, se há testes contra a dependência real (BD, fila) ou só mocks, que bateria/CI corre.
   Corre-os uma vez agora para saber o estado de partida: vermelho antes de começares é um facto
   que muda o plano.
8. **Riscos**: dados pessoais ou sensíveis, migrações em tabelas grandes, consultas sem índice,
   concorrência (dois utilizadores ao mesmo tempo), fusos e datas, isolamento entre
   clientes/organizações, custos de serviços externos.
9. **Se há UI**: sistema de design (ficheiro de tokens, componentes partilhados, `DESIGN.md`), os
   2–3 ecrãs vizinhos que o utilizador vê antes e depois deste, as resoluções-alvo. Tira capturas
   dos vizinhos se tiveres um browser: servem de referência às variantes que a `agentic-design`
   faz no passo 3.
10. **Histórico**: `git log --oneline -- <caminhos da área> | head -20` e mensagens recentes;
    tentativas anteriores da mesma feature e porque pararam.

## Como investigar num repo grande

Lança 2–4 subagentes de leitura em paralelo, um por pergunta (ex.: «onde vive X e quem o chama»,
«que testes cobrem Y e como se correm», «que ecrãs mostram Z e com que componentes»). Cada um
devolve factos com caminho e linha, em ≤ 300 palavras, sem propostas. Tu juntas e decides. Não
lhes passes dados pessoais; passa nomes de ficheiros e conceitos.

Para quando tens: o mapa dos ficheiros tocados, o que já existe, quem escreve/lê cada dado, os
comandos de verificação e os riscos. Mais leitura depois disto é adiamento.

## Como escrever as sugestões

As sugestões são a parte da Leitura que dá valor ao humano. Cada uma é uma alteração concreta
ao que ele pediu ou ao modo de o fazer, com evidência e efeito:

- **Reutilizar**: «o componente `X` em `caminho` já faz 80 % disto; estender em vez de criar».
- **Cortar**: «o pedido inclui Y, mas nenhum ecrã lê Y; proponho deixá-lo de fora».
- **Simplificar**: «em vez de uma tabela nova, um campo em `Z` chega, porque…».
- **Risco não mencionado**: «a tabela `W` tem ~2 M linhas; a migração bloqueia escrita; proponho
  fazer em duas fases».
- **Ordem**: «fazer primeiro a parte de leitura, que entrega valor sem migração».
- **Ligação em falta**: «o motor já existe em `caminho`, mas nenhuma rota o chama».

Não contam como sugestões: repetir o pedido, conselhos genéricos («ter boa cobertura de testes»,
«pensar na segurança»), opções sem recomendação, ou afirmações sem caminho de ficheiro (ou, para
um achado da pesquisa do passo 1b, sem URL e datas).
Se tens menos de 3 sugestões, investigaste pouco: volta aos pontos 3, 4 e 5.

## Saída

Preenche `assets/leitura.template.md` como `leitura.md` numa pasta temporária da sessão (fora do
repo) e mostra-a no chat. No passo 4 move-se para a pasta da feature (`specs/<NNN-slug>/`). As perguntas em aberto da Leitura são a
lista de entrada do grill (passo 2), já ordenadas por impacto.

Os factos escrevem-se no passo 1a; as Sugestões e a Abordagem recomendada fecham-se depois do
passo 1b (`references/pesquisa-moderna.md`), cujo `pesquisa.md` fica na mesma pasta temporária.
