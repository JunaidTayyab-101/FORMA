import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState("");
  const timer = useRef();
  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
        {msg && <div className="rise border border-bronze/40 bg-card px-5 py-3 text-sm shadow-xl">{msg}</div>}
      </div>
    </ToastCtx.Provider>
  );
}
