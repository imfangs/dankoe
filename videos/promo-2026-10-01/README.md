# Dan Koe 中文阅读站 · 30 秒宣传片

当前接续状态见 `production-state.json`；成片 `final.mp4`、封面 `poster.jpg`、7 秒小样 `sample.mp4`。素材来源、实际媒体属性与哈希见 `assets.json`，时间线见 `storyboard.json`，检查边界见 `review.md`。

## 复现

在项目根目录运行。依赖使用本机已安装的 Playwright、Pillow、NumPy、FFmpeg；实际路径、版本、字体身份见 `tools.json`，编辑输入哈希见 `evidence/render-identity.json`。不需要启动或改动产品服务器。

```sh
python3 videos/promo-2026-10-01/scripts/design.py
node videos/promo-2026-10-01/scripts/capture.mjs sample
python3 videos/promo-2026-10-01/scripts/render.py sample
node videos/promo-2026-10-01/scripts/playback.mjs sample.mp4
node videos/promo-2026-10-01/scripts/capture.mjs full
node videos/promo-2026-10-01/scripts/align.mjs
python3 videos/promo-2026-10-01/scripts/align.py
python3 videos/promo-2026-10-01/scripts/render.py full
python3 videos/promo-2026-10-01/scripts/verify.py
node videos/promo-2026-10-01/scripts/playback.mjs final.mp4
python3 videos/promo-2026-10-01/scripts/manifest.py
```

只需重剪现有录屏时，可跳过 capture。重新拍摄/渲染会改变产物身份，必须重新检查全片、切点和音轨，并同步 review 与 production-state。线上页面将来可能变化，重新拍摄的文本与时间不能保证与本次相同。完整版每镜头使用独立 context/WebM，通过独立重现的初始页面截图与已解码帧的灰度 MSE 匹配定位起点，再核对输出首尾帧；不再把跨页长录屏的墙钟差直接当媒体时间。初版长录屏边界串页问题与修正记录在 practice-feedback.md。

`playback.mjs` 在专属 `127.0.0.1:18774` 临时提供原生播放器，用独立 Chromium 从头到 ended，finally 关闭 browser、context 和 server。该脚本不用个人 browser profile，不持久改变产品阅读状态。本轮结束无常驻服务。

声音是源码生成的原创轻配乐，来源实录无音轨；没有朗读原文。实际听感、陌生人理解和宣传效果未由机器检查证明。

## Hi 应用建议

将同次 `final.mp4` 与 `poster.jpg` 交给 Hi 协调任务；建议在 Dan Koe 介绍页使用原生 controls、playsinline、preload=none、等比 contain，不自动播放，保留现有“开始阅读”和“格得精选”链接。不要复制 source recordings、工具日志或字体到 public。宣传片现已由协调任务接入 [Hi 项目页](https://hi.fangs.cc/projects/dankoe/)，公开文件 SHA256、Range 与 Chromium 1280/390/320 像素视口检查通过，桌面完整播放；发布身份与回执见 `production-state.json`。手机视口记录过一次 MP4 `ERR_ABORTED`，相关播放检查仍通过，详情保留在回执。Dan Koe 阅读产品未修改或重发，本仓库未 push；听感、真人反馈、真机与 Safari 尚待验证。
