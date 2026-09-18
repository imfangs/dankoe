# Dan Koe 中文阅读站

把 thedankoe.com 的公开长文整理成可搜索的中文阅读站。沿用 wbw.fangs.cc 的 VitePress + GitHub Pages 部署方式。

- 目标域名：https://dankoe.fangs.cc
- 源码：https://github.com/imfangs/dankoe
- `main` 保存源码、中文 Markdown、英文存档与图片；`gh-pages` 仅保存构建结果。
- 本站是非官方、个人学习用途的译站，不代表原作者，不包含付费订阅内容。

## 开发与构建

```sh
npm ci
npm run dev
npm run build
npm run validate
```

克隆仓库后可直接从已提交的 Markdown 构建，不需要模型凭据。全量原始 WordPress 快照、翻译缓存与回执留在本地 `content/`，不发布到仓库；干净的英文存档在 `docs/en/`。

## 更新文章

```sh
npm run sync
npm run translate -- --workers 12 --transport-model gemini-3.1-pro-preview
npm run build
npm run validate
```

同步使用原站公开 WordPress REST API，分别遍历 `letters` 与 `posts`，保留发布时间、修改时间与原文地址。图片本地保存。翻译按稳定的段落 ID 分块，通过本机 FBT `friday-gateway` 调用；读取既有凭据系统，不把密钥写进项目。可以用 `FBT_ROOT` 指定 FBT 路径。

每块检查返回状态、段落顺序、标题层级、链接目的地和明显截断；未完成文章不进入成品。更新未改变的文章会复用缓存。模型输出不等于人工审校，修订需要对照原文。

## 部署

先检查差异并使用仓库本地个人身份提交本任务文件，再执行：

```sh
git push origin main
./deploy.sh
```

`deploy.sh` 会构建、校验内容完整性，在隔离 worktree 更新 `gh-pages`，不切换或清理源代码工作区。目标仓库与个人 Git 身份不匹配时拒绝发布。构建缺少任意文章时拒绝正式部署。

GitHub Pages：Deploy from branch → `gh-pages` / root；自定义域名 `dankoe.fangs.cc`；DNS 为 `dankoe CNAME imfangs.github.io`。`docs/public/CNAME` 与 `.nojekyll` 会随每次构建复制。

## 内容与边界

原作者及配图权利人保留内容版权。每篇都有原文链接和非官方翻译说明；禁用搜索引擎索引。原站的客服、测试、活动页面不作为文章收录，课程和最新订阅入口指向官方。

这是 2026-09-18 的内容快照，更新是显式执行命令，不声称已建立定时同步。

2026-09-18 实测：默认 Claude 上游在批量翻译中触发限流，后续通过备用模型通道完成。可用性会变化；`--transport-model` 可更换调用通道，仍复用已验证缓存。长输出预算与按块校验用于防止截断。

## 格得精选与阅读进度

`/picks` 收录 10 篇推荐文章，按阅读优先级排列，前三篇优先。每篇都有推荐理由、三点 brief、一个实践问题和批判性提醒。选文与 brief 维护在 `docs/.vitepress/theme/reading-picks.json`，与生成的文章目录分开保存，重新同步正文不会覆盖它们。

全文时长与未读／已读可以组合筛选；全部文章页的“只看格得精选”会保留为 `?picks=1` 链接。已读只由读者主动标记，存储在当前浏览器的 `dankoe:read:v1` localStorage 中，不上传、无账号、不跨设备同步；同一浏览器的页面和标签页会同步状态。每篇全文顶部也能标记或撤销已读。
