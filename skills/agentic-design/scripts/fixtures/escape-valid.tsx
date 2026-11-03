export function RiskNotice() {
  return (
    // slop-ok: data loss warning deliberately bright red (decision recorded in DESIGN.md)
    <div className="border-[#dc2626] text-[#7f1d1d]">Deleting removes the data permanently</div>
  );
}
export function Chart() {
  return <rect fill="#6d28d9" style={{ fontSize: 10 }} />; {/* slop-ok: chart series 3, data colour measured in the palette */}
}
