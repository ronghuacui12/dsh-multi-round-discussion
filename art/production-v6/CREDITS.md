# 素材来源与生成记录

2026-10-16，十二模型完整美术包 v6。全部交付绘画来自内置 image_gen。十二位人物在本轮逐位生成十二格透明状态图集，椅子、笔记本、水杯、文件夹、绿植分别独立生成。房间、短桌、长桌沿用上轮内置 image_gen 的已选原图。20 张原始图均保存在 `sources/`，本轮完整提示词在 `exact-prompts.json`。

人物是基于已有社区拟人设定的 Q 版二创，不是模型厂商官方人物。身份参考使用项目 `art/references/` 已归档原图；每位对应路径记录在 `prompts.json` 和 `manifest.json`。

ChatGPT、Claude、Gemini、Grok、DeepSeek、GLM、MiniMax、Kimi、千问：参考 [ApprenTice 的 AI Girls and Chibis](https://github.com/Apprentice-Geo/AI-Fanworks/tree/main/ApprenTice/AI-Girls-and-Chibis)，作者说明 CC BY-NC-SA 4.0。形象原作参考 ZipZipPipe；DeepSeek 鲸鱼娘为上善无形原创、ZipZipPipe 二次设计、ApprenTice 再创作。项目中保存有原 README、Prompts 与九位人物参考。

Step：参考 @甶丶的 [阶跃星辰角色](https://xn--pssy23gqgbz2d718b.com/works/stepfun202609210001.html)，来源说明 CC BY-NC。

MiMo：参考 @甶丶的 [MiMo 橙白兔耳女仆设定](https://xn--pssy23gqgbz2d718b.com/works/mimo202609230002.html)，来源说明 CC BY-NC。本轮按归档三视图保留长银白发、兔耳、橙白女仆装，不采用臆造的科技夹克。

豆包：参考 [豆包黑粉女仆社区设定](https://xn--pssy23gqgbz2d718b.com/works/doubao202610090001.html)，归档页未注明作者及许可，未推定已有商业使用或公开分发许可。本轮保留短黑发、粉色缎带、包子头饰及黑白粉女仆装。

用户给出的画风参考为 [ApprenTice 抖音视频](https://v.douyin.com/Tcq1HWzA6Kw/)。早前环境未能稳定播放完整视频，身份核对使用作者公开图集及上述资料。统一风格使用项目 `art/concepts/longtable-room-v4-concept.png` 与本轮 ChatGPT 图集作为输入参考；其余人物提示词明确要求只参考画风与比例，不复制 ChatGPT 的角、翼或服装。

背景和家具为本项目生成的新设计。本目录随项目仓库归档；生成记录不改变上述参考原作的许可条件。

导出脚本仅做图集分离、透明边缘杂点整理、缩放与格式转换；审阅图为独立生成素材的排版与拼合。没有以手绘代码、SVG 或网络图片冒充新生成人物。
