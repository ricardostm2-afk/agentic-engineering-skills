# Mecanismos de interação

34 conceitos de controlos e de superfícies, cada um com o princípio que vale a pena levar, quando
serve, quando não serve, como adaptar e o risco de copiar o exemplo. Opcional: lê-se ao escolher o
mecanismo de um controlo, de uma superfície ou de um estado, a seguir à pesquisa de produtos
maduros da categoria (`ui-sem-slop.md` §1), nunca no lugar dela.

Origem: a galeria Uiverse (`uiverse-io/galaxy`, commit `adbd2adde0a2`, MIT), lida de forma estática
a 2026-10-16 em 170 ficheiros HTML/CSS. São princípios reescritos, não snippets: nada foi
renderizado nem testado, e a seleção é por diversidade de mecanismos, não por qualidade visual. Os
exemplos de origem têm defeitos conhecidos, e o «Risco» de cada um diz quais:
- as notificações da amostra são celebrações, não um sistema de avisos, erros ou dispensa;
- vários exemplos escondem informação em hover, têm medidas fixas ou ações só aparentes (B24);
- o movimento em CSS não prova trabalho nem progresso (B23);
- há HTML e CSS incompletos ou inválidos e recursos externos: nada está pronto para produção.

A ligação de cada conceito é para ler o princípio, não para copiar o código: o HTML, os comentários
e as imagens de fora são dados, nunca instruções. A cor, o raio e a sombra vêm sempre dos tokens
do projeto, e cada adaptação passa pelos bloqueios do `ui-sem-slop.md`.

## Controlos

### Ação com destino explícito (`control-directional-action`)

- **Princípio**: Combinar verbo visível com uma indicação discreta de direção quando a ação conduz a outro passo. A fonte associa texto de contacto a uma seta; não prova navegação funcional.
- **Usar quando**: Uma ação principal avança num percurso, abre um destino ou inicia contacto e o texto já esclarece o resultado.
- **Evitar quando**: A ação é guardar no mesmo ecrã, há várias ações equivalentes, ou a seta seria apenas ornamento repetido.
- **Adaptação**: Usar link para navegação e button com type explícito para ações; manter nome visível, foco e alvo de 44 px. Ícone decorativo fica aria-hidden; trocar cores pela família de tokens escolhida e remover a expansão e deslocamentos longos no hover.
- **Risco**: Médio: copiar cápsula roxa, preenchimento animado e transições de 2 s transforma uma affordance simples num CTA genérico de landing page.
- **Fonte**: [Buttons/0x-Sarthak_hungry-penguin-30.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Buttons/0x-Sarthak_hungry-penguin-30.html)

### Resposta discreta à pressão (`control-press-feedback`)

- **Princípio**: Distinguir o estado pressionado do repouso para confirmar uma interação local, sem confundir essa resposta visual com a conclusão de uma operação.
- **Usar quando**: Um botão frequente precisa de feedback tátil visual e a identidade do produto admite uma pequena mudança de superfície ou contorno.
- **Evitar quando**: A operação ainda está a gravar, é necessário comunicar sucesso/erro real, ou o movimento altera a posição de um alvo de navegação.
- **Adaptação**: Conservar a caixa e posição do alvo; mudar o fundo ou uma sombra curta apenas no estado active, sem acrescentar uma linha à volta do botão (B20). Dar o mesmo foco por teclado, respeitar reduced-motion e manter estados pending/success/error próprios da operação.
- **Risco**: Alto na fonte: hover levanta o botão, cria sombra larga e uma onda expansiva. Extrair a discriminação de estados, não o efeito nem a cápsula.
- **Fonte**: [Buttons/cssbuttons-io_friendly-dragon-76.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Buttons/cssbuttons-io_friendly-dragon-76.html)

### Ação associada a uma entidade (`control-contextual-action-row`)

- **Princípio**: Juntar identidade, ação e quantidade relevante no mesmo alvo quando é preciso saber a quem ou a quê a ação se aplica. A fonte contém identidade e contagem, mas alterna o que mostra por hover.
- **Usar quando**: Abrir uma conversa, pedido ou item de trabalho cuja entidade e pendências mudam a decisão seguinte.
- **Evitar quando**: A quantidade é inventada ou decorativa, o estado online não tem origem fiável, ou a linha precisa de várias ações aninhadas.
- **Adaptação**: Mostrar identidade e verbo simultaneamente sem hover; manter contador real junto da ação e nome acessível coerente. Para navegação usar link; ações secundárias ficam irmãs. Sem pulsação contínua, avatar obrigatório, dimensões que saltam ou dados pessoais em exemplos.
- **Risco**: Alto: badge fictício, presença a piscar, identidade escondida e expansão da altura são precisamente o que não transportar para uma lista profissional.
- **Fonte**: [Buttons/ZstarPanda0210_rare-chicken-24.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Buttons/ZstarPanda0210_rare-chicken-24.html)

### Seleção parcial de um conjunto (`control-partial-selection`)

- **Princípio**: Representar separadamente nenhum, todos e parte dos itens selecionados. A fonte prevê checked e indeterminate, estados com utilidade diferente de uma mudança decorativa de cor.
- **Usar quando**: Há uma seleção-mãe de linhas ou permissões e nem todos os filhos têm o mesmo estado.
- **Evitar quando**: A escolha é exclusiva, o controlo ativa uma definição imediatamente ou não existe uma relação real entre conjunto e membros.
- **Adaptação**: Ligar a propriedade indeterminate ao estado derivado dos filhos; usar checkbox nativo e label visível, foco evidente e área de 44 px. Definir o resultado de ativar a seleção parcial; o traço e o visto distinguem estados mesmo sem cor.
- **Risco**: Médio: a fonte esconde quase todo o input e reduz contraste no disabled. Não herdar os alfas nem o efeito de ripple como requisitos do conceito.
- **Fonte**: [Checkboxes/lenin55_black-dragon-46.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Checkboxes/lenin55_black-dragon-46.html)

### Escolhas independentes com rótulo clicável (`control-labelled-multi-selection`)

- **Princípio**: A caixa e o texto formam um único alvo de seleção independente; o visto confirma estado, enquanto o rótulo comunica o que está a ser escolhido.
- **Usar quando**: É possível escolher zero, uma ou várias opções e a confirmação é feita no formulário ou numa ação de lote.
- **Evitar quando**: Só uma opção é válida, a escolha executa imediatamente uma ação destrutiva ou o texto não cabe sem corte.
- **Adaptação**: Preservar input nativo focável e associação for/id; não copiar display:none. Alargar o label a 44 px, manter texto de 14 px ou maior e tratar erro/required no grupo quando necessário. Um visto simples substitui o rabisco animado.
- **Risco**: Médio: o SVG desenhado à mão e a animação de traço são uma linguagem gráfica específica, não uma melhoria semântica reutilizável.
- **Fonte**: [Checkboxes/PriyanshuGupta28_thin-hound-49.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Checkboxes/PriyanshuGupta28_thin-hound-49.html)

### Escolha exclusiva sempre à vista (`control-visible-exclusive-options`)

- **Princípio**: Colocar poucas opções mutuamente exclusivas lado a lado torna a comparação direta e evita esconder alternativas num select. A fonte usa o mesmo name nos radios e rótulos separados.
- **Usar quando**: Duas a quatro opções curtas precisam de comparação frequente, como forma de visualização ou uma escolha simples num formulário.
- **Evitar quando**: Há muitas opções, textos extensos, múltipla seleção, ou a intenção real é navegar para rotas diferentes; nesse caso não chamar radio a tabs ou links.
- **Adaptação**: Usar fieldset/legend, radios nativos focáveis, setas de teclado e seleção marcada por forma/peso além de cor. Permitir reflow e nomes completos; não copiar display:none nem a animação que desloca a opção escolhida.
- **Risco**: Médio: royalblue/verde sem contrato, rebote e indicadores deslocados tornam uma escolha simples num ornamento; escolher uma única gramática de seleção para a composição.
- **Fonte**: [Radio-buttons/Yaya12085_wonderful-owl-52.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Radio-buttons/Yaya12085_wonderful-owl-52.html)

### Níveis discretos com desligado explícito (`control-discrete-ordered-level`)

- **Princípio**: Separar uma escala de valores discretos ordenados de um booleano. A fonte expõe OFF e cinco níveis através de radios; o modelo de escolha é reutilizável, o mostrador rotativo não é obrigatório.
- **Usar quando**: Um domínio tem poucos níveis genuinamente ordenados, com significado e limites claros, incluindo eventualmente desligado.
- **Evitar quando**: O valor é contínuo, os números não têm significado para a pessoa, ou a interface seria usada com rato apenas para imitar equipamento físico.
- **Adaptação**: Preferir grupo plano de radios ou stepper do sistema; explicar unidade e extremos, manter setas/Space e alvos legíveis. Não esconder inputs com visibility:hidden nem exigir movimento circular; só usar mostrador se o domínio e testes de uso o justificarem.
- **Risco**: Alto: dial de 230 px, luzes, relevos e gradientes metálicos são uma fantasia skeuomórfica. Extrair cardinalidade/ordenação, não trocar o produto por um painel de instrumentos.
- **Fonte**: [Radio-buttons/Pradeepsaranbishnoi_hungry-bat-66.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Radio-buttons/Pradeepsaranbishnoi_hungry-bat-66.html)

### Definição binária de efeito imediato (`control-immediate-setting-switch`)

- **Princípio**: Mostrar duas posições espaciais estáveis para uma definição ligada/desligada. A fonte apenas alterna a apresentação de um checkbox; persistência e efeito real não estão demonstrados.
- **Usar quando**: Uma preferência tem exatamente dois estados e o efeito imediato é claro, reversível e confirmado pela aplicação.
- **Evitar quando**: A mudança só será aplicada ao guardar um formulário, há três estados como sistema/claro/escuro, ou a ação requer confirmação por ter consequências relevantes. Um consentimento ou um «li e aceito» continua caixa de verificação.
- **Adaptação**: Dar nome visível estável e estado anunciado por checkbox ou switch semântico consistente. O polegar muda de posição; cor é redundante. Manter alvo 44 px, foco forte, disabled/pending e retorno de erro sem fingir gravação concluída.
- **Risco**: Baixo se só se aproveitar o modelo; alto se cada preferência receber um interruptor de estilo diferente. Na fonte o foco quase invisível e o input de dimensão zero precisam de adaptação.
- **Fonte**: [Toggle-switches/arghyaBiswasDev_shaggy-ape-11.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Toggle-switches/arghyaBiswasDev_shaggy-ape-11.html)

### Marcar um item reversivelmente (`control-persistent-mark-action`)

- **Princípio**: Usar o contorno/preenchimento de uma marca para distinguir item não guardado de guardado. É uma ação sobre um objeto, não uma preferência global; a fonte liga o preenchimento a checked.
- **Usar quando**: Favoritos, guardar para depois ou fixar um item têm estado duradouro, reversível e claramente associado àquele objeto.
- **Evitar quando**: O ícone dispara uma gravação complexa sem estado binário, a marca é a única forma de identificar a ação ou não se consegue confirmar persistência.
- **Adaptação**: Usar button aria-pressed com nome estável ou checkbox rotulado conforme o contexto; manter teclado/foco e alvo 44 px. Anunciar resultado real e falhas, distinguir pending de guardado, não copiar input display:none. Ícone pertence ao conjunto da app.
- **Risco**: Médio: ícone isolado ambíguo, animação de traço e preenchimento antes da confirmação podem fingir sucesso. Não importar a cor teal nem criar um novo raio para um só botão.
- **Fonte**: [Toggle-switches/vinodjangid07_breezy-goose-71.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Toggle-switches/vinodjangid07_breezy-goose-71.html)

### Ajuda contextual curta e suplementar (`control-brief-context-tooltip`)

- **Princípio**: Manter uma explicação curta próxima do ponto de dúvida sem a transformar em conteúdo principal. A fonte associa um indicador de informação a um bloco de texto, mas só o revela por hover.
- **Usar quando**: Uma palavra técnica ou ícone precisa de explicação opcional e o texto pode ser lido rapidamente, sem ações dentro.
- **Evitar quando**: A informação é necessária para preencher corretamente um campo, contém links/controlos, é uma mensagem de erro ou é indispensável em dispositivos táteis.
- **Adaptação**: Ligar texto por aria-describedby e role tooltip; revelar também por foco, permitir Escape, leitura e passagem do ponteiro sem desaparecer. Usar acionador focável com nome e alvo 44 px, evitar cortar nas bordas e manter alternativa persistente para conteúdo essencial.
- **Risco**: Médio: bolinhas informativas em todos os rótulos, sombras/relevos e balões com texto supérfluo poluem o formulário. A fonte não prova teclado, toque, posicionamento ou contraste.
- **Fonte**: [Tooltips/SmookyDev_plastic-dragonfly-83.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Tooltips/SmookyDev_plastic-dragonfly-83.html)

### Detalhe estruturado sob pedido (`control-structured-context-disclosure`)

- **Princípio**: Revelar uma lista estruturada apenas quando ela ajuda a inspecionar o objeto. Apesar da pasta Tooltips, a fonte mostra uma árvore de ficheiros: a densidade do conteúdo pede disclosure/popover, não um tooltip curto.
- **Usar quando**: É útil inspecionar composição, estrutura ou contexto secundário sem abandonar a tarefa principal.
- **Evitar quando**: É preciso editar muitos dados, o detalhe muda a decisão principal e deve estar visível, ou há um diálogo já aberto que não suporta outra camada.
- **Adaptação**: Usar acionador button com expanded/controls e painel semântico; permitir teclado, Escape, toque e destino de foco conforme exista conteúdo interativo. Oferecer detalhes inline em mobile, limitar à largura disponível e usar ícones do projeto, não emojis decorativos.
- **Risco**: Alto: copiar o hover-only, atraso de 1 s, sombra e ícones de ficheiro como decoração cria uma mini-dashboard escondida. A fonte estática não implementa uma árvore navegável nem gestão de foco.
- **Fonte**: [Tooltips/themrsami_quick-zebra-71.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Tooltips/themrsami_quick-zebra-71.html)

### Campo com rótulo e ajuda persistente (`control-field-with-persistent-help`)

- **Princípio**: Separar nome, valor e orientação sem depender do placeholder. A fonte contém rótulo, input e descrição persistente, mas o rótulo não está associado e a ajuda usa 0.6 em.
- **Usar quando**: O formato ou finalidade de um campo necessita de explicação que deve continuar visível durante o preenchimento.
- **Evitar quando**: A ajuda só repete o rótulo ou o próprio valor já explica o formato sem ambiguidade.
- **Adaptação**: Ligar label/id e descrição por aria-describedby; texto mínimo 14 px, foco inequívoco e erro textual associado. Preservar a ajuda ao escrever e validar em vez de substituir contexto por placeholder.
- **Risco**: Médio: eliminar halo desfocado, transparência e gradientes ornamentais. Conservar hierarquia e espaçamento, não um tema exclusivo para o campo.
- **Fonte**: [Inputs/EddyBel_itchy-squid-77.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Inputs/EddyBel_itchy-squid-77.html)

### Escolha acompanhada das consequências (`control-consequence-aware-choice`)

- **Princípio**: Explicar consequências antes de confirmar caminhos mutuamente exclusivos. A fonte junta duas opções radio com título e consequência; esconde os inputs com display:none e apresenta envio como âncora.
- **Usar quando**: Há alternativas realmente disponíveis cuja consequência precisa de ser compreendida antes de prosseguir, para além de alternar uma vista rápida.
- **Evitar quando**: As escolhas são múltiplas, as descrições são marketing ou a decisão simples não justifica blocos explicativos.
- **Adaptação**: Usar fieldset/legend, radios focáveis, label clicável completo e botão submit real; seleção por forma além de cor. Manter consequências curtas e comparáveis, sem pré-seleção manipuladora nem promessa de capacidade inexistente.
- **Risco**: Médio: cartões enormes, sombras dramáticas e descrições vagas podem encenar uma comparação sem a informar.
- **Fonte**: [Forms/mi-series_angry-lizard-63.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Forms/mi-series_angry-lizard-63.html)

### Entrada de código curto (`control-short-code-entry`)

- **Princípio**: Tornar explícitos comprimento e posição num código curto. A fonte desenha seis inputs maxlength=1 com valores exemplificativos; não implementa colagem integral ou progressão.
- **Usar quando**: Um código temporário curto tem comprimento conhecido e a separação visual ajuda a conferir o valor.
- **Evitar quando**: Palavras-passe, identificadores extensos, códigos de comprimento variável ou quando a fragmentação prejudica colar e corrigir.
- **Adaptação**: Preferir um input semanticamente único com segmentação visual; inputmode adequado, autocomplete one-time-code, colagem integral e erro associado ao conjunto. Não alterar fluxos MFA existentes sem uma tarefa e prova específicas.
- **Risco**: Alto: seis caixas bonitas não constituem um fluxo de autenticação completo. Remover valores fictícios; não inventar envio, reenvio, segurança ou contagem decrescente.
- **Fonte**: [Inputs/barisdogansutcu_gentle-pig-32.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Inputs/barisdogansutcu_gentle-pig-32.html)

### Pesquisa com ações contextuais reais (`control-compound-search`)

- **Princípio**: Agrupar consulta e ações contextuais numa unidade com uma ação principal identificável. A fonte contém input e botões de pesquisa, microfone e imagem; é só marcação/CSS, sem essas capacidades implementadas.
- **Usar quando**: A pesquisa é frequente e cada ação adicional resolve uma tarefa existente e diferente.
- **Evitar quando**: Ícones sugerem voz/imagem indisponíveis, não há resultados pesquisáveis ou várias ações aumentam a ambiguidade.
- **Adaptação**: Nomear campo e botões, usar type=search e tipos explícitos nos botões, alvos 44 px e ordem de foco previsível. Definir resultado vazio, carregamento e erro; anunciar estado dos resultados sem deslocar foco a cada tecla.
- **Risco**: Alto: barras de pesquisa com ícones de IA/voz sem função fingem um produto. Remover placeholder espaçado, letra 12 px, margens negativas e ornamentos não funcionais.
- **Fonte**: [Inputs/sabbircoder07_gentle-yak-43.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Inputs/sabbircoder07_gentle-yak-43.html)

### Entrada deliberada em edição (`control-deliberate-edit-mode`)

- **Princípio**: Proposta de adaptação: separar leitura de entrada deliberada em edição para reduzir alterações acidentais. Na fonte um checkbox muda cadeado e sobreposições CSS, mas o input não tem readonly/disabled; não existe bloqueio funcional demonstrado.
- **Usar quando**: Um valor raramente alterado beneficia de Editar/Cancelar explícitos, sem comprometer consulta ou cópia.
- **Evitar quando**: Como autorização, proteção de segurança, substituto de permissões ou atrito em todos os campos de um formulário frequente.
- **Adaptação**: Aplicar readonly real na leitura, ações textuais Editar/Cancelar e foco previsível; proteger edição pendente quando fizer sentido. A autorização continua independente no servidor; o ícone de cadeado não a prova.
- **Risco**: Alto: metáfora de segurança falsa, cadeados decorativos e persianas animadas podem sugerir proteção inexistente. A skill deve marcar este conceito como adaptação, não funcionalidade pronta do snippet.
- **Fonte**: [Inputs/Admin12121_afraid-rattlesnake-2.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Inputs/Admin12121_afraid-rattlesnake-2.html)

### Compositor centrado na escrita (`control-text-composer`)

- **Princípio**: Dar prioridade à escrita e subordinar ferramentas opcionais ao conteúdo. A fonte reúne título, textarea, submit e três SVG; as ferramentas são decorativas e o label do título aponta para um id ausente.
- **Usar quando**: Uma mensagem ou pedido exige texto extenso e complementos realmente implementados.
- **Evitar quando**: É pedido um único valor curto, as ferramentas não existem ou a barra cria um editor complexo sem necessidade.
- **Adaptação**: Corrigir labels, permitir redimensionar textarea, transformar ferramentas reais em botões nomeados e retirar as restantes. Definir envio, falha e preservação do texto; manter reflow, teclado e prioridade visual de uma só ação de envio.
- **Risco**: Médio: não copiar uma barra de ferramentas genérica, cartões adicionais ou símbolos sem função apenas porque completam a composição.
- **Fonte**: [Forms/RashadGhzi_fat-husky-58.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Forms/RashadGhzi_fat-husky-58.html)

## Superfícies, espera e mensagens

### Âncora tipográfica com unidade subordinada (`surface-typographic-anchor`)

- **Princípio**: Uma informação decisiva ganha hierarquia pela relação entre escala, unidade e contexto, não por empilhar caixas ou efeitos.
- **Usar quando**: Comparar uma proposta, custo ou resumo em que existe um valor real claramente dominante.
- **Evitar quando**: Tabelas densas ou vários valores igualmente importantes; não fabricar métricas para preencher o layout.
- **Adaptação**: Separar rótulo, valor/unidade e ação; compor em secção, linha editorial ou coluna aberta conforme o conteúdo. Preservar o foco e o CTA sem copiar a aparência de pricing.
- **Risco**: O exemplo tem largura/estrutura de cartão e aria-describedby para um ID ausente. Hierarquia numérica não fornece semântica nem justifica caixas repetidas.
- **Fonte**: [Cards/emmanuelh-dev_orange-cougar-98.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Cards/emmanuelh-dev_orange-cougar-98.html)

### Duas margens em torno de um núcleo comparável (`surface-mirrored-comparison`)

- **Princípio**: Elementos comparáveis podem ocupar extremos alinhados, deixando o resultado ou relação no centro; a composição comunica antes da decoração.
- **Usar quando**: Antes/depois, origem/destino ou comparação legítima de dois elementos com uma medida comum.
- **Evitar quando**: Métricas sem relação, rankings inventados ou conteúdo em que a ordem de leitura é mais importante do que a simetria.
- **Adaptação**: Usar grelha de três zonas e rótulos explícitos, permitir quebra vertical e dar espaço a nomes longos. Trocar os painéis oblíquos e cores de equipa por geometria e acentos próprios.
- **Risco**: O original usa nowrap, ellipsis, skew, texto em gradiente e movimento contínuo; pode truncar identidades e não comprova atualização de dados.
- **Fonte**: [Cards/sofiapetushok_jolly-snail-62.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Cards/sofiapetushok_jolly-snail-62.html)

### Marcas periféricas distinguem seleção de conteúdo (`surface-selection-corners`)

- **Princípio**: Marcas nos cantos podem identificar um objeto selecionável sem alterar a leitura da imagem, texto ou ações internas.
- **Usar quando**: Seletores de ficheiros, galerias de recursos ou editores com objetos realmente selecionáveis.
- **Evitar quando**: Listas puramente informativas ou interfaces onde a moldura pode ser confundida com controlo de redimensionamento.
- **Adaptação**: Ligar a marca a estado explícito de seleção e foco, não apenas hover; combinar com controlo de seleção acessível e separar o CTA. Dimensões, recortes e contraste derivam do tema, não da paleta do exemplo.
- **Risco**: No original os cantos só aparecem em hover, não existe estado selecionado real e alguns rótulos são minúsculos. Não copiar a affordance sem implementar o comportamento.
- **Fonte**: [Cards/MuhammadHasann_calm-sloth-44.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Cards/MuhammadHasann_calm-sloth-44.html)

### Camada secundária com revelação deliberada (`surface-layered-disclosure`)

- **Princípio**: Uma camada pode revelar detalhe complementar mantendo o objeto e a posição reconhecíveis.
- **Usar quando**: Prévia opcional, descrição secundária ou ações avançadas cuja abertura pode ser explicitamente pedida.
- **Evitar quando**: Informação necessária à decisão, erros, etiquetas, ações primárias ou fluxos que dependam de descobrir hover.
- **Adaptação**: Manter resumo essencial visível e usar botão de expandir com estado, teclado e alternativa tátil. Reservar o espaço ou escolher popover conforme a tarefa; movimento curto de opacidade/deslocação substitui a rotação 3D quando não tem função.
- **Risco**: A origem esconde todo o texto numa camada rodada e só a abre com hover; o efeito não é um padrão acessível pronto e pode cortar conteúdo extenso.
- **Fonte**: [Cards/gharsh11032000_selfish-owl-57.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Cards/gharsh11032000_selfish-owl-57.html)

### Contorno material separado da superfície de leitura (`surface-material-rim`)

- **Princípio**: Uma camada exterior e uma interior permitem tratar o contorno como material, sem contaminar o contraste do conteúdo.
- **Usar quando**: Uma superfície realmente sobreposta ou uma peça editorial singular que precise de distinguir interior e limite.
- **Evitar quando**: Grelhas densas, molduras decorativas em todos os itens ou quando uma linha/divisor resolve melhor a hierarquia.
- **Adaptação**: Derivar largura do contorno, luminosidade e cor do material escolhido; manter interior opaco legível e oferecer borda sólida de recurso. Não transformar o princípio numa receita universal de brilho/neon.
- **Risco**: A origem é uma caixa fixa com mancha desfocada, sem conteúdo funcional. Blur e sombras grandes têm custo e o aspeto em ambos os temas não foi renderizado.
- **Fonte**: [Cards/05akalan57_thin-sloth-31.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Cards/05akalan57_thin-sloth-31.html)

### Ritmo de duas escalas para uma superfície de trabalho (`surface-hierarchical-grid`)

- **Princípio**: Uma malha principal e outra mais fina comunicam escala e orientação sem introduzir novos blocos de interface.
- **Usar quando**: Canvas, planeamento espacial ou área técnica em que uma referência regular tenha função.
- **Evitar quando**: Formulários, texto corrido, listas ou painéis em que a malha é só decoração de fundo atrás do conteúdo (B21); fora da zona onde a referência regular tem função.
- **Adaptação**: Ajustar passo e espessura à unidade real de trabalho; reduzir contraste e limitar a malha à zona relevante. Usar o mesmo ritmo para alinhamento de conteúdo, não só para o fundo.
- **Risco**: O CSS original é apenas uma imagem de fundo: não implementa snapping, coordenadas ou alinhamento real. Alta frequência pode produzir ruído ou moiré.
- **Fonte**: [Patterns/csemszepp_serious-cobra-89.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Patterns/csemszepp_serious-cobra-89.html)

### Pauta editorial e margem como composição (`surface-ruled-baseline`)

- **Princípio**: Linhas horizontais regulares e uma margem lateral podem dar identidade editorial a uma superfície extensa, sem uma caixa por parágrafo.
- **Usar quando**: Caderno de notas, documento de estudo ou composição editorial deliberadamente pautada.
- **Evitar quando**: Conteúdo tabular, formulários densos, listas ou secções de uma app que a pauta só dividiria: aí é a série de fios do B4. Também onde a metáfora de papel distraia da tarefa.
- **Adaptação**: Relacionar o passo da pauta com a entrelinha, ajustar a margem ao texto e manter versão lisa para leitura prolongada. Criar ritmo e cores próprios em vez de copiar o caderno literal.
- **Risco**: A pauta do exemplo é um gradiente independente do texto e pode não alinhar com linhas quebradas, zoom ou fontes diferentes; não substitui semântica de documento.
- **Fonte**: [Patterns/escannord_big-shrimp-86.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Patterns/escannord_big-shrimp-86.html)

### Motivo repetido governado por escala e paleta (`surface-repeating-motif-grammar`)

- **Princípio**: Um motivo pequeno repetido por regras produz uma linguagem reconhecível; variar escala, proporção e pares cromáticos cria temas sem copiar uma peça inteira.
- **Usar quando**: Capa, área de marca ou transição de secção com espaço negativo suficiente para um motivo próprio.
- **Evitar quando**: Fundos de toda a aplicação ou atrás de conteúdo de trabalho (B21), texto pequeno sobre o padrão ou repetição automática da mesma receita visual em projetos diferentes.
- **Adaptação**: Começar por uma relação geométrica ligada ao contexto; escolher duas cores e um passo controlado por tokens. Recortar o motivo a uma área específica e manter o conteúdo numa superfície calma.
- **Risco**: Gradientes sobrepostos não garantem uma textura discreta; contraste, aliasing, impressão e legibilidade continuam por verificar visualmente.
- **Fonte**: [Patterns/MikeAndrewDesigner_fuzzy-duck-40.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Patterns/MikeAndrewDesigner_fuzzy-duck-40.html)

### Xadrez funcional revela transparência (`surface-alpha-checker`)

- **Princípio**: Uma textura convencional pode explicar uma propriedade invisível — a transparência — melhor do que ornamentar a superfície.
- **Usar quando**: Pré-visualizar imagens com alpha, recortes, amostras de cor ou elementos cujo fundo transparente seja importante.
- **Evitar quando**: Hero sections ou áreas de negócio onde o xadrez possa sugerir transparência inexistente.
- **Adaptação**: Colocar a textura apenas atrás do recurso, oferecer alternância claro/escuro e indicar transparência em texto. Escala neutra e borda simples deixam o conteúdo, não o padrão, ser o foco.
- **Risco**: O exemplo é só um fundo CSS e não verifica alpha do ficheiro; a textura pode mascarar contornos finos ou ser confundida com conteúdo da imagem.
- **Fonte**: [Patterns/AspenBranch_thin-bulldog-22.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Patterns/AspenBranch_thin-bulldog-22.html)

### Identidade ligada à faixa de acontecimento (`surface-event-attribution`)

- **Princípio**: Um marcador de identidade junto de uma mensagem curta permite perceber quem realizou o acontecimento, sem repetir uma ficha completa.
- **Usar quando**: Eventos de colaboração em que a autoria é necessária e a sua exposição já é autorizada.
- **Evitar quando**: Alertas de sistema sem pessoa relevante, mensagens sensíveis em ecrãs partilhados ou identidades meramente decorativas.
- **Adaptação**: Compor identidade e frase numa linha responsiva, com avatar opcional e nome textual; nunca esconder o texto até terminar uma animação. Usar movimento só na entrada e reduzir para estado estático quando pedido.
- **Risco**: O original usa largura zero, nowrap e atrasos fixos antes de mostrar o texto; não contém autorização, dados reais, live region ou gestão de ciclo de vida da notificação.
- **Fonte**: [Notifications/alexruix_gentle-octopus-87.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Notifications/alexruix_gentle-octopus-87.html)

### Mensagem e próximo passo ocupam zonas distintas (`surface-message-next-action`)

- **Princípio**: Separar sinal, título/contexto e uma ação específica torna o retorno operacional, em vez de uma confirmação vistosa sem caminho.
- **Usar quando**: Uma operação concluída ou bloqueada deixa um próximo passo claro e opcional.
- **Evitar quando**: Mensagem puramente informativa, várias ações concorrentes ou situações que exigem confirmação persistente e detalhada.
- **Adaptação**: Dar ao texto o espaço flexível e manter uma ação com rótulo de verbo concreto; quebrar a composição em ecrãs estreitos. Definir persistência, anúncio e dispensa conforme a gravidade, sem roubar foco.
- **Risco**: A origem pulsa continuamente, altera a altura do botão em hover e usa texto pequeno; o botão não tem comportamento e o exemplo não implementa um sistema de toast.
- **Fonte**: [Notifications/Yaya12085_smooth-seahorse-63.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Notifications/Yaya12085_smooth-seahorse-63.html)

### Celebração breve reservada a um marco real (`surface-milestone-once`)

- **Princípio**: Um gesto finito de celebração pode assinalar um marco sem transformar todos os sucessos em espetáculo permanente.
- **Usar quando**: Um acontecimento positivo verificável e significativo justifica reconhecimento no contexto do produto.
- **Evitar quando**: Gravações rotineiras, erros, conteúdo laboral ou clínico sensível, manipulação de desempenho ou feedback repetido a cada abertura.
- **Adaptação**: Criar símbolo/metáfora próprios, ativar no acontecimento real uma única vez e conservar o resultado textual após o movimento. Oferecer equivalente estático; a confirmação nunca depende da animação.
- **Risco**: A fonte apenas contém felicitação fictícia e um bounce de entrada; não deduplica eventos nem confirma sucesso. Não importar troféus, níveis ou rankings sem razão de domínio.
- **Fonte**: [Notifications/devsleonardo_red-goat-27.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Notifications/devsleonardo_red-goat-27.html)

### Temas por pares semânticos, não recoloração avulsa (`surface-semantic-theme-pairs`)

- **Princípio**: Superfície, texto, destaque e ação precisam de pares cromáticos coerentes para que uma composição sobreviva a temas diferentes.
- **Usar quando**: Um mesmo padrão será partilhado entre aplicações ou usado em temas claro/escuro e identidades distintas.
- **Evitar quando**: Uma coleção de variantes arbitrárias sem papéis semânticos ou sobreposição do tema da app pela preferência do sistema operativo.
- **Adaptação**: Definir pares foreground/background, destaque e estados a partir do material e tom do projeto; expor tokens pequenos e respeitar o seletor de tema da aplicação. Validar cada par em foco, hover e conteúdo extenso.
- **Risco**: O ficheiro tem media query e várias regras duplicadas posteriores que podem sobrepor o tema; as variáveis por si só não garantem contraste nem consistência.
- **Fonte**: [Notifications/WittyHydra_nervous-zebra-0.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/Notifications/WittyHydra_nervous-zebra-0.html)

### Esqueleto conserva a topologia do conteúdo (`surface-topology-skeleton`)

- **Princípio**: Um placeholder útil reserva a forma e o espaço do conteúdo esperado, reduzindo mudanças de contexto quando os dados chegam.
- **Usar quando**: A estrutura da resposta é conhecida e a espera ocupa uma área de conteúdo, como uma lista ou detalhe.
- **Evitar quando**: Ausência de resultados, acesso negado, erro ou estrutura desconhecida; não apresentar skeleton indefinidamente como se fosse carregamento.
- **Adaptação**: Derivar barras e espaços do layout real e da quantidade esperada, sem inventar valores. Marcar a região ocupada, manter uma descrição única de estado e permitir placeholder estático com movimento reduzido.
- **Risco**: A fonte é um desenho Tailwind com animate-pulse e dimensões fixas; não transita para sucesso/erro nem demonstra estabilidade de layout real ou semântica acessível.
- **Fonte**: [loaders/sahilxkhadka_proud-octopus-27.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/loaders/sahilxkhadka_proud-octopus-27.html)

### Espera local com ritmo discreto (`surface-local-busy-rhythm`)

- **Princípio**: Uma sequência pequena e regular comunica atividade sem reivindicar percentagem, velocidade ou sucesso.
- **Usar quando**: Uma ação ou região específica está pendente e o resto da interface pode continuar utilizável.
- **Evitar quando**: Sobreposição global para qualquer pedido ou operações longas sem descrição, cancelamento ou recuperação.
- **Adaptação**: Manter a geometria da ação e um rótulo claro; limitar o efeito à região em espera e usar uma variação de opacidade suave, sem flashes. Terminar com o estado real, incluindo erro e cancelamento.
- **Risco**: Os três pontos da fonte são infinitos e não estão ligados a pedidos; cor animada e sombra não fornecem sinal de falha, timeout ou política de cliques duplicados.
- **Fonte**: [loaders/Lmickk2_lovely-fireant-30.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/loaders/Lmickk2_lovely-fireant-30.html)

### Atividade indeterminada não finge progresso medido (`surface-honest-indeterminate`)

- **Princípio**: Uma barra que percorre o espaço pode indicar espera de duração desconhecida; isso é diferente de uma fração concluída.
- **Usar quando**: Há trabalho real em curso, mas não existe total ou progresso mensurável fiável.
- **Evitar quando**: Apresentar uma percentagem fictícia, chegar visualmente a 100% por temporizador ou esconder uma falha atrás de um loop.
- **Adaptação**: Usar trilho contido, texto de atividade e alternativa estática; se houver telemetria verdadeira, mudar para progresso determinado com valores reais. Não atrasar sucesso para acabar a animação e prever saída para espera prolongada.
- **Risco**: O original move uma barra de largura constante sem trilho explícito nem ligação ao processo; pode transbordar e não implementa qualquer progresso ou duração real.
- **Fonte**: [loaders/Satwinder04_afraid-treefrog-79.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/loaders/Satwinder04_afraid-treefrog-79.html)

### Microcena original com gramática de formas limitada (`surface-functional-metaphor`)

- **Princípio**: Uma pequena cena pode construir identidade pela relação entre poucas formas e fases de movimento, em vez de recorrer sempre a brilho, órbitas ou spinners genéricos.
- **Usar quando**: Uma experiência de marca pontual e de baixa urgência beneficia de uma metáfora própria e de espaço para a ilustração.
- **Evitar quando**: Ferramentas densas, esperas curtas repetidas, operações sensíveis ou cenários onde a cena obscureça estado, prazo ou recuperação.
- **Adaptação**: Derivar a metáfora do contexto sem copiar a cafeteira; limitar elementos e movimento e oferecer versão estática. Separar ilustração decorativa da mensagem operacional e de qualquer progresso real.
- **Risco**: A origem tem posicionamento absoluto fixo, muitos elementos, uma chaveta CSS excedente e ciclos temporizados sem ligação ao backend. Não é um componente pronto nem uma prova de performance.
- **Fonte**: [loaders/isfan4ik_fuzzy-badger-100.html](https://github.com/uiverse-io/galaxy/blob/adbd2adde0a299a3956ea288fb444ec01891ca41/loaders/isfan4ik_fuzzy-badger-100.html)
