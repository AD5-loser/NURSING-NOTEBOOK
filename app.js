/**
 * Nursing Notebook - Core Application Logic
 * Scope: Phase 1 — B.Sc. in Nursing, Rajshahi Medical University (RMU)
 * Responsibilities: Rendering, Routing, Search, Accordion, Navigation, Statistics,
 *                   Animated component system (reveal, counters, Lottie, SVG icons)
 *
 * All counts / year ranges shown to the user are computed from NURSING_DATA (data.js).
 */

(function () {
  'use strict';

  const PAGE = (document.body && document.body.getAttribute('data-page')) || 'app';
  const prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // State Management
  const state = {
    currentRoute: 'home',
    routeParams: {},
    activeAccordionYear: '2024',
    searchQuery: '',
    mobileMenuOpen: false
  };

  /* ==========================================================================
     Data Helpers (strictly computed from data.js, never hardcoded)
     ========================================================================== */
  function getSubjectPaperCount(subject) {
    if (!subject || !subject.papers) return 0;
    let count = 0;
    for (const year in subject.papers) {
      if (subject.papers[year].written) count++;
      if (subject.papers[year].mcq) count++;
    }
    return count;
  }

  function getGlobalStats() {
    let totalPapers = 0;
    let subjectsWithContent = 0;
    let written = 0;
    let mcq = 0;
    const yearsSet = new Set();
    const writtenYears = new Set();
    const mcqYears = new Set();

    NURSING_DATA.years.forEach(year => {
      year.subjects.forEach(subject => {
        const subCount = getSubjectPaperCount(subject);
        if (subCount > 0) {
          subjectsWithContent++;
          totalPapers += subCount;
          for (const yr in subject.papers) {
            const p = subject.papers[yr];
            if (p.written) { written++; writtenYears.add(parseInt(yr, 10)); }
            if (p.mcq) { mcq++; mcqYears.add(parseInt(yr, 10)); }
            if (p.written || p.mcq) yearsSet.add(parseInt(yr, 10));
          }
        }
      });
    });

    const rangeOf = set => {
      const arr = Array.from(set).sort((a, b) => a - b);
      return arr.length ? { min: arr[0], max: arr[arr.length - 1] } : { min: '', max: '' };
    };
    const all = rangeOf(yearsSet);
    const wr = rangeOf(writtenYears);
    const mq = rangeOf(mcqYears);

    return {
      totalPapers,
      subjectsWithContent,
      written,
      mcq,
      minYear: all.min,
      maxYear: all.max,
      examRange: all.min && all.max ? `${all.min}–${all.max}` : '',
      writtenRange: wr.min && wr.max ? `${wr.min}–${wr.max}` : '',
      mcqRange: mq.min && mq.max ? `${mq.min}–${mq.max}` : '',
      mcqMinYear: mq.min,
      totalSubjects: NURSING_DATA.years.reduce((n, y) => n + y.subjects.length, 0),
      totalYears: NURSING_DATA.years.length
    };
  }

  function getYearStats(year) {
    let papers = 0;
    let subjects = 0;
    const yrs = new Set();
    year.subjects.forEach(s => {
      const c = getSubjectPaperCount(s);
      if (c > 0) {
        subjects++;
        papers += c;
        Object.keys(s.papers).forEach(y => yrs.add(parseInt(y, 10)));
      }
    });
    const arr = Array.from(yrs).sort((a, b) => a - b);
    return {
      papers,
      subjects,
      range: arr.length ? `${arr[0]}–${arr[arr.length - 1]}` : ''
    };
  }

  function findYearById(yearId) {
    return NURSING_DATA.years.find(y => y.id === yearId);
  }

  function findSubjectByCode(code) {
    for (const year of NURSING_DATA.years) {
      const subject = year.subjects.find(s => s.code.toLowerCase() === code.toLowerCase());
      if (subject) {
        return { subject, year };
      }
    }
    return null;
  }

  /* ==========================================================================
     Routing
     ========================================================================== */
  function parseHash() {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (!hash || hash === 'home') {
      return { route: 'home', params: {} };
    }
    if (hash === 'years' || hash === 'questions' || hash === 'programme') {
      return { route: 'programme', params: {} };
    }
    if (hash.startsWith('year/')) {
      const yearId = hash.replace('year/', '');
      return { route: 'year', params: { yearId } };
    }
    if (hash.startsWith('subject/')) {
      const code = hash.replace('subject/', '');
      return { route: 'subject', params: { code } };
    }
    return { route: 'home', params: {} };
  }

  // Search Engine (Preserves exact sequence of subjects)
  function performSearch(query) {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const results = [];
    NURSING_DATA.years.forEach(year => {
      year.subjects.forEach(subject => {
        const matchesName = subject.name.toLowerCase().includes(cleanQuery);
        const matchesCode = subject.code.toLowerCase().includes(cleanQuery);
        const matchesCategory = subject.category.toLowerCase().includes(cleanQuery);

        if (matchesName || matchesCode || matchesCategory) {
          results.push({
            subject,
            year,
            paperCount: getSubjectPaperCount(subject)
          });
        }
      });
    });

    return results;
  }

  // Breadcrumb Generator (Every previous level is clickable)
  function renderBreadcrumbs(currentRoute, params) {
    const breadcrumbList = document.getElementById('breadcrumb-list');
    if (!breadcrumbList) return;

    let items = [
      { label: 'Home', link: '#home' }
    ];

    if (currentRoute === 'programme') {
      items.push({ label: NURSING_DATA.programme, current: true });
    } else if (currentRoute === 'year') {
      items.push({ label: NURSING_DATA.programme, link: '#questions' });
      const yearObj = findYearById(params.yearId);
      items.push({ label: yearObj ? yearObj.name : '1st Year', current: true });
    } else if (currentRoute === 'subject') {
      items.push({ label: NURSING_DATA.programme, link: '#questions' });
      const found = findSubjectByCode(params.code);
      if (found) {
        items.push({ label: found.year.name, link: `#year/${found.year.id}` });
        items.push({ label: found.subject.name, current: true });
      } else {
        items.push({ label: 'Subject', current: true });
      }
    }

    breadcrumbList.innerHTML = items.map((item, index) => {
      const isLast = index === items.length - 1;
      if (isLast) {
        return `<li class="breadcrumb-item breadcrumb-current" aria-current="page">${escapeHtml(item.label)}</li>`;
      }
      return `
        <li class="breadcrumb-item">
          <a href="${item.link}">${escapeHtml(item.label)}</a>
          <span class="breadcrumb-separator">/</span>
        </li>
      `;
    }).join('');
  }

  /* ==========================================================================
     Animated SVG Icon Library (unified teal stroke style, CSS-animated parts)
     ========================================================================== */
  const ICONS = {
    // --- Subject icons ---
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.2A8 8 0 1 1 21 12z"/><circle class="anim-pulse" cx="9" cy="12" r="0.9" fill="currentColor"/><circle class="anim-pulse d2" cx="12.5" cy="12" r="0.9" fill="currentColor"/><circle class="anim-pulse d3" cx="16" cy="12" r="0.9" fill="currentColor"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path class="anim-scan" d="M7 10h3l1.5-2.5 2 5 1.5-2.5H17"/>',
    heads: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle class="anim-float" cx="17" cy="9" r="2.2"/><path class="anim-scan" d="M17 14c2.2 0 4 1.8 4 4"/>',
    body: '<circle class="anim-float" cx="12" cy="4.5" r="2"/><path d="M12 7v7M6 10l6-2 6 2M9 21l3-7 3 7"/><path class="anim-scan" d="M4 12h16"/>',
    heart: '<path class="anim-pulse" d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 22l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/><polyline class="anim-ecg" points="6 12.5 9 12.5 10.5 9.5 13 15 14.5 12.5 18 12.5"/>',
    microscope: '<path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2zM8 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/><circle class="anim-scan" cx="17" cy="15" r="1.2" fill="currentColor"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path class="anim-pulse" d="M12 8.5v6M9 11.5h6"/>',
    pill: '<g class="anim-float"><path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 0 1 7 7z"/><path d="M8.5 8.5l7 7"/></g>',
    baby: '<circle cx="12" cy="12" r="9"/><path d="M8 14.5s1.5 2 4 2 4-2 4-2"/><circle class="anim-pulse" cx="9" cy="10" r="0.9" fill="currentColor"/><circle class="anim-pulse d2" cx="15" cy="10" r="0.9" fill="currentColor"/><path d="M12 3c1-1 2.5-1 3 0"/>',
    steth: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v1a5 5 0 0 0 10 0v-2"/><circle class="anim-pulse" cx="20" cy="10" r="2"/>',
    bone: '<path class="anim-float" d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/>',
    leaf: '<path class="anim-float" d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    scale: '<path d="M12 3v18M5 21h14M6 7h12"/><path class="anim-float" d="M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
    cane: '<circle class="anim-float" cx="15" cy="4.5" r="1.8"/><path d="M15 8v6l-3 7M15 14l3 7M8 21V9a3 3 0 0 1 6 0"/>',
    mind: '<path d="M12 3a6 6 0 0 0-6 6c0 2 1 3 1.5 4.5V17h7v-3.5C15 12 18 11 18 9a6 6 0 0 0-6-6z"/><path d="M9.5 20h5"/><path class="anim-ecg" d="M9 9h1.5l1 2 1-4 1 2H15"/>',
    pulse: '<path class="anim-ecg" d="M3 12h4l2-5 4 10 2-5h6"/><circle class="anim-pulse" cx="21" cy="12" r="0.01"/>',
    community: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path class="anim-pulse" d="M12 12v5M9.5 14.5h5"/>',
    mother: '<circle class="anim-float" cx="12" cy="5" r="2"/><path d="M10 9c-1.2 3-1 6 1 8v4M14 9c2 3 2 6-1 8"/><path class="anim-scan" d="M12 12.5a2 2 0 1 0 0 .01"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path class="anim-draw" d="M8 12h8M8 16h5"/>',
    cap: '<path class="anim-float" d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c3 2.5 9 2.5 12 0v-4.5M22 9v6"/>',
    chart: '<path d="M4 20V4M4 20h16"/><polyline class="anim-draw" points="7 15 11 11 14 13 19 7"/>',

    // --- Interface / feature icons ---
    paper: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path class="anim-draw" d="M9 13h6M9 17h4"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path class="anim-draw" d="M9 7h6M9 11h4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle class="anim-pulse" cx="12" cy="15" r="1.5" fill="currentColor"/>',
    search: '<g class="anim-search"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></g>',
    check: '<circle cx="12" cy="12" r="9"/><path class="anim-draw" d="M8 12.5l2.7 2.7L16 9.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle class="anim-pulse" cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    layers: '<path class="anim-float" d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 2.5v3M9.5 2.5h5"/><path class="anim-hand" d="M12 13V8.5"/>',
    pen: '<g class="anim-write"><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/></g><path d="M3 21.5h18"/>',
    verified: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path class="anim-draw" d="M8.5 12l2.5 2.5 4.5-5"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/><path class="anim-scan" d="M10 6.5h4M10 9.5h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><ellipse class="anim-scan" cx="12" cy="12" rx="4" ry="9"/>',
    sitemap: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path class="anim-draw" d="M12 8v4M6 16v-4h12v4"/>'
  };

  const SUBJECT_ICONS = {
    B111: 'chat', B112: 'monitor', B113: 'heads', B124: 'body', B125: 'heart', B126: 'microscope', B137: 'shield',
    B231: 'shield', B232: 'baby', B233: 'steth', B224: 'pill', B235: 'bone', B226: 'leaf', B237: 'scale',
    B331: 'cane', B332: 'mind', B333: 'pulse', B334: 'steth', B335: 'community',
    B431: 'mother', B432: 'mother', B433: 'clipboard', B434: 'cap', B435: 'chart', B416: 'chat'
  };

  function svgIcon(name) {
    const inner = ICONS[name] || ICONS.steth;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
  }

  /* ==========================================================================
     Static Content Blocks (feature copy; no numeric facts hardcoded)
     ========================================================================== */
  const STEPS = [
    { icon: 'calendar', title: 'Choose your academic year', text: 'Start with the live 1st Year archive. Later years are being prepared and will appear here.' },
    { icon: 'search',   title: 'Pick a subject',            text: 'Browse the subject cards or search by name, subject code such as B124, or category.' },
    { icon: 'paper',    title: 'Open the question paper',   text: 'Expand an exam year and open the Written or MCQ paper in a new tab on Google Drive.' }
  ];

  const TIPS = [
    { icon: 'target', title: 'Start with the latest paper', text: 'The most recent exam shows the current question style and the depth expected from candidates.' },
    { icon: 'layers', title: 'Compare across years',        text: 'Open several years of the same subject and note which topics are asked again and again.' },
    { icon: 'timer',  title: 'Practise MCQs against the clock', text: 'Attempt an MCQ paper in one sitting with a timer to build speed and exam stamina.' },
    { icon: 'pen',    title: 'Rewrite written answers',     text: 'After reading a written paper, answer a few questions on paper and check them against your notes.' }
  ];

  const VALUES = [
    { icon: 'verified',  title: 'Verified content',        text: 'Subject codes, titles and sequence follow the Rajshahi Medical University curriculum exactly.' },
    { icon: 'sitemap',   title: 'Structured by curriculum', text: 'Papers are organised by academic year, subject, exam year and paper type.' },
    { icon: 'globe',     title: 'Open access',             text: 'No account or sign-up is needed. Choose a paper and open it straight away.' },
    { icon: 'phone',     title: 'Mobile ready',            text: 'Designed to work comfortably on small phone screens as well as laptops.' }
  ];

  const FAQ = [
    { q: 'How are the papers organised?', a: 'Every subject lists exam years from newest to oldest. Each year opens to its Written paper and, where available, its MCQ paper.' },
    { q: 'Why does 2018 show only a Written paper?', a: 'The 2018 examination was held in Written format only, so no MCQ paper exists for that year. Later years include both formats.' },
    { q: 'Where are the papers hosted?', a: 'Each button opens the paper directly on Google Drive in a new tab, where you can read or save it for offline study.' },
    { q: 'Do I need an account?', a: 'No. Nursing Notebook is an open archive. Pick a subject and start studying.' },
    { q: 'When will the 2nd, 3rd and 4th Year be added?', a: 'The archive is released in phases. 1st Year is live now and the remaining years are marked Coming Soon until their papers are ready.' }
  ];

  /* ==========================================================================
     Reusable Component Renderers
     ========================================================================== */
  function revealAttrs(index, extraClass) {
    return `class="${extraClass ? extraClass + ' ' : ''}reveal" style="--d:${Math.round((index || 0) * 90)}ms"`;
  }

  function renderStatsStrip(stats) {
    const items = [
      { id: 'stat-papers', icon: 'paper', value: String(stats.totalPapers), attrs: `data-count-to="${stats.totalPapers}"`, label: 'Available Question Papers' },
      { id: 'stat-subjects', icon: 'book', value: String(stats.subjectsWithContent), attrs: `data-count-to="${stats.subjectsWithContent}"`, label: 'Subjects with Content' },
      { id: 'stat-range', icon: 'calendar', value: stats.examRange, attrs: `data-range-from="${stats.minYear}" data-range-to="${stats.maxYear}"`, label: 'Exam Years Range' }
    ];
    return `
      <section class="stats-strip" aria-label="Archive Statistics">
        ${items.map((it, i) => `
          <div ${revealAttrs(i, 'stat-card')}>
            <span class="icon-tile" aria-hidden="true">${svgIcon(it.icon)}</span>
            <div class="stat-text">
              <div class="stat-value" id="${it.id}" ${it.attrs}>${escapeHtml(it.value)}</div>
              <div class="stat-label">${it.label}</div>
            </div>
          </div>
        `).join('')}
      </section>
    `;
  }

  function renderRoadmap() {
    return `
      <div class="roadmap reveal" role="list" aria-label="Four year degree roadmap">
        <span class="roadmap-line-fill" aria-hidden="true"></span>
        ${NURSING_DATA.years.map((yr, i) => {
          const live = yr.status === 'available';
          const tag = live ? 'a' : 'div';
          const href = live ? ` href="#year/${yr.id}"` : '';
          return `
            <${tag}${href} role="listitem" ${revealAttrs(i + 1, 'roadmap-node ' + (live ? 'live' : 'soon'))}>
              <span class="roadmap-dot" aria-hidden="true">${i + 1}</span>
              <span class="roadmap-body">
                <span class="roadmap-name">${escapeHtml(yr.name)}</span>
                <span class="roadmap-meta">${yr.subjects.length} subjects</span>
                <span class="year-status-badge ${live ? 'live' : 'soon'}">${live ? 'Live' : 'Coming Soon'}</span>
              </span>
            </${tag}>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderSteps() {
    return `
      <div class="steps-grid">
        ${STEPS.map((s, i) => `
          <div ${revealAttrs(i, 'step-card')}>
            <span class="step-num" aria-hidden="true">0${i + 1}</span>
            <span class="icon-tile" aria-hidden="true">${svgIcon(s.icon)}</span>
            <h3 class="step-title">${escapeHtml(s.title)}</h3>
            <p class="step-text">${escapeHtml(s.text)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderFeatureCards(items) {
    return `
      <div class="tips-grid">
        ${items.map((t, i) => `
          <div ${revealAttrs(i, 'tip-card tilt')}>
            <span class="icon-tile" aria-hidden="true">${svgIcon(t.icon)}</span>
            <h3 class="tip-title">${escapeHtml(t.title)}</h3>
            <p class="tip-text">${escapeHtml(t.text)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderPaperTypes(stats) {
    const writtenPct = stats.totalPapers ? Math.round((stats.written / stats.totalPapers) * 100) : 0;
    const mcqPct = stats.totalPapers ? 100 - writtenPct : 0;
    return `
      <div class="paper-types-grid">
        <div ${revealAttrs(0, 'type-card')}>
          <div class="type-card-top">
            <span class="icon-tile" aria-hidden="true">${svgIcon('paper')}</span>
            <span class="type-count" data-count-to="${stats.written}">${stats.written}</span>
          </div>
          <h3 class="type-title">Written Papers</h3>
          <p class="type-text">Descriptive questions answered in writing. Available for every exam year, ${escapeHtml(stats.writtenRange)}.</p>
        </div>
        <div ${revealAttrs(1, 'type-card')}>
          <div class="type-card-top">
            <span class="icon-tile" aria-hidden="true">${svgIcon('check')}</span>
            <span class="type-count" data-count-to="${stats.mcq}">${stats.mcq}</span>
          </div>
          <h3 class="type-title">MCQ Papers</h3>
          <p class="type-text">Multiple Choice Question papers for quick revision. Available from ${escapeHtml(String(stats.mcqMinYear))} onward, ${escapeHtml(stats.mcqRange)}.</p>
        </div>
        <div ${revealAttrs(2, 'type-card type-card-wide')}>
          <div class="type-split-head">
            <span class="type-title">Archive composition</span>
            <span class="type-split-note">${stats.written} Written + ${stats.mcq} MCQ = ${stats.totalPapers} papers</span>
          </div>
          <div class="split-bar" role="img" aria-label="${writtenPct} percent written, ${mcqPct} percent MCQ">
            <span class="split-seg split-written" style="--w:${writtenPct}%"></span>
            <span class="split-seg split-mcq" style="--w:${mcqPct}%"></span>
          </div>
          <div class="split-legend">
            <span><i class="legend-dot legend-written"></i>Written (${writtenPct}%)</span>
            <span><i class="legend-dot legend-mcq"></i>MCQ (${mcqPct}%)</span>
          </div>
          <p class="type-note">Note: 2018 includes Written papers only, so no MCQ paper is shown for that year.</p>
        </div>
      </div>
    `;
  }

  function renderSectionHeader(id, title, subtitle) {
    return `
      <div class="section-header reveal">
        <h2 ${id ? `id="${id}"` : ''} class="section-title">${title}</h2>
        ${subtitle ? `<span class="section-subtitle">${subtitle}</span>` : ''}
      </div>
    `;
  }

  /* ==========================================================================
     Views
     ========================================================================== */
  function renderHomeView() {
    const stats = getGlobalStats();
    const firstYear = NURSING_DATA.years.find(y => y.status === 'available') || NURSING_DATA.years[0];
    const firstYearStats = getYearStats(firstYear);

    return `
      <section class="hero-section">
        <div class="hero-layout">
          <div class="hero-content">
            <span class="hero-eyebrow">B.SC. IN NURSING</span>
            <h1 class="hero-title">Previous Examination Papers</h1>
            <p class="hero-description">
              Verified written and MCQ examination question bank for B.Sc. in Nursing students at ${escapeHtml(NURSING_DATA.university)}.
            </p>

            <div class="search-wrapper">
              <div class="search-input-container">
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input 
                  type="text" 
                  id="search-input" 
                  class="search-input" 
                  placeholder="Search by subject name, code (e.g. B124), or category..." 
                  aria-label="Search subjects by name, code or category"
                  autocomplete="off"
                  value="${escapeHtml(state.searchQuery)}"
                />
                <button type="button" id="search-clear-btn" class="search-clear-btn ${state.searchQuery ? 'visible' : ''}" aria-label="Clear search">
                  &times;
                </button>
              </div>
              <div class="hero-chips" role="group" aria-label="Quick searches">
                <span class="hero-chips-label">Try:</span>
                <button type="button" class="hero-chip" data-query="Anatomy">Anatomy</button>
                <button type="button" class="hero-chip" data-query="Physiology">Physiology</button>
                <button type="button" class="hero-chip" data-query="B137">B137</button>
                <button type="button" class="hero-chip" data-query="Foundational">Foundational</button>
              </div>
            </div>

            <svg class="hero-ecg" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path class="ecg-base" d="M0 20 H110 L124 20 L134 6 L148 34 L160 20 H300 L314 20 L324 6 L338 34 L350 20 H600" />
              <path class="ecg-live" pathLength="100" d="M0 20 H110 L124 20 L134 6 L148 34 L160 20 H300 L314 20 L324 6 L338 34 L350 20 H600" />
            </svg>
          </div>

          <!-- Animated Study Card (Phase 1) -->
          <a href="#year/${firstYear.id}" id="animated-feature-card" class="animated-feature-card lottie-host" aria-label="Explore ${escapeHtml(firstYear.name)} Exam Papers">
            <span class="animated-card-badge">
              <span class="animated-pulse-dot"></span>
              <span>${escapeHtml(firstYear.name)} Live Archive</span>
            </span>
            <div id="lottie-animation-box" class="lottie-container" data-lottie="studentNotebook" aria-hidden="true"></div>
            <div class="animated-card-content">
              <h3 class="animated-card-title">Study &amp; Prepare</h3>
              <p class="animated-card-desc">Practice with ${stats.totalPapers} authentic written &amp; MCQ papers from RMU.</p>
              <span class="animated-card-btn">
                <span>Explore ${escapeHtml(firstYear.name)}</span>
                <span class="card-arrow" aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </a>
        </div>
      </section>

      <!-- Search Results Area -->
      <section id="search-results-section" class="search-results-section ${state.searchQuery ? 'active' : ''}" aria-live="polite">
        <div class="search-header">
          <h3>Search Results</h3>
          <span id="search-results-count" class="search-count"></span>
        </div>
        <div id="search-results-grid" class="subjects-grid"></div>
      </section>

      <!-- Main Home Content (hidden during search) -->
      <div id="home-main-content" style="${state.searchQuery ? 'display: none;' : ''}">
        ${renderStatsStrip(stats)}

        <!-- Multi-Card Animated Resource Showcase -->
        <section class="animated-showcase-section" aria-labelledby="showcase-heading">
          ${renderSectionHeader('showcase-heading', 'Academic &amp; Clinical Highlights', 'Verified materials for nursing candidates')}

          <div class="animated-cards-grid">
            <a href="#year/${firstYear.id}" ${revealAttrs(0, 'animated-showcase-card tilt lottie-host')} id="showcase-card-exam" aria-label="${escapeHtml(firstYear.name)} Question Bank">
              <span class="animated-card-badge">
                <span class="animated-pulse-dot"></span>
                <span>Live Archive &bull; ${stats.totalPapers} Papers</span>
              </span>
              <div id="lottie-showcase-exam" class="lottie-box" data-lottie="graduation" aria-hidden="true"></div>
              <div class="card-content">
                <h3 class="card-title">${escapeHtml(firstYear.name)} Question Bank</h3>
                <p class="card-desc">${firstYearStats.subjects} subjects spanning ${escapeHtml(firstYearStats.range)}. Instant access to written and MCQ papers hosted on Google Drive.</p>
                <div class="card-action">
                  <span>Open Question Papers</span>
                  <span class="card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </a>

            <a href="#questions" ${revealAttrs(1, 'animated-showcase-card tilt lottie-host')} id="showcase-card-clinical" aria-label="Core Clinical Courses">
              <span class="animated-card-badge">
                <span class="animated-pulse-dot"></span>
                <span>RMU Syllabus</span>
              </span>
              <div id="lottie-showcase-clinical" class="lottie-box" data-lottie="medicalCare" aria-hidden="true"></div>
              <div class="card-content">
                <h3 class="card-title">Core Clinical Courses</h3>
                <p class="card-desc">Foundational Anatomy, Physiology, Pathology, and Nursing Fundamentals aligned with syllabus.</p>
                <div class="card-action">
                  <span>Explore Curriculum</span>
                  <span class="card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </a>

            <a href="#questions" ${revealAttrs(2, 'animated-showcase-card tilt lottie-host')} id="showcase-card-future" aria-label="Full ${stats.totalSubjects}-Subject Roadmap">
              <span class="animated-card-badge">
                <span class="animated-pulse-dot"></span>
                <span>${stats.totalYears}-Year Journey</span>
              </span>
              <div id="lottie-showcase-future" class="lottie-box" data-lottie="doctor" aria-hidden="true"></div>
              <div class="card-content">
                <h3 class="card-title">Full ${stats.totalSubjects}-Subject Roadmap</h3>
                <p class="card-desc">Structured overview across 1st, 2nd, 3rd, and 4th academic years under Rajshahi Medical University.</p>
                <div class="card-action">
                  <span>View ${stats.totalSubjects} Subjects</span>
                  <span class="card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </a>
          </div>
        </section>

        <!-- Academic Year Cards -->
        <section aria-labelledby="academic-years-heading">
          ${renderSectionHeader('academic-years-heading', 'Academic Years', escapeHtml(NURSING_DATA.programme))}
          <div class="years-grid">
            ${renderYearCards()}
          </div>
        </section>

        <!-- Degree Roadmap -->
        <section class="home-section" aria-labelledby="roadmap-heading">
          ${renderSectionHeader('roadmap-heading', 'Your ' + stats.totalYears + '-Year Journey', 'Where the archive stands today')}
          ${renderRoadmap()}
        </section>

        <!-- How it works -->
        <section class="home-section" aria-labelledby="steps-heading">
          ${renderSectionHeader('steps-heading', 'How It Works', 'Three simple steps')}
          ${renderSteps()}
        </section>

        <!-- Paper types -->
        <section class="home-section" aria-labelledby="types-heading">
          ${renderSectionHeader('types-heading', 'Know Your Paper Types', 'Written and MCQ formats')}
          ${renderPaperTypes(stats)}
        </section>

        <!-- Study tips -->
        <section class="home-section" aria-labelledby="tips-heading">
          ${renderSectionHeader('tips-heading', 'Study Smarter with Past Papers', 'Simple habits that work')}
          ${renderFeatureCards(TIPS)}
        </section>

        <!-- Complete RMU Syllabus -->
        <section class="curriculum-section" aria-labelledby="curriculum-heading">
          ${renderSectionHeader('curriculum-heading', 'Curriculum Structure (' + stats.totalSubjects + ' Subjects)', 'Rajshahi Medical University')}
          ${renderCurriculumOverview()}
        </section>
      </div>
    `;
  }

  function renderYearCards() {
    return NURSING_DATA.years.map((yr, i) => {
      const isAvailable = yr.status === 'available';
      if (isAvailable) {
        return `
          <a href="#year/${yr.id}" ${revealAttrs(i, 'year-card available')} aria-label="${escapeHtml(yr.name)} - ${yr.subjects.length} subjects available">
            <div class="year-card-top">
              <span class="year-sequence">${escapeHtml(yr.sequence)}</span>
              <span class="year-status-badge live"><span class="animated-pulse-dot"></span>Live</span>
            </div>
            <h3 class="year-card-title">${escapeHtml(yr.name)}</h3>
            <div class="shimmer-bar live" aria-hidden="true"></div>
            <div class="year-card-footer">
              <span>${yr.subjects.length} subjects available</span>
              <span class="card-arrow" aria-hidden="true">&rarr;</span>
            </div>
          </a>
        `;
      }
      return `
        <div ${revealAttrs(i, 'year-card coming-soon')} aria-label="${escapeHtml(yr.name)} - Coming Soon">
          <div class="year-card-top">
            <span class="year-sequence">${escapeHtml(yr.sequence)}</span>
            <span class="year-status-badge soon">Coming Soon</span>
          </div>
          <h3 class="year-card-title">${escapeHtml(yr.name)}</h3>
          <div class="shimmer-bar" aria-hidden="true"></div>
          <div class="year-card-footer">
            <span>${yr.subjects.length} subjects in preparation</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderCurriculumOverview() {
    return NURSING_DATA.years.map(yr => {
      const isAvailable = yr.status === 'available';
      return `
        <div class="curriculum-year-block reveal">
          <h3 class="curriculum-year-title">
            <span>${escapeHtml(yr.name)}</span>
            <span class="year-status-badge ${isAvailable ? 'live' : 'soon'}">
              ${isAvailable ? yr.subjects.length + ' Subjects Available' : 'Coming Soon (' + yr.subjects.length + ' Subjects)'}
            </span>
          </h3>
          <div class="subjects-grid">
            ${yr.subjects.map(sub => renderSubjectCard(sub, yr)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderSubjectCard(subject, year) {
    const paperCount = getSubjectPaperCount(subject);
    const isLive = year.status === 'available' && paperCount > 0;
    const iconName = SUBJECT_ICONS[subject.code] || 'steth';

    if (isLive) {
      const yearKeys = Object.keys(subject.papers || {}).sort();
      const coverage = yearKeys.map((y, i) => {
        const p = subject.papers[y];
        const label = p.written && p.mcq ? 'Written + MCQ' : 'Written only';
        return `<span class="cov-chip" style="--i:${i}" title="${y}: ${label}">&rsquo;${y.slice(2)}</span>`;
      }).join('');

      return `
        <a href="#subject/${escapeHtml(subject.code)}" class="subject-card" aria-label="${escapeHtml(subject.code)} ${escapeHtml(subject.name)} - ${paperCount} papers">
          <div class="subject-card-header">
            <span class="subject-animated-icon" aria-hidden="true">${svgIcon(iconName)}</span>
            <span class="subject-card-code-badge">${escapeHtml(subject.code)}</span>
          </div>
          <h4 class="subject-card-title">${escapeHtml(subject.name)}</h4>
          <div class="subject-card-middle">
            <span class="category-tag">${escapeHtml(subject.category)}</span>
          </div>
          <div class="coverage-row" aria-hidden="true">${coverage}</div>
          <div class="subject-card-footer">
            <span>${paperCount} papers</span>
            <span class="card-arrow" aria-hidden="true">&rarr;</span>
          </div>
        </a>
      `;
    }

    return `
      <div class="subject-card disabled" aria-label="${escapeHtml(subject.code)} ${escapeHtml(subject.name)} - Coming Soon">
        <div class="subject-card-header">
          <span class="subject-animated-icon muted" aria-hidden="true">${svgIcon(iconName)}</span>
          <span class="subject-card-code-badge muted">${escapeHtml(subject.code)}</span>
        </div>
        <h4 class="subject-card-title">${escapeHtml(subject.name)}</h4>
        <div class="subject-card-middle">
          <span class="category-tag muted">${escapeHtml(subject.category)}</span>
        </div>
        <div class="subject-card-footer">
          <span style="color: var(--color-muted-text);">Coming Soon</span>
        </div>
      </div>
    `;
  }

  function renderProgrammeView() {
    const stats = getGlobalStats();
    return `
      <section class="programme-view">
        <a href="#home" class="back-btn">&larr; Back to Home</a>
        <div class="hero-section" style="border-bottom: none; margin-bottom: 24px; padding-bottom: 0;">
          <span class="hero-eyebrow">Academic Curriculum</span>
          <h1 class="hero-title">${escapeHtml(NURSING_DATA.programme)}</h1>
          <p class="hero-description">
            Select an academic year below to access verified examination question papers.
          </p>
        </div>

        <div class="years-grid">
          ${renderYearCards()}
        </div>

        <section class="home-section" aria-labelledby="roadmap-heading">
          ${renderSectionHeader('roadmap-heading', 'Your ' + stats.totalYears + '-Year Journey', 'Where the archive stands today')}
          ${renderRoadmap()}
        </section>

        <section class="curriculum-section">
          ${renderSectionHeader('', 'All ' + stats.totalSubjects + ' Subjects by Academic Year', escapeHtml(NURSING_DATA.university))}
          ${renderCurriculumOverview()}
        </section>
      </section>
    `;
  }

  function renderYearView(yearId) {
    const year = findYearById(yearId);
    if (!year) {
      return `
        <div class="empty-notice">
          <h2>Academic Year Not Found</h2>
          <p>The requested academic year could not be found.</p>
          <a href="#home" class="back-btn" style="margin-top: 16px;">Return to Home</a>
        </div>
      `;
    }

    if (year.status !== 'available') {
      return `
        <div>
          <a href="#questions" class="back-btn">&larr; Back to Academic Years</a>
          <div class="hero-section">
            <span class="hero-eyebrow">Academic Year</span>
            <h1 class="hero-title">${escapeHtml(year.name)}</h1>
            <p class="hero-description">
              Question papers for ${escapeHtml(year.name)} are currently in preparation and will be available soon.
            </p>
            <div class="shimmer-bar wide" aria-hidden="true"></div>
          </div>
          <div class="subjects-grid">
            ${year.subjects.map(sub => renderSubjectCard(sub, year)).join('')}
          </div>
        </div>
      `;
    }

    const ys = getYearStats(year);
    return `
      <div class="year-view">
        <a href="#questions" class="back-btn">&larr; Back to Academic Years</a>

        <div class="subject-animated-hero-card lottie-host">
          <div class="subject-hero-left">
            <div class="subject-meta-row">
              <span class="hero-eyebrow" style="margin-bottom:0;">${escapeHtml(NURSING_DATA.university)}</span>
            </div>
            <h1 class="hero-title">${escapeHtml(year.name)} &mdash; Question Papers</h1>
            <p class="subject-detail-summary">
              Select a subject to view previous examination question papers (${escapeHtml(ys.range)}).
            </p>
            <div class="subject-card-highlights">
              <span class="highlight-pill"><span class="animated-pulse-dot"></span>${ys.subjects} subjects</span>
              <span class="highlight-pill">${ys.papers} papers</span>
              <span class="highlight-pill">${escapeHtml(ys.range)}</span>
            </div>
          </div>
          <div class="subject-hero-right">
            <div class="subject-hero-lottie-box" data-lottie="graduation" aria-hidden="true"></div>
          </div>
        </div>

        <div class="subjects-grid">
          ${year.subjects.map(sub => renderSubjectCard(sub, year)).join('')}
        </div>
      </div>
    `;
  }

  function renderSubjectPager(subject, year) {
    const idx = year.subjects.findIndex(s => s.code === subject.code);
    const prev = idx > 0 ? year.subjects[idx - 1] : null;
    const next = idx >= 0 && idx < year.subjects.length - 1 ? year.subjects[idx + 1] : null;
    const link = (s, dir) => {
      const live = year.status === 'available' && getSubjectPaperCount(s) > 0;
      if (!s || !live) return '<span></span>';
      return `
        <a href="#subject/${escapeHtml(s.code)}" class="pager-link ${dir}">
          <span class="pager-arrow" aria-hidden="true">${dir === 'prev' ? '&larr;' : '&rarr;'}</span>
          <span class="pager-text">
            <span class="pager-label">${dir === 'prev' ? 'Previous subject' : 'Next subject'}</span>
            <span class="pager-name">${escapeHtml(s.code)} &middot; ${escapeHtml(s.name)}</span>
          </span>
        </a>
      `;
    };
    return `<nav class="subject-pager" aria-label="Subject navigation">${link(prev, 'prev')}${link(next, 'next')}</nav>`;
  }

  function renderSubjectDetailView(code) {
    const found = findSubjectByCode(code);
    if (!found) {
      return `
        <div class="empty-notice">
          <h2>Subject Not Found</h2>
          <p>Subject code "${escapeHtml(code)}" was not found in the verified syllabus.</p>
          <a href="#home" class="back-btn" style="margin-top: 16px;">Return to Home</a>
        </div>
      `;
    }

    const { subject, year } = found;
    const paperCount = getSubjectPaperCount(subject);
    const examYears = Object.keys(subject.papers || {}).sort((a, b) => b - a); // Newest first (2024 -> 2018)

    let writtenCount = 0;
    let mcqCount = 0;
    examYears.forEach(y => {
      if (subject.papers[y].written) writtenCount++;
      if (subject.papers[y].mcq) mcqCount++;
    });
    const rangeText = examYears.length ? `${examYears[examYears.length - 1]}–${examYears[0]}` : '';
    const lottieKey = subject.category === 'Foundational' ? 'medicalCare' : (subject.category === 'Professional' ? 'doctor' : 'studentNotebook');
    const iconName = SUBJECT_ICONS[subject.code] || 'steth';

    // Ensure valid active accordion year
    if (!examYears.includes(state.activeAccordionYear) && examYears.length > 0) {
      state.activeAccordionYear = examYears[0];
    }

    return `
      <div class="subject-detail-view">
        <a href="#year/${year.id}" class="back-btn">&larr; Back to ${escapeHtml(year.name)} Subjects</a>

        <div class="subject-animated-hero-card lottie-host">
          <div class="subject-hero-left">
            <div class="subject-meta-row">
              <span class="subject-animated-icon" aria-hidden="true">${svgIcon(iconName)}</span>
              <span class="subject-detail-code">${escapeHtml(subject.code)}</span>
              <span class="category-tag">${escapeHtml(subject.category)}</span>
              <span class="year-status-badge live">${escapeHtml(year.name)}</span>
            </div>
            <h1 class="subject-detail-title">${escapeHtml(subject.name)}</h1>
            <p class="subject-detail-summary">
              ${paperCount} examination papers available across ${examYears.length} years (${escapeHtml(rangeText)}).
            </p>
            <div class="subject-card-highlights">
              <span class="highlight-pill">${writtenCount} Written</span>
              <span class="highlight-pill">${mcqCount} MCQ</span>
              <span class="highlight-pill">${escapeHtml(rangeText)}</span>
            </div>
          </div>
          <div class="subject-hero-right">
            <div class="subject-hero-lottie-box" data-lottie="${lottieKey}" aria-hidden="true"></div>
          </div>
        </div>

        <div class="section-header">
          <h2 class="section-title">Examination Papers by Year</h2>
          <span class="section-subtitle">Click a year to view questions</span>
        </div>

        <div class="accordion-wrapper" role="region" aria-label="Exam Years Accordion">
          ${examYears.map(yr => {
            const paperData = subject.papers[yr] || {};
            const isOpen = state.activeAccordionYear === yr;
            const hasWritten = Boolean(paperData.written);
            const hasMcq = Boolean(paperData.mcq);
            const yrCount = (hasWritten ? 1 : 0) + (hasMcq ? 1 : 0);

            return `
              <div class="accordion-item" data-item-year="${yr}">
                <button 
                  type="button" 
                  class="accordion-trigger" 
                  data-year="${yr}" 
                  aria-expanded="${isOpen ? 'true' : 'false'}"
                  aria-controls="panel-${yr}"
                  id="trigger-${yr}"
                >
                  <span class="accordion-year-label">
                    <span>${yr}</span>
                    <span class="accordion-year-badge">${yrCount} ${yrCount === 1 ? 'Paper' : 'Papers'}</span>
                  </span>
                  <span class="accordion-icon" aria-hidden="true">${isOpen ? '&minus;' : '&#43;'}</span>
                </button>
                <div 
                  id="panel-${yr}" 
                  class="accordion-panel ${isOpen ? 'open' : ''}" 
                  role="region" 
                  aria-labelledby="trigger-${yr}"
                  ${!isOpen ? 'hidden' : ''}
                >
                  <div class="paper-buttons-grid">
                    ${hasWritten ? `
                      <a href="${paperData.written}" target="_blank" rel="noopener noreferrer" class="paper-btn paper-btn-written">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Written Paper</span>
                      </a>
                    ` : ''}

                    ${hasMcq ? `
                      <a href="${paperData.mcq}" target="_blank" rel="noopener noreferrer" class="paper-btn paper-btn-mcq">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>MCQ Paper</span>
                      </a>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${renderSubjectPager(subject, year)}
      </div>
    `;
  }

  // HTML sanitizer
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ==========================================================================
     Main UI Update
     ========================================================================== */
  let lastSubjectCode = null;

  function updateUI() {
    const { route, params } = parseHash();
    state.currentRoute = route;
    state.routeParams = params;

    // Reset search query when navigating to another view
    if (route !== 'home') {
      state.searchQuery = '';
    }

    const mainContainer = document.getElementById('view-container');
    if (!mainContainer) return;

    renderBreadcrumbs(route, params);

    // Update active nav links
    document.querySelectorAll('.nav-item a, .mobile-nav-links a').forEach(el => {
      const href = el.getAttribute('href');
      if (route === 'home' && (href === '#home' || href === 'index.html' || href === './')) {
        el.classList.add('active');
      } else if ((route === 'programme' || route === 'year' || route === 'subject') && (href === '#questions' || href === '#programme')) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    destroyLottieAnimation();

    // Render corresponding view
    if (route === 'home') {
      mainContainer.innerHTML = renderHomeView();
      bindHomeEvents();
      if (state.searchQuery) {
        updateSearchResults();
      }
    } else if (route === 'programme') {
      mainContainer.innerHTML = renderProgrammeView();
    } else if (route === 'year') {
      mainContainer.innerHTML = renderYearView(params.yearId);
    } else if (route === 'subject') {
      // Open the newest exam year by default when entering a different subject
      if (lastSubjectCode !== params.code) {
        state.activeAccordionYear = null;
        lastSubjectCode = params.code;
      }
      mainContainer.innerHTML = renderSubjectDetailView(params.code);
      bindAccordion(mainContainer);
    }
    if (route !== 'subject') lastSubjectCode = null;

    // Page enter animation
    mainContainer.classList.remove('view-enter');
    void mainContainer.offsetWidth;
    mainContainer.classList.add('view-enter');

    mountLotties(mainContainer);
    setupReveal(mainContainer);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Event Listeners for Home Search
  function bindHomeEvents() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear-btn');

    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
      state.searchQuery = e.target.value;
      if (clearBtn) {
        if (state.searchQuery) {
          clearBtn.classList.add('visible');
        } else {
          clearBtn.classList.remove('visible');
        }
      }
      updateSearchResults();
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchInput.value) {
        searchInput.value = '';
        state.searchQuery = '';
        if (clearBtn) clearBtn.classList.remove('visible');
        updateSearchResults();
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        state.searchQuery = '';
        clearBtn.classList.remove('visible');
        updateSearchResults();
        searchInput.focus();
      });
    }

    document.querySelectorAll('.hero-chip').forEach(chip => {
      chip.addEventListener('click', function () {
        searchInput.value = this.getAttribute('data-query') || '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.focus();
      });
    });
  }

  function updateSearchResults() {
    const homeContent = document.getElementById('home-main-content');
    const searchResultsSection = document.getElementById('search-results-section');
    const grid = document.getElementById('search-results-grid');
    const countLabel = document.getElementById('search-results-count');

    if (!searchResultsSection || !grid) return;

    if (!state.searchQuery.trim()) {
      searchResultsSection.classList.remove('active');
      if (homeContent) homeContent.style.display = 'block';
      return;
    }

    if (homeContent) homeContent.style.display = 'none';
    searchResultsSection.classList.add('active');

    const matches = performSearch(state.searchQuery);
    countLabel.textContent = `${matches.length} ${matches.length === 1 ? 'subject' : 'subjects'} found`;

    if (matches.length === 0) {
      grid.innerHTML = `
        <div class="empty-notice" style="grid-column: 1 / -1;">
          <p>No subjects found matching "${escapeHtml(state.searchQuery)}".</p>
          <p style="font-size: 0.85rem; margin-top: 6px;">Try searching by subject name (e.g. Anatomy), code (e.g. B124), or category (e.g. Foundational).</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = matches.map(m => renderSubjectCard(m.subject, m.year)).join('');
  }

  // Accordion Logic: seamless DOM toggle, ONLY ONE item expanded at a time
  function bindAccordion(root) {
    const scope = root || document;
    const triggers = scope.querySelectorAll('.accordion-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', function () {
        const isCurrentlyExpanded = this.getAttribute('aria-expanded') === 'true';

        // 1. Collapse all items first
        triggers.forEach(btn => {
          const panel = document.getElementById(btn.getAttribute('aria-controls'));
          const icon = btn.querySelector('.accordion-icon');

          btn.setAttribute('aria-expanded', 'false');
          if (panel) {
            panel.classList.remove('open');
            panel.setAttribute('hidden', '');
          }
          if (icon) {
            icon.innerHTML = '&#43;';
          }
        });

        // 2. If it was not expanded, open this one
        if (!isCurrentlyExpanded) {
          this.setAttribute('aria-expanded', 'true');
          const activePanel = document.getElementById(this.getAttribute('aria-controls'));
          const activeIcon = this.querySelector('.accordion-icon');

          if (activePanel) {
            activePanel.classList.add('open');
            activePanel.removeAttribute('hidden');
          }
          if (activeIcon) {
            activeIcon.innerHTML = '&minus;';
          }
          if (this.hasAttribute('data-year')) state.activeAccordionYear = this.getAttribute('data-year');
        } else if (this.hasAttribute('data-year')) {
          state.activeAccordionYear = null;
        }
      });
    });
  }

  // Header and Mobile Navigation
  function initHeaderEvents() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', function () {
        state.mobileMenuOpen = !state.mobileMenuOpen;
        if (state.mobileMenuOpen) {
          mobileNav.classList.add('open');
          menuBtn.setAttribute('aria-expanded', 'true');
        } else {
          mobileNav.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close mobile menu on clicking any navigation link
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function () {
          state.mobileMenuOpen = false;
          mobileNav.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ==========================================================================
     Motion Engine: Lottie, Scroll Reveal, Counters, Tilt, Global Effects
     ========================================================================== */
  let activeLottieAnims = [];

  // Any element carrying data-lottie="<key>" is mounted with the bundled (offline) animation.
  function mountLotties(root) {
    if (typeof lottie === 'undefined' || !window.ANIMATIONS) return;
    (root || document).querySelectorAll('[data-lottie]').forEach(container => {
      const data = window.ANIMATIONS[container.getAttribute('data-lottie')];
      if (!data) return;
      container.innerHTML = '';
      try {
        const anim = lottie.loadAnimation({
          container: container,
          renderer: 'svg',
          loop: true,
          autoplay: !prefersReducedMotion,
          animationData: data
        });
        activeLottieAnims.push(anim);

        const host = container.closest('.lottie-host') || container.parentElement;
        if (host && !prefersReducedMotion) {
          host.addEventListener('mouseenter', () => anim.setSpeed(1.35));
          host.addEventListener('mouseleave', () => anim.setSpeed(1));
        }
      } catch (err) {
        console.warn('Animation load error', err);
      }
    });
  }

  function destroyLottieAnimation() {
    activeLottieAnims.forEach(anim => {
      try {
        anim.destroy();
      } catch (e) {}
    });
    activeLottieAnims = [];
  }

  // Number count-up (final text is always the true computed value)
  function animateCounter(node) {
    if (node.getAttribute('data-counted')) return;
    node.setAttribute('data-counted', '1');
    if (prefersReducedMotion) return;

    const isRange = node.hasAttribute('data-range-from');
    const to = parseInt(node.getAttribute(isRange ? 'data-range-to' : 'data-count-to'), 10);
    const from = isRange ? parseInt(node.getAttribute('data-range-from'), 10) : 0;
    if (isNaN(to) || isNaN(from)) return;

    const finalText = node.textContent;
    const duration = 1300;
    const start = performance.now();

    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(from + (to - from) * eased);
      node.textContent = isRange ? `${from}–${value}` : String(value);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        node.textContent = finalText;
      }
    }
    requestAnimationFrame(step);
  }

  function runCounters(el) {
    const nodes = Array.from(el.querySelectorAll('[data-count-to], [data-range-from]'));
    if (el.matches && el.matches('[data-count-to], [data-range-from]')) nodes.push(el);
    nodes.forEach(animateCounter);
  }

  let revealObserver = null;

  function setupReveal(root) {
    const els = (root || document).querySelectorAll('.reveal:not(.in)');
    if (!els.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(el => { el.classList.add('in'); runCounters(el); });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            runCounters(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    }
    els.forEach(el => revealObserver.observe(el));
  }

  // Subtle pointer tilt for .tilt cards (mouse only)
  function initTilt() {
    if (prefersReducedMotion) return;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !e.target.closest) return;
      const el = e.target.closest('.tilt');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
    });
    document.addEventListener('pointerout', function (e) {
      if (!e.target.closest) return;
      const el = e.target.closest('.tilt');
      if (el && !el.contains(e.relatedTarget)) {
        el.style.removeProperty('--rx');
        el.style.removeProperty('--ry');
      }
    });
  }

  // Scroll progress bar, sticky header shadow, back-to-top button
  function initGlobalEffects() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    const topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.id = 'back-to-top';
    topBtn.className = 'back-to-top';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
    document.body.appendChild(topBtn);

    const header = document.querySelector('.site-header');
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const y = window.scrollY || doc.scrollTop;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
        if (header) header.classList.toggle('scrolled', y > 8);
        topBtn.classList.toggle('visible', y > 480);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // "/" focuses the search box on the home view
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const input = document.getElementById('search-input');
      if (input) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /* ==========================================================================
     About Page (data-page="about")
     ========================================================================== */
  function initAboutPage() {
    const stats = getGlobalStats();

    // Computed text placeholders
    document.querySelectorAll('[data-stat]').forEach(el => {
      const key = el.getAttribute('data-stat');
      if (stats[key] !== undefined) el.textContent = stats[key];
    });

    const set = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };

    set('about-stats', renderStatsStrip(stats));
    set('about-values', renderFeatureCards(VALUES));
    set('about-steps', renderSteps());
    set('about-paper-types', renderPaperTypes(stats));
    set('about-roadmap', renderRoadmap());

    set('about-faq', `
      <div class="accordion-wrapper">
        ${FAQ.map((f, i) => `
          <div class="accordion-item">
            <button type="button" class="accordion-trigger" id="faq-trigger-${i}" aria-expanded="false" aria-controls="faq-panel-${i}">
              <span class="accordion-year-label faq-q">${escapeHtml(f.q)}</span>
              <span class="accordion-icon" aria-hidden="true">&#43;</span>
            </button>
            <div id="faq-panel-${i}" class="accordion-panel" role="region" aria-labelledby="faq-trigger-${i}" hidden>
              <p class="faq-answer">${escapeHtml(f.a)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `);

    set('about-curriculum-body', NURSING_DATA.years.map(yr => {
      const live = yr.status === 'available';
      const ys = getYearStats(yr);
      const codes = yr.subjects.map(s => s.code).join(', ');
      return `
        <tr>
          <td><strong>${escapeHtml(yr.name)}</strong></td>
          <td>${yr.subjects.length} Subjects (${escapeHtml(codes)})</td>
          <td>${live ? `${ys.papers} Papers (${escapeHtml(ys.range)})` : 'Papers in digitizing queue'}</td>
          <td><span class="year-status-badge ${live ? 'live' : 'soon'}">${live ? 'Live' : 'Coming Soon'}</span></td>
        </tr>
      `;
    }).join(''));

    bindAccordion(document.getElementById('about-faq'));
    mountLotties(document);
    setupReveal(document);
  }

  /* ==========================================================================
     Initialize Application
     ========================================================================== */
  function init() {
    if (typeof NURSING_DATA === 'undefined') {
      console.error('NURSING_DATA is not defined. Ensure data.js is loaded prior to app.js.');
      return;
    }

    initHeaderEvents();
    initGlobalEffects();
    initTilt();

    if (PAGE === 'about') {
      initAboutPage();
      return;
    }

    initKeyboardShortcuts();
    window.addEventListener('hashchange', updateUI);
    updateUI();
  }

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
