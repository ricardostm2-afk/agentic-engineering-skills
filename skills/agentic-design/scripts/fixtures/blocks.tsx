export function Landing() {
  return (
    <main>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8">Start now</div>
      <section className="bg-gradient-to-br from-sky-400 to-emerald-300 py-24">
        <h1>Unlock your business's full potential</h1>
        <p className="text-[10px] text-[var(--color-muted)]">Updated 2 minutes ago</p>
      </section>
      <h2>✨ What's new</h2>
      <p>
        Welcome back! Everything in one place.
      </p>
      <span style={{ fontSize: 11 }}>caption</span>
      <div style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }} />
      <p>{/* slop-ok */}Seamless experience for your team</p>
      <span className="text-xs uppercase tracking-widest">Overview</span>
      <button className="transition-all">Save</button>
    </main>
  );
}
