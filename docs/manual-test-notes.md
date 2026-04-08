# Manual Test Notes

本文件记录当前推荐保留的手工确认项，以及已经完成的自动化验证。

## Why Manual Checks Are Needed

当前仓库里已经自动化完成：

- `backend`: `mvn test`
- `frontend`: `npm test`
- `frontend`: `npm run build`
- `playwright` smoke：账号登录、创建房间、PJ2 upgrade 提交、active game 切换

仍建议保留一轮人工确认的部分：

- 前端页面的真实渲染
- 地图点击/悬停交互
- 多窗口加入房间
- 前后端一起联调后的 UI 行为

## Current Manual Focus

### Frontend readability and interaction polish

这些功能已经通过 smoke 覆盖过，但仍建议在最终提交前做一次肉眼检查：

建议你本地确认：

1. 启动后端和前端
2. 创建房间并开始游戏
3. 进入地图页后，确认右侧玩家面板出现 `Tech level` 与 `Resources`
4. 点击或悬停一块领地，确认 `Territory Intel` 面板更新
5. 确认 `Size / Production / Units` 文案和数值可读
6. 切换中文/英文，确认新增文案都能正常切换

## Suggested Commands

### Start services

```bash
cd /Users/lea/prj/RISC/backend
mvn spring-boot:run
```

```bash
cd /Users/lea/prj/RISC/frontend
npm run dev -- --host 127.0.0.1
```

### Frontend automated checks

```bash
cd /Users/lea/prj/RISC/frontend
npm test
npm run build
```

### Optional browser smoke with Playwright

如果你本地想复查 smoke：

```bash
cd /Users/lea/prj/RISC/frontend
npx playwright install chromium
```

可以直接用 skill wrapper：

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"

"$PWCLI" open http://127.0.0.1:5173 --headed
"$PWCLI" snapshot
```

## How To Record Findings

建议你本地验证后，把结果补成下面这种格式：

```text
Date:
Environment:

- [ ] Player resources visible
- [ ] Player tech level visible
- [ ] Territory intel updates on click
- [ ] zh/en labels correct
- [ ] Layout readable on desktop
- [ ] Layout readable on mobile

Notes:
```
