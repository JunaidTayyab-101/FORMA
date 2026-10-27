import { useState } from "react";

// Shows the image, or a quiet placeholder if it is missing or fails to load.
export default function Img({ src, alt = "", className = "", ...rest }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div role="img" aria-label={alt} className={`flex items-center justify-center bg-walnut/40 font-display text-2xl text-bronze/70 ${className}`}>F</div>;
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} {...rest} />;
}
