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

  /* POST-FI17. This section used to render the same sentence TWICE whenever
   * there was nothing to show — once inside a 220px oxblood figure and again in
   * the adjacent article — so the most common state of the most public surface
   * in the product was a pair of equal-weight cards saying the identical thing.
   * An absence is not two announcements. It now resolves to one quiet panel,
   * and the split layout is kept for the state that has two parts to show. */
  return (
    <section id="current" aria-labelledby="current-heading" className="current" style={{ background: "var(--paper-warm)" }}>
      <div className="current__stage">
        <div className="current__head">
          <p className="current__eyebrow">Current</p>
          <h2 id="current-heading" className="current__heading">What the council is doing now</h2>
        </div>

        <div aria-busy={state === "loading"} aria-live="polite">
          {active ? (
            <div className="current__split">
              <figure className="current__media">
                {state !== "media-error" ? (
                  <img
                    src={active.imageUrl ?? ""}
                    alt={active.altText?.trim() || active.title}
                    onError={() => setState("media-error")}
                  />
                ) : (
                  <p className="current__media-fallback">
                    This announcement image is temporarily unavailable. The published details are beside it.
                  </p>
                )}
              </figure>

              <article className="current__record">
                <p className="current__label">Current announcement</p>
                <h3 className="current__title">{active.title}</h3>
                {active.description ? <p className="current__copy">{active.description}</p> : null}
                {active.destinationUrl && active.callToAction ? (
                  <a className="current__action" href={active.destinationUrl}>{active.callToAction}</a>
                ) : null}
                {items.length > 1 ? (
                  <button
                    type="button"
                    className="current__action"
                    onClick={() => setActiveIndex((index) => (index + 1) % items.length)}
                  >
                    Next announcement · {activeIndex + 1} of {items.length}
                  </button>
                ) : null}
              </article>
            </div>
          ) : (
            <StatusPanel state={state} />
          )}
        </div>
      </div>
    </section>
  );
}

/* One panel, weighted to what it actually has to say. The three unpopulated
 * states are genuinely different — waiting, nothing published, and a failed
 * read — so each keeps its own wording rather than being flattened into a
 * shared "unavailable", and the two that are not errors say plainly that
 * logistics services are unaffected. */
const STATUS_COPY = {
  loading: {
    label: "Loading",
    headline: "Checking for council announcements…",
    detail: null as string | null,
  },
  empty: {
    label: "Nothing published",
    headline: "There are no published announcements right now.",
    detail: "The council posts here when there is something to share. Logistics services stay open either way.",
  },
  "request-error": {
    label: "Unavailable",
    headline: "Announcements could not be loaded.",
    detail: "This affects the notice board only — requests, lending and tracking are unaffected. Please try again shortly.",
  },
} as const;

function StatusPanel({ state }: { state: CurrentState }) {
  const key = state === "loading" || state === "request-error" ? state : "empty";
  const copy = STATUS_COPY[key];

  return (
    <div className="current__status" data-state={key}>
      <p className="current__label">{copy.label}</p>
      <p className="current__status-headline">{copy.headline}</p>
      {copy.detail ? <p className="current__copy">{copy.detail}</p> : null}
    </div>
  );
}
