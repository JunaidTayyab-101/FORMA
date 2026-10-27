import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";

const DRAFT = "Draft text. The store owner must review and replace this with their real policy before launch.";
const PAGES = {
  about: { title: "About us", body: ["Tell your story here: who makes the furniture, where it comes from and what you stand for.", "You can edit this text from the admin panel once it is built."] },
  "interior-design": { title: "Interior design", body: ["Our interior design service plans a room around how you live: layout, proportion, materials and lighting.", "Contact us with your room dimensions and a few photos, and we will suggest a direction."], cta: true },
  "shipping-policy": { title: "Shipping policy", body: [DRAFT, "Delivery areas, timelines and charges are shown at checkout. Orders are paid in cash on delivery."] },
  "returns-policy": { title: "Returns and refunds", body: [DRAFT, "State your return window, item condition rules and refund method here."] },
  "privacy-policy": { title: "Privacy policy", body: [DRAFT, "Explain what customer data you collect (name, phone, address, email) and why."] },
  terms: { title: "Terms and conditions", body: [DRAFT] },
};
const FAQ = [
  ["How do I pay?", "Orders are paid in cash on delivery. No card details are collected on this site."],
  ["How long does delivery take?", "Delivery timelines depend on your city and the product. The owner should add exact timelines here."],
  ["Can I return an item?", "See our returns and refunds page for the current policy."],
  ["How do I track my order?", "Keep your order number. Contact us with it for an update."],
];

export default function StaticPage({ slug }) {
  const { settings: s } = useSettings();
  if (slug === "faq") return (
    <div className="wrap max-w-3xl py-14"><h1 className="text-4xl sm:text-6xl">FAQ</h1>
      <div className="mt-8 divide-y divide-ivory/10 border-y border-ivory/10">{FAQ.map(([q, a]) => <details key={q} className="group py-4"><summary className="cursor-pointer list-none font-display text-xl sm:text-2xl">{q}</summary><p className="mt-2 text-muted">{a}</p></details>)}</div></div>
  );
  if (slug === "contact") return (
    <div className="wrap max-w-3xl py-14"><h1 className="text-4xl sm:text-6xl">Contact us</h1>
      <dl className="mt-8 space-y-5">
        <div><dt className="text-sm text-muted">Email</dt><dd className="text-lg">{s.contact_email ? <a href={`mailto:${s.contact_email}`} className="text-bronze">{s.contact_email}</a> : "To be added by the owner"}</dd></div>
        <div><dt className="text-sm text-muted">Phone</dt><dd className="text-lg">{s.contact_phone || "To be added by the owner"}</dd></div>
        <div><dt className="text-sm text-muted">Address</dt><dd className="text-lg">{s.address || "To be added by the owner"}</dd></div>
      </dl></div>
  );
  const pg = PAGES[slug];
  return (
    <div className="wrap max-w-3xl py-14"><h1 className="text-4xl sm:text-6xl">{pg.title}</h1>
      <div className="mt-8 space-y-4 leading-relaxed text-muted">{pg.body.map((t, i) => <p key={i}>{t}</p>)}</div>
      {pg.cta && <Link to="/contact" className="btn-primary mt-8">Get in touch</Link>}
    </div>
  );
}
