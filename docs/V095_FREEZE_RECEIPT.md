# V0.9.5 Submission Freeze Receipt

Source branch: `feature/v0.9.5-submission-convergence`
Source exact SHA: `7321a59215b7c6e18fb536e7968b2ea00b9a5d87`
Immutable preview branch: `preview/v0.9.5-submission-7321a59`

## Exact validation evidence

- Award Candidate Validation run: `37499326222`
  - Chromium: SUCCESS
  - WebKit: SUCCESS
- Submission Capture run: `37499326250`
  - capture: SUCCESS
- Audio Feel validation: SUCCESS
- Objective Compass validation: SUCCESS

## Submission package evidence

Artifact: `v095-submission-package`

Contents verified:
- 01 title screen
- 02 river / FLOW
- 03 neon / PRECISION
- 04 viaduct / RHYTHM
- 05 First 30 Seconds
- 06 speed / city
- 07 Ghost pursuit
- 08 finish climax
- 09 mobile 844x390
- gameplay showcase WebM
- submission page

## Preserved runtime contract

- A = physical left
- D = physical right
- reverse contract unchanged
- no new Three.js geometry
- no new WebGL render groups
- no new physics bodies / colliders
- no new camera occluders
- LOW budget remains <= 60 calls / <= 110,000 triangles

## 3D asset pipeline

3d-asset-server is integrated only as a development-time discovery / licensing pipeline in V0.9.5.
Runtime asset integration remains unauthorized for this frozen candidate.

## Remaining external verification

- Real Mac Safari hardware verification remains external to CI.
- Competition-specific final word / character limits must be checked at submission time.

Do not overwrite the immutable preview. Do not merge PR #15 automatically.
