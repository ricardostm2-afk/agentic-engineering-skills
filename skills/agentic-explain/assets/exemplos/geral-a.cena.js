// A árvore dos nomes: o resolvedor pergunta a cada servidor, da raiz ao servidor do nome.
function cena(ctx) {
  const { THREE, cores } = ctx;
  const esfera = new THREE.SphereGeometry(1, 28, 18);
  const caixa = new THREE.BoxGeometry(1.4, 1.4, 1.4);

  // Cada peça tem o seu material, para o realce de um passo não pintar as outras.
  const peca = (id, geometria, escala, x, y, texto, abaixo = false) => {
    const objeto = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: cores.neutro }));
    objeto.scale.setScalar(escala);
    objeto.position.set(x, y, 0);
    ctx.cena.add(objeto);
    ctx.elemento(id, objeto);
    // O rótulo vai por cima, ou por baixo quando uma linha sobe da peça, para nunca ficar sobre uma linha.
    ctx.rotulo(texto, new THREE.Vector3(x, abaixo ? y - escala - 0.6 : y + escala + 0.6, 0));
    return objeto.position;
  };
  const linha = (a, b, cor) => {
    const geometria = new THREE.BufferGeometry().setFromPoints([a, b]);
    ctx.cena.add(new THREE.Line(geometria, new THREE.LineBasicMaterial({ color: cor })));
  };

  // O tamanho diz o nível: quanto mais perto da raiz, maior. O resolvedor é a caixa, porque é ele que pergunta.
  const resolvedor = peca("resolvedor", caixa, 0.8, -3.5, -1.8, "Resolvedor", true);
  const raiz = peca("raiz", esfera, 0.7, -3.5, 2.6, "Raiz");
  const tld = peca("tld", esfera, 0.55, 0.5, 0.9, "Final do nome (.org)");
  const autoritativo = peca("autoritativo", esfera, 0.4, 4.5, -0.8, "Servidor do nome");

  // A cadeia da delegação (cada um aponta para o seguinte) e as perguntas do resolvedor.
  linha(raiz, tld, cores.tinta);
  linha(tld, autoritativo, cores.tinta);
  for (const servidor of [raiz, tld, autoritativo]) linha(resolvedor, servidor, cores.linha);

  // Um ponto vai e volta entre o resolvedor e cada servidor, por ordem. Parado, a cena percebe-se na mesma.
  if (ctx.movimentoReduzido || !ctx.animar) return;
  const ponto = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: cores.serie[0] }));
  ctx.cena.add(ponto);
  const percurso = [raiz, resolvedor, tld, resolvedor, autoritativo, resolvedor];
  let tempo = 0;
  ctx.animar((dt) => {
    tempo = (tempo + dt * 0.5) % percurso.length;
    const i = Math.floor(tempo);
    const de = percurso[(i + percurso.length - 1) % percurso.length];
    ponto.position.lerpVectors(de, percurso[i], tempo - i);
  });
}
