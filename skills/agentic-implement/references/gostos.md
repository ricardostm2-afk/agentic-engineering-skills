# Preferências por omissão: código e texto do produto

Valem por omissão em qualquer projeto que use estas skills, e cada projeto pode editar este
ficheiro. Quem escreve aplica-as no passo 6 da `agentic-implement`; quem revê confere o diff por
elas (lente normas da `agentic-code-review`). O `AGENTS.md` do projeto traz
o que é só desse projeto (vocabulário, stack) e ganha a este ficheiro. A interface tem fonte
própria: o design system do projeto e `<agentic-design>/references/ui-sem-slop.md`
(`<agentic-design>` é a skill irmã, procurada como diz o `SKILL.md` da agentic-implement; no caso
normal, a pasta ao lado dela).

## Código

- O código serve qualquer cliente, não só o primeiro: o que muda de cliente para cliente (nome,
  domínio, IP, tabelas, valores) vem de dados ou de configuração, e os exemplos usam domínios de
  exemplo. Um produto que serve vários clientes parte no segundo se tiver fixado o que era do primeiro.
- O cliente novo, com zero registos e a configuração por fazer, é um caso de primeira classe: tem
  teste, e o ecrã diz o que falta em vez de parecer avariado.
- A ausência de valores fixos prova-se com uma pesquisa (`git grep` do nome do cliente atual no
  código de produção sai vazio), não se afirma.

## Texto do produto

- Português de Portugal (ortografia, vocabulário, datas e números pt-PT), salvo quando o
  `AGENTS.md` do projeto declara outra língua.
- O texto que o utilizador final lê (ecrã, PDF, e-mail, SMS, também o que o servidor gera) diz o
  que acontece, com as palavras do domínio: sem marketing nem tecnicês, pelo B14 e pelo B15 de
  `<agentic-design>/references/ui-sem-slop.md`.
- O texto publicado é para quem lê: nenhuma nota de trabalho («Na ótica de SEO…», «Antes de
  publicar, …») nem estatística sem fonte chega lá.
- Imagens: o nome do ficheiro descreve o que se vê, na língua do produto (minúsculas, hífenes, sem
  acentos), e nunca é o nome da ferramenta que a gerou; o `alt` descreve-a (num site público, com a
  marca e a localidade); `width` e `height` batem com o ficheiro; o recorte faz-se no ficheiro, não
  no `object-position`. O nome e o `alt` contam na pesquisa de imagens, e o recorte no ficheiro vale
  em todos os sítios onde a imagem aparece.
