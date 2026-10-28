export function Landing() {
  return (
    <main>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8">Comece já</div>
      <section className="bg-gradient-to-br from-sky-400 to-emerald-300 py-24">
        <h1>Desbloqueie todo o potencial do seu negócio</h1>
        <p className="text-[10px] text-[var(--color-muted)]">Atualizado há 2 minutos</p>
      </section>
      <h2>✨ Novidades</h2>
      <p>
        Bem-vindo de volta! Tudo num só lugar.
      </p>
      <span style={{ fontSize: 11 }}>legenda</span>
      <div style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }} />
      <p>{/* slop-ok */}Seamless experience for your team</p>
      <span className="text-xs uppercase tracking-widest">Visão geral</span>
      <button className="transition-all">Guardar</button>
    </main>
  );
}
