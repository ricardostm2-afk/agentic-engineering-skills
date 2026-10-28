# Contratos, disponibilidade e ownership

Adaptação seletiva de `docs/tool-design.md` de REA; a revisão e a licença estão em [origem](origem.md). Os detalhes de implementação, constantes e providers REA não são requisitos deste guia.

## Disponibilidade e identidade

Conservar o catálogo e reportar disponibilidade/capacidade por sessão/provider, em vez de omitir silenciosamente ferramentas de schemas. Um provider candidato não é o provider selecionado; uma ferramenta anunciada não demonstra que o seu pré-requisito esteja instalado.

Separar a identidade canónica de labels legíveis. Incluir digest/versão/opções que afetem reutilização e associação à fonte. Nas relações estáticas, completude significa o conjunto realmente observado devolvido sem limite conhecido, não todas as relações que podem ocorrer em execução.

Cada erro ou resultado parcial deve permitir distinguir input recusado, provider indisponível, falha física, limite, cancelamento, cobertura incompleta e cleanup pendente. Conservar diagnóstico primário e observações já obtidas; não converter o encerramento falhado numa alegação de que a análise nunca produziu nada.

## Ciclo de vida

Dar um dono a recursos adquiridos: handles, processos, ligações, diretórios temporários e trabalho partilhado. Distinguir admissão do alvo, prontidão, trabalho ativo, saída do processo, fecho de output e libertação. Um PID ou launcher bem-sucedido só estabelece o seu próprio facto.

Libertar só recursos próprios. Attach pode possuir apenas a ligação, não a aplicação observada. Saída do processo pai não demonstra o fim dos filhos ou fecho de streams. Preservar identidade suficiente para confirmar ownership antes de parar/remover recursos.

Em trabalho partilhado, há um produtor e consumidores canceláveis individualmente. Um consumidor não deve destruir o resultado de outro; o último acompanha cleanup. Reter falhas por recurso e repetir só os fechos ainda pendentes. Um retry não apaga sucesso/falha anterior nem demonstra que um recurso desconhecido foi libertado.

Propagar cancelamento até consumo/finalização. Antes de devolver sucesso, observar cancelamento depois da última espera relevante. Definir o ponto de compromisso para uma publicação atómica e conservar o respetivo recibo se já ocorreu; cancelamento posterior não a desfaz.

Conservar controlos de execução aceites em filas e retries. Guardar o motivo do cancelamento separado da falha do produtor e não o reconstruir por comparação de mensagens.

## Limites e verificação

Escolher limites por formato, autoridade, protocolo e custo medido. Contabilizar processos filhos, descodificação, serialização e estado retido, não apenas workers ou tamanho de uma resposta. Descrever exatamente a cobertura quando se pagina ou interrompe.

Verificar falha e cleanup no mesmo caminho público que o consumidor usa. Uma cache de sucesso anterior não prova prontidão atual de um serviço/host. Um wrapper de profiler verde não prova o payload; ler ambos os estados de saída.

Reusar os tipos de erro, supervisores e contratos do próprio projeto quando correspondem à intenção. Não importar helpers internos nem números de timeout de um projeto alheio como requisitos universais.
