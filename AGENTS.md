# dankoe 接续入口

本项目是独立的非官方中文阅读站，保留原作者、原文地址、个人学习定位和已译正文。内容与部署方法见 README.md；现有精选和本机已读进度保持。

首页与发布接续读 `docs/HOME-2026-10-09.md`。首页组件在 docs/.vitepress/theme/components/HomeEditorial.vue；生成入口是 scripts/build-content.mjs，不直接维护生成首页。

使用仓库本地imfangs身份，提交本任务改动。GitHub Pages由deploy.sh的隔离worktree发布，不切换或清空源目录，不自动吸收其他改动。发布后回读实际首页与主阅读入口，再更新首页记录。未经请求不做抓取/重译或扩充内容范围。
