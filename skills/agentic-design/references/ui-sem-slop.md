# Interface sem estética de IA

Ler antes de desenhar ou rever qualquer ecrã, componente, documento gerado (PDF, e-mail, SMS) ou
gráfico. Vale para maquetas, variantes e código. É da skill `agentic-design` e vive também em
`.agentic/ui-sem-slop.md` dos projetos, para os agentes que não têm a skill: por isso diz tudo o
que é preciso para desenhar e rever sem mais nenhum ficheiro.

**Índice**

1. [Princípio: liberdade no estilo, proibição nos tiques](#1-princípio)
2. [Bloqueios](#2-bloqueios): B1–B24, cada um com como se reconhece, porque é mau e uma saída possível
3. [O que fazer bem](#3-o-que-fazer-bem)
4. [Processo: variantes reais, capturas, escolha do humano](#4-processo)
5. [Checklist de revisão](#5-checklist-de-revisão)
6. [Escape legítimo](#6-escape-legítimo)
7. [O detetor mecânico](#7-o-detetor-mecânico)

## 1. Princípio

**O estilo é livre; os tiques não.** Composição, tipografia, cor, densidade e personalidade
escolhem-se livremente, desde que sejam coerentes com o sistema de design do projeto. O que está
proibido é a lista da secção 2: os padrões que denunciam «feito por IA» à primeira vista. Quem os
vê deixa de confiar no produto, mesmo quando o conteúdo é bom. A crítica típica de um dono de
produto é esta: o conteúdo pode estar certo, mas o desenho está feio. Um estilo calmo também pode
ser original: a originalidade está na relação entre o conceito, a estrutura e o uso, não no número
de efeitos.

**Modo da superfície.** Num ecrã para operar (app, ferramenta) ou para ler (documentação,
documento gerado), os bloqueios valem por inteiro. Num site ou landing page, para persuadir, o B9
e a parte do B18 sobre entradas animadas, contadores e fundos animados cedem ao que o `DESIGN.md`
desse projeto declarou com o dono; os outros bloqueios valem.

Antes de desenhar, ler o que existe e estender isso:

- **Tokens:** cores, tipografia, espaçamento, raios e sombras (ficheiro de tema, variáveis CSS,
  configuração do Tailwind).
- **Componentes partilhados:** linha de lista, tabela, cabeçalho de página, estado vazio, botão.
- **Ecrãs vizinhos** que o utilizador abre antes e depois deste.
- **O documento de design do projeto** (`DESIGN.md` ou equivalente), se existir. As regras dele
  ganham a este ficheiro.

Nunca inventar um sistema paralelo (outra paleta, outra escala de raios, outro botão) para um ecrã
só. Se o sistema não chega, propor a extensão no próprio sistema, que fica para todos os ecrãs.

Ir buscar referências atuais de produtos maduros com o mesmo tipo de uso (ferramentas
profissionais, clientes de e-mail, agendas, editores), e não galerias de inspiração. Essas
galerias são de onde os tiques vêm.

## 2. Bloqueios

Cada item tem três partes. **Reconhece-se** diz como o ver, de forma concreta e verificável: é
isto, e só isto, que bloqueia. **Porque é mau** diz o que o tique custa. **Em vez** dá uma saída
possível: é exemplo, não regra; qualquer desenho que não caia no «Reconhece-se» serve. Os números
(alturas, tamanhos, raios) são referência, não medida obrigatória, salvo os mínimos de legibilidade
e de contraste (B3, B12) e o mínimo dos alvos de clique e toque (secção 3).

### Cor e superfície

**B1. Gradientes roxos/índigo e gradientes decorativos.**
Reconhece-se: `linear-gradient`/`bg-gradient-to-*` com roxo, índigo ou violeta; gradiente no
fundo de uma secção, de um hero, de um cartão ou de um botão, sem função.
Não é o tique: o gradiente da marca escolhido pelo dono, definido num token e declarado
(secção 6), usado onde ele o aprovou.
Porque é mau: é a assinatura mais conhecida da UI gerada, e o gradiente compete com o conteúdo.
Em vez: cor chapada dos tokens. Se a marca pede profundidade, usar um degrau de luminosidade da
mesma matiz, aplicado só à moldura ou à ação principal e só se o sistema o prevê.

**B2. Pastilhas e badges pastel por todo o lado.**
Reconhece-se (basta um), contando os rótulos de fundo claro colorido («pastilhas») num ecrã:
- **cor sem palavra:** numa captura em escala de cinzentos, o estado deixa de se ler (a pastilha
  ou o ponto não tem texto, ou o texto não diz o estado);
- **cor sem significado:** mais de 3 pastilhas no ecrã e as cores não seguem uma regra «esta cor
  = este significado» escrita no sistema de design (a mesma cor em estados diferentes, cores
  diferentes no mesmo estado, ou cor escolhida por variedade);
- **cor em tudo:** mais de metade das linhas de uma lista leva pastilha ou cor de estado,
  incluindo linhas que não pedem nada (o que já está concluído, pago, ativo).
Não é o tique: pastilhas com texto, com um significado por cor escrito no sistema e em menos de
metade das linhas, qualquer que seja a forma ou a cor.
Porque é mau: ensina a ler cor em vez de palavras; quando tudo tem cor, a cor que importa (aviso,
erro) deixa de se ver.
Em vez: uma saída possível é o estado por extenso na cor do texto, com cor reservada ao que pede
atenção (aviso, erro). Pastilha, ponto ou ícone + palavra também servem, desde que não caiam no
«Reconhece-se».

**B3. Cinzento sobre cinzento e contraste baixo.**
Reconhece-se: texto secundário cinzento-claro sobre fundo cinzento, rótulos esbatidos, ícones a
3:1 que levam informação; o contraste medido no token e não no valor pintado sobre o fundo real.
Porque é mau: parece elegante numa captura e é ilegível num ecrã de escritório, com reflexos ou
para quem tem mais de 40 anos.
Em vez: texto ≥ 4,5:1 e ícones/contornos que informam ≥ 3:1, medidos sobre o fundo real. A
hierarquia faz-se pelo tamanho e pelo peso, não por esbater.

**B4. Fios, cinzentos e divisores a fazer de estrutura.**
Reconhece-se (basta um):
- **o teste de tapar:** numa captura, pintar os fios e o fundo de baixo contraste (< 3:1 com o
  que têm ao lado) da cor da superfície vizinha. Se as zonas do ecrã deixam de se distinguir,
  porque nada mais as separa (espaço entre elas, alinhamento, título, mudança de superfície com
  contraste medido), é o tique;
- **a série de divisores:** `hr`, `border-top`/`border-bottom`, `divide-y`, um pseudo-elemento ou
  uma sombra de 1 px entre secções ou itens que já se distinguem por título, espaço e alinhamento.
  O tique é a repetição sem função, não a propriedade: trocar o `hr` por uma sombra de 1 px
  mantém-no;
- **a tela acinzentada:** no claro, um fundo cinzento por baixo do conteúdo para o separar da
  moldura.
Não é o tique: os limites funcionais (o campo editável, por contorno, fundo ou sombra; o foco, o
erro e a seleção; as guias de tempo numa grelha; as relações de linha e coluna numa tabela, quando
a comparação as pede) e uma separação pontual entre dois grupos. Uma tabela não pede todos os
traços só por ser tabela: cada um tem de ajudar a comparar. Uma regex não distingue a decoração
da função: decide-se na composição, com a captura à frente.
Porque é mau: no claro, o fio e o cinzento de baixo contraste leem-se como sujidade, não como
estrutura, e o ecrã fica plano; a série de divisores fragmenta o que o espaço já agrupava.
Em vez: espaço, alinhamento, títulos e uma superfície sólida para o trabalho; a separação entre a
moldura e o trabalho faz-se por um material da moldura que o sistema de design define. Ao tirar
uma série, não pôr no lugar um cartão, uma sombra ou um fundo por item. O âmbito conta: tirar os
divisores pedidos não autoriza apagar a identidade nem as bordas funcionais da aplicação.

**B5. Tokens com dois trabalhos.**
Reconhece-se: a mesma cor serve de marca e de «sucesso»; o mesmo token é texto num sítio e
fundo noutro. O sintoma é «a cor que escolhemos não é a que aparece», ou a app baça sem nada estar
errado.
Porque é mau: o valor passa a ser ditado pelo trabalho mais exigente, e uma troca em massa parte
os outros trabalhos sem aviso.
Em vez: um trabalho por token. Antes de mudar uma cor em massa, classificar cada uso pelo que a
cor diz naquele sítio (estado, semântica, ponto de uma escala, marca). Se um token é texto e
superfície, separá-lo em dois com o mesmo contrato de contraste. Uma guarda de contraste mede os
pares tinta/fundo que o CSS declara na mesma regra, em cada tema, e não uma lista de tokens: a
lista descreve o trabalho antigo e envelhece quando um token muda de trabalho.

**B6. Cores fora dos tokens.**
Reconhece-se: hex, `rgb()` ou `hsl()` soltos num componente; classes de paleta crua
(`bg-blue-500`) num projeto com tokens; um tom «quase igual» ao do sistema.
Porque é mau: diverge do tema (o escuro esquece-o) e acumula variantes que ninguém consegue
mudar de uma vez.
Em vez: usar o token. Se falta um, propõe-o ao sistema com o contraste medido em cada tema do
projeto; a decisão é do humano, antes de desenhar. As exceções estão na secção 6.

### Estrutura e composição

**B7. Tudo em cartão, e cartões dentro de cartões.**
Reconhece-se: cada bloco numa caixa com borda e sombra; caixa dentro de caixa dentro de
caixa; mosaico de cartões do mesmo tamanho a encher a página.
Porque é mau: fragmenta, rouba espaço às margens e esconde a hierarquia; a página parece um
painel de controlo genérico.
Em vez: secções sem caixa, com um título forte, espaço e uma grelha alinhada. Uma superfície tem
de significar um grupo, um objeto ou uma camada: o cartão fica para quando a elevação significa
alguma coisa (um item que se arrasta, uma camada que flutua). Um painel reutilizado dentro de
outro perde o título, a moldura e a ilustração.

**B8. Listas feitas de cartões soltos, ou de linhas com «Ver» e reticências.**
Reconhece-se (basta um), numa lista de itens do mesmo tipo que se comparam:
- **cartões soltos:** cada item é um cartão com borda ou sombra e margem própria, numa lista de 5
  ou mais itens;
- **colunas desalinhadas:** o mesmo campo (nome, data, valor, estado) começa num x diferente de
  linha para linha, ou um número está colado ao rótulo em vez de numa coluna;
- **números que não se comparam:** uma coluna de valores alinhada à esquerda ou sem algarismos
  tabulares;
- **«Ver» repetido:** o mesmo botão ou ligação («Ver», «Abrir», «Detalhes») em todas as linhas,
  em vez de a linha ser a ligação;
- **corte do que decide:** o nome, a mensagem ou o valor cortado em «…» com espaço livre na linha,
  ou sem forma de ler o texto inteiro;
- **seleção só por fundo pastel:** a linha selecionada só se distingue por um fundo claro.
Não é o tique: linhas altas ou compactas, zebra, fios entre linhas numa tabela em que a
comparação por coluna os pede (e que passam o B4), e cartões numa grelha de itens que não se
comparam (galeria de imagens). A forma é livre.
Porque é mau: é o caso mais frequente de «o conteúdo é bom, o desenho está feio». O olho não
encontra colunas e o que decide (quem, quanto, quando) fica cortado.
Em vez, uma saída possível:
- Linhas com a grelha definida na lista (subgrid ou colunas de largura fixa), não em cada linha.
- Altura da linha à medida do uso, com letra ≥ 13 px; a linha é um alvo de clique e segue os
  alvos da secção 3 (44 px recomendado, 24 px mínimo).
- Números à direita, com algarismos tabulares, numa coluna própria.
- A linha inteira é a ligação. A ação da linha é um botão irmão, não um botão dentro de outro, e
  as secundárias vão para um menu «⋯».
- A mensagem pode ocupar 2 linhas e o nome fica inteiro; o estado escreve-se em texto, num sítio
  fixo da linha.
- A linha selecionada distingue-se por forma, peso ou uma marca, além do fundo.

**B9. Composição de landing page: hero vago, três colunas iguais, tudo centrado.**
Reconhece-se: título grande centrado («A forma mais inteligente de…») com «Começar» e «Saber
mais» lado a lado; três (ou seis) blocos iguais de ícone num círculo, título de duas palavras e
duas linhas de texto; parágrafos e formulários centrados.
Não é o tique: num site, o hero e a narrativa que o `DESIGN.md` desse projeto declarou com o dono
(modo da superfície, secção 1). Numa ferramenta de trabalho nunca se exige um hero.
Porque é mau: é o enchimento-padrão de um site gerado. A simetria finge que três coisas valem o
mesmo, e sem uma margem esquerda estável a leitura cansa. Numa app de trabalho, rouba espaço à
tarefa.
Em vez: numa app, abrir na tarefa do dia. Num site, dizer o que o produto faz e para quem, em
palavras do domínio, com uma só ação principal e o produto a funcionar (captura real). Texto
corrido e formulários com uma margem esquerda estável; o centrado fica para peças únicas e curtas
(um título, um diálogo de confirmação).

**B10. Métricas e KPIs decorativos.**
Reconhece-se: uma fila de cartões de números («Total», «Crescimento +12%») que ninguém usa para
decidir; um ícone colorido em cada cartão; números que não abrem nada.
Porque é mau: ocupa o primeiro ecrã com o que não muda a ação seguinte, e ensina a ignorar
números.
Em vez: só os números que mudam uma decisão. Cada número tem um só nome e uma só definição em
todos os ecrãs, e ao clicá-lo abre a lista filtrada com o mesmo número de linhas. A forma é livre
(uma linha de números, um gráfico, a cor no próprio dado), desde que não seja a fila de cartões
genéricos com um ícone em cada. Números só quando vêm do produto, nunca inventados para encher.

**B11. Estados vazios que só dizem «Sem dados».**
Reconhece-se: «Sem dados», «Nada para mostrar», uma ilustração grande e nenhuma ação.
Porque é mau: o vazio não é uma resposta. Quem chega não sabe se é falha, filtro ou trabalho
feito.
Em vez: dizer o que significa («Nenhuma fatura por emitir hoje») e qual a próxima ação, com o
botão. Uma conta nova vê os passos que faltam, não zeros. E o inverso também conta: uma área
grande vazia num ecrã largo não é «limpa». Compor com conteúdo útil (o que vem a seguir, o que
está por tratar, o ritmo do dia), sem cair no B10.

### Texto

**B12. Texto pequeno a mais.**
Reconhece-se: um subtítulo cinzento por baixo de cada título; um resumo de duas linhas por baixo
de cada entrada do menu; letra abaixo de 12 px; contagens repetidas («61 registos» ao lado da
lista que os mostra).
Porque é mau: polui e afoga o que importa; quase sempre repete o que o conteúdo já mostra.
Em vez: cada texto secundário só fica se mudar o que a pessoa decide ou faz a seguir e se não
estiver já à vista. Nos componentes partilhados, o subtítulo é opcional e não tem valor por
omissão; se repete o título, não se desenha. Num redesenho, fazer o inventário: texto, onde,
manter ou tirar, porquê. Mínimo de 12 px; 13–14 px em linhas de dados e cabeçalhos de tabela.

**B13. Sobretítulos em maiúsculas espaçadas e numeração decorativa.**
Reconhece-se: «VISÃO GERAL» em 11 px com tracking por cima do título; «01 / Secção»; travessões a
enfeitar títulos.
Porque é mau: é a camada de texto pequeno com outro disfarce, e é um tique de modelo de landing
page.
Em vez: o título chega. Os rótulos ficam em caixa normal, sem tracking.

**B14. Microcópia de marketing.**
Reconhece-se: «Desbloqueie todo o potencial», «sem esforço», «Bem-vindo de volta! 👋», «tudo num
só lugar», «seamless», «supercharge», exclamações e entusiasmo.
Porque é mau: soa a anúncio dentro de uma ferramenta de trabalho e ninguém acredita.
Em vez: dizer o que acontece, com as palavras do domínio: «Guardar», «3 faturas por emitir»,
«Entrar». Um verbo por botão e nenhuma promessa.

**B15. Frases do sistema e tecnicês para o utilizador final.**
Reconhece-se: avisos que explicam a implementação («Os valores podem mudar até…»); códigos,
hashes, versões ou IDs à vista; «-» em campos vazios; um sobretítulo que repete o título
(«Orçamento» por cima de «Orçamento de tratamento»); regras de negócio escritas no ecrã.
Porque é mau: o documento ou o ecrã fala para quem o construiu, não para quem o lê. Num PDF ou
num e-mail, é a cara do cliente.
Em vez: a identidade, a pessoa, a data, um título claro, o conteúdo e a assinatura. Os campos
vazios omitem-se. O texto legal é só o que a lei exige. Uma referência técnica necessária fica
discreta («Ref.» no rodapé).

### Ícones, forma e movimento

**B16. Emojis como ícones, ✨, e ícones decorativos em círculos coloridos.**
Reconhece-se: 🚀 ✨ 📊 👋 em títulos, botões, estados vazios ou menus; ✨ a marcar
«inteligente» ou «novo»; cada secção, cartão ou métrica com um ícone dentro de uma bolinha pastel.
Não é o tique: o emoji que é dado, como as reações que o utilizador escolhe ou o texto que as
pessoas escrevem (secção 6).
Porque é mau: é o tique mais fácil de reconhecer. O emoji renderiza diferente em cada sistema e
não segue o tema; o ícone em círculo é ornamento que não distingue nada (são todos iguais).
Em vez: o conjunto de ícones do projeto, em traço, com a cor do texto, e só quando ajuda a
encontrar alguma coisa (por exemplo, na navegação). Na dúvida, a palavra.

**B17. Sombras e cantos muito arredondados em tudo.**
Reconhece-se: `rounded-2xl`/`3xl` em cartões, campos e botões; sombras largas e difusas em blocos
que não flutuam; botões em pílula «fofinhos»; brilho colorido à volta dos botões; bordas
laterais coloridas a marcar cartões.
Porque é mau: lê-se como infantil e de modelo pronto; as sombras em tudo apagam a única elevação
que importa (o diálogo, o menu).
Em vez: a escala de raios do projeto (tipicamente 4–12 px). Raio grande só em cápsulas, avatares
e interruptores. Sombra grande só no que flutua por cima do conteúdo.

**B18. Animações gratuitas.**
Reconhece-se: números que contam de 0 até ao valor; fundos com gradientes a respirar;
elementos que entram a deslizar em cada carregamento; `transition: all`; hover que move o alvo;
animação contínua fora de uma espera real.
Não é o tique: num site, o movimento de entrada e os contadores que o `DESIGN.md` desse projeto
declarou com o dono (secção 1); um indicador de espera enquanto a espera é real (B19).
Porque é mau: atrasa a leitura e cansa. Uma animação contínua por trás de um desfoque gasta GPU
sem parar e faz perder cliques em máquinas modestas. Um hover que move o alvo num ecrã tátil
transforma o primeiro toque em «selecionar» e obriga a um segundo. Uma animação não prova
autorização, progresso nem sucesso (B23).
Em vez: o valor completo no primeiro frame. O movimento só serve para explicar uma mudança de
estado (abrir, fechar, reordenar), é curto (≤ 200 ms numa mudança de estado; os gestos usam
molas) e pára com `prefers-reduced-motion`. Os efeitos de hover ficam dentro de
`@media (hover: hover)` e nunca usam `transform` em alvos de navegação.

**B19. Skeletons e spinners onde o dado é instantâneo.**
Reconhece-se: um esqueleto cintilante durante 50 ms; um spinner ao trocar de separador com dados
já em memória; a lista que volta ao esqueleto ao regressar de um detalhe.
Porque é mau: a página pisca, e uma operação rápida parece lenta.
Em vez: manter os dados anteriores enquanto chegam os novos. O indicador só aparece depois de
~300 ms, e o esqueleto só no primeiro carregamento lento, com a forma real do conteúdo.

**B20. Botões fantasma a competir com a ação principal, ou primários em todo o lado.**
Reconhece-se: três botões com o mesmo peso no topo; um primário em cada linha da lista (25 botões
azuis por página); uma ação que é só texto colorido sem forma; secundárias desenhadas como
contorno de 1 px.
Porque é mau: quando tudo é primário, nada é. E uma ação que parece texto não se encontra; o
contorno em cada botão é a mesma linha a fazer de estrutura do B4.
Em vez: uma ação dominante por ecrã. As secundárias têm fundo tonal (ou uma sombra leve) ou ficam
no menu; nenhum botão é delimitado por uma linha, em nenhum estado (também desativado, segmentado
ou chip), tirando o anel de foco e o `forced-colors`. Numa lista, só a linha mais urgente pode ter
o primário. Uma ação nunca é só cor ou só texto: tem fundo ou forma, e o cursor de clique.
Exceção: num passo de confirmação, as duas saídas («Sim, cancelar» e «Manter») podem ter o mesmo
peso, para não empurrar para o «sim»; a destrutiva distingue-se pelo texto, que diz o que se
perde, e não só pela cor.

**B21. Texturas decorativas no fundo ou a marcar estados.**
Reconhece-se: grelha de pontos ou de linhas, ruído («grain») ou brilho difuso por trás do
conteúdo, sem função; itens cancelados ou indisponíveis marcados só por riscas ou hachuras.
Não é o tique: a textura que explica uma propriedade da tarefa, limitada à zona onde serve (o
xadrez atrás de uma imagem com transparência, a malha de um canvas ou de uma planta).
Porque é mau: é enchimento-padrão de página gerada, e a textura pesa mais do que o conteúdo que
devia estar à frente; um estado marcado só pelo padrão não se lê em voz alta nem num ecrã com
reflexos.
Em vez: fundo chapado dos tokens. O que já não conta esconde-se por omissão (com um filtro para o
ver) ou mostra-se esbatido e com a palavra («Cancelada»), distinto do resto por mais do que o
padrão.

### Material, estado e interação

**B22. Vidro e desfoque atrás do conteúdo.**
Reconhece-se: `backdrop-filter` ou superfície translúcida por trás de listas, tabelas, formulários
ou texto corrido; vidro na página toda; um fundo animado por trás de uma superfície com desfoque.
Não é o tique: o material da marca na moldura (a barra lateral; a barra de topo que ganha vidro
quando o conteúdo rola por baixo) e nas camadas que flutuam, com o conteúdo numa superfície sólida
e o `prefers-reduced-transparency` respeitado.
Porque é mau: o texto perde contraste sobre o que passa por trás, e o desfoque recalculado a cada
frame pesa nas máquinas modestas e faz perder cliques.
Em vez: uma superfície sólida para o trabalho, com o vidro na moldura e o fundo estático.

**B23. Estados de faz-de-conta.**
Reconhece-se: progresso que avança por temporizador; um aviso de sucesso antes da resposta do
servidor; um cadeado ou um «seguro» sem contrato por trás; uma animação de «a guardar» que não
está ligada a um pedido; contagens ou presença inventadas; um padrão escuro para arrancar um
consentimento.
Porque é mau: a interface mente, e quando falha a pessoa já agiu como se tivesse corrido bem.
Em vez: cada estado vem de um facto do sistema; o indicador é indeterminado quando não há uma
fração medida; o sucesso aparece depois da resposta, no sítio da ação. Esqueleto, indicador
indeterminado, percentagem e resultado são estados diferentes.

**B24. Interação que só existe na captura.**
Reconhece-se: informação ou ação só em hover; informação só em tooltip; um controlo sem nome
acessível; um input escondido com `display: none` a fazer de caixa ou de rádio; um botão sem
aspeto de botão.
Porque é mau: a captura parece bem, mas o ecrã não se usa com teclado, toque ou leitor de ecrã.
Em vez: input nativo focável, com rótulo associado; o que decide fica à vista; o hover só reforça
o que o foco e o toque também mostram.

## 3. O que fazer bem

Sem impor estilo: são propriedades que qualquer bom desenho tem.

- **A hierarquia segue a ação principal.** Ao abrir, uma coisa só: o trabalho do momento no
  primeiro ecrã, na resolução real do utilizador. A ajuda, o histórico e a configuração vêm
  depois.
- **A densidade serve o uso.** Uma ferramenta profissional usada o dia todo prefere densidade a
  espaço em branco generoso. As tarefas frequentes não pedem scroll e cabem em ≤ 2 cliques.
- **Um trabalho por token**, como diz o B5. A cor nova entra pelo sistema e traz o contraste
  medido.
- **Os estados estão todos desenhados:** vazio, a carregar, erro, sem permissão e muitos dados
  (paginação real, nomes longos, 500 linhas). Uma página sem dados não finge um dashboard cheio.
- **A letra é legível:** corpo 14–16 px, dados ≥ 13 px, e títulos maiores do que o corpo. Um
  título de secção mais pequeno do que o texto dá à página um ar tímido.
- **Se o projeto tem claro e escuro, a mesma forma com cores diferentes.** Os dois são testados
  com capturas e nunca se aprova um sem ver o outro. Um projeto com um só tema não ganha outro
  por causa de uma feature.
- **O ecrã é consistente com os vizinhos.** O mesmo componente faz o mesmo trabalho. Um ecrã
  partilhado por vários papéis tem uma só implementação, com secções condicionadas por permissão;
  cópias por papel divergem e uma delas fica feia.
- **A largura que conta é a real.** O layout responde ao espaço que sobra (com painéis laterais
  abertos, barra recolhida), não à janela. As container queries são o padrão.
- **Acessibilidade:** contraste AA medido no valor pintado, foco visível, percurso completo por
  teclado e alvos de clique e toque ≥ 44 × 44 px (recomendado), nunca abaixo de 24 × 24 px
  (mínimo WCAG 2.2 AA, critério 2.5.8). Inputs com letra ≥ 16 px em mobile, senão o iOS faz
  zoom. Sem scroll horizontal da página desde 320 px (WCAG 2.2, 1.4.10) até à maior
  largura-alvo; o conteúdo bidimensional (tabela larga, mapa, editor, grelha de agenda) pode
  deslizar dentro do próprio componente. Esconder o excesso com `overflow-x: hidden` não é
  responsivo.
- **Gráficos sóbrios:** uma paleta suave definida como tokens em cada tema, séries distinguíveis
  por mais do que a cor (nome, forma, tracejado), legenda em texto ≥ 14 px e grelha discreta.
  Sem gradientes, brilhos nem sombras nas barras, e nunca dados inventados para parecer a
  referência.

## 4. Processo

O procedimento completo é o modo «variantes» da `agentic-design` (`variantes.md` dela). O
essencial: capturar o estado atual (a linha de base); fazer 2–3 variantes que discordam na
estrutura, não só na cor, com os tokens e os dados realistas do projeto; passá-las pelo detetor,
pela checklist da secção 5 e por uma crítica de outro agente antes de as mostrar; o humano escolhe
(«escolhe tu» vale); a variante escolhida é a referência da revisão, comparada em capturas reais
nos mesmos estados e larguras. Uma captura não prova que funciona: num ecrã interativo, clicar e
confirmar que o estado muda.

## 5. Checklist de revisão

Para o revisor independente (a lente UI da `agentic-code-review`). Cada «não» é um achado, ligado
ao bloqueio entre parênteses. Começa pelo detetor (o último ponto; as saídas no §7): na saída 1,
cada bloqueio numa linha do diff é um Importante, com a linha do detetor como prova, que se
corrige ou fica com `slop-ok: <motivo>` quando é decisão do projeto (§6); a saída 2 conta como
vermelho até os ficheiros que não leu passarem à mão. Depois a lista, contra as capturas da
variante escolhida.

- [ ] Não há gradientes decorativos nem roxos/índigo, tirando o gradiente de marca declarado (secção 6)? (B1)
- [ ] Em escala de cinzentos cada estado ainda se lê, cada cor de pastilha tem um significado escrito no sistema, e menos de metade das linhas leva cor de estado? (B2)
- [ ] Todo o texto passa 4,5:1, e os ícones que informam 3:1, sobre o fundo real, em cada tema do projeto? (B3)
- [ ] Tapados os fios e fundos abaixo de 3:1, as zonas do ecrã ainda se distinguem? Sem séries de divisores entre o que o espaço e os títulos já separam, e sem tela acinzentada no claro? (B4)
- [ ] Cada token novo ou alterado tem um só trabalho? (B5)
- [ ] Não há cores literais fora dos tokens, ou cada uma tem `slop-ok` com motivo? (B6)
- [ ] Não há cartões dentro de cartões nem mosaicos de cartões? (B7)
- [ ] Nas listas de itens que se comparam: sem cartões soltos, cada campo no mesmo x em todas as linhas, números à direita e tabulares, sem «Ver» repetido, sem corte do que decide e seleção por mais do que o fundo? (B8)
- [ ] O topo abre na tarefa, sem hero vago, sem grelhas simétricas de ícone + título + texto e sem parágrafos ou formulários centrados? (B9)
- [ ] Cada número muda uma decisão, vem do produto e abre a lista correspondente? (B10)
- [ ] Cada estado vazio diz o que significa e dá a próxima ação? Nenhuma área grande fica vazia sem razão nos ecrãs largos? (B11)
- [ ] Cada texto secundário muda uma decisão e não repete o conteúdo? Nada abaixo de 12 px? (B12)
- [ ] Não há sobretítulos em maiúsculas espaçadas nem numeração decorativa? (B13)
- [ ] A microcópia diz o que acontece, sem marketing nem exclamações? (B14)
- [ ] Não há frases do sistema, códigos ou «-» à vista do utilizador final? (B15)
- [ ] Não há emojis como ícone (os que são dados, secção 6, não contam) nem ícones em círculos coloridos a enfeitar títulos? (B16)
- [ ] Os raios seguem a escala do projeto e as sombras grandes ficam só no que flutua? (B17)
- [ ] O movimento explica uma mudança, pára com movimento reduzido e o hover não move alvos ao toque? (B18)
- [ ] Os esqueletos e spinners só aparecem quando a espera é real? (B19)
- [ ] Há uma só ação dominante (ou, numa confirmação, duas de peso igual com o texto a distinguir a destrutiva), cada ação parece clicável, e nenhum botão é delimitado por uma linha? (B20)
- [ ] Não há texturas decorativas no fundo, e nenhum estado é marcado só por riscas ou hachuras? (B21)
- [ ] O vidro e o desfoque ficam na moldura e nas camadas que flutuam, com o conteúdo numa superfície sólida e o fundo estático? (B22)
- [ ] Cada estado (progresso, sucesso, «a guardar», contagens, segurança) vem de um facto do sistema? (B23)
- [ ] O que decide está à vista e funciona com teclado e toque, sem depender de hover ou tooltip, e cada controlo tem nome? (B24)
- [ ] Tapado o logótipo e posto ao lado de um ecrã vizinho, parece a mesma aplicação, e não um modelo genérico?
- [ ] O ecrã foi visto em capturas nas resoluções-alvo, em cada tema do projeto, cheio e vazio (ou, num ecrã de um só registo, nos estados combinados), e com os painéis laterais abertos? (secção 4)
- [ ] A implementação bate com a variante escolhida? (secção 4)
- [ ] `node <skill>/scripts/detetar-slop.mjs --diff <base>` (`<skill>` é a pasta da `agentic-design`; num projeto, `.agentic/detetar-slop.mjs`) sai 0 (os pré-existentes que lista ficam numa linha do relatório, sem ir para o backlog), cada escape da lista «Escapes usados» tem um motivo que é decisão e não preguiça, e cada linha de «Permitidos» é mesmo dado ou o token de marca declarado? (secção 7)

## 6. Escape legítimo

A regra é contra tiques, não contra decisões do dono do produto. Quando o sistema de design do
projeto usa de propósito algo da lista, segue-se o projeto e regista-se porquê:

- **No código**, `slop-ok: <motivo>` num comentário no fim da linha, ou sozinho na linha
  anterior; para várias linhas seguidas, `slop-ok-bloco: <motivo>` … `slop-ok-fim`. Em JSON, que
  não tem comentários, uma linha `"//": "slop-ok: <motivo>"` antes da chave. O motivo diz que
  decisão é («aviso de perda de dados em vermelho vivo, aprovado pelo dono, ver DESIGN.md»), não
  «necessário». O detetor lista todos os escapes usados, com o motivo, para o revisor os julgar.
- **No documento de design**, a exceção fica escrita com o seu âmbito: onde vale e onde não vale.
- **Na declaração do projeto**, `.agentic/ui.json` na raiz do repo, para o que se repete e não
  pede um comentário em cada uso. Hoje declara os gradientes da marca (ver abaixo). É um ficheiro
  do repo: entra num commit, com a decisão do dono no `DESIGN.md` ou numa ADR.

Exceções que costumam ser legítimas:

- **Material da marca escolhido pelo dono** (uma superfície translúcida, um gradiente da marca na
  moldura ou no hero de um site): vale onde ele o aprovou, não se alastra ao conteúdo. Um
  gradiente de marca define-se **uma vez**, num token (`--grad-marca: linear-gradient(…)`), e
  declara-se em `.agentic/ui.json`:

  ```json
  { "gradientes_marca": ["--grad-marca"] }
  ```

  O detetor deixa passar a definição desse token (variável CSS, `$grad-marca` em Sass ou a chave
  `grad-marca` numa config, como o `backgroundImage` do Tailwind) e as declarações que o usam com
  `var(--grad-marca)`, e lista cada uma em «Permitidos». Continuam a bloquear um gradiente escrito
  à mão (mesmo com as cores da marca), classes Tailwind de gradiente (`from-violet-600`…) e
  qualquer token que não esteja declarado: assim a marca tem um gradiente e não vinte variantes.
- **Alertas de segurança** (risco para a pessoa, perda de dados, erro grave) em cor viva fora dos
  tokens, porque têm de gritar mais do que a marca.
- **Cores que são dados**, não tema: as séries de um gráfico, a cor que o utilizador escolheu para
  um recurso, a matiz de um avatar.
- **Emojis que são dados**, não ícones: as reações que o utilizador escolhe, um seletor de emoji,
  o conteúdo escrito por pessoas (mensagens, comentários). A regra é **dado ≠ ícone**:
  - **Dado, não bloqueia:** o emoji que chega por dados, props ou API (`{reacao.emoji}`), que o
    detetor nem vê; um literal só de emoji numa lista (`["👍", "🎉"]`, também numa lista partida
    em várias linhas) ou no valor de um objeto (`{ id: "gosto", emoji: "👍" }`); o valor de uma
    chave de conteúdo (`emoji`, `reacao`, `mensagem`, `comentario`, `conteudo`, `body`…), mesmo ao
    lado de texto; numa tradução, um valor só de emoji (`"reacaoGosto": "👍"`). O detetor lista
    cada um em «Permitidos», para o revisor confirmar que é mesmo dado.
  - **Ícone, bloqueia:** o literal no JSX ou no HTML (`<h2>✨ Novidades</h2>`, `<button>🚀</button>`),
    num atributo (`icone="⭐"`), numa chave de ícone ou de texto de interface (`icon`, `label`,
    `title`, `titulo`, `rotulo`, `botao`, `menu`…), numa constante solta (`const NOVIDADE = "🔥"`),
    num template com HTML, ou ao lado de texto numa tradução (`"✨ Novidades"`).
  - Um caso que o detetor lê mal (um dado com chave de rótulo, por exemplo) leva
    `slop-ok-bloco: <motivo>`; um ícone que passou por dado é achado do revisor (B16).
- **Um padrão da lista que a pesquisa mostra com função clara** nos produtos de referência da
  categoria (a pesquisa de referências, com fonte): não se bloqueia nem se adota sozinho; é
  proposta ao humano, antes de desenhar ou no gate.
- **Pedido explícito do humano** para algo da lista: faz-se. Diz-se uma vez o que custa (por
  exemplo, o contraste medido) e regista-se. Um efeito que ele aprovou (um contorno animado num
  cartão, o vidro da moldura) preserva-se onde ele o aprovou.

Quando o projeto não tem sistema nenhum, a secção 2 vale por inteiro e o primeiro ecrã define os
tokens que os seguintes reutilizam: tokens próprios, coerentes com a direção, e não uma paleta
universal reciclada. Num produto existente, a gramática vigente é a referência: uma direção nova
não autoriza redesenhar o login, trocar a fonte ou transplantar outra identidade.

## 7. O detetor mecânico

`scripts/detetar-slop.mjs`, na pasta desta skill (Node ≥ 20, sem dependências; abaixo,
`<skill>` é a pasta onde a skill agentic-design está instalada; num projeto com a cópia
versionada, `.agentic/detetar-slop.mjs` faz o mesmo), apanha só o que um
padrão de texto apanha com precisão; listas feias, vazio sem resposta e hierarquia ficam para a
checklist. É o chão, não o teto. Corre-se a partir da raiz do repo do projeto (o `--diff` usa o git
da pasta atual), no fim de cada fatia de UI e antes de pedir revisão:

```bash
node <skill>/scripts/detetar-slop.mjs --diff "$(git merge-base origin/main HEAD)"   # linhas alteradas desde a base (+ ficheiros novos)
node <skill>/scripts/detetar-slop.mjs src/app src/components   # pastas inteiras; --json para outro agente
node <skill>/scripts/detetar-slop.mjs <pasta das maquetas>     # variantes HTML, antes de as mostrar
```

| Sai | Regras |
|---|---|
| 1 (bloqueio) | `gradiente-roxo`, `gradiente-de-fundo` (secção/hero), `emoji`, `letra-pequena` (< 12 px), `microcopia-marketing`, `maiusculas-espacadas` (B13), `transicao-all` (B18), `escape-sem-motivo`, `escape-sem-fim` |
| 0 (aviso, listado) | `cor-literal`, `canto-grande` (≥ 20 px fora de cápsulas/avatares), `sombra-grande` (desfoque ≥ 20 px fora de camadas flutuantes, 3+ no conjunto), `sem-dados`, `hover-move-alvo` (o alvo em `:hover` move-se, fora de `@media (hover: hover)`; B18), `movimento-continuo` (animação infinita fora de uma espera; B18), `vidro-no-conteudo` (desfoque fora da moldura e das camadas que flutuam; B22), `borda-lateral` (≥ 2 px fora da navegação, do item ativo e das citações; B17), `botao-contorno` (botão com linha à volta; B20), `traco-vazio` («-» num campo vazio; B15), `numeracao-decorativa` («01 / …»; B13) |
| 2 (falha fechada) | argumento inválido, ficheiro ilegível, ref ou repositório git inválido, `.agentic/ui.json` inválido, nenhum ficheiro analisado, ou ficheiros com interface que não sabe ler (lista «Não analisados») |

Ficam fora do detetor, porque pedem juízo: os divisores repetidos (B4), as pastilhas (B2), o
contraste (B3, que se mede no browser), os cartões, as listas, o hero e os KPIs (B7–B10), os
números que contam de 0 (B18), os estados de faz-de-conta (B23) e a interação só na captura (B24).

Analisa `.css .scss .tsx .jsx .js .mjs .cjs .ts .mts .cts` (incluindo o HTML e o `<style>` dentro
de template strings) e `.html .vue .svelte .astro` e os modelos de servidor (`.hbs .njk .ejs .erb
.liquid .twig .jinja`). Nos ficheiros de tradução (`.po .arb .xliff .strings`, e `.json .yml
.properties` em pastas `locales/`, `i18n/`… ou com nome de língua, como `pt.json`) aplica só as
regras de texto (emoji, marketing, «sem dados»). Ignora comentários, testes, `.d.ts`, minificados,
`node_modules` e builds. Um bloqueio corrige-se ou escapa-se com motivo (secção 6), nunca se ignora.

**«0 ficheiros analisados» não é limpo.** Sai 2: o que não se leu não conta como prova. No
`--diff`, um ficheiro alterado com marcação HTML numa extensão que o detetor não lê (um template
num `.py`, `.php`, `.rb`…) aparece em «Não analisados» e também sai 2: passa-o à mão contra a
secção 2 (sobretudo B1, B12, B14 e B16), regista-o no relatório e corre o detetor sobre o resto
(`--diff <base> <caminhos>`) para obter a saída 0.

**Bloqueio que já lá estava.** O `--diff` lê os hunks de `git diff -U0 <base>` e conta só as
linhas que o diff acrescentou ou mudou; um ficheiro novo, também o que o git ainda não segue,
conta inteiro. Um achado numa linha que o diff não tocou sai na lista «Pré-existentes», não conta
para a saída e não se corrige à boleia (cada linha do diff liga-se ao pedido): fica numa linha do
relatório e da retro, sem ir para o backlog. Exceção: se a tarefa é redesenhar esse ecrã, corrige-se, e aí corre-se o detetor sobre
os ficheiros (`node <skill>/scripts/detetar-slop.mjs <ficheiro>`), que os lê inteiros.

**Escapes.** A saída lista cada escape usado (ficheiro, linha, motivo e o que cala), também no
`--json`. O revisor julga cada motivo.

**Permitidos sem escape.** O emoji que é dado e o gradiente de marca declarado em
`.agentic/ui.json` (secção 6) não bloqueiam, mas saem na lista «Permitidos» (`permitidos` no
`--json`), com ficheiro, linha e porquê. O revisor confirma que cada emoji é mesmo dado e que cada
gradiente usa o token declarado. O detetor lê `.agentic/ui.json` da raiz do repo git da pasta
atual (fora de um repo, da pasta atual); se o ficheiro não é JSON ou `gradientes_marca` não é uma
lista de nomes de token, sai 2.
