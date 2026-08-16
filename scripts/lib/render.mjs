import { COMPANY } from "./content.mjs";

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function layout({ title, description, canonicalUrl, cssPath, bodyHtml, jsonLdList = [] }) {
  const jsonLdScripts = jsonLdList
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="stylesheet" href="${cssPath}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
${jsonLdScripts}
</head>
<body>
<header class="site-header">
  <a class="brand" href="${rel(cssPath, "index.html")}">${escapeHtml(COMPANY.name)}</a>
  <nav>
    <a href="${rel(cssPath, "index.html")}">トップ</a>
    <a href="${rel(cssPath, "articles/index.html")}">コラム一覧</a>
  </nav>
</header>
<main>
${bodyHtml}
</main>
<footer class="site-footer">
  <p>${escapeHtml(COMPANY.disclaimer)}</p>
  <p>&copy; ${new Date().getFullYear()} ${escapeHtml(COMPANY.name)}</p>
</footer>
</body>
</html>
`;
}

// cssPath (例: "assets/style.css" or "../assets/style.css") からの相対階層をもとに、
// 同じ階層基準でリンクを組み立てる。
function rel(cssPath, target) {
  const depth = cssPath.split("../").length - 1;
  return "../".repeat(depth) + target;
}
