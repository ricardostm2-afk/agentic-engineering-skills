## Agentes e modelos por tarefa

Quem orquestra (a sessão principal) usa o modelo mais capaz que tens, com esforço alto. A cada
agente que lança dá o modelo e o esforço pelo nível da tarefa que lhe entrega, depois de fechar as
decisões que só a sessão principal pode fechar. Os níveis e as quatro perguntas que os separam estão
em `references/escolher-o-agente.md`, na skill `agentic-implement`: lê-os lá e não os copies para aqui.

| Tarefa | Quem a faz | Modelo e esforço (exemplos: troca-os pelos teus) |
|---|---|---|
| curta (definição no §1 do `escolher-o-agente.md`) | a própria sessão, com a `agentic-implement`, sem agente nem brief | o da sessão |
| bem-definida | `implementador`, ou `implementador-ui` numa faixa de interface | `sonnet`, esforço `xhigh` |
| complexa | o mesmo agente | `opus`, esforço `xhigh` |
| revisão de código | `revisor`, de contexto novo | `opus`, esforço `medium` |
| pesquisa só de leitura | `pesquisador` | `sonnet`, esforço `xhigh` |

- Lança os agentes pelo tipo definido, não pelo `general-purpose`: têm uma lista de ferramentas
  fechada e arrancam com menos contexto. O `general-purpose` só quando nenhum serve, e com o motivo
  no brief.
- O modelo vem do nível: passa-o no parâmetro `model` da chamada, que ganha ao do ficheiro do
  agente, e o esforço no parâmetro `effort`, se a tua versão o aceita.
- Quem escreveu o código não o revê.
