// content/articles.json をもとに public/ 配下へ静的サイトを書き出す。
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { COMPANY } from "./lib/content.mjs";
import { layout, escapeHtml } from "./lib/render.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const ARTICLES_OUT_DIR = path.join(PUBLIC_DIR, "articles");

const articles = JSON.parse(readFileSync(path.join(ROOT, "content", "articles.json"), "utf8"));
const sortedArticles = [...articles].sort((a, b) => (a.slug < b.slug ? 1 : -1));

const SITE_URL = COMPANY.siteUrl.endsWith("/") ? COMPANY.siteUrl : COMPANY.siteUrl + "/";

mkdirSync(ARTICLES_OUT_DIR, { recursive: true });
mkdirSync(path.join(PUBLIC_DIR, "assets"), { recursive: true });
cpSync(path.join(ROOT, "assets", "style.css"), path.join(PUBLIC_DIR, "assets", "style.css"));

// --- 個別記事ページ ---
for (const a of sortedArticles) {
  const sectionsHtml = a.sections
    .map(
      (s) => `<section>
  <h2>${escapeHtml(s.heading)}</h2>
  ${s.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n  ")}
</section>`
    )
    .join("\n");

  const faqHtml = a.faq.length
    ? `<section class="faq">
  <h2>よくあるご質問</h2>
  ${a.faq
    .map(
      (f) => `<div class="faq-item">
    <p class="faq-q">Q. ${escapeHtml(f.q)}</p>
    <p class="faq-a">A. ${escapeHtml(f.a)}</p>
  </div>`
    )
    .join("\n  ")}
</section>`
    : "";

  const bodyHtml = `<article>
  <p class="breadcrumb"><a href="../index.html">トップ</a> &gt; <a href="index.html">コラム一覧</a> &gt; ${escapeHtml(a.city)}${escapeHtml(a.industry)}</p>
  <h1>${escapeHtml(a.title)}</h1>
  <p class="published-date">公開日: ${a.publishedDate}</p>
  <p class="lead">${escapeHtml(a.lead)}</p>
  ${sectionsHtml}
  ${faqHtml}
  <section class="cta">
    <h2>ストレスチェックの実施者代行(外部委託)に関するご相談</h2>
    <p>${escapeHtml(COMPANY.name)}では、島根県内の事業所様に向けて健康経営支援サービスをご提供しています。実施体制や導入方法についてのご相談は、下記よりお問い合わせください。</p>
    <p><a class="cta-button" href="${COMPANY.contactUrl}">お問い合わせはこちら</a></p>
  </section>
</article>`;

  const canonicalUrl = `${SITE_URL}articles/${a.slug}.html`;

  const jsonLdList = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: a.metaDescription,
      datePublished: a.publishedDate,
      author: { "@type": "Organization", name: COMPANY.name },
      publisher: { "@type": "Organization", name: COMPANY.name },
      mainEntityOfPage: canonicalUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "トップ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "コラム一覧", item: `${SITE_URL}articles/index.html` },
        { "@type": "ListItem", position: 3, name: a.title, item: canonicalUrl },
      ],
    },
  ];
  if (a.faq.length) {
    jsonLdList.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: a.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  const html = layout({
    title: a.title,
    description: a.metaDescription,
    canonicalUrl,
    cssPath: "../assets/style.css",
    bodyHtml,
    jsonLdList,
  });

  writeFileSync(path.join(ARTICLES_OUT_DIR, `${a.slug}.html`), html, "utf8");
}

// --- コラム一覧ページ ---
const listItemsHtml = sortedArticles
  .map(
    (a) => `<li class="article-card">
  <a href="${a.slug}.html">
    <span class="article-date">${a.publishedDate}</span>
    <span class="article-title">${escapeHtml(a.title)}</span>
    <span class="article-excerpt">${escapeHtml(a.metaDescription)}</span>
  </a>
</li>`
  )
  .join("\n");

const listHtml = layout({
  title: `コラム一覧 | ${COMPANY.name}`,
  description: `${COMPANY.name}が発信する、ストレスチェックの実施者代行(外部委託)や健康経営支援に関するコラム一覧です。`,
  canonicalUrl: `${SITE_URL}articles/index.html`,
  cssPath: "../assets/style.css",
  bodyHtml: `<h1>コラム一覧</h1>\n<ul class="article-list">\n${listItemsHtml}\n</ul>`,
});
writeFileSync(path.join(ARTICLES_OUT_DIR, "index.html"), listHtml, "utf8");

// --- トップページ ---
const latest = sortedArticles.slice(0, 6);
const latestHtml = latest
  .map(
    (a) => `<li class="article-card">
  <a href="articles/${a.slug}.html">
    <span class="article-date">${a.publishedDate}</span>
    <span class="article-title">${escapeHtml(a.title)}</span>
  </a>
</li>`
  )
  .join("\n");

const servicesHtml = COMPANY.servicesSummary
  .map((s) => `<li>${escapeHtml(s)}</li>`)
  .join("\n");

const homeBody = `<section class="hero">
  <h1>${escapeHtml(COMPANY.name)}の健康経営支援</h1>
  <p>${escapeHtml(COMPANY.positioning)}</p>
</section>
<section class="services">
  <h2>サービス内容</h2>
  <ul>${servicesHtml}</ul>
</section>
<section class="latest-articles">
  <h2>新着コラム</h2>
  <ul class="article-list">
${latestHtml || "<li>準備中です。</li>"}
  </ul>
  <p><a href="articles/index.html">コラム一覧をすべて見る</a></p>
</section>
<section class="cta">
  <h2>お問い合わせ</h2>
  <p>ストレスチェックの実施者代行(外部委託)、健康経営支援の体制づくりについて、お気軽にご相談ください。</p>
  <p><a class="cta-button" href="${COMPANY.contactUrl}">お問い合わせはこちら</a></p>
</section>`;

const homeJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    url: COMPANY.websiteUrl,
    areaServed: COMPANY.areaServed,
    description: COMPANY.positioning,
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "健康経営支援・ストレスチェック実施者代行(外部委託)",
    provider: { "@type": "Organization", name: COMPANY.name },
    areaServed: COMPANY.areaServed,
  },
];

const homeHtml = layout({
  title: `${COMPANY.name} | 健康経営支援・ストレスチェック実施者代行(外部委託)`,
  description: COMPANY.positioning,
  canonicalUrl: SITE_URL,
  cssPath: "assets/style.css",
  bodyHtml: homeBody,
  jsonLdList: homeJsonLd,
});
writeFileSync(path.join(PUBLIC_DIR, "index.html"), homeHtml, "utf8");

// --- sitemap.xml ---
const urls = [
  SITE_URL,
  `${SITE_URL}articles/index.html`,
  ...sortedArticles.map((a) => `${SITE_URL}articles/${a.slug}.html`),
];
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), sitemap, "utf8");

// --- robots.txt ---
writeFileSync(
  path.join(PUBLIC_DIR, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`,
  "utf8"
);

// --- feed.xml (RSS 2.0) ---
const rssItems = sortedArticles
  .slice(0, 20)
  .map(
    (a) => `  <item>
    <title>${escapeHtml(a.title)}</title>
    <link>${SITE_URL}articles/${a.slug}.html</link>
    <guid>${SITE_URL}articles/${a.slug}.html</guid>
    <pubDate>${new Date(a.publishedDate).toUTCString()}</pubDate>
    <description>${escapeHtml(a.metaDescription)}</description>
  </item>`
  )
  .join("\n");
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeHtml(COMPANY.name)} コラム</title>
  <link>${SITE_URL}</link>
  <description>${escapeHtml(COMPANY.positioning)}</description>
${rssItems}
</channel>
</rss>
`;
writeFileSync(path.join(PUBLIC_DIR, "feed.xml"), rss, "utf8");

// --- IndexNow キーファイル ---
const indexNowKeyPath = path.join(ROOT, "data", "indexnow-key.txt");
if (existsSync(indexNowKeyPath)) {
  const key = readFileSync(indexNowKeyPath, "utf8").trim();
  writeFileSync(path.join(PUBLIC_DIR, `${key}.txt`), key, "utf8");
}

console.log(`ビルド完了: 記事 ${sortedArticles.length} 件を public/ に出力しました。`);
