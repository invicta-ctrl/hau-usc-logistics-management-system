import { combinedLockup, dolLogo, uscLogo } from "../../../ProductionAssets";

export function UscMark({ size = 46 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img src={uscLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
      <img src={dolLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
