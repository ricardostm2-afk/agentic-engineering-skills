# Relatório de revisão

<!-- Modelo da agentic-code-review (passos 3 e 5). Serve ao relatório de cada lente e ao
     consolidado que o orquestrador manda ao autor ou ao humano. Antes de o mandar, confere-o com
     `node <skill>/scripts/validar-relatorio.mjs <ficheiro>` (saída 0). Os blocos «text exemplo»
     são lidos pelo teste do validador: se mudas o formato, muda os dois. -->

## Formato

```text
Revisão <sha-revisto> · <via> · [lente <lente> · ]ronda <n>/<limite> · <i> Importantes · <n> Nits · <p> Pré-existentes
0 Importantes — nada a corrigir        ← só quando i = 0, e logo a seguir à 1.ª linha

[Importante] <ficheiro:linha> — <efeito> — reproduz: <teste, comando ou captura> — classe: <classe>
[Nit] <ficheiro:linha> — <o quê>        ← no máximo 3 no total, depois dos Importantes

Pré-existentes: <ficheiro:linha · classe; …> | nenhum
Não confirmados: <ficheiro:linha · porquê; …>      ← só se o verificador não deu veredicto
Teste de aceitação: <o que testa · caminho do ficheiro, ou a descrição>   ← lente spec
Direção: <o que contesta a abordagem aprovada>     ← só se houver; não é achado
Nível: <ficheiro:linha que pede mais do que o nível recebido>   ← só se houver
Não li: <o quê e porquê> | nada
```

- **1.ª linha**: o SHA revisto (7 a 40 caracteres), a via ou o nível do `REVIEW.md`, a lente (nos
  relatórios de cada lente; o consolidado pode omiti-la), a ronda e o limite, e as três contagens.
  O singular também vale («1 Importante · 1 Nit · 1 Pré-existente»).
- **Importante**, um por linha e por gravidade. `reproduz:` é a prova:
  - código: o teste que fica vermelho, o comando e a saída, ou a captura;
  - num doc: a linha do doc e a linha do código ou da árvore que o desmente (outro
    `ficheiro:linha`), ou `ausente: <caminho>` quando o doc cita o que não existe;
  - numa dependência fora da pesquisa (classe com «fora da pesquisa»): a linha do manifesto e
    `ausente em <ficheiro da pesquisa aprovada>`; uma dependência vulnerável prova-se como código
    (o aviso do `npm audit` ou equivalente).
- **Nit**: também com `ficheiro:linha`. Não abre ronda nem commit próprio.
- **Pré-existentes**: uma linha só, com os itens separados por «;». Não vão para o backlog nem se
  corrigem nesta mudança.
- **Teste de aceitação** (lente spec): o que testa e o caminho do ficheiro ou a descrição, como
  diz `<skill>/references/painel-e-rondas.md` §3.
- Etiquetas: só `[Importante]` e `[Nit]`. Estilo e formatação não são achados.

## Exemplos

Uma lente, com achados:

```text exemplo
Revisão 9f3c2ab · Completa · lente correção · ronda 1/3 · 2 Importantes · 1 Nit · 1 Pré-existente

[Importante] api/src/rotas/faturas.ts:142 — o id de outra organização devolve 403 em vez de 404 e confirma que a fatura existe — reproduz: npm test -- faturas.isolamento (vermelho em 9f3c2ab) — classe: erro que revela recurso alheio
[Importante] docs/RUNBOOK.md:57 — manda correr scripts/migrar.sh, que esta mudança apagou — reproduz: ausente: scripts/migrar.sh (git ls-tree 9f3c2ab) — classe: doc que mente
[Nit] api/src/rotas/faturas.ts:9 — import por usar

Pré-existentes: api/src/lib/datas.ts:30 · fuso horário fixo
Teste de aceitação: pedido com o id de outra organização é recusado · <tmp>/aceitacao-faturas/isolamento.test.ts
Não li: nada
```

Consolidado, sem achados:

```text exemplo
Revisão 9f3c2ab1d0e4 · Padrão · ronda 2/2 · 0 Importantes · 0 Nits · 0 Pré-existentes
0 Importantes — nada a corrigir

Pré-existentes: nenhum
Não li: nada
```
