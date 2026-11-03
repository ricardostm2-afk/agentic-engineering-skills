export function Panel({ empty, order }: { empty: boolean; order: { reference?: string } }) {
  return (
    <div className="rounded-3xl shadow-xl p-6">
      <span className="bg-[#e0f2fe] text-xs">Summary</span>
      <div className="rounded-[28px] shadow-2xl">{empty ? <p>No data</p> : null}</div>
      <div className="shadow-[0_20px_40px_rgba(0,0,0,0.12)]">No data available.</div>
      <p style={{ color: "#64748b" }}>Updated</p>
      <a className="hover:-translate-y-1" href="/tasks">Tasks</a>
      <span className="animate-ping h-2 w-2" />
      <ul className="backdrop-blur-md">
        <li>Order 12</li>
      </ul>
      <div className="border-l-4 pl-3">Deadline approaching</div>
      <Button variant="outline">Duplicate</Button>
      <button className="border bg-transparent">Send</button>
      <dd>{order.reference ?? "-"}</dd>
      <h3>01 / Data</h3>
    </div>
  );
}
