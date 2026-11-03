// The name tree: the resolver asks each server, from the root to the name's server.
function scene(ctx) {
  const { THREE, colors } = ctx;
  const sphere = new THREE.SphereGeometry(1, 28, 18);
  const box = new THREE.BoxGeometry(1.4, 1.4, 1.4);

  // Each part has its own material, so highlighting a step does not recolor the others.
  const part = (id, geometry, scale, x, y, text, below = false) => {
    const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: colors.neutral }));
    object.scale.setScalar(scale);
    object.position.set(x, y, 0);
    ctx.scene.add(object);
    ctx.element(id, object);
    // Place labels above, or below when a line rises from the part, so they never cover a line.
    ctx.label(text, new THREE.Vector3(x, below ? y - scale - 0.6 : y + scale + 0.6, 0));
    return object.position;
  };
  const line = (a, b, color) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
    ctx.scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color })));
  };

  // Size indicates level: closer to the root means larger. The resolver is a box because it asks the questions.
  const resolver = part("resolver", box, 0.8, -3.5, -1.8, "Resolver", true);
  const root = part("root", sphere, 0.7, -3.5, 2.6, "Root");
  const tld = part("tld", sphere, 0.55, 0.5, 0.9, "Name ending (.org)");
  const authoritative = part("authoritative", sphere, 0.4, 4.5, -0.8, "Name server");

  // The delegation chain (each points to the next) and the resolver's questions.
  line(root, tld, colors.ink);
  line(tld, authoritative, colors.ink);
  for (const server of [root, tld, authoritative]) line(resolver, server, colors.line);

  // A dot travels between the resolver and each server in order. The scene still makes sense when paused.
  if (ctx.reducedMotion || !ctx.animate) return;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: colors.series[0] }));
  ctx.scene.add(dot);
  const route = [root, resolver, tld, resolver, authoritative, resolver];
  let time = 0;
  ctx.animate((dt) => {
    time = (time + dt * 0.5) % route.length;
    const i = Math.floor(time);
    const from = route[(i + route.length - 1) % route.length];
    dot.position.lerpVectors(from, route[i], time - i);
  });
}
