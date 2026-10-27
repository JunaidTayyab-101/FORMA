import { useState } from "react";
import { Badge, Empty, ErrorBox, Loading, Modal, PageHeader, fmtDate } from "../components/ui.jsx";
import { OrderDetail } from "./Orders.jsx";
import useLoad from "../hooks/useLoad.js";
import { listCustomers, ordersByPhone } from "../services/admin.js";
import { useSettings } from "../../context/SettingsContext.jsx";

export default function Customers() {
  const { money } = useSettings();
  const { data, loading, error, reload } = useLoad(listCustomers, []);
  const [q, setQ] = useState("");
  const [cust, setCust] = useState(null);
  const [order, setOrder] = useState(null);
  const hist = useLoad(() => (cust ? ordersByPhone(cust.phone) : Promise.resolve([])), [cust?.phone]);
  const rows = (data || []).filter((c) => `${c.name} ${c.phone} ${c.email || ""} ${c.city || ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Customers" sub="Built from checkout details, grouped by phone number. Only order contact details are shown." />
      <input aria-label="Search customers" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email or city" className="field mb-5 sm:max-w-md" />
      {loading && !data && <Loading />}{error && <ErrorBox message={error} onRetry={reload} />}
      {data && !rows.length && <Empty>{data.length ? "No customers match." : "Customers appear here after their first order."}</Empty>}
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-ivory/10 bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ivory/10 text-muted"><tr><th className="p-3 font-normal">Customer</th><th className="font-normal">City</th><th className="font-normal">Orders</th><th className="font-normal">Spent</th><th className="font-normal">Last order</th><th /></tr></thead>
            <tbody className="divide-y divide-ivory/10">{rows.map((c) => (
              <tr key={c.phone}><td className="p-3">{c.name}<p className="text-xs text-muted">{c.phone}{c.email ? ` · ${c.email}` : ""}</p></td><td className="text-muted">{c.city}</td><td>{c.orders_count}</td><td>{money(c.total_spent)}</td><td className="text-muted">{fmtDate(c.last_order)}</td>
                <td className="p-3 text-right"><button onClick={() => setCust(c)} className="btn-ghost !min-h-[38px] !px-4">Orders</button></td></tr>))}</tbody>
          </table>
        </div>
      )}
      <Modal open={!!cust && !order} title={cust ? `${cust.name}'s orders` : ""} onClose={() => setCust(null)} wide>
        {hist.loading ? <Loading /> : hist.error ? <ErrorBox message={hist.error} onRetry={hist.reload} /> : (
          <ul className="divide-y divide-ivory/10 text-sm">{(hist.data || []).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p>{o.order_number}</p><p className="text-xs text-muted">{fmtDate(o.created_at)}</p></div>
              <div className="flex items-center gap-3"><span>{money(o.total)}</span><Badge value={o.status} /><button onClick={() => setOrder(o)} className="btn-ghost !min-h-[36px] !px-3">View</button></div></li>))}</ul>
        )}
      </Modal>
      {order && <OrderDetail order={order} onClose={() => setOrder(null)} onChanged={async () => { setOrder(null); hist.reload(); reload(); }} />}
    </>
  );
}
