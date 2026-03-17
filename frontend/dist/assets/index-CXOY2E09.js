(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function n(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(s){if(s.ep)return;s.ep=!0;const o=n(s);fetch(s.href,o)}})();function I(e){return e.startsWith("Committed move orders")||e.startsWith("Committed attack orders")||e.startsWith(" - Green")||e.startsWith(" - Blue")||e.startsWith(" - Red")?"orders":e.startsWith("Battle queue")||e.startsWith("Combat starts")||e.startsWith("  Round ")||e.startsWith("Combat result")?"combat":e.startsWith("Reinforcement:")?"reinforcement":e.startsWith(" - ")&&e.includes(" holds ")&&e.includes(" units.")||e.startsWith("Turn ")&&e.endsWith(" final map state:")?"summary":"misc"}function F(e){switch(e){case"orders":return"Orders";case"combat":return"Combat";case"reinforcement":return"Reinforcements";case"summary":return"End Of Turn";default:return"Notes"}}function V(e){const t=[];for(const n of e){const i=I(n),s=t.at(-1);if(!s||s.kind!==i){t.push({title:F(i),kind:i,entries:[n]});continue}s.entries.push(n)}return t}const _=/([A-Za-z]+) MOVE (\d+) from ([A-Za-z]+) to ([A-Za-z]+)/,z=/Reinforcement: ([A-Za-z]+) owned by ([A-Za-z]+) gains 1 unit \((\d+) -> (\d+)\)\./,H=/- ([A-Za-z]+): ([A-Za-z]+) holds (\d+) units\./;function K(e){const t=new Map;for(const n of e){const i=n.match(_);if(i){const c=Number(i[2]),d=E(t,i[3]),h=E(t,i[4]);d.movementDelta-=c,h.movementDelta+=c;continue}const s=n.match(z);if(s){const c=E(t,s[1]);c.owner=s[2],c.reinforcementDelta+=1,c.finalUnits=Number(s[4]);continue}const o=n.trim().match(H);if(o){const c=E(t,o[1]);c.owner=o[2],c.finalUnits=Number(o[3])}}return Array.from(t.values()).filter(n=>n.movementDelta!==0||n.reinforcementDelta!==0).sort((n,i)=>n.territory.localeCompare(i.territory))}function E(e,t){const n=e.get(t);if(n)return n;const i={territory:t,owner:null,movementDelta:0,reinforcementDelta:0,finalUnits:null};return e.set(t,i),i}const q=document.querySelector("#app");if(!q)throw new Error("Missing app root");const N=q;let r=null,b={},p=[],u=null,m=null,y="MOVE",g=1,L="",v=0;const $={mode:"loading",boardWidth:920,boardHeight:620},Z={GREEN:"#63885f",BLUE:"#7ea0be",RED:"#bb6553"};async function O(e,t){const n=await fetch(`http://127.0.0.1:8080${e}`,{headers:{"Content-Type":"application/json"},...t}),i=await n.json();if(!n.ok||i&&typeof i.error=="string")throw new Error(i.error??"Request failed");return i}function D(){return r==null?void 0:r.players.find(e=>e.localPlayer)}function T(e){return r==null?void 0:r.territories.find(t=>t.name===e)}function x(){if(!(!r||r.territories.length===0))return r.territories[(v%r.territories.length+r.territories.length)%r.territories.length]}function R(){return(r==null?void 0:r.territories.filter(e=>e.owner==="GREEN"))??[]}function J(e,t){return e.neighbors.includes(t.name)}function Y(e){const t=T(e);if(!t)return 1;const n=p.filter(i=>i.source===e).reduce((i,s)=>i+s.units,0);return Math.max(1,t.units-n-1)}function A(){const e=D();return e?e.reserveUnits-Object.values(b).reduce((t,n)=>t+n,0):0}function f(e){L=e,l()}async function Q(){r=await O("/api/game"),U(),$.mode="ready",l()}function U(){if(!r||r.phase!=="SETUP"){b={};return}const e={};for(const t of R())e[t.name]=b[t.name]??0;b=e}async function X(){r=await O("/api/game/reset",{method:"POST"}),p=[],u=null,m=null,g=1,f(""),U(),l()}async function W(){try{if(A()>0){const e=R(),t={...b};let n=A(),i=0;for(;n>0&&e.length>0;){const s=e[i%e.length];t[s.name]=(t[s.name]??0)+1,n-=1,i+=1}b=t}r=await O("/api/game/setup",{method:"POST",body:JSON.stringify({allocations:b})}),p=[],u=null,m=null,g=1,f("Setup locked in. Blue and Red have revealed their placements.")}catch(e){f(e.message)}}function G(){if(!u||!m){f("Choose a source and a target territory first.");return}const e=T(u),t=T(m);if(!e||!t)return;if(y==="MOVE"&&t.owner!=="GREEN"){f("Move orders can only target your own territories.");return}if(y==="ATTACK"&&t.owner==="GREEN"){f("Attack orders must target enemy territories.");return}if(y==="ATTACK"&&!J(e,t)){f("Attack orders must target adjacent territories.");return}const n=Y(u);if(g<1||g>n){f("That territory does not have enough spare units.");return}const i=u,s=m;p=[...p,{type:y,source:i,target:s,units:g}],u=null,m=null,g=1,f(`Queued ${y.toLowerCase()} from ${i} to ${s}.`),l()}async function j(){try{r=await O("/api/game/turn",{method:"POST",body:JSON.stringify({orders:p.map(e=>({type:e.type,source:e.source,target:e.target,units:e.units}))})}),p=[],g=1,u=null,m=null,f(r.phase==="GAME_OVER"?"The war is over.":"Turn resolved. Plan your next move.")}catch(e){f(e.message)}}function P(e,t){const n=b[e]??0,i=Math.max(0,n+t),s=A()+n;i>s||(b={...b,[e]:i},l())}function ee(e,t){if(!r||r.phase==="GAME_OVER")return;const n=t.getBoundingClientRect(),i=$.boardWidth/n.width,s=$.boardHeight/n.height,o=(e.clientX-n.left)*i,c=(e.clientY-n.top)*s,d=r.territories.find(h=>{const S=h.x-o,w=h.y-c;return Math.sqrt(S*S+w*w)<48});if(d){if(v=r.territories.findIndex(h=>h.name===d.name),!u){if(d.owner!=="GREEN"){f("Choose one of your territories as the source.");return}u=d.name,m=null,g=1,f(`Source selected: ${d.name}. Now choose a target.`),l();return}if(d.name===u){u=null,m=null,f("Source cleared."),l();return}m=d.name,f(`Target selected: ${d.name}.`),l()}}function te(e){var s;const t=e.getContext("2d");if(!t||!r)return;e.width=$.boardWidth,e.height=$.boardHeight,t.clearRect(0,0,e.width,e.height);const n=t.createLinearGradient(0,0,0,e.height);n.addColorStop(0,"#a7cde0"),n.addColorStop(.24,"#dbead8"),n.addColorStop(1,"#cfaf76"),t.fillStyle=n,t.fillRect(0,0,e.width,e.height),t.fillStyle="rgba(255,255,255,0.18)";for(let o=0;o<14;o+=1)t.beginPath(),t.arc(80+o*60,60+o%3*26,24+o%4*8,0,Math.PI*2),t.fill();t.lineWidth=5,t.strokeStyle="rgba(73, 58, 38, 0.28)";const i=new Set;for(const o of r.territories)for(const c of o.neighbors){const d=[o.name,c].sort().join(":");if(i.has(d))continue;i.add(d);const h=T(c);h&&(t.beginPath(),t.moveTo(o.x,o.y),t.lineTo(h.x,h.y),t.stroke())}for(const o of r.territories){const c=Z[o.owner]??"#666",d=o.name===u||o.name===m,h=o.name===((s=x())==null?void 0:s.name);t.beginPath(),t.fillStyle=c,t.strokeStyle=d?"#fff3d1":h?"#1d2b2a":"rgba(33, 20, 8, 0.3)",t.lineWidth=d?8:h?6:4,t.arc(o.x,o.y,43,0,Math.PI*2),t.fill(),t.stroke(),t.fillStyle="#fff8ec",t.textAlign="center",t.font="bold 19px Georgia",t.fillText(o.name,o.x,o.y-8),t.font="bold 24px Georgia",t.fillText(o.hidden?"?":String(o.units),o.x,o.y+24)}t.fillStyle="rgba(33, 24, 16, 0.68)",t.fillRect(18,18,320,44),t.fillStyle="#fff8ec",t.textAlign="left",t.font="bold 22px Georgia",t.fillText(`Turn ${r.turnNumber} • ${r.phase}`,34,47)}function ne(){var t;if(!r)return JSON.stringify({mode:"loading"});const e={mode:r.phase,turn:r.turnNumber,note:r.mapNote,pendingOrders:p,selection:{source:u,target:m,type:y,units:g,cursor:((t=x())==null?void 0:t.name)??null},territories:r.territories.map(n=>({name:n.name,owner:n.owner,units:n.hidden?"hidden":n.units,x:n.x,y:n.y,neighbors:n.neighbors})),players:r.players,log:r.lastLog};return JSON.stringify(e)}function re(e){return V(e).map(n=>`
    <section class="battle-section battle-${n.kind}">
      <h3>${n.title}</h3>
      <div class="battle-lines">
        ${n.entries.map(i=>`<div class="battle-line">${i}</div>`).join("")}
      </div>
    </section>
  `).join("")}function oe(e){const t=K(e);return t.length===0?'<div class="log-entry">No territory changes resolved yet.</div>':t.map(n=>{const i=n.movementDelta===0?"move 0":`move ${n.movementDelta>0?"+":""}${n.movementDelta}`,s=n.reinforcementDelta===0?"reinforce 0":`reinforce +${n.reinforcementDelta}`,o=n.finalUnits==null?"?":String(n.finalUnits);return`
      <div class="turn-summary-card">
        <strong>${n.territory}</strong>
        <div>${i}</div>
        <div>${s}</div>
        <div>final ${o}${n.owner?` • ${n.owner}`:""}</div>
      </div>
    `}).join("")}function ie(){window.render_game_to_text=ne,window.advanceTime=()=>{l()}}async function B(){document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}function l(){var M;if(!r){N.innerHTML='<section class="panel"><h1 class="title">RISC</h1><p>Loading battlefield...</p></section>';return}const e=r.phase==="SETUP"?`
      <section class="panel setup">
        <h2>Initial Placement</h2>
        <p class="hint">Distribute your ${((M=D())==null?void 0:M.reserveUnits)??0} reserve units. Blue and Red stay hidden until you confirm.</p>
        <div class="setup-grid">
          ${R().map(a=>`
            <div class="territory-stepper">
              <strong>${a.name}</strong>
              <button class="secondary" data-setup-minus="${a.name}">-</button>
              <span>${b[a.name]??0}</span>
              <button class="secondary" data-setup-plus="${a.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>Units left: <strong>${A()}</strong></span>
          <button id="start-btn">Lock Placement</button>
        </div>
      </section>`:"",t=R().map(a=>`<option value="${a.name}" ${u===a.name?"selected":""}>${a.name}</option>`).join(""),n=(r.territories??[]).map(a=>`<option value="${a.name}" ${m===a.name?"selected":""}>${a.name}</option>`).join("");N.innerHTML=`
    <section class="panel">
      <h1 class="title">RISC</h1>
      <p class="subtitle">Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.</p>
      ${e}
      <section class="controls">
        <h2>Orders</h2>
        <p class="hint">Click territories on the map or use the selectors below. Keep one unit behind in every source territory.</p>
        <div class="buttons">
          <button class="${y==="MOVE"?"":"secondary"}" data-mode="MOVE">Move</button>
          <button class="${y==="ATTACK"?"":"secondary"}" data-mode="ATTACK">Attack</button>
          <button class="secondary" id="fullscreen-btn">Fullscreen (F)</button>
        </div>
        <div class="row">
          <label>Source<select id="source-select"><option value="">Select</option>${t}</select></label>
          <label>Target<select id="target-select"><option value="">Select</option>${n}</select></label>
        </div>
        <div class="row">
          <label>Units<input id="units-input" type="number" min="1" value="${g}" /></label>
          <button id="queue-order" ${r.phase!=="ORDERS"?"disabled":""}>Queue Order</button>
        </div>
        <div class="buttons">
          <button class="secondary" id="clear-orders">Clear Planned Orders</button>
          <button id="commit-turn" ${r.phase!=="ORDERS"?"disabled":""}>Commit Turn</button>
          <button class="secondary" id="reset-game">New Game</button>
        </div>
        <div class="hint">${L||"&nbsp;"}</div>
      </section>
      <section class="players">
        <h2>Factions</h2>
        ${r.players.map(a=>`
          <article>
            <strong>${a.displayName}</strong>
            <div>Territories: ${a.territories}</div>
            <div>Total units: ${a.totalUnits}</div>
            <div>${a.defeated?"Defeated":a.localPlayer?"You":"AI opponent"}</div>
          </article>`).join("")}
      </section>
      <section>
        <h2>Planned Orders</h2>
        <div class="log">
          ${p.length===0?'<div class="log-entry">No queued orders yet.</div>':p.map(a=>`<div class="log-entry">${a.type} ${a.units} from ${a.source} to ${a.target}</div>`).join("")}
        </div>
      </section>
      <section>
        <h2>Turn Changes</h2>
        <div class="log turn-summary-log">
          ${oe(r.lastLog)}
        </div>
      </section>
      <section>
        <h2>Resolution Log</h2>
        <div class="log battle-log">
          ${re(r.lastLog)}
        </div>
      </section>
    </section>
    <section class="panel board-shell">
      <div class="board-meta">
        <div>
          <strong>${r.phase==="GAME_OVER"?`${r.winner} wins`:"Battle Map"}</strong>
          <div class="hint">${r.mapNote}</div>
        </div>
        <div class="hint">Pending orders: ${p.length}</div>
      </div>
      <canvas id="game-canvas" aria-label="RISC game board"></canvas>
    </section>
  `;const i=document.querySelector("#game-canvas");i&&(te(i),i.onclick=a=>ee(a,i)),document.querySelectorAll("[data-mode]").forEach(a=>{a.onclick=()=>{y=a.dataset.mode,l()}}),document.querySelectorAll("[data-setup-plus]").forEach(a=>{a.onclick=()=>P(a.dataset.setupPlus??"",1)}),document.querySelectorAll("[data-setup-minus]").forEach(a=>{a.onclick=()=>P(a.dataset.setupMinus??"",-1)});const s=document.querySelector("#start-btn");s&&(s.onclick=()=>{W()});const o=document.querySelector("#source-select");o&&(o.onchange=()=>{u=o.value||null,l()});const c=document.querySelector("#target-select");c&&(c.onchange=()=>{m=c.value||null,l()});const d=document.querySelector("#units-input");d&&(d.oninput=()=>{g=Math.max(1,Number(d.value)||1)});const h=document.querySelector("#queue-order");h&&(h.onclick=G);const S=document.querySelector("#commit-turn");S&&(S.onclick=()=>{j()});const w=document.querySelector("#clear-orders");w&&(w.onclick=()=>{p=[],g=1,f("Cleared planned orders.")});const k=document.querySelector("#reset-game");k&&(k.onclick=()=>{X()});const C=document.querySelector("#fullscreen-btn");C&&(C.onclick=()=>{B()})}window.addEventListener("keydown",e=>{if(r){if(e.key==="ArrowRight"){v+=1,l();return}if(e.key==="ArrowLeft"){v-=1,l();return}if(e.key==="ArrowDown"){v+=3,l();return}if(e.key==="ArrowUp"){v-=3,l();return}if(e.key.toLowerCase()==="f"&&B(),e.key.toLowerCase()==="a"&&r.phase==="ORDERS"&&(y="ATTACK",l()),e.key.toLowerCase()==="b"&&r.phase==="ORDERS"&&(y="MOVE",l()),e.key==="Enter"){if(r.phase==="SETUP"){W();return}if(r.phase==="ORDERS"&&u&&m){G();return}r.phase==="ORDERS"&&p.length>0&&j()}if(e.key===" "||e.code==="Space"){if(r.phase!=="ORDERS")return;e.preventDefault();const t=x();if(!t)return;if(!u){if(t.owner!=="GREEN"){f("Choose one of your territories as the source.");return}u=t.name,m=null,f(`Source selected: ${t.name}. Move the cursor and press Space again for the target.`),l();return}if(t.name===u){u=null,m=null,f("Selection cleared."),l();return}m=t.name,f(`Target selected: ${t.name}. Press Enter to queue the order.`),l();return}e.key==="Escape"&&document.fullscreenElement&&document.exitFullscreen()}});ie();Q();
