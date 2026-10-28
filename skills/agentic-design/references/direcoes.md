# Direções: gramáticas, diversidade e combinações

Para conceber direções ou variantes de trabalho novo, ou para combinar referências. Num produto
existente, a gramática vigente é a referência: a primeira pergunta é o que já distingue o produto,
e a direção refina-se dentro dessas forças.

## 1. Gramáticas, não templates

Pontos de partida para raciocinar, não presets a aplicar. Uma gramática define organização,
hierarquia, densidade, material e comportamento; a paleta vem depois. Podem surgir direções novas:
explicam-se pelos mesmos eixos e mostra-se a adequação.

| Gramática | Estrutura e assinatura | Serve quando | Risco / contraponto |
|---|---|---|---|
| Serviço humanista | Tarefa do dia primeiro; leitura simples, grupos por intenção, espaço só onde ajuda a decidir | Saúde, recursos humanos, serviços pessoais | Confundir calma com espaço vazio, cartões pastel e ações escondidas |
| Instrumento operacional | Grelha alinhada, ritmos curtos, números tabulares, ação e detalhe junto do registo | Operações frequentes, escalas, finanças | Densidade sem hierarquia e alvos minúsculos; dar percurso de teclado e detalhe progressivo |
| Editorial cultural | Escala tipográfica deliberada, sequências assimétricas, imagens e citações com função narrativa | Cultura, publicações, exposições | Converter tudo num hero; o conteúdo longo precisa de índice e leitura confortável |
| Oficina industrial | Grupos por processo, geometria robusta, etiquetas e estados explícitos | Ferramentas de criação, manutenção, produção | Decorar com parafusos e hachuras, ou monoespaçada em tudo; a máquina não é o utilizador |
| Arquivo e papel | Metadados e índice à vista, o documento como unidade, ritmo de página | Pesquisa, arquivos, bibliotecas | Texturas que reduzem a leitura; o papel é uma metáfora de organização, não um filtro sépia |
| Observatório científico | Comparação, escalas e unidades, camadas de detalhe e evidência | Dados, investigação, monitorização | Gráficos e brilho sem decisão; identificar ausência e incerteza, não inventar leituras |
| Wayfinding | Percurso e posição reconhecíveis, marcos, próximo passo e retorno previsíveis | Serviços, orientação, fluxos de várias etapas | A cor como única instrução, ou um processo partido em assistente sem necessidade |
| Tátil lúdico | Formas e feedback de manipulação, causa e efeito direto, ritmo variável | Aprendizagem, criação, experiências adequadas à pessoa | Efeitos caros, hover obrigatório ou infantilizar ferramentas profissionais |
| Precisão silenciosa | Poucas superfícies, detalhes tipográficos e geométricos consistentes, ação inequívoca | Produtos premium, ferramentas focadas | Cinzentos fracos e affordances escondidas em nome do minimalismo |
| Noturno imersivo | Campo visual controlado, conteúdo luminoso, profundidade ligada à tarefa | Música, jogo, criação audiovisual | Neon e vidro em toda a UI; as áreas de trabalho ficam legíveis e as saídas evidentes |
| Serviço público | Linguagem direta, formulário e estado claros, conteúdo acima do ornamento | Pedidos, educação, informação cívica | Burocracia visual, paredes de texto, copiar o aspeto institucional sem necessidade |
| Caderno de campo | Coleção e observação por contexto, imagens e anotações, navegação no tempo e no espaço | Natureza, viagens, pesquisa no terreno | Estética orgânica sem relação com os dados; formas diferentes para campos comparáveis |

## 2. Diversidade real

«Editorial azul» e «editorial verde» são o mesmo conceito. «Ler uma narrativa por capítulos» e
«explorar um mapa com fichas de evidência» mudam a descoberta, a ordem, o foco e a interação.
Compara os custos dessas escolhas, não adjetivos. Num sistema existente não há obrigação de aplicar
outra gramática desta tabela.

## 3. Coerência sem monotonia

Reserva a variação para os conteúdos e estados que a merecem. Repetir alinhamentos e os contratos
dos controlos reduz esforço; variar composição, ritmo e narrativa distingue as superfícies. Uma
família de componentes consistente não exige que todas as páginas tenham a mesma grelha de
cartões. Peças sem parentesco (escalas de raio e de ícones, animações e materiais de várias
demos, sem regra que as combine) são o sinal de que falta a gramática dominante.

## 4. Combinar sem fazer uma salada

Escolhe primeiro uma gramática dominante e acrescenta só os mecanismos que reforçam a tese;
habitualmente uma ou duas influências de apoio chegam, mas o critério é a coerência, não uma
quota. Cada mecanismo segue **referência → princípio → papel na tarefa → adaptação → prova**:
conserva-se o princípio útil, não o defeito do exemplo (input nativo focável, rótulo associado,
estado em palavras, ligação ou botão corretos, movimento reduzido). Uma animação de sucesso não
implementa um aviso; um cadeado não implementa segurança. O registo cabe num parágrafo: mudar um
botão não pede um formulário.

### Teste de compatibilidade

| Eixo | Pergunta | Se falha |
|---|---|---|
| Organização | As duas referências pressupõem a mesma ordem de trabalho? | Uma estrutura dominante; da outra, só um mecanismo local |
| Densidade e ritmo | Espaçamento, tamanho e frequência das ações servem o mesmo dispositivo? | Ajustar à densidade real, sem encolher os alvos até deixarem de se usar |
| Tipografia | A hierarquia e a extensão do texto cabem sem cortar o que decide? | Uma escala comum; fonte nova só com razão, suporte e autorização |
| Geometria | Raio, borda, alinhamentos e espessura dos ícones têm parentesco? | Reimplementar a ideia nos tokens da app; não aproximar valores à vista |
| Material | A profundidade explica uma camada ou uma manipulação, ou só decora? | Tirar a superfície extra; não misturar papel, vidro e metal sem uma tese (B22) |
| Semântica | A mesma cor e a mesma forma dizem o mesmo estado? Percebe-se sem cor? | Separar marca, ação e estado; texto, ícone e foco complementam a cor |
| Movimento | O efeito explica uma mudança? Funciona sem hover e com movimento reduzido? | Estado ou feedback estático equivalente; a animação não é autorização, progresso nem sucesso (B23) |
| Custo | GPU, layout, dependências e manutenção valem o ganho? | O mecanismo simples; medir quando o custo é material |

Se duas referências falham nestes eixos, extrai o princípio e reimplementa-o nos tokens que
existem; não transportes o CSS para disfarçar o conflito.

### Combinações que têm uma razão

- **Serviço humanista + instrumento operacional**: a agenda do dia clara, uma grelha alinhada para
  comparar a equipa, edição no contexto. A grelha serve a comparação; não se importa a linguagem
  de terminal de uma ferramenta financeira.
- **Editorial + wayfinding**: programação por dia e por sala, ritmo editorial para destacar
  sessões, percurso previsível para comprar ou guardar. O ornamento não atravessa a leitura dos
  horários.
- **Arquivo + observatório**: índice documental para encontrar provas, visualização para comparar
  leituras com unidades e incerteza. Nada de painéis com números só para ocupar o topo.
- **Oficina + tátil**: ferramentas agrupadas por processo, feedback de encaixe quando existe um
  objeto que se manipula. Um botão de guardar não precisa de um objeto 3D.

### Combinações a rejeitar ou transformar

- Um formulário calmo e um campo neon com borda a correr: extrai-se a ideia de foco inequívoco,
  sem animação contínua.
- Uma tabela de operação frequente e cartões 3D inclinados pelo ponteiro: conserva-se o detalhe
  no contexto, sem transformar cada linha num palco.
- Uma notificação de celebração e um erro de gravação: conserva-se a hierarquia da mensagem, sem
  confetti, e prova-se a nova tentativa e o estado real.
- Uma caixa de seleção escondida e um interruptor teatral: conserva-se o estado distinguível, com
  o input nativo focável e o rótulo estável.

São testes de adequação, não proibições universais. Num jogo ou numa instalação cultural, a mesma
materialidade pode ter função: mostra-se isso, em vez de invocar «criatividade» para ignorar a
tarefa. Os mecanismos de controlo e de superfície que valem a pena conhecer estão em
`mecanismos.md`.
