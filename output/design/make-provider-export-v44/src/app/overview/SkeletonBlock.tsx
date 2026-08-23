import { ap } from "../theme/palette";

export function SkeletonBlock({ w = "100%", h, dark = false }: { w?: string; h: number; dark?: boolean }) {
  return (
    <div
      className="command-skeleton"
      style={{ width: w, height: h, background: ap(dark).skel }}
    />
  );
}
