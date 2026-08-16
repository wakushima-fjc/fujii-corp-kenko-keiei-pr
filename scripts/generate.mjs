// 1回の実行で記事を1本生成し、content/articles.json に追記する。
// 外部APIやMath.random()には依存しない完全決定的なロジック。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TOPICS, buildArticleContent } from "./lib/content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STATE_PATH = path.join(ROOT, "data", "state.json");
const ARTICLES_PATH = path.join(ROOT, "content", "articles.json");

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

const state = loadJson(STATE_PATH);
const articles = loadJson(ARTICLES_PATH);

const { cities, industries, angles } = TOPICS;
const totalCombos = cities.length * industries.length * angles.length;

const cursor = state.cursor % totalCombos;
const cityIdx = Math.floor(cursor / (industries.length * angles.length)) % cities.length;
const industryIdx = Math.floor(cursor / angles.length) % industries.length;
const angleIdx = cursor % angles.length;

const city = cities[cityIdx];
const industry = industries[industryIdx];
const angle = angles[angleIdx];

const today = process.env.PUBLISH_DATE || new Date().toISOString().slice(0, 10);

const content = buildArticleContent({
  city: city.name,
  industry: industry.name,
  angleKey: angle.key,
  angleLabel: angle.label,
});

let slug = `${today}-${city.slug}-${industry.slug}-${angle.key}`;
// 同日に複数回実行された場合の衝突を避ける。
let suffix = 1;
const existingSlugs = new Set(articles.map((a) => a.slug));
while (existingSlugs.has(slug)) {
  suffix += 1;
  slug = `${today}-${city.slug}-${industry.slug}-${angle.key}-${suffix}`;
}

const article = {
  slug,
  publishedDate: today,
  city: city.name,
  citySlug: city.slug,
  industry: industry.name,
  industrySlug: industry.slug,
  angleKey: angle.key,
  angleLabel: angle.label,
  title: content.title,
  metaDescription: content.metaDescription,
  lead: content.lead,
  sections: content.sections,
  faq: content.faq,
};

articles.push(article);
state.cursor = cursor + 1;

writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2) + "\n", "utf8");
writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n", "utf8");

console.log(`生成しました: ${slug} (${cursor + 1}/${totalCombos} 巡目)`);
