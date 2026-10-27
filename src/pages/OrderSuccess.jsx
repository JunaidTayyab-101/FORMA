import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useSettings } from "../context/SettingsContext.jsx";

export default function OrderSuccess() {
  const { number } = useParams();
  const { state } = useLocation();
  const { money } = useSettings();
  return (
    <div className="wrap max-w-2xl py-20 text-center">
      <CheckCircle2 size={48} className="mx-auto text-bronze" />
      <h1 className="mt-6 text-4xl sm:text-5xl">Order placed</h1>
      <p className="mt-3 text-muted">Your order number is</p>
      <p className="mt-1 font-display text-3xl text-bronze">{number}</p>
      {state?.total != null && <p className="mt-4 text-sm text-muted">Pay {money(state.total)} in cash when the order is delivered.</p>}
      <p className="mt-2 text-sm text-muted">Please save your order number. We will contact you on the phone number you provided.</p>
      <Link to="/shop" className="btn-primary mt-8">Continue shopping</Link>
    </div>
  );
}
