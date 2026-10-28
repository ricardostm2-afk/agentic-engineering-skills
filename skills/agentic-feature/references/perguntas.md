# Grill da feature (passo 2, momento 1)

O objetivo não é recolher requisitos: é obrigar o humano a decidir o que só ele pode decidir, com
a tua melhor proposta à frente, até não haver decisões em aberto.

## Método

Se `mattpocock-skills:grilling` existir, invoca-a e dá-lhe a Leitura como contexto. Da grilling
usa só a árvore de decisões e a fronteira (pontos 1 e 2 abaixo). Ignora o resto do formato dela:
aqui a recomendação vem antes da pergunta, sem emojis; vão no máximo 4 perguntas por vez (não a
fronteira inteira numa ronda); e o momento fecha sem pedir confirmação do entendimento (ponto 7 e
«Como se fecha»), porque o que se decidiu volta no resumo da spec do passo 4. Sem a skill, faz
isto:

1. **Árvore de decisões.** Cada decisão abre as que dependem dela. A **fronteira** são as decisões
   cujos pré-requisitos já estão resolvidos: só essas se podem perguntar agora.
2. **Factos são teus, decisões são dele.** Se a pergunta tem resposta no código, nos docs, nos
   dados ou na Leitura, vai ver (ou manda um subagente) e não perguntes. Pergunta só o que é
   escolha: prioridade, compromisso, comportamento desejado, risco aceitável.
3. **Formato de cada pergunta**: o título da decisão; o contexto em 1–2 linhas (com o facto da
   Leitura que a motiva); 2–4 opções concretas e mutuamente exclusivas; a **recomendação** em
   primeiro lugar com o porquê. Escreve-a de forma a que «sim» aceite a recomendação.
4. **Entrega**: até 4 perguntas por vez quando são independentes entre si; uma de cada vez quando
   a resposta de uma muda a outra. Com AskUserQuestion, uma chamada; sem ela (noutros agentes),
   uma só mensagem no chat com as perguntas independentes numeradas (até 4), cada uma com as
   opções e a recomendação primeiro.
5. **Desafia.** Antes de aceitar uma resposta que te parece frágil, uma pergunta de seguimento:
   «porquê?», «o que acontece quando…?» com um caso concreto, «como sabes que funcionou?».
   Uma por resposta, no máximo; não transformes o grill num interrogatório.
6. **«Escolhe tu» / «segue as recomendações»** fecham todas as pendentes: aplica as tuas
   recomendações, regista cada uma como decisão delegada (no quadro e na spec) e segue.
7. **Para** quando a fronteira está vazia: todas as dimensões abaixo têm decisão ou estão
   explicitamente fora de âmbito. Referência de volume, no total do momento 1 (já com o bloco de
   frontend e as até 2 vindas da pesquisa, onde conta também a dos browsers-alvo): Padrão 4–8
   perguntas, Completa até ~12. Se passas de 15, a feature provavelmente é Grande demais: volta à
   triagem.

Regista cada decisão logo que é tomada (quadro: `decisão`; spec: secção de decisões), com a
origem: humano, delegada, ou tua por omissão.

Um pedido que vem da `agentic-architecture` traz o desenho já decidido no grill dela (a interface,
a costura e os testes, com a origem de cada decisão): essas decisões entram já na tabela, e este
grill só pergunta o que o desenho deixou em aberto.

## Banco de perguntas

Não perguntes tudo. Escolhe as que a Leitura deixou em aberto e adapta-as ao domínio com nomes
reais do código e do glossário. A coluna «Recomendação a trazer» diz o que tens de ter preparado
antes de perguntar; uma pergunta sem isso ainda não está pronta.

### Problema e quem ganha

| Pergunta | Recomendação a trazer |
|---|---|
| Depois disto, que tarefa ou decisão consegue o utilizador fazer que hoje não consegue? | Uma frase proposta por ti, com o papel real do sistema (ex.: «quem gere as encomendas consegue…»). |
| Como resolvem isto hoje sem a feature? | O contorno que encontraste (exportação manual, folha de cálculo, pedido ao suporte) e quanto tempo custa. Se o contorno é bom, recomenda não fazer. |
| Se só pudesse entregar metade, que metade? | A fatia vertical mínima que já entrega valor, e o que fica para a segunda. |
| Quem fica pior com isto? | Quem perde um passo, um ecrã ou um hábito, e como o mitigar. |

### Comportamento e casos-limite

Inventa cenários concretos do domínio; não perguntes «e os casos-limite?».

| Pergunta | Recomendação a trazer |
|---|---|
| O que acontece quando <zero / um / muitos> <entidade>? | O comportamento para cada um, com o número realista de «muitos» medido nos dados ou nas fixtures. |
| O que acontece quando dois utilizadores fazem <ação> ao mesmo tempo sobre o mesmo <registo>? | Última escrita ganha, recusa com conflito, ou fila; recomendação conforme o custo de perder uma escrita. |
| O que acontece a meio: o utilizador fecha a janela, perde a rede, carrega duas vezes? | O que fica gravado e como se retoma; idempotência quando há envio ou dinheiro. |
| Datas e horas: em que fuso conta «hoje»? E à meia-noite? E na mudança de hora? | O fuso do utilizador/organização conforme o resto do código (`caminho`). |
| Dá para desfazer? | Desfazer (preferível) ou confirmação antes; apagar de vez só com motivo. |

### Dados

| Pergunta | Recomendação a trazer |
|---|---|
| Para cada dado novo: quem o lê e para quê? | O consumidor concreto (ecrã, relatório, regra). Sem consumidor, recomenda não recolher, mesmo que pareça «útil um dia» (a Leitura já o trouxe como sugestão «Cortar»). |
| Quanto tempo se guarda e o que lhe acontece quando a conta/organização é apagada? | A política que o projeto já aplica a dados parecidos (`caminho`), ou a lei aplicável se são dados pessoais. |
| Quem pode ver este dado? Aparece em exportações, registos (logs), e-mails? | A lista mínima de sítios, e onde é preciso mascarar. |
| Os dados existentes: preenchem-se, ficam vazios, ou a feature só vale para registos novos? | A opção com menos migração que ainda serve o caso, e o número de registos afetados. |
| É fonte de verdade ou cópia de outra coisa? | Se é cópia, de onde e como se mantém sincronizada; recomenda ler da fonte quando possível. |

### Permissões

| Pergunta | Recomendação a trazer |
|---|---|
| Quem pode fazer isto, e quem pode ver o resultado? | Reutilizar um papel/regra existente (`caminho`) em vez de criar um. |
| Quem não pode, o que vê: nada, desativado com motivo, ou erro? | Conforme os ecrãs vizinhos. A recusa no servidor usa a mesma regra que decide o ecrã. |
| Há risco de ver dados de outro cliente/organização? | Onde o isolamento é aplicado hoje e o teste que o vai provar. |

### Erros e falhas

| Pergunta | Recomendação a trazer |
|---|---|
| Se <dependência externa> falhar ou demorar 30 s, o que vê o utilizador e o que fica gravado? | Tempo limite, nova tentativa, estado intermédio visível; nunca «sucesso» sem efeito. |
| Que erros o utilizador consegue corrigir sozinho, e que mensagem vê? | A mensagem proposta em linguagem do utilizador, sem códigos internos. |
| Como se sabe, do lado da operação, que isto está a falhar? | O registo/alerta que o projeto já usa, sem dados pessoais nas mensagens. |

### Desempenho e escala

| Pergunta | Recomendação a trazer |
|---|---|
| Quantos registos no maior cliente hoje, e daqui a um ano? | O número medido (consulta à BD de desenvolvimento, fixtures, ou estimativa explícita com a conta). |
| Qual o tempo de resposta aceitável? | Um alvo concreto (ex.: < 300 ms para listar 1000 linhas) e como se mede. |

### Migração e retrocompatibilidade

| Pergunta | Recomendação a trazer |
|---|---|
| Quem usa hoje o que vamos mudar (clientes da API, ecrãs, integrações, ficheiros exportados)? | A lista encontrada no código; recomenda expandir-depois-contrair quando há consumidores externos. |
| Entra para todos de uma vez ou atrás de uma opção (flag)? | Flag só se há risco real ou rollout gradual; senão, direto. Com flag, liga-se primeiro só para o humano ou a equipa. |

### Sucesso

| Pergunta | Recomendação a trazer |
|---|---|
| Daqui a 2 semanas, como sabes que funcionou? | Uma observação que o sistema já consegue medir (contagem, evento, tempo) ou uma pergunta a um utilizador concreto. |
| Que teste de aceitação, se passar, te deixa descansado? | O cenário de ponta a ponta em linguagem do utilizador, com dados que distinguem o certo do errado. |

### Fora de âmbito

| Pergunta | Recomendação a trazer |
|---|---|
| O que fica de fora de propósito? | 2–3 cortes concretos (os que a Leitura apontou), cada um com a razão. |

### Perguntas de desafio (usar como seguimento)

- «Porquê isto agora e não <alternativa da Leitura>?»
- «Se não fizéssemos nada, o que acontecia?»
- «Há forma mais simples que resolva 80 %?» (traz tu a forma mais simples)
- «Esse "às vezes" acontece quantas vezes por semana?»
- «Quem te pediu isto, e o que disse exatamente?»

## Como se fecha o momento 1

Mostra a lista das decisões numa tabela curta (decisão · escolha · origem) e passa ao passo
seguinte sem pedir confirmação adicional: as decisões voltam no resumo da spec do passo 4 (o gate,
na Completa; o aviso, na Padrão).
