(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const l of r)if(l.type==="childList")for(const d of l.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function o(r){const l={};return r.integrity&&(l.integrity=r.integrity),r.referrerPolicy&&(l.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?l.credentials="include":r.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function a(r){if(r.ep)return;r.ep=!0;const l=o(r);fetch(r.href,l)}})();function ht(e){return e.startsWith("Committed move orders")||e.startsWith("Committed attack orders")||e.startsWith(" - Green")||e.startsWith(" - Blue")||e.startsWith(" - Red")?"orders":e.startsWith("Battle queue")||e.startsWith("Combat starts")||e.startsWith("  Round ")||e.startsWith("Combat result")?"combat":e.startsWith("Reinforcement:")?"reinforcement":e.startsWith(" - ")&&e.includes(" holds ")&&e.includes(" units.")||e.startsWith("Turn ")&&e.endsWith(" final map state:")?"summary":"misc"}function vt(e){switch(e){case"orders":return"Orders";case"combat":return"Combat";case"reinforcement":return"Reinforcements";case"summary":return"End Of Turn";default:return"Notes"}}function yt(e){const t=[];for(const o of e){const a=ht(o),r=t.at(-1);if(!r||r.kind!==a){t.push({title:vt(a),kind:a,entries:[o]});continue}r.entries.push(o)}return t}const bt={BASIC:1,LEVEL_1:1,LEVEL_2:2,LEVEL_3:3,LEVEL_4:4,LEVEL_5:5,LEVEL_6:6},He={BASIC:0,LEVEL_1:3,LEVEL_2:11,LEVEL_3:30,LEVEL_4:55,LEVEL_5:90,LEVEL_6:140},fe=["BASIC","LEVEL_1","LEVEL_2","LEVEL_3","LEVEL_4","LEVEL_5","LEVEL_6"];function Le(e){switch(e){case 1:return 50;case 2:return 75;case 3:return 125;case 4:return 200;case 5:return 300;default:return null}}function ot(e,t,o){return Math.max(0,(He[t]-He[e])*Math.max(0,o))}function Et(e,t,o,a,r){return r<=0||a<r||fe.indexOf(o)<=fe.indexOf(t)?!1:bt[o]<=e}function St(e){return Object.entries(e).filter(([,t])=>t>0)}function $t(e){return Object.entries(e).filter(([,t])=>t>0)}function wt(e){return{resourceEntries:St(e.resourceProduction),unitEntries:$t(e.unitCounts)}}const Lt=/([A-Za-z]+) MOVE (\d+) from ([A-Za-z]+) to ([A-Za-z]+)/,Tt=/Reinforcement: ([A-Za-z]+) owned by ([A-Za-z]+) gains 1 unit \((\d+) -> (\d+)\)\./,Rt=/- ([A-Za-z]+): ([A-Za-z]+) holds (\d+) units\./;function Ot(e){const t=new Map;for(const o of e){const a=o.match(Lt);if(a){const d=Number(a[2]),f=ue(t,a[3]),u=ue(t,a[4]);f.movementDelta-=d,u.movementDelta+=d;continue}const r=o.match(Tt);if(r){const d=ue(t,r[1]);d.owner=r[2],d.reinforcementDelta+=1,d.finalUnits=Number(r[4]);continue}const l=o.trim().match(Rt);if(l){const d=ue(t,l[1]);d.owner=l[2],d.finalUnits=Number(l[3])}}return Array.from(t.values()).filter(o=>o.movementDelta!==0||o.reinforcementDelta!==0).sort((o,a)=>o.territory.localeCompare(a.territory))}function ue(e,t){const o=e.get(t);if(o)return o;const a={territory:t,owner:null,movementDelta:0,reinforcementDelta:0,finalUnits:null};return e.set(t,a),a}const rt=document.querySelector("#app");if(!rt)throw new Error("Missing app root");const Ve=rt;let C=localStorage.getItem("risc_lang")==="en"?"en":"zh",b=localStorage.getItem("risc_auth_token"),te=localStorage.getItem("risc_auth_username"),x=[],pe=te??"",ne="";const Fe={zh:{language:"语言",chinese:"中文",english:"English",subtitle:"同时回合、隐藏提交，以及一张非常倔强的幻想大陆地图。",createRoom:"创建房间",login:"登录",register:"注册",logout:"退出登录",username:"用户名",password:"密码",authHint:"先登录账号，之后可以回到你参与过的房间。",join:"加入",roomIdPlaceholder:"房间号 (例如 ABC123)",tipJoin:"提示：开新窗口输入同一个房间号即可加入。",multiplayer:"多人房间",activeGames:"我的对局",switchGame:"切换",noActiveGames:"还没有已加入的房间。",room:"房间",you:"你",leave:"离开",newSeat:"新增空位",startGame:"开始游戏",startHint:"开始条件：无空位且至少 2 人。座位 {seats}/5 • 玩家 {players}。",waitingOn:"等待：{waiting}",orders:"指令",ordersHint:"点击地图上的领地来选择来源和目标。你可以用全部单位移动/进攻（领地可清空变无人占领）。",move:"移动",attack:"进攻",upgradeTech:"升科技",upgradeUnit:"升兵种",fullscreen:"全屏 (F)",source:"来源",target:"目标",currentSelection:"当前选择",none:"未选择",units:"单位数",queueOrder:"添加指令",clearOrders:"清空计划",commitTurn:"提交回合",newGame:"新对局",factions:"阵营",youLabel:"你",opponent:"对手",defeated:"已淘汰",territoriesLabel:"领地",totalUnitsLabel:"总兵力",resourcesLabel:"资源",techLevelLabel:"科技等级",territoryIntel:"领地情报",territorySize:"规模",territoryOwner:"占领者",territoryOutput:"产出",territoryUnits:"驻军",noTerritoryFocus:"选择或悬停一块领地以查看详细信息。",queuedAttacks:"已排队的进攻",noQueuedAttacks:"还没有排队的进攻。",noQueuedOrders:"还没有排队的 PJ2 指令。",remove:"删除",movesApplyHint:"移动会在本地立即生效；进攻会在提交时一起结算。",turnChanges:"本回合变化",resolutionLog:"结算日志",battleMap:"战场地图",pendingActions:"待提交操作：{count}",winnerWins:"{winner} 获胜",logOrders:"指令",logCombat:"战斗",logReinforcements:"增援",logEndOfTurn:"回合结束",logNotes:"备注",deltaMove:"移动",deltaReinforce:"增援",final:"最终",noTurnChanges:"暂无领地变化。",lobby:"大厅",setup:"布置",ordersPhase:"指令",gameOver:"结束",initialPlacement:"初始布置",placementHint:"分配你的 {reserve} 预备兵。你可以勾选某块为“空白”（无人占领）。",empty:"空白",unitsLeft:"剩余可放",lockPlacement:"锁定布置",needPlaceAll:"请先放完所有预备兵。剩余：{left}。",setupWaiting:"已提交布置，等待：{waiting}。",setupLocked:"布置已锁定。对手布置已揭示。",addedSeat:"已新增一个空位。",removedSeat:"已删除最后一个空位。",createdRoom:"已创建房间 {roomId}。",joinedRoom:"已加入房间 {roomId}，座位 {playerId}。",loggedIn:"已登录为 {username}。",loggedOut:"已退出登录。",leftRoom:"已离开房间。",enterRoomId:"请输入房间号再加入。",noRoomToJoin:"当前没有房间可加空位。",popupBlocked:"浏览器阻止了弹窗，请允许后再试。",startNeedRoom:"请先创建或加入房间。",chooseSourceAndTarget:"请先选择来源和目标领地。",notEnoughUnits:"该领地可用单位不足。",moveTargetsOnlyFriendly:"移动只能到己方领地或无人占领领地。",moveUnownedMustAdjacent:"移动到无人占领领地必须相邻。",moveNeedsPath:"移动到己方领地需要一条己方连通路径。",attackMustNotFriendly:"进攻目标必须是敌方或无人占领领地。",attackMustAdjacent:"进攻必须选择相邻领地。",upgradeNeedSource:"升级单位前请先选择你的领地。",upgradeNeedLevels:"请选择升级前后的单位等级。",upgradeTechMaxed:"当前科技已到上限。",upgradeTechQueued:"本回合已经排过一次科技升级。",upgradeIllegal:"当前升级选择不合法，请检查科技等级、单位数量和升级方向。",upgradeTechQueuedDone:"已排队科技升级。",upgradedUnitQueued:"已排队单位升级 {units}：{source} {fromLevel} -> {toLevel}。",fromLevel:"起始等级",toLevel:"目标等级",estimatedCost:"预计消耗",techOnlyOnce:"每回合最多 1 次科技升级，下一回合生效。",sourceForUpgrade:"升级领地",territorySizeMap:"规模 S{size}",turnShort:"回合",resourceFood:"粮食",resourceTechnology:"科技",unowned:"无人占领",orderMoveLabel:"移动",orderAttackLabel:"进攻",orderTechLabel:"科技升级",orderUnitLabel:"兵种升级",orderIn:"在",orderFrom:"从",orderTo:"到",levelBasic:"基础兵",level1:"1级兵",level2:"2级兵",level3:"3级兵",level4:"4级兵",level5:"5级兵",level6:"6级兵",playerGreen:"绿色",playerBlue:"蓝色",playerRed:"红色",playerYellow:"黄色",playerPurple:"紫色",warOver:"战争结束。",turnResolved:"回合已结算，继续规划下一回合。",chooseOwnSource:"来源必须选择你自己的领地。",sourceNoUnits:"该领地没有可用于移动/进攻的单位。",sourceCleared:"已取消来源选择。",targetSelected:"目标已选择：{name}。",sourceSelected:"来源已选择：{name}。请继续选择目标。",moved:"已移动 {units}：{source} → {target}。",queuedAttack:"已排队进攻 {units}：{source} → {target}。",clearedPlanned:"已清空计划操作。",removedAttack:"已删除该条进攻。",queuedOrderHint:"按 Enter 可快速添加/提交；A=进攻，B=移动。",selectionCleared:"已清空选择。",sourceSelectedCursor:"来源已选择：{name}。移动光标并再次按空格选择目标。",targetSelectedEnter:"目标已选择：{name}。按回车添加指令。",failedToLoad:"加载失败：{error}",gameStartedSetup:"已开始游戏，请提交初始布置。",gameStarted:"游戏已开始。"},en:{language:"Language",chinese:"中文",english:"English",subtitle:"Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.",createRoom:"Create room",login:"Login",register:"Register",logout:"Log out",username:"Username",password:"Password",authHint:"Sign in first so you can return to your games later.",join:"Join",roomIdPlaceholder:"Room ID (e.g. ABC123)",tipJoin:"Tip: open another window and join the same Room ID.",multiplayer:"Multiplayer",activeGames:"My Games",switchGame:"Switch",noActiveGames:"No active games yet.",room:"Room",you:"You",leave:"Leave",newSeat:"New seat",startGame:"Start game",startHint:"Start requires no empty seats and at least 2 players. Seats {seats}/5 • Players {players}.",waitingOn:"Waiting on: {waiting}",orders:"Orders",ordersHint:"Click territories on the map to choose source and target. You may move/attack with all units (territories can become unoccupied).",move:"Move",attack:"Attack",upgradeTech:"Tech Upgrade",upgradeUnit:"Unit Upgrade",fullscreen:"Fullscreen (F)",source:"Source",target:"Target",currentSelection:"Current Selection",none:"None",units:"Units",queueOrder:"Queue Order",clearOrders:"Clear Planned Actions",commitTurn:"Commit Turn",newGame:"New Game",factions:"Factions",youLabel:"You",opponent:"Opponent",defeated:"Defeated",territoriesLabel:"Territories",totalUnitsLabel:"Total units",resourcesLabel:"Resources",techLevelLabel:"Tech level",territoryIntel:"Territory Intel",territorySize:"Size",territoryOwner:"Owner",territoryOutput:"Production",territoryUnits:"Units",noTerritoryFocus:"Select or hover a territory to inspect its details.",queuedAttacks:"Queued Attacks",noQueuedAttacks:"No queued attacks yet.",noQueuedOrders:"No queued PJ2 orders yet.",remove:"Remove",movesApplyHint:"Moves apply immediately in your browser. Attacks resolve together when you commit.",turnChanges:"Turn Changes",resolutionLog:"Resolution Log",battleMap:"Battle Map",pendingActions:"Pending actions: {count}",winnerWins:"{winner} wins",logOrders:"Orders",logCombat:"Combat",logReinforcements:"Reinforcements",logEndOfTurn:"End Of Turn",logNotes:"Notes",deltaMove:"move",deltaReinforce:"reinforce",final:"final",noTurnChanges:"No territory changes resolved yet.",lobby:"LOBBY",setup:"SETUP",ordersPhase:"ORDERS",gameOver:"GAME OVER",initialPlacement:"Initial Placement",placementHint:"Distribute your {reserve} reserve units. You may mark a starting territory as empty (unoccupied).",empty:"Empty",unitsLeft:"Units left",lockPlacement:"Lock Placement",needPlaceAll:"Place all reserve units first. Units left: {left}.",setupWaiting:"Setup submitted. Waiting on: {waiting}.",setupLocked:"Setup locked in. Opponents have revealed their placements.",addedSeat:"Added an empty seat.",removedSeat:"Removed the last empty seat.",createdRoom:"Created room {roomId}.",joinedRoom:"Joined room {roomId} as {playerId}.",loggedIn:"Logged in as {username}.",loggedOut:"Logged out.",leftRoom:"Left room.",enterRoomId:"Enter a room ID to join.",noRoomToJoin:"No room to add a seat.",popupBlocked:"Popup blocked. Allow popups for this site, then try again.",startNeedRoom:"Create or join a room first.",chooseSourceAndTarget:"Choose a source and a target territory first.",notEnoughUnits:"That territory does not have enough spare units.",moveTargetsOnlyFriendly:"Move can only target your own territories or an unoccupied territory.",moveUnownedMustAdjacent:"Moves into unoccupied territories must be adjacent.",moveNeedsPath:"Moves into owned territories need a friendly path.",attackMustNotFriendly:"Attack orders must target enemy or unoccupied territories.",attackMustAdjacent:"Attack orders must target adjacent territories.",upgradeNeedSource:"Choose one of your territories before upgrading units.",upgradeNeedLevels:"Choose both the current and target unit levels.",upgradeTechMaxed:"Technology is already maxed out.",upgradeTechQueued:"A tech upgrade is already queued this turn.",upgradeIllegal:"That upgrade is not legal with the current tech level, unit counts, or direction.",upgradeTechQueuedDone:"Queued a technology upgrade.",upgradedUnitQueued:"Queued unit upgrade {units}: {source} {fromLevel} -> {toLevel}.",fromLevel:"From level",toLevel:"To level",estimatedCost:"Estimated cost",techOnlyOnce:"At most one tech upgrade per turn. It completes next turn.",sourceForUpgrade:"Upgrade territory",territorySizeMap:"Size S{size}",turnShort:"T",resourceFood:"Food",resourceTechnology:"Technology",unowned:"Unowned",orderMoveLabel:"Move",orderAttackLabel:"Attack",orderTechLabel:"Tech Upgrade",orderUnitLabel:"Unit Upgrade",orderIn:"in",orderFrom:"from",orderTo:"to",levelBasic:"Basic",level1:"Level 1",level2:"Level 2",level3:"Level 3",level4:"Level 4",level5:"Level 5",level6:"Level 6",playerGreen:"Green",playerBlue:"Blue",playerRed:"Red",playerYellow:"Yellow",playerPurple:"Purple",warOver:"The war is over.",turnResolved:"Turn resolved. Plan your next move.",chooseOwnSource:"Choose one of your territories as the source.",sourceNoUnits:"That territory has no units available to move or attack.",sourceCleared:"Source cleared.",targetSelected:"Target selected: {name}.",sourceSelected:"Source selected: {name}. Now choose a target.",moved:"Moved {units}: {source} -> {target}.",queuedAttack:"Queued attack {units}: {source} -> {target}.",clearedPlanned:"Cleared planned actions.",removedAttack:"Removed queued attack.",queuedOrderHint:"Enter queues/commits. A=Attack, B=Move.",selectionCleared:"Selection cleared.",sourceSelectedCursor:"Source selected: {name}. Move the cursor and press Space again for the target.",targetSelectedEnter:"Target selected: {name}. Press Enter to queue the order.",failedToLoad:"Failed to load: {error}",gameStartedSetup:"Game started. Submit your setup.",gameStarted:"Game started."}};function n(e,t){return(Fe[C][e]??Fe.en[e]??e).replace(/\{(\w+)\}/g,(a,r)=>String((t==null?void 0:t[r])??""))}function At(e){C=e==="en"?"en":"zh",localStorage.setItem("risc_lang",C),document.documentElement.lang=C,m()}function Te(e){return C==="en"?e:n(e==="LOBBY"?"lobby":e==="SETUP"?"setup":e==="ORDERS"?"ordersPhase":"gameOver")}function ge(e){return e==="FOOD"?n("resourceFood"):e==="TECHNOLOGY"?n("resourceTechnology"):e}function oe(e){return e==="BASIC"?n("levelBasic"):e==="LEVEL_1"?n("level1"):e==="LEVEL_2"?n("level2"):e==="LEVEL_3"?n("level3"):e==="LEVEL_4"?n("level4"):e==="LEVEL_5"?n("level5"):e==="LEVEL_6"?n("level6"):e}function at(e){return e==="GREEN"?n("playerGreen"):e==="BLUE"?n("playerBlue"):e==="RED"?n("playerRed"):e==="YELLOW"?n("playerYellow"):e==="PURPLE"?n("playerPurple"):e??n("unowned")}function Ee(e){const t=e.trim().toUpperCase();return["GREEN","BLUE","RED","YELLOW","PURPLE"].includes(t)?at(t):e}let i=null,R={},I={},ve=!1,O=[],A=[],w=[],Y=[],de=null,g=null,y=null,E="MOVE",v=1,_="BASIC",D="LEVEL_1",Se="",J=0,h=localStorage.getItem("risc_room_id"),q="";h&&(q=h);let ee=null,me=!1,$e={};const re={mode:"loading",boardWidth:920,boardHeight:620},it={GREEN:"#63885f",BLUE:"#7ea0be",RED:"#bb6553",YELLOW:"#c7b15a",PURPLE:"#8b6fb8",UNOWNED:"#ffffff"},Pt=["GREEN","BLUE","RED","YELLOW","PURPLE"];async function P(e,t){const o={"Content-Type":"application/json"};b&&(o["X-Auth-Token"]=b);const a=await fetch(`http://127.0.0.1:8080${e}`,{headers:{...o},...t}),r=await a.text();let l=null;try{l=r?JSON.parse(r):null}catch{l={error:r||"Request failed"}}const d=typeof l=="object"&&l!=null&&"error"in l&&typeof l.error=="string"?String(l.error):null;if(!a.ok||d)throw new Error(d??"Request failed");return l}function Q(){return i==null?void 0:i.players.find(e=>e.localPlayer)}function T(){var e;return((e=Q())==null?void 0:e.id)??"GREEN"}function ze(){return T()==="GREEN"}function j(){return i?i.phase==="ORDERS"&&Y.length>0?Y:i.territories??[]:[]}function M(e){return j().find(t=>t.name===e)}function ye(){const e=j();if(!(!i||e.length===0))return e[(J%e.length+e.length)%e.length]}function st(){const e=T();return j().filter(t=>t.owner===e)}function We(e,t){return e.neighbors.includes(t.name)}function Ut(e,t){if(e===t)return!0;const o=j(),a=new Map(o.map(f=>[f.name,f])),r=T(),l=[e],d=new Set([e]);for(;l.length>0;){const f=l.shift(),u=a.get(f);if(u)for(const p of u.neighbors){const S=a.get(p);if(!(!S||S.owner!==r)&&!d.has(p)){if(p===t)return!0;d.add(p),l.push(p)}}}return!1}function lt(e,t){if(e===t)return 0;const o=j(),a=new Map(o.map(f=>[f.name,f])),r=T(),l=[{territory:e,cost:0}],d=new Map([[e,0]]);for(;l.length>0;){l.sort((p,S)=>p.cost-S.cost);const f=l.shift();if(f.cost>(d.get(f.territory)??Number.MAX_SAFE_INTEGER))continue;const u=a.get(f.territory);if(u)for(const p of u.neighbors){const S=a.get(p);if(!S||S.owner!==r)continue;const L=f.cost+S.size;if(!(L>=(d.get(p)??Number.MAX_SAFE_INTEGER))){if(p===t)return L;d.set(p,L),l.push({territory:p,cost:L})}}}return null}function Re(e){const t=M(e);if(!t)return 0;const o=A.filter(a=>a.source===e).reduce((a,r)=>a+r.units,0);return Math.max(0,t.units-o)}function kt(e,t){const o=M(e);if(!o)return 0;const a=w.filter(r=>r.type==="UPGRADE_UNIT"&&r.source===e&&r.fromLevel===t).reduce((r,l)=>r+l.units,0);return Math.max(0,(o.unitCounts[t]??0)-a)}function ct(){return O.length+A.length+w.length}function Nt(){let e=0,t=0;for(const r of O){if(!r.source||!r.target)continue;const l=M(r.source),d=M(r.target);!l||!d||(d.owner===null?e+=d.size*r.units:e+=(lt(r.source,r.target)??0)*r.units)}for(const r of A)e+=r.units;const o=Q();let a=(o==null?void 0:o.maxTechnologyLevel)??1;for(const r of w)r.type==="UPGRADE_TECH"?t+=Le(a)??0:r.type==="UPGRADE_UNIT"&&r.fromLevel&&r.toLevel&&(t+=ot(r.fromLevel,r.toLevel,r.units));return{food:e,technology:t}}function Ct(){var e;if(E==="ATTACK")return{food:v,technology:0};if(E==="MOVE"&&g&&y){const t=M(g),o=M(y);return!t||!o?{food:0,technology:0}:o.owner===null?{food:o.size*v,technology:0}:{food:(lt(g,y)??0)*v,technology:0}}return E==="UPGRADE_TECH"?{food:0,technology:Le(((e=Q())==null?void 0:e.maxTechnologyLevel)??1)??0}:E==="UPGRADE_UNIT"?{food:0,technology:ot(_,D,v)}:{food:0,technology:0}}function he(){const e=Q();return e?e.reserveUnits-Object.values(R).reduce((t,o)=>t+o,0):0}function s(e){Se=e,m()}function Ye(e){return e?JSON.stringify(e):"null"}function ut(e){b=e.token,te=e.username,x=e.activeGames??[],pe=e.username,ne="",localStorage.setItem("risc_auth_token",e.token),localStorage.setItem("risc_auth_username",e.username)}function we(){b=null,te=null,x=[],ne="",localStorage.removeItem("risc_auth_token"),localStorage.removeItem("risc_auth_username")}function B(e){h=e,q=e??"",e?localStorage.setItem("risc_room_id",e):localStorage.removeItem("risc_room_id")}function ie(){O=[],A=[],w=[],Y=[],de=null,g=null,y=null,v=1,_="BASIC",D="LEVEL_1"}function ae(){ie(),R={},I={},ve=!1,i=null}function z(){if(!i||!h)return;const e={roomId:h,playerId:T(),phase:i.phase,turnNumber:i.turnNumber,seatCount:i.seatCount,winner:i.winner},t=x.filter(o=>o.roomId!==h);x=[e,...t]}async function K(){if(!b){x=[];return}x=await P("/api/rooms")}async function Qe(){if(h&&b)i=await P(`/api/rooms/${h}`);else{i=null,m();return}Z(),H(),z(),re.mode="ready",m()}async function Oe(){try{await Qe()}catch(e){if(h&&b){B(null);try{await Qe();return}catch{}}s(n("failedToLoad",{error:e.message}))}}async function It(){if(!b){we(),ae(),B(null),m();return}try{const e=await P("/api/auth/me");ut(e),await Oe(),h&&se(),h||m()}catch{we(),ae(),B(null),le(),m()}}function Z(){if(!i||i.phase!=="SETUP"){R={},I={},ve=!1;return}const e={},t={};for(const o of st())e[o.name]=R[o.name]??0,t[o.name]=I[o.name]??!1;R=e,I=t}function H(){if(!i||i.phase!=="ORDERS"){Y=[],O=[],A=[],w=[],de=null;return}de!==i.turnNumber&&(O=[],A=[],w=[],de=i.turnNumber,g=null,y=null,v=1,_="BASIC",D="LEVEL_1"),Y=i.territories.map(e=>({...e,neighbors:[...e.neighbors]}));for(const e of O)dt(e)}function dt(e){const t=Y.find(a=>a.name===e.source),o=Y.find(a=>a.name===e.target);!t||!o||(t.units=Math.max(0,t.units-e.units),t.units===0&&(t.owner=null),o.owner==null&&e.units>0&&(o.owner=T()),o.units+=e.units)}async function Mt(){if(!h||!b){s(n("startNeedRoom"));return}i=await P(`/api/rooms/${h}/reset`,{method:"POST"}),ie(),I={},z(),await K(),s(""),Z(),H(),m()}async function mt(){try{for(const[o,a]of Object.entries(I))a&&(R[o]??0)!==0&&(R={...R,[o]:0});if(he()!==0){s(n("needPlaceAll",{left:he()}));return}const e=Object.entries(I).filter(([,o])=>o).map(([o])=>o),t=JSON.stringify({allocations:R,abandon:e});if(!h||!b){s(n("startNeedRoom"));return}i=await P(`/api/rooms/${h}/setup`,{method:"POST",body:t}),ve=!0,ie(),H(),z(),await K(),h&&b&&i.phase==="SETUP"&&i.waitingOnPlayers.length>0?s(n("setupWaiting",{waiting:i.waitingOnPlayers.join(", ")})):s(n("setupLocked"))}catch(e){s(e.message)}}function ft(){if(E==="UPGRADE_TECH"){const l=Q();if(!l)return;if(w.some(d=>d.type==="UPGRADE_TECH")){s(n("upgradeTechQueued"));return}if(Le(l.maxTechnologyLevel)==null){s(n("upgradeTechMaxed"));return}w=[...w,{type:"UPGRADE_TECH",units:1}],s(n("upgradeTechQueuedDone")),m();return}if(E==="UPGRADE_UNIT"){if(!g){s(n("upgradeNeedSource"));return}if(!_||!D){s(n("upgradeNeedLevels"));return}const l=Q();if(!l)return;const d=kt(g,_);if(!Et(l.maxTechnologyLevel,_,D,d,v)){s(n("upgradeIllegal"));return}w=[...w,{type:"UPGRADE_UNIT",source:g,units:v,fromLevel:_,toLevel:D}],s(n("upgradedUnitQueued",{units:v,source:g,fromLevel:_,toLevel:D})),g=null,v=1,m();return}if(!g||!y){s(n("chooseSourceAndTarget"));return}const e=M(g),t=M(y);if(!e||!t)return;const o=Re(g);if(v<1||v>o){s(n("notEnoughUnits"));return}const a=g,r=y;if(E==="MOVE"){if(t.owner!==T()&&t.owner!==null){s(n("moveTargetsOnlyFriendly"));return}if(t.owner===null&&!We(e,t)){s(n("moveUnownedMustAdjacent"));return}if(t.owner===T()&&!Ut(e.name,t.name)){s(n("moveNeedsPath"));return}const l={type:"MOVE",source:a,target:r,units:v};O=[...O,l],dt(l),s(n("moved",{units:v,source:a,target:r}))}else{if(t.owner===T()){s(n("attackMustNotFriendly"));return}if(!We(e,t)){s(n("attackMustAdjacent"));return}A=[...A,{type:"ATTACK",source:a,target:r,units:v}],s(n("queuedAttack",{units:v,source:a,target:r}))}g=null,y=null,v=1,m()}async function pt(){try{const e=JSON.stringify({orders:[...O,...A,...w].map(t=>({type:t.type,source:t.source??null,target:t.target??null,units:t.units,fromLevel:t.fromLevel??null,toLevel:t.toLevel??null}))});if(!h||!b){s(n("startNeedRoom"));return}i=await P(`/api/rooms/${h}/turn`,{method:"POST",body:e}),ie(),H(),z(),await K(),i.phase==="GAME_OVER"?s(n("warOver")):h&&b&&i.waitingOnPlayers.length>0?s(n("waitingOn",{waiting:i.waitingOnPlayers.join(", ")})):s(n("turnResolved"))}catch(e){s(e.message)}}function Je(e,t){if(I[e])return;const o=R[e]??0,a=Math.max(0,o+t),r=he()+o;a>r||(R={...R,[e]:a},m())}function Gt(e){if(e.length===0)return{x:0,y:0};let t=0,o=0;for(const a of e)t+=a.x,o+=a.y;return{x:t/e.length,y:o/e.length}}function _t(e,t,o){let a=!1;for(let r=0,l=o.length-1;r<o.length;l=r++){const d=o[r].x,f=o[r].y,u=o[l].x,p=o[l].y;f>t!=p>t&&e<(u-d)*(t-f)/(p-f||1e-9)+d&&(a=!a)}return a}function xt(e,t){if(!i||i.phase==="GAME_OVER")return;const o=t.getBoundingClientRect(),a=re.boardWidth/o.width,r=re.boardHeight/o.height,l=(e.clientX-o.left)*a,d=(e.clientY-o.top)*r,f=j().find(u=>{const p=u.polygon??null;if(p&&p.length>=3)return _t(l,d,p);const S=u.x-l,L=u.y-d;return Math.sqrt(S*S+L*L)<48});if(f&&(J=j().findIndex(u=>u.name===f.name),E!=="UPGRADE_TECH")){if(E==="UPGRADE_UNIT"){if(f.owner!==T()){s(n("upgradeNeedSource"));return}if(f.name===g){g=null,s(n("sourceCleared")),m();return}g=f.name,y=null,v=1,s(n("sourceSelected",{name:f.name})),m();return}if(!g){if(f.owner!==T()){s(n("chooseOwnSource"));return}if(Re(f.name)<=0){s(n("sourceNoUnits"));return}g=f.name,y=null,v=1,s(n("sourceSelected",{name:f.name})),m();return}if(f.name===g){g=null,y=null,s(n("sourceCleared")),m();return}y=f.name,s(n("targetSelected",{name:f.name})),m()}}function qt(e){var f;const t=e.getContext("2d");if(!t||!i)return;const o=j(),a=o.some(u=>{var p;return(((p=u.polygon)==null?void 0:p.length)??0)>=3});e.width=re.boardWidth,e.height=re.boardHeight,t.clearRect(0,0,e.width,e.height);const r=t.createLinearGradient(0,0,0,e.height);r.addColorStop(0,"#a7cde0"),r.addColorStop(.24,"#dbead8"),r.addColorStop(1,"#cfaf76"),t.fillStyle=r,t.fillRect(0,0,e.width,e.height),t.fillStyle="rgba(255,255,255,0.18)";for(let u=0;u<14;u+=1)t.beginPath(),t.arc(80+u*60,60+u%3*26,24+u%4*8,0,Math.PI*2),t.fill();if(!a){t.lineWidth=5,t.strokeStyle="rgba(73, 58, 38, 0.28)";const u=new Set;for(const p of o)for(const S of p.neighbors){const L=[p.name,S].sort().join(":");if(u.has(L))continue;u.add(L);const U=M(S);U&&(t.beginPath(),t.moveTo(p.x,p.y),t.lineTo(U.x,U.y),t.stroke())}}for(const u of o){const p=u.owner??"UNOWNED",S=it[p]??"#666",L=u.name===g||u.name===y,U=u.name===((f=ye())==null?void 0:f.name),k=u.polygon??null,X=L?"#fff3d1":U?"#1d2b2a":p==="UNOWNED"?"rgba(33, 20, 8, 0.6)":"rgba(33, 20, 8, 0.35)";if(t.fillStyle=S,t.strokeStyle=X,t.lineWidth=L?7:U?5:3.5,a&&k&&k.length>=3){t.beginPath(),t.moveTo(k[0].x,k[0].y);for(let V=1;V<k.length;V++)t.lineTo(k[V].x,k[V].y);t.closePath(),t.fill(),t.stroke();const G=Gt(k);t.fillStyle="#1d2b2a",t.textAlign="center",t.font="bold 20px Georgia",t.fillText(u.name,G.x,G.y-8),t.font="12px Georgia",t.fillText(n("territorySizeMap",{size:u.size}),G.x,G.y+8),t.font="bold 24px Georgia",t.fillText(u.hidden?"?":String(u.units),G.x,G.y+30)}else t.beginPath(),t.arc(u.x,u.y,43,0,Math.PI*2),t.fill(),t.stroke(),t.fillStyle=p==="UNOWNED"?"#1d2b2a":"#fff8ec",t.textAlign="center",t.font="bold 19px Georgia",t.fillText(u.name,u.x,u.y-8),t.font="12px Georgia",t.fillText(n("territorySizeMap",{size:u.size}),u.x,u.y+8),t.font="bold 24px Georgia",t.fillText(u.hidden?"?":String(u.units),u.x,u.y+30)}t.fillStyle="rgba(33, 24, 16, 0.68)",t.fillRect(18,18,320,44),t.fillStyle="#fff8ec",t.textAlign="left",t.font="bold 22px Georgia";const l=Te(i.phase),d=C==="zh"?`回合 ${i.turnNumber} • ${l}`:`Turn ${i.turnNumber} • ${l}`;t.fillText(d,34,47)}function Dt(){var t;if(!i)return JSON.stringify({mode:"loading"});const e={mode:i.phase,turn:i.turnNumber,note:i.mapNote,pendingMoves:O,pendingAttacks:A,pendingUpgrades:w,selection:{source:g,target:y,type:E,units:v,cursor:((t=ye())==null?void 0:t.name)??null},territories:j().map(o=>({name:o.name,owner:o.owner,units:o.hidden?"hidden":o.units,x:o.x,y:o.y,neighbors:o.neighbors})),players:i.players,log:i.lastLog};return JSON.stringify(e)}function jt(e){const t=yt(e),o=a=>{switch(a){case"orders":return n("logOrders");case"combat":return n("logCombat");case"reinforcement":return n("logReinforcements");case"summary":return n("logEndOfTurn");default:return n("logNotes")}};return t.map(a=>`
    <section class="battle-section battle-${a.kind}">
      <h3>${o(a.kind)}</h3>
      <div class="battle-lines">
        ${a.entries.map(r=>`<div class="battle-line">${r}</div>`).join("")}
      </div>
    </section>
  `).join("")}function Bt(){$e={},document.querySelectorAll("[data-scroll-key]").forEach(e=>{const t=e.dataset.scrollKey;t&&($e[t]=e.scrollTop)})}function Ht(){document.querySelectorAll("[data-scroll-key]").forEach(e=>{const t=e.dataset.scrollKey;if(!t)return;const o=$e[t];typeof o=="number"&&(e.scrollTop=o)})}function Vt(e){const t=Ot(e);return t.length===0?`<div class="log-entry">${n("noTurnChanges")}</div>`:t.map(o=>{const a=o.movementDelta===0?`${n("deltaMove")} 0`:`${n("deltaMove")} ${o.movementDelta>0?"+":""}${o.movementDelta}`,r=o.reinforcementDelta===0?`${n("deltaReinforce")} 0`:`${n("deltaReinforce")} +${o.reinforcementDelta}`,l=o.finalUnits==null?"?":String(o.finalUnits);return`
      <div class="turn-summary-card">
        <strong>${o.territory}</strong>
        <div>${a}</div>
        <div>${r}</div>
        <div>${n("final")} ${l}${o.owner?` • ${Ee(o.owner)}`:""}</div>
      </div>
    `}).join("")}function Ft(e){return e.type==="UPGRADE_TECH"?n("orderTechLabel"):e.type==="UPGRADE_UNIT"?`${n("orderUnitLabel")} ${e.units} ${n("orderIn")} ${e.source} ${oe(e.fromLevel??"")} -> ${oe(e.toLevel??"")}`:`${e.type==="MOVE"?n("orderMoveLabel"):n("orderAttackLabel")} ${e.units} ${n("orderFrom")} ${e.source} ${n("orderTo")} ${e.target}`}function zt(e){return Object.entries(e).filter(([,t])=>t>0).map(([t,o])=>`${ge(t)} ${o}`).join(" • ")||"0"}function Wt(){return M(y)??M(g)??ye()}function Yt(e){if(!e)return`<div class="log-entry">${n("noTerritoryFocus")}</div>`;const t=wt(e),o=at(e.owner),a=t.resourceEntries.map(([l,d])=>`${ge(l)} ${d}`).join(" • ")||"0",r=t.unitEntries.map(([l,d])=>`${oe(l)} ${d}`).join(" • ")||"0";return`
    <div class="intel-card">
      <strong>${e.name}</strong>
      <div>${n("territoryOwner")}: ${o}</div>
      <div>${n("territorySize")}: ${e.size}</div>
      <div>${n("territoryOutput")}: ${a}</div>
      <div>${n("territoryUnits")}: ${r}</div>
    </div>
  `}function Qt(){window.render_game_to_text=Dt,window.advanceTime=()=>{m()}}async function gt(){document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}function Ke(){return b?x.length===0?`<div class="hint">${n("noActiveGames")}</div>`:`
    <div class="log side-log">
      ${x.map(e=>`
        <div class="log-entry log-entry-inline">
          <span>${e.roomId} • ${Te(e.phase)} • ${n("turnShort")}${e.turnNumber}</span>
          <button class="secondary" data-switch-room="${e.roomId}" ${h===e.roomId?"disabled":""}>${n("switchGame")}</button>
        </div>
      `).join("")}
    </div>
  `:""}function m(){var qe;if(Bt(),!i){Ve.innerHTML=`
      <section class="panel">
        <h1 class="title">RISC</h1>
        <div class="row">
          <span>${n("language")}</span>
          <select id="lang-select">
            <option value="zh" ${C==="zh"?"selected":""}>${n("chinese")}</option>
            <option value="en" ${C==="en"?"selected":""}>${n("english")}</option>
          </select>
        </div>
        ${b?`
            <div class="compact-meta">
              <div>${n("you")}: <strong>${te??""}</strong></div>
            </div>
            <div class="row">
              <button id="create-room">${n("createRoom")}</button>
              <input id="join-room-id" placeholder="${n("roomIdPlaceholder")}" value="${q}" />
              <button class="secondary" id="join-room">${n("join")}</button>
            </div>
            <div class="row">
              <button class="secondary" id="logout-btn">${n("logout")}</button>
            </div>
            <section class="players compact-panel">
              <h2>${n("activeGames")}</h2>
              ${Ke()}
            </section>
          `:`
            <div class="row">
              <input id="username-input" placeholder="${n("username")}" value="${pe}" />
              <input id="password-input" type="password" placeholder="${n("password")}" value="${ne}" />
            </div>
            <div class="row">
              <button id="login-btn">${n("login")}</button>
              <button class="secondary" id="register-btn">${n("register")}</button>
            </div>
            <div class="hint">${n("authHint")}</div>
          `}
        <div class="hint">${Se||n(b?"tipJoin":"authHint")}</div>
      </section>
    `;const c=document.querySelector("#create-room");c&&(c.onclick=()=>{et().catch(()=>{})});const $=document.querySelector("#join-room-id");$&&($.oninput=()=>{q=$.value});const F=document.querySelector("#join-room");F&&(F.onclick=()=>{tt(q).catch(()=>{})});const W=document.querySelector("#username-input");W&&(W.oninput=()=>{pe=W.value});const N=document.querySelector("#password-input");N&&(N.oninput=()=>{ne=N.value});const ce=document.querySelector("#login-btn");ce&&(ce.onclick=()=>{Ze("login")});const De=document.querySelector("#register-btn");De&&(De.onclick=()=>{Ze("register")});const je=document.querySelector("#logout-btn");je&&(je.onclick=()=>{Xe()}),document.querySelectorAll("[data-switch-room]").forEach(Be=>{Be.onclick=()=>{nt(Be.dataset.switchRoom??"")}});return}const e=i,t=new Map(e.players.map(c=>[c.id,c])),o=Math.max(2,Math.min(5,Number.isFinite(e.seatCount)?e.seatCount:e.players.length)),a=Pt.slice(0,o),r=e.players.length<o,l=a[a.length-1]??"GREEN",d=e.phase==="SETUP"&&!ve,f=`
    <div class="seat-grid" aria-label="Room seats">
      ${a.map(c=>{const $=t.get(c)??null,F=e.phase==="LOBBY"&&ze()&&$==null&&r&&c===l&&o>2;return`
          <div class="seat ${$?"occupied":"empty"}">
            <div class="seat-swatch" style="background:${it[c]};"></div>
            <div class="seat-meta">
              <div class="seat-id">${c}</div>
              <div class="seat-name">${$?Ee($.displayName):""}</div>
            </div>
            ${F?`<button class="secondary seat-remove" data-seat-remove="${c}">${n("remove")}</button>`:""}
          </div>
        `}).join("")}
    </div>
  `,u=d?`
      <section class="panel setup compact-panel">
        <h2>${n("initialPlacement")}</h2>
        <p class="hint">${n("placementHint",{reserve:((qe=Q())==null?void 0:qe.reserveUnits)??0})}</p>
        <div class="setup-grid">
          ${st().map(c=>`
            <div class="territory-stepper">
              <strong>${c.name}</strong>
              <label class="setup-empty">
                <input type="checkbox" data-setup-abandon="${c.name}" ${I[c.name]?"checked":""} />
                ${n("empty")}
              </label>
              <button class="secondary" data-setup-minus="${c.name}">-</button>
              <span>${R[c.name]??0}</span>
              <button class="secondary" data-setup-plus="${c.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>${n("unitsLeft")}: <strong>${he()}</strong></span>
          <button id="start-btn">${n("lockPlacement")}</button>
        </div>
      </section>`:"",p=Ct(),S=Nt(),L=[...O,...A,...w];Ve.innerHTML=`
    <div class="game-layout">
      <section class="panel topbar-panel">
        <div class="topbar">
          <div>
            <h1 class="title">RISC</h1>
            <p class="subtitle">${n("subtitle")}</p>
          </div>
          <div class="topbar-side">
            <div class="status-pill">${i.phase==="GAME_OVER"?n("winnerWins",{winner:i.winner??""}):Te(i.phase)}</div>
            <label class="inline-field">
              <span>${n("language")}</span>
              <select id="lang-select">
                <option value="zh" ${C==="zh"?"selected":""}>${n("chinese")}</option>
                <option value="en" ${C==="en"?"selected":""}>${n("english")}</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <aside class="layout-column left-column" data-scroll-key="left-column">
        <section class="panel controls compact-panel">
          <h2>${n("multiplayer")}</h2>
          ${b?`
              <div class="compact-meta">
                <div>${n("room")}: <strong>${h}</strong></div>
                <div>${n("you")}: <strong>${te??T()}</strong></div>
              </div>
              <div class="buttons">
                <button class="secondary" id="logout-btn">${n("logout")}</button>
              </div>
              <section class="compact-panel">
                <h3>${n("activeGames")}</h3>
                ${Ke()}
              </section>
              <div class="row">
                <button id="create-room">${n("createRoom")}</button>
                <input id="join-room-id" placeholder="${n("roomIdPlaceholder")}" value="${q}" />
                <button class="secondary" id="join-room">${n("join")}</button>
              </div>
              <div class="buttons">
                <button class="secondary" id="leave-room">${n("leave")}</button>
                ${i.phase==="LOBBY"&&ze()?`<button class="secondary" id="new-seat" ${o>=5?"disabled":""}>${n("newSeat")}</button>`:""}
                ${i.phase==="LOBBY"&&T()==="GREEN"?`<button id="start-game" ${i.players.length<2||i.players.length!==o?"disabled":""}>${n("startGame")}</button>`:""}
              </div>
              ${i.phase==="LOBBY"&&T()==="GREEN"?`<div class="hint">${n("startHint",{seats:o,players:i.players.length})}</div>`:""}
              ${f}
            `:`
              <div class="row">
                <button id="create-room">${n("createRoom")}</button>
                <input id="join-room-id" placeholder="${n("roomIdPlaceholder")}" value="${q}" />
                <button class="secondary" id="join-room">${n("join")}</button>
              </div>
              <div class="hint">${n("tipJoin")}</div>
            `}
          ${i.waitingOnPlayers.length>0?`<div class="hint">${n("waitingOn",{waiting:i.waitingOnPlayers.join(", ")})}</div>`:""}
        </section>

        ${u}

        <section class="panel controls compact-panel">
          <div class="section-head">
            <h2>${n("orders")}</h2>
            <button class="secondary" id="fullscreen-btn">${n("fullscreen")}</button>
          </div>
          <p class="hint">${n("ordersHint")}</p>
          <div class="buttons">
            <button class="${E==="MOVE"?"":"secondary"}" data-mode="MOVE">${n("move")}</button>
            <button class="${E==="ATTACK"?"":"secondary"}" data-mode="ATTACK">${n("attack")}</button>
            <button class="${E==="UPGRADE_UNIT"?"":"secondary"}" data-mode="UPGRADE_UNIT">${n("upgradeUnit")}</button>
            <button class="${E==="UPGRADE_TECH"?"":"secondary"}" data-mode="UPGRADE_TECH">${n("upgradeTech")}</button>
          </div>
          <div class="field-grid">
            <div class="selection-card">
              <strong>${n("currentSelection")}</strong>
              <span>${n("source")}: ${g??n("none")}</span>
              <span>${n("target")}: ${y??n("none")}</span>
              <span>${n("estimatedCost")}: ${ge("FOOD")} ${S.food+p.food} • ${ge("TECHNOLOGY")} ${S.technology+p.technology}</span>
            </div>
            <label class="units-field">${n("units")}<input id="units-input" type="number" min="1" value="${v}" /></label>
          </div>
          <div class="upgrade-grid">
            <label>${n("fromLevel")}
              <select id="from-level">
                ${fe.map(c=>`<option value="${c}" ${_===c?"selected":""}>${oe(c)}</option>`).join("")}
              </select>
            </label>
            <label>${n("toLevel")}
              <select id="to-level">
                ${fe.map(c=>`<option value="${c}" ${D===c?"selected":""}>${oe(c)}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="hint">${n("techOnlyOnce")}</div>
          <div class="buttons">
            <button id="queue-order" ${i.phase!=="ORDERS"?"disabled":""}>${n("queueOrder")}</button>
            <button class="secondary" id="clear-orders">${n("clearOrders")}</button>
            <button id="commit-turn" ${i.phase!=="ORDERS"?"disabled":""}>${n("commitTurn")}</button>
            <button class="secondary" id="reset-game">${n("newGame")}</button>
          </div>
          <div class="hint status-message">${Se||"&nbsp;"}</div>
        </section>
      </aside>

      <main class="layout-column center-column" data-scroll-key="center-column">
        <section class="panel board-shell">
          <div class="board-meta">
            <div>
              <strong>${i.phase==="GAME_OVER"?n("winnerWins",{winner:i.winner??""}):n("battleMap")}</strong>
              <div class="hint">${i.mapNote}</div>
            </div>
            <div class="hint">${n("pendingActions",{count:ct()})}</div>
          </div>
          <canvas id="game-canvas" aria-label="RISC game board"></canvas>
        </section>

        <section class="panel compact-panel">
          <div class="section-head">
            <h2>${n("queuedAttacks")}</h2>
            <div class="hint">${n("movesApplyHint")}</div>
          </div>
          <div class="log queued-log" data-scroll-key="queued-log">
            ${L.length===0?`<div class="log-entry">${n("noQueuedOrders")}</div>`:L.map((c,$)=>`
                <div class="log-entry log-entry-inline">
                  <span>${Ft(c)}</span>
                  <button class="secondary" data-order-remove="${$}">${n("remove")}</button>
                </div>`).join("")}
          </div>
        </section>
      </main>

      <aside class="layout-column right-column" data-scroll-key="right-column">
        <section class="panel players compact-panel">
          <h2>${n("factions")}</h2>
          ${i.players.map(c=>`
            <article>
              <strong>${Ee(c.displayName)}</strong>
              <div>${n("territoriesLabel")}: ${c.territories}</div>
              <div>${n("totalUnitsLabel")}: ${c.totalUnits}</div>
              <div>${n("techLevelLabel")}: ${c.maxTechnologyLevel}</div>
              <div>${n("resourcesLabel")}: ${zt(c.resources)}</div>
              <div>${c.defeated?n("defeated"):c.localPlayer?n("youLabel"):n("opponent")}</div>
            </article>`).join("")}
        </section>
        <section class="panel compact-panel">
          <h2>${n("territoryIntel")}</h2>
          <div class="log side-log">
            ${Yt(Wt())}
          </div>
        </section>
        <section class="panel compact-panel">
          <h2>${n("turnChanges")}</h2>
          <div class="log turn-summary-log side-log" data-scroll-key="turn-summary-log">
            ${Vt(i.lastLog)}
          </div>
        </section>
        <section class="panel compact-panel">
          <h2>${n("resolutionLog")}</h2>
          <div class="log battle-log side-log" data-scroll-key="battle-log">
            ${jt(i.lastLog)}
          </div>
        </section>
      </aside>
    </div>
  `,Ht();const U=document.querySelector("#game-canvas");U&&(qt(U),U.onclick=c=>xt(c,U)),document.querySelectorAll("[data-mode]").forEach(c=>{c.onclick=()=>{E=c.dataset.mode,E==="UPGRADE_TECH"?(g=null,y=null):E==="UPGRADE_UNIT"&&(y=null),m()}}),document.querySelectorAll("[data-setup-plus]").forEach(c=>{c.onclick=()=>Je(c.dataset.setupPlus??"",1)}),document.querySelectorAll("[data-setup-minus]").forEach(c=>{c.onclick=()=>Je(c.dataset.setupMinus??"",-1)}),document.querySelectorAll("[data-setup-abandon]").forEach(c=>{c.onchange=()=>{const $=c.dataset.setupAbandon??"";if(!$)return;const F=!!c.checked;I={...I,[$]:F},F&&(R={...R,[$]:0}),m()}});const k=document.querySelector("#start-btn");k&&(k.onclick=()=>{mt()});const X=document.querySelector("#units-input");X&&(X.oninput=()=>{v=Math.max(1,Number(X.value)||1),m()});const G=document.querySelector("#from-level");G&&(G.onchange=()=>{_=G.value,m()});const V=document.querySelector("#to-level");V&&(V.onchange=()=>{D=V.value,m()});const Ae=document.querySelector("#queue-order");Ae&&(Ae.onclick=ft);const Pe=document.querySelector("#commit-turn");Pe&&(Pe.onclick=()=>{pt()});const Ue=document.querySelector("#clear-orders");Ue&&(Ue.onclick=()=>{O=[],A=[],w=[],H(),v=1,s(n("clearedPlanned"))}),document.querySelectorAll("[data-order-remove]").forEach(c=>{c.onclick=()=>{const $=Number(c.dataset.orderRemove??"-1");if(Number.isNaN($)||$<0)return;const W=[...O,...A,...w].filter((N,ce)=>ce!==$);O=W.filter(N=>N.type==="MOVE"),A=W.filter(N=>N.type==="ATTACK"),w=W.filter(N=>N.type==="UPGRADE_TECH"||N.type==="UPGRADE_UNIT"),s(n("removedAttack")),m()}});const ke=document.querySelector("#reset-game");ke&&(ke.onclick=()=>{Mt()});const Ne=document.querySelector("#fullscreen-btn");Ne&&(Ne.onclick=()=>{gt()});const Ce=document.querySelector("#create-room");Ce&&(Ce.onclick=()=>{et().catch(()=>{})});const be=document.querySelector("#join-room-id");be&&(be.oninput=()=>{q=be.value});const Ie=document.querySelector("#join-room");Ie&&(Ie.onclick=()=>{tt(q).catch(()=>{})});const Me=document.querySelector("#leave-room");Me&&(Me.onclick=()=>{Jt()});const Ge=document.querySelector("#logout-btn");Ge&&(Ge.onclick=()=>{Xe()}),document.querySelectorAll("[data-switch-room]").forEach(c=>{c.onclick=()=>{nt(c.dataset.switchRoom??"")}});const _e=document.querySelector("#new-seat");_e&&(_e.onclick=()=>{Kt().catch(()=>{})}),document.querySelectorAll("[data-seat-remove]").forEach(c=>{c.onclick=()=>{Xt().catch(()=>{})}});const xe=document.querySelector("#start-game");xe&&(xe.onclick=()=>{Zt().catch(()=>{})})}window.addEventListener("keydown",e=>{if(i){if(e.key==="ArrowRight"){J+=1,m();return}if(e.key==="ArrowLeft"){J-=1,m();return}if(e.key==="ArrowDown"){J+=3,m();return}if(e.key==="ArrowUp"){J-=3,m();return}if(e.key.toLowerCase()==="f"&&gt(),e.key.toLowerCase()==="a"&&i.phase==="ORDERS"&&(E="ATTACK",m()),e.key.toLowerCase()==="b"&&i.phase==="ORDERS"&&(E="MOVE",m()),e.key==="Enter"){if(i.phase==="SETUP"){mt();return}if(i.phase==="ORDERS"&&g&&y){ft();return}i.phase==="ORDERS"&&ct()>0&&pt()}if(e.key===" "||e.code==="Space"){if(i.phase!=="ORDERS")return;e.preventDefault();const t=ye();if(!t||E==="UPGRADE_TECH")return;if(E==="UPGRADE_UNIT"){if(t.owner!==T()){s(n("upgradeNeedSource"));return}t.name===g?(g=null,s(n("selectionCleared"))):(g=t.name,s(n("sourceSelectedCursor",{name:t.name}))),m();return}if(!g){if(t.owner!==T()){s(n("chooseOwnSource"));return}if(Re(t.name)<=0){s(n("sourceNoUnits"));return}g=t.name,y=null,s(n("sourceSelectedCursor",{name:t.name})),m();return}if(t.name===g){g=null,y=null,s(n("selectionCleared")),m();return}y=t.name,s(n("targetSelectedEnter",{name:t.name})),m();return}e.key==="Escape"&&document.fullscreenElement&&document.exitFullscreen()}});document.addEventListener("change",e=>{const t=e.target;t instanceof HTMLSelectElement&&t.id==="lang-select"&&At(t.value)});Qt();document.documentElement.lang=C;It();async function Ze(e){try{const t=pe.trim(),o=ne,a=await P(`/api/auth/${e}`,{method:"POST",body:JSON.stringify({username:t,password:o})});ut(a),le(),x.length>0?(B(x[0].roomId),await Oe(),se()):(ae(),m()),s(n("loggedIn",{username:a.username}))}catch(t){s(t.message)}}function Xe(){le(),we(),ae(),B(null),s(n("loggedOut"))}async function et(){try{if(!b){s(n("authHint"));return}const e=await P("/api/rooms",{method:"POST"});B(e.roomId),i=e.game,Z(),H(),z(),await K(),se(),s(n("createdRoom",{roomId:e.roomId}))}catch(e){throw s(e.message),e}}async function tt(e){try{if(!b){s(n("authHint"));return}const t=(e??"").trim().toUpperCase();if(!t){s(n("enterRoomId"));return}const o=await P(`/api/rooms/${t}/join`,{method:"POST"});B(o.roomId),i=o.game,Z(),H(),z(),await K(),se(),s(n("joinedRoom",{roomId:o.roomId,playerId:o.playerId}))}catch(t){throw s(t.message),t}}function Jt(){le(),B(null),ae(),s(n("leftRoom")),m()}async function Kt(){if(!h){s(n("noRoomToJoin"));return}try{i=await P(`/api/rooms/${h}/seats/add`,{method:"POST"}),s(n("addedSeat")),m()}catch(e){throw s(e.message),e}}async function Zt(){if(!h||!b){s(n("startNeedRoom"));return}try{i=await P(`/api/rooms/${h}/start`,{method:"POST"}),ie(),Z(),H(),z(),await K(),s(i.phase==="SETUP"?n("gameStartedSetup"):n("gameStarted"))}catch(e){throw s(e.message),e}}async function Xt(){if(!h||!b){s(n("startNeedRoom"));return}try{i=await P(`/api/rooms/${h}/seats/remove`,{method:"POST"}),s(n("removedSeat")),m()}catch(e){throw s(e.message),e}}async function nt(e){!e||!b||(le(),B(e),await Oe(),h&&se())}function se(){ee==null&&(ee=window.setInterval(()=>{en()},1200))}function le(){ee!=null&&(window.clearInterval(ee),ee=null,me=!1)}async function en(){if(!(!h||!b||me)){me=!0;try{const e=await P(`/api/rooms/${h}`),t=Ye(i),o=Ye(e);i=e,Z(),H(),z(),t!==o&&m()}catch{}finally{me=!1}}}
