#!/usr/bin/env python3
"""Generate crawlable SEO files from data.js. Run after tools/build_data.py:
    python3 tools/build_pages.py
Creates: subject/<code>.html, sitemap.xml, robots.txt
Updates (between markers): SEO meta in index/about/exam-system, static fallback in index.html,
and the subject link list on index.html."""
import json, re, os, html
SITE = 'https://nursing-notebook.vercel.app'
src = open('data.js', encoding='utf-8').read()
P = json.loads(re.search(r'const PROGRAM=(\[.*?\n\]);\n', src, re.S).group(1))
YEARS = sorted({int(y) for g in P for s in g['subjects'] for y in s['papers']}, reverse=True)
E = html.escape
def n(s): return sum(len(v) for v in s['papers'].values())
subs = [(g['label'], s) for g in P for s in g['subjects'] if n(s) or s.get('new')]
total = sum(n(s) for _, s in subs)
rng = f"{min(YEARS)} to {max(YEARS)}" if YEARS else ''
def meta(title, desc, path):
    u = SITE + path
    return (f'<!--SEO--><title>{E(title)}</title><meta name="description" content="{E(desc)}">'
            f'<link rel="canonical" href="{u}"><meta property="og:type" content="website"><meta property="og:site_name" content="Nursing Notebook">'
            f'<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{u}">'
            f'<meta name="twitter:card" content="summary"><!--/SEO-->')
def swap(text, a, b, new):
    pat = re.compile(re.escape(a) + r'.*?' + re.escape(b), re.S)
    return pat.sub(lambda m: new, text, count=1)
HEAD = open('index.html', encoding='utf-8').read()
ICON = re.search(r'<span class="mark">.*?</span>', HEAD, re.S).group(0)
BNAV = re.search(r'<nav class="bnav".*?</nav>', HEAD, re.S).group(0)
def abs_nav(t):  # make relative links work from /subject/
    return t.replace('href="#', 'href="../index.html#').replace('href="index.html', 'href="../index.html').replace('href="exam-system', 'href="../exam-system').replace('href="about', 'href="../about')
def subs_nav(prefix):
    out = []
    for lab, s in subs:
        out.append(f'<a href="{prefix}subject/{s["code"].lower()}.html">{E(s["name"])} ({s["code"]})</a>')
    return '<!--SUBS--><nav class="sublinks" aria-label="Browse by subject"><b>Browse by subject</b>' + ''.join(out) + '</nav><!--/SUBS-->'
os.makedirs('subject', exist_ok=True)
for lab, s in subs:
    code = s['code']
    title = f"{s['name']} ({code}) Question Papers | RMU B.Sc. Nursing | Nursing Notebook"
    desc = f"{s['name']} ({code}) past question papers for RMU B.Sc. in Nursing, {lab}. Written and MCQ, {rng}." if n(s) else f"{s['name']} ({code}), {lab}, RMU B.Sc. in Nursing. New subject with no previous question papers."
    if n(s):
        rows = ''.join(
            f'<div class="yr"><b>{y}</b><div class="bt">' + ''.join(
                f'<a class="pb{" m" if p["t"]=="MCQ" else ""}" href="{E(p["l"])}" target="_blank" rel="noopener noreferrer">{E(p["t"])}{(" " + E(p["s"].replace("Set ",""))) if p["s"] else ""}</a>'
                for p in s['papers'][y]) + '</div></div>'
            for y in sorted(s['papers'], reverse=True))
        body = f'<div class="acc open"><div class="body"><div>{rows}</div></div></div>'
    else:
        body = '<div class="card">New subject. No previous question papers exist.</div>'
    page = f'''<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f7f2e7">
{meta(title, desc, "/subject/" + code.lower() + ".html")}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../style.css"></head><body>
<header class="top"><div class="top-in"><a class="brand" href="../index.html#home">{ICON}Nursing Notebook</a>
<nav class="dnav" aria-label="Main"><a href="../index.html#home">Home</a><a href="../index.html#questions">Questions</a><a href="../exam-system.html">Exam System</a><a href="../about.html">About</a></nav></div></header>
<main><div class="page"><p class="sub"><a href="../index.html#questions">Questions</a> / {E(lab)}</p>
<h1 style="margin:6px 0 4px">{E(s["name"])} ({code}) Question Papers</h1>
<p class="sub" style="margin-bottom:14px">RMU B.Sc. in Nursing, {E(lab)}. Past written and MCQ papers by exam year.</p>
{body}</div></main>
{subs_nav("../")}
<footer>Nursing Notebook — Rajshahi Medical University (RMU) · B.Sc. in Nursing</footer>
{abs_nav(BNAV)}</body></html>'''
    open(f'subject/{code.lower()}.html', 'w', encoding='utf-8').write(page)
# index.html: SEO meta, static fallback, subject links
ix = open('index.html', encoding='utf-8').read()
t = "Nursing Notebook | RMU B.Sc. Nursing Question Bank (Written & MCQ)"
d = f"Free RMU B.Sc. in Nursing past question papers: {total} Written and MCQ papers, {rng}, sorted by year and subject with BNMC subject codes."
ix = re.sub(r'<meta name="description"[^>]*>', '', ix)
ix = re.sub(r'<title>.*?</title>', '', ix, flags=re.S) if '<!--SEO-->' not in ix else ix
if '<!--SEO-->' in ix: ix = swap(ix, '<!--SEO-->', '<!--/SEO-->', meta(t, d, '/'))
else: ix = ix.replace('<meta name="theme-color" content="#f7f2e7">', '<meta name="theme-color" content="#f7f2e7">\n' + meta(t, d, '/'), 1)
fb = '<!--SSR--><div class="page"><h1>RMU B.Sc. Nursing Question Bank</h1><p class="sub">' + E(d) + '</p>' + ''.join(
    f'<h2 class="sec">{E(g["label"])}</h2><p>' + ' · '.join(f'<a href="subject/{s["code"].lower()}.html">{E(s["name"])}</a>' for s in g["subjects"] if n(s) or s.get("new")) + '</p>' for g in P) + '</div><!--/SSR-->'
ix = re.sub(r'<main id="app">.*?</main>', lambda m: '<main id="app">' + fb + '</main>', ix, count=1, flags=re.S)
if '<!--SUBS-->' in ix: ix = swap(ix, '<!--SUBS-->', '<!--/SUBS-->', subs_nav(''))
else: ix = ix.replace('<footer>', subs_nav('') + '\n<footer>', 1)
open('index.html', 'w', encoding='utf-8').write(ix)
# about / exam-system: SEO meta only
for f, tt, dd, path in [('about.html', 'About Nursing Notebook | Free RMU Nursing Question Papers', 'About Nursing Notebook: a free archive of RMU B.Sc. Nursing past question papers, by a nursing student from Nursing and Midwifery College, Bogura.', '/about.html'),
                        ('exam-system.html', 'BNMC B.Sc. Nursing Exam System 2024: Marks, Credit, Pass Rules | Nursing Notebook', 'BNMC B.Sc. in Nursing 2024 exam system in brief: year-wise credit, hours, marks, pass criteria and question pattern.', '/exam-system.html')]:
    x = open(f, encoding='utf-8').read()
    if '<!--SEO-->' in x: x = swap(x, '<!--SEO-->', '<!--/SEO-->', meta(tt, dd, path))
    else:
        x = re.sub(r'<meta name="description"[^>]*>', '', x); x = re.sub(r'<title>.*?</title>', '', x, flags=re.S)
        x = x.replace('<meta name="theme-color" content="#f7f2e7">', '<meta name="theme-color" content="#f7f2e7">\n' + meta(tt, dd, path), 1)
    if f == 'exam-system.html':
        st = '<!--SSR--><div class="page"><h1>BNMC B.Sc. in Nursing Exam System 2024</h1><p class="sub">4-year course plus 6 months internship. 25 courses, 206 academic credit, 4,100 total marks. Pass mark is 60% in each segment (written, oral, practical, formative). Grades run from A+ (80% and above) to B (60% to under 65%); below 60% is F.</p></div><!--/SSR-->'
        x = re.sub(r'<main id="app">.*?</main>', lambda m: '<main id="app">' + st + '</main>', x, count=1, flags=re.S)
    open(f, 'w', encoding='utf-8').write(x)
# sitemap + robots
urls = ['/', '/about.html', '/exam-system.html'] + [f'/subject/{s["code"].lower()}.html' for _, s in subs]
open('sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'<url><loc>{SITE}{u}</loc></url>\n' for u in urls) + '</urlset>\n')
open('robots.txt', 'w', encoding='utf-8').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')
print('subject pages:', len(subs), '| sitemap urls:', len(urls))
