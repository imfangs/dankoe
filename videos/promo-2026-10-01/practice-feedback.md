# 实践反馈 · 2026-10-01

本轮只修改 Dan Koe 消费项目宣传工程。FBT、共享 Skill、Hi 与队列未改，通用反馈交协调者集中回流。最终文件身份见 production-state.json。

## 1. 墙钟换算不能证明长录屏切点正确

- 触发：一个 context 连续录制五个页面步骤，以 finalized WebM 尾部减墙钟差计算 sourceIn。
- 实际证据：旧片 `5613494cdf3d80d7d07eb41b9a77210bed3a06bbea5d59c10d35f774f99836fc`，`review/continuous-rejected-cuts.jpg` 显示3.96秒仍是首页字幕但已进入文章列表；其他切点也混入下一页。旧媒体与播放报告保存在 evidence/continuous-rejected-*；旧捕获元数据为 raw/continuous-rejected-full-capture.json。
- 根因边界：可确认墙钟到媒体时间的换算不能用于这次剪辑；本轮未定位其低层偏移来源，不称为已确认的 Playwright 通用缺陷。
- 修复：每镜独立 context/WebM，消除相邻导航混入。独立录屏仍按尾部裁切时，展开动作开头被裁掉，因此按协调者已验证路线加入初始页面参考图与25fps解码帧的灰度 MSE 匹配。
- 回读：`evidence/media-alignment.json` 五段最小MSE为0.037–0.184，起点0.48–1.72秒；最终全部4个切点对与关键动作再次受控审阅，主页/筛选/搜索/导读/正文与字幕一致。实际sourceIn/out保存在storyboard。
- 适用范围：静态或近静态网页、可独立复现初始视觉状态的录屏。动态游戏或随机/时钟画面不能直接套用此匹配阈值，必须检查匹配是否唯一、合理及动作是否保留。阈值与坐标留项目，不变成通用硬编码。

## 2. 编码尺寸和浏览器呈现尺寸需要一起回读

- 触发：旧片ffprobe宽高1920×1080，而独立Chromium videoHeight为1081。
- 真实根因：旧流 sample_aspect_ratio=1080:1081，display_aspect_ratio=1920:1081。编码宽高不能单独说明浏览器显示比例。
- 修复：本工程FFmpeg最终滤镜追加 `setsar=1`，不改变网页内容。
- 回读：最终ffprobe SAR=1:1，独立浏览器报告1920×1080。两份检查均绑定最终SHA `686c86eb152d245380f19be0357bee99e4c9f51ce8cb3a07364abc0a416cfe84`。
- 适用范围：网页截图/视频/PNG混合后计划输出方形像素的影片；对原本有意义的非方形像素素材不能无判断强改。

## 3. 浏览器播放质量对象须显式取字段

- 触发：直接JSON序列化 `getVideoPlaybackQuality()` 得到 `{}`，见 evidence/sample-browser-playback-v1.json；不能据此报告零丢帧。
- 修复：显式读取 totalVideoFrames、droppedVideoFrames、corruptedVideoFrames，保留没有API时的null。
- 回读：同一7秒小样重新播放得到175/0/0；最终片750/0/0。源码在 scripts/playback.mjs。
- 适用范围：浏览器回执序列化；不表示实际人耳听过或真人完成观看。

## 创作选择与边界

主题→关键词“深思”→同篇导读→同篇正文，比先前不同文章跳转更连贯，属于本项目叙事判断。未做观众A/B，不能声称宣传效果提升。完整示例使用原标题与少量页面片段；保留作者、译站身份和提醒。声音使用工程原创程序合成，不取授权未明的共享音库；人耳听感仍未验证。
