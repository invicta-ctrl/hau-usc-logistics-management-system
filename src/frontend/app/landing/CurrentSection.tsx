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
    <section id="current" aria-labelledby="current-heading" className="landing-current w-full">
      <div className="max-w-[1520px] mx-auto px-5 md:px-8 py-14">
        <div className="landing-section-heading pb-5 mb-8">
          <h2 id="current-heading">What the council is doing now</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_.9fr] gap-5 items-stretch" aria-busy={state === "loading"}>
          {active ? <>
            <figure className="landing-current__media rounded-[14px] overflow-hidden flex items-center justify-center">
              {state !== "media-error" ? <img src={active.imageUrl ?? ""} alt={active.altText?.trim() || active.title} className="w-full h-auto max-h-[360px] object-contain" onError={() => setState("media-error")} /> : <div className="landing-current__media-state p-8 text-center">{statusCopy["media-error"]}</div>}
            </figure>
            <article className="landing-current__detail rounded-[14px] p-6 flex flex-col justify-center">
              <h3>{active.title}</h3>
              {active.description ? <p className="mt-3">{active.description}</p> : null}
              {active.destinationUrl && active.callToAction ? <a className="landing-current__action mt-5 inline-flex w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href={active.destinationUrl}>{active.callToAction}</a> : null}
              {items.length > 1 ? <button type="button" className="landing-current__action mt-5 w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => setActiveIndex((index) => (index + 1) % items.length)}>Next announcement</button> : null}
            </article>
          </> : <article className="landing-current__state rounded-[14px] p-8 lg:col-span-2" aria-live="polite">
            <h3>{state === "loading" ? "Loading current announcements" : state === "empty" ? "No current announcements" : "Current announcements unavailable"}</h3>
            <p className="mt-2">{statusCopy[state as Exclude<CurrentState, "populated">]}</p>
          </article>}
        </div>
      </div>
    </section>
  );
}
