(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const l of s)if(l.type==="childList")for(const f of l.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&a(f)}).observe(document,{childList:!0,subtree:!0});function o(s){const l={};return s.integrity&&(l.integrity=s.integrity),s.referrerPolicy&&(l.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?l.credentials="include":s.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function a(s){if(s.ep)return;s.ep=!0;const l=o(s);fetch(s.href,l)}})();function Ne(e){return e.startsWith("Committed move orders")||e.startsWith("Committed attack orders")||e.startsWith(" - Green")||e.startsWith(" - Blue")||e.startsWith(" - Red")?"orders":e.startsWith("Battle queue")||e.startsWith("Combat starts")||e.startsWith("  Round ")||e.startsWith("Combat result")?"combat":e.startsWith("Reinforcement:")?"reinforcement":e.startsWith(" - ")&&e.includes(" holds ")&&e.includes(" units.")||e.startsWith("Turn ")&&e.endsWith(" final map state:")?"summary":"misc"}function Me(e){switch(e){case"orders":return"Orders";case"combat":return"Combat";case"reinforcement":return"Reinforcements";case"summary":return"End Of Turn";default:return"Notes"}}function xe(e){const t=[];for(const o of e){const a=Ne(o),s=t.at(-1);if(!s||s.kind!==a){t.push({title:Me(a),kind:a,entries:[o]});continue}s.entries.push(o)}return t}const Le=/([A-Za-z]+) MOVE (\d+) from ([A-Za-z]+) to ([A-Za-z]+)/,Ce=/Reinforcement: ([A-Za-z]+) owned by ([A-Za-z]+) gains 1 unit \((\d+) -> (\d+)\)\./,je=/- ([A-Za-z]+): ([A-Za-z]+) holds (\d+) units\./;function qe(e){const t=new Map;for(const o of e){const a=o.match(Le);if(a){const f=Number(a[2]),p=J(t,a[3]),u=J(t,a[4]);p.movementDelta-=f,u.movementDelta+=f;continue}const s=o.match(Ce);if(s){const f=J(t,s[1]);f.owner=s[2],f.reinforcementDelta+=1,f.finalUnits=Number(s[4]);continue}const l=o.trim().match(je);if(l){const f=J(t,l[1]);f.owner=l[2],f.finalUnits=Number(l[3])}}return Array.from(t.values()).filter(o=>o.movementDelta!==0||o.reinforcementDelta!==0).sort((o,a)=>o.territory.localeCompare(a.territory))}function J(e,t){const o=e.get(t);if(o)return o;const a={territory:t,owner:null,movementDelta:0,reinforcementDelta:0,finalUnits:null};return e.set(t,a),a}const Oe=document.querySelector("#app");if(!Oe)throw new Error("Missing app root");const pe=Oe;let A=localStorage.getItem("risc_lang")==="en"?"en":"zh";const he={zh:{language:"语言",chinese:"中文",english:"English",subtitle:"同时回合、隐藏提交，以及一张非常倔强的幻想大陆地图。",createRoom:"创建房间",join:"加入",roomIdPlaceholder:"房间号 (例如 ABC123)",tipJoin:"提示：开新窗口输入同一个房间号即可加入。",multiplayer:"多人房间",room:"房间",you:"你",leave:"离开",newSeat:"新增空位",startGame:"开始游戏",startHint:"开始条件：无空位且至少 2 人。座位 {seats}/5 • 玩家 {players}。",waitingOn:"等待：{waiting}",orders:"指令",ordersHint:"点地图上的领地或用下拉框选择。你可以用全部单位移动/进攻（领地可清空变无人占领）。",move:"移动",attack:"进攻",fullscreen:"全屏 (F)",source:"来源",target:"目标",select:"选择",units:"单位数",queueOrder:"添加指令",clearOrders:"清空计划",commitTurn:"提交回合",newGame:"新对局",factions:"阵营",youLabel:"你",opponent:"对手",defeated:"已淘汰",territoriesLabel:"领地",totalUnitsLabel:"总兵力",queuedAttacks:"已排队的进攻",noQueuedAttacks:"还没有排队的进攻。",remove:"删除",movesApplyHint:"移动会在本地立即生效；进攻会在提交时一起结算。",turnChanges:"本回合变化",resolutionLog:"结算日志",battleMap:"战场地图",pendingActions:"待提交操作：{count}",winnerWins:"{winner} 获胜",logOrders:"指令",logCombat:"战斗",logReinforcements:"增援",logEndOfTurn:"回合结束",logNotes:"备注",deltaMove:"移动",deltaReinforce:"增援",final:"最终",noTurnChanges:"暂无领地变化。",lobby:"大厅",setup:"布置",ordersPhase:"指令",gameOver:"结束",initialPlacement:"初始布置",placementHint:"分配你的 {reserve} 预备兵。你可以勾选某块为“空白”（无人占领）。",empty:"空白",unitsLeft:"剩余可放",lockPlacement:"锁定布置",needPlaceAll:"请先放完所有预备兵。剩余：{left}。",setupWaiting:"已提交布置，等待：{waiting}。",setupLocked:"布置已锁定。对手布置已揭示。",addedSeat:"已新增一个空位。",removedSeat:"已删除最后一个空位。",createdRoom:"已创建房间 {roomId}。",joinedRoom:"已加入房间 {roomId}，座位 {playerId}。",leftRoom:"已离开房间。",enterRoomId:"请输入房间号再加入。",noRoomToJoin:"当前没有房间可加空位。",popupBlocked:"浏览器阻止了弹窗，请允许后再试。",startNeedRoom:"请先创建或加入房间。",chooseSourceAndTarget:"请先选择来源和目标领地。",notEnoughUnits:"该领地可用单位不足。",moveTargetsOnlyFriendly:"移动只能到己方领地或无人占领领地。",moveUnownedMustAdjacent:"移动到无人占领领地必须相邻。",moveNeedsPath:"移动到己方领地需要一条己方连通路径。",attackMustNotFriendly:"进攻目标必须是敌方或无人占领领地。",attackMustAdjacent:"进攻必须选择相邻领地。",warOver:"战争结束。",turnResolved:"回合已结算，继续规划下一回合。",chooseOwnSource:"来源必须选择你自己的领地。",sourceNoUnits:"该领地没有可用于移动/进攻的单位。",sourceCleared:"已取消来源选择。",targetSelected:"目标已选择：{name}。",sourceSelected:"来源已选择：{name}。请继续选择目标。",moved:"已移动 {units}：{source} → {target}。",queuedAttack:"已排队进攻 {units}：{source} → {target}。",clearedPlanned:"已清空计划操作。",removedAttack:"已删除该条进攻。",queuedOrderHint:"按 Enter 可快速添加/提交；A=进攻，B=移动。",selectionCleared:"已清空选择。",sourceSelectedCursor:"来源已选择：{name}。移动光标并再次按空格选择目标。",targetSelectedEnter:"目标已选择：{name}。按回车添加指令。",failedToLoad:"加载失败：{error}",gameStartedSetup:"已开始游戏，请提交初始布置。",gameStarted:"游戏已开始。"},en:{language:"Language",chinese:"中文",english:"English",subtitle:"Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.",createRoom:"Create room",join:"Join",roomIdPlaceholder:"Room ID (e.g. ABC123)",tipJoin:"Tip: open another window and join the same Room ID.",multiplayer:"Multiplayer",room:"Room",you:"You",leave:"Leave",newSeat:"New seat",startGame:"Start game",startHint:"Start requires no empty seats and at least 2 players. Seats {seats}/5 • Players {players}.",waitingOn:"Waiting on: {waiting}",orders:"Orders",ordersHint:"Click territories on the map or use the selectors below. You may move/attack with all units (territories can become unoccupied).",move:"Move",attack:"Attack",fullscreen:"Fullscreen (F)",source:"Source",target:"Target",select:"Select",units:"Units",queueOrder:"Queue Order",clearOrders:"Clear Planned Actions",commitTurn:"Commit Turn",newGame:"New Game",factions:"Factions",youLabel:"You",opponent:"Opponent",defeated:"Defeated",territoriesLabel:"Territories",totalUnitsLabel:"Total units",queuedAttacks:"Queued Attacks",noQueuedAttacks:"No queued attacks yet.",remove:"Remove",movesApplyHint:"Moves apply immediately in your browser. Attacks resolve together when you commit.",turnChanges:"Turn Changes",resolutionLog:"Resolution Log",battleMap:"Battle Map",pendingActions:"Pending actions: {count}",winnerWins:"{winner} wins",logOrders:"Orders",logCombat:"Combat",logReinforcements:"Reinforcements",logEndOfTurn:"End Of Turn",logNotes:"Notes",deltaMove:"move",deltaReinforce:"reinforce",final:"final",noTurnChanges:"No territory changes resolved yet.",lobby:"LOBBY",setup:"SETUP",ordersPhase:"ORDERS",gameOver:"GAME OVER",initialPlacement:"Initial Placement",placementHint:"Distribute your {reserve} reserve units. You may mark a starting territory as empty (unoccupied).",empty:"Empty",unitsLeft:"Units left",lockPlacement:"Lock Placement",needPlaceAll:"Place all reserve units first. Units left: {left}.",setupWaiting:"Setup submitted. Waiting on: {waiting}.",setupLocked:"Setup locked in. Opponents have revealed their placements.",addedSeat:"Added an empty seat.",removedSeat:"Removed the last empty seat.",createdRoom:"Created room {roomId}.",joinedRoom:"Joined room {roomId} as {playerId}.",leftRoom:"Left room.",enterRoomId:"Enter a room ID to join.",noRoomToJoin:"No room to add a seat.",popupBlocked:"Popup blocked. Allow popups for this site, then try again.",startNeedRoom:"Create or join a room first.",chooseSourceAndTarget:"Choose a source and a target territory first.",notEnoughUnits:"That territory does not have enough spare units.",moveTargetsOnlyFriendly:"Move can only target your own territories or an unoccupied territory.",moveUnownedMustAdjacent:"Moves into unoccupied territories must be adjacent.",moveNeedsPath:"Moves into owned territories need a friendly path.",attackMustNotFriendly:"Attack orders must target enemy or unoccupied territories.",attackMustAdjacent:"Attack orders must target adjacent territories.",warOver:"The war is over.",turnResolved:"Turn resolved. Plan your next move.",chooseOwnSource:"Choose one of your territories as the source.",sourceNoUnits:"That territory has no units available to move or attack.",sourceCleared:"Source cleared.",targetSelected:"Target selected: {name}.",sourceSelected:"Source selected: {name}. Now choose a target.",moved:"Moved {units}: {source} -> {target}.",queuedAttack:"Queued attack {units}: {source} -> {target}.",clearedPlanned:"Cleared planned actions.",removedAttack:"Removed queued attack.",queuedOrderHint:"Enter queues/commits. A=Attack, B=Move.",selectionCleared:"Selection cleared.",sourceSelectedCursor:"Source selected: {name}. Move the cursor and press Space again for the target.",targetSelectedEnter:"Target selected: {name}. Press Enter to queue the order.",failedToLoad:"Failed to load: {error}",gameStartedSetup:"Game started. Submit your setup.",gameStarted:"Game started."}};function n(e,t){return(he[A][e]??he.en[e]??e).replace(/\{(\w+)\}/g,(a,s)=>String((t==null?void 0:t[s])??""))}function Ie(e){return A==="en"?e:n(e==="LOBBY"?"lobby":e==="SETUP"?"setup":e==="ORDERS"?"ordersPhase":"gameOver")}let r=null,O={},P={},R=[],b=[],M=[],I=null,h=null,v=null,B="MOVE",w=1,ee="",D=0,d=localStorage.getItem("risc_room_id"),y=sessionStorage.getItem("risc_room_token");const X=localStorage.getItem("risc_room_token");!y&&X&&(y=X,sessionStorage.setItem("risc_room_token",X),localStorage.removeItem("risc_room_token"));let _="";d&&(_=d);let H=null,V=!1;const F={mode:"loading",boardWidth:920,boardHeight:620},Re={GREEN:"#63885f",BLUE:"#7ea0be",RED:"#bb6553",YELLOW:"#c7b15a",PURPLE:"#8b6fb8",UNOWNED:"#ffffff"},Ue=["GREEN","BLUE","RED","YELLOW","PURPLE"];async function T(e,t){const o={"Content-Type":"application/json"};y&&(o["X-Player-Token"]=y);const a=await fetch(`http://127.0.0.1:8080${e}`,{headers:{...o},...t}),s=await a.text();let l=null;try{l=s?JSON.parse(s):null}catch{l={error:s||"Request failed"}}const f=typeof l=="object"&&l!=null&&"error"in l&&typeof l.error=="string"?String(l.error):null;if(!a.ok||f)throw new Error(f??"Request failed");return l}function ne(){return r==null?void 0:r.players.find(e=>e.localPlayer)}function N(){var e;return((e=ne())==null?void 0:e.id)??"GREEN"}function ye(){return N()==="GREEN"}function C(){return r?r.phase==="ORDERS"&&M.length>0?M:r.territories??[]:[]}function Y(e){return C().find(t=>t.name===e)}function oe(){const e=C();if(!(!r||e.length===0))return e[(D%e.length+e.length)%e.length]}function te(){const e=N();return C().filter(t=>t.owner===e)}function ve(e,t){return e.neighbors.includes(t.name)}function _e(e,t){if(e===t)return!0;const o=C(),a=new Map(o.map(p=>[p.name,p])),s=N(),l=[e],f=new Set([e]);for(;l.length>0;){const p=l.shift(),u=a.get(p);if(u)for(const g of u.neighbors){const $=a.get(g);if(!(!$||$.owner!==s)&&!f.has(g)){if(g===t)return!0;f.add(g),l.push(g)}}}return!1}function Z(e){const t=Y(e);if(!t)return 0;const o=b.filter(a=>a.source===e).reduce((a,s)=>a+s.units,0);return Math.max(0,t.units-o)}function K(){const e=ne();return e?e.reserveUnits-Object.values(O).reduce((t,o)=>t+o,0):0}function c(e){ee=e,m()}async function be(){if(d&&y)r=await T(`/api/rooms/${d}`);else{r=null,m();return}W(),j(),F.mode="ready",m()}async function Be(){try{await be()}catch(e){if(d&&y){d=null,y=null,localStorage.removeItem("risc_room_id"),sessionStorage.removeItem("risc_room_token");try{await be();return}catch{}}c(n("failedToLoad",{error:e.message}))}}function W(){if(!r||r.phase!=="SETUP"){O={},P={};return}const e={},t={};for(const o of te())e[o.name]=O[o.name]??0,t[o.name]=P[o.name]??!1;O=e,P=t}function j(){if(!r||r.phase!=="ORDERS"){M=[],R=[],b=[],I=null;return}I!==r.turnNumber&&(R=[],b=[],I=r.turnNumber,h=null,v=null,w=1),M=r.territories.map(e=>({...e,neighbors:[...e.neighbors]}));for(const e of R)ke(e)}function ke(e){const t=M.find(a=>a.name===e.source),o=M.find(a=>a.name===e.target);!t||!o||(t.units=Math.max(0,t.units-e.units),t.units===0&&(t.owner=null),o.owner==null&&e.units>0&&(o.owner=N()),o.units+=e.units)}async function De(){d&&y?r=await T(`/api/rooms/${d}/reset`,{method:"POST"}):r=await T("/api/game/reset",{method:"POST"}),R=[],b=[],M=[],I=null,P={},h=null,v=null,w=1,c(""),W(),j(),m()}async function Te(){try{for(const[o,a]of Object.entries(P))a&&(O[o]??0)!==0&&(O={...O,[o]:0});if(K()!==0){c(n("needPlaceAll",{left:K()}));return}const e=Object.entries(P).filter(([,o])=>o).map(([o])=>o),t=JSON.stringify({allocations:O,abandon:e});d&&y?r=await T(`/api/rooms/${d}/setup`,{method:"POST",body:t}):r=await T("/api/game/setup",{method:"POST",body:t}),R=[],b=[],M=[],I=null,h=null,v=null,w=1,j(),d&&y&&r.phase==="SETUP"&&r.waitingOnPlayers.length>0?c(n("setupWaiting",{waiting:r.waitingOnPlayers.join(", ")})):c(n("setupLocked"))}catch(e){c(e.message)}}function Ee(){if(!h||!v){c(n("chooseSourceAndTarget"));return}const e=Y(h),t=Y(v);if(!e||!t)return;const o=Z(h);if(w<1||w>o){c(n("notEnoughUnits"));return}const a=h,s=v;if(B==="MOVE"){if(t.owner!==N()&&t.owner!==null){c(n("moveTargetsOnlyFriendly"));return}if(t.owner===null&&!ve(e,t)){c(n("moveUnownedMustAdjacent"));return}if(t.owner===N()&&!_e(e.name,t.name)){c(n("moveNeedsPath"));return}const l={type:"MOVE",source:a,target:s,units:w};R=[...R,l],ke(l),c(n("moved",{units:w,source:a,target:s}))}else{if(t.owner===N()){c(n("attackMustNotFriendly"));return}if(!ve(e,t)){c(n("attackMustAdjacent"));return}b=[...b,{type:"ATTACK",source:a,target:s,units:w}],c(n("queuedAttack",{units:w,source:a,target:s}))}h=null,v=null,w=1,m()}async function Ae(){try{const e=JSON.stringify({orders:[...R,...b].map(t=>({type:t.type,source:t.source,target:t.target,units:t.units}))});d&&y?r=await T(`/api/rooms/${d}/turn`,{method:"POST",body:e}):r=await T("/api/game/turn",{method:"POST",body:e}),R=[],b=[],M=[],I=null,w=1,h=null,v=null,j(),r.phase==="GAME_OVER"?c(n("warOver")):d&&y&&r.waitingOnPlayers.length>0?c(n("waitingOn",{waiting:r.waitingOnPlayers.join(", ")})):c(n("turnResolved"))}catch(e){c(e.message)}}function Se(e,t){if(P[e])return;const o=O[e]??0,a=Math.max(0,o+t),s=K()+o;a>s||(O={...O,[e]:a},m())}function We(e){if(e.length===0)return{x:0,y:0};let t=0,o=0;for(const a of e)t+=a.x,o+=a.y;return{x:t/e.length,y:o/e.length}}function Ge(e,t,o){let a=!1;for(let s=0,l=o.length-1;s<o.length;l=s++){const f=o[s].x,p=o[s].y,u=o[l].x,g=o[l].y;p>t!=g>t&&e<(u-f)*(t-p)/(g-p||1e-9)+f&&(a=!a)}return a}function He(e,t){if(!r||r.phase==="GAME_OVER")return;const o=t.getBoundingClientRect(),a=F.boardWidth/o.width,s=F.boardHeight/o.height,l=(e.clientX-o.left)*a,f=(e.clientY-o.top)*s,p=C().find(u=>{const g=u.polygon??null;if(g&&g.length>=3)return Ge(l,f,g);const $=u.x-l,k=u.y-f;return Math.sqrt($*$+k*k)<48});if(p){if(D=C().findIndex(u=>u.name===p.name),!h){if(p.owner!==N()){c(n("chooseOwnSource"));return}if(Z(p.name)<=0){c(n("sourceNoUnits"));return}h=p.name,v=null,w=1,c(n("sourceSelected",{name:p.name})),m();return}if(p.name===h){h=null,v=null,c(n("sourceCleared")),m();return}v=p.name,c(n("targetSelected",{name:p.name})),m()}}function Fe(e){var p;const t=e.getContext("2d");if(!t||!r)return;const o=C(),a=o.some(u=>{var g;return(((g=u.polygon)==null?void 0:g.length)??0)>=3});e.width=F.boardWidth,e.height=F.boardHeight,t.clearRect(0,0,e.width,e.height);const s=t.createLinearGradient(0,0,0,e.height);s.addColorStop(0,"#a7cde0"),s.addColorStop(.24,"#dbead8"),s.addColorStop(1,"#cfaf76"),t.fillStyle=s,t.fillRect(0,0,e.width,e.height),t.fillStyle="rgba(255,255,255,0.18)";for(let u=0;u<14;u+=1)t.beginPath(),t.arc(80+u*60,60+u%3*26,24+u%4*8,0,Math.PI*2),t.fill();if(!a){t.lineWidth=5,t.strokeStyle="rgba(73, 58, 38, 0.28)";const u=new Set;for(const g of o)for(const $ of g.neighbors){const k=[g.name,$].sort().join(":");if(u.has(k))continue;u.add(k);const x=Y($);x&&(t.beginPath(),t.moveTo(g.x,g.y),t.lineTo(x.x,x.y),t.stroke())}}for(const u of o){const g=u.owner??"UNOWNED",$=Re[g]??"#666",k=u.name===h||u.name===v,x=u.name===((p=oe())==null?void 0:p.name),E=u.polygon??null,G=k?"#fff3d1":x?"#1d2b2a":g==="UNOWNED"?"rgba(33, 20, 8, 0.6)":"rgba(33, 20, 8, 0.35)";if(t.fillStyle=$,t.strokeStyle=G,t.lineWidth=k?7:x?5:3.5,a&&E&&E.length>=3){t.beginPath(),t.moveTo(E[0].x,E[0].y);for(let U=1;U<E.length;U++)t.lineTo(E[U].x,E[U].y);t.closePath(),t.fill(),t.stroke();const q=We(E);t.fillStyle="#1d2b2a",t.textAlign="center",t.font="bold 20px Georgia",t.fillText(u.name,q.x,q.y-8),t.font="bold 24px Georgia",t.fillText(u.hidden?"?":String(u.units),q.x,q.y+24)}else t.beginPath(),t.arc(u.x,u.y,43,0,Math.PI*2),t.fill(),t.stroke(),t.fillStyle=g==="UNOWNED"?"#1d2b2a":"#fff8ec",t.textAlign="center",t.font="bold 19px Georgia",t.fillText(u.name,u.x,u.y-8),t.font="bold 24px Georgia",t.fillText(u.hidden?"?":String(u.units),u.x,u.y+24)}t.fillStyle="rgba(33, 24, 16, 0.68)",t.fillRect(18,18,320,44),t.fillStyle="#fff8ec",t.textAlign="left",t.font="bold 22px Georgia";const l=Ie(r.phase),f=A==="zh"?`回合 ${r.turnNumber} • ${l}`:`Turn ${r.turnNumber} • ${l}`;t.fillText(f,34,47)}function ze(){var t;if(!r)return JSON.stringify({mode:"loading"});const e={mode:r.phase,turn:r.turnNumber,note:r.mapNote,pendingMoves:R,pendingAttacks:b,selection:{source:h,target:v,type:B,units:w,cursor:((t=oe())==null?void 0:t.name)??null},territories:C().map(o=>({name:o.name,owner:o.owner,units:o.hidden?"hidden":o.units,x:o.x,y:o.y,neighbors:o.neighbors})),players:r.players,log:r.lastLog};return JSON.stringify(e)}function Je(e){const t=xe(e),o=a=>{switch(a){case"orders":return n("logOrders");case"combat":return n("logCombat");case"reinforcement":return n("logReinforcements");case"summary":return n("logEndOfTurn");default:return n("logNotes")}};return t.map(a=>`
    <section class="battle-section battle-${a.kind}">
      <h3>${o(a.kind)}</h3>
      <div class="battle-lines">
        ${a.entries.map(s=>`<div class="battle-line">${s}</div>`).join("")}
      </div>
    </section>
  `).join("")}function Ve(e){const t=qe(e);return t.length===0?`<div class="log-entry">${n("noTurnChanges")}</div>`:t.map(o=>{const a=o.movementDelta===0?`${n("deltaMove")} 0`:`${n("deltaMove")} ${o.movementDelta>0?"+":""}${o.movementDelta}`,s=o.reinforcementDelta===0?`${n("deltaReinforce")} 0`:`${n("deltaReinforce")} +${o.reinforcementDelta}`,l=o.finalUnits==null?"?":String(o.finalUnits);return`
      <div class="turn-summary-card">
        <strong>${o.territory}</strong>
        <div>${a}</div>
        <div>${s}</div>
        <div>${n("final")} ${l}${o.owner?` • ${o.owner}`:""}</div>
      </div>
    `}).join("")}function Ye(){window.render_game_to_text=ze,window.advanceTime=()=>{m()}}async function Pe(){document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}function m(){var ge;if(!r){pe.innerHTML=`
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
    `;const i=document.querySelector("#lang-select");i&&(i.onchange=()=>{A=i.value==="en"?"en":"zh",localStorage.setItem("risc_lang",A),m()});const S=document.querySelector("#create-room");S&&(S.onclick=()=>{we().catch(()=>{})});const L=document.querySelector("#join-room-id");L&&(L.oninput=()=>{_=L.value});const z=document.querySelector("#join-room");z&&(z.onclick=()=>{$e(_).catch(()=>{})});return}const e=r,t=new Map(e.players.map(i=>[i.id,i])),o=Math.max(2,Math.min(5,Number.isFinite(e.seatCount)?e.seatCount:e.players.length)),a=Ue.slice(0,o),s=e.players.length<o,l=a[a.length-1]??"GREEN",f=`
    <div class="seat-grid" aria-label="Room seats">
      ${a.map(i=>{const S=t.get(i)??null,L=e.phase==="LOBBY"&&ye()&&S==null&&s&&i===l&&o>2;return`
          <div class="seat ${S?"occupied":"empty"}">
            <div class="seat-swatch" style="background:${Re[i]};"></div>
            <div class="seat-meta">
              <div class="seat-id">${i}</div>
              <div class="seat-name">${S?S.displayName:""}</div>
            </div>
            ${L?`<button class="secondary seat-remove" data-seat-remove="${i}">${n("remove")}</button>`:""}
          </div>
        `}).join("")}
    </div>
  `,p=r.phase==="SETUP"?`
      <section class="panel setup">
        <h2>${n("initialPlacement")}</h2>
        <p class="hint">${n("placementHint",{reserve:((ge=ne())==null?void 0:ge.reserveUnits)??0})}</p>
        <div class="setup-grid">
          ${te().map(i=>`
            <div class="territory-stepper">
              <strong>${i.name}</strong>
              <label class="setup-empty">
                <input type="checkbox" data-setup-abandon="${i.name}" ${P[i.name]?"checked":""} />
                ${n("empty")}
              </label>
              <button class="secondary" data-setup-minus="${i.name}">-</button>
              <span>${O[i.name]??0}</span>
              <button class="secondary" data-setup-plus="${i.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>${n("unitsLeft")}: <strong>${K()}</strong></span>
          <button id="start-btn">${n("lockPlacement")}</button>
        </div>
      </section>`:"",u=te().filter(i=>Z(i.name)>0).map(i=>`<option value="${i.name}" ${h===i.name?"selected":""}>${i.name}</option>`).join(""),g=C().map(i=>`<option value="${i.name}" ${v===i.name?"selected":""}>${i.name}</option>`).join("");pe.innerHTML=`
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
          <label>${n("source")}<select id="source-select"><option value="">${n("select")}</option>${u}</select></label>
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
        ${r.players.map(i=>`
          <article>
            <strong>${i.displayName}</strong>
            <div>${n("territoriesLabel")}: ${i.territories}</div>
            <div>${n("totalUnitsLabel")}: ${i.totalUnits}</div>
            <div>${i.defeated?n("defeated"):i.localPlayer?n("youLabel"):n("opponent")}</div>
          </article>`).join("")}
      </section>
      <section>
        <h2>${n("queuedAttacks")}</h2>
        <div class="log">
          ${b.length===0?`<div class="log-entry">${n("noQueuedAttacks")}</div>`:b.map((i,S)=>`
              <div class="log-entry">
                ATTACK ${i.units} from ${i.source} to ${i.target}
                <button class="secondary" data-attack-remove="${S}">${n("remove")}</button>
              </div>`).join("")}
        </div>
        <div class="hint">${n("movesApplyHint")}</div>
      </section>
      <section>
        <h2>${n("turnChanges")}</h2>
        <div class="log turn-summary-log">
          ${Ve(r.lastLog)}
        </div>
      </section>
      <section>
        <h2>${n("resolutionLog")}</h2>
        <div class="log battle-log">
          ${Je(r.lastLog)}
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
  `;const $=document.querySelector("#lang-select");$&&($.onchange=()=>{A=$.value==="en"?"en":"zh",localStorage.setItem("risc_lang",A),m()});const k=document.querySelector("#game-canvas");k&&(Fe(k),k.onclick=i=>He(i,k)),document.querySelectorAll("[data-mode]").forEach(i=>{i.onclick=()=>{B=i.dataset.mode,m()}}),document.querySelectorAll("[data-setup-plus]").forEach(i=>{i.onclick=()=>Se(i.dataset.setupPlus??"",1)}),document.querySelectorAll("[data-setup-minus]").forEach(i=>{i.onclick=()=>Se(i.dataset.setupMinus??"",-1)}),document.querySelectorAll("[data-setup-abandon]").forEach(i=>{i.onchange=()=>{const S=i.dataset.setupAbandon??"";if(!S)return;const L=!!i.checked;P={...P,[S]:L},L&&(O={...O,[S]:0}),m()}});const x=document.querySelector("#start-btn");x&&(x.onclick=()=>{Te()});const E=document.querySelector("#source-select");E&&(E.onchange=()=>{h=E.value||null,m()});const G=document.querySelector("#target-select");G&&(G.onchange=()=>{v=G.value||null,m()});const q=document.querySelector("#units-input");q&&(q.oninput=()=>{w=Math.max(1,Number(q.value)||1)});const U=document.querySelector("#queue-order");U&&(U.onclick=Ee);const ae=document.querySelector("#commit-turn");ae&&(ae.onclick=()=>{Ae()});const se=document.querySelector("#clear-orders");se&&(se.onclick=()=>{R=[],b=[],j(),w=1,c(n("clearedPlanned"))}),document.querySelectorAll("[data-attack-remove]").forEach(i=>{i.onclick=()=>{const S=Number(i.dataset.attackRemove??"-1");Number.isNaN(S)||S<0||(b=b.filter((L,z)=>z!==S),c(n("removedAttack")),m())}});const ie=document.querySelector("#reset-game");ie&&(ie.onclick=()=>{De()});const le=document.querySelector("#fullscreen-btn");le&&(le.onclick=()=>{Pe()});const ce=document.querySelector("#create-room");ce&&(ce.onclick=()=>{we().catch(()=>{})});const Q=document.querySelector("#join-room-id");Q&&(Q.oninput=()=>{_=Q.value});const ue=document.querySelector("#join-room");ue&&(ue.onclick=()=>{$e(_).catch(()=>{})});const de=document.querySelector("#leave-room");de&&(de.onclick=()=>{Ke()});const me=document.querySelector("#new-seat");me&&(me.onclick=()=>{Ze().catch(()=>{})}),document.querySelectorAll("[data-seat-remove]").forEach(i=>{i.onclick=()=>{Xe().catch(()=>{})}});const fe=document.querySelector("#start-game");fe&&(fe.onclick=()=>{Qe().catch(()=>{})})}window.addEventListener("keydown",e=>{if(r){if(e.key==="ArrowRight"){D+=1,m();return}if(e.key==="ArrowLeft"){D-=1,m();return}if(e.key==="ArrowDown"){D+=3,m();return}if(e.key==="ArrowUp"){D-=3,m();return}if(e.key.toLowerCase()==="f"&&Pe(),e.key.toLowerCase()==="a"&&r.phase==="ORDERS"&&(B="ATTACK",m()),e.key.toLowerCase()==="b"&&r.phase==="ORDERS"&&(B="MOVE",m()),e.key==="Enter"){if(r.phase==="SETUP"){Te();return}if(r.phase==="ORDERS"&&h&&v){Ee();return}r.phase==="ORDERS"&&R.length+b.length>0&&Ae()}if(e.key===" "||e.code==="Space"){if(r.phase!=="ORDERS")return;e.preventDefault();const t=oe();if(!t)return;if(!h){if(t.owner!==N()){c(n("chooseOwnSource"));return}if(Z(t.name)<=0){c(n("sourceNoUnits"));return}h=t.name,v=null,c(n("sourceSelectedCursor",{name:t.name})),m();return}if(t.name===h){h=null,v=null,c(n("selectionCleared")),m();return}v=t.name,c(n("targetSelectedEnter",{name:t.name})),m();return}e.key==="Escape"&&document.fullscreenElement&&document.exitFullscreen()}});Ye();Be();async function we(){try{const e=await T("/api/rooms",{method:"POST"});d=e.roomId,y=e.token,localStorage.setItem("risc_room_id",d),sessionStorage.setItem("risc_room_token",y),r=e.game,W(),j(),re(),c(n("createdRoom",{roomId:d}))}catch(e){throw c(e.message),e}}async function $e(e){try{const t=(e??"").trim().toUpperCase();if(!t){c(n("enterRoomId"));return}const o=await T(`/api/rooms/${t}/join`,{method:"POST"});d=o.roomId,y=o.token,localStorage.setItem("risc_room_id",d),sessionStorage.setItem("risc_room_token",y),r=o.game,W(),j(),re(),c(n("joinedRoom",{roomId:d,playerId:o.playerId}))}catch(t){throw c(t.message),t}}function Ke(){d=null,y=null,localStorage.removeItem("risc_room_id"),sessionStorage.removeItem("risc_room_token"),et(),R=[],b=[],M=[],I=null,O={},P={},c(n("leftRoom")),r=null,m()}async function Ze(){if(!d){c(n("noRoomToJoin"));return}try{r=await T(`/api/rooms/${d}/seats/add`,{method:"POST"}),c(n("addedSeat")),m()}catch(e){throw c(e.message),e}}async function Qe(){if(!d||!y){c(n("startNeedRoom"));return}try{r=await T(`/api/rooms/${d}/start`,{method:"POST"}),R=[],b=[],M=[],I=null,h=null,v=null,w=1,W(),j(),c(r.phase==="SETUP"?n("gameStartedSetup"):n("gameStarted"))}catch(e){throw c(e.message),e}}async function Xe(){if(!d||!y){c(n("startNeedRoom"));return}try{r=await T(`/api/rooms/${d}/seats/remove`,{method:"POST"}),c(n("removedSeat")),m()}catch(e){throw c(e.message),e}}function re(){H==null&&(H=window.setInterval(()=>{tt()},1200))}function et(){H!=null&&(window.clearInterval(H),H=null,V=!1)}async function tt(){if(!(!d||!y||V)){V=!0;try{r=await T(`/api/rooms/${d}`),W(),j(),m()}catch{}finally{V=!1}}}d&&y&&re();
