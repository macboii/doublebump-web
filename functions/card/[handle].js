// Cloudflare Pages Function — 웹 명함 (Profile Card Pivot P1, DoubleBump-ios rules/profile-card.md §9)
//
//   GET /card/{handle}      → 명함 HTML (가입·설치 없이 열람)
//   GET /card/{handle}.vcf  → vCard 3.0 (iPhone·Android 연락처로 가져오기)
//
// 데이터는 Supabase Edge Function `web-card`에서만 받는다(D-27). 이 함수가 가진 비밀값은 WEB_CARD_KEY 하나 —
// 그 키로 할 수 있는 일은 "웹 카드를 켠 사람의 public 항목 조회"뿐이고, service_role 키는 여기 두지 않는다.
// 응답에는 사용자가 public으로 고른 항목만 들어 있다(필터는 서버 get_public_card가 한다).
//
// 환경변수 (Cloudflare Pages → Settings → Environment variables, Production/Preview 모두):
//   WEB_CARD_ENDPOINT = https://dbzsuwxpxipoozeevwbi.supabase.co/functions/v1/web-card
//   WEB_CARD_KEY      = (Supabase secret WEB_CARD_KEY와 같은 값, Encrypt로 저장)
//
// 없음·웹카드 OFF·정지 계정은 전부 같은 404 페이지 — 존재 여부를 구분할 수 없게 한다.
// 검색 노출 기본 OFF(D-8): X-Robots-Tag noindex. 방문자 추적(GA) 없음 — 남의 명함을 연 사람을 기록하지 않는다.

const HANDLE_RE = /^[a-z0-9_.]{3,30}$/;
const APP_STORE = "https://apps.apple.com/app/id6770075271";
const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.doublebump.android&referrer=utm_source%3Dweb_card";
const CACHE_SECONDS = 60; // 프로필은 최신본이 원칙 — 짧게만 캐시

const SOCIAL_URL = {
  instagram: (h) => `https://instagram.com/${h}`,
  x: (h) => `https://x.com/${h}`,
  linkedin: (h) => `https://linkedin.com/in/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  github: (h) => `https://github.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  threads: (h) => `https://threads.net/@${h}`,
};
// 소속 로고는 DoubleBump Storage만 — 서버도 같은 제약을 건다(profile_cards_org_logo_check)
const LOGO_RE = /^https:\/\/dbzsuwxpxipoozeevwbi\.supabase\.co\/storage\/v1\/object\/public\/avatars\/[A-Za-z0-9\/_.?=&-]+$/;
const ORG_LABEL = {
  company: { ko: "회사", en: "Company" }, school: { ko: "학교", en: "School" },
  organization: { ko: "단체", en: "Organization" }, other: { ko: "기타", en: "Other" },
};

// 기본 판 + 추가 언어 판 1개(명함 P8). `?v=a`/`?v=p`로 고르거나, 없으면 방문자 브라우저 언어가 추가 언어와 같을 때 추가 언어 판
function pickVersion(card, request) {
  const q = new URL(request.url).searchParams.get("v");
  const alt = card.alt && card.alt_lang && Object.keys(card.alt).length ? card.alt : null;
  const lang = (request.headers.get("accept-language") || "").slice(0, 2).toLowerCase();
  const useAlt = alt && (q === "a" || (q !== "p" && lang === card.alt_lang));
  return {
    useAlt: !!useAlt, hasAlt: !!alt,
    name: (useAlt && alt.display_name) || card.display_name,
    headline: (useAlt && alt.headline) || card.headline,
    company: (useAlt && alt.company) || card.company,
    address: (useAlt && alt.address) || card.address,
  };
}

// +821012345678 → +82 10 1234 5678 (표시만, 링크 값은 그대로)
function prettyPhone(p) {
  const m = /^\+82(2|\d{2})(\d{3,4})(\d{4})$/.exec(p || "");
  return m ? `+82 ${m[1]} ${m[2]} ${m[3]}` : p;
}

function langName(code) {
  try { return new Intl.DisplayNames([code], { type: "language" }).of(code) || code; } catch (_) { return code; }
}

const SOCIAL_LABEL = { instagram: "Instagram", x: "X", linkedin: "LinkedIn", tiktok: "TikTok", github: "GitHub", youtube: "YouTube", threads: "Threads" };

export async function onRequestGet(context) {
  const { request, env, params } = context;
  let raw = String(params.handle || "").toLowerCase();
  const wantsVcf = raw.endsWith(".vcf");
  if (wantsVcf) raw = raw.slice(0, -4);
  const ko = (request.headers.get("accept-language") || "").toLowerCase().startsWith("ko");

  if (!HANDLE_RE.test(raw)) return notFound(ko);

  const cache = caches.default;
  // 캐시 키에 언어를 넣는다 — HTML이 Accept-Language(ko/en)에 따라 달라지므로 URL만으로 캐시하면 섞인다
  const keyUrl = new URL(request.url);
  // 언어 판(?v)과 방문자 언어에 따라 결과가 달라지므로 둘 다 키에 넣는다
  const v = new URL(request.url).searchParams.get("v") || "";
  const al = (request.headers.get("accept-language") || "").slice(0, 2).toLowerCase();
  keyUrl.search = `?lang=${encodeURIComponent(al)}&v=${encodeURIComponent(v)}`;
  const cacheKey = new Request(keyUrl.toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let card;
  try {
    const res = await fetch(`${env.WEB_CARD_ENDPOINT}?handle=${encodeURIComponent(raw)}`, {
      headers: { "x-web-card-key": env.WEB_CARD_KEY || "" },
    });
    if (res.status === 404) return notFound(ko);
    if (!res.ok) return unavailable(ko);
    card = (await res.json()).card;
  } catch (_) {
    return unavailable(ko);
  }
  if (!card) return notFound(ko);

  const ver = pickVersion(card, request);
  const response = wantsVcf ? vcardResponse(card, raw, ver) : htmlResponse(card, raw, ko, request.url, ver);
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

// ── HTML ──────────────────────────────────────────────────────────────────

function htmlResponse(card, handle, ko, url, ver) {
  const t = ko
    ? { save: "연락처에 저장", saveSub: "회원가입 없이 연락처 저장", label: "Digital Profile Card", share: "공유",
        joinTitle: (n) => `${n}님의 인맥이 되어 보세요`,
        joinBody: (n) => `DoubleBump에 가입하고 ${n}님을 만나 휴대폰을 두 번 부딪히면(범프) 바로 인맥으로 연결돼요. 인맥이 되면 ${n}님의 인맥도 확인할 수 있어요.`,
        download: "DoubleBump 다운로드", stores: "iPhone · Android 무료",
        mobile: "휴대폰", office: "회사 전화", fax: "팩스", email: "이메일", address: "주소", website: "웹사이트" }
    : { save: "Save to Contacts", saveSub: "No sign-up needed", label: "Digital Profile Card", share: "Share",
        joinTitle: (n) => `Become ${n}'s connection`,
        joinBody: (n) => `Join DoubleBump, then bump phones twice when you meet ${n} to connect instantly. Once connected, you can see ${n}'s connections too.`,
        download: "Download DoubleBump", stores: "Free on iPhone · Android",
        mobile: "Mobile", office: "Office", fax: "Fax", email: "Email", address: "Address", website: "Website" };
  const name = esc(ver.name || handle);
  const contacts = [];
  const row = (label, value, href) => href
    ? `<a class="row" href="${escAttr(href)}" rel="noopener nofollow"><span class="k">${label}</span><span class="v">${esc(value)}</span></a>`
    : `<div class="row"><span class="k">${label}</span><span class="v">${esc(value)}</span></div>`;
  if (card.phone) contacts.push(row(t.mobile, prettyPhone(card.phone), `tel:${card.phone}`));
  if (card.office_phone) contacts.push(row(t.office, prettyPhone(card.office_phone), `tel:${card.office_phone}`));
  if (card.fax) contacts.push(row(t.fax, prettyPhone(card.fax), null));
  if (card.contact_email) contacts.push(row(t.email, card.contact_email, `mailto:${card.contact_email}`));
  if (ver.address) contacts.push(row(t.address, ver.address, `https://maps.google.com/?q=${encodeURIComponent(ver.address)}`));
  if (card.website && /^https:\/\//.test(card.website)) contacts.push(row(t.website, card.website.replace(/^https:\/\//, ""), card.website));
  const logo = card.org_logo_url && LOGO_RE.test(card.org_logo_url)
    ? `<img class="logo" src="${escAttr(card.org_logo_url)}" alt="" />` : "";
  const orgType = card.org_type && ORG_LABEL[card.org_type] ? ORG_LABEL[card.org_type][ko ? "ko" : "en"] : "";
  const org = ver.company || logo
    ? `<div class="org">${logo}<div><div class="org-name">${esc(ver.company || "")}</div>${orgType ? `<div class="org-type">${esc(orgType)}</div>` : ""}</div></div>` : "";
  const langSwitch = ver.hasAlt
    ? `<div class="langs"><a class="${ver.useAlt ? "" : "on"}" href="?v=p">${esc(langName(card.primary_lang || (ko ? "ko" : "en")))}</a><a class="${ver.useAlt ? "on" : ""}" href="?v=a">${esc(langName(card.alt_lang))}</a></div>` : "";
  const socials = Object.entries(card.socials || {})
    .filter(([k, v]) => v && SOCIAL_URL[k])
    .map(([k, v]) => `<a class="chip" href="${escAttr(SOCIAL_URL[k](encodeURIComponent(v)))}" rel="noopener nofollow">${esc(SOCIAL_LABEL[k])}</a>`)
    .join("");
  const avatar = card.avatar_url && /^https:\/\//.test(card.avatar_url)
    ? `<img class="avatar" src="${escAttr(card.avatar_url)}" alt="" />`
    : `<div class="avatar ph" aria-hidden="true">${esc((card.display_name || handle).slice(0, 1).toUpperCase())}</div>`;

  const html = `<!doctype html>
<html lang="${ko ? "ko" : "en"}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${name} · DoubleBump</title>
<meta property="og:title" content="${escAttr(ver.name || handle)} · DoubleBump" />
<meta property="og:description" content="${escAttr([ver.headline, ver.company].filter(Boolean).join(" · ") || t.label)}" />
<meta property="og:url" content="${escAttr(url)}" />
<meta name="apple-itunes-app" content="app-id=6770075271" />
<link rel="icon" href="/logo.png" />
<style>
:root{--bg:#111111;--card:#1a1a1a;--card2:#222222;--yellow:#FFD60A;--white:#ffffff;--gray:#9a9a9a;--dim:#848484}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--white);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;word-break:keep-all;overflow-wrap:break-word}
main{max-width:460px;margin:0 auto;padding:32px 16px 48px}
.card{background:var(--card);border:1px solid #2a2a2a;border-radius:18px;padding:24px 20px;text-align:left}
.org{display:flex;align-items:center;gap:10px;margin:0 0 18px}
.logo{width:40px;height:40px;border-radius:9px;object-fit:contain;background:#fff}
.org-name{font-weight:700;font-size:15px}
.org-type{color:var(--dim);font-size:12px}
.who{display:flex;align-items:center;gap:14px;margin:0 0 16px}
.who .avatar{margin:0;width:72px;height:72px}
.title{color:var(--yellow);font-size:15px;margin:2px 0 0}
.langs{display:flex;gap:0;background:#000;border-radius:999px;overflow:hidden}
.langs a{color:var(--gray);text-decoration:none;font-size:12px;font-weight:700;padding:5px 10px}
.langs a.on{background:var(--yellow);color:#000;border-radius:999px}
.k{display:block;color:var(--dim);font-size:12px}
.v{display:block;white-space:pre-line}
.top{display:flex;justify-content:space-between;align-items:center;color:var(--dim);font-size:13px;margin-bottom:20px}
.top button{background:none;border:0;color:var(--gray);font-size:13px;cursor:pointer}
.avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;margin:0 auto 14px;display:block;background:var(--card2)}
.avatar.ph{display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:var(--gray)}
h1{font-size:24px;margin:0 0 6px}
.sub{color:var(--gray);font-size:15px;margin:0 0 10px}
.bio{color:var(--white);font-size:15px;margin:0 0 18px;white-space:pre-line}
.rows{display:flex;flex-direction:column;gap:8px;margin:0 0 16px}
.row{display:block;background:var(--card2);border-radius:12px;padding:12px;color:var(--white);text-decoration:none;font-size:15px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}
.save,.save-sub{text-align:center}
.chip{border:1px solid #2a2a2a;border-radius:999px;padding:6px 12px;color:var(--gray);text-decoration:none;font-size:13px}
.save{display:block;background:var(--yellow);color:#000;font-weight:800;text-decoration:none;border-radius:14px;padding:14px;font-size:16px}
.save-sub{color:var(--dim);font-size:13px;margin:8px 0 0}
.join{margin:20px 0 0;background:var(--card);border:1px solid #2a2a2a;border-radius:18px;padding:22px 20px;text-align:center}
.join h2{font-size:18px;margin:0 0 8px}
.join p{color:var(--gray);font-size:14px;line-height:1.5;margin:0 0 16px}
.download{display:block;border:1.5px solid var(--yellow);color:var(--yellow);font-weight:800;text-decoration:none;border-radius:14px;padding:13px;font-size:16px}
.stores{color:var(--dim);font-size:12px;margin:8px 0 0}
.stores a{color:var(--dim)}
</style>
</head>
<body>
<main>
  <div class="card">
    <div class="top"><span>doublebump.com/card/${esc(handle)}</span><span>${langSwitch}<button type="button" id="share">${t.share}</button></span></div>
    ${org}
    <div class="who">${avatar}<div><h1>${name}</h1>${ver.headline ? `<p class="title">${esc(ver.headline)}</p>` : ""}<p class="sub">@${esc(handle)}</p></div></div>
    ${card.bio ? `<p class="bio">${esc(card.bio)}</p>` : ""}
    ${contacts.length ? `<div class="rows">${contacts.join("")}</div>` : ""}
    ${socials ? `<div class="chips">${socials}</div>` : ""}
    <a class="save" href="/card/${escAttr(handle)}.vcf${ver.useAlt ? "?v=a" : ""}">${t.save}</a>
    <p class="save-sub">${t.saveSub}</p>
  </div>
  <section class="join">
    <h2>${t.joinTitle(name)}</h2>
    <p>${t.joinBody(name)}</p>
    <a class="download" id="download" href="${APP_STORE}">${t.download}</a>
    <p class="stores">${t.stores} — <a href="${APP_STORE}">App Store</a> · <a href="${escAttr(PLAY_STORE)}">Google Play</a></p>
  </section>
</main>
<script>
document.getElementById('share').addEventListener('click',function(){
  if(navigator.share){navigator.share({title:document.title,url:location.href}).catch(function(){});}
  else if(navigator.clipboard){navigator.clipboard.writeText(location.href);}
});
if(/android/i.test(navigator.userAgent)){document.getElementById('download').href=${JSON.stringify(PLAY_STORE)};}
</script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: baseHeaders("text/html; charset=utf-8") });
}

// ── vCard 3.0 (RFC 2426 + RFC 6350 이스케이프) ────────────────────────────

function vcardResponse(card, handle, ver) {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const name = ver.name || handle;
  lines.push(`N:;${v(name)};;;`, `FN:${v(name)}`);
  if (ver.company) lines.push(`ORG:${v(ver.company)}`);
  if (ver.headline) lines.push(`TITLE:${v(ver.headline)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${v(card.phone)}`);
  if (card.office_phone) lines.push(`TEL;TYPE=WORK,VOICE:${v(card.office_phone)}`);
  if (card.fax) lines.push(`TEL;TYPE=WORK,FAX:${v(card.fax)}`);
  if (ver.address) lines.push(`ADR;TYPE=WORK:;;${v(ver.address)};;;;`);
  if (card.contact_email) lines.push(`EMAIL;TYPE=INTERNET:${v(card.contact_email)}`);
  if (card.website && /^https:\/\//.test(card.website)) lines.push(`URL:${v(card.website)}`);
  for (const [k, h] of Object.entries(card.socials || {})) {
    if (h && SOCIAL_URL[k]) lines.push(`URL;TYPE=${k.toUpperCase()}:${v(SOCIAL_URL[k](encodeURIComponent(h)))}`);
  }
  lines.push(`URL;TYPE=DOUBLEBUMP:https://doublebump.com/card/${handle}`);
  if (card.bio) lines.push(`NOTE:${v(card.bio)}`);
  lines.push("END:VCARD");
  const body = lines.map(fold).join("\r\n") + "\r\n";
  const headers = baseHeaders("text/vcard; charset=utf-8");
  headers["content-disposition"] = `attachment; filename="${handle}.vcf"`;
  return new Response(body, { status: 200, headers });
}

// vCard 값 이스케이프: \ , ; 줄바꿈
function v(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

// 75 octet 접기 — UTF-8 멀티바이트 문자를 중간에서 자르지 않는다
function fold(line) {
  const enc = new TextEncoder();
  const out = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // 이어지는 줄은 앞 공백 1바이트
    if (bytes + b > limit) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.map((s, i) => (i === 0 ? s : " " + s)).join("\r\n");
}

// ── 공통 ──────────────────────────────────────────────────────────────────

function baseHeaders(type) {
  return {
    "content-type": type,
    "cache-control": `public, max-age=${CACHE_SECONDS}`,
    "x-robots-tag": "noindex",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "content-security-policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
  };
}

function notFound(ko) {
  return simplePage(404, ko ? "명함을 찾을 수 없어요" : "Card not found",
    ko ? "링크가 잘못됐거나 공개되지 않은 명함입니다." : "This link is invalid or the card isn't public.", ko);
}

function unavailable(ko) {
  return simplePage(503, ko ? "잠시 후 다시 시도해 주세요" : "Please try again shortly", "", ko);
}

function simplePage(status, title, body, ko) {
  const html = `<!doctype html><html lang="${ko ? "ko" : "en"}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="robots" content="noindex"/><title>${esc(title)} · DoubleBump</title>
<style>body{margin:0;background:#111111;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:16px}p{color:#9a9a9a}a{color:#FFD60A}</style></head>
<body><div><h1>${esc(title)}</h1>${body ? `<p>${esc(body)}</p>` : ""}<p><a href="/">doublebump.com</a></p></div></body></html>`;
  const headers = baseHeaders("text/html; charset=utf-8");
  headers["cache-control"] = "no-store";
  return new Response(html, { status, headers });
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escAttr(s) { return esc(s); }
