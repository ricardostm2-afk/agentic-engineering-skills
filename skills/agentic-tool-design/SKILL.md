---
name: agentic-tool-design
description: >-
  Desenhar ou alterar ferramentas MCP/CLI/API para agentes: fronteiras, schemas, descoberta, identidade, evidência, efeitos e ciclo de vida. Usar ao definir contratos de ferramentas ou corrigir a sua composição; não substitui o processo de implementação e revisão do projeto.
---

# Desenho de ferramentas para agentes

Desenhar a fronteira a partir da pergunta que a pessoa precisa de responder, não da biblioteca disponível. Adaptada da skill e do guia de desenho REA, sob MIT; [origem e atualização](references/origem.md). Não depende de REA.

Ler o contrato canónico atual, os consumidores e a ferramenta mais próxima. Código, documentação e catálogo ligado podem pertencer a versões distintas; confirmar os schemas realmente disponíveis. Seguir as regras do projeto e a autorização existente para implementação, configuração e efeitos externos.

## Escolher uma fronteira

Estender uma ferramenta quando intenção e contrato coincidem; criar outra para resultado ou autoridade materialmente distintos. Uma ferramenta não precisa de agrupar descoberta, execução e mutação sem relação só para reduzir o catálogo.

| Forma | Pergunta respondida |
| --- | --- |
| Inspecionar | Que factos existem sobre este objeto identificado? |
| Pesquisar/listar | Que candidatos correspondem e como continuo a página? |
| Traçar | Que relações sustentam esta conclusão e onde ficam os caminhos não resolvidos? |
| Comparar | O que difere entre estes dois artefactos/estados explicitamente emparelhados? |
| Observar/capturar | Que ações e efeitos ocorreram neste alvo durante este ciclo de vida? |
| Compor um workflow | Que resultado recorrente junta várias fontes sem esconder escolhas ou incerteza? |

As formas não impõem prefixos. Preferir primitivas reutilizáveis; juntar um workflow quando o uso repetido demonstrar um resultado que pode ser composto com segurança. Uma interpretação específica do negócio não pertence a um decoder genérico. Batching só vale se conservar identidade, ordem necessária e falhas individuais.

Comandos e scripts normais podem bastar para compor experiências. Uma linguagem de orquestração, replay ou prepare/execute precisa de necessidade demonstrada; um plano não prova execução.

## Definir input e resposta

Explicitar identidade do alvo, escolhas de ação/output e campos obrigatórios; retirar opções ignoradas. Entregar factos úteis inline, fontes/localizações, identidade do produtor, cobertura, inferências e incógnitas. Não exigir consultas extra só para descobrir o que significa a resposta.

Para respostas grandes, fornecer sumários/seleção/paginação estável com acesso à evidência completa. Definir a que universo se aplicam contagens e limites. Cobertura ausente é desconhecida, não ausência de factos; um inventário completo não torna todos os providers disponíveis. Distinguir relações observadas, derivadas e inferidas.

Declarar efeitos de processo, ficheiros, rede, UI e mutação. Uma análise estática não observou runtime; anexar a um processo não transfere automaticamente a propriedade dele. A estrutura do contrato deve conservar alvo e lifecycle que o utilizador realmente escolheu, sem alargar silenciosamente o âmbito.

Ler [contratos e recursos](references/contracts.md) se houver providers, recursos partilhados, cancelamento ou cleanup.

## Provar e entregar

Apresentar fronteira proposta, input/resultado, efeitos, alternativa existente mais próxima e abordagem de verificação. Implementar apenas no âmbito autorizado e pelo processo do projeto.

Testar o entrypoint público com um caso normal e as fronteiras alteradas: alvo errado/inacessível, resultado vazio vs parcial, página seguinte, input inválido, falha do produtor, cancelamento e cleanup. Um teste que confirma o próprio mock não prova o contrato do produtor. Manter prova real quando se alegam capacidades de um provider real.

Entregar exemplos de chamadas/resultados, contrato de erro, disponibilidade e limites. Medir a tarefa concluída para alegar melhoria de custo/usabilidade: tamanho serializado por si só não prova tokens poupados, menor latência ou melhores decisões.
