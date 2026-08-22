import React, { useEffect, useRef } from "react";
import { heroPoster } from "./heroPoster";

/**
 * The Landing hero's full-bleed environment.
 *
 * The video is the primary visual identity layer: it fills the hero and runs
 * behind the glass top bar. Decorative and aria-hidden throughout — remove this
 * component and the hero still reads.
 *
 * Poster-first by construction. The poster is the FINAL revealed frame, not the
 * first: the clip opens near-black, so a first-frame poster would make the hero
 * render dark and then light up, which inverts the whole point. The video is
 * attached afterwards, only when the client can afford it, and every gate below
 * falls back to the poster rather than to an empty box.
 *
 * It plays ONCE and holds. Nothing here loops, which is what keeps WCAG 2.2.2
 * out of scope and why the Landing carries no pause control.
 */
export default function HeroMotion({ videoSrc }: { videoSrc?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;

    const mq = window.matchMedia;
    const reduce = mq?.("(prefers-reduced-motion: reduce)").matches;
    const narrow = mq?.("(max-width: 767px)").matches;
    const conn =
      (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection ?? {};
    const saveData = conn.saveData === true;
    const slow = /(^|-)2g$/.test(conn.effectiveType ?? "");
    if (reduce || narrow || saveData || slow) return;

    let cancelled = false;
    const attach = () => {
      if (cancelled) return;
      // A missing derivative must never surface as a broken page.
      v.addEventListener("error", () => v.removeAttribute("src"), { once: true });
      v.addEventListener("playing", () => v.classList.add("is-ready"), { once: true });
      v.loop = false; // a reveal, not a loop — it holds its final frame
      v.src = videoSrc;
      v.play()?.catch(() => {
        /* autoplay refused: the poster layer stands on its own */
      });
    };

    const idle = (fn: () => void) =>
      "requestIdleCallback" in window
        ? (window as unknown as { requestIdleCallback: (f: () => void, o?: object) => void }).requestIdleCallback(fn, {
            timeout: 2500,
          })
        : window.setTimeout(fn, 1200);
    idle(attach);
    return () => {
      cancelled = true;
    };
  }, [videoSrc]);

  return (
    <>
      <div className="atrium__g0" aria-hidden="true">
        <div className="atrium__poster" style={{ backgroundImage: `url(${heroPoster})` }} />
        {videoSrc ? <video className="atrium__video" ref={videoRef} muted playsInline preload="none" /> : null}
      </div>
      <div className="atrium__scrim" aria-hidden="true" />
    </>
  );
}
