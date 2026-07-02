# Uni Solution Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub Pages friendly solution-library platform for Uni-Ubi smart construction solutions, systems, documents, images, and future permission tiers.

**Architecture:** Create a self-contained static site under `uni-solution-library/`. The site reads structured JSON data, renders solution cards, platform products, system details, document lists, media assets, and permission tags in the browser. The structure keeps current GitHub Pages deployment simple while preserving clear upgrade paths to database/API-backed content later.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, JSON data files, Markdown/HTML content fragments, GitHub Pages.

---

### Task 1: Create Library Folder Structure

**Files:**
- Create: `uni-solution-library/index.html`
- Create: `uni-solution-library/solution.html`
- Create: `uni-solution-library/system.html`
- Create: `uni-solution-library/document.html`
- Create: `uni-solution-library/assets/css/styles.css`
- Create: `uni-solution-library/assets/js/app.js`
- Create: `uni-solution-library/assets/js/data-loader.js`
- Create: `uni-solution-library/assets/js/search.js`
- Create: `uni-solution-library/data/*.json`
- Create: `uni-solution-library/content/**`

- [ ] **Step 1: Add the self-contained folder tree**

Run:

```powershell
New-Item -ItemType Directory -Force uni-solution-library, uni-solution-library/assets/css, uni-solution-library/assets/js, uni-solution-library/assets/images, uni-solution-library/assets/documents, uni-solution-library/assets/thumbnails, uni-solution-library/data, uni-solution-library/content/systems, uni-solution-library/content/solutions, uni-solution-library/content/delivery
```

Expected: the folder tree exists without touching existing root pages.

- [ ] **Step 2: Add the HTML shells**

Create the four HTML pages. Each page loads shared CSS, shared JS, and renders content from JSON by route/query parameters.

- [ ] **Step 3: Verify local file access**

Run:

```powershell
Get-ChildItem -Recurse uni-solution-library | Select-Object FullName
```

Expected: all folders and entry pages are listed.

### Task 2: Build Static Data Model

**Files:**
- Create: `uni-solution-library/data/site.json`
- Create: `uni-solution-library/data/solutions.json`
- Create: `uni-solution-library/data/platforms.json`
- Create: `uni-solution-library/data/systems.json`
- Create: `uni-solution-library/data/documents.json`
- Create: `uni-solution-library/data/media.json`
- Create: `uni-solution-library/data/tags.json`
- Create: `uni-solution-library/data/relations.json`

- [ ] **Step 1: Define site metadata**

`site.json` stores project name, organization, version, generated date, default permission tiers, and navigation.

- [ ] **Step 2: Export existing formal solution data**

Use the local smart-site source data to populate platforms, domains, and 63 systems. Each system record includes overview, components, core functions, highlights, value, images, document relations, tags, and permission tier.

- [ ] **Step 3: Add document and media records**

Document records point to local HTML/Word/PPT/PDF assets when copied into the library. Media records point to rendered slide previews, platform screenshots, and material images.

- [ ] **Step 4: Validate JSON**

Run:

```powershell
python -m json.tool uni-solution-library/data/systems.json > $null
python -m json.tool uni-solution-library/data/solutions.json > $null
python -m json.tool uni-solution-library/data/media.json > $null
```

Expected: every command exits with code 0.

### Task 3: Implement Searchable Portal UI

**Files:**
- Create: `uni-solution-library/assets/css/styles.css`
- Create: `uni-solution-library/assets/js/data-loader.js`
- Create: `uni-solution-library/assets/js/search.js`
- Create: `uni-solution-library/assets/js/app.js`

- [ ] **Step 1: Implement data loader**

Load JSON files with `fetch()`, support both GitHub Pages and local browser access through fallback embedded manifest behavior.

- [ ] **Step 2: Implement search index**

Search over title, summary, category, tags, scenes, and system正文 fields. Support filters for category, industry, permission, and type.

- [ ] **Step 3: Implement index page**

Render overview metrics, knowledge-map cards, platform entries, system categories, document entries, media entries, and permission notes.

- [ ] **Step 4: Implement detail pages**

`solution.html`, `system.html`, and `document.html` read `?id=` from the URL and render the corresponding structured record.

- [ ] **Step 5: Add copy and deep-link functions**

System pages support copying structured system正文 and copying the current URL.

### Task 4: Copy Initial Assets

**Files:**
- Copy selected files into `uni-solution-library/assets/images/`
- Copy selected docs into `uni-solution-library/assets/documents/`

- [ ] **Step 1: Copy selected slide preview assets**

Copy the curated slide preview images from the working solution portal asset pool.

- [ ] **Step 2: Copy current formal solution HTML**

Copy the current formal long HTML solution into the library documents folder for external reference.

- [ ] **Step 3: Avoid sensitive raw documents**

Do not copy internal source PPT/Word files into the public GitHub Pages folder unless explicitly approved. Link them as internal placeholders instead.

### Task 5: Verify and Publish

**Files:**
- Inspect generated pages under `uni-solution-library/`

- [ ] **Step 1: Run static integrity checks**

Run:

```powershell
python -m json.tool uni-solution-library/data/systems.json > $null
python -m json.tool uni-solution-library/data/documents.json > $null
python -m json.tool uni-solution-library/data/media.json > $null
```

Expected: all JSON files are valid.

- [ ] **Step 2: Run browser smoke tests**

Open `uni-solution-library/index.html`, click solution, system, and document detail links, use search and filters, and verify no broken images are visible in the selected pages.

- [ ] **Step 3: Prepare GitHub Pages path**

After commit and push, the expected public URL is:

```text
https://jwu793230-debug.github.io/Temporary-display-URL/uni-solution-library/
```

Expected: GitHub Pages serves the new folder without changing existing pages.
