import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

export default function AdminLogin() {
  const { signIn, signOut, status } = useAdminAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (status === "admin") nav("/admin", { replace: true }); }, [status, nav]);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await signIn(f.email.trim(), f.password); }
    catch (x) { setErr(x.message === "Invalid login credentials" ? "Incorrect email or password." : x.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <form onSubmit={submit} className="w-full max-w-sm border border-ivory/10 bg-card p-6 sm:p-8">
        <h1 className="text-4xl">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Administrators only.</p>
        <label htmlFor="email" className="mt-6 block text-sm">Email</label>
        <input id="email" type="email" autoComplete="username" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="field mt-1" />
        <label htmlFor="pw" className="mt-4 block text-sm">Password</label>
        <input id="pw" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="field mt-1" />
        {err && <p role="alert" className="mt-4 text-sm text-red-400">{err}</p>}
        {status === "denied" && <p role="alert" className="mt-4 text-sm text-red-400">This account is not an administrator. <button type="button" onClick={signOut} className="underline">Sign out</button></p>}
        <button disabled={busy} className="btn-primary mt-6 w-full">{busy ? "Signing in…" : "Sign in"}</button>
        <Link to="/" className="mt-4 block text-center text-sm text-muted hover:text-bronze">Back to store</Link>
      </form>
    </div>
  );
}
