export function AvisoDeRisco() {
  return (
    // slop-ok: aviso de perda de dados em vermelho vivo de propósito (decisão registada no DESIGN.md)
    <div className="border-[#dc2626] text-[#7f1d1d]">Apagar remove os dados de vez</div>
  );
}
export function Grafico() {
  return <rect fill="#6d28d9" style={{ fontSize: 10 }} />; {/* slop-ok: série 3 do gráfico, cor de dados medida na paleta */}
}
