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

Note: the legacy Pages status endpoint briefly retained an errored state from the cancelled domain-rebind build even after the newer Actions deployment succeeded. Live HTTPS and the successful deployment run are the delivery evidence; a clean rebuild was requested to refresh the legacy status.
