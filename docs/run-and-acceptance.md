# Run And Acceptance Guide

本文档说明如何在本地运行、测试和验收当前 RISC PJ2 项目。

## 1. Environment

需要本地准备：

- JDK 21+
- Maven 3.9+
- Node.js 20+
- npm 10+

可选但推荐：

- Playwright 可运行环境
- 现代桌面浏览器（Chrome / Chromium / Edge）

## 2. Install Dependencies

在仓库根目录执行：

```bash
cd /Users/lea/prj/RISC
make install
```

如果你不想用 `make`，也可以单独安装前端依赖：

```bash
cd /Users/lea/prj/RISC/frontend
npm install
```

## 3. Start The Project

### Option A: Recommended

在仓库根目录执行：

```bash
cd /Users/lea/prj/RISC
make dev-up
```

这个命令会：

1. 先启动 backend
2. 等待 `http://127.0.0.1:8080/api/health` 可用
3. 再启动 frontend

默认地址：

- backend: `http://127.0.0.1:8080`
- frontend: `http://127.0.0.1:5173`

### Option B: Start Separately

先启动后端：

```bash
cd /Users/lea/prj/RISC/backend
mvn spring-boot:run
```

再启动前端：

```bash
cd /Users/lea/prj/RISC/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

## 4. Stop The Project

如果你是用 `make dev-up` 启动的后台服务，可以在仓库根目录执行：

```bash
cd /Users/lea/prj/RISC
make backend-stop
```

前端开发服务如果在前台运行，直接 `Ctrl+C` 即可。

## 5. Automated Checks

### Backend tests

```bash
cd /Users/lea/prj/RISC/backend
mvn test -q
```

覆盖重点：

- PJ2 territory / resource / tech model
- move / attack food cost
- tech upgrade / unit upgrade
- mixed-level combat
- account login / multi-game return

### Frontend tests

```bash
cd /Users/lea/prj/RISC/frontend
npm test
```

覆盖重点：

- upgrade 表单合法性
- territory intel / log summary formatting

### Frontend build

```bash
cd /Users/lea/prj/RISC/frontend
npm run build
```

## 6. Browser Acceptance

打开：

```text
http://127.0.0.1:5173
```

建议按下面顺序验收。

### Scenario A: Login and room return

1. 注册一个新账号。
2. 登录后确认首页出现 `我的对局 / My Games`。
3. 点击 `创建房间`。
4. 再点击一次 `创建房间`，得到第二个房间。
5. 确认左侧 active games 列表里至少有两个房间。
6. 点击 `切换 / Switch` 返回第一个房间。

验收标准：

- 登录成功后不会再要求一次性 room token
- 同一账号可以看到多个 active games
- 切换房间后左侧当前 `roomId` 会更新

### Scenario B: Lobby and start flow

1. 在一个房间里点击 `新增空位`。
2. 用另一个窗口或另一个浏览器登录第二个账号并加入同一房间。
3. Host 点击 `开始游戏`。

验收标准：

- lobby 中能看到 seat 状态
- 只有 Green host 可以开始游戏
- 房间进入 `SETUP` 阶段

### Scenario C: Initial placement

1. 在 `SETUP` 阶段给每个起始领地分配 reserve units。
2. 可选地把某一块勾成 `空白 / Empty`。
3. 点击 `锁定布置`。

验收标准：

- 未放完 reserve units 时不允许提交
- 提交后出现 waiting 文案或 setup locked 文案

### Scenario D: PJ2 resource and upgrade flow

1. 进入 `ORDERS` 阶段后观察左侧 orders 面板。
2. 切换到 `升科技 / Tech Upgrade` 或 `升兵种 / Unit Upgrade`。
3. 选择领地、等级、数量。
4. 查看 `预计消耗` 是否更新。
5. 故意制造一次非法升级选择。

验收标准：

- 玩家面板显示 `Resources` 和 `Tech level`
- territory intel 显示 `Owner / Size / Production / Units`
- 非法升级会在前端立即提示
- 提交后 backend 仍然是最终裁决者

### Scenario E: Move and attack

1. 选择 `移动 / Move`。
2. 点击 source 和 target，观察 `预计消耗` 的 `FOOD` 变化。
3. 再选择 `进攻 / Attack`，排一条进攻。
4. 点击 `添加指令`，确认进入 queued list。
5. 点击 `提交回合`。

验收标准：

- queued list 中能看到待提交命令
- turn summary 和 resolution log 会在结算后更新
- move / attack 消耗符合 PJ2 规则

## 7. What To Look For In The UI

验收时建议重点看这些位置：

- 左栏：
  - 登录状态
  - 房间号
  - active games
  - order entry
- 中间地图：
  - territory 名称
  - `size`
  - 当前单位数
- 右栏：
  - faction resources
  - tech level
  - territory intel
  - turn summary
  - battle log

## 8. Existing Smoke Artifacts

仓库里已经保留了部分 smoke 产物，可作为参考：

- [pj2-smoke.png](/Users/lea/prj/RISC/output/playwright/pj2-smoke.png)
- [pj2-smoke-state.json](/Users/lea/prj/RISC/output/playwright/pj2-smoke-state.json)
- [pj2-phase8-switch.png](/Users/lea/prj/RISC/output/playwright/pj2-phase8-switch.png)
- [pj2-phase8-switch-state.json](/Users/lea/prj/RISC/output/playwright/pj2-phase8-switch-state.json)

## 9. Acceptance Checklist

最终可按下面这份最短清单勾选：

- [ ] `make dev-up` 或分开启动后，前后端都能正常访问
- [ ] `mvn test -q` 通过
- [ ] `npm test` 通过
- [ ] `npm run build` 通过
- [ ] 能注册并登录账号
- [ ] 同一账号能创建并切换多个房间
- [ ] lobby / setup / orders / game over 四个阶段都能进入
- [ ] UI 能显示 `size`、resources、tech level、territory intel
- [ ] 能提交 move / attack / upgrade orders
- [ ] 非法 upgrade 能收到前端提示
- [ ] 回合结算后 log 和 summary 会更新

## 10. Troubleshooting

### Frontend starts on a different port

如果 Vite 自动换了端口，建议手动固定：

```bash
cd /Users/lea/prj/RISC/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

### Backend cannot start

优先检查：

- `java -version`
- `mvn -version`
- `8080` 端口是否被占用

### Browser flow looks stale after restart

当前账号和房间状态是内存实现。backend 重启后，旧 room 会消失，这时重新登录并重新创建房间即可。
