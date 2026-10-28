# Perguntas de UI (modo «perguntas»)

O bloco de perguntas que se faz antes de desenhar um ecrã, componente ou documento gerado. Quem
chama a skill (a `agentic-feature`, no grill do passo 2) junta-as às suas, pela regra dela; sozinha,
a `agentic-design` pergunta ela, com a mesma regra: uma decisão por pergunta, recomendação
primeiro, independentes em lote, dependentes uma a uma.

Antes de perguntar, abre os ecrãs vizinhos (os que o utilizador vê antes e depois deste) e o
sistema de design. Cada recomendação abaixo cita um ecrã ou componente existente («como em
`<ecrã>`, que usa `<componente>`»). Uma recomendação de UI sem referência ao que já existe é um
palpite e tende a gerar um ecrã que não pertence à aplicação.

O bloco é obrigatório; perguntar tudo não é. Percorre as 9 secções e, para cada linha, decide:
se os ecrãs vizinhos dão uma resposta clara, ela vira **decisão por omissão** (listada numa tabela
que o humano vê e pode corrigir); se a resposta muda o desenho, é pergunta. Normalmente sobram
3–6 perguntas: ponto de entrada, ação principal, dispositivo/resolução e os 1–2 estados menos
óbvios.

As respostas são as especificações das variantes (modo «variantes») e a lista de estados a
capturar na prova (`prova.md`). Quem chama guarda-as na spec.

O que o ecrã não pode ter está em `ui-sem-slop.md` e não se repete aqui: as recomendações deste
bloco nunca propõem um dos bloqueios B1–B24. Quando uma pergunta abaixo toca um bloqueio, a
referência vem entre parênteses.

## 1. Ponto de entrada

| Pergunta | Recomendação a trazer |
|---|---|
| Por onde chega o utilizador aqui? (menu, botão num ecrã, linha de uma lista, notificação, ligação num e-mail) | O ponto mais próximo do fluxo onde a necessidade nasce, citando o ecrã. Entrada nova no menu principal só quando é uma área de trabalho diária. A configuração de um serviço (ligação, chave, série) vive nas definições, com o mínimo que o serviço não resolve sozinho; na área de trabalho fica no máximo um aviso com ligação para lá. |
| Depois de concluir, para onde vai? | O ecrã de onde veio, com a alteração visível, ou o passo seguinte natural do fluxo. |

Uma feature sem porta de entrada está construída e é inalcançável: esta pergunta é obrigatória
mesmo que pareça óbvia.

## 2. Quem usa e onde

| Pergunta | Recomendação a trazer |
|---|---|
| Que papel usa isto e com que frequência? (várias vezes por hora vs. uma vez por mês) | Frequência alta pede densidade e atalhos de teclado; baixa pede orientação e texto claro. |
| Em que dispositivo e resolução? | As resoluções-alvo do projeto (de `DESIGN.md`, da análise de uso, ou das capturas existentes). Na falta, propõe 1366×768 e 1920×1080 para trabalho de secretária, 390×844 se há uso em telemóvel. |
| Está a fazer outra coisa ao mesmo tempo (ao telefone, com um cliente à frente)? | Se sim: menos cliques, nada que exija ler texto longo, foco no teclado. |
| É uma superfície para operar, para ler ou para persuadir? | Lê-se do produto (decisão por omissão): app e ferramenta operam, documentação lê-se, site persuade. Decide o modo da superfície (`ui-sem-slop.md` §1). |

## 3. Hierarquia

| Pergunta | Recomendação a trazer |
|---|---|
| Qual é a ação principal deste ecrã? (só uma) | A tua escolha, e onde fica (posição dos primários nos ecrãs vizinhos). Uma só ação dominante (B20). |
| Que informação decide essa ação? | Os 2–4 campos que o utilizador olha antes de agir; o resto vai para segundo plano ou sai. |
| O que pode desaparecer deste ecrã sem ninguém dar pela falta? | Uma lista do que cortarias (subtítulos repetidos, colunas que ninguém filtra, ícones decorativos). |

## 4. Estados

Para cada um, a pergunta é «o que vê o utilizador?». Traz a proposta baseada no estado
equivalente num ecrã vizinho.

| Estado | Recomendação a trazer |
|---|---|
| Vazio pela primeira vez | Uma frase que diz o que aparece aqui e a ação para o primeiro registo (B11). Diferente do vazio por filtro. |
| Vazio por filtro/pesquisa | «Nada encontrado para …» com forma de limpar o filtro. |
| A carregar | Esqueleto com a forma do conteúdo se demora > ~300 ms; nada se é instantâneo (B19). Sem saltos de layout quando chega. |
| Erro | O que aconteceu em linguagem do utilizador, o que pode fazer, e que o que escreveu não se perdeu. |
| Sem permissão | Esconder, ou mostrar desativado com o motivo, conforme os vizinhos; a decisão vem do servidor. |
| Muitos dados | O número realista (medido) e a resposta: paginação, virtualização, pesquisa. Testa com 1000 linhas e nomes compridos. |
| Dados compridos ou estranhos | Nomes de 60 caracteres, valores vazios, acentos, números grandes. O que decide (nome, valor, mensagem) não se corta: parte a linha (B8); só o resto pode truncar, com o texto completo acessível. Campos vazios omitem-se, sem «-» (B15). |
| Sucesso | Feedback no sítio da ação (não só um aviso efémero no canto), e o resultado visível, depois da resposta do servidor (B23). |

## 5. Texto e microcópia

| Pergunta | Recomendação a trazer |
|---|---|
| Que palavras usa o utilizador para isto? | Os termos do glossário e dos ecrãs vizinhos; nunca nomes internos de tabelas, códigos ou jargão do sistema. |
| Que texto secundário é preciso? | Por omissão nenhum (B12, B13). |
| Botões: que verbos? | Verbo + objeto («Guardar marcação», «Enviar fatura»), não «OK»/«Submeter» nem promessas (B14). |

## 6. Acessibilidade

| Pergunta | Recomendação a trazer |
|---|---|
| Faz-se tudo só com teclado? Em que ordem anda o foco? | Ordem do foco = ordem visual; foco visível; Enter/Escape com o significado habitual; atalhos se a frequência é alta. |
| Contraste e tamanho | Os mínimos de `ui-sem-slop.md` §3 (contraste, alvos, reflow), medidos no valor pintado. Um alvo mais exigente do projeto ganha. |
| Leitor de ecrã | Rótulos nos campos e botões só com ícone; mudanças assíncronas anunciadas (`aria-live`); nada que decida só em hover ou tooltip (B24). |

## 7. Responsivo

| Pergunta | Recomendação a trazer |
|---|---|
| O que acontece na resolução mais pequena alvo? | O que colapsa, o que passa para baixo, o que sai. Sem deslocamento horizontal da página. |
| E na maior? | Largura máxima do conteúdo ou uso do espaço extra (ex.: painel lateral), como nos vizinhos. |

## 8. Consistência com o sistema de design

| Pergunta | Recomendação a trazer |
|---|---|
| Que componentes existentes servem? | A lista concreta (`caminho`), e o que falta. Componente novo só com justificação. |
| Precisa de cor, tamanho ou espaçamento fora dos tokens? | Não, por omissão (B5, B6). Um token novo é decisão do humano e vai para o sistema de design, não para o ecrã. |
| Que temas tem o projeto? | Lê-se no código (decisão por omissão, não pergunta): as variantes e a prova veem-se em todos (claro e escuro, se existem os dois). |

## 9. Feedback e animação

| Pergunta | Recomendação a trazer |
|---|---|
| A ação é instantânea ou demora? | Resposta visual em < 100 ms; acima de ~1 s, indicação de progresso, indeterminada quando não há uma fração medida (B23); atualização otimista só se a falha é rara e reversível. |
| Confirmar antes ou desfazer depois? | Desfazer para ações reversíveis; confirmação só para irreversíveis, com o nome do que se perde. |
| Animação | Só para mostrar de onde veio ou para onde foi uma coisa; curta (≤ 200 ms numa mudança de estado; os gestos, como arrastar ou deslizar uma folha, usam molas); respeitar `prefers-reduced-motion` (B18). |
| O que o utilizador escreveu sobrevive a fechar a janela, perder a rede ou expirar a sessão? | Rascunho guardado (no servidor ou localmente) quando há texto longo ou trabalho de mais de um minuto. |
