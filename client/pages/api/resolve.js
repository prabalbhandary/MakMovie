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

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function isMediaResult(url, contentType, status, acceptRanges, ext) {
  return (
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/") ||
    (contentType === "application/octet-stream" &&
      (status === 206 || acceptRanges.includes("bytes"))) ||
    MEDIA_EXTS.includes(ext)
  );
}

function extractEmbed(url) {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let html = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done || html.length > 500000) {
              await reader.cancel().catch(() => {});
              break;
            }
            html += decoder.decode(value, { stream: true });
          }
          const match = html.match(
            /<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i,
          );
          if (match && /^https?:/i.test(match[1])) {
            resolve(match[1]);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      })
      .catch(() => resolve(null))
      .finally(() => clearTimeout(timer));
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const raw = req.query.url;
  if (!raw || typeof raw !== "string") {
    return res.status(400).json({ error: "Missing url" });
  }
  let url;
  try {
    url = new URL(raw);
  } catch (e) {
    return res.status(400).json({ error: "Invalid url" });
  }
  if (!/^https?:$/.test(url.protocol)) {
    return res.status(400).json({ error: "Invalid protocol" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url.toString(), {
      headers: { Range: "bytes=0-1023", "User-Agent": UA },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    const finalUrl = response.url || url.toString();
    const contentType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const acceptRanges = (response.headers.get("accept-ranges") || "").toLowerCase();
    const status = response.status;
    if (response.body) {
      response.body.cancel().catch(() => {});
    }

    let ext = "";
    try {
      ext = new URL(finalUrl).pathname.split(".").pop().toLowerCase();
    } catch (e) {
      // ignore
    }

    if (
      isMediaResult(finalUrl, contentType, status, acceptRanges, ext)
    ) {
      return res.json({
        url: finalUrl,
        contentType,
        status,
        supportsRange: acceptRanges.includes("bytes") || status === 206,
        mode: "video",
      });
    }

    let linkParam = "";
    try {
      linkParam = new URL(finalUrl).searchParams.get("link") || "";
    } catch (e) {
      // ignore
    }
    if (!linkParam) {
      try {
        linkParam = url.searchParams.get("link") || "";
      } catch (e) {
        // ignore
      }
    }

    if (/^https?:/i.test(linkParam)) {
      try {
        const inner = await new Promise((resolvePromise) => {
          const innerController = new AbortController();
          const innerTimer = setTimeout(
            () => innerController.abort(),
            8000,
          );
          fetch(linkParam, {
            headers: { Range: "bytes=0-1023", "User-Agent": UA },
            redirect: "follow",
            signal: innerController.signal,
          })
            .then(async (innerResponse) => {
              const innerUrl = innerResponse.url || linkParam;
              const innerType = (
                innerResponse.headers.get("content-type") || ""
              )
                .split(";")[0]
                .trim()
                .toLowerCase();
              const innerRange = (
                innerResponse.headers.get("accept-ranges") || ""
              ).toLowerCase();
              const innerStatus = innerResponse.status;
              if (innerResponse.body) {
                innerResponse.body.cancel().catch(() => {});
              }
              let innerExt = "";
              try {
                innerExt = new URL(innerUrl)
                  .pathname.split(".")
                  .pop()
                  .toLowerCase();
              } catch (e) {
                // ignore
              }
              resolvePromise({
                url: innerUrl,
                contentType: innerType,
                status: innerStatus,
                supportsRange:
                  innerRange.includes("bytes") || innerStatus === 206,
                mode: isMediaResult(
                  innerUrl,
                  innerType,
                  innerStatus,
                  innerRange,
                  innerExt,
                )
                  ? "video"
                  : "embed",
              });
            })
            .catch((e) =>
              resolvePromise({ error: true, message: e.message }),
            )
            .finally(() => clearTimeout(innerTimer));
        });
        if (!inner.error && inner.mode === "video") {
          return res.json(inner);
        }
      } catch (e) {
        // ignore, fall through to embed handling
      }
    }

    const embedUrl = await extractEmbed(finalUrl);

    return res.json({
      url: embedUrl || finalUrl,
      contentType,
      status,
      supportsRange: acceptRanges.includes("bytes") || status === 206,
      mode: "embed",
      embedSource: Boolean(embedUrl),
      note: embedUrl
        ? "extracted embedded player"
        : "page has no playable inline player",
    });
  } catch (e) {
    clearTimeout(timer);
    return res.json({ error: true, message: e.message || "resolve failed" });
  }
}