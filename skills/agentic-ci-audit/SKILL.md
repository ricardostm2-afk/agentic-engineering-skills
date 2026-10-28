---
name: agentic-ci-audit
description: Auditar suites e pipelines de CI para descobrir falsos verdes, falhas de descoberta, fixtures desatualizadas, caches incorretas e custos medidos. Usar numa auditoria de testes/CI ou otimização da suite; não substitui os testes normais de uma feature nem o diagnóstico de uma falha isolada.
---

# Auditoria de CI e testes

Determinar que regressões os checks realmente detetam e que trabalho pode sair sem perder essa proteção. Uma conclusão válida pode ser uma correção provada, uma recomendação ou deixar tudo como está.

Adaptada de REA, sob MIT. Consultar [origem e atualização](references/origem.md) para a revisão fixada, licença e diferenças locais. Não precisa de REA, MCP ou de um provider nativo.

## Fixar o que foi executado

Ler as regras do projeto, a contribuição e os comandos atuais. Investigar não autoriza editar, publicar issues, fazer push ou integrar. Usar uma cópia/worktree isolada para mutações de controlo e preservar o trabalho alheio.

Registar SHA da árvore e do workflow, alterações locais, comando, ferramenta, host, identidade dos testes, instrumentação e pré-requisitos. Uma execução antiga prova apenas a revisão executada; não atualizar a atribuição porque main avançou.

Seguir o percurso completo: triggers, seletores de paths, matriz, dependências de jobs, actions reutilizáveis, scripts, descoberta de testes, subprocessos, relatórios e agregador final. Grafos de imports podem omitir scripts, dados gerados e registos dinâmicos. Verificar seleção positiva e negativa; um ficheiro ou relatório obrigatório ausente tem de falhar. Repetições intencionais por plataforma são cobertura, não necessariamente duplicação.

Usar tempos/falhas existentes para escolher famílias suspeitas. Executar a menor baseline que responde à pergunta; reservar a suite completa para uma auditoria ampla ou incerteza que os focados não resolvem. Não repetir uma suite inalterada por cada edição de documentação.

## Provar o defeito ou a proteção

Para cada candidato, identificar comportamento esperado, produtor e consumidores. Construir uma reprodução pequena que chegue ao comportamento alegado:

- **Fixture divergente:** confrontar admissões, versões, respostas de protocolo e entrypoints reais. Preservar fixtures deliberadamente inválidas e a recusa que pretendem testar; procurar as outras instâncias da família.
- **Verde suspeito:** injetar uma falha controlada ou perturbar a implementação numa cópia isolada. O teste/gate existente tem de a detetar. Um mock que se confirma a si próprio, um módulo abandonado ou um exit code perdido pode fabricar verde. Repor as mutações no fim.
- **Setup partilhado ou poda:** mapear cada asserção distinta ao cenário retido, incluindo identidade, permissões, cancelamento, cleanup, limites e concorrência relevante. Menos casos ou um oráculo mais fraco não são aceleração.
- **Integração externa:** separar produtor falso, fronteira real e serviço/engine real. Um browser simulado ou driver falso não prova o provider instalado. Distinguir skips permitidos de pré-requisitos obrigatórios não satisfeitos.

Classificar como defeito reproduzido, custo demonstrado, hipótese ou evidência indisponível. Guardar comando/saída/estado de saída, resultado esperado, âmbito e explicações concorrentes. Uma falha na baseline pode ser pré-existente e ainda relevante para a auditoria; não a atribuir ao PR só por semelhança.

Repetir apenas para testar uma hipótese transitória concreta, conservando a primeira falha. Uma tentativa verde não estabelece causa nem correção.

## Medir e corrigir sem enfraquecer o gate

Para cache, artefactos, agendamento, logs ou lentidão, ler [medição e CI](references/measurement-and-ci.md). Comparar trabalho equivalente concluído: testes, asserções, cobertura e saídas, além do tempo. Separar setup/build, execução, instrumentação, dependências e espera do runner.

Remover preparação comprovadamente duplicada ou trabalho repetido antes de reduzir cobertura. Resultados guardados não validam automaticamente estado vivo do host, permissões, providers ou serviços. Ler a documentação da versão instalada antes de mudar configuração de Turbo ou outro executor.

Se editar estiver autorizado, corrigir no produtor responsável e acrescentar regressão RED na baseline pelo motivo certo. Verificar os consumidores, caminhos negativos e invalidação/descoberta afetados. Não suprimir falhas, aplicar retries gerais ou subir timeouts apenas para obter verde; uma mudança destes controlos exige uma razão demonstrada e deteção de falhas preservada.

## Entregar e parar

Por achado: revisão exata, reprodução, consequência, correção proposta e limites da prova. Para desempenho: workload, medições comparáveis e custos não medidos, não apenas uma percentagem. Mostrar o exit code do comando medido e do profiler/agregador, contagens, skips e relatórios obrigatórios.

Os registos públicos e a integração seguem a autorização e o processo do projeto. Parar quando o âmbito autorizado estiver verificado ou o benefício adicional for especulativo; não transformar incertezas genuínas numa sequência ilimitada de otimizações.
