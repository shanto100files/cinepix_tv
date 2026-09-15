const WATERMARK_PATTERNS = [
  /cinefreak\.top/gi,
  /cinefreak\s*\.?\s*top/gi,
  /www\.cinefreak\.top/gi,
  /cinefreak\.com/gi,
  /cinefreak/gi,
  /vega\b/gi,
  /megakino/gi,
  /solarmovie/gi,
  /fmovies/gi,
  /putlocker/gi,
  /soap2day/gi,
  /myflixer/gi,
  /fbox/gi,
  /binge\.watch/gi,
  /primewire/gi,
  /123movies/gi,
  /gomovies/gi,
  /yesmovies/gi,
  /lookmovie/gi,
  / AZMovie/gi,
  / AZMovies/gi,
  /azmovie/gi,
  /sockshare/gi,
  /watchseries/gi,
  /mycima/gi,
  /cimanow/gi,
];

const REPLACEMENT = "Cinepix.Top";

export function sanitizeSubtitleText(text: string): string {
  let result = text;
  for (const pattern of WATERMARK_PATTERNS) {
    result = result.replace(pattern, REPLACEMENT);
  }
  return result;
}

export function sanitizeSubtitleContent(content: string): string {
  const lines = content.split("\n");
  const isSrt = /^\d+\s*\r?\n\d{2}:\d{2}:\d{2}/.test(content.trim());

  if (isSrt) {
    return lines
      .map((line) => {
        const trimmed = line.trim();
        if (/^\d+$/.test(trimmed)) return line;
        if (/\d{2}:\d{2}:\d{2}/.test(trimmed) && /-->/.test(trimmed)) return line;
        if (trimmed === "") return line;
        return sanitizeSubtitleText(line);
      })
      .join("\n");
  }

  const isVtt = /^WEBVTT/.test(content.trim());
  if (isVtt) {
    return lines
      .map((line) => {
        const trimmed = line.trim();
        if (/^WEBVTT/.test(trimmed)) return line;
        if (/\d{2}:\d{2}:\d{2}/.test(trimmed) && /-->/.test(trimmed)) return line;
        if (trimmed === "") return line;
        if (/^NOTE/.test(trimmed)) return line;
        return sanitizeSubtitleText(line);
      })
      .join("\n");
  }

  return lines.map((line) => sanitizeSubtitleText(line)).join("\n");
}

let modifiedUrlCache = new Map<string, string>();

export async function fetchAndSanitizeSubtitle(url: string): Promise<string> {
  if (modifiedUrlCache.has(url)) {
    return modifiedUrlCache.get(url)!;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return url;

    const original = await response.text();
    const sanitized = sanitizeSubtitleContent(original);

    if (sanitized === original) {
      modifiedUrlCache.set(url, url);
      return url;
    }

    const blob = new Blob([sanitized], { type: "text/plain" });
    const blobUrl = URL.createObjectURL(blob);
    modifiedUrlCache.set(url, blobUrl);
    return blobUrl;
  } catch {
    return url;
  }
}

export function clearSubtitleCache() {
  modifiedUrlCache.forEach((blobUrl) => {
    if (blobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrl);
    }
  });
  modifiedUrlCache.clear();
}
