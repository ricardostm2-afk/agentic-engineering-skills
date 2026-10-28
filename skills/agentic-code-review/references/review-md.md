# Como escrever o `REVIEW.md`

Ideia adaptada de https://claude.dev/blog/solving-code-review-at-anthropic/. O `REVIEW.md` diz
ao revisor o que é falhar **neste** repo. Sem ele, o revisor acusa o genérico (nomes, estilo,
«podia ser mais simples») e falha o que importa ali. Modelo: `assets/REVIEW.template.md`.

## Quem e onde

- Escrevem-no os donos do código (num projeto com um só humano: o agente propõe, o humano aprova
  «O que é falhar aqui», porque é ele que sabe o que dói).
- Os donos conferem que o revisor o segue: corre-se o revisor num caso conhecido
  (`aprendizagem.md`) e vê-se se acusa o que o `REVIEW.md` diz.
- Na raiz, ou onde o `AGENTS.md`/`CLAUDE.md` apontar («o que a revisão procura: `REVIEW.md`»).
- Ganha ao brief do revisor e às regras por omissão desta skill no que é do repo (as secções
  abaixo); o processo e o modelo não são dele.

## As secções

1. **O que é falhar aqui**, uma linha por área: o que o utilizador ou o dono vê quando falha, e a
   prova que o mostra. Os exemplos do artigo dão o tom: num doc, falhar é **mentir** (afirmar um
   comando, caminho ou regra que a árvore não tem); numa configuração, é **encaminhar mal**; numa
   guarda, é **deixar passar**; num teste, é **não conseguir falhar**. Inclui as decisões que
   parecem defeito e não são (com o ponteiro para onde estão decididas).
2. **Saltar**: gerados, lockfiles, fixtures grandes, pastas de evidência. Basta confirmar que
   vieram do gerador (o comando que os confere); revê-se a fonte de que derivam. Diz também que
   ferramenta é dona do estilo e da formatação (lint, formatador, hooks): não são achados.
3. **Achados repetidos**: classe → o que procurar → prova. Começa «(nenhum ainda)».
4. **Processo**, uma linha: a revisão segue a `agentic-code-review` (etiquetas, prova, formato do
   relatório, rondas, teto) e o modelo é do utilizador. O `REVIEW.md` só diz o que é do repo.

Opcionais, só se o projeto precisa: **Níveis** (os nomes, os caminhos de cada um e os sempre
altos, o comando que classifica o diff) e **Lentes por zona** (que zona leva que lente, com as
guardas e os comandos que a prova usa). Se existem, ganham a `niveis-de-risco.md` e à lista de
lentes da `painel-e-rondas.md` §3; o modelo não se define aqui.

## Manter curto

- **~3 KB** (`wc -c REVIEW.md`). O que não cabe vai para o brief da área ou para um doc, e fica um
  ponteiro com **quando** ler.
- Não repete o `AGENTS.md` nem o que um hook, lint ou teste já verifica: uma regra que uma máquina
  confere sem falsos positivos vale mais como verificação do que como texto.
- O `AGENTS.md`/`CLAUDE.md` também é curto: stack, convenções, objetivos e **não-objetivos**,
  comandos que se podem correr, e ponteiros. O revisor acusa as violações das convenções e as
  linhas desses ficheiros que a mudança deixou desatualizadas (lente normas).

## Como cresce

Pelos achados repetidos, não por intuição:
- a 2.ª vez que a mesma classe aparece, ou vira verificação automática (guarda, lint, teste), ou
  uma linha em «Achados repetidos» ou em «O que é falhar aqui»;
- quando um defeito escapa à revisão, pergunta o que faltava ao revisor à frente dele e corrige
  isso aqui (ou no brief), com a lição registada (`aprendizagem.md`);
- uma mudança ao `REVIEW.md` é uma mudança ao revisor: corre os casos de avaliação antes de ficar.

## Sem `REVIEW.md`

A skill usa as regras por omissão (`niveis-de-risco.md`, `painel-e-rondas.md`) e, na mensagem
final, sugere criar um a partir do modelo, com as áreas que a revisão viu. Não o cria sem OK do
humano. Num `REVIEW.md` que já existe, nunca o reescreves: propões um diff.
