export async function collectPageEvidence(url) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Agent-Dih/0.1 website doppelganger" }
    });
    const html = await response.text();
    return extractEvidence({ url, status: response.status, html });
  } catch (error) {
    return {
      url,
      fetched: false,
      error: error.message,
      title: "",
      description: "",
      signals: {}
    };
  }
}

export function extractEvidence({ url, status, html }) {
  const text = stripHtml(html).toLowerCase();
  const title = match(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || match(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);

  return {
    url,
    status,
    fetched: true,
    title: clean(title),
    description: clean(description),
    pricesUsd: extractUsdPrices(text),
    signals: {
      hasPricing: containsAny(text, ["pricing", "price", "$", "free trial"]),
      hasDemo: containsAny(text, ["demo", "preview", "screenshot", "watch", "try it"]),
      hasRefundPolicy: containsAny(text, ["refund", "cancel anytime", "cancellation"]),
      hasDataPolicy: containsAny(text, ["privacy", "data", "security", "gdpr"]),
      hasForcedSales: containsAny(text, ["contact sales", "book a demo", "talk to sales"])
    }
  };
}

function extractUsdPrices(text) {
  const prices = [...text.matchAll(/\$\s?(\d+(?:\.\d{1,2})?)/g)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value));
  return [...new Set(prices)].slice(0, 10);
}

function containsAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function match(value, pattern) {
  return value.match(pattern)?.[1] || "";
}

function clean(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
