import { useCallback, useEffect, useState } from "react";

// Runs an async loader whenever deps change. Returns { data, loading, error, reload }.
export default function useLoad(fn, deps) {
  const [s, setS] = useState({ data: null, loading: true, error: "" });
  const run = useCallback(() => {
    let off = false;
    setS((p) => ({ ...p, loading: true, error: "" }));
    fn().then((data) => !off && setS({ data, loading: false, error: "" })).catch((e) => !off && setS({ data: null, loading: false, error: e.message }));
    return () => { off = true; };
  }, deps); // eslint-disable-line
  useEffect(run, [run]);
  return { ...s, reload: run };
}
