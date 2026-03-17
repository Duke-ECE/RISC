(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function o(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=o(i);fetch(i.href,r)}})();function ee(t){return t.startsWith("Committed move orders")||t.startsWith("Committed attack orders")||t.startsWith(" - Green")||t.startsWith(" - Blue")||t.startsWith(" - Red")?"orders":t.startsWith("Battle queue")||t.startsWith("Combat starts")||t.startsWith("  Round ")||t.startsWith("Combat result")?"combat":t.startsWith("Reinforcement:")?"reinforcement":t.startsWith(" - ")&&t.includes(" holds ")&&t.includes(" units.")||t.startsWith("Turn ")&&t.endsWith(" final map state:")?"summary":"misc"}function te(t){switch(t){case"orders":return"Orders";case"combat":return"Combat";case"reinforcement":return"Reinforcements";case"summary":return"End Of Turn";default:return"Notes"}}function oe(t){const e=[];for(const o of t){const s=ee(o),i=e.at(-1);if(!i||i.kind!==s){e.push({title:te(s),kind:s,entries:[o]});continue}i.entries.push(o)}return e}const ne=/([A-Za-z]+) MOVE (\d+) from ([A-Za-z]+) to ([A-Za-z]+)/,re=/Reinforcement: ([A-Za-z]+) owned by ([A-Za-z]+) gains 1 unit \((\d+) -> (\d+)\)\./,ie=/- ([A-Za-z]+): ([A-Za-z]+) holds (\d+) units\./;function se(t){const e=new Map;for(const o of t){const s=o.match(ne);if(s){const c=Number(s[2]),f=A(e,s[3]),h=A(e,s[4]);f.movementDelta-=c,h.movementDelta+=c;continue}const i=o.match(re);if(i){const c=A(e,i[1]);c.owner=i[2],c.reinforcementDelta+=1,c.finalUnits=Number(i[4]);continue}const r=o.trim().match(ie);if(r){const c=A(e,r[1]);c.owner=r[2],c.finalUnits=Number(r[3])}}return Array.from(e.values()).filter(o=>o.movementDelta!==0||o.reinforcementDelta!==0).sort((o,s)=>o.territory.localeCompare(s.territory))}function A(t,e){const o=t.get(e);if(o)return o;const s={territory:e,owner:null,movementDelta:0,reinforcementDelta:0,finalUnits:null};return t.set(e,s),s}const H=document.querySelector("#app");if(!H)throw new Error("Missing app root");const V=H;let n=null,b={},y=[],m=null,p=null,S="MOVE",v=1,K="",$=0,u=localStorage.getItem("risc_room_id"),g=localStorage.getItem("risc_room_token"),j="",R=null,x=!1;const k={mode:"loading",boardWidth:920,boardHeight:620},ae={GREEN:"#63885f",BLUE:"#7ea0be",RED:"#bb6553"};async function w(t,e){const o={"Content-Type":"application/json"};g&&(o["X-Player-Token"]=g);const s=await fetch(`http://127.0.0.1:8080${t}`,{headers:{...o},...e}),i=await s.json();if(!s.ok||i&&typeof i.error=="string")throw new Error(i.error??"Request failed");return i}function L(){return n==null?void 0:n.players.find(t=>t.localPlayer)}function T(){var t;return((t=L())==null?void 0:t.id)??"GREEN"}function C(t){return n==null?void 0:n.territories.find(e=>e.name===t)}function N(){if(!(!n||n.territories.length===0))return n.territories[($%n.territories.length+n.territories.length)%n.territories.length]}function M(){const t=T();return(n==null?void 0:n.territories.filter(e=>e.owner===t))??[]}function le(t,e){return t.neighbors.includes(e.name)}function ce(t){const e=C(t);if(!e)return 1;const o=y.filter(s=>s.source===t).reduce((s,i)=>s+i.units,0);return Math.max(1,e.units-o-1)}function I(){const t=L();return t?t.reserveUnits-Object.values(b).reduce((e,o)=>e+o,0):0}function l(t){K=t,d()}async function Z(){u&&g?n=await w(`/api/rooms/${u}`):n=await w("/api/game"),P(),k.mode="ready",d()}function P(){if(!n||n.phase!=="SETUP"){b={};return}const t={};for(const e of M())t[e.name]=b[e.name]??0;b=t}async function ue(){u&&g?n=await w(`/api/rooms/${u}/reset`,{method:"POST"}):n=await w("/api/game/reset",{method:"POST"}),y=[],m=null,p=null,v=1,l(""),P(),d()}async function J(){try{if(I()>0){const e=M(),o={...b};let s=I(),i=0;for(;s>0&&e.length>0;){const r=e[i%e.length];o[r.name]=(o[r.name]??0)+1,s-=1,i+=1}b=o}const t=JSON.stringify({allocations:b});u&&g?n=await w(`/api/rooms/${u}/setup`,{method:"POST",body:t}):n=await w("/api/game/setup",{method:"POST",body:t}),y=[],m=null,p=null,v=1,u&&g&&n.phase==="SETUP"&&n.waitingOnPlayers.length>0?l(`Setup submitted. Waiting on: ${n.waitingOnPlayers.join(", ")}.`):l("Setup locked in. Opponents have revealed their placements.")}catch(t){l(t.message)}}function Y(){if(!m||!p){l("Choose a source and a target territory first.");return}const t=C(m),e=C(p);if(!t||!e)return;if(S==="MOVE"&&e.owner!==T()){l("Move orders can only target your own territories.");return}if(S==="ATTACK"&&e.owner===T()){l("Attack orders must target enemy territories.");return}if(S==="ATTACK"&&!le(t,e)){l("Attack orders must target adjacent territories.");return}const o=ce(m);if(v<1||v>o){l("That territory does not have enough spare units.");return}const s=m,i=p;y=[...y,{type:S,source:s,target:i,units:v}],m=null,p=null,v=1,l(`Queued ${S.toLowerCase()} from ${s} to ${i}.`),d()}async function X(){try{const t=JSON.stringify({orders:y.map(e=>({type:e.type,source:e.source,target:e.target,units:e.units}))});u&&g?n=await w(`/api/rooms/${u}/turn`,{method:"POST",body:t}):n=await w("/api/game/turn",{method:"POST",body:t}),y=[],v=1,m=null,p=null,n.phase==="GAME_OVER"?l("The war is over."):u&&g&&n.waitingOnPlayers.length>0?l(`Orders submitted. Waiting on: ${n.waitingOnPlayers.join(", ")}.`):l("Turn resolved. Plan your next move.")}catch(t){l(t.message)}}function z(t,e){const o=b[t]??0,s=Math.max(0,o+e),i=I()+o;s>i||(b={...b,[t]:s},d())}function de(t,e){if(!n||n.phase==="GAME_OVER")return;const o=e.getBoundingClientRect(),s=k.boardWidth/o.width,i=k.boardHeight/o.height,r=(t.clientX-o.left)*s,c=(t.clientY-o.top)*i,f=n.territories.find(h=>{const O=h.x-r,E=h.y-c;return Math.sqrt(O*O+E*E)<48});if(f){if($=n.territories.findIndex(h=>h.name===f.name),!m){if(f.owner!==T()){l("Choose one of your territories as the source.");return}m=f.name,p=null,v=1,l(`Source selected: ${f.name}. Now choose a target.`),d();return}if(f.name===m){m=null,p=null,l("Source cleared."),d();return}p=f.name,l(`Target selected: ${f.name}.`),d()}}function me(t){var i;const e=t.getContext("2d");if(!e||!n)return;t.width=k.boardWidth,t.height=k.boardHeight,e.clearRect(0,0,t.width,t.height);const o=e.createLinearGradient(0,0,0,t.height);o.addColorStop(0,"#a7cde0"),o.addColorStop(.24,"#dbead8"),o.addColorStop(1,"#cfaf76"),e.fillStyle=o,e.fillRect(0,0,t.width,t.height),e.fillStyle="rgba(255,255,255,0.18)";for(let r=0;r<14;r+=1)e.beginPath(),e.arc(80+r*60,60+r%3*26,24+r%4*8,0,Math.PI*2),e.fill();e.lineWidth=5,e.strokeStyle="rgba(73, 58, 38, 0.28)";const s=new Set;for(const r of n.territories)for(const c of r.neighbors){const f=[r.name,c].sort().join(":");if(s.has(f))continue;s.add(f);const h=C(c);h&&(e.beginPath(),e.moveTo(r.x,r.y),e.lineTo(h.x,h.y),e.stroke())}for(const r of n.territories){const c=ae[r.owner]??"#666",f=r.name===m||r.name===p,h=r.name===((i=N())==null?void 0:i.name);e.beginPath(),e.fillStyle=c,e.strokeStyle=f?"#fff3d1":h?"#1d2b2a":"rgba(33, 20, 8, 0.3)",e.lineWidth=f?8:h?6:4,e.arc(r.x,r.y,43,0,Math.PI*2),e.fill(),e.stroke(),e.fillStyle="#fff8ec",e.textAlign="center",e.font="bold 19px Georgia",e.fillText(r.name,r.x,r.y-8),e.font="bold 24px Georgia",e.fillText(r.hidden?"?":String(r.units),r.x,r.y+24)}e.fillStyle="rgba(33, 24, 16, 0.68)",e.fillRect(18,18,320,44),e.fillStyle="#fff8ec",e.textAlign="left",e.font="bold 22px Georgia",e.fillText(`Turn ${n.turnNumber} • ${n.phase}`,34,47)}function fe(){var e;if(!n)return JSON.stringify({mode:"loading"});const t={mode:n.phase,turn:n.turnNumber,note:n.mapNote,pendingOrders:y,selection:{source:m,target:p,type:S,units:v,cursor:((e=N())==null?void 0:e.name)??null},territories:n.territories.map(o=>({name:o.name,owner:o.owner,units:o.hidden?"hidden":o.units,x:o.x,y:o.y,neighbors:o.neighbors})),players:n.players,log:n.lastLog};return JSON.stringify(t)}function pe(t){return oe(t).map(o=>`
    <section class="battle-section battle-${o.kind}">
      <h3>${o.title}</h3>
      <div class="battle-lines">
        ${o.entries.map(s=>`<div class="battle-line">${s}</div>`).join("")}
      </div>
    </section>
  `).join("")}function he(t){const e=se(t);return e.length===0?'<div class="log-entry">No territory changes resolved yet.</div>':e.map(o=>{const s=o.movementDelta===0?"move 0":`move ${o.movementDelta>0?"+":""}${o.movementDelta}`,i=o.reinforcementDelta===0?"reinforce 0":`reinforce +${o.reinforcementDelta}`,r=o.finalUnits==null?"?":String(o.finalUnits);return`
      <div class="turn-summary-card">
        <strong>${o.territory}</strong>
        <div>${s}</div>
        <div>${i}</div>
        <div>final ${r}${o.owner?` • ${o.owner}`:""}</div>
      </div>
    `}).join("")}function ge(){window.render_game_to_text=fe,window.advanceTime=()=>{d()}}async function Q(){document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}function d(){var F;if(!n){V.innerHTML='<section class="panel"><h1 class="title">RISC</h1><p>Loading battlefield...</p></section>';return}const t=n.phase==="SETUP"?`
      <section class="panel setup">
        <h2>Initial Placement</h2>
        <p class="hint">Distribute your ${((F=L())==null?void 0:F.reserveUnits)??0} reserve units. Other players stay hidden until setup is locked in.</p>
        <div class="setup-grid">
          ${M().map(a=>`
            <div class="territory-stepper">
              <strong>${a.name}</strong>
              <button class="secondary" data-setup-minus="${a.name}">-</button>
              <span>${b[a.name]??0}</span>
              <button class="secondary" data-setup-plus="${a.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>Units left: <strong>${I()}</strong></span>
          <button id="start-btn">Lock Placement</button>
        </div>
      </section>`:"",e=M().map(a=>`<option value="${a.name}" ${m===a.name?"selected":""}>${a.name}</option>`).join(""),o=(n.territories??[]).map(a=>`<option value="${a.name}" ${p===a.name?"selected":""}>${a.name}</option>`).join("");V.innerHTML=`
    <section class="panel">
      <h1 class="title">RISC</h1>
      <p class="subtitle">Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.</p>
      <section class="controls">
        <h2>Multiplayer</h2>
        ${u&&g?`
            <div class="row">
              <span>Room: <strong>${u}</strong></span>
              <span>You: <strong>${T()}</strong></span>
              <button class="secondary" id="leave-room">Leave</button>
            </div>
          `:`
            <div class="row">
              <button id="create-room">Create room</button>
              <input id="join-room-id" placeholder="Room ID (e.g. ABC123)" value="${j}" />
              <button class="secondary" id="join-room">Join</button>
            </div>
            <div class="hint">Open a second window to join the same room and play as another color.</div>
          `}
        ${n.waitingOnPlayers.length>0?`<div class="hint">Waiting on: ${n.waitingOnPlayers.join(", ")}</div>`:""}
      </section>
      ${t}
      <section class="controls">
        <h2>Orders</h2>
        <p class="hint">Click territories on the map or use the selectors below. Keep one unit behind in every source territory.</p>
        <div class="buttons">
          <button class="${S==="MOVE"?"":"secondary"}" data-mode="MOVE">Move</button>
          <button class="${S==="ATTACK"?"":"secondary"}" data-mode="ATTACK">Attack</button>
          <button class="secondary" id="fullscreen-btn">Fullscreen (F)</button>
        </div>
        <div class="row">
          <label>Source<select id="source-select"><option value="">Select</option>${e}</select></label>
          <label>Target<select id="target-select"><option value="">Select</option>${o}</select></label>
        </div>
        <div class="row">
          <label>Units<input id="units-input" type="number" min="1" value="${v}" /></label>
          <button id="queue-order" ${n.phase!=="ORDERS"?"disabled":""}>Queue Order</button>
        </div>
        <div class="buttons">
          <button class="secondary" id="clear-orders">Clear Planned Orders</button>
          <button id="commit-turn" ${n.phase!=="ORDERS"?"disabled":""}>Commit Turn</button>
          <button class="secondary" id="reset-game">New Game</button>
        </div>
        <div class="hint">${K||"&nbsp;"}</div>
      </section>
      <section class="players">
        <h2>Factions</h2>
        ${n.players.map(a=>`
          <article>
            <strong>${a.displayName}</strong>
            <div>Territories: ${a.territories}</div>
            <div>Total units: ${a.totalUnits}</div>
            <div>${a.defeated?"Defeated":a.localPlayer?"You":u?"Opponent":"AI opponent"}</div>
          </article>`).join("")}
      </section>
      <section>
        <h2>Planned Orders</h2>
        <div class="log">
          ${y.length===0?'<div class="log-entry">No queued orders yet.</div>':y.map(a=>`<div class="log-entry">${a.type} ${a.units} from ${a.source} to ${a.target}</div>`).join("")}
        </div>
      </section>
      <section>
        <h2>Turn Changes</h2>
        <div class="log turn-summary-log">
          ${he(n.lastLog)}
        </div>
      </section>
      <section>
        <h2>Resolution Log</h2>
        <div class="log battle-log">
          ${pe(n.lastLog)}
        </div>
      </section>
    </section>
    <section class="panel board-shell">
      <div class="board-meta">
        <div>
          <strong>${n.phase==="GAME_OVER"?`${n.winner} wins`:"Battle Map"}</strong>
          <div class="hint">${n.mapNote}</div>
        </div>
        <div class="hint">Pending orders: ${y.length}</div>
      </div>
      <canvas id="game-canvas" aria-label="RISC game board"></canvas>
    </section>
  `;const s=document.querySelector("#game-canvas");s&&(me(s),s.onclick=a=>de(a,s)),document.querySelectorAll("[data-mode]").forEach(a=>{a.onclick=()=>{S=a.dataset.mode,d()}}),document.querySelectorAll("[data-setup-plus]").forEach(a=>{a.onclick=()=>z(a.dataset.setupPlus??"",1)}),document.querySelectorAll("[data-setup-minus]").forEach(a=>{a.onclick=()=>z(a.dataset.setupMinus??"",-1)});const i=document.querySelector("#start-btn");i&&(i.onclick=()=>{J()});const r=document.querySelector("#source-select");r&&(r.onchange=()=>{m=r.value||null,d()});const c=document.querySelector("#target-select");c&&(c.onchange=()=>{p=c.value||null,d()});const f=document.querySelector("#units-input");f&&(f.oninput=()=>{v=Math.max(1,Number(f.value)||1)});const h=document.querySelector("#queue-order");h&&(h.onclick=Y);const O=document.querySelector("#commit-turn");O&&(O.onclick=()=>{X()});const E=document.querySelector("#clear-orders");E&&(E.onclick=()=>{y=[],v=1,l("Cleared planned orders.")});const _=document.querySelector("#reset-game");_&&(_.onclick=()=>{ue()});const W=document.querySelector("#fullscreen-btn");W&&(W.onclick=()=>{Q()});const U=document.querySelector("#create-room");U&&(U.onclick=()=>{ye()});const q=document.querySelector("#join-room-id");q&&(q.oninput=()=>{j=q.value});const B=document.querySelector("#join-room");B&&(B.onclick=()=>{ve(j)});const G=document.querySelector("#leave-room");G&&(G.onclick=()=>{be()})}window.addEventListener("keydown",t=>{if(n){if(t.key==="ArrowRight"){$+=1,d();return}if(t.key==="ArrowLeft"){$-=1,d();return}if(t.key==="ArrowDown"){$+=3,d();return}if(t.key==="ArrowUp"){$-=3,d();return}if(t.key.toLowerCase()==="f"&&Q(),t.key.toLowerCase()==="a"&&n.phase==="ORDERS"&&(S="ATTACK",d()),t.key.toLowerCase()==="b"&&n.phase==="ORDERS"&&(S="MOVE",d()),t.key==="Enter"){if(n.phase==="SETUP"){J();return}if(n.phase==="ORDERS"&&m&&p){Y();return}n.phase==="ORDERS"&&y.length>0&&X()}if(t.key===" "||t.code==="Space"){if(n.phase!=="ORDERS")return;t.preventDefault();const e=N();if(!e)return;if(!m){if(e.owner!==T()){l("Choose one of your territories as the source.");return}m=e.name,p=null,l(`Source selected: ${e.name}. Move the cursor and press Space again for the target.`),d();return}if(e.name===m){m=null,p=null,l("Selection cleared."),d();return}p=e.name,l(`Target selected: ${e.name}. Press Enter to queue the order.`),d();return}t.key==="Escape"&&document.fullscreenElement&&document.exitFullscreen()}});ge();Z();async function ye(){try{const t=await w("/api/rooms",{method:"POST"});u=t.roomId,g=t.token,localStorage.setItem("risc_room_id",u),localStorage.setItem("risc_room_token",g),n=t.game,P(),D(),l(`Created room ${u}.`)}catch(t){l(t.message)}}async function ve(t){try{const e=(t??"").trim().toUpperCase();if(!e){l("Enter a room ID to join.");return}const o=await w(`/api/rooms/${e}/join`,{method:"POST"});u=o.roomId,g=o.token,localStorage.setItem("risc_room_id",u),localStorage.setItem("risc_room_token",g),n=o.game,P(),D(),l(`Joined room ${u} as ${o.playerId}.`)}catch(e){l(e.message)}}function be(){u=null,g=null,localStorage.removeItem("risc_room_id"),localStorage.removeItem("risc_room_token"),Se(),y=[],b={},l("Left room. Back to single-player."),Z()}function D(){R==null&&(R=window.setInterval(()=>{we()},1200))}function Se(){R!=null&&(window.clearInterval(R),R=null,x=!1)}async function we(){if(!(!u||!g||x)){x=!0;try{n=await w(`/api/rooms/${u}`),P(),d()}catch{}finally{x=!1}}}u&&g&&D();
