# PJ2 Attack Order Prototype

本文件记录 PJ2 attack / order entry 在当前实现中的原型方案，供展示和课程交付使用。

## Design Goal

- 让玩家在一屏内完成 source 选择、target 选择、units 输入和 upgrade planning。
- 把 PJ2 新规则里最容易出错的部分前置暴露：
  - resource cost
  - technology gating
  - unit level upgrade legality
- 保持 server 作为最终裁决者，但尽量减少“提交后才发现不合法”的挫败感。

## Screen Layout

```text
+---------------------------------------------------------------+
| Top Bar: title, phase pill, language                          |
+-------------------------+-----------------+-------------------+
| Left Column             | Center          | Right Column      |
| - room / account        | - board canvas  | - player panels   |
| - active games          | - queued orders | - territory intel |
| - setup / orders form   |                 | - turn summary    |
| - commit/reset buttons  |                 | - resolution log  |
+-------------------------+-----------------+-------------------+
```

## Attack Order Flow

1. 选择 `ATTACK` 模式。
2. 在地图上点击己方领地作为 source。
3. 点击相邻敌方或空白领地作为 target。
4. 输入出兵数量。
5. 在左侧看到预计 `FOOD` 消耗。
6. 点击 `添加指令`，进入 queued orders。
7. 所有玩家都提交后，由 server 一次性结算。

## Upgrade Flow

1. 选择 `UPGRADE_UNIT` 或 `UPGRADE_TECH`。
2. 若是单位升级，先点选一个己方领地。
3. 选择 `from level` / `to level` 和数量。
4. UI 即时提示 technology 预计消耗。
5. 若当前 tech level、不足单位数、方向不合法，前端立即给出错误提示。
6. 最终提交时仍由 backend 再验证一次。

## Why This Prototype Matches PJ2

- 把 `food` / `technology` 成本直接放进当前选择卡片，符合 PJ2 对资源规划的强调。
- 把 active game 列表放在左栏，支持一个账号在多个房间间切换。
- 保留 battle log 和 territory intel，方便解释 mixed-level combat 的结果。

## Demo Notes

- 推荐演示顺序：登录 -> 创建房间 -> 开局 -> 提交一次 upgrade -> 展示 queued order -> 切换到另一个房间。
- 对 attack order 的解释重点放在：
  - source / target 选择方式
  - cost preview
  - queued orders
  - server-side resolution log
