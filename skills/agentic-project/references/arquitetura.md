# Arquitetura (fase 3)

Objetivo: escolher uma arquitetura que o humano entende e consegue pagar, e que os agentes
conseguem desenvolver com feedback rápido. A arquitetura é a decisão mais cara de reverter do
projeto; por isso propõe-se com opções e custos, não se impõe.

## Modo adotar

Num repo que já tem código, a arquitetura já existe: não proponhas opções do zero. Audita o que
existe contra as forças (§1) e a adequação a agentes (§3): o que já serve, o que falta (ex.: não
corre com um comando, sem typecheck, testes lentos) e o que contradiz uma decisão da fase 2.
Propõe só as mudanças que uma força justifica, cada uma com custo; uma migração grande é uma
decisão do humano e, se aprovada, entra no backlog (fase 9) e não nesta sessão. O §4–§7 aplicam-se
ao código que lá está: módulos que existem, mapa de áreas das pastas reais.

## 1. Forças que decidem

Antes das opções, escreve 5–8 forças tiradas de `docs/decisoes.md` e `docs/pre-requisitos.md`
(ex.: «dados pessoais só na UE», «teto 50 €/mês», «uma pessoa a operar», «picos de 10× às
segundas»). Cada opção vai ser avaliada contra elas; sem isto a comparação é gosto.

## 2. Opções (2–3) com trade-offs

Para cada opção: descrição em 3 linhas, diagrama mínimo (texto), e a tabela:

| Critério | Opção A | Opção B |
|---|---|---|
| Custo mensal estimado (MVP e a 10×) | | |
| Esforço de operação (quem acorda às 3 h?) | | |
| Dependência de fornecedor / custo de sair | | |
| Região dos dados e subprocessadores | | |
| Adequação a agentes (ver §3) | | |
| Versão estável e suporte (fonte, data) | | |
| Medido no esqueleto (build, testes, typecheck) | | |
| Riscos principais | | |

Custos: confirma os preços nas páginas oficiais dos fornecedores (com
`mattpocock-skills:research` se disponível, ou a ferramenta de pesquisa web). Sem acesso à rede,
dá intervalos e marca cada um «estimativa, a confirmar» na tabela e em `docs/decisoes.md`; o
humano não deve decidir sobre um número que parece verificado e não foi.

Termina com **Recomendação** e o porquê numa frase ligada às forças. Pergunta ao humano (uma
pergunta; «escolhe tu» é válido).

Pontos de partida razoáveis, a ajustar às forças:
- Monólito modular + uma base de dados relacional + um servidor ou PaaS. Simples de operar, fácil
  de testar localmente, bom por omissão para MVP.
- Plataforma gerida (BaaS/serverless). Menos operação, mais dependência e custos por utilização
  menos previsíveis.
- Separação em serviços só quando há uma força concreta (equipa separada, escala muito desigual,
  requisito legal de isolamento). Para MVP quase nunca.

Prefere tecnologia aborrecida e madura: os agentes conhecem-na melhor e erram menos. Aborrecida
quer dizer madura e estável, na versão estável atual e com as capacidades atuais; não quer dizer
antiga. O procedimento de pesquisa e o teto estão em `pesquisa-arquitetura.md`.

## 3. Adequação a agentes

Uma arquitetura boa para agentes deixa verificar cada alteração depressa e sem ambiente
partilhado:
- **Tudo corre localmente com um comando** (incluindo base de dados, por exemplo em contentor) e
  com dados de teste sintéticos.
- **Linguagem com tipos** e typecheck rápido: o typecheck apanha à partida erros que de outra
  forma só os testes ou a produção apanhavam.
- **Verificação por área em < 2 min**: testes que se correm só para a pasta tocada.
- **Testes determinísticos**: relógio, aleatoriedade e rede controláveis nos testes.
- **Fronteiras claras**: cada área tem dono e verificação (mapa de áreas), para que dois agentes
  em paralelo não colidam.

## 4. Módulos profundos

Os termos (módulo profundo e raso, interface, costura, adaptador, teste de apagar) são os de
`<agentic-architecture>/references/vocabulario.md`: lê-o antes de desenhar os módulos. O
`mattpocock-skills:codebase-design`, se instalado, é a mesma fonte em inglês. Prefere poucos
módulos profundos a muitos rasos que só passam chamadas, e uma costura só quando há (ou vai haver
mesmo) dois adaptadores, por exemplo o real e o de teste.

Para cada módulo principal escreve: nome (do glossário), responsabilidade numa frase, interface
em 3–5 linhas, costuras testáveis.

## 5. Mapa de áreas

Diz que pastas pertencem a que área, que verificação correr quando se mexe nelas, e o risco.
Vai para `.agentic/areas.json` na fase 4:

```json
{
  "areas": [
    {
      "area": "faturacao",
      "pastas": ["src/faturacao/", "db/migrations/"],
      "verificar": ["npm run -s typecheck", "npx vitest run src/faturacao"],
      "risco": "alto",
      "notas": "valores monetários em cêntimos inteiros; migrações nunca se editam depois de aplicadas"
    }
  ]
}
```

`risco` tem dois valores, os mesmos do script da fase 4: `normal` ou `alto`. `alto` = dados
pessoais, permissões, isolamento entre clientes, pagamentos, migrações, integrações externas;
nessas áreas a agentic-feature usa a via Completa e revisão de segurança. Hooks, CI e
instaladores não se marcam `alto` só por o serem: a revisão (`agentic-code-review`) reconhece-os
pelo caminho e dá-lhes a lente de segurança e o verificador, sem subir o planeamento nem as rondas.
Não inventes níveis intermédios: ninguém sabe o que «médio» obriga a fazer. O comando de
`verificar` é o do executor de testes do projeto; antes de o escrever, confirma que corre pelo
menos um teste (ver «Mapa de áreas» em `ambiente-git.md`).

## 6. Decisões irreversíveis e ADRs

Destaca na proposta as decisões difíceis de reverter (base de dados, modelo de multi-cliente,
fornecedor de autenticação, região, linguagem). Escreve um ADR em `docs/adr/NNNN-titulo.md` só
quando as três condições se verificam: difícil de reverter, surpreendente sem contexto, e
resultado de um trade-off real. Uma ADR aceite não se reescreve: completa-se com uma secção
datada no fim («## Adenda AAAA-MM-DD», ex.: a tabela de pesquisa que faltava), ou é substituída
por uma ADR nova que diz «Substitui NNNN», e a antiga passa a `Estado: substituída por MMMM`.
Formato:

```markdown
# NNNN. Título

Estado: aceite (AAAA-MM-DD) · Decidido por: humano | delegado

## Contexto
<forças em jogo, 3–6 linhas>

## Decisão
<o que se escolheu>

## Consequências
<o que fica mais fácil, o que fica mais difícil, o que obriga a fazer>

## Alternativas consideradas
<cada uma numa linha, com o motivo de rejeição; na ADR da stack, a tabela do §2 com fonte e data>

Rever em: <data ou gatilho>
```

## 7. `ARCHITECTURE.md`

Curto (alvo ≤ 150 linhas), escrito para agentes e para o humano daqui a 6 meses:
1. Visão em 5 linhas e diagrama de texto.
2. Módulos (do §4).
3. Fluxos de dados principais (de onde vem cada dado pessoal, onde fica, quem o vê).
4. Mapa de áreas (resumo; a fonte é `.agentic/areas.json`).
5. Como correr e verificar localmente (os comandos exatos).
6. Decisões irreversíveis com link para os ADRs.

Não repitas o que um `grep` ou a árvore de pastas mostram.
