# Manual Test Notes

本文件记录当前无法在这个环境内完整自动验证、需要你本地手工确认的项目。

## Why Manual Checks Are Needed

当前仓库里有一部分测试已经自动化：

- `backend`: `mvn test`
- `frontend`: `npm test -- --run`
- `frontend`: `npm run build`

但下面这些检查仍依赖本地浏览器或可用的 Playwright 浏览器二进制：

- 前端页面的真实渲染
- 地图点击/悬停交互
- 多窗口加入房间
- 前后端一起联调后的 UI 行为

## Current Unverified Areas

### Frontend PJ2 data display

本轮已经实现，但尚未在真实浏览器中完成 smoke：

- 玩家面板显示 `Tech level`
- 玩家面板显示 `Resources`
- 领地详情面板显示：
  - `Owner`
  - `Size`
  - `Production`
  - `Units`

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
npm test -- --run
npm run build
```

### Optional browser smoke with Playwright

如果你本地已经装好 Playwright 浏览器：

```bash
cd /Users/lea/prj/RISC/frontend
npx playwright install chromium
```

然后可以再跑仓库里的客户端脚本做基本截图：

```bash
cd /Users/lea/prj/RISC
node frontend/web_game_playwright_client.js \
  --url http://127.0.0.1:5173 \
  --click-selector '#create-room' \
  --actions-json '[]' \
  --iterations 1 \
  --pause-ms 500 \
  --screenshot-dir output/playwright/frontend-intel
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
