export function Painel({ vazio, fatura }: { vazio: boolean; fatura: { nif?: string } }) {
  return (
    <div className="rounded-3xl shadow-xl p-6">
      <span className="bg-[#e0f2fe] text-xs">Resumo</span>
      <div className="rounded-[28px] shadow-2xl">{vazio ? <p>Sem dados</p> : null}</div>
      <div className="shadow-[0_20px_40px_rgba(0,0,0,0.12)]">No data available.</div>
      <p style={{ color: "#64748b" }}>Atualizado</p>
      <a className="hover:-translate-y-1" href="/agenda">Agenda</a>
      <span className="animate-ping h-2 w-2" />
      <ul className="backdrop-blur-md">
        <li>Fatura 12</li>
      </ul>
      <div className="border-l-4 pl-3">Prazo a terminar</div>
      <Button variant="outline">Duplicar</Button>
      <button className="border bg-transparent">Enviar</button>
      <dd>{fatura.nif ?? "-"}</dd>
      <h3>01 / Dados</h3>
    </div>
  );
}
