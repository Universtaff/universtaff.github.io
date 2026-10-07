// lam-web-uni.mjs — dựng trang /universtar/ (mỗi video 1 trang + trang loạt) từ kênh YouTube Universtar Studio.
// Chạy tay: node lam-web-uni.mjs  → ghi ./universtar/ (không đụng index.html, privacy.html). Sau đó commit + push.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
const D = import.meta.dirname, GOC = "https://universtaff.github.io/universtar", OUT = join(D, "universtar");
const doc = (p) => JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
const kh = doc("D:/01 - Công việc/04 - Universtar/01 - UniMarket/video-aff/_cong-cu/_oauth-yt.json"); const c = kh.installed ?? kh.web;
const ph = doc("D:/01 - Công việc/01 - Dự án độc lập/05 - Phật Pháp Tăng/_phieu-yta-uni.json");
const t = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: c.client_id, client_secret: c.client_secret, refresh_token: ph.refresh_token, grant_type: "refresh_token" }) })).json();
const g = async (u) => { const r = await fetch("https://www.googleapis.com/youtube/v3/" + u, { headers: { Authorization: "Bearer " + t.access_token } }); const j = await r.json(); if (!r.ok) throw new Error(r.status + j.error?.message); return j; };
const phan = async (duong, p) => { const out = []; let tk = ""; do { const j = await g(`${duong}?${p}&maxResults=50${tk ? "&pageToken=" + tk : ""}`); out.push(...j.items); tk = j.nextPageToken; } while (tk); return out; };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const kenh = (await g("channels?part=contentDetails&mine=true")).items[0];
const ups = await phan("playlistItems", `part=contentDetails&playlistId=${kenh.contentDetails.relatedPlaylists.uploads}`);
const ids = ups.map((i) => i.contentDetails.videoId); const vd = new Map();
for (let i = 0; i < ids.length; i += 50) (await g(`videos?part=snippet,status,contentDetails&id=${ids.slice(i, i + 50).join(",")}`)).items.forEach((v) => vd.set(v.id, v));
const pub = (id) => vd.get(id)?.status.privacyStatus === "public";
const LOAT_BO = /live stream|ba cái|tôi đi chơi|bản tổng hợp/i;   // loạt rỗng/tạp
const loat = [];
for (const p of await phan("playlists", "part=snippet&mine=true")) {
  if (LOAT_BO.test(p.snippet.title)) continue;
  const ds = (await phan("playlistItems", `part=contentDetails&playlistId=${p.id}`)).map((i) => i.contentDetails.videoId).filter(pub);
  if (ds.length >= 2) loat.push({ id: p.id, ten: p.snippet.title, ds, slug: "loat-" + p.id.slice(2, 8).toLowerCase().replace(/[^a-z0-9]/g, "x") });
}
const thuoc = new Map(); loat.forEach((l) => l.ds.forEach((v) => !thuoc.has(v) && thuoc.set(v, l)));
const tieuDe = (v) => v.snippet.title.replace(/\s*#\S+/g, "").trim();
const moTa = (v) => { const d = v.snippet.description.split("\n").map((s) => s.trim()); const i = d.findIndex((s) => s && !/^(▸|#|https?:)/.test(s)); return (d[i] ?? "").replace(/\s*Lời đọc bằng giọng máy\.?/, "").slice(0, 300); };
const LINK = { yt: "https://www.youtube.com/@Universtar-UC99", fb: "https://www.facebook.com/profile.php?id=61571533358562", tt: "https://www.tiktok.com/@unigdshop" };

const CSS = `:root{--nen:#f7f7fb;--chu:#1d1b2e;--nhat:#5b5875;--nhan:#5b3fd1;--vien:#dcdaea;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--nen:#121020;--chu:#ecebf5;--nhat:#a9a6c4;--nhan:#a996ff;--vien:#2d2a45;color-scheme:dark}}
body{margin:0;background:var(--nen);color:var(--chu);font:17px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.k{max-width:760px;margin:0 auto;padding:0 16px}header{border-bottom:1px solid var(--vien);padding:14px 0}header a{font-weight:700;text-decoration:none;color:var(--chu)}
h1{font-size:26px;line-height:1.3;margin:24px 0 8px}h2{font-size:19px;margin:28px 0 8px}a{color:var(--nhan)}.n{color:var(--nhat);font-size:15px}
.v{position:relative;aspect-ratio:16/9;margin:16px 0;background:#000}.v.d{aspect-ratio:9/16;max-width:360px}.v iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
ul.ds{padding-left:20px}ul.ds li{margin:4px 0}footer{border-top:1px solid var(--vien);margin-top:40px;padding:20px 0;color:var(--nhat);font-size:15px}footer a{margin-right:14px}
.nut{display:inline-block;padding:8px 16px;border:1px solid var(--nhan);border-radius:8px;text-decoration:none}`;
const khung = ({ ten, mo, url, than, ld = "" }) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(ten)}</title><meta name="google-site-verification" content="oooxwV_rr5c1GsUInLzSgfZT_0Dp_1LyYF_66iSCTfA"><meta name="description" content="${esc(mo)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(ten)}"><meta property="og:description" content="${esc(mo)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="vi_VN">
<style>${CSS}</style>${ld}</head><body><header><div class="k"><a href="${GOC}/">Universtar Studio · mô hình kit, Gunpla, Sentai</a></div></header><main class="k">${than}</main>
<footer><div class="k"><a href="${LINK.yt}">YouTube</a><a href="${LINK.fb}">Facebook</a><a href="${LINK.tt}">TikTok</a><br>Universtar Studio — mở hộp, ráp và soi mô hình kit. Lời đọc bằng giọng máy.</div></footer></body></html>
`;

rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const urls = [`${GOC}/`]; let nv = 0;
const dsHtml = (l, tru) => `<ul class="ds">${l.ds.filter((i) => i !== tru).map((i) => `<li><a href="${GOC}/v/${i}/">${esc(tieuDe(vd.get(i)))}</a></li>`).join("")}</ul>`;
for (const id of ids.filter(pub)) {
  const v = vd.get(id), l = thuoc.get(id), dung = /^PT(\d+S|[01]M\d*S?)$/.test(v.contentDetails.duration);   // ≤ ~2 phút → khung dọc
  const url = `${GOC}/v/${id}/`, ten = tieuDe(v), mo = moTa(v) || ten;
  const ld = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "VideoObject", name: ten, description: mo, thumbnailUrl: [`https://i.ytimg.com/vi/${id}/hqdefault.jpg`], uploadDate: v.snippet.publishedAt, duration: v.contentDetails.duration, embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, contentUrl: `https://www.youtube.com/watch?v=${id}`, inLanguage: "vi" }).replace(/</g, "\\u003c")}</script>`;
  const than = `${l ? `<p class="n" style="margin-top:20px"><a href="${GOC}/${l.slug}/">${esc(l.ten)}</a></p>` : ""}<h1>${esc(ten)}</h1><p>${esc(mo)}</p>
<div class="v${dung ? " d" : ""}"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(ten)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
<p><a class="nut" href="https://www.youtube.com/watch?v=${id}">Xem trên YouTube</a></p>${l ? `<h2>Cùng loạt: ${esc(l.ten)}</h2>${dsHtml({ ds: l.ds.slice(0, 30) }, id)}<p><a href="${GOC}/${l.slug}/">Xem cả loạt →</a></p>` : ""}`;
  mkdirSync(join(OUT, "v", id), { recursive: true }); writeFileSync(join(OUT, "v", id, "index.html"), khung({ ten: ten + " · Universtar Studio", mo: mo.slice(0, 160), url, than, ld }));
  urls.push(url); nv++;
}
for (const l of loat) {
  const url = `${GOC}/${l.slug}/`;
  mkdirSync(join(OUT, l.slug), { recursive: true });
  writeFileSync(join(OUT, l.slug, "index.html"), khung({ ten: `${l.ten} · Universtar Studio`, mo: `${l.ds.length} video: ${l.ten}. Mở hộp, ráp và soi mô hình kit.`, url, than: `<h1>${esc(l.ten)}</h1><p class="n">${l.ds.length} video</p>${dsHtml(l)}` }));
  urls.push(url);
}
writeFileSync(join(OUT, "index.html"), khung({ ten: "Universtar Studio — mở hộp, ráp, soi mô hình kit Gunpla, Sentai, Tinh Giáp Hồn Tướng", mo: "Mở hộp, ráp và soi mô hình kit: Gunpla, Sentai SMP, Tinh Giáp Hồn Tướng, plamo các hãng. Mỗi video có trang riêng.", url: `${GOC}/`,
  than: `<h1>Universtar Studio</h1><p>Mở hộp, ráp và soi mô hình kit: Gunpla, Sentai SMP, Tinh Giáp Hồn Tướng, plamo các hãng. Dưới đây là các loạt video.</p><p><a class="nut" href="${LINK.yt}">Kênh YouTube</a></p>${loat.map((l) => `<h2><a href="${GOC}/${l.slug}/">${esc(l.ten)}</a></h2><p class="n">${l.ds.length} video</p>`).join("")}` }));
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`universtar/: ${nv} trang video + ${loat.length} trang loạt + trang chủ + sitemap`);
