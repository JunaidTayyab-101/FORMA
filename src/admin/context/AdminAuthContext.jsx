import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase.js";
import { checkIsAdmin } from "../services/admin.js";

const Ctx = createContext(null);
export const useAdminAuth = () => useContext(Ctx);

// status: loading | anon | denied | admin. Admin rights are verified by the database (is_admin()), never by browser state.
export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Re-check on first load, sign-in, sign-out and user change, but not on silent token refreshes.
  const authKey = session === undefined ? "init" : session ? session.user.id : "none";
  useEffect(() => {
    if (session === undefined) return;
    if (!session) { setStatus("anon"); return; }
    let off = false;
    setStatus("loading");
    checkIsAdmin().then((v) => !off && setStatus(v ? "admin" : "denied")).catch(() => !off && setStatus("denied"));
    return () => { off = true; };
  }, [authKey]); // eslint-disable-line

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);
  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return <Ctx.Provider value={{ session, status, signIn, signOut }}>{children}</Ctx.Provider>;
}
