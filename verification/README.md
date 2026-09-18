# Verification · 2026-09-18

## Content and build

- WordPress API: 189 Letters + 1 Blog, dated 2021-05-12 through 2025-08-31.
- All 30,444 source blocks are represented by matching, ordered translation block IDs. Each transport response must finish normally; truncated output is rejected.
- Every translated block passes link-destination and heading-level checks; pure product/model-name lists have an explicit, source-hashed exception.
- All 190 pages build successfully. `content-check.json` records checks for titles, source links, indexing directives, internal links, local images, and credential-like URL parameters.
- 360 distinct source images are stored locally, appearing 383 times in articles. Five expired Kortex/S3 image links cannot be recovered; their positions link to the original article with a clear unavailability label.
- English originals are available under `/en/`. Original snapshots and model receipts remain local and are ignored by Git.

## Browser checks

Verified with the Codex in-app browser on the built site:

- Desktop at 1280×720: header/navigation, spacious single-column homepage, list hierarchy, font size, cream background, dark ink text and restrained blue links.
- Mobile at 390×844: article width equals viewport width (no horizontal overflow), readable line height, responsive navigation and source link.
- Chinese filtering yields matching articles; an unmatched phrase produces an explicit empty state.
- Full-text search for `心智` returns article sections with highlighted matches and usable links.
- Markdown emphasis and literal `>` characters were checked after repair. Chinese emphasis now renders correctly with the CJK Markdown plugin.

## Translation review boundary

The site labels translation as AI-assisted and unofficial. Sampled beginning, middle, and ending passages of the niche/point-of-view article, self-discipline article, and HUMAN 3.0 knowledge base against their English source. Corrected untranslated titles/headings and a few awkward or untranslated terms through versioned editorial overrides. Structural validation covers the full corpus; this is not a claim of human proofreading of every sentence.

The standalone newsletter at `letters.thedankoe.com`, paid articles, courses, and external book resources are linked to their official destinations and are not included in the mirror.

## Production read-back

The live domain returned all 190 articles. Verified the year filter (2022: 46 articles), load-more (24 to 48 rows), the Chinese genius/thinking article with all three images loaded, 390px dark-mode layout without overflow, and full-text search for `自律` (9 results). No browser console errors were observed. HTTPS certificate and enforcement were verified; https://dankoe.fangs.cc/ was opened in the live browser and showed the 190-article entry. See DEPLOYMENT.md for deployment evidence.
