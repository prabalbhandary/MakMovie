import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaAngleDown,
  FaCompress,
  FaExpand,
  FaExternalLinkAlt,
  FaPause,
  FaPlay,
  FaRedo,
  FaSpinner,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import {
  FaBackwardStep,
  FaForwardStep,
  FaGaugeHigh,
} from "react-icons/fa6";
import { formatTime } from "@/lib/videoSource";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer({
  title = "",
  poster = "",
  sources = [],
  fallbackLink = "",
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hideTimer = useRef(null);
  const pendingSeekRef = useRef(null);

  const [quality, setQuality] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");
  const [forceEmbed, setForceEmbed] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const activeSource = useMemo(() => {
    if (!sources.length) return null;
    const selected = sources.find((s) => s.label === quality);
    return selected || sources[sources.length - 1];
  }, [sources, quality]);

  const qualityLabel = activeSource ? activeSource.label : "";
  const isEmbed =
    Boolean(activeSource) && (activeSource.mode === "embed" || forceEmbed);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setError("Unable to play this video."));
    } else {
      video.pause();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const seekBy = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(
      Math.max(video.currentTime + seconds, 0),
      video.duration,
    );
  }, []);

  const changeVolume = useCallback((val) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Math.min(Math.max(val, 0), 1);
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const changeQuality = useCallback((label) => {
    if (videoRef.current && !isEmbed) {
      pendingSeekRef.current = {
        time: videoRef.current.currentTime || 0,
        wasPlaying: !videoRef.current.paused,
      };
    }
    setBuffering(true);
    setError("");
    setForceEmbed(false);
    setQuality(label);
    setShowQualityMenu(false);
  }, [isEmbed]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const keyHandler = (e) => {
      if (isEmbed) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        seekBy(10);
      } else if (e.key === "ArrowLeft") {
        seekBy(-10);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        changeVolume(videoRef.current ? videoRef.current.volume + 0.1 : 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        changeVolume(videoRef.current ? videoRef.current.volume - 0.1 : 0);
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    const container = containerRef.current;
    container?.addEventListener("keydown", keyHandler);
    return () => {
      container?.removeEventListener("keydown", keyHandler);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [togglePlay, seekBy, changeVolume, toggleFullscreen, isEmbed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !pendingSeekRef.current) return;
    const handleReady = () => {
      video.currentTime = pendingSeekRef.current.time;
      if (pendingSeekRef.current.wasPlaying) {
        video.play().catch(() => setError("Unable to play this video."));
      }
      pendingSeekRef.current = null;
    };
    video.addEventListener("loadedmetadata", handleReady);
    return () => video.removeEventListener("loadedmetadata", handleReady);
  }, [quality, activeSource]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const applyRate = (r) => {
    const video = videoRef.current;
    if (video) video.playbackRate = r;
    setRate(r);
    setShowRateMenu(false);
  };

  const reloadEmbed = () => {
    setIframeKey((k) => k + 1);
  };

  if (!sources.length) {
    return (
      <div className="mkplayer mkplayer__empty">
        <div>
          <FaGaugeHigh />
          <h3>No Streaming Links Available</h3>
          <p>
            No streamable link is saved for this title yet. Add a direct file
            URL (MP4/WebM/M3U8), a Google Drive link, or a hoster player page to
            watch it online, or use the download links below.
          </p>
          {fallbackLink ? (
            <a href={fallbackLink} target="_blank" rel="noreferrer">
              <FaExternalLinkAlt /> Open External Link
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mkplayer ${fullscreen ? "mkplayer--fullscreen" : ""}`}
      tabIndex={0}
      onMouseMove={!isEmbed ? showControlsTemporarily : undefined}
      onMouseLeave={() => {
        if (!isEmbed && playing) setShowControls(false);
      }}
    >
      {isEmbed ? (
        <>
          <iframe
            key={iframeKey}
            src={activeSource.url}
            className="mkplayer__iframe"
            title={title}
            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="origin"
          />
          <div className="mkplayer__embedbar">
            <div className="mkplayer__embedlabel">
              <span className="mkplayer__embedbadge">Embed</span>
              <span>{qualityLabel} Player</span>
            </div>
            <div className="mkplayer__spacer" />
            {sources.length > 1 ? (
              <div className="mkplayer__settings">
                <button
                  type="button"
                  className={`mkplayer__btn mkplayer__btn--label ${showQualityMenu ? "active" : ""}`}
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                >
                  {qualityLabel} <FaAngleDown />
                </button>
                {showQualityMenu ? (
                  <div className="mkplayer__menu">
                    {sources.map((s) => (
                      <button
                        type="button"
                        key={s.label}
                        className={s.label === qualityLabel ? "active" : ""}
                        onClick={() => changeQuality(s.label)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              className="mkplayer__btn"
              onClick={reloadEmbed}
              aria-label="Reload embed"
              title="Reload"
            >
              <FaRedo />
            </button>
            <a
              className="mkplayer__btn"
              href={activeSource.url}
              target="_blank"
              rel="noreferrer"
              title="Open externally"
            >
              <FaExternalLinkAlt />
            </a>
            <button
              type="button"
              className="mkplayer__btn"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
            >
              {fullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            src={activeSource.url}
            poster={poster || undefined}
            preload="metadata"
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => {
              setBuffering(false);
              setError("");
            }}
            onCanPlay={() => setBuffering(false)}
            onSeeked={() => setBuffering(false)}
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime);
              setBuffering(false);
            }}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setBuffering(false);
            }}
            onProgress={(e) => {
              const v = e.currentTarget;
              if (v.buffered.length > 0) {
                setBuffered(v.buffered.end(v.buffered.length - 1));
              }
            }}
            onVolumeChange={(e) => {
              setVolume(e.currentTarget.volume);
              setMuted(e.currentTarget.muted);
            }}
            onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
            onError={() => {
              setBuffering(false);
              setError(
                "This video could not be loaded as a direct file. It may be a web player page — try the embed view.",
              );
            }}
            onClick={togglePlay}
          />

          {buffering && playing ? (
            <div className="mkplayer__spinner">
              <FaSpinner className="fa_spin" />
            </div>
          ) : null}

          <div
            className={`mkplayer__overlay ${playing ? "mkplayer__overlay--hidden" : ""}`}
            onClick={togglePlay}
          >
            {!playing ? (
              <>
                {!error && (
                  <div className="mkplayer__bigplay">
                    <FaPlay />
                  </div>
                )}
                <div className="mkplayer__title">{title}</div>
              </>
            ) : null}
          </div>

          {error ? (
            <div className="mkplayer__error">
              <div className="mkplayer__errorbox">
                <p>{error}</p>
                <div className="mkplayer__errorbtns">
                  <button type="button" onClick={() => setForceEmbed(true)}>
                    Try Embed View
                  </button>
                  <a
                    href={activeSource.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Externally
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className={`mkplayer__controls ${showControls || !playing ? "" : "mkplayer__controls--hidden"} ${buffering ? "mkplayer__controls--buffering" : ""}`}
          >
            <div className="mkplayer__progress">
              <div
                className="mkplayer__buffered"
                style={{
                  width: duration ? `${(buffered / duration) * 100}%` : "0%",
                }}
              />
              <div
                className="mkplayer__progressfill"
                style={{
                  width: duration
                    ? `${(currentTime / duration) * 100}%`
                    : "0%",
                }}
              />
              <input
                type="range"
                className="mkplayer__seek"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  videoRef.current.currentTime = v;
                  setCurrentTime(v);
                }}
                aria-label="Seek"
              />
            </div>
            <div className="mkplayer__controlbar">
              <button
                type="button"
                className="mkplayer__btn"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <FaPause /> : <FaPlay />}
              </button>
              <button
                type="button"
                className="mkplayer__btn"
                onClick={() => seekBy(-10)}
                aria-label="Back 10 seconds"
              >
                <FaBackwardStep />
              </button>
              <button
                type="button"
                className="mkplayer__btn"
                onClick={() => seekBy(10)}
                aria-label="Forward 10 seconds"
              >
                <FaForwardStep />
              </button>

              <div className="mkplayer__volume">
                <button
                  type="button"
                  className="mkplayer__btn"
                  onClick={() => {
                    const video = videoRef.current;
                    if (!video) return;
                    video.muted = !video.muted;
                    setMuted(video.muted);
                  }}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0 ? (
                    <FaVolumeMute />
                  ) : (
                    <FaVolumeUp />
                  )}
                </button>
                <input
                  type="range"
                  className="mkplayer__volumeslider"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  aria-label="Volume"
                />
              </div>

              <div className="mkplayer__time">
                <span>{formatTime(currentTime)}</span>
                <span className="mkplayer__timesep">/</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="mkplayer__settings">
                <button
                  type="button"
                  className={`mkplayer__btn mkplayer__btn--label ${showRateMenu ? "active" : ""}`}
                  onClick={() => {
                    setShowRateMenu(!showRateMenu);
                    setShowQualityMenu(false);
                  }}
                >
                  {rate.toFixed(2).replace(/\.?0+$/, "")}x
                </button>
                {showRateMenu ? (
                  <div className="mkplayer__menu">
                    {PLAYBACK_RATES.map((r) => (
                      <button
                        type="button"
                        key={r}
                        className={r === rate ? "active" : ""}
                        onClick={() => applyRate(r)}
                      >
                        {r === 1 ? "Normal" : `${r}x`}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {sources.length > 1 ? (
                <div className="mkplayer__settings">
                  <button
                    type="button"
                    className={`mkplayer__btn mkplayer__btn--label ${showQualityMenu ? "active" : ""}`}
                    onClick={() => {
                      setShowQualityMenu(!showQualityMenu);
                      setShowRateMenu(false);
                    }}
                  >
                    {qualityLabel} <FaAngleDown />
                  </button>
                  {showQualityMenu ? (
                    <div className="mkplayer__menu">
                      {sources.map((s) => (
                        <button
                          type="button"
                          key={s.label}
                          className={s.label === qualityLabel ? "active" : ""}
                          onClick={() => changeQuality(s.label)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                className="mkplayer__btn"
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
              >
                {fullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}