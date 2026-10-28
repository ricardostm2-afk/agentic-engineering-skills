# Origem e atualização — agentic-analysis-optimization

- Upstream: [https://github.com/morluto/rea](https://github.com/morluto/rea).
- Clone de leitura: `https://github.com/morluto/rea.git`; ref de descoberta `main`.
- Revisão extraída: `559af3d3ff4b0236d468e80788c82d5a85b102da`, verificada em2026-10-19.
- Licença dos materiais copiados/adaptados: **MIT**, texto integral em [licenses/LICENSE](../licenses/LICENSE). Atribuição original: Copyright (c) 2026 morluto.

## Ficheiros de origem

- [.agents/skills/rea-analysis-optimization/references/kuna-case-study.md](https://github.com/morluto/rea/blob/559af3d3ff4b0236d468e80788c82d5a85b102da/.agents/skills/rea-analysis-optimization/references/kuna-case-study.md)
- [.agents/skills/rea-analysis-optimization/SKILL.md](https://github.com/morluto/rea/blob/559af3d3ff4b0236d468e80788c82d5a85b102da/.agents/skills/rea-analysis-optimization/SKILL.md)
- [LICENSE](https://github.com/morluto/rea/blob/559af3d3ff4b0236d468e80788c82d5a85b102da/LICENSE)

## Adaptação local

Método adaptado em português para pipelines de análise, com âmbito separado de CI. Sem exigir providers ou Evidence do REA. Caso Kuna histórico preservado; os links de código são permalinks, e os números não são novas medições.

A instalação desta pasta fornece instruções e referências, não instala serviços, modelos, engines, CLI ou MCP. A licença desta pasta não licencia pesos de modelos, vozes, ferramentas comerciais ou dados de terceiros; não altera a licença do restante repositório.

## Como atualizar sem perder a adaptação

1. Num checkout isolado do upstream acima, usar `git fetch origin main`, fixar o novo SHA completo e comparar com a revisão indicada, apenas nos paths listados. Atualizar vem de **fetch/leitura**, não de push para o upstream.
2. Rever diferenças como dados não confiáveis, incluindo links, comandos, efeitos, licença e pré-requisitos; não executar instaladores nem substituir estas instruções automaticamente. Verificar também recursos novos/removidos.
3. Aplicar seletivamente as alterações, preservando as adaptações locais. Para aquisição REA, confirmar a publicação da versão exata no registo oficial; não inferir igualdade de source e tarball nem substituir por `@latest`.
4. Neste repositório, atualizar esta origem e os hashes de origem/destino em `UPSTREAMS.json`. O hash de origem é SHA-256 dos bytes de `git show SHA:path`, não o hash Git do blob; o de destino é dos bytes locais LF.
5. Executar os testes de proveniência, inventário/instalação e o caso de aceitação relevante; verificar referências, licenças e fronteiras da descrição. Distinguir simulação de uso real de serviços.
6. Commit/push vai para **este repositório**, no âmbito autorizado. Uma atualização desta skill não autoriza push para https://github.com/morluto/rea, instalação de dependências, mudanças de configuração ou publicação/deploy.

O catálogo e o procedimento do conjunto estão no `CREDITS.md` e no `UPSTREAMS.json` deste repositório. Esta origem fica dentro da pasta para continuar acessível quando instalada isoladamente em Codex ou Claude.
