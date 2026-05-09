import sanitizeHtml from 'sanitize-html';

/**
 * Google Docs HTML export is verbose: inline <style>, class-based styling,
 * span-wrapped paragraphs, and CSS colors tied to the doc's theme. We strip
 * that down to semantic HTML we can style with our own reader typography.
 */
export function cleanDriveHtml(html: string): string {
  // Drive wraps content in <html><head>...<style>...</style></head><body>...</body></html>
  // sanitize-html will drop <style>, <script>, <head>, etc. by default.
  const cleaned = sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'a', 'em', 'strong', 'b', 'i', 'u', 's', 'sup', 'sub',
      'ul', 'ol', 'li',
      'blockquote',
      'code', 'pre',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': [],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    transformTags: {
      // Drive's anchor hrefs route through its redirector. Unwrap them.
      a: (tagName, attribs) => {
        const href = attribs.href ?? '';
        const googleRedirect = href.match(/^https?:\/\/www\.google\.com\/url\?q=([^&]+)/);
        const clean = googleRedirect ? decodeURIComponent(googleRedirect[1]) : href;
        const external = /^https?:\/\//.test(clean);
        return {
          tagName: 'a',
          attribs: {
            href: clean,
            ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          },
        };
      },
      img: (_tagName, attribs) => ({
        tagName: 'img',
        attribs: {
          src: attribs.src ?? '',
          alt: attribs.alt ?? '',
          loading: 'lazy',
          decoding: 'async',
        },
      }),
    },
    // Drive sometimes wraps paragraphs in <span> with styles. Keeping span but
    // we strip attributes so it's inert. Running a post-pass to unwrap empty spans:
    exclusiveFilter: (frame) =>
      frame.tag === 'span' && !frame.text.trim() && !frame.mediaChildren.length,
  });

  // Unwrap spans that contribute nothing semantic.
  return cleaned.replace(/<span>([\s\S]*?)<\/span>/g, '$1');
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse a YAML-style frontmatter block from the top of a cleaned doc body.
 * Format expected (each line is its own paragraph in the doc):
 *   ---
 *   key: value
 *   key: value
 *   ---
 */
const FM_FENCE = /<p>\s*(?:&nbsp;\s*)*-{3,}\s*(?:&nbsp;\s*)*<\/p>/;
const FM_LEAD = new RegExp('^\\s*(?:<p>(?:\\s|&nbsp;)*<\\/p>\\s*)*' + FM_FENCE.source);

export function parseFrontmatter(html: string): { meta: Record<string, string>; body: string } {
  const open = html.match(FM_LEAD);
  if (!open) return { meta: {}, body: html };
  const after = html.slice(open[0].length);
  const close = after.match(FM_FENCE);
  if (!close || close.index === undefined) return { meta: {}, body: html };

  const block = after.slice(0, close.index);
  const body = after.slice(close.index + close[0].length).replace(/^\s*(?:<p>(?:\s|&nbsp;)*<\/p>\s*)*/, '');

  const meta: Record<string, string> = {};
  for (const para of block.split(/<\/p>\s*<p>/)) {
    const line = htmlToText(para.replace(/^<p>|<\/p>$/g, ''));
    if (!line) continue;
    const kv = line.match(/^([a-z][a-z0-9_-]*)\s*:\s*(.+)$/i);
    if (kv) meta[kv[1].toLowerCase()] = kv[2].trim();
  }
  return { meta, body };
}

/** Very rough word-count for reading time, post-sanitize. */
export function wordCount(html: string): number {
  const text = htmlToText(html);
  if (!text) return 0;
  return text.split(' ').length;
}

/** Extract the first ~200 chars of body text for an excerpt. */
export function extractExcerpt(html: string, max = 200): string {
  const text = htmlToText(html);
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
}
