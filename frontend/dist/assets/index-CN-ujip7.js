(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const c of i)if(c.type==="childList")for(const f of c.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&a(f)}).observe(document,{childList:!0,subtree:!0});function o(i){const c={};return i.integrity&&(c.integrity=i.integrity),i.referrerPolicy&&(c.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?c.credentials="include":i.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function a(i){if(i.ep)return;i.ep=!0;const c=o(i);fetch(i.href,c)}})();function xe(e){return e.startsWith("Committed move orders")||e.startsWith("Committed attack orders")||e.startsWith(" - Green")||e.startsWith(" - Blue")||e.startsWith(" - Red")?"orders":e.startsWith("Battle queue")||e.startsWith("Combat starts")||e.startsWith("  Round ")||e.startsWith("Combat result")?"combat":e.startsWith("Reinforcement:")?"reinforcement":e.startsWith(" - ")&&e.includes(" holds ")&&e.includes(" units.")||e.startsWith("Turn ")&&e.endsWith(" final map state:")?"summary":"misc"}function Me(e){switch(e){case"orders":return"Orders";case"combat":return"Combat";case"reinforcement":return"Reinforcements";case"summary":return"End Of Turn";default:return"Notes"}}function Ce(e){const t=[];for(const o of e){const a=xe(o),i=t.at(-1);if(!i||i.kind!==a){t.push({title:Me(a),kind:a,entries:[o]});continue}i.entries.push(o)}return t}const je=/([A-Za-z]+) MOVE (\d+) from ([A-Za-z]+) to ([A-Za-z]+)/,Ie=/Reinforcement: ([A-Za-z]+) owned by ([A-Za-z]+) gains 1 unit \((\d+) -> (\d+)\)\./,qe=/- ([A-Za-z]+): ([A-Za-z]+) holds (\d+) units\./;function Ue(e){const t=new Map;for(const o of e){const a=o.match(je);if(a){const f=Number(a[2]),p=J(t,a[3]),l=J(t,a[4]);p.movementDelta-=f,l.movementDelta+=f;continue}const i=o.match(Ie);if(i){const f=J(t,i[1]);f.owner=i[2],f.reinforcementDelta+=1,f.finalUnits=Number(i[4]);continue}const c=o.trim().match(qe);if(c){const f=J(t,c[1]);f.owner=c[2],f.finalUnits=Number(c[3])}}return Array.from(t.values()).filter(o=>o.movementDelta!==0||o.reinforcementDelta!==0).sort((o,a)=>o.territory.localeCompare(a.territory))}function J(e,t){const o=e.get(t);if(o)return o;const a={territory:t,owner:null,movementDelta:0,reinforcementDelta:0,finalUnits:null};return e.set(t,a),a}const Re=document.querySelector("#app");if(!Re)throw new Error("Missing app root");const pe=Re;let A=localStorage.getItem("risc_lang")==="en"?"en":"zh";const he={zh:{language:"语言",chinese:"中文",english:"English",subtitle:"同时回合、隐藏提交，以及一张非常倔强的幻想大陆地图。",createRoom:"创建房间",join:"加入",roomIdPlaceholder:"房间号 (例如 ABC123)",tipJoin:"提示：开新窗口输入同一个房间号即可加入。",multiplayer:"多人房间",room:"房间",you:"你",leave:"离开",newSeat:"新增空位",startGame:"开始游戏",startHint:"开始条件：无空位且至少 2 人。座位 {seats}/5 • 玩家 {players}。",waitingOn:"等待：{waiting}",orders:"指令",ordersHint:"点地图上的领地或用下拉框选择。你可以用全部单位移动/进攻（领地可清空变无人占领）。",move:"移动",attack:"进攻",fullscreen:"全屏 (F)",source:"来源",target:"目标",select:"选择",units:"单位数",queueOrder:"添加指令",clearOrders:"清空计划",commitTurn:"提交回合",newGame:"新对局",factions:"阵营",youLabel:"你",opponent:"对手",defeated:"已淘汰",territoriesLabel:"领地",totalUnitsLabel:"总兵力",territoryInfo:"领地信息",ownerLabel:"归属",territorySizeLabel:"地形",resourcesLabel:"资源",queuedAttacks:"已排队的进攻",noQueuedAttacks:"还没有排队的进攻。",remove:"删除",movesApplyHint:"移动会在本地立即生效；进攻会在提交时一起结算。",turnChanges:"本回合变化",resolutionLog:"结算日志",battleMap:"战场地图",pendingActions:"待提交操作：{count}",winnerWins:"{winner} 获胜",logOrders:"指令",logCombat:"战斗",logReinforcements:"增援",logEndOfTurn:"回合结束",logNotes:"备注",deltaMove:"移动",deltaReinforce:"增援",final:"最终",noTurnChanges:"暂无领地变化。",lobby:"大厅",setup:"布置",ordersPhase:"指令",gameOver:"结束",initialPlacement:"初始布置",placementHint:"分配你的 {reserve} 预备兵。你可以勾选某块为“空白”（无人占领）。",empty:"空白",unitsLeft:"剩余可放",lockPlacement:"锁定布置",needPlaceAll:"请先放完所有预备兵。剩余：{left}。",setupWaiting:"已提交布置，等待：{waiting}。",setupLocked:"布置已锁定。对手布置已揭示。",addedSeat:"已新增一个空位。",removedSeat:"已删除最后一个空位。",createdRoom:"已创建房间 {roomId}。",joinedRoom:"已加入房间 {roomId}，座位 {playerId}。",leftRoom:"已离开房间。",enterRoomId:"请输入房间号再加入。",noRoomToJoin:"当前没有房间可加空位。",popupBlocked:"浏览器阻止了弹窗，请允许后再试。",startNeedRoom:"请先创建或加入房间。",chooseSourceAndTarget:"请先选择来源和目标领地。",notEnoughUnits:"该领地可用单位不足。",moveTargetsOnlyFriendly:"移动只能到己方领地或无人占领领地。",moveUnownedMustAdjacent:"移动到无人占领领地必须相邻。",moveNeedsPath:"移动到己方领地需要一条己方连通路径。",attackMustNotFriendly:"进攻目标必须是敌方或无人占领领地。",attackMustAdjacent:"进攻必须选择相邻领地。",warOver:"战争结束。",turnResolved:"回合已结算，继续规划下一回合。",chooseOwnSource:"来源必须选择你自己的领地。",sourceNoUnits:"该领地没有可用于移动/进攻的单位。",sourceCleared:"已取消来源选择。",targetSelected:"目标已选择：{name}。",sourceSelected:"来源已选择：{name}。请继续选择目标。",moved:"已移动 {units}：{source} → {target}。",queuedAttack:"已排队进攻 {units}：{source} → {target}。",clearedPlanned:"已清空计划操作。",removedAttack:"已删除该条进攻。",queuedOrderHint:"按 Enter 可快速添加/提交；A=进攻，B=移动。",selectionCleared:"已清空选择。",sourceSelectedCursor:"来源已选择：{name}。移动光标并再次按空格选择目标。",targetSelectedEnter:"目标已选择：{name}。按回车添加指令。",failedToLoad:"加载失败：{error}",gameStartedSetup:"已开始游戏，请提交初始布置。",gameStarted:"游戏已开始。"},en:{language:"Language",chinese:"中文",english:"English",subtitle:"Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.",createRoom:"Create room",join:"Join",roomIdPlaceholder:"Room ID (e.g. ABC123)",tipJoin:"Tip: open another window and join the same Room ID.",multiplayer:"Multiplayer",room:"Room",you:"You",leave:"Leave",newSeat:"New seat",startGame:"Start game",startHint:"Start requires no empty seats and at least 2 players. Seats {seats}/5 • Players {players}.",waitingOn:"Waiting on: {waiting}",orders:"Orders",ordersHint:"Click territories on the map or use the selectors below. You may move/attack with all units (territories can become unoccupied).",move:"Move",attack:"Attack",fullscreen:"Fullscreen (F)",source:"Source",target:"Target",select:"Select",units:"Units",queueOrder:"Queue Order",clearOrders:"Clear Planned Actions",commitTurn:"Commit Turn",newGame:"New Game",factions:"Factions",youLabel:"You",opponent:"Opponent",defeated:"Defeated",territoriesLabel:"Territories",totalUnitsLabel:"Total units",territoryInfo:"Territory Info",ownerLabel:"Owner",territorySizeLabel:"Size",resourcesLabel:"Resources",queuedAttacks:"Queued Attacks",noQueuedAttacks:"No queued attacks yet.",remove:"Remove",movesApplyHint:"Moves apply immediately in your browser. Attacks resolve together when you commit.",turnChanges:"Turn Changes",resolutionLog:"Resolution Log",battleMap:"Battle Map",pendingActions:"Pending actions: {count}",winnerWins:"{winner} wins",logOrders:"Orders",logCombat:"Combat",logReinforcements:"Reinforcements",logEndOfTurn:"End Of Turn",logNotes:"Notes",deltaMove:"move",deltaReinforce:"reinforce",final:"final",noTurnChanges:"No territory changes resolved yet.",lobby:"LOBBY",setup:"SETUP",ordersPhase:"ORDERS",gameOver:"GAME OVER",initialPlacement:"Initial Placement",placementHint:"Distribute your {reserve} reserve units. You may mark a starting territory as empty (unoccupied).",empty:"Empty",unitsLeft:"Units left",lockPlacement:"Lock Placement",needPlaceAll:"Place all reserve units first. Units left: {left}.",setupWaiting:"Setup submitted. Waiting on: {waiting}.",setupLocked:"Setup locked in. Opponents have revealed their placements.",addedSeat:"Added an empty seat.",removedSeat:"Removed the last empty seat.",createdRoom:"Created room {roomId}.",joinedRoom:"Joined room {roomId} as {playerId}.",leftRoom:"Left room.",enterRoomId:"Enter a room ID to join.",noRoomToJoin:"No room to add a seat.",popupBlocked:"Popup blocked. Allow popups for this site, then try again.",startNeedRoom:"Create or join a room first.",chooseSourceAndTarget:"Choose a source and a target territory first.",notEnoughUnits:"That territory does not have enough spare units.",moveTargetsOnlyFriendly:"Move can only target your own territories or an unoccupied territory.",moveUnownedMustAdjacent:"Moves into unoccupied territories must be adjacent.",moveNeedsPath:"Moves into owned territories need a friendly path.",attackMustNotFriendly:"Attack orders must target enemy or unoccupied territories.",attackMustAdjacent:"Attack orders must target adjacent territories.",warOver:"The war is over.",turnResolved:"Turn resolved. Plan your next move.",chooseOwnSource:"Choose one of your territories as the source.",sourceNoUnits:"That territory has no units available to move or attack.",sourceCleared:"Source cleared.",targetSelected:"Target selected: {name}.",sourceSelected:"Source selected: {name}. Now choose a target.",moved:"Moved {units}: {source} -> {target}.",queuedAttack:"Queued attack {units}: {source} -> {target}.",clearedPlanned:"Cleared planned actions.",removedAttack:"Removed queued attack.",queuedOrderHint:"Enter queues/commits. A=Attack, B=Move.",selectionCleared:"Selection cleared.",sourceSelectedCursor:"Source selected: {name}. Move the cursor and press Space again for the target.",targetSelectedEnter:"Target selected: {name}. Press Enter to queue the order.",failedToLoad:"Failed to load: {error}",gameStartedSetup:"Game started. Submit your setup.",gameStarted:"Game started."}};function n(e,t){return(he[A][e]??he.en[e]??e).replace(/\{(\w+)\}/g,(a,i)=>String((t==null?void 0:t[i])??""))}function _e(e){return A==="en"?e:n(e==="LOBBY"?"lobby":e==="SETUP"?"setup":e==="ORDERS"?"ordersPhase":"gameOver")}let r=null,O={},P={},R=[],b=[],L=[],q=null,h=null,v=null,B="MOVE",w=1,ee="",D=0,d=localStorage.getItem("risc_room_id"),y=sessionStorage.getItem("risc_room_token");const X=localStorage.getItem("risc_room_token");!y&&X&&(y=X,sessionStorage.setItem("risc_room_token",X),localStorage.removeItem("risc_room_token"));let _="";d&&(_=d);let z=null,V=!1;const H={mode:"loading",boardWidth:920,boardHeight:620},Te={GREEN:"#63885f",BLUE:"#7ea0be",RED:"#bb6553",YELLOW:"#c7b15a",PURPLE:"#8b6fb8",UNOWNED:"#ffffff"},Be=["GREEN","BLUE","RED","YELLOW","PURPLE"];async function k(e,t){const o={"Content-Type":"application/json"};y&&(o["X-Player-Token"]=y);const a=await fetch(`http://localhost:8080${e}`,{headers:{...o},...t}),i=await a.text();let c=null;try{c=i?JSON.parse(i):null}catch{c={error:i||"Request failed"}}const f=typeof c=="object"&&c!=null&&"error"in c&&typeof c.error=="string"?String(c.error):null;if(!a.ok||f)throw new Error(f??"Request failed");return c}function ne(){return r==null?void 0:r.players.find(e=>e.localPlayer)}function N(){var e;return((e=ne())==null?void 0:e.id)??"GREEN"}function ye(){return N()==="GREEN"}function M(){return r?r.phase==="ORDERS"&&L.length>0?L:r.territories??[]:[]}function Y(e){return M().find(t=>t.name===e)}function oe(){const e=M();if(!(!r||e.length===0))return e[(D%e.length+e.length)%e.length]}function te(){const e=N();return M().filter(t=>t.owner===e)}function ve(e,t){return e.neighbors.includes(t.name)}function De(e,t){if(e===t)return!0;const o=M(),a=new Map(o.map(p=>[p.name,p])),i=N(),c=[e],f=new Set([e]);for(;c.length>0;){const p=c.shift(),l=a.get(p);if(l)for(const g of l.neighbors){const $=a.get(g);if(!(!$||$.owner!==i)&&!f.has(g)){if(g===t)return!0;f.add(g),c.push(g)}}}return!1}function Z(e){const t=Y(e);if(!t)return 0;const o=b.filter(a=>a.source===e).reduce((a,i)=>a+i.units,0);return Math.max(0,t.units-o)}function K(){const e=ne();return e?e.reserveUnits-Object.values(O).reduce((t,o)=>t+o,0):0}function u(e){ee=e,m()}async function be(){if(d&&y)r=await k(`/api/rooms/${d}`);else{r=null,m();return}W(),I(),H.mode="ready",m()}async function We(){try{await be()}catch(e){if(d&&y){d=null,y=null,localStorage.removeItem("risc_room_id"),sessionStorage.removeItem("risc_room_token");try{await be();return}catch{}}u(n("failedToLoad",{error:e.message}))}}function W(){if(!r||r.phase!=="SETUP"){O={},P={};return}const e={},t={};for(const o of te())e[o.name]=O[o.name]??0,t[o.name]=P[o.name]??!1;O=e,P=t}function I(){if(!r||r.phase!=="ORDERS"){L=[],R=[],b=[],q=null;return}q!==r.turnNumber&&(R=[],b=[],q=r.turnNumber,h=null,v=null,w=1),L=r.territories.map(e=>({...e,neighbors:[...e.neighbors]}));for(const e of R)ke(e)}function ke(e){const t=L.find(a=>a.name===e.source),o=L.find(a=>a.name===e.target);!t||!o||(t.units=Math.max(0,t.units-e.units),t.units===0&&(t.owner=null),o.owner==null&&e.units>0&&(o.owner=N()),o.units+=e.units)}async function Ge(){d&&y?r=await k(`/api/rooms/${d}/reset`,{method:"POST"}):r=await k("/api/game/reset",{method:"POST"}),R=[],b=[],L=[],q=null,P={},h=null,v=null,w=1,u(""),W(),I(),m()}async function Ee(){try{for(const[o,a]of Object.entries(P))a&&(O[o]??0)!==0&&(O={...O,[o]:0});if(K()!==0){u(n("needPlaceAll",{left:K()}));return}const e=Object.entries(P).filter(([,o])=>o).map(([o])=>o),t=JSON.stringify({allocations:O,abandon:e});d&&y?r=await k(`/api/rooms/${d}/setup`,{method:"POST",body:t}):r=await k("/api/game/setup",{method:"POST",body:t}),R=[],b=[],L=[],q=null,h=null,v=null,w=1,I(),d&&y&&r.phase==="SETUP"&&r.waitingOnPlayers.length>0?u(n("setupWaiting",{waiting:r.waitingOnPlayers.join(", ")})):u(n("setupLocked"))}catch(e){u(e.message)}}function Ae(){if(!h||!v){u(n("chooseSourceAndTarget"));return}const e=Y(h),t=Y(v);if(!e||!t)return;const o=Z(h);if(w<1||w>o){u(n("notEnoughUnits"));return}const a=h,i=v;if(B==="MOVE"){if(t.owner!==N()&&t.owner!==null){u(n("moveTargetsOnlyFriendly"));return}if(t.owner===null&&!ve(e,t)){u(n("moveUnownedMustAdjacent"));return}if(t.owner===N()&&!De(e.name,t.name)){u(n("moveNeedsPath"));return}const c={type:"MOVE",source:a,target:i,units:w};R=[...R,c],ke(c),u(n("moved",{units:w,source:a,target:i}))}else{if(t.owner===N()){u(n("attackMustNotFriendly"));return}if(!ve(e,t)){u(n("attackMustAdjacent"));return}b=[...b,{type:"ATTACK",source:a,target:i,units:w}],u(n("queuedAttack",{units:w,source:a,target:i}))}h=null,v=null,w=1,m()}async function Pe(){try{const e=JSON.stringify({orders:[...R,...b].map(t=>({type:t.type,source:t.source,target:t.target,units:t.units}))});d&&y?r=await k(`/api/rooms/${d}/turn`,{method:"POST",body:e}):r=await k("/api/game/turn",{method:"POST",body:e}),R=[],b=[],L=[],q=null,w=1,h=null,v=null,I(),r.phase==="GAME_OVER"?u(n("warOver")):d&&y&&r.waitingOnPlayers.length>0?u(n("waitingOn",{waiting:r.waitingOnPlayers.join(", ")})):u(n("turnResolved"))}catch(e){u(e.message)}}function Se(e,t){if(P[e])return;const o=O[e]??0,a=Math.max(0,o+t),i=K()+o;a>i||(O={...O,[e]:a},m())}function ze(e){if(e.length===0)return{x:0,y:0};let t=0,o=0;for(const a of e)t+=a.x,o+=a.y;return{x:t/e.length,y:o/e.length}}function He(e,t,o){let a=!1;for(let i=0,c=o.length-1;i<o.length;c=i++){const f=o[i].x,p=o[i].y,l=o[c].x,g=o[c].y;p>t!=g>t&&e<(l-f)*(t-p)/(g-p||1e-9)+f&&(a=!a)}return a}function Fe(e,t){if(!r||r.phase==="GAME_OVER")return;const o=t.getBoundingClientRect(),a=H.boardWidth/o.width,i=H.boardHeight/o.height,c=(e.clientX-o.left)*a,f=(e.clientY-o.top)*i,p=M().find(l=>{const g=l.polygon??null;if(g&&g.length>=3)return He(c,f,g);const $=l.x-c,T=l.y-f;return Math.sqrt($*$+T*T)<48});if(p){if(D=M().findIndex(l=>l.name===p.name),!h){if(p.owner!==N()){u(n("chooseOwnSource"));return}if(Z(p.name)<=0){u(n("sourceNoUnits"));return}h=p.name,v=null,w=1,u(n("sourceSelected",{name:p.name})),m();return}if(p.name===h){h=null,v=null,u(n("sourceCleared")),m();return}v=p.name,u(n("targetSelected",{name:p.name})),m()}}function Je(e){var p;const t=e.getContext("2d");if(!t||!r)return;const o=M(),a=o.some(l=>{var g;return(((g=l.polygon)==null?void 0:g.length)??0)>=3});e.width=H.boardWidth,e.height=H.boardHeight,t.clearRect(0,0,e.width,e.height);const i=t.createLinearGradient(0,0,0,e.height);i.addColorStop(0,"#a7cde0"),i.addColorStop(.24,"#dbead8"),i.addColorStop(1,"#cfaf76"),t.fillStyle=i,t.fillRect(0,0,e.width,e.height),t.fillStyle="rgba(255,255,255,0.18)";for(let l=0;l<14;l+=1)t.beginPath(),t.arc(80+l*60,60+l%3*26,24+l%4*8,0,Math.PI*2),t.fill();if(!a){t.lineWidth=5,t.strokeStyle="rgba(73, 58, 38, 0.28)";const l=new Set;for(const g of o)for(const $ of g.neighbors){const T=[g.name,$].sort().join(":");if(l.has(T))continue;l.add(T);const C=Y($);C&&(t.beginPath(),t.moveTo(g.x,g.y),t.lineTo(C.x,C.y),t.stroke())}}for(const l of o){const g=l.owner??"UNOWNED",$=Te[g]??"#666",T=l.name===h||l.name===v,C=l.name===((p=oe())==null?void 0:p.name),E=l.polygon??null,G=T?"#fff3d1":C?"#1d2b2a":g==="UNOWNED"?"rgba(33, 20, 8, 0.6)":"rgba(33, 20, 8, 0.35)";if(t.fillStyle=$,t.strokeStyle=G,t.lineWidth=T?7:C?5:3.5,a&&E&&E.length>=3){t.beginPath(),t.moveTo(E[0].x,E[0].y);for(let U=1;U<E.length;U++)t.lineTo(E[U].x,E[U].y);t.closePath(),t.fill(),t.stroke();const x=ze(E);t.fillStyle="#1d2b2a",t.textAlign="center",t.font="bold 20px Georgia",t.fillText(l.name,x.x,x.y-8),t.font="bold 24px Georgia",t.fillText(l.hidden?"?":String(l.units),x.x,x.y+24),t.font="bold 13px Georgia",t.fillText(we(l),x.x,x.y+44)}else t.beginPath(),t.arc(l.x,l.y,43,0,Math.PI*2),t.fill(),t.stroke(),t.fillStyle=g==="UNOWNED"?"#1d2b2a":"#fff8ec",t.textAlign="center",t.font="bold 19px Georgia",t.fillText(l.name,l.x,l.y-8),t.font="bold 24px Georgia",t.fillText(l.hidden?"?":String(l.units),l.x,l.y+24),t.font="bold 13px Georgia",t.fillText(we(l),l.x,l.y+44)}t.fillStyle="rgba(33, 24, 16, 0.68)",t.fillRect(18,18,320,44),t.fillStyle="#fff8ec",t.textAlign="left",t.font="bold 22px Georgia";const c=_e(r.phase),f=A==="zh"?`回合 ${r.turnNumber} • ${c}`:`Turn ${r.turnNumber} • ${c}`;t.fillText(f,34,47)}function Ve(){var t;if(!r)return JSON.stringify({mode:"loading"});const e={mode:r.phase,turn:r.turnNumber,note:r.mapNote,pendingMoves:R,pendingAttacks:b,selection:{source:h,target:v,type:B,units:w,cursor:((t=oe())==null?void 0:t.name)??null},territories:M().map(o=>({name:o.name,owner:o.owner,units:o.hidden?"hidden":o.units,x:o.x,y:o.y,neighbors:o.neighbors,size:o.size,resourceProduction:o.resourceProduction})),players:r.players,log:r.lastLog};return JSON.stringify(e)}function we(e){return`S${e.size} • ${Ne(e.resourceProduction)}`}function Ne(e){const t=Object.entries(e??{}).filter(([,o])=>o>0);return t.length===0?"-":t.map(([o,a])=>{var i;return`${((i=o[0])==null?void 0:i.toUpperCase())??"?"}${a}`}).join(" ")}function Ye(e){const t=Ce(e),o=a=>{switch(a){case"orders":return n("logOrders");case"combat":return n("logCombat");case"reinforcement":return n("logReinforcements");case"summary":return n("logEndOfTurn");default:return n("logNotes")}};return t.map(a=>`
    <section class="battle-section battle-${a.kind}">
      <h3>${o(a.kind)}</h3>
      <div class="battle-lines">
        ${a.entries.map(i=>`<div class="battle-line">${i}</div>`).join("")}
      </div>
    </section>
  `).join("")}function Ke(e){const t=Ue(e);return t.length===0?`<div class="log-entry">${n("noTurnChanges")}</div>`:t.map(o=>{const a=o.movementDelta===0?`${n("deltaMove")} 0`:`${n("deltaMove")} ${o.movementDelta>0?"+":""}${o.movementDelta}`,i=o.reinforcementDelta===0?`${n("deltaReinforce")} 0`:`${n("deltaReinforce")} +${o.reinforcementDelta}`,c=o.finalUnits==null?"?":String(o.finalUnits);return`
      <div class="turn-summary-card">
        <strong>${o.territory}</strong>
        <div>${a}</div>
        <div>${i}</div>
        <div>${n("final")} ${c}${o.owner?` • ${o.owner}`:""}</div>
      </div>
    `}).join("")}function Ze(){window.render_game_to_text=Ve,window.advanceTime=()=>{m()}}async function Le(){document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}function m(){var ge;if(!r){pe.innerHTML=`
      <section class="panel">
        <h1 class="title">RISC</h1>
        <div class="row">
          <span>${n("language")}</span>
          <select id="lang-select">
            <option value="zh" ${A==="zh"?"selected":""}>${n("chinese")}</option>
            <option value="en" ${A==="en"?"selected":""}>${n("english")}</option>
          </select>
        </div>
        <div class="row">
          <button id="create-room">${n("createRoom")}</button>
          <input id="join-room-id" placeholder="${n("roomIdPlaceholder")}" value="${_}" />
          <button class="secondary" id="join-room">${n("join")}</button>
        </div>
        <div class="hint">${ee||n("tipJoin")}</div>
      </section>
    `;const s=document.querySelector("#lang-select");s&&(s.onchange=()=>{A=s.value==="en"?"en":"zh",localStorage.setItem("risc_lang",A),m()});const S=document.querySelector("#create-room");S&&(S.onclick=()=>{$e().catch(()=>{})});const j=document.querySelector("#join-room-id");j&&(j.oninput=()=>{_=j.value});const F=document.querySelector("#join-room");F&&(F.onclick=()=>{Oe(_).catch(()=>{})});return}const e=r,t=new Map(e.players.map(s=>[s.id,s])),o=Math.max(2,Math.min(5,Number.isFinite(e.seatCount)?e.seatCount:e.players.length)),a=Be.slice(0,o),i=e.players.length<o,c=a[a.length-1]??"GREEN",f=`
    <div class="seat-grid" aria-label="Room seats">
      ${a.map(s=>{const S=t.get(s)??null,j=e.phase==="LOBBY"&&ye()&&S==null&&i&&s===c&&o>2;return`
          <div class="seat ${S?"occupied":"empty"}">
            <div class="seat-swatch" style="background:${Te[s]};"></div>
            <div class="seat-meta">
              <div class="seat-id">${s}</div>
              <div class="seat-name">${S?S.displayName:""}</div>
            </div>
            ${j?`<button class="secondary seat-remove" data-seat-remove="${s}">${n("remove")}</button>`:""}
          </div>
        `}).join("")}
    </div>
  `,p=r.phase==="SETUP"?`
      <section class="panel setup">
        <h2>${n("initialPlacement")}</h2>
        <p class="hint">${n("placementHint",{reserve:((ge=ne())==null?void 0:ge.reserveUnits)??0})}</p>
        <div class="setup-grid">
          ${te().map(s=>`
            <div class="territory-stepper">
              <strong>${s.name}</strong>
              <label class="setup-empty">
                <input type="checkbox" data-setup-abandon="${s.name}" ${P[s.name]?"checked":""} />
                ${n("empty")}
              </label>
              <button class="secondary" data-setup-minus="${s.name}">-</button>
              <span>${O[s.name]??0}</span>
              <button class="secondary" data-setup-plus="${s.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>${n("unitsLeft")}: <strong>${K()}</strong></span>
          <button id="start-btn">${n("lockPlacement")}</button>
        </div>
      </section>`:"",l=te().filter(s=>Z(s.name)>0).map(s=>`<option value="${s.name}" ${h===s.name?"selected":""}>${s.name}</option>`).join(""),g=M().map(s=>`<option value="${s.name}" ${v===s.name?"selected":""}>${s.name}</option>`).join("");pe.innerHTML=`
    <section class="panel">
      <h1 class="title">RISC</h1>
      <div class="row">
        <span>${n("language")}</span>
        <select id="lang-select">
          <option value="zh" ${A==="zh"?"selected":""}>${n("chinese")}</option>
          <option value="en" ${A==="en"?"selected":""}>${n("english")}</option>
        </select>
      </div>
      <p class="subtitle">${n("subtitle")}</p>
      <section class="controls">
        <h2>${n("multiplayer")}</h2>
        ${d&&y?`
            <div class="row">
              <span>${n("room")}: <strong>${d}</strong></span>
              <span>${n("you")}: <strong>${N()}</strong></span>
              <button class="secondary" id="leave-room">${n("leave")}</button>
              ${r.phase==="LOBBY"&&ye()?`<button class="secondary" id="new-seat" ${o>=5?"disabled":""}>${n("newSeat")}</button>`:""}
            </div>
            ${f}
            ${r.phase==="LOBBY"&&N()==="GREEN"?`
                <div class="row">
                  <button id="start-game" ${r.players.length<2||r.players.length!==o?"disabled":""}>${n("startGame")}</button>
                  <span class="hint">${n("startHint",{seats:o,players:r.players.length})}</span>
                </div>
              `:""}
          `:`
            <div class="row">
              <button id="create-room">${n("createRoom")}</button>
              <input id="join-room-id" placeholder="${n("roomIdPlaceholder")}" value="${_}" />
              <button class="secondary" id="join-room">${n("join")}</button>
            </div>
            <div class="hint">${n("tipJoin")}</div>
          `}
        ${r.waitingOnPlayers.length>0?`<div class="hint">${n("waitingOn",{waiting:r.waitingOnPlayers.join(", ")})}</div>`:""}
      </section>
      ${p}
      <section class="controls">
        <h2>${n("orders")}</h2>
        <p class="hint">${n("ordersHint")}</p>
        <div class="buttons">
          <button class="${B==="MOVE"?"":"secondary"}" data-mode="MOVE">${n("move")}</button>
          <button class="${B==="ATTACK"?"":"secondary"}" data-mode="ATTACK">${n("attack")}</button>
          <button class="secondary" id="fullscreen-btn">${n("fullscreen")}</button>
        </div>
        <div class="row">
          <label>${n("source")}<select id="source-select"><option value="">${n("select")}</option>${l}</select></label>
          <label>${n("target")}<select id="target-select"><option value="">${n("select")}</option>${g}</select></label>
        </div>
        <div class="row">
          <label>${n("units")}<input id="units-input" type="number" min="1" value="${w}" /></label>
          <button id="queue-order" ${r.phase!=="ORDERS"?"disabled":""}>${n("queueOrder")}</button>
        </div>
        <div class="buttons">
          <button class="secondary" id="clear-orders">${n("clearOrders")}</button>
          <button id="commit-turn" ${r.phase!=="ORDERS"?"disabled":""}>${n("commitTurn")}</button>
          <button class="secondary" id="reset-game">${n("newGame")}</button>
        </div>
        <div class="hint">${ee||"&nbsp;"}</div>
      </section>
      <section class="players">
        <h2>${n("factions")}</h2>
        ${r.players.map(s=>`
          <article>
            <strong>${s.displayName}</strong>
            <div>${n("territoriesLabel")}: ${s.territories}</div>
            <div>${n("totalUnitsLabel")}: ${s.totalUnits}</div>
            <div>${s.defeated?n("defeated"):s.localPlayer?n("youLabel"):n("opponent")}</div>
          </article>`).join("")}
      </section>
      <section class="territory-info">
        <h2>${n("territoryInfo")}</h2>
        <div class="territory-info-grid">
          ${M().map(s=>`
            <article>
              <strong>${s.name}</strong>
              <div>${n("ownerLabel")}: ${s.owner??"UNOWNED"}</div>
              <div>${n("units")}: ${s.hidden?"?":s.units}</div>
              <div>${n("territorySizeLabel")}: ${s.size}</div>
              <div>${n("resourcesLabel")}: ${Ne(s.resourceProduction)}</div>
            </article>`).join("")}
        </div>
      </section>
      <section>
        <h2>${n("queuedAttacks")}</h2>
        <div class="log">
          ${b.length===0?`<div class="log-entry">${n("noQueuedAttacks")}</div>`:b.map((s,S)=>`
              <div class="log-entry">
                ATTACK ${s.units} from ${s.source} to ${s.target}
                <button class="secondary" data-attack-remove="${S}">${n("remove")}</button>
              </div>`).join("")}
        </div>
        <div class="hint">${n("movesApplyHint")}</div>
      </section>
      <section>
        <h2>${n("turnChanges")}</h2>
        <div class="log turn-summary-log">
          ${Ke(r.lastLog)}
        </div>
      </section>
      <section>
        <h2>${n("resolutionLog")}</h2>
        <div class="log battle-log">
          ${Ye(r.lastLog)}
        </div>
      </section>
    </section>
    <section class="panel board-shell">
      <div class="board-meta">
        <div>
          <strong>${r.phase==="GAME_OVER"?n("winnerWins",{winner:r.winner??""}):n("battleMap")}</strong>
          <div class="hint">${r.mapNote}</div>
        </div>
        <div class="hint">${n("pendingActions",{count:R.length+b.length})}</div>
      </div>
      <canvas id="game-canvas" aria-label="RISC game board"></canvas>
    </section>
  `;const $=document.querySelector("#lang-select");$&&($.onchange=()=>{A=$.value==="en"?"en":"zh",localStorage.setItem("risc_lang",A),m()});const T=document.querySelector("#game-canvas");T&&(Je(T),T.onclick=s=>Fe(s,T)),document.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{B=s.dataset.mode,m()}}),document.querySelectorAll("[data-setup-plus]").forEach(s=>{s.onclick=()=>Se(s.dataset.setupPlus??"",1)}),document.querySelectorAll("[data-setup-minus]").forEach(s=>{s.onclick=()=>Se(s.dataset.setupMinus??"",-1)}),document.querySelectorAll("[data-setup-abandon]").forEach(s=>{s.onchange=()=>{const S=s.dataset.setupAbandon??"";if(!S)return;const j=!!s.checked;P={...P,[S]:j},j&&(O={...O,[S]:0}),m()}});const C=document.querySelector("#start-btn");C&&(C.onclick=()=>{Ee()});const E=document.querySelector("#source-select");E&&(E.onchange=()=>{h=E.value||null,m()});const G=document.querySelector("#target-select");G&&(G.onchange=()=>{v=G.value||null,m()});const x=document.querySelector("#units-input");x&&(x.oninput=()=>{w=Math.max(1,Number(x.value)||1)});const U=document.querySelector("#queue-order");U&&(U.onclick=Ae);const ae=document.querySelector("#commit-turn");ae&&(ae.onclick=()=>{Pe()});const se=document.querySelector("#clear-orders");se&&(se.onclick=()=>{R=[],b=[],I(),w=1,u(n("clearedPlanned"))}),document.querySelectorAll("[data-attack-remove]").forEach(s=>{s.onclick=()=>{const S=Number(s.dataset.attackRemove??"-1");Number.isNaN(S)||S<0||(b=b.filter((j,F)=>F!==S),u(n("removedAttack")),m())}});const ie=document.querySelector("#reset-game");ie&&(ie.onclick=()=>{Ge()});const le=document.querySelector("#fullscreen-btn");le&&(le.onclick=()=>{Le()});const ce=document.querySelector("#create-room");ce&&(ce.onclick=()=>{$e().catch(()=>{})});const Q=document.querySelector("#join-room-id");Q&&(Q.oninput=()=>{_=Q.value});const ue=document.querySelector("#join-room");ue&&(ue.onclick=()=>{Oe(_).catch(()=>{})});const de=document.querySelector("#leave-room");de&&(de.onclick=()=>{Qe()});const me=document.querySelector("#new-seat");me&&(me.onclick=()=>{Xe().catch(()=>{})}),document.querySelectorAll("[data-seat-remove]").forEach(s=>{s.onclick=()=>{tt().catch(()=>{})}});const fe=document.querySelector("#start-game");fe&&(fe.onclick=()=>{et().catch(()=>{})})}window.addEventListener("keydown",e=>{if(r){if(e.key==="ArrowRight"){D+=1,m();return}if(e.key==="ArrowLeft"){D-=1,m();return}if(e.key==="ArrowDown"){D+=3,m();return}if(e.key==="ArrowUp"){D-=3,m();return}if(e.key.toLowerCase()==="f"&&Le(),e.key.toLowerCase()==="a"&&r.phase==="ORDERS"&&(B="ATTACK",m()),e.key.toLowerCase()==="b"&&r.phase==="ORDERS"&&(B="MOVE",m()),e.key==="Enter"){if(r.phase==="SETUP"){Ee();return}if(r.phase==="ORDERS"&&h&&v){Ae();return}r.phase==="ORDERS"&&R.length+b.length>0&&Pe()}if(e.key===" "||e.code==="Space"){if(r.phase!=="ORDERS")return;e.preventDefault();const t=oe();if(!t)return;if(!h){if(t.owner!==N()){u(n("chooseOwnSource"));return}if(Z(t.name)<=0){u(n("sourceNoUnits"));return}h=t.name,v=null,u(n("sourceSelectedCursor",{name:t.name})),m();return}if(t.name===h){h=null,v=null,u(n("selectionCleared")),m();return}v=t.name,u(n("targetSelectedEnter",{name:t.name})),m();return}e.key==="Escape"&&document.fullscreenElement&&document.exitFullscreen()}});Ze();We();async function $e(){try{const e=await k("/api/rooms",{method:"POST"});d=e.roomId,y=e.token,localStorage.setItem("risc_room_id",d),sessionStorage.setItem("risc_room_token",y),r=e.game,W(),I(),re(),u(n("createdRoom",{roomId:d}))}catch(e){throw u(e.message),e}}async function Oe(e){try{const t=(e??"").trim().toUpperCase();if(!t){u(n("enterRoomId"));return}const o=await k(`/api/rooms/${t}/join`,{method:"POST"});d=o.roomId,y=o.token,localStorage.setItem("risc_room_id",d),sessionStorage.setItem("risc_room_token",y),r=o.game,W(),I(),re(),u(n("joinedRoom",{roomId:d,playerId:o.playerId}))}catch(t){throw u(t.message),t}}function Qe(){d=null,y=null,localStorage.removeItem("risc_room_id"),sessionStorage.removeItem("risc_room_token"),nt(),R=[],b=[],L=[],q=null,O={},P={},u(n("leftRoom")),r=null,m()}async function Xe(){if(!d){u(n("noRoomToJoin"));return}try{r=await k(`/api/rooms/${d}/seats/add`,{method:"POST"}),u(n("addedSeat")),m()}catch(e){throw u(e.message),e}}async function et(){if(!d||!y){u(n("startNeedRoom"));return}try{r=await k(`/api/rooms/${d}/start`,{method:"POST"}),R=[],b=[],L=[],q=null,h=null,v=null,w=1,W(),I(),u(r.phase==="SETUP"?n("gameStartedSetup"):n("gameStarted"))}catch(e){throw u(e.message),e}}async function tt(){if(!d||!y){u(n("startNeedRoom"));return}try{r=await k(`/api/rooms/${d}/seats/remove`,{method:"POST"}),u(n("removedSeat")),m()}catch(e){throw u(e.message),e}}function re(){z==null&&(z=window.setInterval(()=>{ot()},1200))}function nt(){z!=null&&(window.clearInterval(z),z=null,V=!1)}async function ot(){if(!(!d||!y||V)){V=!0;try{r=await k(`/api/rooms/${d}`),W(),I(),m()}catch{}finally{V=!1}}}d&&y&&re();
