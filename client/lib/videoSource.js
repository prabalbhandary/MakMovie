import axios from "axios";

export function toPlayableUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname === "drive.usercontent.google.com") return url;
    let id = null;
    const fileMatch = url.match(/\/file\/d\/([^/?#]+)/);
    if (fileMatch) id = fileMatch[1];
    if (!id) id = u.searchParams.get("id");
    if (!id) {
      const openMatch = url.match(/\/open\?id=([^&]+)/);
      if (openMatch) id = openMatch[1];
    }
    if (!id) return url;
    return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
      id,
    )}&export=download&confirm=t`;
  } catch (e) {
    return url;
  }
}

const MEDIA_EXTS = [
  "mp4",
  "m4v",
  "webm",
  "mkv",
  "m3u8",
  "ogg",
  "ogv",
  "mov",
  "mp3",
  "m4a",
  "aac",
  "flv",
  "ts",
];

export function guessSourceMode(url) {
  if (!url) return "embed";
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (
      /(drive\.google\.com|drive\.usercontent\.google\.com|docs\.google\.com)$/.test(
        host,
      ) ||
      host.includes("googledrive")
    ) {
      return "video";
    }
    const path = u.pathname.toLowerCase();
    if (/\.(html?)$/.test(path)) return "embed";
    const parts = path.split(".");
    if (parts.length > 1 && MEDIA_EXTS.includes(parts[parts.length - 1])) {
      return "video";
    }
    return "embed";
  } catch (e) {
    return "embed";
  }
}

export function getVideoSources(movie) {
  const sources = [];
  const seen = new Set();
  const push = (label, url) => {
    if (!url || !url.trim()) return;
    const playable = toPlayableUrl(url.trim());
    if (seen.has(playable) || seen.has(url.trim())) return;
    seen.add(playable);
    sources.push({
      label,
      url: playable,
      mode: guessSourceMode(playable),
    });
  };

  if (movie?.streamlinks?.length) {
    movie.streamlinks.forEach((s, i) => {
      if (s && s.url) {
        push(s.label || `Stream ${i + 1}`, s.url);
      }
    });
  }
  if (movie?.downloadlink && typeof movie.downloadlink === "object") {
    const order = ["480p", "720p", "1080p", "4k"];
    order.forEach((label) => push(label, movie.downloadlink[label]));
  }
  if (movie?.watchonline) {
    push("HD", movie.watchonline);
  }
  return sources;
}

export async function resolveSources(sources) {
  return Promise.all(
    sources.map(async (source) => {
      if (source.mode === "video") return source;
      try {
        const { data } = await axios.get("/api/resolve", {
          params: { url: source.url },
          timeout: 10000,
        });
        if (data && !data.error && data.mode === "video" && data.url) {
          return {
            label: source.label,
            url: data.url,
            mode: "video",
          };
        }
        return {
          label: source.label,
          url: data && !data.error && data.url ? data.url : source.url,
          mode: "embed",
        };
      } catch (e) {
        return { ...source, mode: "embed" };
      }
    }),
  );
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n) => n.toString().padStart(2, "0");
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
  return `${mins}:${pad(secs)}`;
}