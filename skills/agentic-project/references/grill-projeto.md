# Entrevista do projeto (fase 2)

Objetivo: chegar a um entendimento partilhado e escrito do projeto antes de qualquer arquitetura.
Cada decisão que fica por tomar aqui acaba tomada em silêncio por um agente a meio de uma
feature, e é aí que custa mais caro.

## Protocolo

1. **Investiga antes de perguntar.** Os factos (o que existe no repo, que versões, que serviços já
   estão em uso) descobres tu, com leitura ou subagentes. Ao humano só vão **decisões**. O que a
   fase 1 já decidiu (está em `docs/decisoes.md` ou `docs/pre-requisitos.md`: utilizador, quem
   paga, métrica, dados, região, custos) não se volta a perguntar; só o aprofundas se uma
   resposta nova o puser em causa.
2. **Árvore de decisões.** Cada decisão abre outras. Pergunta primeiro as que não dependem de
   nada por responder (a «fronteira»); as dependentes ficam para depois de ouvires a resposta.
3. **Formato de cada pergunta:** título curto; contexto numa ou duas linhas; 2–4 opções
   concretas; a tua recomendação e o porquê. Redige-a para que «sim» aceite a recomendação.
   Uma ronda = a fronteira inteira (todas as perguntas que já se podem fazer). Com
   AskUserQuestion, parte a ronda em chamadas de até 4 perguntas (o limite da ferramenta); sem
   ela, até 4 perguntas independentes, numeradas, numa só mensagem, cada uma com opções e a
   recomendação primeiro (as dependentes, uma de cada vez; o resto da ronda na mensagem
   seguinte).
4. **Desafia.** «Porquê?», «o que acontece quando…?», «como sabes que funcionou?», «quem perde se
   isto não existir?». Se uma resposta contradiz outra, ou o código, di-lo logo.
5. **Delegação.** «Escolhe tu» numa pergunta = aplica a recomendação e marca a decisão como
   delegada. «Segue as recomendações» = o mesmo para todas as pendentes desta fase.
6. **Regista à medida.** Cada resposta vai logo para `docs/decisoes.md` (formato em
   `assets/decisoes.template.md`); cada termo do domínio resolvido vai logo para `GLOSSARIO.md`.
   Não acumules para o fim: se a sessão cair, o que foi decidido não se perde.

**Modo adotar.** Antes da 1.ª ronda, lê as regras que o repo já tem (`AGENTS.md`, `CLAUDE.md`,
`CONTRIBUTING`, CI, hooks) e compara-as com as escolhas por omissão do SKILL.md (trunk-based,
ramos < 24 h, push no fim da sessão, OK antes do irreversível…). Cada regra que contradiz uma
escolha por omissão entra na 1.ª ronda como pergunta, com as duas opções e a tua recomendação;
até lá vale a regra do repo. Uma colisão destas, descoberta a meio de uma feature, para o
trabalho de um agente.

Com `mattpocock-skills:grilling` disponível, invoca-a e dá-lhe o contexto da fase 0 e este banco
de dimensões. As duas regras encaixam assim: a grilling dá as rondas pela fronteira e manda
descobrir factos sozinho (com subagentes, se o ambiente os tiver; senão lês tu); este protocolo
dá o formato de cada pergunta, o limite de 4 por chamada e o registo imediato. Em caso de
dúvida, ganha este protocolo. Com `mattpocock-skills:domain-modeling`
disponível, invoca-a para o glossário e os ADRs (ela usa `GLOSSARY.md` por omissão; diz-lhe que
neste projeto o ficheiro é `GLOSSARIO.md`).

## Ordem e banco de perguntas

Não precisas de fazer todas; precisas que cada dimensão fique resolvida, delegada ou fora de
âmbito. As sugestões entre parênteses são recomendações típicas, não respostas.

1. **Problema e utilizador.** Quem tem a dor, com que frequência, como resolve hoje? Qual é o
   utilizador principal do MVP (só um)? O que o faria voltar no dia seguinte?
2. **Âmbito do MVP e o que fica de fora.** Qual é o percurso mínimo que entrega valor de ponta a
   ponta? Lista explícita do que NÃO entra no MVP (é tão importante como o que entra). Há prazo
   ou evento que fixa a data?
3. **Dados e domínio.** Quais são as entidades principais e as palavras que o utilizador usa
   para elas? O que se guarda, durante quanto tempo, quem vê o quê? Há multi-cliente
   (multi-tenant)? Como se isola um cliente do outro (recomenda: isolamento verificado em cada
   query e testado)?
4. **Integrações.** Que sistemas externos (pagamentos, e-mail, SMS, identidade, faturação,
   calendários, IA)? Para cada um: obrigatório no MVP ou depois? O que acontece quando está em
   baixo?
5. **Segurança e privacidade.** Quem se autentica e como (recomenda: fornecedor gerido ou
   biblioteca madura, nunca autenticação caseira)? Que papéis/permissões? Que ações têm de ficar
   registadas? Dados pessoais em logs, prompts de IA ou ambientes de teste (recomenda: nunca)?
6. **Operação e custos.** Quem é chamado quando cai? Backups: onde, quanto tempo, já se testou
   repor? Ambientes (local, staging, produção)? Deploy: quem aprova, com que frequência?
7. **UI/UX e marca.** Que dispositivos e resoluções? Browsers e plataformas-alvo (recomenda:
   `baseline widely available`; e, se houver, as WebViews ou os tablets em modo quiosque e a
   versão mínima do sistema)? Há marca (cores, tipo de letra, logótipo)? Referências visuais de
   que o humano gosta e de que não gosta? Idioma(s) e tom da escrita? Acessibilidade mínima
   (recomenda: WCAG 2.2 AA, com navegação por teclado e contraste AA)? Os alvos daqui são os do
   radar da fase 3 e o filtro de toda a pesquisa das features.
   Regra fixa, não se pergunta: o trabalho de UI segue a `agentic-design`
   (`<agentic-design>/references/ui-sem-slop.md`) e corre o detetor dela
   (`<agentic-design>/scripts/detetar-slop.mjs`). Num projeto com UI, a fase 4
   versiona as cópias de ambos em `.agentic/` sem perguntar (assim os agentes sem a skill têm as
   regras e o pre-commit falha fechado). Pergunta só as exceções que a marca decide de propósito
   (ex.: vidro na moldura, um degradê da marca): ficam numa decisão «Exceções de UI» em
   `docs/decisoes.md`, com o âmbito (onde vale e onde não vale), viram `slop-ok: <motivo>` no
   código e o `AGENTS.md` aponta para essa decisão (fase 6).
8. **Métricas de sucesso.** Que número diz que o MVP funcionou? Como é medido sem recolher dados
   que não são precisos?
9. **Riscos.** O que pode matar o projeto (legal, técnico, adoção)? Qual é a hipótese mais
   arriscada e como se testa mais cedo e mais barato?

## Critério de paragem

Paras quando: cada uma das 9 dimensões está resolvida, delegada ou marcada «fora de âmbito»;
nenhuma pergunta aberta muda a escolha de arquitetura; o humano confirma que o resumo das
decisões (≤ 15 linhas, mostrado por ti) está certo.

## Glossário (`GLOSSARIO.md`)

Só termos do domínio, na linguagem do utilizador, sem detalhes de implementação. Quando o humano
usa duas palavras para a mesma coisa, ou a mesma palavra para duas coisas, propõe um termo
canónico e regista os sinónimos a evitar. Formato por termo:

```markdown
**Encomenda**: compra confirmada por um cliente, com itens, preço e morada fechados.
_Evitar_: pedido (no domínio é outra coisa: um pedido ainda não está confirmado), order.
```
