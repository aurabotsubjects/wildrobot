/* ============================================================
   THE WILD ROBOT — PRINTABLE BOOKS ENGINE
   Builds A4 pages from data.js and flows content across pages.
   Used by workbook.html (student) and teacher-pack.html (teacher).
   URL options:
     workbook.html?week=3          → just Week 3's workbook pages
     teacher-pack.html?week=3      → just Week 3's lesson plan + answers
     teacher-pack.html?section=marking | record | schedule
   ============================================================ */

const IMG = (n) => `images/web/${n}.webp`;
const params = new URLSearchParams(location.search);
const ONLY_WEEK = params.get("week") ? parseInt(params.get("week"), 10) : null;
const SECTION = params.get("section");
const DAY_NAME = (d) => DAY_LABELS[d].split(" — ")[0];
const MODE_ICON = { teacher: "icon-teacher-read", group: "icon-group-read", quiz: "icon-quiz" };
const MODE_TAG = { teacher: "Teacher Read", group: "Group Read", quiz: "Quiz Day" };
const PROJECT_LABEL = { poster: "Poster", comic: "Comic Strip", drama: "Drama", journal: "Journal" };
const GUIDE = (code) => MARKING_GUIDE.find((m) => m.code === code);
const weeksFor = (code) => WEEKS.filter((w) => w.rubricTags.includes(code)).map((w) => w.num);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const liShort = (w) => cap(w.LI.replace("We are learning to ", "").replace(/\.$/, ""));

function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ---------------- paginator ---------------- */
class Book {
  constructor(root, title) {
    this.root = root; this.title = title; this.cur = null; this.section = ""; this.pages = []; this.lastBlock = null;
  }
  _page(cls = "") {
    const p = h(`<section class="page ${cls}"></section>`);
    this.root.appendChild(p); this.pages.push(p);
    return p;
  }
  full(html, cls = "") {
    const p = this._page("full " + cls);
    p.innerHTML = html;
    this.cur = null;
    return p;
  }
  landscape(html) {
    const p = this._page("full landscape");
    p.innerHTML = `<div class="rot">${html}</div>`;
    this.cur = null;
    return p;
  }
  newPage() {
    const p = this._page();
    p.innerHTML = `<div class="page-head"><div class="ph-left"><img src="${IMG("logo-leaf")}" alt="">${this.title}</div><div class="ph-right">${this.section}</div></div>
      <div class="page-body"></div><div class="page-foot"><span>The Wild Robot · Peter Brown</span><span class="pnum"></span></div>`;
    this.cur = p.querySelector(".page-body");
    this.lastBlock = null;
  }
  fits() { return this.cur.scrollHeight <= this.cur.clientHeight + 1; }
  /* add a block of HTML. opts: { brk: start new page, section: running header text, keep: keep with next block, toc: {id,label,level} } */
  add(html, opts = {}) {
    const block = typeof html === "string" ? h(html) : html;
    if (opts.section !== undefined) this.section = opts.section;
    if (opts.toc) { block.dataset.toc = opts.toc.id; }
    if (!this.cur || (opts.brk && this.cur.children.length)) this.newPage();
    this.cur.appendChild(block);
    if (!this.fits() && this.cur.children.length > 1) {
      block.remove();
      const carry = [];
      // keep headings with the block that follows them
      while (this.cur.lastElementChild && this.cur.lastElementChild.dataset.keep === "1" && this.cur.children.length > 1) {
        carry.unshift(this.cur.lastElementChild); this.cur.lastElementChild.remove();
      }
      this.newPage();
      carry.forEach((c) => this.cur.appendChild(c));
      this.cur.appendChild(block);
    }
    if (opts.keep) block.dataset.keep = "1";
    this.lastBlock = block;
    return block;
  }
  finish() {
    this.pages.forEach((p, i) => {
      const n = p.querySelector(".pnum");
      if (n) n.textContent = i + 1;
      const hd = p.querySelector(".ph-right");
      // running header = section of the first block on the page
      const first = p.querySelector(".page-body > [data-sec]");
      if (hd && first) hd.textContent = first.dataset.sec;
    });
    document.querySelectorAll("[data-tocref]").forEach((el) => {
      const target = document.querySelector(`[data-toc="${el.dataset.tocref}"]`);
      const page = target && target.closest(".page");
      el.textContent = page ? this.pages.indexOf(page) + 1 : "";
    });
  }
}
/* helper to tag a block with its section for the running header */
const sec = (html, s) => { const b = h(html); b.dataset.sec = s; return b; };

/* ---------------- small shared pieces ---------------- */
const leafSVG = (n) => `<svg viewBox="0 0 60 60"><path d="M9 51C9 24 27 9 52 8c0 26-16 43-43 43z" fill="#fff" stroke="#8a6a4b" stroke-width="1.5" stroke-dasharray="3 2.2"/><path d="M11 49C23 37 35 25 47 13" stroke="#b9d6e2" stroke-width="1.3" fill="none"/><text x="34" y="37" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="15" fill="#3f7a52">${n}</text></svg>`;
const circles3 = () => `<span class="circle-opt lv-na"><i></i>Not yet</span><span class="circle-opt lv-wt"><i></i>Working towards</span><span class="circle-opt lv-a"><i></i>Achieved</span>`;
const lines = (n) => `<div class="lines l${n}"></div>`;

/* ============================================================
   STUDENT WORKBOOK
   ============================================================ */
function buildWorkbook(root) {
  const B = new Book(root, "My Reading Workbook");
  const weeks = ONLY_WEEK ? WEEKS.filter((w) => w.num === ONLY_WEEK) : WEEKS;

  if (!ONLY_WEEK) {
    /* ---- cover ---- */
    B.full(`
      <div class="cover-art"><img src="${IMG("hero-banner")}" alt=""></div>
      <div class="cover-top"><span class="pill">Book Study · Years 5–6</span><span class="pill">Peter Brown</span></div>
      <div class="cover-logo"><img src="${IMG("logo-leaf")}" alt=""></div>
      <div class="cover-title"><div class="kicker">My Reading Workbook</div><h1>The Wild Robot</h1><p>Ten weeks on the island with Roz, Brightbill and friends</p></div>
      <div class="cover-name"><div class="full">Name <span></span></div><div>Class <span></span></div><div>Teacher <span></span></div></div>
      <div class="cover-badges"><img src="${IMG("badge-reading-streak")}" alt=""><img class="big" src="${IMG("badge-kindness")}" alt=""><img src="${IMG("badge-quiz-champion")}" alt=""></div>
    `, "cover");

    /* ---- welcome ---- */
    B.add(sec(`<div class="welcome-hero"><img src="${IMG("icon-teacher-read")}" alt=""><div><div class="kicker">Welcome, reader</div><h2>Your island adventure starts here</h2>
      <p>A robot called Roz wakes up alone on a wild island. Over the next ten weeks you'll follow her story, answer questions, make projects and show what you've learned. Keep this workbook safe — it's your record of the whole journey!</p></div></div>`, "Welcome"), { brk: true });
    B.add(sec(`<div><div class="section-title"><h3>How every week works</h3></div><div class="rhythm-row" style="margin-top:3mm">
      ${DAY_ORDER.map((d) => `<div><img src="${IMG(MODE_ICON[DAY_MODE[d]])}" alt=""><b>${DAY_NAME(d)}</b><span>${d === "fri" ? "Quiz day" : MODE_TAG[DAY_MODE[d]]}</span></div>`).join("")}</div></div>`, "Welcome"));
    B.add(sec(`<div><div class="section-title"><h3>My reading journey</h3><span class="muted small">Colour a leaf each time you finish a week.</span></div>
      <div class="journey" style="margin-top:3mm">${WEEKS.map((w) => `<div>${leafSVG(w.num)}<b>Week ${w.num}</b><span>${w.title}</span></div>`).join("")}
      <div>${leafSVG(10)}<b>Week 10</b><span>Final Project &amp; Celebration</span></div></div></div>`, "Welcome"));
    B.add(sec(`<div class="card"><div class="section-title"><h3>How I check my learning</h3></div>
      <p class="small muted" style="margin:1.5mm 0 3mm">Whenever you see these three circles, colour the one that shows where you are right now. It's okay to be at "Not yet" — that's how learning starts!</p>
      <div class="legend-3">${circles3()}</div></div>`, "Welcome"));

    /* ---- me as a reader (start & end) ---- */
    B.add(sec(`<div><div class="kicker">Before &amp; after</div><h2 style="font-size:20pt;font-weight:900;margin:1mm 0 1.5mm">Me as a reader</h2>
      <p class="small muted">Fill in the <b>Start</b> column in Week 1 and the <b>End</b> column in Week 10. Colour one circle in each: <span class="lv-na">●</span> Not yet · <span class="lv-wt">●</span> Working towards · <span class="lv-a">●</span> Achieved</p></div>`, "Me as a reader"), { brk: true, keep: true });
    B.add(sec(`<table class="self-table"><tr><th>I can…</th><th>Start (Week 1)</th><th>End (Week 10)</th></tr>
      ${MARKING_GUIDE.map((m) => `<tr><td><span class="code">${m.code}</span>${m.kid}</td><td class="opts"><i></i><i></i><i></i></td><td class="opts"><i></i><i></i><i></i></td></tr>`).join("")}</table>`, "Me as a reader"));
    B.add(sec(`<div class="card"><b style="font-family:var(--display);color:var(--forest-2)">One thing I want to get better at as a reader:</b>${lines(2)}</div>`, "Me as a reader"));
  }

  /* ---- each week ---- */
  weeks.forEach((w) => {
    const S = `Week ${w.num} · ${w.title}`;
    B.add(sec(`<div class="week-open"><img src="${IMG(`week${w.num}-banner`)}" alt=""><div class="wo-num">${w.num}</div>
      <div class="wo-in"><div class="kicker">Week ${w.num} of 10</div><h2>${w.title}</h2><span class="chip">${w.chapters}</span></div></div>`, S), { brk: true, section: S, keep: true });
    B.add(sec(`<div class="signs"><div class="sign"><img src="${IMG("icon-leadin")}" alt=""><div><div class="kicker">We are learning to</div><p>${cap(w.LI.replace("We are learning to ", ""))}</p></div></div>
      <div class="sign"><img src="${IMG("icon-quiz")}" alt=""><div><div class="kicker">Success looks like</div><p>${w.SC}</p></div></div></div>`, S));

    ["mon", "tue", "wed", "thu"].forEach((d) => {
      const info = w.days[d];
      const mode = DAY_MODE[d];
      B.add(sec(`<div class="day-head ${mode}"><img src="${IMG(MODE_ICON[mode])}" alt=""><div class="dh-text"><div class="kicker">${DAY_NAME(d)} · ${MODE_TAG[mode]}</div><h3>${info.chapters}</h3><div class="dh-sub">${info.subtitle}</div></div><div class="dh-right">Date<br><span class="fill-line" style="min-width:24mm"></span></div></div>`, S), { keep: true });
      const qs = [
        ["icon-leadin", "Before we read", info.leadIn, 2],
        ["icon-comprehension", "Comprehension", info.comp1, 3],
        ["icon-comprehension", "Inference — read between the lines", info.comp2, 3],
        ["icon-goaway", "Go-away reflection", info.goAway, 4],
      ];
      qs.forEach(([ic, label, text, n]) => {
        B.add(sec(`<div class="q"><img class="q-ic" src="${IMG(ic)}" alt=""><div><div class="q-label">${label}</div><div class="q-text">${text}</div></div>${lines(n)}</div>`, S));
      });
    });

    /* projects */
    B.add(sec(`<div class="day-head"><img src="${IMG("icon-poster")}" alt=""><div class="dh-text"><div class="kicker">Week ${w.num} · Project menu</div><h3>Choose one project</h3><div class="dh-sub">Tick the project you choose. Use the success criteria to guide your work.</div></div></div>`, S), { brk: true, keep: true });
    B.add(sec(`<div class="proj-grid">${w.projects.map((p) => `<div class="proj ${p.type}"><div class="pj-top"><img src="${IMG("icon-" + p.type)}" alt=""></div>
      <div class="pj-body"><div class="kicker">${PROJECT_LABEL[p.type]}</div><h4>${p.title}</h4><p>${p.brief}</p><div class="pj-choose"><span class="tick"></span> I chose this project</div></div></div>`).join("")}</div>`, S));
    B.add(sec(`<div class="plan-grid"><div class="card"><b>My plan — what I will make</b>${lines(3)}</div><div class="card"><b>What I need</b>${lines(3)}</div></div>`, S));

    /* quiz */
    B.add(sec(`<div class="day-head quiz"><img src="${IMG("icon-quiz")}" alt=""><div class="dh-text"><div class="kicker">Friday · Quiz Day</div><h3>Week ${w.num} Quiz</h3><div class="dh-sub">${w.quiz.length} questions on ${w.chapters}</div></div>
      <div class="score-badge">Score <span></span> / ${w.quiz.length}</div></div>`, S), { brk: true, keep: true });
    w.quiz.forEach((q, i) => {
      const open = /open/i.test(q.answer) || q.answer.length > 70;
      const body = q.type === "tf"
        ? `<div class="tf-row" style="grid-column:2"><span><i></i> True</span><span><i></i> False</span></div>`
        : lines(open ? 2 : 1);
      B.add(sec(`<div class="q"><div class="q-num">${i + 1}</div><div class="q-text" style="margin-top:1.4mm">${q.q.replace(/^True or False:\s*/i, "")}</div>${body}</div>`, S));
    });

    /* check-in */
    B.add(sec(`<div class="checkin"><h3>My Week ${w.num} check-in</h3>
      <div class="ci-row"><p>${w.SC}</p><div class="ci-opts">${circles3()}</div></div>
      <div><b class="small" style="color:var(--forest-2)">The most important thing that happened in the story this week was…</b>${lines(2)}</div>
      <div class="leaf-reminder"><img src="${IMG("logo-leaf")}" alt=""> Now colour leaf ${w.num} in your reading journey!</div></div>`, S));
  });

  /* ---- week 10 ---- */
  if (!ONLY_WEEK || ONLY_WEEK === 10) {
    const S = "Week 10 · Final Project";
    B.add(sec(`<div class="week-open"><img src="${IMG("week10-banner")}" alt=""><div class="wo-num">10</div>
      <div class="wo-in"><div class="kicker">Week 10 · The finale</div><h2>Final Project &amp; Celebration</h2><span class="chip">No new reading</span></div></div>`, S), { brk: true, section: S, keep: true });
    B.add(sec(`<div class="proj-grid">${WEEK10.options.map((o, i) => `<div class="proj ${["poster", "drama", "journal", "comic"][i]}"><div class="pj-top"><img src="${IMG(["icon-poster", "icon-drama", "icon-journal", "icon-comic"][i])}" alt=""></div>
      <div class="pj-body"><div class="kicker">Option ${i + 1}</div><h4>${o.title}</h4><p>${o.desc}</p><div class="pj-choose"><span class="tick"></span> We chose this</div></div></div>`).join("")}</div>`, S));
    B.add(sec(`<div class="card"><h3 style="font-size:14pt">Our project plan</h3><p class="small muted">Our big idea — what will our project show about <i>The Wild Robot</i>?</p>${lines(3)}</div>`, S), { brk: true });
    B.add(sec(`<div class="card"><h3 style="font-size:13pt;margin-bottom:1mm">Our team &amp; roles</h3><table class="roles"><tr><th style="width:40%">Name</th><th>My job in the group</th></tr>${"<tr><td></td><td></td></tr>".repeat(4)}</table></div>`, S));
    B.add(sec(`<div class="steps3">${WEEK10.lessons.map((l) => `<div class="card"><div class="kicker">${l.day}</div><h4><span class="tick"></span>${l.title}</h4><p class="tiny muted" style="margin:1mm 0">${l.desc}</p><b class="tiny">Today I…</b>${lines(3)}</div>`).join("")}</div>`, S));
    B.add(sec(`<div class="card"><b style="font-family:var(--display);color:var(--forest-2)">Things we need</b>${lines(2)}</div>`, S));
    B.add(sec(`<div class="day-head"><img src="${IMG("icon-presentation")}" alt=""><div class="dh-text"><div class="kicker">Thursday · Gallery walk</div><h3>Glow &amp; Grow</h3><div class="dh-sub">Cut out a slip and leave it with another group's project.</div></div></div>`, S), { brk: true, keep: true });
    for (let i = 0; i < 4; i++) {
      B.add(sec(`<div class="slip"><div><b class="glow">✦ Glow</b><span class="tiny muted">One thing that really shone…</span>${lines(2)}</div><div><b class="grow">↑ Grow</b><span class="tiny muted">One thing to think about next time…</span>${lines(2)}</div></div>`, S));
    }
    B.add(sec(`<div class="day-head"><img src="${IMG("badge-kindness")}" alt=""><div class="dh-text"><div class="kicker">Friday · Reflection circle</div><h3>The big idea I'll carry forward</h3><div class="dh-sub">What will you remember from this book for a long time?</div></div></div>`, S), { brk: true, keep: true });
    B.add(sec(`<div class="card">${lines(5)}</div>`, S));
    B.add(sec(`<div class="card"><b style="font-family:var(--display);color:var(--forest-2)">My favourite moment in the whole book was…</b>${lines(3)}<b style="font-family:var(--display);color:var(--forest-2)">If I could say one thing to Roz, it would be…</b>${lines(2)}</div>`, S));
    if (!ONLY_WEEK) B.add(sec(`<div class="checkin"><h3>Don't forget!</h3><div class="leaf-reminder"><img src="${IMG("logo-leaf")}" alt=""> Colour leaf 10 in your reading journey, and fill in the "End" column on your Me as a reader page.</div></div>`, S));
  }

  if (!ONLY_WEEK) {
    B.full(`<img class="bc-art" src="${IMG("dawn-truce-circle")}" alt=""><div class="bc-in"><img src="${IMG("badge-kindness")}" alt=""><h2>Kindness grows wild.</h2><p>Roz learned that kindness is how you survive — and how you belong.<br>Now it's yours to carry.</p></div>`, "back-cover");
  }
  B.finish();
}

/* ============================================================
   TEACHER PACK
   ============================================================ */
function buildTeacherPack(root) {
  const B = new Book(root, "Teacher Pack");
  const all = !ONLY_WEEK && !SECTION;
  const show = (s) => all || SECTION === s;

  if (all) {
    B.full(`
      <div class="tc-art"><img src="${IMG("dawn-truce-circle")}" alt=""></div>
      <div class="tc-top"><img src="${IMG("logo-leaf")}" alt=""><span>The Wild Robot · Book Study</span></div>
      <div class="tc-in"><div class="kicker">Teacher Pack</div><h1><em>Everything you need to teach</em>The Wild Robot</h1>
        <p class="tc-sub">A 10-week whole-class book study for Years 5–6 · NZ Curriculum Level 3 English</p>
        <div class="tc-list">
          <div><img src="${IMG("icon-print-all")}" alt="">Reading schedule</div>
          <div><img src="${IMG("icon-teacher-read")}" alt="">All 40 lesson plans</div>
          <div><img src="${IMG("icon-quiz")}" alt="">Quiz answer keys</div>
          <div><img src="${IMG("icon-rubric")}" alt="">3-level marking guide</div>
          <div><img src="${IMG("icon-comprehension")}" alt="">Exemplars for every strand</div>
          <div><img src="${IMG("icon-journal")}" alt="">Class record sheets</div>
        </div></div>
      <div class="tc-foot"><span>Teacher <span class="fill-line"></span></span><span>Class / Term <span class="fill-line"></span></span></div>`, "t-cover");

    /* contents */
    const tocItems = [
      ["t-overview", "Unit overview & curriculum", 1], ["t-schedule", "Reading schedule", 1], ["t-plans", "Lesson plans & answer keys", 1],
      ...WEEKS.map((w) => [`t-w${w.num}`, `Week ${w.num} — ${w.title}`, 2]), ["t-w10", "Week 10 — Final Project & Celebration", 2],
      ["t-marking", "Marking guide — how to mark", 1], ["t-glance", "Rubric at a glance", 2], ["t-crit", "Strand-by-strand guide with exemplars", 2], ["t-w10r", "Final project rubric", 2],
      ["t-record", "Class achievement record", 1], ["t-tracker", "Weekly completion tracker", 1],
    ];
    B.add(sec(`<div class="t-h2"><img src="${IMG("icon-print-all")}" alt=""><div><h2>Contents</h2><p>Print the whole pack, or just the sections you need.</p></div></div>`, "Contents"), { brk: true, section: "Contents" });
    B.add(sec(`<div class="toc">${tocItems.map(([id, label, lvl]) => `<div class="toc-row ${lvl === 1 ? "major" : "minor"}"><span>${label}</span><span class="dots"></span><span class="pg" data-tocref="${id}"></span></div>`).join("")}</div>`, "Contents"));
  }

  /* ---- overview ---- */
  if (all) {
    const S = "Unit overview";
    B.add(sec(`<div class="t-h2"><img src="${IMG("icon-leadin")}" alt=""><div><h2>Unit overview</h2><p>How the ten weeks fit together</p></div></div>`, S), { brk: true, section: S, toc: { id: "t-overview" }, keep: true });
    B.add(sec(`<div class="cols-2">
      <div class="info-card"><h4><img src="${IMG("icon-teacher-read")}" alt="">The weekly rhythm</h4><ul>
        <li><b>Monday &amp; Wednesday — Teacher Read.</b> Read aloud using the app slideshow: lead-in → read → two questions → go-away reflection.</li>
        <li><b>Tuesday &amp; Thursday — Group Read.</b> Groups of 3–4 read aloud in turns and record answers in their workbook.</li>
        <li><b>Friday — Quiz.</b> 20 questions on the week's chapters (answer keys in this pack).</li>
        <li><b>Project menu.</b> Each week students choose one of four projects (poster, comic, drama, journal).</li></ul></div>
      <div class="info-card"><h4><img src="${IMG("icon-print-all")}" alt="">Your three resources</h4><ul>
        <li><b>The web app</b> — slideshows for teacher reads, on-screen worksheets, quizzes and a turn tracker.</li>
        <li><b>Student Workbook</b> — one per student: cover, weekly questions with writing lines, projects, quizzes and check-ins.</li>
        <li><b>This Teacher Pack</b> — schedule, lesson plans, answer keys, marking guide, exemplars and record sheets.</li></ul></div>
      <div class="info-card"><h4><img src="${IMG("icon-rubric")}" alt="">How assessment works</h4><ul>
        <li>Ten rubric strands (R1–R10), each marked <b>Not Achieved / Working Towards / Achieved</b>.</li>
        <li><b>Achieved = the Level 3 curriculum expectation.</b> Each strand has an exemplar showing what that looks like.</li>
        <li>Each week lists the 2–3 strands to gather evidence for — you never assess all ten at once.</li>
        <li>Record judgements on the class achievement record at the back.</li></ul></div>
      <div class="info-card"><h4><img src="${IMG("icon-presentation")}" alt="">Week 10 finale</h4><ul>
        <li>No new reading. Three project lessons: <b>Plan → Produce → Polish</b>.</li>
        <li>Thursday gallery walk with Glow &amp; Grow feedback.</li>
        <li>Friday reflection circle and certificates (print them from the app).</li></ul></div></div>`, S));
    B.add(sec(`<div class="info-card"><h4><img src="${IMG("icon-comprehension")}" alt="">${CURRICULUM.heading.replace("Level 3–4", "Level 3")}</h4>
      <div class="cols-2" style="gap:5mm;margin-top:1mm">
        <div><div class="kicker">Listening, Reading &amp; Viewing</div><ul>${CURRICULUM.lrv.map((x) => `<li>${x}</li>`).join("")}</ul></div>
        <div><div class="kicker">Speaking, Writing &amp; Presenting</div><ul>${CURRICULUM.swp.map((x) => `<li>${x}</li>`).join("")}</ul></div>
        <div><div class="kicker">Key competencies</div><p>${CURRICULUM.keyCompetencies}</p></div>
        <div><div class="kicker">Values</div><p>${CURRICULUM.values}</p></div></div>
      <p class="small muted" style="margin-top:2mm"><b>Cross-curricular links:</b> ${CURRICULUM.crossCurricular}</p></div>`, S));
  }

  /* ---- schedule ---- */
  if (all || SECTION === "schedule") {
    const S = "Reading schedule";
    B.add(sec(`<div class="t-h2"><img src="${IMG("icon-teacher-read")}" alt=""><div><h2>Reading schedule</h2><p>Chapter-by-chapter plan for the term. <span class="chip">Teacher Read</span> <span class="chip sky">Group Read</span> <span class="chip copper">Quiz</span></p></div></div>`, S), { brk: true, section: S, toc: { id: "t-schedule" }, keep: true });
    const cols = `<colgroup><col class="c-wk"><col class="c-title"><col><col><col><col><col class="c-fri"><col class="c-tags"></colgroup>`;
    B.add(sec(`<table class="sched">${cols}<tr><th>Wk</th><th>Week</th><th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th><th>Rubric</th></tr></table>`, S), { keep: true });
    WEEKS.forEach((w) => {
      const cell = (d, cls) => `<td class="${cls}"><b class="ch">${w.days[d].chapters.replace("Chapters", "Ch.")}</b>${w.days[d].subtitle}</td>`;
      B.add(sec(`<table class="sched">${cols}<tr><td class="wk">${w.num}</td><td class="ttl"><b>${w.title}</b>${w.chapters}</td>${cell("mon", "tr")}${cell("tue", "gr")}${cell("wed", "tr")}${cell("thu", "gr")}<td class="qz"><b class="ch">Quiz</b>20 questions</td><td>${w.rubricTags.join(", ")}</td></tr></table>`, S));
    });
    B.add(sec(`<table class="sched">${cols}<tr class="w10"><td class="wk">10</td><td class="ttl"><b>Final Project &amp; Celebration</b>No new reading</td>${WEEK10.lessons.map((l) => `<td><b class="ch">${l.title}</b>${l.desc}</td>`).join("")}<td><b class="ch">Gallery walk</b>Glow &amp; Grow</td><td><b class="ch">Celebrate</b>Reflection circle, certificates</td><td>All</td></tr></table>`, S));
  }

  /* ---- lesson plans ---- */
  const planWeeks = ONLY_WEEK ? WEEKS.filter((w) => w.num === ONLY_WEEK) : (all ? WEEKS : []);
  planWeeks.forEach((w, wi) => {
    const S = `Lesson plans · Week ${w.num}`;
    if (wi === 0 && all) {
      B.add(sec(`<div class="t-h2"><img src="${IMG("icon-teacher-read")}" alt=""><div><h2>Lesson plans &amp; answer keys</h2><p>Four lessons a week, a Friday quiz answer key and the project menu.</p></div></div>`, S), { brk: true, section: S, toc: { id: "t-plans" }, keep: true });
    }
    B.add(sec(`<div class="lp-open"><div class="lp-img"><img src="${IMG(`week${w.num}-banner`)}" alt=""><span>${w.num}</span></div>
      <div class="lp-info"><div class="kicker">Week ${w.num} · ${w.chapters}</div><h2>${w.title}</h2>
      <div class="li-sc"><div><b>Learning intention</b>${w.LI}</div><div><b>Success criteria</b>${w.SC}</div></div></div></div>`, S),
      { brk: !(wi === 0 && all), section: S, toc: { id: `t-w${w.num}` }, keep: true });
    B.add(sec(`<div><div class="kicker" style="margin-bottom:1.5mm">Rubric evidence to look for this week</div><div class="focus-row">${w.rubricTags.map((t) => { const g = GUIDE(t); return `<div class="focus"><b>${t} · ${g.label}</b><span>${g.ask}</span></div>`; }).join("")}</div></div>`, S));
    ["mon", "tue", "wed", "thu"].forEach((d) => {
      const info = w.days[d];
      const mode = DAY_MODE[d];
      const tip = mode === "teacher"
        ? `<b>Teacher move:</b> Open the app → Week ${w.num} → ${DAY_NAME(d)} and teach from the slideshow. Pause during the read-aloud to model thinking aloud. Students write answers in their workbook.`
        : `<b>Teacher move:</b> Groups of 3–4 take turns reading aloud (use the app's turn tracker). Rotate roles: reader, questioner, summariser, connector. Rove and note evidence for ${w.rubricTags.join(", ")}.`;
      B.add(sec(`<div class="lesson ${mode}"><div class="ls-head"><img src="${IMG(MODE_ICON[mode])}" alt=""><div><h4>${DAY_NAME(d)} · ${info.chapters}</h4><div class="ls-sub">${info.subtitle}</div></div><span class="chip ${mode === "group" ? "sky" : ""}">${MODE_TAG[mode]}</span></div>
        <div class="ls-body"><div class="timing"><div class="t1">Lead-in · 5</div><div class="t2">${mode === "teacher" ? "Teacher reads aloud" : "Group reading"} · 15–20 min</div><div class="t3">Discuss &amp; answer · 15</div><div class="t4">Go-away · 5</div></div>
        <div class="ls-qs">
          <div class="ls-q"><img src="${IMG("icon-leadin")}" alt=""><div><b>Lead-in</b>${info.leadIn}</div></div>
          <div class="ls-q"><img src="${IMG("icon-comprehension")}" alt=""><div><b>Comprehension</b>${info.comp1}</div></div>
          <div class="ls-q"><img src="${IMG("icon-comprehension")}" alt=""><div><b>Inference</b>${info.comp2}</div></div>
          <div class="ls-q"><img src="${IMG("icon-goaway")}" alt=""><div><b>Go-away reflection</b>${info.goAway}</div></div></div>
        <div class="ls-tip">${tip}</div></div></div>`, S));
    });
    B.add(sec(`<div class="answer-key"><h4><img src="${IMG("icon-quiz")}" alt="">Friday quiz — answer key</h4><ol>${w.quiz.map((q) => `<li><i>${q.q}</i><b>${q.answer}</b></li>`).join("")}</ol></div>`, S));
    B.add(sec(`<div><div class="kicker" style="margin-bottom:1.5mm">Project menu this week</div><div class="proj-list">${w.projects.map((p) => `<div class="proj-mini"><img src="${IMG("icon-" + p.type)}" alt=""><div><b>${p.title}</b><span class="muted">${PROJECT_LABEL[p.type]} — </span>${p.brief}</div></div>`).join("")}</div></div>`, S));
  });

  if (all || ONLY_WEEK === 10) {
    const S = "Lesson plans · Week 10";
    B.add(sec(`<div class="lp-open"><div class="lp-img"><img src="${IMG("week10-banner")}" alt=""><span>10</span></div>
      <div class="lp-info"><div class="kicker">Week 10 · No new reading</div><h2>Final Project &amp; Celebration</h2>
      <div class="li-sc"><div><b>Purpose</b>Students apply everything they've learned about <i>The Wild Robot</i> to one final project, present it, and reflect on the whole unit.</div><div><b>Assessment</b>Final project rubric (Marking guide section) plus final judgements for R1–R10 on the class record.</div></div></div></div>`, S),
      { brk: true, section: S, toc: { id: "t-w10" }, keep: true });
    B.add(sec(`<div class="proj-list">${WEEK10.options.map((o, i) => `<div class="proj-mini"><img src="${IMG(["icon-poster", "icon-drama", "icon-journal", "icon-comic"][i])}" alt=""><div><b>Option ${i + 1}: ${o.title}</b>${o.desc}</div></div>`).join("")}</div>`, S));
    B.add(sec(`<div class="cols-3">${WEEK10.lessons.map((l) => `<div class="info-card"><div class="kicker">${l.day}</div><h4>${l.title}</h4><p>${l.desc}</p></div>`).join("")}</div>`, S));
    B.add(sec(`<div class="band"><img src="${IMG("icon-presentation")}" alt=""><div><b>Thursday — Presentation / Gallery Walk</b><p>${WEEK10.thursday}</p></div></div>`, S));
    B.add(sec(`<div class="band" style="background:var(--moss)"><img src="${IMG("badge-kindness")}" alt=""><div><b>Friday — Celebration &amp; Reflection</b><p>${WEEK10.friday}</p></div></div>`, S));
  }

  /* ---- marking guide ---- */
  if (all || SECTION === "marking") {
    const S = "Marking guide";
    B.add(sec(`<div class="t-h2"><img src="${IMG("icon-rubric")}" alt=""><div><h2>Marking guide</h2><p>Three levels. One question per strand. An exemplar for every strand.</p></div></div>`, S), { brk: true, section: S, toc: { id: "t-marking" }, keep: true });
    B.add(sec(`<div class="levels-explain">
      <div class="lvl na"><b><span>NA</span>Not Achieved</b><p>The student is not yet showing the skill, even with support. Plan to re-teach or scaffold.</p></div>
      <div class="lvl wt"><b><span>WT</span>Working Towards</b><p>The skill is partly there — with prompting, or missing a reason, detail or evidence.</p></div>
      <div class="lvl a"><b><span>A</span>Achieved</b><p>Meets the Level 3 curriculum expectation independently. Matches the exemplar in quality.</p></div></div>`, S));
    B.add(sec(`<div><div class="kicker" style="margin-bottom:1.5mm">How to mark in three steps</div><div class="steps">
      <div class="step"><b>Find the evidence</b>Each strand lists where to look (workbook answers, projects, group reads). Use 2–3 pieces, not one.</div>
      <div class="step"><b>Ask the one question</b>Each strand has a single "ask yourself" question. If the answer is a clear <i>yes</i>, it's Achieved.</div>
      <div class="step"><b>Compare &amp; tick</b>Partly yes → Working Towards. Not yet → Not Achieved. Tick the box on the class record.</div></div></div>`, S));
    B.add(sec(`<div class="band"><img src="${IMG("badge-kindness")}" alt=""><div><b>Tip: mark the pattern, not the one-off</b><p>Judge on the student's usual, consistent work. If a student reaches Achieved late in the unit, that's their level — update the record.</p></div></div>`, S));

    B.add(sec(`<div class="t-h2" style="margin-top:2mm"><div><h2 style="font-size:16pt">Rubric at a glance</h2><p>A one-page summary to keep beside you while marking.</p></div></div>`, S), { toc: { id: "t-glance" }, keep: true, brk: false });
    B.add(sec(`<table class="glance"><colgroup><col class="g-code"><col class="g-ask"><col><col><col></colgroup>
      <tr><th class="h-c">Strand</th><th class="h-c">Ask yourself</th><th class="h-na">Not Achieved</th><th class="h-wt">Working Towards</th><th class="h-a">Achieved</th></tr>
      ${MARKING_GUIDE.map((m) => `<tr><td class="c"><b>${m.code}</b><span>${m.label}</span></td><td>${m.ask}</td><td class="na">${m.na}</td><td class="wt">${m.wt}</td><td class="a">${m.ach}</td></tr>`).join("")}</table>`, S));

    MARKING_GUIDE.forEach((m, i) => {
      const wks = weeksFor(m.code);
      B.add(sec(`<div class="crit"><div class="cr-head"><div class="cr-code">${m.code}</div><div><div class="kicker">${m.strand}</div><h3>${m.label}</h3></div></div>
        <div class="cr-body">
          <div class="cr-curr"><div><b>Curriculum expectation</b><span class="curr">${m.curriculum}</span></div><div><b>Students should be able to</b>${m.expect}</div></div>
          <div class="ask"><span>Ask yourself:</span> ${m.ask}</div>
          <div class="cr-levels"><div class="lvl na"><b><span>NA</span>Not Achieved</b><p>${m.na}</p></div><div class="lvl wt"><b><span>WT</span>Working Towards</b><p>${m.wt}</p></div><div class="lvl a"><b><span>A</span>Achieved</b><p>${m.ach}</p></div></div>
          <div class="cr-ex"><div class="ex wt"><b>Working towards might look like</b><q>${m.wtSample}</q></div><div class="ex a"><img src="${IMG("badge-quiz-champion")}" alt=""><b>Exemplar — what Achieved looks like</b><q>${m.exemplar}</q></div></div>
          <div class="cr-foot"><span><b>Find evidence in:</b> ${m.evidence}</span><span><b>Focus weeks:</b> ${wks.length ? wks.join(", ") : "10"}</span></div>
        </div></div>`, S), i === 0 ? { brk: true, toc: { id: "t-crit" } } : {});
    });

    B.add(sec(`<div class="t-h2"><img src="${IMG("icon-presentation")}" alt=""><div><h2 style="font-size:16pt">Final project rubric (Week 10)</h2><p>Same three levels. The example shows what Achieved looks like.</p></div></div>`, S), { brk: true, toc: { id: "t-w10r" }, keep: true });
    B.add(sec(`<table class="w10-rubric"><tr><th class="h-c">Criteria</th><th class="h-na">Not Achieved</th><th class="h-wt">Working Towards</th><th class="h-a">Achieved</th></tr>
      ${WEEK10.rubric.map((r) => `<tr><td><b>${r.criteria}</b><br><span class="chip" style="margin-top:1mm">${r.code}</span></td><td>${r.na}</td><td>${r.wt}</td><td class="a">${r.a}<span class="eg">e.g. ${r.example}</span></td></tr>`).join("")}</table>`, S));
  }

  /* ---- record sheets ---- */
  if (all || SECTION === "record") {
    const rows = (from) => Array.from({ length: 15 }, (_, i) => from + i);
    const recordSheet = (from, first) => `
      <div class="rec-head" ${first ? 'data-toc="t-record"' : ""}><img src="${IMG("icon-rubric")}" alt=""><div><h2>Class achievement record</h2><p>Reading Progress Rubric · tick one box per strand for each student</p></div>
        <div class="rec-fields">Class <span class="fill-line"></span> Term <span class="fill-line" style="min-width:18mm"></span></div></div>
      <div class="rec-legend"><span class="k"><i style="background:var(--na)">NA</i>Not Achieved</span><span class="k"><i style="background:var(--wt)">WT</i>Working Towards</span><span class="k"><i style="background:var(--a)">A</i>Achieved (Level 3 expectation)</span><span>· Full descriptors and exemplars are in the Marking guide.</span></div>
      <table class="record"><colgroup><col style="width:7mm"><col style="width:46mm">${"<col>".repeat(30)}</colgroup>
        <tr><th rowspan="2">#</th><th rowspan="2" class="nm">Student name</th>${MARKING_GUIDE.map((m) => `<th colspan="3" class="sep">${m.code}<span class="crit-name">${m.label}</span></th>`).join("")}</tr>
        <tr class="sub">${MARKING_GUIDE.map(() => `<th class="na sep">NA</th><th class="wt">WT</th><th class="a">A</th>`).join("")}</tr>
        ${rows(from).map((n) => `<tr><td class="num">${n}</td><td class="nm"></td>${MARKING_GUIDE.map(() => `<td class="g1 sep"><span class="bx"></span></td><td class="g2"><span class="bx"></span></td><td class="g3"><span class="bx"></span></td>`).join("")}</tr>`).join("")}
      </table>
      <div class="rec-foot"><span>R1–R3 Listening, Reading &amp; Viewing · R4–R6 Speaking, Writing &amp; Presenting · R7–R9 Key Competencies · R10 Values</span><span>The Wild Robot · Teacher Pack</span></div>`;
    B.landscape(recordSheet(1, true));
    B.landscape(recordSheet(16, false));

    const trackerSheet = (from, first) => `
      <div class="rec-head" ${first ? 'data-toc="t-tracker"' : ""}><img src="${IMG("icon-journal")}" alt=""><div><h2>Weekly completion tracker</h2><p>Tick when done — or write the quiz score out of 20 in the Qz box</p></div>
        <div class="rec-fields">Class <span class="fill-line"></span> Term <span class="fill-line" style="min-width:18mm"></span></div></div>
      <div class="rec-legend"><span class="k"><i style="background:var(--sky-dark)">W</i>Workbook pages done</span><span class="k"><i style="background:var(--copper)">Q</i>Friday quiz</span><span class="k"><i style="background:var(--moss)">P</i>Weekly project</span><span class="k"><i style="background:var(--forest-2)">Pr</i>Week 10 presented</span><span class="k"><i style="background:var(--glow);color:var(--forest)">C</i>Certificate given</span></div>
      <table class="record"><colgroup><col style="width:7mm"><col style="width:42mm">${"<col>".repeat(30)}</colgroup>
        <tr><th rowspan="2">#</th><th rowspan="2" class="nm">Student name</th>${WEEKS.map((w) => `<th colspan="3" class="sep">Wk ${w.num}</th>`).join("")}<th colspan="3" class="sep">Wk 10</th></tr>
        <tr class="sub">${WEEKS.map(() => `<th class="sep">W</th><th>Q</th><th>P</th>`).join("")}<th class="sep">P</th><th>Pr</th><th>C</th></tr>
        ${rows(from).map((n) => `<tr><td class="num">${n}</td><td class="nm"></td>${Array.from({ length: 10 }, () => `<td class="sep"><span class="bx"></span></td><td><span class="bx"></span></td><td><span class="bx"></span></td>`).join("")}</tr>`).join("")}
      </table>
      <div class="rec-foot"><span>Weeks 1–9: reading &amp; projects · Week 10: final project, presentation and certificate</span><span>The Wild Robot · Teacher Pack</span></div>`;
    B.landscape(trackerSheet(1, true));
    B.landscape(trackerSheet(16, false));
  }
  B.finish();
}

/* ---------------- boot ---------------- */
async function boot() {
  const root = document.getElementById("book");
  const kind = document.body.dataset.book;
  const loading = document.getElementById("loading");
  // make sure web fonts are ready before measuring page content
  try {
    await Promise.race([
      Promise.all(["900 20px Fraunces", "700 20px Fraunces", "italic 500 20px Fraunces", "400 14px Nunito", "700 14px Nunito", "800 14px Nunito"].map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch (e) {}
  if (kind === "workbook") buildWorkbook(root); else buildTeacherPack(root);
  if (loading) loading.remove();
  const count = document.getElementById("pageCount");
  if (count) count.textContent = `${root.querySelectorAll(".page").length} pages`;
  if (params.get("print") === "1") setTimeout(() => window.print(), 600);
}
window.addEventListener("DOMContentLoaded", boot);
