# Casos de avaliação do revisor

<!-- Modelo da agentic-code-review (references/aprendizagem.md). O conjunto de avaliação é a
     lista destes casos; cada um é confirmado por quem conhece o código. Escolhe uma das duas
     formas, a que o projeto já usa, e apaga a outra e este comentário. -->

## Forma 1: linhas de `docs/licoes.md` (por omissão)

Os casos `escapou` e `repetido` são as próprias linhas de lição, no formato:

`- <aaaa-mm-dd> · <área> · tipo: <escapou|repetido> · base <sha-base> · <sha-defeito>→<sha-correção> · esperado: <ficheiro:linha> · classe: <classe> · camada: <a que devia ter apanhado (escapou) ou a que apanhou (repetido)> · <o que aconteceu> → <a defesa>`

Os limpos vão numa secção «Casos limpos» no fim do mesmo ficheiro, uma linha cada, com os mesmos
separadores:

```text
- <aaaa-mm-dd> · <área> · tipo: limpo · base <sha-base> · <sha-integrado> · sem revert nem incidente até <aaaa-mm-dd> · confirmado: <quem>
```

Um limpo é uma mudança integrada há 30 dias ou mais, sem revert nem incidente.

## Forma 2: JSONL (para correr os casos por script)

Um caso por linha, num ficheiro que o `REVIEW.md` indica (por exemplo `docs/revisao-casos.jsonl`).
Os campos são os da linha de lição, mais `confirmado`:

```json
{"id":"2026-10-03-encomendas-isolamento","tipo":"escapou","data":"2026-10-03","area":"encomendas","base":"<sha-base>","sha":"<sha-defeito>","correcao":["<sha-correção>"],"esperado":{"ficheiro":"api/src/rotas/encomendas.ts","linha":142,"etiqueta":"Importante","classe":"erro que revela recurso alheio"},"camada":"revisão","confirmado":true,"resumo":"o id de outra organização devolvia 403 (confirma que existe) → teste com duas organizações"}
{"id":"2026-09-10-catalogo-limpo","tipo":"limpo","data":"2026-09-10","area":"catalogo","base":"<sha-base>","sha":"<sha-integrado>","correcao":[],"esperado":null,"camada":null,"confirmado":true,"resumo":"integrado há ≥ 30 dias sem revert nem incidente"}
```

- `tipo`: `escapou` (passou a revisão e viu-se depois), `repetido` (apanhado na revisão, 2.ª vez da
  classe) ou `limpo`.
- `sha`: o commit onde o defeito entrou (`escapou`, `repetido`) ou a ponta integrada (`limpo`).
- `esperado`: onde o revisor devia acusar; `null` nos limpos.
- `confirmado`: `true` só quando quem conhece o código o confirmou.

## Correr

Para cada caso, num worktree fora do repo em `sha`, o revisor com o nível e as lentes que a
mudança teria, sobre `<base>..<sha>`:
- `escapou`/`repetido`: passa se acusar um Importante no ficheiro esperado, numa linha do mesmo
  hunk que a esperada;
- `limpo`: passa se não acusar Importantes.

Uma mudança ao revisor fica se não perde nenhum caso que apanhava e, com 3 ou mais limpos, se não
acusa Importantes nos limpos. A 1.ª versão do revisor é a base.
