"server-only";

export interface ScrapedMetadata {
  title: string;
  description: string;
  image: string;
}

function isSafeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0"
    ) {
      return false;
    }

    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const [, octet1, octet2, octet3, octet4] = match.map(Number);
      if (
        octet1 === 10 ||
        (octet1 === 172 && octet2 >= 16 && octet2 <= 31) ||
        (octet1 === 192 && octet2 === 168) ||
        (octet1 === 169 && octet2 === 254) ||
        octet1 === 127 ||
        octet1 === 0
      ) {
        return false;
      }
    }

    if (
      hostname.startsWith("[fc") ||
      hostname.startsWith("[fd") ||
      hostname.startsWith("[fe")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function extractMetaContent(html: string, attributeValue: string): string {
  const propertyRegex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${attributeValue}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const contentFirstRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${attributeValue}["']`,
    "i"
  );

  const matchPropertyFirst = html.match(propertyRegex);
  if (matchPropertyFirst) {
    return matchPropertyFirst[1].trim();
  }

  const matchContentFirst = html.match(contentFirstRegex);
  if (matchContentFirst) {
    return matchContentFirst[1].trim();
  }

  return "";
}

export async function scrapeUrlMetadata(
  url: string,
  fallbackTitle: string
): Promise<ScrapedMetadata> {
  const defaultMetadata: ScrapedMetadata = {
    title: fallbackTitle || "Secure Link",
    description:
      "Redirecting safely to destination via Metricon Link Platform.",
    image: "",
  };

  if (!isSafeUrl(url)) {
    return defaultMetadata;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MetriconBot/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return defaultMetadata;

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : defaultMetadata.title;

    const description =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "description") ||
      defaultMetadata.description;

    const image = extractMetaContent(html, "og:image");

    return { title, description, image };
  } catch {
    return defaultMetadata;
  }
}
