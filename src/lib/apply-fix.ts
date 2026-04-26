import * as cheerio from "cheerio";

export type FixTarget = "h1" | "intro" | "section" | "add-schema-block" | "append-counter";

const SCHEMA_BLOCK_TITLE = "JSON-LD schema (proposed)";

export function applyFixToHtml(html: string, target: FixTarget, newSpan: string): string {
  const $ = cheerio.load(`<div id="__beacon_root">${html}</div>`, { decodeEntities: false });
  const root = $("#__beacon_root");
  const stripTags = (s: string) => s.replace(/<\/?[^>]+>/g, "").trim();

  switch (target) {
    case "h1": {
      const text = stripTags(newSpan);
      const h1 = root.find("h1").first();
      if (h1.length) h1.text(text);
      else root.prepend(`<h1>${text}</h1>`);
      break;
    }
    case "intro": {
      const p = root.find("p").first();
      const cleaned = newSpan.includes("<p") ? newSpan : `<p>${newSpan}</p>`;
      if (p.length) p.replaceWith(cleaned);
      else root.append(cleaned);
      break;
    }
    case "section": {
      const text = stripTags(newSpan);
      const h2 = root.find("h2").first();
      if (h2.length) h2.text(text);
      else root.append(`<h2>${text}</h2>`);
      break;
    }
    case "add-schema-block": {
      const inner = newSpan.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      const safe = inner.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const existingHeadings = root.find("h3").filter((_i, el) => $(el).text().trim() === SCHEMA_BLOCK_TITLE);
      existingHeadings.each((_i, el) => {
        const $el = $(el);
        const next = $el.next("pre");
        if (next.length) next.remove();
        $el.remove();
      });
      const block = `<h3>${SCHEMA_BLOCK_TITLE}</h3><pre><code>${safe}</code></pre>`;
      root.prepend(block);
      break;
    }
    case "append-counter": {
      // Append a Claude-drafted counter paragraph at the END of the body.
      // Wrap in <p> if the model returned bare text.
      const cleaned = newSpan.includes("<p") || newSpan.includes("<h2") ? newSpan : `<p>${newSpan}</p>`;
      root.append(cleaned);
      break;
    }
  }

  return root.html() ?? html;
}
