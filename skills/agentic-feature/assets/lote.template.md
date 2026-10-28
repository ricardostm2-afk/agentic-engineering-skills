# Lote <id>

Base: `<SHA completo depois da preparação>`

## Grupos e donos

| Grupo | Dono | Ficheiros (caminhos exatos, um dono por ficheiro) | Brief |
|---|---|---|---|
| <grupo> | <faixa ou orquestrador> | <ficheiros> | <caminho> |

## Ficheiros de encontro e guardas

| Ficheiro | Dono (o do grupo) | Contrato ou commit de preparação | Guarda que o prova | Saída esperada |
|---|---|---|---|---|
| <caminho> | <dono> | <apontador ou SHA> | <comando> | <resultado> |

## Playbook (só num lote mecânico)

<!-- O método está no §4 do implementacao.md, «Lote mecânico»; apaga esta secção nos outros lotes. -->

Transformação: <de quê para quê, numa frase>
Unidades feitas à mão: <SHA, uma por forma diferente>
Formas que o script trata: <lista> · ficam à mão: <lista, ou nenhuma>
Script: `<caminho>` · reproduz as unidades: `<comando>` → diff vazio
Classes (um commit cada): <classe → ficheiros>
Fora do script (zonas sensíveis): <ficheiros, ou nenhum>
Aprovado: <id da decisão no quadro, ou as palavras do humano>

## Ordem

| Passo | Grupo ou grupos | Depende de | Papel neste lote |
|---|---|---|---|
| <n> | <grupos> | <passos ou nenhuma> | <preparação, piloto ou restantes> |
