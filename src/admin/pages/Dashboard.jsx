import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, Empty, ErrorBox, Loading, PageHeader, fmtDate } from "../components/ui.jsx";
import useLoad from "../hooks/useLoad.js";
import { getDashboard } from "../services/admin.js";
import { useSettings } from "../../context/SettingsContext.jsx";

const RANGES = [["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"], ["all", "All time"]];

export default function Dashboard() {
  const { money } = useSettings();
  const [range, setRange] = useState("30");
  const { data: d, loading, error, reload } = useLoad(() => getDashboard(range === "all" ? null : Number(range)), [range]);
  const stats = d && [
    ["Total orders", d.total_orders], ["Sales (excl. cancelled)", money(d.sales)], ["Pending orders", d.pending],
    ["Completed orders", d.delivered], ["Products", d.products], ["Low stock (5 or fewer)", d.low_stock_count],
  ];
  return (
    <>
      <PageHeader title="Dashboard" sub="Live numbers from your orders and products.">
        <label className="sr-only" htmlFor="range">Date range</label>
        <select id="range" value={range} onChange={(e) => setRange(e.target.value)} className="field !w-auto">{RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </PageHeader>
      {loading && !d && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            {stats.map(([l, v]) => <Card key={l}><p className="text-sm text-muted">{l}</p><p className="mt-2 break-words font-display text-3xl sm:text-4xl">{v}</p></Card>)}
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-2xl">Recent orders</h2><Link to="/admin/orders" className="text-sm text-bronze hover:underline">View all</Link></div>
              {d.recent.length === 0 ? <Empty>No orders yet. They will appear here after the first checkout.</Empty> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[460px] text-left text-sm"><thead className="text-muted"><tr><th className="py-2 font-normal">Order</th><th className="font-normal">Customer</th><th className="font-normal">Total</th><th className="font-normal">Status</th></tr></thead>
                  <tbody className="divide-y divide-ivory/10">{d.recent.map((o) => <tr key={o.id}><td className="py-3"><Link to={`/admin/orders?q=${o.order_number}`} className="text-bronze hover:underline">{o.order_number}</Link><p className="text-xs text-muted">{fmtDate(o.created_at)}</p></td><td>{o.customer_name}</td><td>{money(o.total)}</td><td><Badge value={o.status} /></td></tr>)}</tbody></table></div>
              )}
            </Card>
            <div className="space-y-4">
              <Card><h2 className="mb-3 text-2xl">Best sellers</h2>
                {d.best.length === 0 ? <Empty>Sales data will show here.</Empty> : <ul className="divide-y divide-ivory/10 text-sm">{d.best.map((b) => <li key={b.name} className="flex justify-between gap-3 py-2"><span className="min-w-0 truncate">{b.name}</span><span className="shrink-0 text-muted">{b.qty} sold</span></li>)}</ul>}</Card>
              <Card><h2 className="mb-3 text-2xl">Low stock</h2>
                {d.low_stock.length === 0 ? <Empty>All products are well stocked.</Empty> : <ul className="divide-y divide-ivory/10 text-sm">{d.low_stock.map((p) => <li key={p.id} className="flex justify-between gap-3 py-2"><Link to={`/admin/products/${p.id}`} className="min-w-0 truncate hover:text-bronze">{p.name}</Link><span className={p.stock === 0 ? "text-red-400" : "text-amber-300"}>{p.stock === 0 ? "Out" : `${p.stock} left`}</span></li>)}</ul>}</Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
