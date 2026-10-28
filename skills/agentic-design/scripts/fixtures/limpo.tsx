// Um ecrã sem tiques: lista em linhas, tokens, estados desenhados.
// Comentários não contam: ✨ «Bem-vindo de volta» «Sem dados» text-[10px]
import { Botao } from "@/components/ui/botao";

type Fatura = { id: string; cliente: string; total: string; estado: "Por emitir" | "Emitida" };

export function FaturasPorEmitir({ faturas, emitir }: { faturas: Fatura[]; emitir: (id: string) => void }) {
  if (faturas.length === 0) {
    return (
      <section className="vazio">
        <p className="text-sm text-[var(--color-fg)]">Nenhuma fatura por emitir hoje.</p>
        <Botao variante="secundaria" href="/faturacao/historico">
          Ver as emitidas esta semana
        </Botao>
      </section>
    );
  }
  return (
    <ol className="grid grid-cols-[1fr_auto_auto] gap-x-6 text-sm">
      {faturas.map((f) => (
        <li key={f.id} className="contents">
          <span className="truncate text-[var(--color-fg)]">{f.cliente}</span>
          <span className="tabular-nums text-right">{f.total}</span>
          <span className="text-[13px] font-semibold">{f.estado}</span>
          <img className="h-8 w-8 rounded-full" alt="" src="/avatar.png" />
        </li>
      ))}
      <div role="dialog" className="fixed inset-0 rounded-lg shadow-2xl">Confirmar emissão</div>
      <p className="rounded-md bg-[var(--color-panel)]">Link enviado para o e-mail. Abra o link mágico no mesmo dispositivo.</p>
      <button onClick={() => emitir(faturas[0].id)}>Emitir a primeira</button>
      <button className="transition-colors" style={{ transition: "opacity 150ms" }}>Pré-visualizar</button>
      <Loader className="animate-spin" aria-label="A carregar" />
      <nav className="backdrop-blur-md">
        <a aria-current="page" className="border-l-2" href="/faturas">Faturas</a>
      </nav>
      <Button variant="secondary">Duplicar</Button>
      <span>{faturas[0]?.cliente ?? ""}</span>
      <p>Passo 2 de 3</p>
      <a href="https://example.com/ajuda">Ajuda</a>
    </ol>
  );
}
