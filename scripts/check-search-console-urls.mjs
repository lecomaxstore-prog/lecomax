import fs from 'node:fs/promises';

const urls = JSON.parse((await fs.readFile(process.argv[2], 'utf8')).replace(/^\uFEFF/, ''));
const sitemap = await (await fetch('https://lecomax.com/sitemap.xml')).text();
const results = [];
for (let offset = 0; offset < urls.length; offset += 4) {
  results.push(...await Promise.all(urls.slice(offset, offset + 4).map(async url => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      const html = await response.text();
      const tags = html.match(/<(?:meta|link)\b[^>]*>/gi) ?? [];
      return {
        url, status: response.status, finalUrl: response.url,
        inSitemap: sitemap.includes(`<loc>${url}</loc>`),
        canonical: tags.filter(tag => /rel="canonical"/i.test(tag)),
        robots: tags.filter(tag => /name="(?:robots|googlebot)"/i.test(tag)),
        robotsHeader: response.headers.get('x-robots-tag'),
        title: html.match(/<title>([\s\S]*?)<\/title>/i)?.[1],
        h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '')),
      };
    } catch (error) { return { url, error: error.message }; }
  })));
}
console.log(JSON.stringify(results, null, 2));
if (process.argv[3]) await fs.writeFile(process.argv[3], JSON.stringify(results, null, 2) + '\n');
