# Nursing Notebook

A free, static archive of past question papers for **B.Sc. in Nursing** (Rajshahi Medical University, BNMC 2024 curriculum), organised by academic year, subject and exam year. Diploma and Midwifery are planned for later.

Built by a nursing student from Nursing and Midwifery College, Bogura, to keep exam resources free and easy to find on a phone.

## Features

- Question papers (Written and MCQ), exam years 2018 to 2025, grouped by year and subject with BNMC subject codes
- Subject search by name or code
- BNMC 2024 exam-system guide (marks, credits, hours, pass criteria) with the official PDF
- Mobile-first, light page weight (plain HTML, CSS and JavaScript, no framework, no build step)
- Support page with contact links and a copy-to-clipboard donation number

## Project structure

```
index.html         Home and Questions (single page, hash routes)
exam-system.html   BNMC 2024 exam-system guide
about.html         About, FAQ, donate, contact
style.css          Shared design (all pages)
app.js             Rendering and routing for index.html
data.js            All site data (subjects, paper links, settings)
tools/build_data.py   Rebuilds paper links in data.js from the master CSV
tools/build_pages.py  Generates SEO files from data.js (subject pages, sitemap, robots)
subject/*.html     Generated, crawlable page per subject (do not edit by hand)
sitemap.xml        Generated
robots.txt         Generated
```

Routes on `index.html`: `#home`, `#questions`, `#questions/<year index>` (0 = 1st Year ... 3 = 4th Year).

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Adding or updating papers

The master CSV is the single source of truth. Columns:

`University, Course, Academic Year, Subject Name, Subject Code, Exam Year, Type, Set, File Name, Drive Link`

1. Add one row per paper. `Type` is `Written` or `MCQ`. `Set` is optional (for example `Set A`). `Drive Link` must be the full share link.
2. Rows with an empty `Drive Link` are skipped.
3. Run:

   ```
   python3 tools/build_data.py path/to/Master_Database.csv
   ```

4. The script keeps subject names, codes and settings in `data.js` and only rewrites the paper links. It stops with an error if the CSV contains a subject code that is not in `data.js`.
5. Regenerate the SEO files, then deploy:

   ```
   python3 tools/build_pages.py
   ```

   This rewrites `subject/*.html`, `sitemap.xml`, `robots.txt`, the meta tags, and the static fallback text in `index.html` and `exam-system.html`. Always run it after `build_data.py`, otherwise search engines see old paper lists.

### Paper data format (in `data.js`)

```js
{ name: "Anatomy", code: "B124", papers: { "2024": [ { t: "Written", s: "", l: "https://drive.google.com/..." } ] } }
```

A subject with `new: true` (currently B237, Laws Ethics and Forensic Nursing) is shown as a new subject with no previous papers instead of "Coming soon".

## Other settings in `data.js`

| Name | Purpose |
|------|---------|
| `EXAM_YEARS` | Years shown for each subject and in the "Exam years" stat |
| `PAY_NUMBER` | bKash / Nagad number on the support sections |
| `CONTACT` | Email, Facebook and Telegram links |
| `BNMC_PDF` | Drive file ID of the official BNMC 2024 curriculum PDF |
| `EXAM`, `YSUM`, `CAT` | Data for the exam-system page |

## Design

All pages share `style.css`. Main tokens (CSS variables on `:root`):

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#f7f2e7` | Paper-cream background |
| `--white` | `#fffdf9` | Card surface |
| `--ink` | `#1f1a17` | Text and dark buttons |
| `--red` | `#c93b2b` | Accent and active state |
| `--amber` | `#fbc02d` | Primary action |

Cards use dashed borders ("coupon" look). Icons are inline SVG that inherit the text colour.

## SEO

- Live site: https://nursing-notebook.vercel.app
- `robots.txt` allows all crawlers and points to `sitemap.xml`.
- Each subject has its own URL (`/subject/b124.html`) with its own title, description and canonical link, because crawlers ignore `#hash` routes.
- `index.html` and `exam-system.html` contain static text, so pages are readable without JavaScript. The script replaces it when JavaScript runs.
- After deploying, submit `https://nursing-notebook.vercel.app/sitemap.xml` in Google Search Console.

## Deploy

It is a static site with no build step on the host, so any static host works. It is currently served on Vercel: deploy the folder as a static project (framework preset: Other, no build command).

## Known limits

- Papers are hosted on Google Drive. Heavy traffic can trigger Drive's download quota. Consider a backup mirror as the archive grows.
- No papers yet for 3rd and 4th Year, 1st Year 2025, and B137 for 2018.
- No answers or solutions are provided, only question papers.

## Contact

- Email: tukitaki2025@gmail.com
- Telegram: https://t.me/nursing_N0TE
- Facebook: https://www.facebook.com/profile.php?id=61595863536930

Missing paper or broken link? Send it on Telegram or email and it will be added.
