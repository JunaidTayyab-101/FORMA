import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge, Confirm, Empty, ErrorBox, Loading, Modal, PageHeader, Pager, fmtDate } from "../components/ui.jsx";
import useLoad from "../hooks/useLoad.js";
import { getOrderItems, listOrders, saveOrderNotes, setOrderStatus } from "../services/admin.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const NEXT = { pending: ["confirmed", "cancelled"], confirmed: ["processing", "cancelled"], processing: ["shipped", "cancelled"], shipped: ["delivered", "cancelled"], delivered: [], cancelled: [] };

export function OrderDetail({ order, onClose, onChanged }) {
  const { money } = useSettings();
  const toast = useToast();
  const items = useLoad(() => (order ? getOrderItems(order.id) : Promise.resolve([])), [order?.id]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancel, setCancel] = useState(false);
  useEffect(() => setNotes(order?.internal_notes || ""), [order?.id]); // eslint-disable-line
  if (!order) return null;

  const change = async (s) => {
    setBusy(true);
    try { await setOrderStatus(order.id, s); toast(`Order marked ${s}.`); setCancel(false); onChanged(); }
    catch (e) { toast(e.message); } finally { setBusy(false); }
  };
  const saveNotes = async () => { setBusy(true); try { await saveOrderNotes(order.id, notes.trim()); toast("Notes saved."); onChanged(false); } catch (e) { toast(e.message); } finally { setBusy(false); } };
  const next = NEXT[order.status];

  return (
    <>
      <Modal open title={`Order ${order.order_number}`} onClose={onClose} wide>
        <div className="flex flex-wrap items-center gap-3"><Badge value={order.status} /><span className="text-sm text-muted">{fmtDate(order.created_at)}</span></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 text-sm">
          <div><h3 className="mb-1 text-lg">Customer</h3><p>{order.customer_name}</p><p className="text-muted">{order.phone}</p>{order.email && <p className="text-muted">{order.email}</p>}</div>
          <div><h3 className="mb-1 text-lg">Delivery</h3><p>{order.address}</p><p className="text-muted">{order.city}{order.postal_code ? `, ${order.postal_code}` : ""}</p>{order.notes && <p className="mt-1 text-muted">Customer note: {order.notes}</p>}</div>
        </div>
        <h3 className="mb-2 mt-5 text-lg">Items</h3>
        {items.loading ? <Loading /> : items.error ? <ErrorBox message={items.error} onRetry={items.reload} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-muted"><tr><th className="py-1 font-normal">Product</th><th className="font-normal">Price</th><th className="font-normal">Qty</th><th className="text-right font-normal">Total</th></tr></thead>
            <tbody className="divide-y divide-ivory/10">{items.data.map((i) => <tr key={i.id}><td className="py-2">{i.product_name}{i.sku && <span className="block text-xs text-muted">{i.sku}</span>}</td><td>{money(i.unit_price)}</td><td>{i.quantity}</td><td className="text-right">{money(i.line_total)}</td></tr>)}</tbody></table></div>
        )}
        <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{money(order.shipping)}</dd></div>
          <div className="flex justify-between border-t border-ivory/10 pt-2 text-base"><dt>Total</dt><dd>{money(order.total)}</dd></div>
          <div className="flex justify-between pt-1"><dt className="text-muted">Payment</dt><dd className="uppercase">{order.payment_method} · <span className="normal-case">{order.payment_status}</span></dd></div>
        </dl>
        <div className="mt-5"><label htmlFor="notes" className="mb-1 block text-sm">Internal notes (never shown to the customer)</label>
          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="field py-3" />
          <button onClick={saveNotes} disabled={busy || notes === (order.internal_notes || "")} className="btn-ghost mt-2 !min-h-[40px]">Save notes</button></div>
        <div className="mt-6 border-t border-ivory/10 pt-4">
          <h3 className="mb-2 text-lg">Update status</h3>
          {next.length === 0 ? <p className="text-sm text-muted">This order is {order.status}. No further changes are possible.</p> : (
            <div className="flex flex-wrap gap-2">{next.map((s) => s === "cancelled"
              ? <button key={s} onClick={() => setCancel(true)} disabled={busy} className="btn border border-red-400/50 text-red-300 hover:bg-red-500/10">Cancel order</button>
              : <button key={s} onClick={() => change(s)} disabled={busy} className="btn-primary capitalize">Mark {s}</button>)}</div>
          )}
        </div>
      </Modal>
      <Confirm open={cancel} title="Cancel this order?" text="The ordered quantities will be returned to stock. A cancelled order cannot be reopened." label="Cancel order" busy={busy} onConfirm={() => change("cancelled")} onCancel={() => setCancel(false)} />
    </>
  );
}

export default function Orders() {
  const { money } = useSettings();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ q: sp.get("q") || "", status: "", from: "", to: "", page: 1 });
  const [q, setQ] = useState(sp.get("q") || "");
  const [sel, setSel] = useState(null);
  const { data, loading, error, reload } = useLoad(() => listOrders(f), [f]);
  const set = (p) => setF((x) => ({ ...x, page: 1, ...p }));
  const changed = async (close = true) => { await reload(); if (close) setSel(null); };
  // keep the open order fresh after notes are saved
  const current = sel && data?.orders.find((o) => o.id === sel.id) || sel;

  return (
    <>
      <PageHeader title="Orders" sub="Cash on delivery orders placed on the store." />
      <form onSubmit={(e) => { e.preventDefault(); set({ q }); }} className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
        <input aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, name or phone" className="field" />
        <select aria-label="Status" value={f.status} onChange={(e) => set({ status: e.target.value })} className="field"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
        <input type="date" aria-label="From date" value={f.from} onChange={(e) => set({ from: e.target.value })} className="field" />
        <input type="date" aria-label="To date" value={f.to} onChange={(e) => set({ to: e.target.value })} className="field" />
        <button className="btn-ghost">Search</button>
      </form>
      {loading && !data && <Loading />}{error && <ErrorBox message={error} onRetry={reload} />}
      {data && !data.orders.length && <Empty>No orders match.</Empty>}
      {data && data.orders.length > 0 && (
        <div className="overflow-x-auto border border-ivory/10 bg-card">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-ivory/10 text-muted"><tr><th className="p-3 font-normal">Order</th><th className="font-normal">Customer</th><th className="font-normal">Total</th><th className="font-normal">Status</th><th className="p-3 text-right font-normal"> </th></tr></thead>
            <tbody className="divide-y divide-ivory/10">{data.orders.map((o) => (
              <tr key={o.id}><td className="p-3"><p>{o.order_number}</p><p className="text-xs text-muted">{fmtDate(o.created_at)}</p></td><td>{o.customer_name}<p className="text-xs text-muted">{o.phone}</p></td><td>{money(o.total)}</td><td><Badge value={o.status} /></td>
                <td className="p-3 text-right"><button onClick={() => setSel(o)} className="btn-ghost !min-h-[38px] !px-4">View</button></td></tr>))}</tbody>
          </table>
        </div>
      )}
      {data && <Pager page={f.page} total={data.total} onPage={(page) => setF((x) => ({ ...x, page }))} />}
      {current && <OrderDetail order={current} onClose={() => setSel(null)} onChanged={changed} />}
    </>
  );
}
