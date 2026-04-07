(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const l of s)if(l.type==="childList")for(const m of l.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&a(m)}).observe(document,{childList:!0,subtree:!0});function o(s){const l={};return s.integrity&&(l.integrity=s.integrity),s.referrerPolicy&&(l.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?l.credentials="include":s.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function a(s){if(s.ep)return;s.ep=!0;const l=o(s);fetch(s.href,l)}})();function Ne(e){return e.startsWith("Committed move orders")||e.startsWith("Committed attack orders")||e.startsWith(" - Green")||e.startsWith(" - Blue")||e.startsWith(" - Red")?"orders":e.startsWith("Battle queue")||e.startsWith("Combat starts")||e.startsWith("  Round ")||e.startsWith("Combat result")?"combat":e.startsWith("Reinforcement:")?"reinforcement":e.startsWith(" - ")&&e.includes(" holds ")&&e.includes(" units.")||e.startsWith("Turn ")&&e.endsWith(" final map state:")?"summary":"misc"}function Me(e){switch(e){case"orders":return"Orders";case"combat":return"Combat";case"reinforcement":return"Reinforcements";case"summary":return"End Of Turn";default:return"Notes"}}function Le(e){const t=[];for(const o of e){const a=Ne(o),s=t.at(-1);if(!s||s.kind!==a){t.push({title:Me(a),kind:a,entries:[o]});continue}s.entries.push(o)}return t}const xe=/([A-Za-z]+) MOVE (\d+) from ([A-Za-z]+) to ([A-Za-z]+)/,Ce=/Reinforcement: ([A-Za-z]+) owned by ([A-Za-z]+) gains 1 unit \((\d+) -> (\d+)\)\./,qe=/- ([A-Za-z]+): ([A-Za-z]+) holds (\d+) units\./;function je(e){const t=new Map;for(const o of e){const a=o.match(xe);if(a){const m=Number(a[2]),g=J(t,a[3]),u=J(t,a[4]);g.movementDelta-=m,u.movementDelta+=m;continue}const s=o.match(Ce);if(s){const m=J(t,s[1]);m.owner=s[2],m.reinforcementDelta+=1,m.finalUnits=Number(s[4]);continue}const l=o.trim().match(qe);if(l){const m=J(t,l[1]);m.owner=l[2],m.finalUnits=Number(l[3])}}return Array.from(t.values()).filter(o=>o.movementDelta!==0||o.reinforcementDelta!==0).sort((o,a)=>o.territory.localeCompare(a.territory))}function J(e,t){const o=e.get(t);if(o)return o;const a={territory:t,owner:null,movementDelta:0,reinforcementDelta:0,finalUnits:null};return e.set(t,a),a}const we=document.querySelector("#app");if(!we)throw new Error("Missing app root");const fe=we;let P=localStorage.getItem("risc_lang")==="en"?"en":"zh";const pe={zh:{language:"语言",chinese:"中文",english:"English",subtitle:"同时回合、隐藏提交，以及一张非常倔强的幻想大陆地图。",createRoom:"创建房间",join:"加入",roomIdPlaceholder:"房间号 (例如 ABC123)",tipJoin:"提示：开新窗口输入同一个房间号即可加入。",multiplayer:"多人房间",room:"房间",you:"你",leave:"离开",newSeat:"新增空位",startGame:"开始游戏",startHint:"开始条件：无空位且至少 2 人。座位 {seats}/5 • 玩家 {players}。",waitingOn:"等待：{waiting}",orders:"指令",ordersHint:"点击地图上的领地来选择来源和目标。你可以用全部单位移动/进攻（领地可清空变无人占领）。",move:"移动",attack:"进攻",fullscreen:"全屏 (F)",source:"来源",target:"目标",currentSelection:"当前选择",none:"未选择",units:"单位数",queueOrder:"添加指令",clearOrders:"清空计划",commitTurn:"提交回合",newGame:"新对局",factions:"阵营",youLabel:"你",opponent:"对手",defeated:"已淘汰",territoriesLabel:"领地",totalUnitsLabel:"总兵力",queuedAttacks:"已排队的进攻",noQueuedAttacks:"还没有排队的进攻。",remove:"删除",movesApplyHint:"移动会在本地立即生效；进攻会在提交时一起结算。",turnChanges:"本回合变化",resolutionLog:"结算日志",battleMap:"战场地图",pendingActions:"待提交操作：{count}",winnerWins:"{winner} 获胜",logOrders:"指令",logCombat:"战斗",logReinforcements:"增援",logEndOfTurn:"回合结束",logNotes:"备注",deltaMove:"移动",deltaReinforce:"增援",final:"最终",noTurnChanges:"暂无领地变化。",lobby:"大厅",setup:"布置",ordersPhase:"指令",gameOver:"结束",initialPlacement:"初始布置",placementHint:"分配你的 {reserve} 预备兵。你可以勾选某块为“空白”（无人占领）。",empty:"空白",unitsLeft:"剩余可放",lockPlacement:"锁定布置",needPlaceAll:"请先放完所有预备兵。剩余：{left}。",setupWaiting:"已提交布置，等待：{waiting}。",setupLocked:"布置已锁定。对手布置已揭示。",addedSeat:"已新增一个空位。",removedSeat:"已删除最后一个空位。",createdRoom:"已创建房间 {roomId}。",joinedRoom:"已加入房间 {roomId}，座位 {playerId}。",leftRoom:"已离开房间。",enterRoomId:"请输入房间号再加入。",noRoomToJoin:"当前没有房间可加空位。",popupBlocked:"浏览器阻止了弹窗，请允许后再试。",startNeedRoom:"请先创建或加入房间。",chooseSourceAndTarget:"请先选择来源和目标领地。",notEnoughUnits:"该领地可用单位不足。",moveTargetsOnlyFriendly:"移动只能到己方领地或无人占领领地。",moveUnownedMustAdjacent:"移动到无人占领领地必须相邻。",moveNeedsPath:"移动到己方领地需要一条己方连通路径。",attackMustNotFriendly:"进攻目标必须是敌方或无人占领领地。",attackMustAdjacent:"进攻必须选择相邻领地。",warOver:"战争结束。",turnResolved:"回合已结算，继续规划下一回合。",chooseOwnSource:"来源必须选择你自己的领地。",sourceNoUnits:"该领地没有可用于移动/进攻的单位。",sourceCleared:"已取消来源选择。",targetSelected:"目标已选择：{name}。",sourceSelected:"来源已选择：{name}。请继续选择目标。",moved:"已移动 {units}：{source} → {target}。",queuedAttack:"已排队进攻 {units}：{source} → {target}。",clearedPlanned:"已清空计划操作。",removedAttack:"已删除该条进攻。",queuedOrderHint:"按 Enter 可快速添加/提交；A=进攻，B=移动。",selectionCleared:"已清空选择。",sourceSelectedCursor:"来源已选择：{name}。移动光标并再次按空格选择目标。",targetSelectedEnter:"目标已选择：{name}。按回车添加指令。",failedToLoad:"加载失败：{error}",gameStartedSetup:"已开始游戏，请提交初始布置。",gameStarted:"游戏已开始。"},en:{language:"Language",chinese:"中文",english:"English",subtitle:"Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.",createRoom:"Create room",join:"Join",roomIdPlaceholder:"Room ID (e.g. ABC123)",tipJoin:"Tip: open another window and join the same Room ID.",multiplayer:"Multiplayer",room:"Room",you:"You",leave:"Leave",newSeat:"New seat",startGame:"Start game",startHint:"Start requires no empty seats and at least 2 players. Seats {seats}/5 • Players {players}.",waitingOn:"Waiting on: {waiting}",orders:"Orders",ordersHint:"Click territories on the map to choose source and target. You may move/attack with all units (territories can become unoccupied).",move:"Move",attack:"Attack",fullscreen:"Fullscreen (F)",source:"Source",target:"Target",currentSelection:"Current Selection",none:"None",units:"Units",queueOrder:"Queue Order",clearOrders:"Clear Planned Actions",commitTurn:"Commit Turn",newGame:"New Game",factions:"Factions",youLabel:"You",opponent:"Opponent",defeated:"Defeated",territoriesLabel:"Territories",totalUnitsLabel:"Total units",queuedAttacks:"Queued Attacks",noQueuedAttacks:"No queued attacks yet.",remove:"Remove",movesApplyHint:"Moves apply immediately in your browser. Attacks resolve together when you commit.",turnChanges:"Turn Changes",resolutionLog:"Resolution Log",battleMap:"Battle Map",pendingActions:"Pending actions: {count}",winnerWins:"{winner} wins",logOrders:"Orders",logCombat:"Combat",logReinforcements:"Reinforcements",logEndOfTurn:"End Of Turn",logNotes:"Notes",deltaMove:"move",deltaReinforce:"reinforce",final:"final",noTurnChanges:"No territory changes resolved yet.",lobby:"LOBBY",setup:"SETUP",ordersPhase:"ORDERS",gameOver:"GAME OVER",initialPlacement:"Initial Placement",placementHint:"Distribute your {reserve} reserve units. You may mark a starting territory as empty (unoccupied).",empty:"Empty",unitsLeft:"Units left",lockPlacement:"Lock Placement",needPlaceAll:"Place all reserve units first. Units left: {left}.",setupWaiting:"Setup submitted. Waiting on: {waiting}.",setupLocked:"Setup locked in. Opponents have revealed their placements.",addedSeat:"Added an empty seat.",removedSeat:"Removed the last empty seat.",createdRoom:"Created room {roomId}.",joinedRoom:"Joined room {roomId} as {playerId}.",leftRoom:"Left room.",enterRoomId:"Enter a room ID to join.",noRoomToJoin:"No room to add a seat.",popupBlocked:"Popup blocked. Allow popups for this site, then try again.",startNeedRoom:"Create or join a room first.",chooseSourceAndTarget:"Choose a source and a target territory first.",notEnoughUnits:"That territory does not have enough spare units.",moveTargetsOnlyFriendly:"Move can only target your own territories or an unoccupied territory.",moveUnownedMustAdjacent:"Moves into unoccupied territories must be adjacent.",moveNeedsPath:"Moves into owned territories need a friendly path.",attackMustNotFriendly:"Attack orders must target enemy or unoccupied territories.",attackMustAdjacent:"Attack orders must target adjacent territories.",warOver:"The war is over.",turnResolved:"Turn resolved. Plan your next move.",chooseOwnSource:"Choose one of your territories as the source.",sourceNoUnits:"That territory has no units available to move or attack.",sourceCleared:"Source cleared.",targetSelected:"Target selected: {name}.",sourceSelected:"Source selected: {name}. Now choose a target.",moved:"Moved {units}: {source} -> {target}.",queuedAttack:"Queued attack {units}: {source} -> {target}.",clearedPlanned:"Cleared planned actions.",removedAttack:"Removed queued attack.",queuedOrderHint:"Enter queues/commits. A=Attack, B=Move.",selectionCleared:"Selection cleared.",sourceSelectedCursor:"Source selected: {name}. Move the cursor and press Space again for the target.",targetSelectedEnter:"Target selected: {name}. Press Enter to queue the order.",failedToLoad:"Failed to load: {error}",gameStartedSetup:"Game started. Submit your setup.",gameStarted:"Game started."}};function n(e,t){return(pe[P][e]??pe.en[e]??e).replace(/\{(\w+)\}/g,(a,s)=>String((t==null?void 0:t[s])??""))}function $e(e){return P==="en"?e:n(e==="LOBBY"?"lobby":e==="SETUP"?"setup":e==="ORDERS"?"ordersPhase":"gameOver")}let r=null,k={},N={},te=!1,R=[],v=[],M=[],q=null,h=null,b=null,_="MOVE",w=1,X="",D=0,d=localStorage.getItem("risc_room_id"),y=sessionStorage.getItem("risc_room_token");const Q=localStorage.getItem("risc_room_token");!y&&Q&&(y=Q,sessionStorage.setItem("risc_room_token",Q),localStorage.removeItem("risc_room_token"));let B="";d&&(B=d);let G=null,V=!1,ee={};const H={mode:"loading",boardWidth:920,boardHeight:620},ke={GREEN:"#63885f",BLUE:"#7ea0be",RED:"#bb6553",YELLOW:"#c7b15a",PURPLE:"#8b6fb8",UNOWNED:"#ffffff"},Ie=["GREEN","BLUE","RED","YELLOW","PURPLE"];async function O(e,t){const o={"Content-Type":"application/json"};y&&(o["X-Player-Token"]=y);const a=await fetch(`http://127.0.0.1:8080${e}`,{headers:{...o},...t}),s=await a.text();let l=null;try{l=s?JSON.parse(s):null}catch{l={error:s||"Request failed"}}const m=typeof l=="object"&&l!=null&&"error"in l&&typeof l.error=="string"?String(l.error):null;if(!a.ok||m)throw new Error(m??"Request failed");return l}function ne(){return r==null?void 0:r.players.find(e=>e.localPlayer)}function E(){var e;return((e=ne())==null?void 0:e.id)??"GREEN"}function ge(){return E()==="GREEN"}function j(){return r?r.phase==="ORDERS"&&M.length>0?M:r.territories??[]:[]}function Y(e){return j().find(t=>t.name===e)}function oe(){const e=j();if(!(!r||e.length===0))return e[(D%e.length+e.length)%e.length]}function Re(){const e=E();return j().filter(t=>t.owner===e)}function he(e,t){return e.neighbors.includes(t.name)}function Ue(e,t){if(e===t)return!0;const o=j(),a=new Map(o.map(g=>[g.name,g])),s=E(),l=[e],m=new Set([e]);for(;l.length>0;){const g=l.shift(),u=a.get(g);if(u)for(const f of u.neighbors){const $=a.get(f);if(!(!$||$.owner!==s)&&!m.has(f)){if(f===t)return!0;m.add(f),l.push(f)}}}return!1}function re(e){const t=Y(e);if(!t)return 0;const o=v.filter(a=>a.source===e).reduce((a,s)=>a+s.units,0);return Math.max(0,t.units-o)}function K(){const e=ne();return e?e.reserveUnits-Object.values(k).reduce((t,o)=>t+o,0):0}function c(e){X=e,p()}async function ye(){if(d&&y)r=await O(`/api/rooms/${d}`);else{r=null,p();return}W(),C(),H.mode="ready",p()}async function Be(){try{await ye()}catch(e){if(d&&y){d=null,y=null,localStorage.removeItem("risc_room_id"),sessionStorage.removeItem("risc_room_token");try{await ye();return}catch{}}c(n("failedToLoad",{error:e.message}))}}function W(){if(!r||r.phase!=="SETUP"){k={},N={},te=!1;return}const e={},t={};for(const o of Re())e[o.name]=k[o.name]??0,t[o.name]=N[o.name]??!1;k=e,N=t}function C(){if(!r||r.phase!=="ORDERS"){M=[],R=[],v=[],q=null;return}q!==r.turnNumber&&(R=[],v=[],q=r.turnNumber,h=null,b=null,w=1),M=r.territories.map(e=>({...e,neighbors:[...e.neighbors]}));for(const e of R)Oe(e)}function Oe(e){const t=M.find(a=>a.name===e.source),o=M.find(a=>a.name===e.target);!t||!o||(t.units=Math.max(0,t.units-e.units),t.units===0&&(t.owner=null),o.owner==null&&e.units>0&&(o.owner=E()),o.units+=e.units)}async function _e(){d&&y?r=await O(`/api/rooms/${d}/reset`,{method:"POST"}):r=await O("/api/game/reset",{method:"POST"}),R=[],v=[],M=[],q=null,N={},h=null,b=null,w=1,c(""),W(),C(),p()}async function Ee(){try{for(const[o,a]of Object.entries(N))a&&(k[o]??0)!==0&&(k={...k,[o]:0});if(K()!==0){c(n("needPlaceAll",{left:K()}));return}const e=Object.entries(N).filter(([,o])=>o).map(([o])=>o),t=JSON.stringify({allocations:k,abandon:e});d&&y?r=await O(`/api/rooms/${d}/setup`,{method:"POST",body:t}):r=await O("/api/game/setup",{method:"POST",body:t}),te=!0,R=[],v=[],M=[],q=null,h=null,b=null,w=1,C(),d&&y&&r.phase==="SETUP"&&r.waitingOnPlayers.length>0?c(n("setupWaiting",{waiting:r.waitingOnPlayers.join(", ")})):c(n("setupLocked"))}catch(e){c(e.message)}}function Te(){if(!h||!b){c(n("chooseSourceAndTarget"));return}const e=Y(h),t=Y(b);if(!e||!t)return;const o=re(h);if(w<1||w>o){c(n("notEnoughUnits"));return}const a=h,s=b;if(_==="MOVE"){if(t.owner!==E()&&t.owner!==null){c(n("moveTargetsOnlyFriendly"));return}if(t.owner===null&&!he(e,t)){c(n("moveUnownedMustAdjacent"));return}if(t.owner===E()&&!Ue(e.name,t.name)){c(n("moveNeedsPath"));return}const l={type:"MOVE",source:a,target:s,units:w};R=[...R,l],Oe(l),c(n("moved",{units:w,source:a,target:s}))}else{if(t.owner===E()){c(n("attackMustNotFriendly"));return}if(!he(e,t)){c(n("attackMustAdjacent"));return}v=[...v,{type:"ATTACK",source:a,target:s,units:w}],c(n("queuedAttack",{units:w,source:a,target:s}))}h=null,b=null,w=1,p()}async function Ae(){try{const e=JSON.stringify({orders:[...R,...v].map(t=>({type:t.type,source:t.source,target:t.target,units:t.units}))});d&&y?r=await O(`/api/rooms/${d}/turn`,{method:"POST",body:e}):r=await O("/api/game/turn",{method:"POST",body:e}),R=[],v=[],M=[],q=null,w=1,h=null,b=null,C(),r.phase==="GAME_OVER"?c(n("warOver")):d&&y&&r.waitingOnPlayers.length>0?c(n("waitingOn",{waiting:r.waitingOnPlayers.join(", ")})):c(n("turnResolved"))}catch(e){c(e.message)}}function ve(e,t){if(N[e])return;const o=k[e]??0,a=Math.max(0,o+t),s=K()+o;a>s||(k={...k,[e]:a},p())}function De(e){if(e.length===0)return{x:0,y:0};let t=0,o=0;for(const a of e)t+=a.x,o+=a.y;return{x:t/e.length,y:o/e.length}}function We(e,t,o){let a=!1;for(let s=0,l=o.length-1;s<o.length;l=s++){const m=o[s].x,g=o[s].y,u=o[l].x,f=o[l].y;g>t!=f>t&&e<(u-m)*(t-g)/(f-g||1e-9)+m&&(a=!a)}return a}function Ge(e,t){if(!r||r.phase==="GAME_OVER")return;const o=t.getBoundingClientRect(),a=H.boardWidth/o.width,s=H.boardHeight/o.height,l=(e.clientX-o.left)*a,m=(e.clientY-o.top)*s,g=j().find(u=>{const f=u.polygon??null;if(f&&f.length>=3)return We(l,m,f);const $=u.x-l,T=u.y-m;return Math.sqrt($*$+T*T)<48});if(g){if(D=j().findIndex(u=>u.name===g.name),!h){if(g.owner!==E()){c(n("chooseOwnSource"));return}if(re(g.name)<=0){c(n("sourceNoUnits"));return}h=g.name,b=null,w=1,c(n("sourceSelected",{name:g.name})),p();return}if(g.name===h){h=null,b=null,c(n("sourceCleared")),p();return}b=g.name,c(n("targetSelected",{name:g.name})),p()}}function He(e){var g;const t=e.getContext("2d");if(!t||!r)return;const o=j(),a=o.some(u=>{var f;return(((f=u.polygon)==null?void 0:f.length)??0)>=3});e.width=H.boardWidth,e.height=H.boardHeight,t.clearRect(0,0,e.width,e.height);const s=t.createLinearGradient(0,0,0,e.height);s.addColorStop(0,"#a7cde0"),s.addColorStop(.24,"#dbead8"),s.addColorStop(1,"#cfaf76"),t.fillStyle=s,t.fillRect(0,0,e.width,e.height),t.fillStyle="rgba(255,255,255,0.18)";for(let u=0;u<14;u+=1)t.beginPath(),t.arc(80+u*60,60+u%3*26,24+u%4*8,0,Math.PI*2),t.fill();if(!a){t.lineWidth=5,t.strokeStyle="rgba(73, 58, 38, 0.28)";const u=new Set;for(const f of o)for(const $ of f.neighbors){const T=[f.name,$].sort().join(":");if(u.has(T))continue;u.add(T);const L=Y($);L&&(t.beginPath(),t.moveTo(f.x,f.y),t.lineTo(L.x,L.y),t.stroke())}}for(const u of o){const f=u.owner??"UNOWNED",$=ke[f]??"#666",T=u.name===h||u.name===b,L=u.name===((g=oe())==null?void 0:g.name),A=u.polygon??null,F=T?"#fff3d1":L?"#1d2b2a":f==="UNOWNED"?"rgba(33, 20, 8, 0.6)":"rgba(33, 20, 8, 0.35)";if(t.fillStyle=$,t.strokeStyle=F,t.lineWidth=T?7:L?5:3.5,a&&A&&A.length>=3){t.beginPath(),t.moveTo(A[0].x,A[0].y);for(let U=1;U<A.length;U++)t.lineTo(A[U].x,A[U].y);t.closePath(),t.fill(),t.stroke();const I=De(A);t.fillStyle="#1d2b2a",t.textAlign="center",t.font="bold 20px Georgia",t.fillText(u.name,I.x,I.y-8),t.font="bold 24px Georgia",t.fillText(u.hidden?"?":String(u.units),I.x,I.y+24)}else t.beginPath(),t.arc(u.x,u.y,43,0,Math.PI*2),t.fill(),t.stroke(),t.fillStyle=f==="UNOWNED"?"#1d2b2a":"#fff8ec",t.textAlign="center",t.font="bold 19px Georgia",t.fillText(u.name,u.x,u.y-8),t.font="bold 24px Georgia",t.fillText(u.hidden?"?":String(u.units),u.x,u.y+24)}t.fillStyle="rgba(33, 24, 16, 0.68)",t.fillRect(18,18,320,44),t.fillStyle="#fff8ec",t.textAlign="left",t.font="bold 22px Georgia";const l=$e(r.phase),m=P==="zh"?`回合 ${r.turnNumber} • ${l}`:`Turn ${r.turnNumber} • ${l}`;t.fillText(m,34,47)}function Fe(){var t;if(!r)return JSON.stringify({mode:"loading"});const e={mode:r.phase,turn:r.turnNumber,note:r.mapNote,pendingMoves:R,pendingAttacks:v,selection:{source:h,target:b,type:_,units:w,cursor:((t=oe())==null?void 0:t.name)??null},territories:j().map(o=>({name:o.name,owner:o.owner,units:o.hidden?"hidden":o.units,x:o.x,y:o.y,neighbors:o.neighbors})),players:r.players,log:r.lastLog};return JSON.stringify(e)}function ze(e){const t=Le(e),o=a=>{switch(a){case"orders":return n("logOrders");case"combat":return n("logCombat");case"reinforcement":return n("logReinforcements");case"summary":return n("logEndOfTurn");default:return n("logNotes")}};return t.map(a=>`
    <section class="battle-section battle-${a.kind}">
      <h3>${o(a.kind)}</h3>
      <div class="battle-lines">
        ${a.entries.map(s=>`<div class="battle-line">${s}</div>`).join("")}
      </div>
    </section>
  `).join("")}function Je(){ee={},document.querySelectorAll("[data-scroll-key]").forEach(e=>{const t=e.dataset.scrollKey;t&&(ee[t]=e.scrollTop)})}function Ve(){document.querySelectorAll("[data-scroll-key]").forEach(e=>{const t=e.dataset.scrollKey;if(!t)return;const o=ee[t];typeof o=="number"&&(e.scrollTop=o)})}function Ye(e){const t=je(e);return t.length===0?`<div class="log-entry">${n("noTurnChanges")}</div>`:t.map(o=>{const a=o.movementDelta===0?`${n("deltaMove")} 0`:`${n("deltaMove")} ${o.movementDelta>0?"+":""}${o.movementDelta}`,s=o.reinforcementDelta===0?`${n("deltaReinforce")} 0`:`${n("deltaReinforce")} +${o.reinforcementDelta}`,l=o.finalUnits==null?"?":String(o.finalUnits);return`
      <div class="turn-summary-card">
        <strong>${o.territory}</strong>
        <div>${a}</div>
        <div>${s}</div>
        <div>${n("final")} ${l}${o.owner?` • ${o.owner}`:""}</div>
      </div>
    `}).join("")}function Ke(){window.render_game_to_text=Fe,window.advanceTime=()=>{p()}}async function Pe(){document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}function p(){var me;if(Je(),!r){fe.innerHTML=`
      <section class="panel">
        <h1 class="title">RISC</h1>
        <div class="row">
          <span>${n("language")}</span>
          <select id="lang-select">
            <option value="zh" ${P==="zh"?"selected":""}>${n("chinese")}</option>
            <option value="en" ${P==="en"?"selected":""}>${n("english")}</option>
          </select>
        </div>
        <div class="row">
          <button id="create-room">${n("createRoom")}</button>
          <input id="join-room-id" placeholder="${n("roomIdPlaceholder")}" value="${B}" />
          <button class="secondary" id="join-room">${n("join")}</button>
        </div>
        <div class="hint">${X||n("tipJoin")}</div>
      </section>
    `;const i=document.querySelector("#lang-select");i&&(i.onchange=()=>{P=i.value==="en"?"en":"zh",localStorage.setItem("risc_lang",P),p()});const S=document.querySelector("#create-room");S&&(S.onclick=()=>{be().catch(()=>{})});const x=document.querySelector("#join-room-id");x&&(x.oninput=()=>{B=x.value});const z=document.querySelector("#join-room");z&&(z.onclick=()=>{Se(B).catch(()=>{})});return}const e=r,t=new Map(e.players.map(i=>[i.id,i])),o=Math.max(2,Math.min(5,Number.isFinite(e.seatCount)?e.seatCount:e.players.length)),a=Ie.slice(0,o),s=e.players.length<o,l=a[a.length-1]??"GREEN",m=e.phase==="SETUP"&&!te,g=`
    <div class="seat-grid" aria-label="Room seats">
      ${a.map(i=>{const S=t.get(i)??null,x=e.phase==="LOBBY"&&ge()&&S==null&&s&&i===l&&o>2;return`
          <div class="seat ${S?"occupied":"empty"}">
            <div class="seat-swatch" style="background:${ke[i]};"></div>
            <div class="seat-meta">
              <div class="seat-id">${i}</div>
              <div class="seat-name">${S?S.displayName:""}</div>
            </div>
            ${x?`<button class="secondary seat-remove" data-seat-remove="${i}">${n("remove")}</button>`:""}
          </div>
        `}).join("")}
    </div>
  `,u=m?`
      <section class="panel setup compact-panel">
        <h2>${n("initialPlacement")}</h2>
        <p class="hint">${n("placementHint",{reserve:((me=ne())==null?void 0:me.reserveUnits)??0})}</p>
        <div class="setup-grid">
          ${Re().map(i=>`
            <div class="territory-stepper">
              <strong>${i.name}</strong>
              <label class="setup-empty">
                <input type="checkbox" data-setup-abandon="${i.name}" ${N[i.name]?"checked":""} />
                ${n("empty")}
              </label>
              <button class="secondary" data-setup-minus="${i.name}">-</button>
              <span>${k[i.name]??0}</span>
              <button class="secondary" data-setup-plus="${i.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>${n("unitsLeft")}: <strong>${K()}</strong></span>
          <button id="start-btn">${n("lockPlacement")}</button>
        </div>
      </section>`:"";fe.innerHTML=`
    <div class="game-layout">
      <section class="panel topbar-panel">
        <div class="topbar">
          <div>
            <h1 class="title">RISC</h1>
            <p class="subtitle">${n("subtitle")}</p>
          </div>
          <div class="topbar-side">
            <div class="status-pill">${r.phase==="GAME_OVER"?n("winnerWins",{winner:r.winner??""}):$e(r.phase)}</div>
            <label class="inline-field">
              <span>${n("language")}</span>
              <select id="lang-select">
                <option value="zh" ${P==="zh"?"selected":""}>${n("chinese")}</option>
                <option value="en" ${P==="en"?"selected":""}>${n("english")}</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <aside class="layout-column left-column" data-scroll-key="left-column">
        <section class="panel controls compact-panel">
          <h2>${n("multiplayer")}</h2>
          ${d&&y?`
              <div class="compact-meta">
                <div>${n("room")}: <strong>${d}</strong></div>
                <div>${n("you")}: <strong>${E()}</strong></div>
              </div>
              <div class="buttons">
                <button class="secondary" id="leave-room">${n("leave")}</button>
                ${r.phase==="LOBBY"&&ge()?`<button class="secondary" id="new-seat" ${o>=5?"disabled":""}>${n("newSeat")}</button>`:""}
                ${r.phase==="LOBBY"&&E()==="GREEN"?`<button id="start-game" ${r.players.length<2||r.players.length!==o?"disabled":""}>${n("startGame")}</button>`:""}
              </div>
              ${r.phase==="LOBBY"&&E()==="GREEN"?`<div class="hint">${n("startHint",{seats:o,players:r.players.length})}</div>`:""}
              ${g}
            `:`
              <div class="row">
                <button id="create-room">${n("createRoom")}</button>
                <input id="join-room-id" placeholder="${n("roomIdPlaceholder")}" value="${B}" />
                <button class="secondary" id="join-room">${n("join")}</button>
              </div>
              <div class="hint">${n("tipJoin")}</div>
            `}
          ${r.waitingOnPlayers.length>0?`<div class="hint">${n("waitingOn",{waiting:r.waitingOnPlayers.join(", ")})}</div>`:""}
        </section>

        ${u}

        <section class="panel controls compact-panel">
          <div class="section-head">
            <h2>${n("orders")}</h2>
            <button class="secondary" id="fullscreen-btn">${n("fullscreen")}</button>
          </div>
          <p class="hint">${n("ordersHint")}</p>
          <div class="buttons">
            <button class="${_==="MOVE"?"":"secondary"}" data-mode="MOVE">${n("move")}</button>
            <button class="${_==="ATTACK"?"":"secondary"}" data-mode="ATTACK">${n("attack")}</button>
          </div>
          <div class="field-grid">
            <div class="selection-card">
              <strong>${n("currentSelection")}</strong>
              <span>${n("source")}: ${h??n("none")}</span>
              <span>${n("target")}: ${b??n("none")}</span>
            </div>
            <label class="units-field">${n("units")}<input id="units-input" type="number" min="1" value="${w}" /></label>
          </div>
          <div class="buttons">
            <button id="queue-order" ${r.phase!=="ORDERS"?"disabled":""}>${n("queueOrder")}</button>
            <button class="secondary" id="clear-orders">${n("clearOrders")}</button>
            <button id="commit-turn" ${r.phase!=="ORDERS"?"disabled":""}>${n("commitTurn")}</button>
            <button class="secondary" id="reset-game">${n("newGame")}</button>
          </div>
          <div class="hint status-message">${X||"&nbsp;"}</div>
        </section>
      </aside>

      <main class="layout-column center-column" data-scroll-key="center-column">
        <section class="panel board-shell">
          <div class="board-meta">
            <div>
              <strong>${r.phase==="GAME_OVER"?n("winnerWins",{winner:r.winner??""}):n("battleMap")}</strong>
              <div class="hint">${r.mapNote}</div>
            </div>
            <div class="hint">${n("pendingActions",{count:R.length+v.length})}</div>
          </div>
          <canvas id="game-canvas" aria-label="RISC game board"></canvas>
        </section>

        <section class="panel compact-panel">
          <div class="section-head">
            <h2>${n("queuedAttacks")}</h2>
            <div class="hint">${n("movesApplyHint")}</div>
          </div>
          <div class="log queued-log" data-scroll-key="queued-log">
            ${v.length===0?`<div class="log-entry">${n("noQueuedAttacks")}</div>`:v.map((i,S)=>`
                <div class="log-entry log-entry-inline">
                  <span>ATTACK ${i.units} from ${i.source} to ${i.target}</span>
                  <button class="secondary" data-attack-remove="${S}">${n("remove")}</button>
                </div>`).join("")}
          </div>
        </section>
      </main>

      <aside class="layout-column right-column" data-scroll-key="right-column">
        <section class="panel players compact-panel">
          <h2>${n("factions")}</h2>
          ${r.players.map(i=>`
            <article>
              <strong>${i.displayName}</strong>
              <div>${n("territoriesLabel")}: ${i.territories}</div>
              <div>${n("totalUnitsLabel")}: ${i.totalUnits}</div>
              <div>${i.defeated?n("defeated"):i.localPlayer?n("youLabel"):n("opponent")}</div>
            </article>`).join("")}
        </section>
        <section class="panel compact-panel">
          <h2>${n("turnChanges")}</h2>
          <div class="log turn-summary-log side-log" data-scroll-key="turn-summary-log">
            ${Ye(r.lastLog)}
          </div>
        </section>
        <section class="panel compact-panel">
          <h2>${n("resolutionLog")}</h2>
          <div class="log battle-log side-log" data-scroll-key="battle-log">
            ${ze(r.lastLog)}
          </div>
        </section>
      </aside>
    </div>
  `,Ve();const f=document.querySelector("#lang-select");f&&(f.onchange=()=>{P=f.value==="en"?"en":"zh",localStorage.setItem("risc_lang",P),p()});const $=document.querySelector("#game-canvas");$&&(He($),$.onclick=i=>Ge(i,$)),document.querySelectorAll("[data-mode]").forEach(i=>{i.onclick=()=>{_=i.dataset.mode,p()}}),document.querySelectorAll("[data-setup-plus]").forEach(i=>{i.onclick=()=>ve(i.dataset.setupPlus??"",1)}),document.querySelectorAll("[data-setup-minus]").forEach(i=>{i.onclick=()=>ve(i.dataset.setupMinus??"",-1)}),document.querySelectorAll("[data-setup-abandon]").forEach(i=>{i.onchange=()=>{const S=i.dataset.setupAbandon??"";if(!S)return;const x=!!i.checked;N={...N,[S]:x},x&&(k={...k,[S]:0}),p()}});const T=document.querySelector("#start-btn");T&&(T.onclick=()=>{Ee()});const L=document.querySelector("#units-input");L&&(L.oninput=()=>{w=Math.max(1,Number(L.value)||1)});const A=document.querySelector("#queue-order");A&&(A.onclick=Te);const F=document.querySelector("#commit-turn");F&&(F.onclick=()=>{Ae()});const I=document.querySelector("#clear-orders");I&&(I.onclick=()=>{R=[],v=[],C(),w=1,c(n("clearedPlanned"))}),document.querySelectorAll("[data-attack-remove]").forEach(i=>{i.onclick=()=>{const S=Number(i.dataset.attackRemove??"-1");Number.isNaN(S)||S<0||(v=v.filter((x,z)=>z!==S),c(n("removedAttack")),p())}});const U=document.querySelector("#reset-game");U&&(U.onclick=()=>{_e()});const se=document.querySelector("#fullscreen-btn");se&&(se.onclick=()=>{Pe()});const ie=document.querySelector("#create-room");ie&&(ie.onclick=()=>{be().catch(()=>{})});const Z=document.querySelector("#join-room-id");Z&&(Z.oninput=()=>{B=Z.value});const le=document.querySelector("#join-room");le&&(le.onclick=()=>{Se(B).catch(()=>{})});const ce=document.querySelector("#leave-room");ce&&(ce.onclick=()=>{Ze()});const ue=document.querySelector("#new-seat");ue&&(ue.onclick=()=>{Qe().catch(()=>{})}),document.querySelectorAll("[data-seat-remove]").forEach(i=>{i.onclick=()=>{et().catch(()=>{})}});const de=document.querySelector("#start-game");de&&(de.onclick=()=>{Xe().catch(()=>{})})}window.addEventListener("keydown",e=>{if(r){if(e.key==="ArrowRight"){D+=1,p();return}if(e.key==="ArrowLeft"){D-=1,p();return}if(e.key==="ArrowDown"){D+=3,p();return}if(e.key==="ArrowUp"){D-=3,p();return}if(e.key.toLowerCase()==="f"&&Pe(),e.key.toLowerCase()==="a"&&r.phase==="ORDERS"&&(_="ATTACK",p()),e.key.toLowerCase()==="b"&&r.phase==="ORDERS"&&(_="MOVE",p()),e.key==="Enter"){if(r.phase==="SETUP"){Ee();return}if(r.phase==="ORDERS"&&h&&b){Te();return}r.phase==="ORDERS"&&R.length+v.length>0&&Ae()}if(e.key===" "||e.code==="Space"){if(r.phase!=="ORDERS")return;e.preventDefault();const t=oe();if(!t)return;if(!h){if(t.owner!==E()){c(n("chooseOwnSource"));return}if(re(t.name)<=0){c(n("sourceNoUnits"));return}h=t.name,b=null,c(n("sourceSelectedCursor",{name:t.name})),p();return}if(t.name===h){h=null,b=null,c(n("selectionCleared")),p();return}b=t.name,c(n("targetSelectedEnter",{name:t.name})),p();return}e.key==="Escape"&&document.fullscreenElement&&document.exitFullscreen()}});Ke();Be();async function be(){try{const e=await O("/api/rooms",{method:"POST"});d=e.roomId,y=e.token,localStorage.setItem("risc_room_id",d),sessionStorage.setItem("risc_room_token",y),r=e.game,W(),C(),ae(),c(n("createdRoom",{roomId:d}))}catch(e){throw c(e.message),e}}async function Se(e){try{const t=(e??"").trim().toUpperCase();if(!t){c(n("enterRoomId"));return}const o=await O(`/api/rooms/${t}/join`,{method:"POST"});d=o.roomId,y=o.token,localStorage.setItem("risc_room_id",d),sessionStorage.setItem("risc_room_token",y),r=o.game,W(),C(),ae(),c(n("joinedRoom",{roomId:d,playerId:o.playerId}))}catch(t){throw c(t.message),t}}function Ze(){d=null,y=null,localStorage.removeItem("risc_room_id"),sessionStorage.removeItem("risc_room_token"),tt(),R=[],v=[],M=[],q=null,k={},N={},c(n("leftRoom")),r=null,p()}async function Qe(){if(!d){c(n("noRoomToJoin"));return}try{r=await O(`/api/rooms/${d}/seats/add`,{method:"POST"}),c(n("addedSeat")),p()}catch(e){throw c(e.message),e}}async function Xe(){if(!d||!y){c(n("startNeedRoom"));return}try{r=await O(`/api/rooms/${d}/start`,{method:"POST"}),R=[],v=[],M=[],q=null,h=null,b=null,w=1,W(),C(),c(r.phase==="SETUP"?n("gameStartedSetup"):n("gameStarted"))}catch(e){throw c(e.message),e}}async function et(){if(!d||!y){c(n("startNeedRoom"));return}try{r=await O(`/api/rooms/${d}/seats/remove`,{method:"POST"}),c(n("removedSeat")),p()}catch(e){throw c(e.message),e}}function ae(){G==null&&(G=window.setInterval(()=>{nt()},1200))}function tt(){G!=null&&(window.clearInterval(G),G=null,V=!1)}async function nt(){if(!(!d||!y||V)){V=!0;try{r=await O(`/api/rooms/${d}`),W(),C(),p()}catch{}finally{V=!1}}}d&&y&&ae();
