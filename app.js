/* ============================================================
   THE WILD ROBOT — BOOK CLUB APP BEHAVIOUR
   Reads from data.js. Renders into #app. Hash-based routing.
   ============================================================ */

const root = document.getElementById("app");
const LS_PREFIX = "wildrobot_";

function ls(key, val) {
  if (val === undefined) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + key)); } catch (e) { return null; }
  }
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch (e) {}
}

/* optimised copies of the artwork live in images/web (originals untouched in images/) */
const IMG = (name) => `images/web/${name}.webp`;
const BANNER = (n) => IMG(`week${n}-banner`);

/* ---------- small inline SVG icons for UI chrome ---------- */
const ICONS = {
  print: `<svg class="svg" viewBox="0 0 24 24" fill="none"><rect x="6" y="10" width="12" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M7 10V4h10v6M8 17v3h8v-3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  download: `<svg class="svg" viewBox="0 0 24 24" fill="none"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrowR: `<svg class="svg" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrowL: `<svg class="svg" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m0 0l6-6m-6 6l6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  grid: `<svg class="svg" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" stroke-width="2"/></svg>`,
  full: `<svg class="svg" viewBox="0 0 24 24" fill="none"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  key: `<svg class="svg" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 12h9m-3 0v3m-3-3v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  check: `<svg class="svg" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="8.5" cy="14.5" r="1.3" fill="currentColor"/><circle cx="12" cy="14.5" r="1.3" fill="currentColor"/></svg>`,
  pack: `<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="10" width="12" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M7 10V4h10v6M8 17v3h8v-3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const MODE_ICON = { teacher: IMG("icon-teacher-read"), group: IMG("icon-group-read"), quiz: IMG("icon-quiz") };
const MODE_TAG = { teacher: "Teacher Read", group: "Group Read", quiz: "Quiz Day" };
const PROJECT_LABEL = { poster: "Poster", comic: "Comic Strip", drama: "Drama", journal: "Journal" };
const dayName = (d) => DAY_LABELS[d].split(" — ")[0];
const rubricLabel = (code) => (RUBRIC.find((r) => r.code === code) || {}).label || code;
const tagsHtml = (tags) => tags.map((t) => `<span class="rtag" title="${rubricLabel(t)}">${t}</span>`).join("");

/* ---------- routing ---------- */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  return h.split("/").filter(Boolean);
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => { spawnLeaves(); render(); });

function go(hash) { location.hash = hash; }

let activeKeyHandler = null;
function setKeyHandler(fn) {
  if (activeKeyHandler) document.removeEventListener("keydown", activeKeyHandler);
  activeKeyHandler = fn;
  if (fn) document.addEventListener("keydown", fn);
}

function render() {
  setKeyHandler(null);
  const parts = parseHash();
  if (parts.length === 0) return renderHome();
  const w = parts[0];
  if (w === "week10") {
    markVisited(10);
    if (parts[1] === "rubric") return renderFinalRubric();
    if (parts[1] === "certificate") return renderCertificate();
    return renderWeek10(parts[1]);
  }
  const weekNum = parseInt(w.replace("week", ""), 10);
  const week = WEEKS.find((x) => x.num === weekNum);
  if (!week) return renderHome();
  markVisited(week.num);
  if (parts.length === 1) return renderWeek(week);
  const day = parts[1];
  if (day === "projects") return renderProjects(week);
  if (day === "rubric") return renderRubric(week);
  if (!DAY_ORDER.includes(day)) return renderWeek(week);
  const mode = DAY_MODE[day];
  if (mode === "teacher") return renderSlideshow(week, day);
  if (mode === "group") return renderWorksheet(week, day);
  if (mode === "quiz") return renderQuiz(week, day);
}

function markVisited(n) {
  const v = ls("visited") || [];
  if (!v.includes(n)) { v.push(n); ls("visited", v); }
  ls("lastWeek", n);
}

/* ---------- shared chrome ---------- */
function shellStart(crumbs, currentWeek) {
  root.innerHTML = "";
  const header = document.createElement("header");
  header.className = "topbar";
  const jump = WEEKS.map((w) => w.num).concat(10)
    .map((n) => `<button class="${n === currentWeek ? "current" : ""}" style="background-image:url('${BANNER(n)}')" onclick="go('${n === 10 ? "week10" : "week" + n}')" title="Week ${n}"><span>${n}</span></button>`).join("");
  header.innerHTML = `
    <div class="wrap topbar-inner">
      <button class="brand" onclick="go('')" aria-label="Home">
        <img src="${IMG("logo-leaf")}" alt="" class="brand-logo" />
        <span class="brand-text"><b>The Wild Robot</b><span>Book Club · Years 5–6</span></span>
      </button>
      <nav class="crumbs">${crumbs}</nav>
      <div class="topbar-actions">
        <div class="week-jump" id="weekJump">
          <button class="btn ghost small" id="weekJumpBtn" aria-haspopup="true">${ICONS.grid} Weeks</button>
          <div class="week-jump-menu">${jump}</div>
        </div>
      </div>
    </div>`;
  root.appendChild(header);
  const wj = header.querySelector("#weekJump");
  header.querySelector("#weekJumpBtn").onclick = (e) => { e.stopPropagation(); wj.classList.toggle("open"); };
  const main = document.createElement("main");
  main.id = "main";
  main.className = "page-enter";
  root.appendChild(main);
  window.scrollTo(0, 0);
  onScroll();
  return main;
}

function crumbTrail(week, day) {
  let c = `<button onclick="go('')">Home</button>`;
  if (week) c += `<span class="sep">/</span><button onclick="go('week${week.num}')">Week ${week.num}</button>`;
  if (day) c += `<span class="sep">/</span><span class="here">${DAY_LABELS[day] || (day === "projects" ? "Projects" : day === "rubric" ? "Rubric" : day)}</span>`;
  return c;
}

function onScroll() {
  const tb = document.querySelector(".topbar");
  if (tb) tb.classList.toggle("scrolled", window.scrollY > 10);
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < 0) return;
    el.style.translate = `0 ${Math.min(window.scrollY, 900) * 0.3}px`;
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
document.addEventListener("click", (e) => {
  const wj = document.getElementById("weekJump");
  if (wj && !wj.contains(e.target)) wj.classList.remove("open");
});

/* scroll-reveal */
let revealObs = null;
function reveal(scope) {
  const els = (scope || document).querySelectorAll(".reveal:not(.in)");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  if (!revealObs) revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach((e) => revealObs.observe(e));
}

/* drifting leaves in the background */
function spawnLeaves() {
  const layer = document.getElementById("leafLayer");
  if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 9; i++) {
    const l = document.createElement("i");
    const size = 16 + Math.random() * 18;
    l.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-duration:${16 + Math.random() * 16}s;animation-delay:${-Math.random() * 30}s;opacity:${0.25 + Math.random() * 0.35}`;
    layer.appendChild(l);
  }
}

/* leaf confetti burst */
function confetti(n = 60) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("div");
  c.className = "confetti";
  for (let i = 0; i < n; i++) {
    const l = document.createElement("i");
    if (Math.random() > 0.5) l.className = "g";
    const s = 14 + Math.random() * 20;
    l.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;--dx:${(Math.random() - 0.5) * 300}px;--r:${Math.random() * 900 - 450}deg;animation-delay:${Math.random() * 0.8}s;animation-duration:${2.2 + Math.random() * 1.6}s`;
    c.appendChild(l);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 4500);
}

function pageHead({ bg, icon, small, title, text, actions }) {
  return `<div class="page-head reveal">
    <div class="bg" style="background-image:url('${bg}')"></div>
    ${icon ? `<img class="ph-icon" src="${icon}" alt="" />` : ""}
    <div class="ph-text"><small>${small}</small><h1>${title}</h1>${text ? `<p>${text}</p>` : ""}</div>
    ${actions ? `<div class="toolbar no-print">${actions}</div>` : ""}
  </div>`;
}

/* ---------- HOME ---------- */
function renderHome() {
  const main = shellStart(`<span class="here">Home</span>`);
  const last = ls("lastWeek");
  const visited = ls("visited") || [];
  const totalQ = WEEKS.reduce((a, w) => a + w.quiz.length, 0);
  const lastLabel = last ? (last === 10 ? "Week 10" : `Week ${last}`) : null;
  main.innerHTML = `
    <section class="home-hero">
      <div class="bg" data-parallax></div>
      <div class="wrap hero-content">
        <span class="eyebrow"><span class="dot"></span> Whole-class book study · Peter Brown</span>
        <h1><em>Welcome to the island of</em>The Wild Robot</h1>
        <p class="lede">Nine weeks of reading with Roz, Brightbill and the island creatures, plus a final project &amp; celebration week. Everything you need to teach it is right here.</p>
        <div class="hero-ctas">
          ${last ? `<button class="btn copper big" onclick="go('${last === 10 ? "week10" : "week" + last}')">Continue ${lastLabel} ${ICONS.arrowR}</button>` : `<button class="btn copper big" onclick="go('week1')">Start Week 1 ${ICONS.arrowR}</button>`}
          <button class="btn glass big" onclick="document.getElementById('journey').scrollIntoView({behavior:'smooth'})">Explore all weeks</button>
        </div>
      </div>
    </section>

    <div class="wrap">
      <div class="stats-strip reveal">
        <div class="stat"><b data-count="10">10</b><span>weeks</span></div>
        <div class="stat"><b data-count="${WEEKS.length * 4}">${WEEKS.length * 4}</b><span>reading lessons</span></div>
        <div class="stat"><b data-count="${totalQ}">${totalQ}</b><span>quiz questions</span></div>
        <div class="stat"><b data-count="${WEEKS.length * 4 + 4}">${WEEKS.length * 4 + 4}</b><span>creative projects</span></div>
      </div>

      <div class="section-head" id="journey">
        <div><div class="kicker">The journey</div><h2>Roz's story, week by week</h2>
          <p>Follow the island through the seasons. Pick a week to open its lessons, worksheets, quiz and projects.</p></div>
        <div class="toolbar">
          <button class="btn ghost small" onclick="downloadReadingSchedule()">${ICONS.download} Reading schedule</button>
          <button class="btn ghost small" onclick="openBook('teacher-pack.html')"><img class="btn-icon" src="${IMG("icon-rubric")}" alt="" /> Teacher Pack</button>
          <button class="btn copper small" onclick="openBook('workbook.html')"><img class="btn-icon" src="${IMG("icon-journal")}" alt="" /> Student Workbook</button>
        </div>
      </div>
      <div class="weeks-grid" id="weeksGrid"></div>

      <div class="section-head">
        <div><div class="kicker">The weekly rhythm</div><h2>How every week works</h2>
          <p>The same predictable routine each week, so students always know what's coming.</p></div>
      </div>
      <div class="rhythm">
        ${DAY_ORDER.map((d, i) => `<div class="reveal" style="--d:${i * 0.07}s"><img src="${MODE_ICON[DAY_MODE[d]]}" alt="" /><b>${dayName(d)}</b><span>${d === "fri" ? "20-question quiz" : MODE_TAG[DAY_MODE[d]] + (DAY_MODE[d] === "teacher" ? " · slideshow" : " · worksheet")}</span></div>`).join("")}
      </div>

      <div class="section-head">
        <div><div class="kicker">Teacher toolkit</div><h2>Handy for the whole term</h2></div>
      </div>
      <div class="toolkit">
        <button class="tool reveal" onclick="openBook('workbook.html')"><img src="${IMG("icon-journal")}" alt="" /><b>Student Workbook</b><span>A printable workbook with a cover, every week's questions, projects, quizzes and check-ins.</span></button>
        <button class="tool reveal" style="--d:.03s" onclick="openBook('teacher-pack.html')"><img src="${IMG("icon-print-all")}" alt="" /><b>Teacher Pack</b><span>Reading schedule, all lesson plans, answer keys, marking guide with exemplars and class record sheets.</span></button>
        <button class="tool reveal" style="--d:.06s" onclick="downloadReadingSchedule()"><div class="svg-wrap">${ICONS.calendar}</div><b>Reading schedule</b><span>Download the term's chapter-by-chapter plan as a text file.</span></button>
        <button class="tool reveal" style="--d:.12s" onclick="go('week10/rubric')"><img src="${IMG("icon-rubric")}" alt="" /><b>Progress Rubric</b><span>Track reading progress across all ten rubric strands.</span></button>
        <button class="tool reveal" style="--d:.18s" onclick="go('week10')"><img src="${IMG("icon-presentation")}" alt="" /><b>Final Project</b><span>Week 10 options, lesson plan, gallery walk and celebration.</span></button>
        <button class="tool reveal" style="--d:.24s" onclick="go('week10/certificate')"><img src="${IMG("badge-kindness")}" alt="" /><b>Certificate</b><span>A printable "Kindness Grows Wild" completion certificate.</span></button>
      </div>
    </div>
  `;
  const grid = document.getElementById("weeksGrid");
  const cards = WEEKS.map((w) => ({ n: w.num, title: w.title, chap: w.chapters, theme: w.LI.replace("We are learning to ", "").replace(/\.$/, ""), hash: "week" + w.num }));
  cards.push({ n: 10, title: "Final Project &amp; Celebration", chap: "No new reading", theme: "3-lesson project, presentations, gallery walk and certificates", hash: "week10", w10: true });
  cards.forEach((c, i) => {
    const el = document.createElement("button");
    el.className = "week-card reveal" + (c.w10 ? " w10" : "");
    el.style.setProperty("--d", `${(i % 4) * 0.07}s`);
    el.onclick = () => go(c.hash);
    const theme = c.theme.charAt(0).toUpperCase() + c.theme.slice(1);
    el.innerHTML = `
      <div class="thumb"><div style="background-image:url('${BANNER(c.n)}')"></div>
        <span class="chap-pill">${c.chap}</span>
        ${visited.includes(c.n) ? `<span class="visited">✓ Visited</span>` : ""}
      </div>
      <div class="num"><small>WEEK</small>${c.n}</div>
      <div class="body"><h3>${c.title}</h3><p class="theme">${theme}</p><div class="go">Open week <span>→</span></div></div>`;
    grid.appendChild(el);
  });
  reveal(main);
}

/* ---------- WEEK OVERVIEW ---------- */
function renderWeek(week) {
  const main = shellStart(crumbTrail(week), week.num);
  const prev = WEEKS.find((w) => w.num === week.num - 1);
  const next = WEEKS.find((w) => w.num === week.num + 1) || { num: 10, title: "Final Project & Celebration" };
  main.innerHTML = `
    <section class="week-hero">
      <div class="bg" data-parallax style="background-image:url('${BANNER(week.num)}')"></div>
      <div class="big-num">${String(week.num).padStart(2, "0")}</div>
      <div class="wrap">
        <span class="eyebrow"><span class="dot"></span> Week ${week.num} of 10</span>
        <h1>${week.title}</h1>
        <div class="meta"><span class="pill">📖 ${week.chapters}</span><span class="pill">4 reading lessons</span><span class="pill">Friday quiz</span></div>
      </div>
    </section>
    <div class="wrap">
      <div class="signposts">
        <div class="signpost reveal"><img src="${IMG("icon-leadin")}" alt="" /><div class="label">Learning Intention</div><p>${week.LI}</p></div>
        <div class="signpost reveal" style="--d:.08s"><img src="${IMG("icon-quiz")}" alt="" /><div class="label">Success Criteria</div><p>${week.SC}</p></div>
      </div>
      <div class="rubric-tags reveal">Rubric evidence this week: ${tagsHtml(week.rubricTags)}</div>

      <div class="section-head">
        <div><div class="kicker">The week's trail</div><h2>Five days on the island</h2></div>
      </div>
      <div class="trail" id="daysGrid"></div>

      <div class="section-head">
        <div><div class="kicker">Also this week</div><h2>Projects &amp; printables</h2></div>
      </div>
      <div class="week-actions">
        <button class="action-card reveal" onclick="go('week${week.num}/projects')"><img src="${IMG("icon-poster")}" alt="" /><div><b>Weekly Projects</b><span>Poster, comic, drama or journal — students choose one.</span></div></button>
        <button class="action-card reveal" style="--d:.06s" onclick="openBook('workbook.html?week=${week.num}')"><img src="${IMG("icon-journal")}" alt="" /><div><b>Student workbook pages</b><span>This week's questions, projects, quiz &amp; check-in — ready to print.</span></div></button>
        <button class="action-card reveal" style="--d:.09s" onclick="openBook('teacher-pack.html?week=${week.num}')"><img src="${IMG("icon-print-all")}" alt="" /><div><b>Teacher plan &amp; answers</b><span>All four lesson plans, the quiz answer key and project menu.</span></div></button>
        <button class="action-card reveal" style="--d:.12s" onclick="go('week${week.num}/rubric')"><img src="${IMG("icon-rubric")}" alt="" /><div><b>Progress Rubric</b><span>This week's strands highlighted: ${week.rubricTags.join(", ")}.</span></div></button>
      </div>

      <nav class="week-nav">
        ${prev ? `<button onclick="go('week${prev.num}')"><div class="t" style="background-image:url('${BANNER(prev.num)}')"></div><div><small>← Week ${prev.num}</small><b>${prev.title}</b></div></button>` : `<span></span>`}
        <button class="next" onclick="go('${next.num === 10 ? "week10" : "week" + next.num}')"><div class="t" style="background-image:url('${BANNER(next.num)}')"></div><div><small>Week ${next.num} →</small><b>${next.title}</b></div></button>
      </nav>
    </div>
  `;
  const grid = document.getElementById("daysGrid");
  DAY_ORDER.forEach((d, i) => {
    const info = week.days[d];
    const mode = DAY_MODE[d];
    const el = document.createElement("button");
    el.className = `day-card ${mode} reveal`;
    el.style.setProperty("--d", `${i * 0.08}s`);
    el.onclick = () => go(`week${week.num}/${d}`);
    const title = mode === "quiz" ? "Quiz Day" : info.chapters;
    const sub = mode === "quiz" ? `20 questions on ${week.chapters}` : info.subtitle;
    el.innerHTML = `<div class="icon-bubble"><img src="${MODE_ICON[mode]}" alt="" /></div><div class="dayname">${dayName(d)}</div><h4>${title}</h4><p>${sub}</p><span class="mode-tag ${mode}">${MODE_TAG[mode]}</span>`;
    grid.appendChild(el);
  });
  reveal(main);
}

/* ---------- SLIDESHOW (Mon/Wed) ---------- */
function renderSlideshow(week, day) {
  const info = week.days[day];
  const slides = [
    { kind: "title", kicker: `Week ${week.num} · ${DAY_LABELS[day]}`, title: info.chapters, body: info.subtitle },
    { kicker: "Lead-in question", title: "Before we read...", body: info.leadIn, icon: IMG("icon-leadin") },
    { kind: "reading", kicker: "Now reading", title: info.chapters, body: "Teacher reads aloud. Follow along and listen for what changes for our characters.", icon: IMG("icon-teacher-read") },
    { kicker: "Comprehension", title: "Question 1", body: info.comp1, icon: IMG("icon-comprehension") },
    { kicker: "Inference", title: "Question 2", body: info.comp2, icon: IMG("icon-comprehension") },
    { kicker: "Go-away reflection", title: "Before you go...", body: info.goAway, icon: IMG("icon-goaway") },
  ];
  const main = shellStart(crumbTrail(week, day), week.num);
  main.innerHTML = `
    <div class="wrap">
      <div class="li-strip reveal" style="margin-top:24px">
        <div><b>Learning Intention</b>${week.LI}</div>
        <div><b>Success Criteria</b>${week.SC}</div>
      </div>
      <div class="stage" id="stage">
        <div class="bg" id="stageBg" style="background-image:url('${BANNER(week.num)}')"></div>
        <div class="progress"><i id="prog"></i></div>
        <div class="stage-top">
          <div class="toolbar"><span class="pill">${ICONS.check.replace('class="svg"', 'width="14" height="14"')} Rubric: ${week.rubricTags.join(", ")}</span></div>
          <div class="toolbar">
            <span class="pill" id="counter">1 / ${slides.length}</span>
            <button class="btn glass small" id="fsBtn">${ICONS.full} Full screen</button>
          </div>
        </div>
        <div class="slide-area"><div class="slide" id="slideBody"></div></div>
        <div class="stage-nav">
          <button class="btn glass" id="prevBtn">${ICONS.arrowL} Back</button>
          <div class="slide-dots" id="dots"></div>
          <button class="btn copper" id="nextBtn">Next ${ICONS.arrowR}</button>
        </div>
      </div>
      <p class="key-hint no-print">Use <kbd>←</kbd> <kbd>→</kbd> or <kbd>Space</kbd> to move through the slides · <kbd>F</kbd> for full screen</p>
      <div class="toolbar no-print" style="margin-top:18px;justify-content:center">
        <button class="btn ghost small" onclick="printLessonPlan(${week.num},'${day}')">${ICONS.print} Print today's lesson plan</button>
        <button class="btn ghost small" onclick="go('week${week.num}')">Back to Week ${week.num}</button>
      </div>
    </div>
  `;
  let idx = 0;
  const body = document.getElementById("slideBody");
  const dots = document.getElementById("dots");
  const stage = document.getElementById("stage");
  const bg = document.getElementById("stageBg");
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.onclick = () => { const dir = i > idx ? 1 : -1; idx = i; draw(dir); };
    dots.appendChild(b);
  });
  function draw(dir) {
    const s = slides[idx];
    body.className = "slide" + (s.kind === "title" ? " title-slide" : "") + (s.kind === "reading" ? " reading-slide" : "");
    void body.offsetWidth;
    if (dir) body.classList.add(dir > 0 ? "enter-next" : "enter-prev");
    const iconHtml = s.icon ? (s.kind === "reading" ? `<img class="book" src="${s.icon}" alt="" />` : `<img class="slide-icon" src="${s.icon}" alt="" />`) : "";
    body.innerHTML = `${iconHtml}<div class="kicker">${s.kicker}</div><h3>${s.title}</h3><p class="body">${s.body}</p>`;
    [...dots.children].forEach((d, i) => d.classList.toggle("active", i === idx));
    document.getElementById("prevBtn").disabled = idx === 0;
    document.getElementById("nextBtn").innerHTML = idx === slides.length - 1 ? `Done ${ICONS.check}` : `Next ${ICONS.arrowR}`;
    document.getElementById("prog").style.width = `${((idx + 1) / slides.length) * 100}%`;
    document.getElementById("counter").textContent = `${idx + 1} / ${slides.length}`;
    bg.style.backgroundPosition = `${(idx / (slides.length - 1)) * 100}% center`;
  }
  document.getElementById("prevBtn").onclick = () => { if (idx > 0) { idx--; draw(-1); } };
  document.getElementById("nextBtn").onclick = () => {
    if (idx < slides.length - 1) { idx++; draw(1); }
    else { if (document.fullscreenElement) document.exitFullscreen(); go(`week${week.num}`); }
  };
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (stage.requestFullscreen) stage.requestFullscreen();
    else if (stage.webkitRequestFullscreen) stage.webkitRequestFullscreen();
  };
  document.getElementById("fsBtn").onclick = toggleFs;
  setKeyHandler((e) => {
    if (e.target.matches && e.target.matches("input, textarea, [contenteditable]")) return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); document.getElementById("nextBtn").click(); }
    if (e.key === "ArrowLeft") document.getElementById("prevBtn").click();
    if (e.key === "f" || e.key === "F") toggleFs();
  });
  draw(1);
  reveal(main);
}

/* ---------- WORKSHEET (Tue/Thu) ---------- */
function renderWorksheet(week, day) {
  const info = week.days[day];
  const key = `ws_${week.num}_${day}`;
  const saved = ls(key) || {};
  const main = shellStart(crumbTrail(week, day), week.num);
  const qa = [
    { k: "leadIn", label: "Lead-in", text: info.leadIn, icon: "icon-leadin" },
    { k: "comp1", label: "Comprehension", text: info.comp1, icon: "icon-comprehension" },
    { k: "comp2", label: "Inference", text: info.comp2, icon: "icon-comprehension" },
    { k: "goAway", label: "Go-away reflection", text: info.goAway, icon: "icon-goaway" },
  ];
  main.innerHTML = `
    <div class="wrap">
      ${pageHead({ bg: BANNER(week.num), icon: IMG("icon-group-read"), small: `Week ${week.num} · ${DAY_LABELS[day]}`, title: `${info.chapters}`, text: info.subtitle,
        actions: `<button class="btn active small" id="onBtn">On-screen</button><button class="btn glass small" id="printBtn">${ICONS.print} Printable</button>` })}
      <div class="li-strip reveal">
        <div><b>Learning Intention</b>${week.LI}</div>
        <div><b>Success Criteria</b>${week.SC}</div>
      </div>
      <div class="ws-layout">
        <aside class="ws-side no-print">
          <div class="side-card reveal">
            <h4>Reading turns <button class="btn ghost small" id="nextTurn" style="padding:5px 10px">Next ${ICONS.arrowR}</button></h4>
            <div class="turn-tracker" id="turnTracker"></div>
            <p class="mini">Tap a reader to give them the turn. Click a name to rename it.</p>
          </div>
          <div class="side-card reveal">
            <h4>Answers <span class="saved-flag" id="savedFlag">✓ Saved</span></h4>
            <p class="mini" style="margin-top:0">Typed answers save automatically on this device.</p>
            <button class="btn ghost small" style="margin-top:10px;width:100%;justify-content:center" onclick="printLessonPlan(${week.num},'${day}')">${ICONS.print} Print this worksheet</button>
          </div>
        </aside>
        <div class="worksheet reveal">
          <div class="ws-head">
            <div><h3>${info.chapters} — ${info.subtitle}</h3><p>Group Read · talk it through, then write your group's best thinking.</p></div>
            <div class="ws-name">Group: <span>&nbsp;</span></div>
          </div>
          ${qa.map((q) => `<div class="qa-block"><label><img src="${IMG(q.icon)}" alt="" /><span><small>${q.label}</small>${q.text}</span></label><textarea data-k="${q.k}" placeholder="Write your answer here...">${saved[q.k] || ""}</textarea></div>`).join("")}
        </div>
      </div>
    </div>
  `;
  const flag = document.getElementById("savedFlag");
  let flagT;
  main.querySelectorAll("textarea").forEach((t) => {
    t.addEventListener("input", () => {
      const cur = ls(key) || {};
      cur[t.dataset.k] = t.value;
      ls(key, cur);
      flag.classList.add("show");
      clearTimeout(flagT);
      flagT = setTimeout(() => flag.classList.remove("show"), 1400);
    });
  });
  // turn tracker
  const namesKey = "turnnames_" + week.num + day;
  const names = ls(namesKey) || ["Student A", "Student B", "Student C", "Student D"];
  const tt = document.getElementById("turnTracker");
  let turn = 0;
  function drawTT() {
    tt.innerHTML = "";
    names.forEach((n, i) => {
      const el = document.createElement("div");
      el.className = "turn" + (i === turn ? " active-turn" : "");
      el.innerHTML = `<span class="pebble">${i + 1}</span><input value="${n.replace(/"/g, "&quot;")}" aria-label="Reader ${i + 1} name" />`;
      el.onclick = (e) => { if (e.target.tagName === "INPUT" && i === turn) return; turn = i; drawTT(); };
      const inp = el.querySelector("input");
      inp.addEventListener("input", () => { names[i] = inp.value; ls(namesKey, names); });
      tt.appendChild(el);
    });
  }
  drawTT();
  document.getElementById("nextTurn").onclick = () => { turn = (turn + 1) % names.length; drawTT(); };
  document.getElementById("onBtn").onclick = () => document.body.classList.remove("printable-mode");
  document.getElementById("printBtn").onclick = () => window.print();
  reveal(main);
}

/* ---------- QUIZ (Fri) ---------- */
function renderQuiz(week, day) {
  const main = shellStart(crumbTrail(week, day), week.num);
  const total = week.quiz.length;
  const C = 2 * Math.PI * 62;
  main.innerHTML = `
    <div class="wrap">
      ${pageHead({ bg: BANNER(week.num), icon: IMG("icon-quiz"), small: `Week ${week.num} · Friday Quiz`, title: `${week.title} Quiz`, text: `${total} questions covering ${week.chapters}` })}
      <div class="quiz-layout">
        <div>
          <div class="quiz-list" id="quizList"></div>
          <div class="celebrate" id="celebrate">
            <h3 id="celebrateTitle">Great reading!</h3>
            <p id="scoreBar"></p>
            <div class="quiz-badges">
              <div class="quiz-badge"><img src="${IMG("badge-quiz-champion")}" alt="" /><span>Quiz Champion</span></div>
              <div class="quiz-badge"><img src="${IMG("badge-reading-streak")}" alt="" /><span>Reading Streak</span></div>
            </div>
          </div>
        </div>
        <aside class="quiz-side no-print">
          <div class="side-card" style="text-align:center">
            <div class="ring">
              <svg viewBox="0 0 150 150"><defs><linearGradient id="ringGrad" x1="0" x2="1"><stop offset="0" stop-color="#5b9a6a"/><stop offset="1" stop-color="#e08a45"/></linearGradient></defs>
                <circle class="track" cx="75" cy="75" r="62"/><circle class="fill" id="ringFill" cx="75" cy="75" r="62" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
              <div class="ring-label"><div><b id="ringNum">0</b><span>of ${total} answered</span></div></div>
            </div>
            <button class="btn copper" id="markBtn">${ICONS.check} Mark my answers</button>
            <button class="btn ghost small" id="toggleKeyBtn">${ICONS.key} Teacher: show/hide answer key</button>
          </div>
          <div class="side-card">
            <h4>Print</h4>
            <button class="btn ghost small" onclick="printQuiz(${week.num}, false)">${ICONS.print} Student copy</button>
            <button class="btn ghost small" onclick="printQuiz(${week.num}, true)">${ICONS.print} With answer key</button>
          </div>
        </aside>
      </div>
    </div>
  `;
  const list = document.getElementById("quizList");
  week.quiz.forEach((q, i) => {
    const el = document.createElement("div");
    el.className = "quiz-q reveal";
    const tf = q.type === "tf";
    el.innerHTML = `<div class="qbadge">${i + 1}</div>
      <div class="qnum">Question ${i + 1}${tf ? `<span class="tf">True / False</span>` : ""}</div>
      <p class="qtext">${q.q}</p>
      ${tf ? `<div class="tf-buttons"><button type="button" data-v="True">True</button><button type="button" data-v="False">False</button></div>
        <input type="text" data-i="${i}" placeholder="Explain (optional)..." />` : `<input type="text" data-i="${i}" placeholder="Type your answer..." />`}
      <div class="answer-reveal" id="ans${i}"><div><div class="ans"><b>Answer:</b> ${q.answer}</div></div></div>`;
    if (tf) {
      el.querySelectorAll(".tf-buttons button").forEach((b) => {
        b.onclick = () => {
          el.querySelectorAll(".tf-buttons button").forEach((o) => o.classList.toggle("on", o === b));
          el.dataset.tf = b.dataset.v;
          update();
        };
      });
    }
    list.appendChild(el);
  });
  function answered() {
    let n = 0;
    list.querySelectorAll(".quiz-q").forEach((q) => {
      const has = q.querySelector("input").value.trim() || q.dataset.tf;
      q.classList.toggle("answered", !!has);
      if (has) n++;
    });
    return n;
  }
  function update() {
    const n = answered();
    document.getElementById("ringNum").textContent = n;
    document.getElementById("ringFill").style.strokeDashoffset = C * (1 - n / total);
  }
  list.addEventListener("input", update);
  document.getElementById("markBtn").onclick = () => {
    const attempted = answered();
    const cel = document.getElementById("celebrate");
    document.getElementById("celebrateTitle").textContent = attempted === total ? "Every question answered — amazing!" : attempted >= total / 2 ? "Great reading!" : "Good start!";
    document.getElementById("scoreBar").textContent = `${attempted} of ${total} answered — ask your teacher to check open-ended answers, and reveal the answer key to self-check factual ones.`;
    cel.classList.remove("show"); void cel.offsetWidth; cel.classList.add("show");
    cel.scrollIntoView({ behavior: "smooth", block: "center" });
    if (attempted > 0) confetti();
  };
  document.getElementById("toggleKeyBtn").onclick = () => {
    document.querySelectorAll(".answer-reveal").forEach((a) => a.classList.toggle("show"));
  };
  reveal(main);
}

/* ---------- PROJECTS ---------- */
function renderProjects(week) {
  const main = shellStart(crumbTrail(week, "projects"), week.num);
  const key = "proj_" + week.num;
  const chosen = ls(key) || null;
  main.innerHTML = `
    <div class="wrap">
      ${pageHead({ bg: BANNER(week.num), icon: IMG("icon-poster"), small: `Week ${week.num} · Project Menu`, title: "Choose your project", text: "Four ways to show what you know. Pick the one that suits you best.",
        actions: `<button class="btn glass small" onclick="printProjects(${week.num})">${ICONS.print} Print project cards</button>` })}
      <div class="li-strip reveal"><div><b>Success Criteria</b>${week.SC}</div></div>
      <div class="projects-grid" id="pg"></div>
    </div>`;
  const pg = document.getElementById("pg");
  week.projects.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "project-card reveal " + p.type + (chosen === p.type ? " chosen" : "");
    el.style.setProperty("--d", `${i * 0.08}s`);
    el.innerHTML = `<span class="ribbon">CHOSEN</span><div class="pc-top"><img class="project-icon" src="${IMG("icon-" + p.type)}" alt="" /></div>
      <div class="type-tag">${PROJECT_LABEL[p.type] || p.type}</div><h4>${p.title}</h4><p>${p.brief}</p>
      <label class="choose no-print"><input type="checkbox" data-t="${p.type}" ${chosen === p.type ? "checked" : ""}/> Mark as chosen</label>`;
    pg.appendChild(el);
  });
  pg.querySelectorAll("input[type=checkbox]").forEach((c) => {
    c.addEventListener("change", () => {
      pg.querySelectorAll("input[type=checkbox]").forEach((o) => { if (o !== c) o.checked = false; });
      pg.querySelectorAll(".project-card").forEach((card) => card.classList.toggle("chosen", card.querySelector("input").checked));
      ls(key, c.checked ? c.dataset.t : null);
      if (c.checked) confetti(24);
    });
  });
  reveal(main);
}

/* ---------- RUBRIC (per-week quick link goes to global rubric, filtered) ---------- */
function renderRubric(week) { renderFinalRubric(week); }

function renderFinalRubric(week) {
  const crumbs = week ? crumbTrail(week, "rubric") : `<button onclick="go('')">Home</button><span class="sep">/</span><button onclick="go('week10')">Week 10</button><span class="sep">/</span><span class="here">Reading Progress Rubric</span>`;
  const main = shellStart(crumbs, week ? week.num : 10);
  main.innerHTML = `
    <div class="wrap">
      ${pageHead({ bg: week ? BANNER(week.num) : BANNER(10), icon: IMG("icon-rubric"), small: week ? `Week ${week.num} · Rubric evidence: ${week.rubricTags.join(", ")}` : "Whole unit", title: "Reading Progress Rubric",
        text: week ? "This week's strands are highlighted below. Tap a strand to see what success looks like." : "Tap a level to record where the class is at. Tap a strand to see what success looks like.",
        actions: `<button class="btn glass small" onclick="openBook('teacher-pack.html?section=marking')">${ICONS.print} Marking guide</button><button class="btn glass small" onclick="printBlankRubric()">${ICONS.print} Class record sheet</button>` })}
      <div class="kindness-strip reveal"><img src="${IMG("badge-kindness")}" alt="" /><div><b>Three simple levels</b>Not Achieved · Working Towards · Achieved — and Achieved means the Level 3 curriculum expectation has been met.</div></div>
      <div class="legend">${RUBRIC_LEVELS.map((l, i) => `<span><i style="background:var(--lv-${i + 1})"></i>${l}</span>`).join("")}</div>
      <div class="rubric-list" id="rList"></div>
    </div>`;
  const list = document.getElementById("rList");
  const openRows = new Set();
  function draw() {
    const saved = ls("rubric") || {};
    list.innerHTML = RUBRIC.map((r) => {
      const cur = saved[r.code] || null;
      const focus = week && week.rubricTags.includes(r.code);
      const g = MARKING_GUIDE.find((m) => m.code === r.code);
      const open = openRows.has(r.code);
      return `<div class="rubric-row ${focus ? "focus" : ""} ${open ? "open" : ""}"><div class="code">${r.code}</div>
        <button class="crit crit-toggle" data-code="${r.code}"><b>${r.label}</b><span>${g ? g.ask : r.desc}</span><em>${open ? "Hide" : "What success looks like"} ▾</em></button>
        <div class="levels">${RUBRIC_LEVELS.map((lvl, i) => `<button class="level-btn ${cur === lvl ? "active" : ""}" data-i="${i}" data-code="${r.code}" data-lvl="${lvl}">${lvl}</button>`).join("")}</div>
        ${g ? `<div class="rubric-detail"><div><div class="rd-grid">
          <div class="rd-curr"><small>Curriculum expectation</small><p><i>${g.curriculum}</i></p><small>Students should be able to</small><p>${g.expect}</p></div>
          <div class="rd-levels"><div class="rd-lv na"><b>Not Achieved</b>${g.na}</div><div class="rd-lv wt"><b>Working Towards</b>${g.wt}</div><div class="rd-lv a"><b>Achieved</b>${g.ach}</div></div>
          <div class="rd-ex"><small>Exemplar — what Achieved looks like</small><blockquote>${g.exemplar}</blockquote><p class="rd-ev"><b>Find evidence in:</b> ${g.evidence}</p></div>
        </div></div></div>` : ""}</div>`;
    }).join("");
    list.querySelectorAll(".crit-toggle").forEach((b) => {
      b.onclick = () => { const c = b.dataset.code; openRows.has(c) ? openRows.delete(c) : openRows.add(c); draw(); };
    });
    list.querySelectorAll(".level-btn").forEach((b) => {
      b.onclick = () => {
        const cur = ls("rubric") || {};
        cur[b.dataset.code] = b.dataset.lvl;
        ls("rubric", cur);
        draw();
      };
    });
  }
  draw();
  reveal(main);
}

/* ---------- WEEK 10 ---------- */
function renderWeek10(sub) {
  const main = shellStart(`<button onclick="go('')">Home</button><span class="sep">/</span><span class="here">Week 10</span>`, 10);
  const optIcons = ["icon-poster", "icon-drama", "icon-journal", "icon-comic"];
  main.innerHTML = `
    <section class="week-hero">
      <div class="bg" data-parallax style="background-image:url('${BANNER(10)}')"></div>
      <div class="big-num">10</div>
      <div class="wrap">
        <span class="eyebrow"><span class="dot"></span> Week 10 of 10 · The finale</span>
        <h1>Final Project &amp; Celebration</h1>
        <div class="meta"><span class="pill">No new reading</span><span class="pill">3 project lessons</span><span class="pill">Gallery walk</span><span class="pill">Certificates</span></div>
        <div class="toolbar">
          <button class="btn copper" onclick="go('week10/rubric')"><img class="btn-icon" src="${IMG("icon-rubric")}" alt="" /> Reading Progress Rubric</button>
          <button class="btn glass" onclick="go('week10/certificate')"><img class="btn-icon" src="${IMG("badge-kindness")}" alt="" /> Certificate</button>
          <button class="btn glass" onclick="openBook('teacher-pack.html?week=10')"><img class="btn-icon" src="${IMG("icon-print-all")}" alt="" /> Teacher plan</button>
        </div>
      </div>
    </section>
    <div class="wrap">
      <div class="section-head">
        <div><div class="kicker">Choose one</div><h2>Final project options</h2>
          <p>No new reading this week. Students apply everything they've learned about <em>The Wild Robot</em> to one final project.</p></div>
      </div>
      <div class="projects-grid" id="w10opts"></div>

      <div class="section-head"><div><div class="kicker">Monday – Wednesday</div><h2>3-lesson structure</h2></div></div>
      <div class="lesson-steps" id="w10lessons"></div>

      <div class="feature-panel reveal">
        <div class="bg" style="background-image:url('${IMG("final-project-banner")}')"></div>
        <div class="fp-inner"><img class="fp-icon" src="${IMG("icon-presentation")}" alt="" />
          <div class="fp-text"><small>Thursday</small><h3>Presentation &amp; Gallery Walk</h3><p>${WEEK10.thursday}</p></div></div>
      </div>
      <div class="feature-panel reveal">
        <div class="bg" style="background-image:url('${IMG("dawn-truce-circle")}')"></div>
        <div class="fp-inner"><img class="fp-icon" src="${IMG("badge-kindness")}" alt="" />
          <div class="fp-text"><small>Friday</small><h3>Celebration &amp; Reflection Circle</h3><p>${WEEK10.friday}</p></div></div>
      </div>

      <div class="section-head"><div><div class="kicker">Assessment</div><h2>Final Project Rubric</h2></div></div>
      <div class="table-scroll reveal">
        <table class="rubric-table"><tr><th>Criteria</th><th>Not Achieved</th><th>Working Towards</th><th>Achieved</th></tr>
          ${WEEK10.rubric.map((r) => `<tr><td><b>${r.criteria}</b><br><span class="rtag" style="display:inline-block;margin-top:6px">${r.code}</span></td><td>${r.na}</td><td>${r.wt}</td><td>${r.a}<span class="eg">e.g. ${r.example}</span></td></tr>`).join("")}
        </table>
      </div>
      <nav class="week-nav">
        <button onclick="go('week9')"><div class="t" style="background-image:url('${BANNER(9)}')"></div><div><small>← Week 9</small><b>${WEEKS[WEEKS.length - 1].title}</b></div></button>
      </nav>
    </div>
  `;
  const opts = document.getElementById("w10opts");
  const types = ["poster", "drama", "journal", "comic"];
  WEEK10.options.forEach((o, i) => {
    const el = document.createElement("div");
    el.className = `project-card reveal ${types[i % 4]}`;
    el.style.setProperty("--d", `${i * 0.08}s`);
    el.innerHTML = `<div class="pc-top"><img class="project-icon" src="${IMG(optIcons[i % 4])}" alt="" /></div><div class="type-tag">Option ${i + 1}</div><h4>${o.title}</h4><p>${o.desc}</p>`;
    opts.appendChild(el);
  });
  const lessons = document.getElementById("w10lessons");
  WEEK10.lessons.forEach((l, i) => {
    const el = document.createElement("div");
    el.className = "lesson-step reveal";
    el.style.setProperty("--d", `${i * 0.08}s`);
    el.innerHTML = `<small>${l.day}</small><h4>${l.title}</h4><p>${l.desc}</p>`;
    lessons.appendChild(el);
  });
  reveal(main);
}

function renderCertificate() {
  const main = shellStart(`<button onclick="go('')">Home</button><span class="sep">/</span><button onclick="go('week10')">Week 10</button><span class="sep">/</span><span class="here">Certificate</span>`, 10);
  main.innerHTML = `
    <div class="wrap">
      <div class="toolbar no-print" style="margin:26px 0 18px;justify-content:center">
        <button class="btn copper" onclick="window.print()">${ICONS.print} Print certificate</button>
        <button class="btn ghost" onclick="go('week10')">Back to Week 10</button>
      </div>
      <div class="certificate page-enter">
        <img class="cert-frame" src="${IMG("certificate-border")}" alt="" />
        <div class="cert-ribbon">The Wild Robot</div>
        <img class="cert-badge" src="${IMG("badge-kindness")}" alt="" />
        <div class="cert-kicker">Kindness Grows Wild</div>
        <h2>Certificate of Completion</h2>
        <p class="cert-sub">awarded for completing <em>The Wild Robot</em> Book Study Unit</p>
        <div class="cert-name" contenteditable="true" spellcheck="false">Student Name</div>
        <div class="cert-sign"><div>Teacher signature</div><div>Date</div></div>
      </div>
      <p class="cert-hint no-print">Click the name to type a student's name, then print. Tip: choose <b>Landscape</b> in the print settings.</p>
    </div>
  `;
  const nm = main.querySelector(".cert-name");
  nm.addEventListener("focus", () => { if (nm.textContent === "Student Name") { const r = document.createRange(); r.selectNodeContents(nm); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } });
}

/* ---------- PRINT / EXPORT HELPERS ---------- */
function printLessonPlan(weekNum, day) {
  const week = WEEKS.find((w) => w.num === weekNum);
  const info = week.days[day];
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>Lesson Plan — Week ${weekNum} ${day}</title>${printStyles()}</head><body>
    <h1>The Wild Robot — Lesson Plan</h1>
    <h2>Week ${weekNum}: ${week.title} — ${DAY_LABELS[day]}</h2>
    <p><b>Reading:</b> ${info.chapters} — ${info.subtitle}</p>
    <p><b>Learning Intention:</b> ${week.LI}</p>
    <p><b>Success Criteria:</b> ${week.SC}</p>
    <p><b>Curriculum:</b> ${CURRICULUM.lrv.join(" ")} ${CURRICULUM.swp.join(" ")} Key Competencies: ${CURRICULUM.keyCompetencies}.</p>
    <p><b>Timing:</b> Settle &amp; lead-in (5 min) → Reading (15–20 min) → Comprehension/inference (15 min) → Go-away reflection (5 min)</p>
    <p><b>Rubric evidence today:</b> ${week.rubricTags.join(", ")}</p>
    <hr/>
    <p><b>Lead-in:</b> ${info.leadIn}</p>
    <p><b>Comprehension:</b> ${info.comp1}</p>
    <p><b>Inference:</b> ${info.comp2}</p>
    <p><b>Go-away reflection:</b> ${info.goAway}</p>
  </body></html>`);
  w.document.close(); w.focus(); w.print();
}

/* printable books live in their own pages (workbook.html / teacher-pack.html) */
function openBook(url) { window.open(url, "_blank"); }
function printWeekPack(weekNum) { openBook(`teacher-pack.html?week=${weekNum}`); }

function printQuiz(weekNum, withKey) {
  const week = WEEKS.find((w) => w.num === weekNum);
  const w2 = window.open("", "_blank");
  let body = `<h1>The Wild Robot — Week ${weekNum} Quiz</h1><p>${week.chapters}</p><ol>`;
  week.quiz.forEach((q) => { body += `<li>${q.q}${withKey ? `<br><i>Answer: ${q.answer}</i>` : `<br>_______________________________________________`}</li>`; });
  body += `</ol>`;
  w2.document.write(`<html><head><title>Week ${weekNum} Quiz</title>${printStyles()}</head><body>${body}</body></html>`);
  w2.document.close(); w2.focus(); w2.print();
}

function printProjects(weekNum) {
  const week = WEEKS.find((w) => w.num === weekNum);
  const w2 = window.open("", "_blank");
  let body = `<h1>The Wild Robot — Week ${weekNum} Project Cards</h1>`;
  week.projects.forEach((p) => { body += `<div style="border:1px solid #ccc;border-radius:10px;padding:14px;margin-bottom:12px"><b>${p.title}</b> (${p.type})<p>${p.brief}</p></div>`; });
  w2.document.write(`<html><head><title>Week ${weekNum} Projects</title>${printStyles()}</head><body>${body}</body></html>`);
  w2.document.close(); w2.focus(); w2.print();
}

function printBlankRubric() { openBook("teacher-pack.html?section=record"); }

function downloadReadingSchedule() {
  let text = "THE WILD ROBOT — TERM READING SCHEDULE\n" + "=".repeat(45) + "\n\n";
  WEEKS.forEach((w) => {
    text += `WEEK ${w.num}: ${w.title} (${w.chapters})\n`;
    DAY_ORDER.forEach((d) => {
      if (d === "fri") { text += `  Friday: 20-question quiz covering the week's reading\n`; return; }
      const info = w.days[d];
      const mode = DAY_MODE[d] === "teacher" ? "Teacher read-aloud" : "Group reading";
      text += `  ${DAY_LABELS[d].split(" — ")[0]}: ${info.chapters} — ${info.subtitle} (${mode})\n`;
    });
    text += "\n";
  });
  text += "WEEK 10: Final Project & Celebration — no new reading.\n";
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Wild_Robot_Reading_Schedule.txt";
  a.click();
}

function printAllBooklet() { openBook("workbook.html"); }

function printStyles() {
  return `<style>
    body{font-family:'Segoe UI',Verdana,sans-serif;color:#22301f;padding:20px;line-height:1.5}
    h1{color:#2b5738} h2{color:#3f7a52;margin-top:22px} h3{color:#8a6a4b}
    table{margin-top:10px} li{margin-bottom:6px}
  </style>`;
}
