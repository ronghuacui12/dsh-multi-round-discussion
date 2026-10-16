# 十模型 Q 版与圆桌预览 v2

2026-10-16，使用内置 imagegen，根据现成社区角色图作为图像参考生成。当前仅为预览，未切件或写入已安装插件。

- 人物总览：`ai-models-chibi-v2.png`
- 围桌与桌体视图：`roundtable-ten-models-v2.png`
- 模型：ChatGPT / Claude / Gemini / Grok / DeepSeek / GLM / MiniMax / Kimi / Step / MiMo。
- 已作废的方向：v1 是按研讨职位创造的七位角色，不能作为这十个模型的身份参考。

## 参考来源与署名

用户提供的抖音作品链接：https://v.douyin.com/Tcq1HWzA6Kw/ ，跳转到 https://www.douyin.com/video/7692413678729104690 。本环境未能稳定播放该视频，因此未宣称观看完整视频；改用作者 ApprenTice 公开的同题材角色图核对身份与画风。

八位现成 Q 版（ChatGPT、Claude、Gemini、Grok、DeepSeek、GLM、MiniMax、Kimi）：

- 作者 ApprenTice： https://github.com/Apprentice-Geo/AI-Fanworks/tree/main/ApprenTice/AI-Girls-and-Chibis
- 来源说明： https://github.com/Apprentice-Geo/AI-Fanworks/blob/main/ApprenTice/AI-Girls-and-Chibis/README.md
- 形象原作参考 ZipZipPipe《大 AI 与小 AI 们》；DeepSeek 鲸鱼娘为上善无形原创、ZipZipPipe 二次设计、ApprenTice 再创作。
- ApprenTice 声明 CC BY-NC-SA 4.0。图像参考保存在 `../references/apprentice-ai-girls-chibis/`；原 README 与提示词一起保留。

Step：

- 既有社区角色作者 @甶丶，蓝色大肥鱼整理：https://xn--pssy23gqgbz2d718b.com/works/stepfun202609210001.html
- 原图：https://raw.githubusercontent.com/lmy414/ai-girl-stickers/main/dist/submissions/originals/stepfun/issue-19-001.png
- 按既有浅蓝长发、黑白衣裙、阶梯方块头饰、方灯等识别特征转换 Q 版。作者说明 CC BY-NC。

MiMo：

- 既有社区角色作者 @甶丶，蓝色大肥鱼整理：https://xn--pssy23gqgbz2d718b.com/works/mimo202609230002.html
- 原图：https://raw.githubusercontent.com/lmy414/ai-girl-stickers/main/dist/submissions/originals/mimo/issue-35-002.png
- 按既有银白双马尾、橙白兔耳科技头饰、橙白黑机能服、小兔玩偶等识别特征转换 Q 版。作者说明 CC BY-NC。
- 另找到 @Immyxxr 的 MiMo 兔耳女仆版本，作为备选检索资料保存，**未用于本次生成**。

Step 与 MiMo 的绘画比例和渲染方式统一到 ApprenTice Q 版图集；两者均不是临时自行编造的人设。本次所有形象属于社区拟人二创，不作为模型官方形象声明。预览及其改编保留上述来源、署名和来源许可证条件，未作商业分发。

## 人物总览完整提示词

```text
Create a NEW clean high-resolution MODEL IDENTITY REFERENCE SHEET using the supplied source artwork as exact visual identity references. This corrects a prior misunderstanding: the subjects are TEN SPECIFIC AI MODEL PERSONIFICATIONS, NOT generic job roles. Do not invent replacement characters, uniforms, professions, hair colors, genders or role color schemes.
Input image 1 is a nine-character 3x3 composite of existing community chibi designs. Use its artwork and rendering as the dominant style authority. Identity mapping of IMAGE 1: top left=DeepSeek, top center=ChatGPT, top right=Claude; middle left=Kimi, middle center=Gemini, middle right=GLM; bottom left=Grok, bottom center=MiniMax, bottom right=Qwen. DO NOT INCLUDE QWEN in the requested output.
Input image 2 is the existing Step/StepFun full-body design. Preserve this exact character identity, convert its proportions to match input 1.
Input image 3 is the existing MiMo/Xiaomi MiMo three-view design: white/silver long twin ponytails, long orange-lined rabbit-ear tech headgear, orange-white-black utility jacket with hood, black pleated skirt, orange eyes, orange cross hairclip, asymmetric white/black socks and chunky orange-white shoes; small white rabbit companion. Preserve THIS specific identity and outfit, not another imagined orange-haired character and not the alternative maid design. Convert her to input 1's chibi style.
RENDERING STYLE: Match input 1 closely across ALL ten figures: about 1.75 heads tall, head over half total height, rounded wide cheeks, tiny chin, large low-placed sparkling eyes, almost no visible neck, extremely short torso, very short arms/legs, little round shoes. Readable rounded outer contour, fewer finer internal lines, clean colored lines, soft but distinct cel-shaded blocks and restrained gradient transitions, broad hair highlights, gentle blush, stable bright inherent colors. Plush compact silhouettes, not the taller 2.5-3-head style. Not 3D, not dolls, not photoreal, no glossy plastic, no baby anatomy realism, no sex appeal, no detailed breasts, non-suggestive fully clothed cartoon presentation. Keep the heads identical in relative scale and the rendering consistent. Preserve model-specific outfits rather than changing them into matching uniforms.
OUTPUT: ONE spacious landscape 3:2 reference board, maximum available resolution, ideally 3072x2048 or higher. Two clean rows of FIVE equally sized FULL BODY figures. All hairstyles, tails, wings, ears, shoes, accessories fully within each cell with generous white space. Soft light-gray/lavender white background, minimal subtle shadows. No elaborate scenes or ornate gilded borders. A small restrained headline exactly "AI 模型拟人 · Q版设定". Each model name appears in clear sans-serif type immediately below its figure. No additional prose.
EXACT ORDER AND IDENTITIES:
Top row left to right:
1 ChatGPT: input 1 top-center silver-white long-haired pale-purple-eyed dragon girl, pale curling horns, small lavender membranous batlike dragon wings, ONE white scaled dragon tail, flowing WHITE dress with its silver/pale-purple knot-like insignia. Chibi simplified armillary sphere may be held. Do not turn her into a green-haired office person.
2 Claude: input 1 top-right copper-orange long curls, amber eyes, large orange flower and black ribbon at side of hair, cream/black/orange flower-embroidered layered dress, small open dark book with orange flower icon. Recognizably her.
3 Gemini: input 1 middle-center violet-to-blue-to-pink flowing hair, blue/purple cat ears, two small round side buns, small gold multi-point star hairpins, heterochromatic pink and amber eyes, purple-blue-white gold-star dress and star accessories, cheeky expression. Keep cat ears, not horns.
4 Grok: input 1 bottom-left long golden-blonde twin tails, tiny dark ornate crown with crescent, dark demon horns, little bat wings, black-gold and deep-red gothic dress, blue eyes, stylized black-gold staff with X motif. A small childlike stylization of a fantasy adult mascot, never sexy.
5 DeepSeek: input 1 top-left blue to lighter-blue long fluffy hair, central curved ahoge, blue-white whale-fin ears and WHITE ruffled maid headband, navy-blue and white full maid dress with a small recognizable whale silhouette on its white apron, short white socks and navy rounded shoes, ONE blue whale tail ending in TWO flukes. Two flukes are one tail, not two tails. Do not replace fins with cat ears.
Bottom row left to right:
6 GLM: input 1 middle-right long straight black hair, gentle gray eyes, white ruffled headband and black-white ribbons, a clear small square Z hair ornament, black-white gothic maid dress with angular/diamond details and small Z motifs, small Go board and bowl of black stones. NOT the alternate fox version.
7 MiniMax: input 1 bottom-center peach/coral shoulder-length hair, pink-white BERET, amber/coral eyes, cream-and-pink casual jacket with simple coral waveform motifs, tan plaid skirt, white/pink chunky sneakers, small shoulder bag and handheld microphone or walkie-talkie. Preserve lively pointing pose and visual warmth.
8 Kimi: input 1 middle-left long silver-white hair, lavender eyes, black-white maid outfit with dark blue accents, K letter ornaments, musical-note and circular lunar hairpiece, long asymmetric dark-blue/black overskirt, delicate chain motifs, white stockings and dark rounded shoes. Distinct from ChatGPT: no horns/wings/tail; distinct maid costume and K/lunar motifs.
9 Step: EXACT input 2 design: icy light-blue long hair and curled loop ahoge, bright blue eyes, small square stepped-pixel hair ornament and black-white ribbon, sleeveless high-neck white outfit with black collar/bow, black-white flowing outer sleeves/cape with square pixel motifs, tiny dark shoes, white cubical lantern with black edges. Simplify dress fully covering the short chibi torso. NOT a generic cosmic purple girl.
10 MiMo: EXACT input 3 described above. Preserve the orange-white techwear, long orange-lined rabbit-ear headgear, orange cross hairclip, two long silver-white ponytails, white rabbit mascot, orange/black/white shoe and sock scheme. No maid outfit.
Labels exactly: "ChatGPT", "Claude", "Gemini", "Grok", "DeepSeek", "GLM", "MiniMax", "Kimi", "Step", "MiMo".
CONSISTENCY: All ten heads same anatomical scale, same 1.75-head chunky ratio, same outline softness, same eye detailing, same cel shading and illumination. Step and MiMo must look drawn by the same hand as the eight source chibis, while retaining their pre-existing community designs. Exactly 10 figures, no extra Qwen, no duplicates, no invented 11th person. Clean cute expression and hands. This sheet is for noncommercial private art-direction review with source credits tracked separately.
```

## 围桌效果完整提示词

```text
Create ONE NEW unified Japanese anime chibi ROUNDTABLE ART-DIRECTION PRESENTATION using the attached ten-model identity sheet as the exact locked cast. The sheet is the character reference AND the rendering style reference. Preserve the identities faithfully, do not redesign them as generic discussion professions or recolor them by role. Keep the same compact big-head, tiny-body approximately 1.75-to-2-head style, rounded cheeks, large jewel-like eyes, clean rounded linework, limited clean cel shading, broad coherent hair highlights, soft pastels, very short limbs. All ten are cute, fully clothed, non-suggestive community AI mascot girls.
Wide landscape board, roughly 3:2, highest resolution available. Pale ivory-blue studio presentation with generous margins. Small top title exactly "十模型圆桌 · 效果预览".
Composition: LEFT 76% is a large attractive fully assembled meeting scene, RIGHT 24% is a clear matching empty-table furniture study column. No game UI, no chat transcript, no long text, no fake app screenshot. The artwork and table are easy to inspect.
CAST LOCK:
The attached sheet TOP row left-to-right is ChatGPT, Claude, Gemini, Grok, DeepSeek.
The attached sheet BOTTOM row left-to-right is GLM, MiniMax, Kimi, Step, MiMo.
Use EXACTLY these TEN distinct identities in the large meeting scene, ONCE EACH. No Qwen, no extra eleventh character, no duplication. The tabletop nameplate at each occupied chair should identify the correct model with the exact short names listed.
ChatGPT: white-haired pale lavender eyed dragon girl, pale horns, pale purple membranous wings, white scaled tail, white flowing dress and small knot motif; her armillary sphere rests near her place.
Claude: long copper-orange curls, orange flower and black ribbon, cream/orange/black floral dress and little open dark book.
Gemini: blue-to-purple-pink long hair, CAT EARS, small side buns, gold stars, heterochromia, purple-blue star outfit.
Grok: blonde twin tails, dark little crown/horns and bat wings, black-gold dress with deep-red hem, blue eyes, ornate X staff safely resting alongside chair.
DeepSeek: blue-to-light-blue fluffy long hair, white ruffled maid headband, WHALE FIN ears, navy-white maid dress, whale mark on white apron, ONE whale tail with two flukes.
GLM: straight long BLACK hair, white headband, clear small square Z hair ornament, black-white angular maid dress, little Go board.
MiniMax: coral/peach short hair, white-pink beret, cream-pink casual jacket, tan checked skirt and little pink-white shoes.
Kimi: long silver-white hair, K and musical-note/lunar head ornament, dark blue-black-white maid dress and K motifs; NOT ChatGPT, no dragon features.
Step: icy pale-blue very long hair, loop ahoge, black-white stepped-square hairpin, black-white high-neck dress/cape with square motifs, a small cubical white lantern resting beside chair.
MiMo: silver-white long twin ponytails, tall white rabbit-ear tech headgear with orange interiors, amber eyes, orange cross hairclip, ORANGE-WHITE-BLACK TECH JACKET over short black skirt and covered tiny chibi legs, chunky orange shoes, small white rabbit mascot on chair arm.
MEETING SCENE:
A wide, gently elevated three-quarter view, around 25-35 degrees above a broad elliptical tabletop, viewed close enough that all ten heads and signature ornaments remain legible. Characters are seated naturally around the outside of the oval table, conversing, making small gestures, smiling or thinking. Not standing on top of furniture. No bodies cut off at strange points. Chairs contact the floor, hands rest naturally at table edge, short feet outside; far row lower torsos correctly occluded by table, near row overlays table. Build a plausible spatial circle with far arc / side positions / near arc, not ten heads in one horizontal line.
Suggested placement for clarity, clockwise starting from near-left: DeepSeek, Claude, MiniMax, Kimi, ChatGPT, Step, MiMo, GLM, Grok, Gemini. Their faces can be profile or three-quarter but must remain identifiable. Near-row characters may turn their heads toward the viewer to show their faces. Never hide a whole character behind a tall chair back. Twelve chairs in total, ten occupied and two empty at gaps on the perimeter. Keep empty chairs subtle.
A few meaningful small props on the table by their owners: Claude book, GLM Go board, ChatGPT small sphere, MiniMax notebook. Mostly clear central tabletop. A tiny speech bubble with "…" above one thoughtful girl; do not cover faces. No explosive glowing particle effects. Very light stylized floor shadow and a minimal soft pale-blue/lavender gradient background with faint studio atmosphere, NOT a detailed realistic room. The characters are the focus.
TABLE DESIGN:
A beautiful wide elliptical conference table, warm IVORY tabletop, subtle pale blue inner oval, THIN champagne-gold trim, gently beveled visible deep-NAVY apron and two rounded navy pedestal bases, a small elegant neutral compass/star inlay at the center. Clean readable construction, no neon, no busy ornament, no glass reflections obscuring characters. Matching small deep-navy cushioned chairs with ivory shells and thin gold details; all game-illustrated with the same clean outline and simple soft cel shading as the chibi cast. Table surface has proper visible depth, not an almost edge-on stripe. Width sufficient for ten characters without crowding.
RIGHT furniture studies:
Top header exactly "桌体设计". Two isolated renders of the SAME empty table: a large three-quarter furniture view at top, a smaller true top view below. A small matching chair at bottom. Captions exactly "斜俯视", "顶视", "座椅". Keep enough white space for forms to read. This column contains NO extra cast figures.
Typography is neat dark navy sans serif. Model nameplate text only at occupied positions in the hero, no huge floating labels. The ten model names must correspond to the correct faces. Other than headline, section label and captions, do not add text.
Very important: This is a new scene using the ten existing model designs in the reference sheet, not another new character design sheet. Consistency across all people, shading and furniture. Delightful, legible and polished, suitable as the master preview before isolated transparent game assets are produced.
```
