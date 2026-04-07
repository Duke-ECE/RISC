# PJ2 Step 01 完成记录：领地 size 与资源产出展示

完成时间：2026-04-07

## 本次完成的功能

完成 PJ2 基础功能之一：为每个领地新增 `size` 和资源产出信息，并通过后端 API 返回给前端展示。

本次范围只包含领地元数据与展示：

- 每个领地拥有 `size` 属性。
- 每个领地拥有 `resourceProduction`，当前包含 `food` 和 `technology`。
- 地图生成时，每个玩家初始 3 块领地的总 `size` 一致。
- 地图生成时，每个玩家初始 3 块领地的 `food` 与 `technology` 总产出一致。
- 前端地图标签显示简短领地信息，例如 `S2 • F2 T2`。
- 前端侧栏新增“领地信息 / Territory Info”区域，展示每个领地的归属、单位数、size 和资源产出。
- 自动化文本状态 `render_game_to_text()` 也包含 `size` 和 `resourceProduction`，便于后续 Playwright 验收。

## 修改的文件

- `backend/src/main/java/com/risc/backend/game/TerritoryDefinition.java`
  - 在领地定义中新增 `size` 与 `resourceProduction` 字段。
- `backend/src/main/java/com/risc/backend/game/MapGenerator.java`
  - 为生成地图中的每个初始领地分配平衡的 size 与资源产出。
- `backend/src/main/java/com/risc/backend/game/dto/TerritoryView.java`
  - API 领地视图新增 `size` 与 `resourceProduction` 字段。
- `backend/src/main/java/com/risc/backend/game/GameEngine.java`
  - 在 `GameView` 构造时把领地 size 与资源产出传给前端。
- `backend/src/test/java/com/risc/backend/game/MapGeneratorTest.java`
  - 新增测试，验证生成地图包含 size、food、technology，并验证各玩家初始组总量一致。
- `frontend/src/main.ts`
  - 前端 `Territory` 类型新增 `size` 与 `resourceProduction`。
  - 地图绘制新增简短 size/资源标签。
  - `render_game_to_text()` 输出新增 size/资源。
  - 新增中英文 UI 文案与领地信息列表。
  - 修正本地 API 地址为 `http://localhost:8080`，避免用户机器上 `127.0.0.1:8080` 被 nginx 占用时请求打到错误服务。
- `frontend/src/style.css`
  - 新增领地信息列表样式。
- `frontend/dist/index.html`
- `frontend/dist/assets/index-BTiHCMKG.css`
- `frontend/dist/assets/index-BX1nADxx.js`
  - 运行 `npm run build` 后生成的前端构建产物。
  - 旧构建产物 `frontend/dist/assets/index-DxjRuvaI.css` 与 `frontend/dist/assets/index-BSEAI0kP.js` 被新的 hashed 文件替代。

## 验证记录

- 通过：`npm ci`
- 通过：`npm test`
  - `src/logSections.test.ts`
  - `src/turnSummary.test.ts`
- 通过：`npm run build`
- 通过：`mvn -DskipTests package`
- 通过：`mvn -Dtest=MapGeneratorTest test`
- 通过：`curl -i http://localhost:8080/api/health`
- 通过：`curl -i -X POST http://localhost:8080/api/rooms`
- 通过：API 自检脚本创建房间、加入第二位玩家、开始游戏后，返回 `phase=SETUP`、`territoryCount=6`，且 `allHaveMetadata=true`。
- 未通过：`mvn test`
  - 失败原因：既有 `GameServiceTest` 仍调用已禁用的单人接口 `GameService.applyPlacement()` / `GameService.playTurn()`。
  - 报错信息核心：`Single-player endpoint is disabled. Use /api/rooms for 2-5 player games.`
  - 判断：该失败与本次新增领地 size/资源功能无直接关系，是已有测试与当前多人房间架构不一致。
- 本地前端 `Load failed` 排查：
  - `127.0.0.1:8080` 命中的是 `nginx/1.29.5`，创建房间请求返回 `/admin/rooms` 404。
  - `localhost:8080` 命中的是 Spring Boot，健康检查和创建房间 API 均成功。
  - 因此前端 API base 从 `127.0.0.1` 调整为 `localhost`。

## 未包含在本次功能中的内容

以下需求没有在本次实现中处理，会作为后续独立步骤继续推进：

- 玩家 food / technology 资源账户。
- 回合结束时根据领地产出增加资源。
- move / attack 的 food 成本校验与扣除。
- upgrade order、科技等级、单位升级。
- 单位类型与 combat bonus。
- 登录密码、多游戏切换等联网账户能力。
