# 三蘆夜行 — Submission Package

Status date: 2026-10-06 (Asia/Taipei)

## One-line pitch

**三蘆夜行**是一款以三重／蘆洲夜間城市節奏為核心的短篇瀏覽器駕駛遊戲：玩家不是征服一張大地圖，而是在三條不同性格的路線中讀懂速度、街廓、夜色與自己的節奏。

## Short description

三蘆夜行把都市夜間駕駛拆成三種可重玩的節奏：FLOW、PRECISION、RHYTHM。玩家從路線身份、Gate、速度、車流與城市色彩自然理解目標，完成後再透過 Rank、Route PB、Replay Momentum 與 Ghost Replay 追逐更乾淨的跑法。作品以瀏覽器原生方式運作，支援鍵盤、觸控與手把，並在嚴格 LOW render budget 下維持完整城市感。

## Design statement

核心不是「做一個更大的城市」，而是「讓有限的城市元素形成可以被駕駛讀懂、也能被記住的節奏」。

1. **城市要參與遊戲，而不是只當背景。** 號誌、車流、街區亮度、道路方向、checkpoint 導引與 route signature 共同影響玩家對速度與下一步的判讀。
2. **每條路線要有駕駛性格，也要有視覺性格。** FLOW、PRECISION、RHYTHM 不只存在於文字；同一座城市會以不同 fog、lighting、facade、road accent 與 HUD accent 呈現。
3. **短局要有重玩的理由。** Route PB、S Rank、Replay Momentum 與 PB Ghost 讓玩家追求更乾淨、更快、更像自己的跑法。

## First-30-second philosophy

評審第一次打開作品時，不應先讀一段教學。

- 路線 cinematic 先建立身份。
- 短暫 GO cue 告訴玩家開始。
- 控制提示依裝置改寫。
- 速度起來後只提醒一次 Nitro。
- 第一個 checkpoint 命中後顯示 CLEAN，教學立即退出。
- 所有提示使用 pointer-events:none，不暫停、不鎖輸入。
- 同一 session 不重複打擾回鍋玩家。

## Route signatures

### 河岸東環 — FLOW
**RIVER EAST LOOP / 高速長彎**

- 冷青夜空
- 暖色路燈
- cyan road / HUD accent
- 目標：連續速度

### 霓虹西環 — PRECISION
**NEON WEST LOOP / 密集轉向**

- 洋紅霧色
- cyan + magenta facade rhythm
- pink HUD / presentation accent
- 目標：精準路線判讀

### 高架折返 — RHYTHM
**VIADUCT RETURN / 煞車節奏**

- steel-blue 夜色
- amber facade / road accent
- warm amber HUD accent
- 目標：煞車點與回正節奏

三個 signature 都只重調既有材質、fog、lighting 與 DOM CSS variable：

- 0 new geometry
- 0 new draw groups
- 0 physics bodies
- 0 colliders
- 0 camera occluders

## Replay structure

- Route-specific score / time / combo PB
- Route S-clear count
- Replay Momentum V3
- PB Ghost Replay
- AHEAD / BEHIND / EVEN live delta
- Rank-adaptive finish presentation

## Technical constraints as design material

Strict Chromium software LOW budget:

- Draw calls: <= 60
- Triangles: <= 110,000

V0.9.4 pre-final evidence:

- Route Signature: PASS
- Three palettes measurably distinct
- Signature switch: 0 physics / 0 camera-occluder delta
- Route-signature render sample: 58 calls / 95,988 triangles
- Chromium high-speed LOW: 59 calls / 95,988 triangles / peak 180.7 km/h
- Traffic Flow V3: 18 cars / 9 modeled lanes / 0 traffic physics bodies
- Award Presentation / Award HUD / FirstRunDirector / Route Signature authority add 0 render groups

Pre-final full validation:

https://github.com/qookey109-pixel/car/actions/runs/37409007605

## Submission capture pack

The deterministic capture script is:

`tests/submission-capture.mjs`

V0.9.4 produces:

1. `01-title-screen.png`
2. `02-route-river.png`
3. `03-route-neon.png`
4. `04-route-viaduct.png`
5. `05-first-30-seconds.png`
6. `06-speed-city.png`
7. `07-ghost-pursuit.png`
8. `08-finish-climax.png`
9. `09-mobile-844x390.png`
10. `video/gameplay-showcase.webm`

The capture pack comes from the exact branch build, not manually edited screenshots.

## V0.9.5 submission review

Full validation on exact SHA `11c2047ae6d11c0cf733487cf8fe42d704c4c2d5` passed Chromium, WebKit, Objective, Audio and Submission Capture.

- Capture artifact: `v095-submission-package` (ID `11428544656`).
- Asset inventory independently inspected: 9 PNG frames, `video/gameplay-showcase.webm`, submission brief/page.
- Contact-sheet human review: frame 05 was obscured by an overlapping route-intro card; the capture-only correction hides that card before the onboarding frame.
- **A new exact-head artifact and fresh review are required** before selecting the hero frame or publishing an immutable V0.9.5 preview.

## Accepted earlier preview

V0.9.3 immutable candidate:

https://qookey109-pixel.github.io/car/v0.9.3-ad0fa5f/

Do not overwrite earlier immutable previews. V0.9.5 needs its own SHA-specific URL after the corrected 9-frame capture and full matrix pass.

## V0.9.5 submission freeze checklist

- [x] First-30-second onboarding feature
- [x] Award route identity presentation
- [x] Award HUD hierarchy
- [x] Three route-specific visual signatures
- [x] PB Ghost / Replay Momentum
- [x] Traffic flow / signal behavior
- [x] Chromium + WebKit full acceptance on `11c2047...`
- [x] V0.9.5 9-frame + WebM inventory on `11c2047...`
- [ ] Corrected frame 05 captured and visually reviewed on the final head
- [ ] Full matrix passes on the final head
- [ ] Immutable V0.9.5 preview
- [ ] Human hero-frame selection
- [ ] Real Mac Safari hardware check
- [ ] Competition-form wording freeze
- [ ] Submission freeze tag / receipt
