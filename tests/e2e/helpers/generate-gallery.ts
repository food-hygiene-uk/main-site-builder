import * as path from "node:path";
import * as fs from "node:fs/promises";
import type { StepRecord } from "./journey-helper.ts";

const SCREENSHOTS_ROOT = path.resolve("./test-results/screenshots");
const RECORDS_DIR = path.join(SCREENSHOTS_ROOT, ".records");
const MANIFEST_PATH = path.join(SCREENSHOTS_ROOT, "manifest.json");
const GALLERY_HTML_PATH = path.join(SCREENSHOTS_ROOT, "index.html");

interface JourneyGroup {
  journeyId: string;
  journeyTitle: string;
  isMobile: boolean;
  steps: StepRecord[];
}

async function loadRecords(): Promise<JourneyGroup[]> {
  try {
    const files = await fs.readdir(RECORDS_DIR);
    const records: StepRecord[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const content = await fs.readFile(
            path.join(RECORDS_DIR, file),
            "utf-8",
          );
          const parsed = JSON.parse(content) as StepRecord;
          records.push(parsed);
        } catch (error) {
          console.warn(`Could not parse ${file}:`, error);
        }
      }
    }

    // Deduplicate/group records by journeyId
    const journeyMap = new Map<string, JourneyGroup>();

    for (const record of records) {
      if (!journeyMap.has(record.journeyId)) {
        journeyMap.set(record.journeyId, {
          journeyId: record.journeyId,
          journeyTitle: record.journeyTitle,
          isMobile: record.isMobile,
          steps: [],
        });
      }
      journeyMap.get(record.journeyId)!.steps.push(record);
    }

    const journeys = Array.from(journeyMap.values());

    for (const journey of journeys) {
      // Sort steps by stepNumber ascending
      journey.steps.sort((a, b) => a.stepNumber - b.stepNumber);
    }

    return journeys;
  } catch (error) {
    console.warn("No records directory found or empty:", error);
    return [];
  }
}

function generateHtml(journeys: JourneyGroup[]): string {
  const generatedAt = new Date().toUTCString();
  const totalSteps = journeys.reduce((sum, j) => sum + j.steps.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Food Hygiene Ratings UK — User Journey Visual Review</title>
  <style>
    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --surface-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #0ea5e9;
      --success: #22c55e;
      --warning: #f59e0b;
      --light-tag: #fbbf24;
      --dark-tag: #818cf8;
      --font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding-bottom: 80px;
    }

    header {
      background-color: var(--surface);
      border-bottom: 1px solid var(--surface-border);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .logo-section h1 {
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meta-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .controls-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .btn-group {
      display: inline-flex;
      background-color: #0f172a;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 3px;
    }

    .btn-toggle {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 6px 12px;
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-toggle.active {
      background-color: var(--accent);
      color: #0f172a;
      font-weight: 700;
    }

    .btn-action {
      background-color: #0f172a;
      border: 1px solid var(--surface-border);
      color: var(--text);
      padding: 6px 14px;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .btn-action:hover {
      border-color: var(--accent);
    }

    .nav-bar {
      max-width: 1400px;
      margin: 16px auto;
      padding: 0 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .nav-pill {
      background-color: var(--surface);
      border: 1px solid var(--surface-border);
      color: var(--text-muted);
      padding: 6px 14px;
      font-size: 0.85rem;
      border-radius: 20px;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .nav-pill:hover, .nav-pill.active {
      border-color: var(--accent);
      color: var(--text);
      background-color: rgba(56, 189, 248, 0.1);
    }

    main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .journey-card {
      background-color: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      margin-bottom: 40px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .journey-header {
      padding: 20px 24px;
      background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .journey-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-desktop { background-color: #0284c7; color: #fff; }
    .badge-mobile { background-color: #7c3aed; color: #fff; }

    .steps-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .step-item {
      background-color: #0f172a;
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 20px;
    }

    .step-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 8px;
    }

    .step-title-group h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-desc {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 4px;
    }

    .step-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      gap: 12px;
    }

    .screenshots-grid {
      display: grid;
      gap: 16px;
      margin-top: 12px;
    }

    .screenshots-grid.mode-both {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }

    .screenshots-grid.mode-light {
      grid-template-columns: 1fr;
    }
    .screenshots-grid.mode-light .theme-card-dark {
      display: none !important;
    }

    .screenshots-grid.mode-dark {
      grid-template-columns: 1fr;
    }
    .screenshots-grid.mode-dark .theme-card-light {
      display: none !important;
    }

    .theme-card {
      background-color: #1e293b;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .theme-card-header {
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      font-weight: 600;
      border-bottom: 1px solid var(--surface-border);
    }

    .theme-tag-light {
      color: var(--light-tag);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .theme-tag-dark {
      color: var(--dark-tag);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .img-wrapper {
      position: relative;
      cursor: zoom-in;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .img-wrapper img {
      width: 100%;
      height: auto;
      max-height: 520px;
      object-fit: contain;
      display: block;
      transition: transform 0.2s ease;
    }
    .img-wrapper:hover img {
      transform: scale(1.01);
    }

    .review-checklist-panel {
      background-color: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 24px;
      margin-top: 40px;
    }

    .review-checklist-panel h2 {
      font-size: 1.2rem;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .checklist-items {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }

    .check-label {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: #0f172a;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      cursor: pointer;
      font-size: 0.9rem;
    }

    .check-label input {
      accent-color: var(--accent);
      width: 18px;
      height: 18px;
    }

    /* Lightbox Modal */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .lightbox.open {
      display: flex;
    }

    .lightbox-content {
      max-width: 95vw;
      max-height: 90vh;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .lightbox-img {
      max-width: 90vw;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      transition: transform 0.2s ease;
    }

    .lightbox-toolbar {
      margin-top: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .lightbox-close {
      position: absolute;
      top: -36px;
      right: 0;
      background: none;
      border: none;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
    }

    .empty-state {
      padding: 48px;
      text-align: center;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <header>
    <div class="header-container">
      <div class="logo-section">
        <h1>🔍 Food Hygiene Ratings — User Journey Review</h1>
        <div class="meta-subtitle">
          Generated: ${generatedAt} &bull; ${journeys.length} Journeys &bull; ${totalSteps} Milestone Steps
        </div>
      </div>

      <div class="controls-section">
        <!-- Theme Comparison Mode -->
        <div class="btn-group" id="theme-controls">
          <button class="btn-toggle active" data-mode="both">🌓 Side-by-Side</button>
          <button class="btn-toggle" data-mode="light">☀️ Light Only</button>
          <button class="btn-toggle" data-mode="dark">🌙 Dark Only</button>
        </div>

        <!-- Viewport Filter -->
        <div class="btn-group" id="device-controls">
          <button class="btn-toggle active" data-device="all">All Devices</button>
          <button class="btn-toggle" data-device="desktop">🖥️ Desktop</button>
          <button class="btn-toggle" data-device="mobile">📱 Mobile</button>
        </div>

        <button class="btn-action" id="btn-copy-signoff">📋 Copy Sign-Off</button>
      </div>
    </div>
  </header>

  <nav class="nav-bar">
    ${
    journeys
      .map(
        (j) => `
      <a href="#${j.journeyId}" class="nav-pill" data-journey="${j.journeyId}">
        ${j.isMobile ? "📱" : "🖥️"} ${j.journeyTitle}
      </a>
    `,
      )
      .join("")
  }
  </nav>

  <main>
    ${
    journeys.length === 0
      ? `
      <div class="empty-state">
        <h2>No user journey screenshots found.</h2>
        <p>Run <code>deno task test:journeys</code> to execute user journey tests and capture screenshots.</p>
      </div>
    `
      : journeys
        .map(
          (j) => `
      <section class="journey-card" id="${j.journeyId}" data-is-mobile="${j.isMobile}">
        <div class="journey-header">
          <h2 class="journey-title">${j.journeyTitle}</h2>
          <div>
            <span class="badge ${
            j.isMobile ? "badge-mobile" : "badge-desktop"
          }">
              ${j.isMobile ? "Mobile Viewport" : "Desktop Viewport"}
            </span>
          </div>
        </div>

        <div class="steps-container">
          ${
            j.steps
              .map(
                (step) => `
            <article class="step-item" id="${j.journeyId}-step-${step.stepNumber}">
              <div class="step-header">
                <div class="step-title-group">
                  <h3>Step ${step.stepNumber}: ${step.title}</h3>
                  <p class="step-desc">${step.description}</p>
                </div>
                <div class="step-meta">
                  <span>📐 ${step.viewport.width}x${step.viewport.height}</span>
                  <span>🌐 ${step.browser}</span>
                </div>
              </div>

              <div class="screenshots-grid mode-both">
                <!-- Light Mode -->
                <div class="theme-card theme-card-light">
                  <div class="theme-card-header">
                    <span class="theme-tag-light">☀️ Light Mode</span>
                    <span>Usability & Contrast</span>
                  </div>
                  <div class="img-wrapper" onclick="openLightbox('${step.lightImage}', 'Step ${step.stepNumber}: ${step.title} [Light]')">
                    <img src="${step.lightImage}" alt="Step ${step.stepNumber} Light Mode" loading="lazy">
                  </div>
                </div>

                <!-- Dark Mode -->
                <div class="theme-card theme-card-dark">
                  <div class="theme-card-header">
                    <span class="theme-tag-dark">🌙 Dark Mode</span>
                    <span>Usability & Contrast</span>
                  </div>
                  <div class="img-wrapper" onclick="openLightbox('${step.darkImage}', 'Step ${step.stepNumber}: ${step.title} [Dark]')">
                    <img src="${step.darkImage}" alt="Step ${step.stepNumber} Dark Mode" loading="lazy">
                  </div>
                </div>
              </div>
            </article>
          `,
              )
              .join("")
          }
        </div>
      </section>
    `,
        )
        .join("")
  }

    <!-- Visual Sign-Off Checklist -->
    <section class="review-checklist-panel">
      <h2>✍️ Usability & Readability Review Checklist</h2>
      <p class="meta-subtitle">Inspect light & dark mode screenshots above before signing off.</p>
      
      <div class="checklist-items">
        <label class="check-label">
          <input type="checkbox" id="chk-contrast">
          <span>Text & Background Contrast (WCAG AA)</span>
        </label>
        <label class="check-label">
          <input type="checkbox" id="chk-badges">
          <span>Rating Badges & Breakdown Legibility</span>
        </label>
        <label class="check-label">
          <input type="checkbox" id="chk-borders">
          <span>Card Borders & Component Elevation</span>
        </label>
        <label class="check-label">
          <input type="checkbox" id="chk-dialogs">
          <span>Dialogs, Inputs & Buttons</span>
        </label>
        <label class="check-label">
          <input type="checkbox" id="chk-mobile">
          <span>Mobile Layout & Touch Target Spacing</span>
        </label>
      </div>
    </section>
  </main>

  <!-- Lightbox Modal -->
  <div class="lightbox" id="lightbox" onclick="closeLightbox(event)">
    <div class="lightbox-content">
      <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
      <img src="" alt="" class="lightbox-img" id="lightbox-img">
      <div class="lightbox-toolbar">
        <button class="btn-action" onclick="toggleZoom(1)">1x</button>
        <button class="btn-action" onclick="toggleZoom(1.5)">1.5x</button>
        <button class="btn-action" onclick="toggleZoom(2)">2x Zoom</button>
      </div>
    </div>
  </div>

  <script>
    // Theme toggle controls
    document.querySelectorAll('#theme-controls .btn-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#theme-controls .btn-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        document.querySelectorAll('.screenshots-grid').forEach(grid => {
          grid.className = 'screenshots-grid mode-' + mode;
        });
      });
    });

    // Device filter controls
    document.querySelectorAll('#device-controls .btn-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#device-controls .btn-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const device = btn.dataset.device;

        document.querySelectorAll('.journey-card').forEach(card => {
          const isMobile = card.dataset.isMobile === 'true';
          if (device === 'all') {
            card.style.display = 'block';
          } else if (device === 'mobile') {
            card.style.display = isMobile ? 'block' : 'none';
          } else if (device === 'desktop') {
            card.style.display = !isMobile ? 'block' : 'none';
          }
        });
      });
    });

    // Lightbox modal logic
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    let currentZoom = 1;

    function openLightbox(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt;
      currentZoom = 1;
      lightboxImg.style.transform = 'scale(1)';
      lightbox.classList.add('open');
    }

    function closeLightbox(e) {
      if (!e || e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        lightbox.classList.remove('open');
      }
    }

    function toggleZoom(level) {
      currentZoom = level;
      lightboxImg.style.transform = 'scale(' + level + ')';
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Copy sign-off summary
    document.getElementById('btn-copy-signoff').addEventListener('click', () => {
      const contrast = document.getElementById('chk-contrast').checked ? '✅ Pass' : '⏳ Pending';
      const badges = document.getElementById('chk-badges').checked ? '✅ Pass' : '⏳ Pending';
      const borders = document.getElementById('chk-borders').checked ? '✅ Pass' : '⏳ Pending';
      const dialogs = document.getElementById('chk-dialogs').checked ? '✅ Pass' : '⏳ Pending';
      const mobile = document.getElementById('chk-mobile').checked ? '✅ Pass' : '⏳ Pending';

      const summary = [
        '### 🎨 User Journey Visual Review Sign-Off',
        '- Text & Background Contrast (WCAG AA): ' + contrast,
        '- Rating Badges & Breakdown Legibility: ' + badges,
        '- Card Borders & Elevation: ' + borders,
        '- Dialogs, Inputs & Buttons: ' + dialogs,
        '- Mobile Layout & Touch Targets: ' + mobile,
        '',
        'Reviewed on: ' + new Date().toISOString(),
      ].join('\\n');

      navigator.clipboard.writeText(summary).then(() => {
        alert('Visual Review Sign-off markdown copied to clipboard!');
      }).catch(() => {
        prompt('Copy your review summary:', summary);
      });
    });
  </script>
</body>
</html>`;
}

async function main() {
  console.log("Generating User Journey Visual Review Gallery...");
  const journeys = await loadRecords();

  // Save manifest.json
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(journeys, null, 2), "utf-8");
  console.log(`Saved manifest to ${MANIFEST_PATH}`);

  // Save index.html
  const html = generateHtml(journeys);
  await fs.writeFile(GALLERY_HTML_PATH, html, "utf-8");
  console.log(`Saved gallery portal to ${GALLERY_HTML_PATH}`);
}

if (import.meta.main) {
  await main();
}
