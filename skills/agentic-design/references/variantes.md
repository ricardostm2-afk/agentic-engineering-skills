# Variantes visuais (modo «variantes»)

O humano escolhe a UI vendo 2–3 variantes reais, nunca a partir de descrições. Uma variante real
usa os tokens e componentes do projeto, dados com a densidade de produção e está capturada nas
resoluções-alvo. O que uma variante não pode ter é o `ui-sem-slop.md`; esta página é o
procedimento (preparar, construir, filtrar, capturar, mostrar e registar) e não repete essas
regras.

## 1. Preparar

1. Captura os 2 ecrãs vizinhos na resolução principal: a variante tem de parecer da mesma
   aplicação quando posta ao lado deles. Se o ecrã já existe, captura também o estado atual nas
   resoluções-alvo e nos temas do projeto: é a **linha de base**. Confirma que a reprodução do
   estado atual bate com a app real antes de confiar nas variantes.
2. Prepara dados sintéticos realistas: a quantidade que quem chama mediu (não 3 linhas), nomes
   compridos, valores vazios, acentos. Nunca dados reais de pessoas.
3. Para fluxos e arquitetura de informação, as referências são produtos maduros da categoria e
   fontes primárias atuais, com fonte e data (`ui-sem-slop.md` §1), nunca galerias.

## 2. Escolher a forma do protótipo

Constrói na stack da app, sem instalar uma stack de demo por hábito. Por ordem de preferência:

- **Na rota real** (preferível quando a app corre localmente): as variantes vivem na página real
  ou na página que a vai acolher, trocadas por `?variant=A|B|C`, com cabeçalho, navegação e dados
  verdadeiros à volta. É a forma «sub-shape A» de `mattpocock-skills:prototype` (invoca-a se
  existir). Um ecrã isolado parece bem em qualquer variante; ao lado da app real, os problemas de
  densidade e hierarquia aparecem.
- **Maquetas HTML estáticas** quando a app não corre localmente ou montar a rota custa mais do
  que a decisão: um ficheiro por variante, com as variáveis CSS copiadas do ficheiro de tokens
  real (não aproximadas), as fontes do projeto e a moldura da aplicação (barra, navegação)
  reproduzida.

Em qualquer dos casos o protótipo é descartável: marcado como protótipo no nome, sem escrita em
dados reais, fora de `main` (num worktree destacado ou em maquetas fora do git). Nunca se promove:
a variante escolhida reescreve-se como código de produção no modo «construir».

## 3. Construir variantes diferentes de verdade

As variantes discordam na **estrutura**: layout, hierarquia da informação, ação principal ou modelo
de interação (ex.: lista + painel de detalhe vs. tabela com edição em linha vs. fluxo em passos).
Cor, texto ou cantos diferentes não fazem uma variante. Se duas saem parecidas, refaz uma com uma
restrição explícita («sem tabela», «tudo num só ecrã», «teclado primeiro»). O brief de cada uma
pede ousadia controlada: «sem enchimento» não pode virar «a lista com uma faixa por cima».

Cada variante leva:
- **Nome** que diga a ideia («Lista com painel», «Tabela editável»);
- **Tese**: porque esta composição serve esta tarefa e esta pessoa, numa linha («mais rápida para
  quem faz isto 50 vezes por dia»);
- **Estrutura**: ordem de leitura, ritmo, densidade e percurso da ação principal;
- **Assinatura**: um gesto reconhecível do produto, com uma função (não precisa de ser um efeito);
- **Limite**: o que deixa de fora de propósito e o que sacrifica.

Trabalho novo ou uma exploração pedida: as gramáticas, a diversidade real e o teste de
compatibilidade estão em `direcoes.md`. Num ajuste pontual não há variantes.

## 4. Antes de mostrar: os três filtros

A ordem é esta: capturas de trabalho (resolução e tema principais, cheio e vazio) → os três
filtros → correções → capturas finais (§5). A checklist e a crítica precisam das capturas de
trabalho (contraste sobre o fundo real, densidade, vazio).

1. **O detetor**, a partir da raiz do repo (`<skill>` é a pasta desta skill):
   ```bash
   node <skill>/scripts/detetar-slop.mjs <pasta das maquetas>   # maquetas HTML
   node <skill>/scripts/detetar-slop.mjs --diff <base>          # protótipo na rota
   ```
   Saída 1 = há bloqueios: corrige-os, ou escapa com `slop-ok: <motivo>` só quando é decisão do
   projeto (`ui-sem-slop.md` §6). Saída 2 = não analisou: não conta como limpo
   (`ui-sem-slop.md` §7). Os avisos, os «Permitidos» e os pré-existentes leem-se um a um.
2. **A checklist** do `ui-sem-slop.md` §5, nas partes que um detetor não vê (listas, vazio,
   hierarquia, uma só ação dominante, texto secundário, estados de faz-de-conta, o teste de tapar
   o logótipo).
3. **A crítica independente**: outro agente, que não construiu a variante, recebe as capturas e a
   tarefa (não a resposta que esperas), passa-a contra o §2 e o §5 do `ui-sem-slop.md` e devolve
   os achados. Sem subagentes, faz tu uma passagem separada e di-lo ao mostrar («crítica não
   independente»).

## 5. Capturar

Captura cada variante como diz `prova.md`, «Capturar». A **profundidade** vem de quem chama:
«principal» mostra todas as variantes só na resolução e no tema principais, e as outras
combinações fazem-se só para a escolhida, antes de quem chama fechar a decisão; «completa» captura
todas as combinações para todas as variantes. Sem indicação, «principal».

## 6. Pacote de escolha

Lado a lado (uma página ou imagem com as variantes em colunas, ou as imagens em sequência com o
mesmo enquadramento), e para cada uma: nome, tese, 1–2 vantagens e 1–2 custos concretos (o que
sacrifica), e a saída do detetor (`0 bloqueios, n avisos`). No fim, a recomendação e o porquê, e
se a crítica foi independente. As opções: A, B, C, «escolhe tu», ou «mistura» (o humano diz o que
tira de cada uma; uma mistura com mudanças estruturais pede uma nova captura).

Quem pergunta ao humano é quem chama (na `agentic-feature`, o momento 2). Chamada sozinha, a skill
pergunta ela, com estas opções.

## 7. Registar

Grava na pasta que quem chama indicou (sozinha: uma pasta temporária fora do repo, que dizes ao
humano): as capturas, o HTML das maquetas (ou onde vive o protótipo na rota) e `escolha.md` com a
variante escolhida, a origem da escolha (humano ou delegada), os ajustes pedidos, as resoluções e
os temas capturados e onde vive o protótipo. A variante escolhida passa a ser a **referência da
revisão**: a implementação compara-se com estas capturas (`prova.md`).
