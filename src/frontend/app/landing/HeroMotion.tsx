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
export default function HeroMotion({ videoSrc }: { videoSrc: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playback, dispatchPlayback] = useReducer(heroPlaybackReducer, HERO_PLAYBACK_INITIAL);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    videoRef.current?.setAttribute('fetchpriority', 'high');
    const sync = () => {
      setMotionAllowed(!query.matches);
      if (query.matches) {
        videoRef.current?.pause();
        dispatchPlayback('PAUSED');
      }
    };
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !motionAllowed || playback.pausedByUser || playback.playbackBlocked || failed) {
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
  }, [failed, motionAllowed, playback.pausedByUser, playback.playbackBlocked]);

  const toggleMotion = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playback.playing) {
      dispatchPlayback('REQUEST_PAUSE');
      video.pause();
    } else {
      dispatchPlayback('REQUEST_PLAY');
      void video.play().catch(() => dispatchPlayback('PLAY_REJECTED'));
    }
  };

  return (
    <>
      <div className="atrium__g0" aria-hidden="true">
        <div className="atrium__poster" style={{ backgroundImage: `url(${heroPoster})` }} />
        <video
          className={`atrium__video${playback.playing && !failed ? ' is-ready' : ''}`}
          ref={videoRef}
          autoPlay={motionAllowed && !playback.pausedByUser && !playback.playbackBlocked}
          muted
          loop
          playsInline
          preload="metadata"
          poster={heroPoster}
          src={motionAllowed && !failed ? videoSrc : undefined}
          onPlaying={() => dispatchPlayback('PLAYING')}
          onPause={() => dispatchPlayback('PAUSED')}
          onError={() => {
            setFailed(true);
            dispatchPlayback('PLAY_REJECTED');
          }}
        />
      </div>
      <div className="atrium__scrim" aria-hidden="true" />
      {motionAllowed && !failed ? (
        <button type="button" className="atrium__motion-toggle" onClick={toggleMotion}>
          {heroMotionControlLabel(playback)}
        </button>
      ) : null}
    </>
  );
}
