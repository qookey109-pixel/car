# AI Development Tooling — MCP + Three.js Skills

These tools improve development and QA. They must stay outside the player runtime bundle.

## 1. Chrome DevTools MCP

Official project: `ChromeDevTools/chrome-devtools-mcp`.

Codex setup:

```bash
codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest
```

Recommended for Car profiling: use an isolated browser profile and avoid personal/signed-in tabs. Where supported, add `--isolated`; `--no-performance-crux` can be used when field-data lookup is not wanted.

Use it for:
- Performance traces and long-frame diagnosis
- Main-thread / scripting / layout / paint inspection
- Console and source-mapped runtime errors
- Network waterfalls and asset loading
- Screenshots and live DOM/CSS inspection

Do not use DevTools MCP results alone as release evidence. Any important finding should become a deterministic test or measured acceptance rule.

## 2. Three.js Skills

Source: `alton47/threejs-skills`.

Install with the Agent Skills CLI:

```bash
npx skills add https://github.com/alton47/threejs-skills
```

Highest-value skills for this project:
- `threejs-performance`: draw calls, instancing, LOD/culling, geometry/material cost
- `threejs-camera`: chase-camera behavior and controls
- `threejs-lighting`: night readability without uncontrolled light-count growth
- `threejs-physics`: Cannon-es integration guidance
- `threejs-audio`: Web Audio / Three.js audio guidance when relevant

The skills are guidance, not authority. Do not apply generic recommendations that conflict with validated project behavior.

## 3. Existing Playwright suite remains the release gate

The repository already has deterministic Chromium/WebKit checks. Keep Playwright as the reproducible contract and use MCP for exploration.

Preferred loop:

```text
Exact candidate
  -> Playwright baseline
  -> Chrome DevTools MCP trace
  -> identify measured bottleneck
  -> Three.js skill-guided minimal fix
  -> add/extend regression
  -> Chromium + WebKit + LOW budget
  -> visual QA screenshot
  -> immutable Pages preview
```

## 4. Car-specific profiling checklist

When profiling a candidate, verify:
- LOW render calls remain <= 60
- triangles remain <= 110,000
- no accidental transmission/post-processing extra pass
- no per-frame instance buffer upload unless the instances actually change
- no new transparent layer that harms sorting or fill-rate without clear benefit
- high-speed 844x390 HUD stays readable
- camera/road-rush effects remain neutral when Motion is disabled
- performance work does not alter A/D steering, reverse, colliders or challenge rules

## 5. Security / privacy

Chrome DevTools MCP can inspect browser data. Use a dedicated/isolated profile for game QA and avoid exposing unrelated personal sessions, cookies or credentials.

External skills may contain instructions and examples. Treat them as untrusted advisory material until checked against this repository's contracts and licenses.
