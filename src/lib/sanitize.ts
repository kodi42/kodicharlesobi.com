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

/** Very rough word-count for reading time, post-sanitize. */
export function wordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(' ').length;
}

/** Extract the first ~200 chars of body text for an excerpt. */
export function extractExcerpt(html: string, max = 200): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
}
