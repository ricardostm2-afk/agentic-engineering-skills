---
name: agentic-analysis-optimization
description: Otimizar pipelines de análise e ferramentas de agentes quando há custos demonstrados de latência, CPU, memória, subprocessos ou contexto; desenhar cache, reutilização e consultas preservando correção e evidência. Auditoria de suites e CI pertence à agentic-ci-audit; não é uma otimização genérica por intuição.
---

# Otimização de análises

Encontrar trabalho desnecessário concreto, corrigi-lo no seu dono e comparar investigações concluídas equivalentes. Decidir, com medições, não alterar uma implementação também é um resultado útil.

Adaptada de REA, sob MIT; ver [origem e atualização](references/origem.md). Não requer REA. Ler [o caso Kuna](references/kuna-case-study.md) quando um exemplo medido ajudar a escolher reutilização; os números são históricos, não uma promessa para outro provider ou projeto.

## Fixar tarefa e oráculo

Ler os contratos e comandos atuais do projeto. A skill não concede autorização para executar alvos, instalar ferramentas, publicar ou integrar.

Descrever a tarefa completa do utilizador: factos e relações necessários, detalhe, acesso a fontes e incógnitas relevantes. Escolher um artefacto real representativo e um caso pequeno/vazio. Registar revisão, digest do alvo, identidade/versão do produtor, opções, host e entrypoint. Isolar alterações sem perturbar trabalho alheio.

Estabelecer um oráculo independente: expectativas de uma fixture construída a partir de fontes, bytes mapeados independentemente ou produtor real com verificação da interpretação. Dois wrappers do mesmo decoder errado não provam correção. Preservar identidade, alternativas com a mesma chave, relações não resolvidas, cobertura e ligação às fontes. Um resultado vazio só prova ausência dentro do âmbito realmente examinado.

## Encontrar o primeiro trabalho desnecessário

Seguir uma tarefa pública CLI/MCP/API até ao produtor. Medir admissão/identidade, análise, descodificação, lookup, projeção, serialização, retenção e cleanup onde forem relevantes. Incluir descoberta de catálogo e chamadas adicionais que pesem na conclusão da tarefa.

| Custo observado | Correção candidata | Condição a demonstrar |
| --- | --- | --- |
| Varrimentos repetidos de factos validados | Reusar ordenação/lookup existente | Identidade/ordem estabelecidas e todas as alternativas retidas |
| Trabalho equivalente no produtor | Partilhar resultado ou trabalho em curso | Inputs, frescura, duração e resultado por consumidor explícitos |
| Relatório completo para poucos factos | Antecipar seleção/projeção | Factos/evidência completos continuam acessíveis e cobertura é declarada |
| Buffers temporários grandes | Descodificar incrementalmente | Documento admitido integralmente validado; retenção também contabilizada |
| Muitas leituras homogéneas | Partilhar admissão ou fazer batch | Identidade, ordem necessária e falha individual preservadas |

Uma cache, índice, endpoint batch ou camada de orquestração precisa de trabalho removido e custo de manutenção identificados. Projetar depois de materializar tudo pode reduzir output sem melhorar tempo nem memória. Corrigir factos ausentes/errados antes de comparar velocidades contra um workflow mais completo.

## Uma interpretação, duração de reutilização explícita

Validar e normalizar no produtor; consumidores consultam essa representação, em vez de reconstituir relações a partir do relatório bruto. Separar identidade de formatação.

Para cada cache: chave, dono, invalidação, tamanho retido e duração. Incluir bytes do alvo, conteúdo/versão do produtor, opções, arquitetura/mapeamento e schema/parser quando afetem o resultado. Revalidar estado vivo antes de chamar atual a uma observação guardada. Recusas só se guardam quando determinísticas para essa chave; falhas transitórias/parciais/canceladas têm política de retry própria.

Um consumidor cancelado não invalida um par bem-sucedido. Preservar falha do produtor e motivo por consumidor. Manter ownership e contabilização enquanto o trabalho/cleanup não terminarem; uma falha de cleanup não apaga observações concluídas. Exercitar invalidação, consumidores concorrentes, cancelamento do último, fecho e retry de cleanup quando esses caminhos mudam.

Limitar a família de processos e o estado retido, não apenas o heap do pai ou número de workers. Contar expansão de descodificação/serialização antes da alocação. Escolher limites pelo host e workload; parar antes de OOM e verificar cleanup apenas dos recursos próprios. Um trabalho parado por um limite está incompleto; streaming não autoriza retenção ilimitada nem sucesso parcial disfarçado.

## Comparar conclusões equivalentes

Executar o workflow público real antes/depois com inputs, resultados, cobertura e semântica de evidência equivalentes. Incluir casos pequenos, distinguir sessões frias, caches do runtime e do sistema operativo; alternar/repetir quando a variância muda a decisão. Um engine falso não qualifica o provider real.

Reportar resultado, tempos por fase, tempo total/CPU, pico da família de processos e método de contabilização, paragens por limites e cleanup. RSS somado pode contar memória partilhada mais de uma vez. Verificar saída do payload e do profiler; reter tentativas falhadas e custos não medidos.

Para alegar redução de tokens, contar descoberta/schemas, argumentos, respostas, retries e continuações necessários para concluir a tarefa. Separar estimativas de tokenizer de uso real do modelo. JSON menor não prova menos tokens nem melhor investigação.

Fechar com gargalo, mudança no dono, semântica preservada, checks executados, medições e limites. Distinguir experiência local de código integrado/publicado. Parar quando o gargalo demonstrado estiver resolvido ou o benefício seguinte for especulativo.
