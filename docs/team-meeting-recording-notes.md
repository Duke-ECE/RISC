# Team Meeting Recording Notes

本文件作为 Phase 9 的“团队会议录屏说明”，用于说明录屏建议内容、顺序和讲解重点。

## Recording Scope

建议把录屏控制在 5-8 分钟，覆盖下面四段：

1. 项目目标和 PJ2 相比 PJ1 的主要变化
2. 账号登录、多局切换和房间返回
3. PJ2 新规则展示
4. 架构与测试说明

## Suggested Demo Order

1. 打开首页并登录账号。
2. 创建一个房间，再创建第二个房间。
3. 展示左栏 active games 列表，并切换回第一个房间。
4. 开始一局游戏，说明 setup 和 orders 两个阶段。
5. 演示一次 `UPGRADE_TECH` 或 `UPGRADE_UNIT`。
6. 展示右侧 territory intel、player resources、turn log。
7. 最后说明 backend tests、frontend tests 和 Playwright smoke。

## Presenter Notes

- 讲解时先说“server 是最终裁决者”，再说“frontend 会提前做 hint”。
- 对 PJ2 的重点解释：
  - territory size
  - food / technology resources
  - tech upgrade delayed effect
  - mixed-level combat
  - account-based game return

## Evidence Collected In This Repo

- automated backend tests: `backend/src/test/java`
- frontend unit tests: `frontend/src/*.test.ts`
- browser smoke artifacts:
  - `output/playwright/pj2-smoke.png`
  - `output/playwright/pj2-phase8-switch.png`

## Recording Status

- 当前仓库已补齐录屏说明与建议讲稿。
- 若需要最终课程提交版录屏，只需按上面的顺序实际录制并替换成真实链接。
