# Modo manutenção: auditoria com provas

Método adaptado de https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family
(resumido por palavras nossas): com agentes a escrever código, cresce também o que fica para
trás (código morto, experiências acabadas por limpar, flags esquecidas, testes instáveis, CI
lenta). Um agente consegue pegar num pedido largo («limpa o código morto»), descobrir onde
procurar e que prova justifica cada mudança, e entregar limpezas pequenas para revisão.

## Quando

**Só a pedido explícito do humano nesta conversa** («audita o código para limpeza/manutenção»,
«limpa o código morto», «vê porque é que a CI está lenta»). Nunca por iniciativa, nunca «já agora»
a meio de uma revisão ou de uma feature, e nunca numa tarefa agendada sem esse pedido. Se o
projeto diz que a auditoria só existe a pedido (num `AGENTS.md`, `REVIEW.md` ou nas decisões),
isso ganha a qualquer gatilho desta skill.

## Regras (o que trava os falsos positivos)

- Mantém o comportamento de produção. Mantém as salvaguardas operacionais e os killswitches.
- Ignora os fallbacks dos SDKs e os overrides locais: não são prova de que um caminho está vivo
  nem de que está morto.
- **Não mexes em configuração viva nem em serviços**: flags, consolas, bases de dados, filas.
  Lês o que podes ler; o que só se vê lá dentro vai como pergunta ao humano.
- **Uma limpeza por commit** (ou por PR em rascunho, se o projeto usa PRs), com o raciocínio e as
  provas na mensagem. Nada de um commit com dez limpezas.
- **Os casos ambíguos sobem ao humano**, não se decidem: uma flag marcada «Permanent» que custa
  CPU mas pode ter uso operacional; código guardado para incidentes; reflexão ou nomes
  construídos em tempo de execução que não consegues seguir.
- Cada limpeza é uma mudança como outra: passa pela revisão desta skill no nível que o diff der.

## Provas por candidato (o que trava os falsos negativos)

Junta provas de várias fontes; uma só (um `grep` sem resultados) não chega:
1. **histórico**: `git log -S '<nome>'`, `git log --follow <ficheiro>`, `git blame`, commits e PRs
   anteriores ou sobrepostos que o puseram ou tentaram tirar;
2. **configuração viva** (só leitura): o valor da flag em cada ambiente, quem a mudou e quando;
3. **telemetria e perfis**: o caminho correu nos últimos N dias? Um perfil de CPU que mostra que
   as linhas nunca correm vale mais do que um palpite;
4. **chamadores indiretos**: enums, constantes, wrappers, aliases, schemas, nomes construídos em
   tempo de execução, consumidores noutros serviços ou repos, scripts de operação.

Audita o âmbito todo e não só o que está etiquetado; não pares numa lista curta e conservadora.

## Confiança por fases

1. **Um caso**: um candidato, de ponta a ponta, com o humano a ler as provas.
2. **Um subdiretório**: o mesmo prompt, mais largo, com os reparos da fase 1 incorporados.
3. **O repo**: só quando as fases anteriores mostraram que o modelo acerta. Os maiores achados
   validam-se à mão antes da limpeza total.

Os reparos de cada revisão humana voltam ao prompt da fase seguinte.

## Lote mecânico: rever por classe

Vale também no modo revisão, sem pedido de manutenção. Um diff feito por um script de um playbook
aprovado (`<agentic-feature>/references/implementacao.md` §4, «Lote mecânico») revê-se por classe e
não ficheiro a ficheiro. O revisor lê o playbook e o script, confirma que o script reproduz as
unidades feitas à mão e, em cada classe (um commit):
- confere com `git show --stat` que a classe só tocou os ficheiros que o playbook lhe dá;
- lê uma amostra: a 1.ª instância, a maior e uma de cada forma que o playbook separa, mais as que
  ficaram à mão;
- julga a classe por quatro critérios: correção, mínimo, ao jeito do ficheiro e manutenível.

Uma instância errada reprova a classe toda: corrige-se o script (ou o playbook, com nova
aprovação) e corre-se de novo, em vez de se remendar à mão. Os ficheiros das zonas sensíveis não
entram nesta forma: têm a revisão por diff do nível deles. O teto de agentes e as rondas são os da
revisão.

## Prioridade

- O relatório organiza-se em **frentes** (por dono ou por ficheiro) que podem correr em paralelo.
- Cada candidato leva: o que é, os valores em produção, as provas (com a fonte de cada uma), o
  dono, os chamadores, o **benefício medido** (CPU, minutos de CI por dia, tamanho de imagem,
  linhas) e a idade.
- Ordena pelo benefício medido e pela idade; não há níveis de gravidade neste modo.
- Marca as propostas que **acrescentam mais complexidade do que tiram** (um mecanismo novo para
  apagar dez linhas) e não as faças sem decisão do humano: sem medir e ordenar, os achados
  afogam quem os revê.

## Testes instáveis e CI lenta

- Instáveis: a partir das corridas recentes da CI, uma tentativa de correção por teste; só entra
  a correção que funciona (o teste passa N vezes seguidas), e só as claras e simples.
- CI lenta: uma tabela de ideias ordenada pelos minutos poupados por dia, estimados a partir do
  histórico das corridas; uma mudança por commit.

## Modelo e esforço

Os agentes da auditoria correm no modelo de revisão do utilizador (`painel-e-rondas.md` §3). Uma
troca de modelo ou de esforço é dele: leva-lha com o custo por achado aceite (`aprendizagem.md`,
«Modelo e esforço»).

## Saída

O brief do agente de auditoria: `assets/brief-manutencao.template.md`. A entrega ao humano é o
relatório por frentes e, para cada limpeza aprovada, o seu commit pequeno com as provas. Nada se
integra sem a revisão desta skill e sem o humano ter lido as provas.
