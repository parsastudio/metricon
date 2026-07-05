"server-only";

export interface ScrapedMetadata {
  title: string;
  description: string;
  image: string;
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

    const ogDescMatch =
      html.match(
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
      );
    const description = ogDescMatch
      ? ogDescMatch[1].trim()
      : defaultMetadata.description;

    const ogImgMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );
    const image = ogImgMatch ? ogImgMatch[1].trim() : "";

    return { title, description, image };
  } catch {
    return defaultMetadata;
  }
}
