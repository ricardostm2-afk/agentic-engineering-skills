# Grill do candidato

Para o passo 5. O objetivo é chegar a um entendimento comum com o humano sobre o desenho do
candidato escolhido, decisão a decisão, até não sobrar nada assumido em silêncio.

## A árvore de decisões

Cada decisão abre as que dependem dela. A **fronteira** são as decisões cujos pré-requisitos já
estão resolvidos: só essas se perguntam agora. No candidato, a árvore passa pelas restrições, pelas
dependências e a categoria delas (`references/aprofundar.md`), pela forma do módulo aprofundado,
pelo que fica atrás da costura e pelos testes que sobrevivem. A pergunta da interface faz-se pelo
`references/desenhar-duas-vezes.md`.

## Uma pergunta de cada vez

Faz uma pergunta, espera a resposta, recalcula a fronteira e faz a seguinte: cada resposta muda a
árvore. Cada pergunta leva a recomendação antes do contexto:

```
**P<n>. <título da decisão>**
Recomendação: <a tua resposta>, porque <uma linha>.
<contexto em 1 a 2 linhas, com o facto que a motiva e o ficheiro:linha; as opções, se há mais de duas>
```

Escreve-a de forma a que «sim» aceite a recomendação. Com AskUserQuestion, uma pergunta por
chamada; sem ela, no chat.

## Factos são teus, decisões são dele

Um facto que o código, os docs, o histórico ou o relatório respondem vais tu ver, ou mandas um
subagente; não o perguntas. Enquanto um subagente procura, só as perguntas que dependem desse facto
esperam. As decisões são do humano: cada uma vai-lhe com a recomendação, e esperas pela resposta.
«Escolhe tu» fecha as pendentes com as tuas recomendações, registadas como delegadas.

## Pelo caminho

Os efeitos laterais fazem-se logo que uma decisão fica clara:

- **Um módulo aprofundado com o nome de um conceito que o glossário não tem**: acrescenta o termo
  ao glossário do domínio (e cria o ficheiro, se não existe).
- **Um termo difuso que a conversa afinou**: atualiza o glossário ali mesmo.
- **O humano rejeita o candidato com uma razão de peso**: oferece uma ADR, assim: «Queres que
  registe isto numa ADR, para as próximas revisões de arquitetura não o voltarem a sugerir?». Só
  quando um explorador futuro precisaria da razão para não repetir a sugestão; razões passageiras
  («agora não compensa») e evidentes não levam ADR.

O formato de um termo é o de `<agentic-project>/references/grill-projeto.md` («Glossário»), e o de
uma ADR o de `<agentic-project>/references/arquitetura.md` §6. Com o plugin
`mattpocock-skills:domain-modeling` instalado, podes usá-lo para o glossário e as ADRs, dizendo-lhe
o nome do ficheiro do glossário do projeto.

## Quando acaba

Quando a fronteira está vazia: cada ramo da árvore visitado e a interface, a costura e os testes
decididos. Mostra a tabela das decisões, com a origem de cada uma (humano ou delegada), e pede a
confirmação do entendimento comum. Sem ela, o passo 6 espera.
