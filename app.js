/**
 * Nursing Notebook - Core Application Logic
 * Scope: Phase 1 — B.Sc. in Nursing, Rajshahi Medical University (RMU)
 * Responsibilities: Rendering, Routing, Search, Accordion, Navigation, Statistics
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentRoute: 'home',
    routeParams: {},
    activeAccordionYear: '2024',
    searchQuery: '',
    mobileMenuOpen: false
  };

  // Helper Functions for Data Calculations (Strictly computed from data.js, never hardcoded)
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
    let yearsSet = new Set();

    NURSING_DATA.years.forEach(year => {
      year.subjects.forEach(subject => {
        const subCount = getSubjectPaperCount(subject);
        if (subCount > 0) {
          subjectsWithContent++;
          totalPapers += subCount;
          for (const yr in subject.papers) {
            if (subject.papers[yr].written || subject.papers[yr].mcq) {
              yearsSet.add(parseInt(yr, 10));
            }
          }
        }
      });
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
    const minYear = sortedYears.length > 0 ? sortedYears[0] : '';
    const maxYear = sortedYears.length > 0 ? sortedYears[sortedYears.length - 1] : '';
    const examRange = minYear && maxYear ? `${minYear}–${maxYear}` : '';

    return {
      totalPapers,
      subjectsWithContent,
      examRange
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

  // Routing Handler
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

  // Views Rendering
  function renderHomeView() {
    const stats = getGlobalStats();

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
                  autocomplete="off"
                  value="${escapeHtml(state.searchQuery)}"
                />
                <button type="button" id="search-clear-btn" class="search-clear-btn ${state.searchQuery ? 'visible' : ''}" aria-label="Clear search">
                  &times;
                </button>
              </div>
            </div>
          </div>

          <!-- Animated Study Card (Phase 1) -->
          <a href="#year/1st-year" id="animated-feature-card" class="animated-feature-card" aria-label="Explore 1st Year Exam Papers">
            <span class="animated-card-badge">
              <span class="animated-pulse-dot"></span>
              <span>1st Year Live Archive</span>
            </span>
            <div id="lottie-animation-box" class="lottie-container" aria-hidden="true"></div>
            <div class="animated-card-content">
              <h3 class="animated-card-title">Study &amp; Prepare</h3>
              <p class="animated-card-desc">Practice with 91 authentic written &amp; MCQ papers from RMU.</p>
              <span class="animated-card-btn">
                <span>Explore 1st Year</span>
                <span class="card-arrow" aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </a>
        </div>
      </section>

      <!-- Search Results Area -->
      <section id="search-results-section" class="search-results-section ${state.searchQuery ? 'active' : ''}">
        <div class="search-header">
          <h3>Search Results</h3>
          <span id="search-results-count" class="search-count"></span>
        </div>
        <div id="search-results-grid" class="subjects-grid"></div>
      </section>

      <!-- Main Home Content (hidden during search) -->
      <div id="home-main-content" style="${state.searchQuery ? 'display: none;' : ''}">
        <!-- Statistics Strip (strictly computed) -->
        <section class="stats-strip" aria-label="Archive Statistics">
          <div class="stat-card">
            <div class="stat-value" id="stat-papers">${stats.totalPapers}</div>
            <div class="stat-label">Available Question Papers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-subjects">${stats.subjectsWithContent}</div>
            <div class="stat-label">Subjects with Content</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-range">${stats.examRange}</div>
            <div class="stat-label">Exam Years Range</div>
          </div>
        </section>

        <!-- Multi-Card Animated Resource Showcase -->
        <section class="animated-showcase-section" aria-labelledby="showcase-heading">
          <div class="section-header">
            <h2 id="showcase-heading" class="section-title">Academic &amp; Clinical Highlights</h2>
            <span class="section-subtitle">Verified materials for nursing candidates</span>
          </div>

          <div class="animated-cards-grid">
            <!-- Card 1: 1st Year Exam Papers -->
            <a href="#year/1st-year" class="animated-showcase-card" id="showcase-card-exam" aria-label="1st Year Question Bank">
              <span class="animated-card-badge">
                <span class="animated-pulse-dot"></span>
                <span>Live Archive &bull; 91 Papers</span>
              </span>
              <div id="lottie-showcase-exam" class="lottie-box" aria-hidden="true"></div>
              <div class="card-content">
                <h3 class="card-title">1st Year Question Bank</h3>
                <p class="card-desc">7 subjects spanning 2018 to 2024. Instant access to written and MCQ papers hosted on Google Drive.</p>
                <div class="card-action">
                  <span>Open Question Papers</span>
                  <span class="card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </a>

            <!-- Card 2: Core Nursing & Clinical Subjects -->
            <a href="#questions" class="animated-showcase-card" id="showcase-card-clinical" aria-label="Core Clinical Courses">
              <span class="animated-card-badge">
                <span class="animated-pulse-dot"></span>
                <span>RMU Syllabus</span>
              </span>
              <div id="lottie-showcase-clinical" class="lottie-box" aria-hidden="true"></div>
              <div class="card-content">
                <h3 class="card-title">Core Clinical Courses</h3>
                <p class="card-desc">Foundational Anatomy, Physiology, Pathology, and Nursing Fundamentals aligned with syllabus.</p>
                <div class="card-action">
                  <span>Explore Curriculum</span>
                  <span class="card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </a>

            <!-- Card 3: Degree Progress & Future Years -->
            <a href="#questions" class="animated-showcase-card" id="showcase-card-future" aria-label="Full 25-Subject Roadmap">
              <span class="animated-card-badge">
                <span class="animated-pulse-dot"></span>
                <span>4-Year Journey</span>
              </span>
              <div id="lottie-showcase-future" class="lottie-box" aria-hidden="true"></div>
              <div class="card-content">
                <h3 class="card-title">Full 25-Subject Roadmap</h3>
                <p class="card-desc">Structured overview across 1st, 2nd, 3rd, and 4th academic years under Rajshahi Medical University.</p>
                <div class="card-action">
                  <span>View 25 Subjects</span>
                  <span class="card-arrow" aria-hidden="true">&rarr;</span>
                </div>
              </div>
            </a>
          </div>
        </section>

        <!-- Academic Year Cards -->
        <section aria-labelledby="academic-years-heading">
          <div class="section-header">
            <h2 id="academic-years-heading" class="section-title">Academic Years</h2>
            <span class="section-subtitle">${escapeHtml(NURSING_DATA.programme)}</span>
          </div>

          <div class="years-grid">
            ${renderYearCards()}
          </div>
        </section>

        <!-- Complete RMU Syllabus (25 Subjects across 4 Years) -->
        <section class="curriculum-section" aria-labelledby="curriculum-heading">
          <div class="section-header">
            <h2 id="curriculum-heading" class="section-title">Curriculum Structure (25 Subjects)</h2>
            <span class="section-subtitle">Rajshahi Medical University</span>
          </div>
          ${renderCurriculumOverview()}
        </section>
      </div>
    `;
  }

  function renderYearCards() {
    return NURSING_DATA.years.map(yr => {
      const isAvailable = yr.status === 'available';
      if (isAvailable) {
        return `
          <a href="#year/${yr.id}" class="year-card available" aria-label="${yr.name} - ${yr.subjects.length} subjects available">
            <div class="year-card-top">
              <span class="year-sequence">${yr.sequence}</span>
              <span class="year-status-badge live">Live</span>
            </div>
            <h3 class="year-card-title">${escapeHtml(yr.name)}</h3>
            <div class="year-card-footer">
              <span>${yr.subjects.length} subjects available</span>
              <span class="card-arrow">&rarr;</span>
            </div>
          </a>
        `;
      } else {
        return `
          <div class="year-card coming-soon" aria-label="${yr.name} - Coming Soon">
            <div class="year-card-top">
              <span class="year-sequence">${yr.sequence}</span>
              <span class="year-status-badge soon">Coming Soon</span>
            </div>
            <h3 class="year-card-title">${escapeHtml(yr.name)}</h3>
            <div class="year-card-footer">
              <span>Coming Soon</span>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  function renderCurriculumOverview() {
    return NURSING_DATA.years.map(yr => {
      const isAvailable = yr.status === 'available';
      return `
        <div class="curriculum-year-block">
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

    if (isLive) {
      return `
        <a href="#subject/${subject.code}" class="subject-card" aria-label="${subject.code} ${subject.name}">
          <div class="subject-card-code">${escapeHtml(subject.code)}</div>
          <h4 class="subject-card-title">${escapeHtml(subject.name)}</h4>
          <div class="subject-card-middle">
            <span class="category-tag">${escapeHtml(subject.category)}</span>
          </div>
          <div class="subject-card-footer">
            <span>${paperCount} papers</span>
            <span class="card-arrow">&rarr;</span>
          </div>
        </a>
      `;
    } else {
      return `
        <div class="subject-card disabled" aria-label="${subject.code} ${subject.name} - Coming Soon">
          <div class="subject-card-code">${escapeHtml(subject.code)}</div>
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
  }

  function renderProgrammeView() {
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

        <section class="curriculum-section">
          <div class="section-header">
            <h2 class="section-title">All 25 Subjects by Academic Year</h2>
            <span class="section-subtitle">${escapeHtml(NURSING_DATA.university)}</span>
          </div>
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
          </div>
          <div class="subjects-grid">
            ${year.subjects.map(sub => renderSubjectCard(sub, year)).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="year-view">
        <a href="#questions" class="back-btn">&larr; Back to Academic Years</a>
        <div class="hero-section" style="border-bottom: none; margin-bottom: 24px; padding-bottom: 0;">
          <span class="hero-eyebrow">${escapeHtml(NURSING_DATA.university)}</span>
          <h1 class="hero-title">${escapeHtml(year.name)} &mdash; Question Papers</h1>
          <p class="hero-description">
            Select a subject to view previous examination question papers (2018–2024).
          </p>
        </div>

        <div class="subjects-grid">
          ${year.subjects.map(sub => renderSubjectCard(sub, year)).join('')}
        </div>
      </div>
    `;
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

    // Ensure valid active accordion year
    if (!examYears.includes(state.activeAccordionYear) && examYears.length > 0) {
      state.activeAccordionYear = examYears[0];
    }

    return `
      <div class="subject-detail-view">
        <a href="#year/${year.id}" class="back-btn">&larr; Back to ${escapeHtml(year.name)} Subjects</a>

        <div class="subject-header-box">
          <div class="subject-meta-row">
            <span class="subject-detail-code">${escapeHtml(subject.code)}</span>
            <span class="category-tag">${escapeHtml(subject.category)}</span>
            <span class="year-status-badge live">${escapeHtml(year.name)}</span>
          </div>
          <h1 class="subject-detail-title">${escapeHtml(subject.name)}</h1>
          <p class="subject-detail-summary">
            ${paperCount} examination papers available across ${examYears.length} years (2018–2024).
          </p>
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

  // Main UI Update
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

    // Render corresponding view
    if (route === 'home') {
      mainContainer.innerHTML = renderHomeView();
      bindHomeEvents();
      initLottieAnimation();
      if (state.searchQuery) {
        updateSearchResults();
      }
    } else {
      destroyLottieAnimation();
      if (route === 'programme') {
        mainContainer.innerHTML = renderProgrammeView();
      } else if (route === 'year') {
        mainContainer.innerHTML = renderYearView(params.yearId);
      } else if (route === 'subject') {
        mainContainer.innerHTML = renderSubjectDetailView(params.code);
        bindSubjectAccordionEvents();
      }
    }

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

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        state.searchQuery = '';
        clearBtn.classList.remove('visible');
        updateSearchResults();
        searchInput.focus();
      });
    }
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

  // Accordion Logic: Seamless DOM toggle, ONLY ONE year expanded at a time
  function bindSubjectAccordionEvents() {
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');
    accordionTriggers.forEach(trigger => {
      trigger.addEventListener('click', function () {
        const clickedYear = this.getAttribute('data-year');
        const isCurrentlyExpanded = this.getAttribute('aria-expanded') === 'true';

        // 1. Collapse all items first
        accordionTriggers.forEach(btn => {
          const y = btn.getAttribute('data-year');
          const panel = document.getElementById(`panel-${y}`);
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
          const activePanel = document.getElementById(`panel-${clickedYear}`);
          const activeIcon = this.querySelector('.accordion-icon');

          if (activePanel) {
            activePanel.classList.add('open');
            activePanel.removeAttribute('hidden');
          }
          if (activeIcon) {
            activeIcon.innerHTML = '&minus;';
          }
          state.activeAccordionYear = clickedYear;
        } else {
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

  // Lottie Animation Management (Multiple Animated Cards)
  let activeLottieAnims = [];

  function initLottieAnimation() {
    if (typeof lottie === 'undefined' || !window.ANIMATIONS) return;

    destroyLottieAnimation();

    const animConfigs = [
      {
        containerId: 'lottie-animation-box',
        cardId: 'animated-feature-card',
        data: window.ANIMATIONS.studentNotebook || window.ANIMATIONS.graduation,
        speed: 1.0,
        hoverSpeed: 1.25
      },
      {
        containerId: 'lottie-showcase-exam',
        cardId: 'showcase-card-exam',
        data: window.ANIMATIONS.graduation,
        speed: 1.0,
        hoverSpeed: 1.3
      },
      {
        containerId: 'lottie-showcase-clinical',
        cardId: 'showcase-card-clinical',
        data: window.ANIMATIONS.medicalCare,
        speed: 1.0,
        hoverSpeed: 1.25
      },
      {
        containerId: 'lottie-showcase-future',
        cardId: 'showcase-card-future',
        data: window.ANIMATIONS.doctor,
        speed: 1.0,
        hoverSpeed: 1.25
      }
    ];

    animConfigs.forEach(cfg => {
      const container = document.getElementById(cfg.containerId);
      if (container && cfg.data) {
        container.innerHTML = '';
        try {
          const anim = lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: cfg.data
          });

          activeLottieAnims.push(anim);

          const card = document.getElementById(cfg.cardId);
          if (card) {
            card.addEventListener('mouseenter', () => anim.setSpeed(cfg.hoverSpeed));
            card.addEventListener('mouseleave', () => anim.setSpeed(cfg.speed));
          }
        } catch (err) {
          console.warn('Animation load error for ' + cfg.containerId, err);
        }
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

  // Initialize Application
  function init() {
    if (typeof NURSING_DATA === 'undefined') {
      console.error('NURSING_DATA is not defined. Ensure data.js is loaded prior to app.js.');
      return;
    }

    initHeaderEvents();
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
