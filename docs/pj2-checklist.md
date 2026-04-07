# PJ2 Implementation Checklist

本文件把 `docs/pj2.pdf` 拆成可逐步落地的任务清单。目标不是一次性全做完，而是保证每个任务都有：

- 明确范围
- 明确数据模型影响
- 明确测试
- 完成后单独提交一次 commit

## Current Status Snapshot

- 已完成：Phase 0-8，其中包括需求影响面映射、backend `UPGRADE_TECH` / 单位升级 / PJ2 combat v2、frontend size 展示、升级 UI、预计资源消耗、本地非法升级提示，以及账号登录、多局列表与切换、对应单元测试与浏览器 smoke。
- 进行中：Phase 9 非代码交付物。
- 未完成：Phase 9 非代码交付物。
- 当前实现假设：`MOVE` / `ATTACK` 订单未额外让玩家选择出发单位等级时，server 默认优先调度高等级单位，并在 turn log 中输出实际分级明细。
- 本轮 smoke 产物：`output/playwright/pj2-smoke.png`、`output/playwright/pj2-smoke-state.json`、`output/playwright/pj2-phase8-switch.png`、`output/playwright/pj2-phase8-switch-state.json`

## Working Rules

- 一次只做一个 checklist item 或一个紧密相关的小组任务。
- 每个任务必须包含代码、测试、必要文档更新。
- 每完成一个任务就单独 commit，避免把多个需求混在一起。
- 前端交互改动需要补浏览器 smoke/debug；优先使用 `playwright` CLI。
- 不在前端先“伪实现”规则。规则先落后端，再接 UI。

## Requirement Impact Map

| PJ2 Requirement | Backend Impact | Frontend Impact | Test Impact |
| --- | --- | --- | --- |
| Territory `size` | `TerritoryDefinition` / `GameView` / move path pricing | map label, territory intel | backend model tests, frontend render tests, browser smoke |
| Resource production and totals | territory production, per-player totals, end-of-turn income | territory intel, player resource panel | backend income tests, browser smoke |
| `food` move/attack cost | server-side order validation and spend log | estimated cost preview, server error display | backend cost tests |
| `technology` upgrades | `UPGRADE_TECH`, `UPGRADE_UNIT`, tech caps, delayed completion | upgrade forms, local legality hints, queued order UX | backend upgrade tests, frontend unit tests, browser smoke |
| Mixed-level combat bonuses | leveled unit storage, combat pairing, multi-source aggregation | combat/result logs, unit breakdown visibility | backend combat tests |
| GUI map visibility | DTO fields for owner / units / resources / size / neighbors | canvas labels, side panels, queued actions | frontend tests, browser smoke |
| Login + game return | account/session model, room membership lookup, multi-game listing | auth flow, active game switcher | backend auth/integration tests, browser smoke |
| Non-code deliverables | n/a | prototype and UX docs may mirror implemented screens | document review only |

## Playwright Debug Loop

环境前提已确认：`npx` 可用。

后续每次涉及 UI 的任务，按这个流程验收：

1. 启动后端和前端。
2. 用 `playwright` 打开页面并创建房间。
3. 走一遍该任务对应的最短用户路径。
4. 截图并检查文本状态。
5. 若有交互 bug，先复现，再修，再重跑同一路径。

参考命令：

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"

"$PWCLI" open http://127.0.0.1:5173 --headed
"$PWCLI" snapshot
"$PWCLI" screenshot output/playwright/pj2-task.png
```

## Checklist

### Phase 0: Baseline and Docs

- [x] 读取 `pj1` / `pj2` 需求并形成差异分析
- [x] 建立逐步实现文档
- [x] 把每个需求映射到 backend/frontend/test 影响面

测试要求：

- 本阶段无业务测试
- 文档变更独立 commit

### Phase 1: Backend model for PJ2

- [x] 为 territory 增加 `size`
- [x] 为 territory 增加 resource production 定义
- [x] 为 player 增加 resource totals
- [x] 为 player 增加 `maxTechnologyLevel`
- [x] 为单位系统引入 level/type 表达
- [x] 更新 DTO，使前端能拿到 `size`、resource、unit breakdown

测试要求：

- 新增后端单元测试，验证初始地图包含 `size`
- 新增后端单元测试，验证初始玩家资源/科技等级
- 新增后端单元测试，验证 view/DTO 序列化字段完整

完成定义：

- 只增加模型和 view，不改变现有 move/attack 规则

### Phase 2: Resource economy

- [x] 回合结束时按占领领地增加资源
- [x] 定义 `food` 与 `technology` 两种资源
- [x] 初始化时保证不同玩家起始领地组资源总产出相等
- [x] 初始化时保证不同玩家起始领地组总 `size` 相等

测试要求：

- 后端测试：回合结束资源正确增加
- 后端测试：当回合新占领领地会参与资源结算
- 后端测试：初始分组资源与 size 平衡

完成定义：

- 旧 UI 不一定完整展示，但 API 已返回正确数据

### Phase 3: Move and attack cost

- [x] move 消耗 `food = path total size * units`
- [x] move 成本按最小合法路径计算
- [x] attack 消耗 `1 food / unit`
- [x] server 校验资源是否足够
- [x] turn log 增加资源消耗明细

测试要求：

- 后端测试：最短路径成本计算正确
- 后端测试：资源不足时 move 被拒绝
- 后端测试：资源不足时 attack 被拒绝
- 后端测试：多个 order 组合时资源累计扣减正确

完成定义：

- 所有 cost 规则只由 server 裁决

### Phase 4: Upgrade orders and tech progression

- [x] 新增 `UPGRADE_TECH` 或等价升级指令
- [x] 新增单位升级指令
- [x] 技术升级消耗 technology resource
- [x] 技术升级 1 turn 后生效
- [x] 每回合最多升 1 级 tech level
- [x] 单位升级支持跨级差价
- [x] 单位升级受 `maxTechnologyLevel` 限制

测试要求：

- [x] 后端测试：tech level 从 1 开始
- [x] 后端测试：tech upgrade 延迟 1 回合生效
- [x] 后端测试：同回合不能升多级
- [x] 后端测试：单位升级按差价收费
- [x] 后端测试：超过 tech level 限制时报错

完成定义：

- [x] API 能表达 upgrade order
- [x] log 能说明升级结果和生效时机

### Phase 5: Combat v2

- [x] combat roll 加上单位 bonus
- [x] 实现 attacker/defender 配对规则
- [x] 支持混合等级部队战斗
- [x] 战斗日志输出实际参与配对和 bonus

测试要求：

- [x] 后端测试：不同 level 单位 bonus 生效
- [x] 后端测试：配对顺序符合 pj2 规则
- [x] 后端测试：多来源合并攻击后仍按单位等级正确结算
- [x] 后端测试：多方攻击同一地与新 bonus 规则兼容

完成定义：

- [x] combat 行为与 pj2 规则一致

### Phase 6: Frontend data display

- [x] 地图上显示 territory `size`
- [x] 显示每块领地的 resource production
- [x] 显示每块领地的单位类型/等级分布
- [x] 玩家面板显示当前资源与 tech level

测试要求：

- [x] 前端单元测试：新字段渲染格式
- [x] `playwright` smoke：能在 UI 中看到 size/resource/tech 信息

完成定义：

- [x] 不要求本阶段完成升级交互，只先把信息展示出来

### Phase 7: Frontend order entry for PJ2

- [x] 为 upgrade order 提供 UI
- [x] 下单前展示预计资源消耗
- [x] 非法升级选择在前端提前提示
- [x] 保持 server 为最终裁决者

测试要求：

- [x] 前端单元测试：表单状态与文案
- [x] `playwright` smoke：创建房间并完成一次 upgrade 提交
- [x] `playwright` smoke：非法输入能看到错误提示

完成定义：

- [x] UI 可以完整操作 pj2 新规则

### Phase 8: Accounts and game return

- [x] 引入 `login + password`
- [x] 玩家可以重新登录并回到历史 game
- [x] 一个玩家可加入多个 game
- [x] 前端可列出并切换 active games

测试要求：

- [x] 后端集成测试：注册/登录/鉴权
- [x] 后端集成测试：同账号返回已有游戏
- [x] 后端集成测试：同账号加入多个房间
- [x] `playwright` smoke：登录后切换不同房间

完成定义：

- [x] 不再依赖一次性 room token 作为长期身份

### Phase 9: Non-code deliverables

- [ ] attack order prototype 文档或图片
- [ ] UX principles 对照说明
- [ ] 团队会议录屏说明/链接
- [ ] 更新 UML/architecture 文档

测试要求：

- 无自动化测试

## Suggested Commit Order

建议按下面顺序逐个提交：

1. `docs: add pj2 implementation checklist`
2. `backend: add pj2 territory/player model skeleton`
3. `backend: add resource income and balanced setup`
4. `backend: enforce food costs for move and attack`
5. `backend: add tech and unit upgrade orders`
6. `backend: implement pj2 combat bonuses and pairing`
7. `frontend: display pj2 resources size and unit levels`
8. `frontend: add pj2 upgrade order workflow`
9. `backend: add account login and multi-game support`
10. `docs: add pj2 prototype ux and delivery notes`

## Immediate Next Task

下一步建议做 `Phase 9: Non-code deliverables`，原因：

- Phase 1-8 的代码功能已经具备端到端闭环
- 剩余差距主要在原型、UX 对照、会议说明与 UML/architecture 文档
- 这一阶段适合以文档和交付物为主，避免把源码任务和课程材料混在同一个 commit
