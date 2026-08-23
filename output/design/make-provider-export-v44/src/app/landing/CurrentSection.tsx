import { currentProductionCover } from "../../../ProductionAssets";

export function CurrentSection() {
  return (
    <section id="current" aria-labelledby="current-heading" className="w-full" style={{ background: "#fffdf8" }}>
      <div className="max-w-[1520px] mx-auto px-5 md:px-8 py-14">
        <div className="pb-5 mb-8" style={{ borderBottom: "1px solid #e6dcc9" }}>
          <p className="text-[10px] tracking-[1px] uppercase mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#7d5518" }}>
            Current
          </p>
          <h2
            id="current-heading"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: "clamp(28px, 4vw, 38px)", color: "#241416", letterSpacing: "-1.064px", lineHeight: "41.04px", fontVariationSettings: '"opsz" 14, "wdth" 100' }}
          >
            What the council is doing now
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_.9fr] gap-5 items-stretch">
          <figure
            className="rounded-[14px] overflow-hidden flex items-center justify-center"
            style={{ background: "#40070a", border: "1px solid #d1b478", minHeight: 220 }}
          >
            <img
              src={currentProductionCover}
              alt="USC Youth Development Day 2026 official cover"
              className="w-full h-auto max-h-[360px] object-contain"
            />
          </figure>
          <article className="rounded-[14px] p-6 flex flex-col justify-center" style={{ background: "#ffffff", border: "1px solid #e6dcc9" }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#7d5518", letterSpacing: ".9px", textTransform: "uppercase" }}>
              Current production snapshot
            </p>
            <h3 className="mt-3" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 22, lineHeight: 1.15, color: "#241416", fontWeight: 700 }}>
              Youth Development Day 2026
            </h3>
            <p className="mt-3" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "#6f5a60", lineHeight: "20px" }}>
              This verified cover is the current public-site fallback. The governed announcement feed is empty, so the prototype does not invent additional event details.
            </p>
            <p className="mt-5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#7d5518", letterSpacing: ".5px" }}>
              Verified 2026-08-14 · local static prototype asset
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
