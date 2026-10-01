# 三蘆夜行 — Submission Package

Status date: 2026-10-01 (Asia/Taipei)

## One-line pitch

**三蘆夜行**是一款以三重／蘆洲夜間城市節奏為核心的短篇瀏覽器駕駛遊戲：玩家不是征服一張大地圖，而是在三條不同性格的路線中讀懂速度、街廓與自己的節奏。

## Short description

三蘆夜行把都市夜間駕駛拆成三種可重玩的節奏：FLOW、PRECISION、RHYTHM。玩家從路線身份、Gate、速度與車流中自然理解目標，完成後再透過 Rank、Route PB、Replay Momentum 與 Ghost Replay 持續追逐更乾淨的跑法。作品以瀏覽器原生方式運作，支援鍵盤、觸控與手把，並在嚴格 LOW render budget 下維持完整城市感。

## Design statement

這個專案的核心不是「做一個更大的城市」，而是「讓有限的城市元素形成可以被駕駛讀懂的節奏」。

設計上有三個主要原則：

1. **城市要參與遊戲，而不是只當背景。** 號誌、車流、街區亮度、道路方向與 checkpoint 導引共同影響玩家對速度與下一步的判讀。
2. **每條路線必須有可被記住的性格。** 河岸東環偏 FLOW，霓虹西環偏 PRECISION，高架折返偏 RHYTHM；差異來自道路形狀、節奏與決策壓力，而不是單純換名字。
3. **短局要有重玩的理由。** Route PB、S Rank、Replay Momentum 與 PB Ghost 讓玩家不是只追「破關」，而是追更乾淨、更快、更像自己的跑法。

## First-30-second philosophy

評審第一次打開作品時，不應先讀一段教學。

因此 V0.9.2 的首次體驗採用：

- 路線 cinematic 先建立身份。
- 短暫 GO cue 告訴玩家開始。
- 控制提示依裝置改寫。
- 速度起來後只提醒一次現有 Nitro 操作。
- 第一個 checkpoint 命中後顯示 CLEAN，教學立即退出。
- 所有提示使用 pointer-events:none，不暫停、不鎖輸入。
- 同一 session 不重複打擾回鍋玩家。

## Route identities

### 河岸東環 — FLOW
RIVER EAST LOOP / 高速長彎

目標是建立連續速度，不被彎道打斷節奏。

### 霓虹西環 — PRECISION
NEON WEST LOOP / 密集轉向

目標是用乾淨的轉向與路線判讀穿過緊密街廓。

### 高架折返 — RHYTHM
VIADUCT RETURN / 煞車節奏

目標是用煞車點與回正時機維持節奏。

## Replay structure

- Route-specific score / time / combo PB
- Route S-clear count
- Replay Momentum V3
- PB Ghost Replay
- AHEAD / BEHIND / EVEN live delta
- Rank-adaptive finish presentation

## Technical constraints as design material

The project intentionally keeps a strict Chromium software LOW budget:

- Draw calls: <= 60
- Triangles: <= 110,000

Current V0.9.2 accepted candidate:

- 59 draw calls
- 95,988 triangles
- peak 180.7 km/h
- 18 visual traffic cars
- 9 modeled traffic lanes
- 0 traffic physics bodies
- 0 traffic colliders
- 0 traffic camera occluders
- Award Presentation / Award HUD / FirstRunDirector: 0 WebGL render groups

## Input

Desktop:
- W / ↑ — accelerate
- S / ↓ — brake / reverse
- A / ← — left
- D / → — right
- Space — drift / handbrake
- Shift — N₂O

Mobile:
- touch steering
- GAS / BRAKE
- DRIFT / N₂O

Gamepad:
- left stick steering
- right stick camera
- triggers throttle / brake

## Submission capture pack

The repository owns a deterministic capture script:

tests/submission-capture.mjs

It produces:

1. 01-title-screen.png
2. 02-route-identity.png
3. 03-first-30-seconds.png
4. 04-speed-city.png
5. 05-ghost-pursuit.png
6. 06-finish-climax.png
7. 07-mobile-844x390.png
8. gameplay-showcase.webm

The capture pack is generated from the exact branch build, not from manually edited screenshots.

## Current accepted gameplay base

Exact V0.9.2 SHA:

a84a54f6fcf9fb3e9dcc09c1783e96da218c9dfe

Immutable preview:

https://qookey109-pixel.github.io/car/v0.9.2-a84a54f/

## Submission freeze checklist

- [x] First-30-second onboarding
- [x] Award route identity presentation
- [x] Award HUD hierarchy
- [x] PB Ghost / Replay Momentum
- [x] Traffic flow / signal behavior
- [x] Chromium + WebKit automated acceptance
- [x] Immutable SHA preview
- [ ] Final capture artifact
- [ ] Final desktop visual QA
- [ ] Final mobile visual QA
- [ ] Real Mac Safari hardware check
- [ ] Final competition-form wording freeze
- [ ] Submission freeze tag / receipt
