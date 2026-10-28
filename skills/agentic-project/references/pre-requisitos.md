# Pré-requisitos (fase 1)

Objetivo: descobrir cedo o que bloqueia ou encarece o projeto e que só o humano resolve. Um
pré-requisito esquecido aparece mais tarde como semana perdida (conta que demora a aprovar, dado
que não pode sair da UE, custo que não cabe no orçamento).

Como usar: para cada item, primeiro vê se o contexto, o código ou os docs já respondem. Só
pergunta o que falta, pela ordem das categorias (as primeiras mudam mais coisas). Cada pergunta
leva a tua recomendação. Regista tudo em `docs/pre-requisitos.md`.

## 1. Objetivo e utilizador
- Que problema resolve, para quem, e como se faz hoje sem o produto?
- Quem paga e quem usa (podem ser pessoas diferentes)?
- Como se sabe, daqui a 3 meses, que valeu a pena (uma métrica observável)?

## 2. Restrições legais e de dados
- Há dados pessoais? Que categorias? Dados de saúde, biométricos, de menores ou de crimes são
  categorias especiais (RGPD art. 9.º/10.º): exigem base legal própria, registo de acessos e,
  normalmente, avaliação de impacto. Recomenda: tratar como especiais desde o início se houver
  dúvida; é mais barato do que migrar depois.
- Onde podem estar os dados? Por omissão recomenda UE (hosting, backups, subprocessadores,
  incluindo e-mail, logs e IA).
- Quanto tempo se guardam e como se apagam (pedido do titular, fim de contrato)?
- Pagamentos: nunca guardar dados de cartão; usar um processador (Stripe, Adyen, etc.).
  Faturação legal do país (ex.: software certificado em Portugal) é requisito, não detalhe.
- Outros regimes do setor (saúde, finanças, educação)? Se ninguém sabe, regista como pendente
  com dono humano.

## 3. Orçamento e custos
- Teto de custo mensal da infraestrutura no primeiro ano?
- Custos por utilização (IA, SMS, e-mail, armazenamento) com alerta de consumo?
- Quem paga as contas dos serviços (cartão da empresa, não do programador)?

## 4. Hosting e região
- Onde corre (VPS, cloud gerida, PaaS, serverless)? A decisão final é da fase 3; aqui só se
  recolhem restrições (região, latência, preferência por fornecedor, quem opera).
- Domínio: existe? Quem controla o DNS?

## 5. Contas e serviços externos
Para cada serviço (git remoto, hosting, base de dados gerida, e-mail transacional, pagamentos,
monitorização, lojas de apps): existe conta? **De quem é** (deve ser da organização, com 2FA, e
não pessoal)? Quem tem acesso de administração? Há contrato de subcontratação (DPA) quando trata
dados pessoais?

## 6. Ferramentas locais
Corre `scripts/verificar-ambiente.sh`. Essenciais: `git`, `node>=20`. Recomendadas: `gh`, `uv`,
`specify`, as skills `agentic-feature` (por onde entra cada feature) e `agentic-design`
(essencial se o projeto tem UI: traz as regras e o detetor de slop que as fases 2, 4 e 6 usam) e
o plugin `mattpocock-skills`.
Opcional: `gitleaks`. Instalar só com OK do humano; o script imprime o comando exato.

As autorizações vão de uma vez, na mesma pergunta (cada uma é uma linha da tabela, e o OK fica
em `docs/decisoes.md`):
- **Pesquisa web**: `WebSearch` e `WebFetch` (sem lista de domínios, ou uma lista mínima: o
  registo de pacotes, a documentação da stack, as páginas de preços), em
  `.claude/settings.local.json`, que fica fora do git (o `.gitignore` base da fase 4 ignora-o;
  até lá, os commits por caminhos explícitos não o apanham). Sem
  OK ou sem rede, a fase 3 marca versões e preços «não confirmado» e este item fica pendente.
- **Esqueleto da fase 3**: descarregar dependências para uma pasta temporária (scaffolder e
  `npm install`) corre código de terceiros; sem OK, a linha «Medido no esqueleto» fica «não
  medido».
- **Comandos git na sandbox** (só num agente cuja sandbox deixa `.git` só de leitura, como o
  Codex em `workspace-write`): aprovar para a sessão `git commit`, `git worktree add` e
  `git config`, ou abrir a sessão com permissões totais (`codex --sandbox danger-full-access`).
  Sem OK, cada commit da skill pede aprovação e as faixas de agentes correm em sequência num só
  ramo.

## 7. Acessos que só o humano tem
Lista-os explicitamente; são o caminho crítico mais comum:
- segredos e chaves de API (o humano coloca-os no `.env` local ou no gestor de segredos; nunca
  no chat);
- DNS e domínio;
- faturação e cartões;
- criação de contas e aceitação de termos;
- lojas de apps, certificados de assinatura de código;
- autenticação do `gh` (`gh auth login`).

O agente nunca cria contas, nunca introduz dados de pagamento e nunca pede segredos no chat.

## Formato de `docs/pre-requisitos.md`

```markdown
# Pré-requisitos

| Item | Estado | Dono | Nota |
|---|---|---|---|
| Dados de saúde → base legal | pendente | <humano> | perguntar ao DPO até <data> |
| Node >= 20 | ok | - | 22.x |

## Só o humano pode fazer
- [ ] Criar conta X em nome da empresa (2FA ligado)
- [ ] Pôr a chave Y no `.env` (variável `Y_API_KEY`)
```

Estados: `ok`, `pendente` (tem sempre dono), `n.a.` (com uma palavra a dizer porquê).
