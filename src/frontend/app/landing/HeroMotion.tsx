import { useEffect, useReducer, useRef, useState } from 'react';
import { heroPoster } from './heroPoster';

export type HeroPlaybackState = Readonly<{
  playing: boolean;
  pausedByUser: boolean;
  playbackBlocked: boolean;
}>;

export type HeroPlaybackEvent = 'PLAYING' | 'PAUSED' | 'REQUEST_PAUSE' | 'REQUEST_PLAY' | 'PLAY_REJECTED';

export const HERO_PLAYBACK_INITIAL: HeroPlaybackState = Object.freeze({
  playing: false,
  pausedByUser: false,
  playbackBlocked: false,
});

/** Keeps the control claim tied to actual media events, never just user intent. */
export function heroPlaybackReducer(state: HeroPlaybackState, event: HeroPlaybackEvent): HeroPlaybackState {
  switch (event) {
    case 'PLAYING':
      return { playing: true, pausedByUser: false, playbackBlocked: false };
    case 'PAUSED':
      return { ...state, playing: false };
    case 'REQUEST_PAUSE':
      return { ...state, playing: false, pausedByUser: true };
    case 'REQUEST_PLAY':
      return { ...state, playing: false, pausedByUser: false };
    case 'PLAY_REJECTED':
      return { ...state, playing: false, playbackBlocked: true };
  }
}

export function heroMotionControlLabel(state: HeroPlaybackState): string {
  if (state.playing) return 'Pause hero motion';
  if (state.playbackBlocked) return 'Retry hero motion';
  if (state.pausedByUser) return 'Resume hero motion';
  return 'Play hero motion';
}

/** Poster-first decorative hero media with an accessible looping-motion control. */
export default function HeroMotion({ videoSrc }: { videoSrc: string | readonly string[] }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [motionRequested, setMotionRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string | undefined>();
  const [playback, dispatchPlayback] = useReducer(heroPlaybackReducer, HERO_PLAYBACK_INITIAL);

  useEffect(() => {
    if (!motionAllowed || !motionRequested) {
      setResolvedVideoSrc(undefined);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    let objectUrl: string | undefined;
    const controller = new AbortController();
    setFailed(false);
    setLoading(true);
    setResolvedVideoSrc(undefined);

    if (typeof videoSrc === 'string') {
      setResolvedVideoSrc(videoSrc);
      setLoading(false);
      return () => controller.abort();
    }

    Promise.all(
      videoSrc.map(async (chunkUrl) => {
        const response = await fetch(chunkUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`Hero media chunk failed with HTTP ${response.status}.`);
        return response.arrayBuffer();
      }),
    )
      .then((chunks) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        setResolvedVideoSrc(objectUrl);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setLoading(false);
        setFailed(true);
        dispatchPlayback('PLAY_REJECTED');
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loadAttempt, motionAllowed, motionRequested, videoSrc]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setMotionAllowed(!query.matches);
      if (query.matches) {
        videoRef.current?.pause();
        setMotionRequested(false);
        setFailed(false);
        dispatchPlayback('PAUSED');
      }
    };
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (
      !video ||
      !resolvedVideoSrc ||
      !motionAllowed ||
      !motionRequested ||
      playback.pausedByUser ||
      playback.playbackBlocked ||
      failed
    ) {
      return;
    }
    const updateVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        void video.play().catch(() => dispatchPlayback('PLAY_REJECTED'));
      }
    };
    document.addEventListener('visibilitychange', updateVisibility);
    void video.play().catch(() => dispatchPlayback('PLAY_REJECTED'));
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, [failed, motionAllowed, motionRequested, playback.pausedByUser, playback.playbackBlocked, resolvedVideoSrc]);

  const toggleMotion = () => {
    const video = videoRef.current;
    if (playback.playing) {
      dispatchPlayback('REQUEST_PAUSE');
      video?.pause();
    } else if (!resolvedVideoSrc || failed) {
      dispatchPlayback('REQUEST_PLAY');
      setFailed(false);
      setLoading(true);
      setMotionRequested(true);
      setLoadAttempt((attempt) => attempt + 1);
    } else {
      dispatchPlayback('REQUEST_PLAY');
      void video?.play().catch(() => dispatchPlayback('PLAY_REJECTED'));
    }
  };

  return (
    <>
      <div className="atrium__g0" aria-hidden="true">
        <div className="atrium__poster" style={{ backgroundImage: `url(${heroPoster})` }} />
        <video
          className={`atrium__video${playback.playing && !failed ? ' is-ready' : ''}`}
          ref={videoRef}
          autoPlay={Boolean(
            motionRequested &&
              resolvedVideoSrc &&
              motionAllowed &&
              !playback.pausedByUser &&
              !playback.playbackBlocked,
          )}
          muted
          loop
          playsInline
          preload={motionRequested ? 'metadata' : 'none'}
          poster={heroPoster}
          src={motionAllowed && motionRequested && !failed ? resolvedVideoSrc : undefined}
          onPlaying={() => dispatchPlayback('PLAYING')}
          onPause={() => dispatchPlayback('PAUSED')}
          onError={() => {
            setFailed(true);
            dispatchPlayback('PLAY_REJECTED');
          }}
        />
      </div>
      <div className="atrium__scrim" aria-hidden="true" />
      {motionAllowed ? (
        <button
          type="button"
          className="atrium__motion-toggle"
          onClick={toggleMotion}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Loading hero motion' : heroMotionControlLabel(playback)}
        </button>
      ) : null}
    </>
  );
}
