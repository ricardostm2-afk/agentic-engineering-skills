// A screen without tics: row list, tokens, designed states.
// Comments do not count: ✨ "Welcome back" "No data" text-[10px]
import { Button } from "@/components/ui/button";

type Order = { id: string; customer: string; total: string; status: "Pending" | "Sent" };

export function PendingOrders({ orders, send }: { orders: Order[]; send: (id: string) => void }) {
  if (orders.length === 0) {
    return (
      <section className="empty">
        <p className="text-sm text-[var(--color-fg)]">No orders to send today.</p>
        <Button variant="secondary" href="/orders/history">
          View those sent this week
        </Button>
      </section>
    );
  }
  return (
    <ol className="grid grid-cols-[1fr_auto_auto] gap-x-6 text-sm">
      {orders.map((o) => (
        <li key={o.id} className="contents">
          <span className="truncate text-[var(--color-fg)]">{o.customer}</span>
          <span className="tabular-nums text-right">{o.total}</span>
          <span className="text-[13px] font-semibold">{o.status}</span>
          <img className="h-8 w-8 rounded-full" alt="" src="/avatar.png" />
        </li>
      ))}
      <div role="dialog" className="fixed inset-0 rounded-lg shadow-2xl">Confirm sending</div>
      <p className="rounded-md bg-[var(--color-panel)]">Link sent by email. Open the magic link on the same device.</p>
      <button onClick={() => send(orders[0].id)}>Send the first</button>
      <button className="transition-colors" style={{ transition: "opacity 150ms" }}>Preview</button>
      <Loader className="animate-spin" aria-label="Loading" />
      <nav className="backdrop-blur-md">
        <a aria-current="page" className="border-l-2" href="/orders">Orders</a>
      </nav>
      <Button variant="secondary">Duplicate</Button>
      <span>{orders[0]?.customer ?? ""}</span>
      <p>Step 2 of 3</p>
      <a href="https://example.com/help">Help</a>
    </ol>
  );
}
