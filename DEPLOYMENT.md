# Deployment · 2026-09-18

- Site: `dankoe.fangs.cc`
- Repository: `https://github.com/imfangs/dankoe`
- Source branch: `main`; Pages branch: `gh-pages`, root.
- Platform: VitePress 1.6.4, GitHub Pages (same deployment structure as `wbw.fangs.cc`).
- DNS: Aliyun, `dankoe CNAME imfangs.github.io`, TTL 600. Console read-back, authoritative DNS and Google DoH matched.
- Full site deployment commit: `556e25a4f8f9ba0eb60e3c41719a2ee7c9f9770c`.
- Initial source commit: `ef1637b`.

Published content: 190 translated articles, corresponding English archives, 360 distinct local images (383 article image occurrences), 30,444 aligned source blocks. Five expired source images are explicitly linked back to the original article.

HTTP production read-back returned `content-status.json` with `complete: true`, `articles: 190`; the Pages build completed successfully.

Live browser checks passed: 190-item directory, year filter (46 articles for 2022), load-more (24 → 48 rows), corrected Chinese titles, a three-image article, mobile width 390 with no overflow, dark theme, and Chinese full-text search (`自律`, 9 results). No browser console errors were observed.

HTTPS provisioning was restarted using GitHub's documented remove/re-add custom domain procedure after DNS had propagated. Certificate was approved for dankoe.fangs.cc (expires 2026-12-17), HTTPS enforcement was enabled, and both curl and the live browser successfully read the HTTPS site. The final Pages Actions run 35303508319 completed successfully on CNAME-restoration commit eb7f0da1a2a9dac7b6045c8738c672fd0cc90dca.

Canonical URL: https://dankoe.fangs.cc/

Final independent checks: Pages status `built`; latest build status `built` with no error; certificate `approved`; `https_enforced: true`; HTTP redirects to HTTPS. The clean rebuild also cleared the transient legacy status left by domain rebinding.

## Curated reading release · 2026-09-18

- Entry: https://dankoe.fangs.cc/picks
- 10 manually curated recommendations with three-point briefs, reading questions and critical notes; the first three are prioritized.
- Filters: curated-only, full-article reading time, unread/read; explicit read markers persist only in the current browser and synchronize between its tabs.
- Source feature commit: `819cdef`; Pages deployment: `f29d8e3d5cf93b0c3ba9baeaec01fba6614c98a2`.
- Production HTTPS returned 10 recommendations and 10 briefs. Five-minute filter returned two short articles and brief expansion worked. No relevant browser errors were observed. Local browser verification also covered refresh persistence, changes from the full article, cross-tab synchronization, empty-filter recovery, and the 390px mobile layout.
