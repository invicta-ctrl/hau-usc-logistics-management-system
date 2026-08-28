import { useState } from "react";

import { combinedLockup, dolLogo, uscLogo } from "../../../ProductionAssets";

function GovernedBrandImage({ src, fallback }: { src: string; fallback: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <span className="brand-mark__fallback">{fallback}</span>;

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

export function UscMark({ size = 46 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <GovernedBrandImage src={uscLogo} fallback="USC" />
    </span>
  );
}

export function DolMark({ size = 42 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <GovernedBrandImage src={dolLogo} fallback="DOL" />
    </span>
  );
}

export function CombinedLockup({ width = 112 }: { width?: number }) {
  return (
    <img
      src={combinedLockup}
      alt="HAU-USC and Department of Logistics"
      style={{ width, height: "auto", display: "block", objectFit: "contain" }}
    />
  );
}
