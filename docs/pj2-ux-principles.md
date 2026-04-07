# PJ2 UX Principles Mapping

本文件把当前实现和项目交付时希望强调的 UX 原则做一一对应。

## Principle 1: Rules Should Be Visible Before Commit

- 地图左侧 `当前选择` 卡片实时显示 source、target 和预计资源消耗。
- upgrade 表单在提交前就检查 technology 上限、单位数量和升级方向。
- 玩家面板直接显示 `resources` 和 `tech level`，避免把关键状态藏在日志里。

## Principle 2: Hidden Information Should Still Feel Explainable

- 地图和 side panel 区分可见与隐藏信息。
- 回合结束后用 `turn summary` + `resolution log` 解释发生了什么。
- combat log 保留配对与结果，便于课堂演示 mixed-level combat。

## Principle 3: Multiplayer Context Must Stay Legible

- 左栏固定展示房间号、当前账号和 active games。
- lobby 座位区把空位和已加入玩家可视化，减少“现在还差谁”的沟通成本。
- `waitingOnPlayers` 明确告诉用户当前卡在哪个玩家。

## Principle 4: Fast Iteration Beats Deep Navigation

- 顶部 phase pill、左栏 controls、右栏 intel/log 都留在同一页，不需要切多个 route。
- 常用动作都在一屏内完成：create/join room、switch game、queue order、commit turn。
- 键盘快捷键和地图点击可以混用，适合演示和快速测试。

## Principle 5: Server Authority, Client Guidance

- 前端做 legality hint 和 local preview，但不篡改最终规则。
- backend 统一验证 move/attack/upgrade cost 与合法性。
- 这样既保住规则一致性，也减少用户试错成本。

## Known Gaps

- 账号系统还是内存态，服务重启后无法保留历史房间。
- active games 目前是列表切换，没有搜索或筛选。
- attack order 还没有单独的“确认弹层”，依赖 queued list 做最后检查。
