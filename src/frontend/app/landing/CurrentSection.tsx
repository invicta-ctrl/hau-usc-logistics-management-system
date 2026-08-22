import { useEffect, useState } from "react";
import { frontendBackend } from "../../integration/backend";

type Advertisement = {
  id: string;
  title: string;
  description?: string | null;
  altText?: string | null;
  callToAction?: string | null;
  destinationUrl?: string | null;
  imageUrl?: string | null;
};

type CurrentState = "loading" | "populated" | "empty" | "request-error" | "media-error";

const copyStyle = { fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "#6f5a60", lineHeight: "20px" };
const labelStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#7d5518", letterSpacing: ".9px", textTransform: "uppercase" as const };

export function CurrentSection() {
  const [items, setItems] = useState<Advertisement[]>([]);
  const [state, setState] = useState<CurrentState>("loading");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void frontendBackend.publicAdvertisements(controller.signal)
      .then((payload) => {
        const published = Array.isArray(payload.items) ? (payload.items as Advertisement[]).filter((item) => item?.imageUrl) : [];
        setItems(published);
        setState(published.length ? "populated" : "empty");
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== "AbortError") setState("request-error");
      });
    return () => controller.abort();
  }, []);

  const active = items[activeIndex] ?? null;
  const statusCopy: Record<Exclude<CurrentState, "populated">, string> = {
    loading: "Loading current council announcements…",
    empty: "There are no published announcements right now. Please check back for the next council update.",
    "request-error": "Current announcements are temporarily unavailable. Please try again shortly.",
    "media-error": "This announcement image is temporarily unavailable. You can still read the published announcement details.",
  };

  return (
    <section id="current" aria-labelledby="current-heading" className="w-full" style={{ background: "#fffdf8" }}>
      <div className="max-w-[1520px] mx-auto px-5 md:px-8 py-14">
        <div className="pb-5 mb-8" style={{ borderBottom: "1px solid #e6dcc9" }}>
          <p className="text-[10px] tracking-[1px] uppercase mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#7d5518" }}>Current</p>
          <h2 id="current-heading" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: "clamp(28px, 4vw, 38px)", color: "#241416", letterSpacing: "-1.064px", lineHeight: "41.04px", fontVariationSettings: '"opsz" 14, "wdth" 100' }}>What the council is doing now</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_.9fr] gap-5 items-stretch" aria-busy={state === "loading"}>
          <figure className="rounded-[14px] overflow-hidden flex items-center justify-center" style={{ background: "#40070a", border: "1px solid #d1b478", minHeight: 220 }}>
            {active && state !== "media-error" ? <img src={active.imageUrl ?? ""} alt={active.altText?.trim() || active.title} className="w-full h-auto max-h-[360px] object-contain" onError={() => setState("media-error")} /> : <div className="p-8 text-center" style={{ ...copyStyle, color: "#fffdf8" }}>{statusCopy[state as Exclude<CurrentState, "populated">]}</div>}
          </figure>
          <article className="rounded-[14px] p-6 flex flex-col justify-center" style={{ background: "#ffffff", border: "1px solid #e6dcc9" }}>
            <p style={labelStyle}>{state === "populated" || state === "media-error" ? "Current announcement" : "Current"}</p>
            {active ? <>
              <h3 className="mt-3" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 22, lineHeight: 1.15, color: "#241416", fontWeight: 700 }}>{active.title}</h3>
              {active.description ? <p className="mt-3" style={copyStyle}>{active.description}</p> : null}
              {state === "media-error" ? <p className="mt-3" style={copyStyle}>{statusCopy["media-error"]}</p> : null}
              {active.destinationUrl && active.callToAction ? <a className="mt-5 inline-flex w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ color: "#7d5518", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }} href={active.destinationUrl}>{active.callToAction}</a> : null}
              {items.length > 1 ? <button type="button" className="mt-5 w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ color: "#7d5518", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }} onClick={() => setActiveIndex((index) => (index + 1) % items.length)}>Next announcement</button> : null}
            </> : <p className="mt-3" style={copyStyle}>{statusCopy[state as Exclude<CurrentState, "populated">]}</p>}
          </article>
        </div>
      </div>
    </section>
  );
}
