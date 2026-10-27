export type Card = {
  name: string;
  url: string;
  icon?: string;
  thumbnail?: string;
  description?: string;
};

export type ServicesConfig = {
  title: string;
  cards: Card[];
};

export const DEFAULT_TITLE = "Media Dashboard";

export function parseServices(raw: string): ServicesConfig {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `services.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error('services.json must be a JSON object like { "cards": [...] }');
  }

  const obj = data as Record<string, unknown>;
  const title =
    obj.title === undefined ? DEFAULT_TITLE : obj.title;

  if (typeof title !== "string" || title.trim() === "") {
    throw new Error('services.json: "title" must be a non-empty string');
  }

  if (!Array.isArray(obj.cards)) {
    throw new Error('services.json: "cards" must be an array');
  }

  const cards = obj.cards.map((card, i): Card => {
    if (typeof card !== "object" || card === null || Array.isArray(card)) {
      throw new Error(`services.json: cards[${i}] must be an object`);
    }
    const c = card as Record<string, unknown>;

    if (typeof c.name !== "string" || c.name.trim() === "") {
      throw new Error(`services.json: cards[${i}].name must be a non-empty string`);
    }
    if (typeof c.url !== "string" || c.url.trim() === "") {
      throw new Error(`services.json: cards[${i}].url must be a non-empty string`);
    }

    let parsed: URL;
    try {
      parsed = new URL(c.url);
    } catch {
      throw new Error(`services.json: cards[${i}].url is not a valid URL: ${c.url}`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`services.json: cards[${i}].url must use http or https`);
    }

    if (c.icon !== undefined && typeof c.icon !== "string") {
      throw new Error(`services.json: cards[${i}].icon must be a string`);
    }
    if (c.thumbnail !== undefined && typeof c.thumbnail !== "string") {
      throw new Error(`services.json: cards[${i}].thumbnail must be a string`);
    }
    if (c.description !== undefined && typeof c.description !== "string") {
      throw new Error(`services.json: cards[${i}].description must be a string`);
    }

    const description =
      typeof c.description === "string" && c.description.trim() !== ""
        ? c.description.trim()
        : undefined;

    return {
      name: c.name.trim(),
      url: c.url,
      icon: c.icon,
      thumbnail: c.thumbnail,
      description,
    };
  });

  return { title: title.trim(), cards };
}
