
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Img from "../components/Img.jsx";
import { Totals } from "./Cart.jsx";
import { EmptyState } from "../components/States.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { placeOrder } from "../services/store.js";
import { mainImage, newId } from "../utils/format.js";

const validate = (v) => {
  const e = {};

  if (v.name.trim().length < 2) {
    e.name = "Enter your full name.";
  }

  if (!/^[+]?[0-9\s-]{9,16}$/.test(v.phone.trim())) {
    e.phone = "Enter a valid phone number.";
  }

  if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) {
    e.email = "Enter a valid email address.";
  }

  if (v.address.trim().length < 6) {
    e.address = "Enter your full delivery address.";
  }

  if (v.city.trim().length < 2) {
    e.city = "Enter your city.";
  }

  return e;
};

// Moved outside Checkout so the component identity stays stable.
function F({
  k,
  label,
  type = "text",
  req,
  area,
  auto,
  v,
  set,
  errors,
}) {
  return (
    <div className={area ? "sm:col-span-2" : ""}>
      <label htmlFor={k} className="mb-1 block text-sm">
        {label}
        {req && <span className="text-bronze"> *</span>}
      </label>

      {area ? (
        <textarea
          id={k}
          rows={3}
          value={v[k]}
          onChange={set(k)}
          aria-invalid={!!errors[k]}
          aria-describedby={errors[k] ? `${k}-err` : undefined}
          className="field py-3"
        />
      ) : (
        <input
          id={k}
          type={type}
          autoComplete={auto}
          value={v[k]}
          onChange={set(k)}
          aria-invalid={!!errors[k]}
          aria-describedby={errors[k] ? `${k}-err` : undefined}
          className="field"
        />
      )}

      {errors[k] && (
        <p id={`${k}-err`} className="mt-1 text-sm text-red-400">
          {errors[k]}
        </p>
      )}
    </div>
  );
}

export default function Checkout() {
  const { items, lines, subtotal, clear, loading } = useCart();
  const { money } = useSettings();
  const nav = useNavigate();

  const key = useRef(newId());

  const [v, setV] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postal_code: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => {
    const value = e.target.value;

    setV((prev) => ({
      ...prev,
      [k]: value,
    }));
  };

  if (!items.length) {
    return (
      <div className="wrap py-16">
        <EmptyState
          title="Nothing to check out"
          text="Your cart is empty."
          to="/shop"
          cta="Continue shopping"
        />
      </div>
    );
  }

  if (loading && !lines.length) {
    return (
      <div className="wrap py-16 text-muted">
        Checking stock…
      </div>
    );
  }

  const blocked = lines.some((l) => l.soldOut);

  const submit = async (e) => {
    e.preventDefault();

    const errs = validate(v);
    setErrors(errs);

    if (Object.keys(errs).length || blocked || busy) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await placeOrder({
        items: lines.map((l) => ({
          id: l.product.id,
          qty: l.qty,
        })),
        customer: v,
        key: key.current,
      });

      clear();

      nav(`/order/${res.order_number}`, {
        replace: true,
        state: { total: res.total },
      });
    } catch (err) {
      setError(
        err.message ||
          "The order could not be placed. Nothing was charged."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap py-10 sm:py-14">
      <h1 className="mb-8 text-4xl sm:text-6xl">
        Checkout
      </h1>

      <form
        onSubmit={submit}
        noValidate
        className="grid gap-10 lg:grid-cols-[1fr_380px]"
      >
        <div>
          <h2 className="mb-4 text-2xl">
            Delivery details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <F k="name" label="Full name" req auto="name" v={v} set={set} errors={errors} />

            <F k="phone" label="Phone" type="tel" req auto="tel" v={v} set={set} errors={errors} />

            <F k="email" label="Email (optional)" type="email" auto="email" v={v} set={set} errors={errors} />

            <F k="city" label="City" req auto="address-level2" v={v} set={set} errors={errors} />

            <F k="address" label="Delivery address" req area v={v} set={set} errors={errors} />

            <F k="postal_code" label="Postal code" auto="postal-code" v={v} set={set} errors={errors} />

            <F k="notes" label="Order notes" area v={v} set={set} errors={errors} />
          </div>

          <div className="mt-8 border border-ivory/10 bg-card p-4 text-sm">
            <p className="font-medium">
              Payment: Cash on delivery
            </p>
            <p className="mt-1 text-muted">
              Pay the courier when your order arrives. No card details are needed.
            </p>
          </div>
        </div>

        <aside className="h-fit border border-ivory/10 bg-card p-6">
          <h2 className="mb-4 text-2xl">
            Your order
          </h2>

          <ul className="mb-5 space-y-3">
            {lines.map(({ product: p, qty, unit, soldOut }) => (
              <li
                key={p.id}
                className="flex gap-3 text-sm"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden bg-surface">
                  <Img
                    src={mainImage(p)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate">{p.name}</p>
                  <p className="text-muted">
                    {soldOut ? "Sold out" : `Qty ${qty}`}
                  </p>
                </div>

                <p>{money(unit * qty)}</p>
              </li>
            ))}
          </ul>

          <Totals subtotal={subtotal} />

          {blocked && (
            <p className="mt-4 text-sm text-red-400">
              An item is sold out.{" "}
              <Link to="/cart" className="underline">
                Update your cart
              </Link>.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 border border-red-400/40 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || blocked}
            className="btn-primary mt-5 w-full"
          >
            {busy ? "Placing order…" : "Place order"}
          </button>

          <p className="mt-3 text-center text-xs text-muted">
            Prices and stock are re-checked when you place the order.
          </p>
        </aside>
      </form>
    </div>
  );
}
