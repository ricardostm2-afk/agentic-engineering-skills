# Radar tecnológico: <nome do projeto>

<!--
Regras (apaga os comentários ao preencher):
- O radar não é regra: em conflito, ganham o AGENTS.md, a constituição e as ADRs.
- Lê-se no passo 1b da agentic-feature (pesquisa) e escreve-se na entrega, antes do commit final.
- Uma linha por entrada, com fonte primária (URL) e a data da última verificação. Versões e
  estados de suporte só com fonte, nunca de memória.
- Entradas com mais de ~6 meses refrescam-se no passo 1b, quando uma feature lhes toca.
- Entradas novas entram em Experimentar, Avaliar ou Evitar. Adotar, e mudar entre Adotar e
  Evitar, só por decisão do humano, escrita em «Decidido por». Exceção: na fase 3 da
  agentic-project entra logo em Adotar o que essa fase decidiu: a stack (humano ou delegado,
  ADR-NNNN ou D-NNN), as escolhas técnicas registadas como «agente» em docs/decisoes.md e, em
  modo adotar, a stack existente.
- Evitar: só o que falha um critério obrigatório (fim de vida, inseguro, experimental) e que
  outro agente provavelmente voltaria a propor. «Não escolhida» fica na ADR, não aqui.
-->

## Alvos

| O quê | Valor | Fonte / decisão | Verificado em |
|---|---|---|---|
| Browsers-alvo | <ex.: `baseline widely available` (browserslist)> | <ADR ou decisão> | <data> |
| Plataformas nativas / WebViews | <ex.: Android `minSdk` 26; tablets em modo quiosque; ou «não há»> | <ADR ou decisão> | <data> |
| Runtime | <ex.: Node.js x.y LTS> | <URL da política de suporte> | <data> |
| Acessibilidade | <ex.: WCAG 2.2 AA> | <URL da norma> | <data> |
| Desempenho | <ex.: Core Web Vitals «bom» no p75> | <URL> | <data> |

## Entradas

- **Adotar**: usa-se por omissão neste projeto.
- **Experimentar**: em uso limitado (uma feature, atrás de flag), a ser medido.
- **Avaliar**: promissor, ainda não usado. Diz o gatilho para experimentar.
- **Evitar**: não usar. Diz porquê, para ninguém voltar a pesquisar sem razão nova.

| Anel | Entrada | Área | Porquê (uma linha) | Fonte | Verificado em | Decidido por |
|---|---|---|---|---|---|---|
| Adotar | <ex.: framework X 1.2> | stack | <escolhido na arquitetura: …> | <URL> | <data> | <humano \| delegado, ADR-0001> |
| Adotar | <ex.: executor de testes Y 3.1> | testes | <escolha técnica da fase 3: …> | <URL> | <data> | <agente, D-NNN (fase 3)> |
| Experimentar | <ex.: `<dialog>` + invoker commands no ecrã Y> | frontend | <menos 1 dependência; medir …> | <URL> | <data> | <humano, grill da feature NNN> |
| Avaliar | <…> | <…> | <gatilho: «quando for Baseline Newly» / «quando subirmos para vN»> | <URL> | <data> | <agente, feature NNN> |
| Evitar | <…> | <…> | <ex.: experimental, só num browser> | <URL> | <data> | <agente, feature NNN> |
