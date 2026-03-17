(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function n(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(i){if(i.ep)return;i.ep=!0;const a=n(i);fetch(i.href,a)}})();function ye(e){return e.startsWith("Committed move orders")||e.startsWith("Committed attack orders")||e.startsWith(" - Green")||e.startsWith(" - Blue")||e.startsWith(" - Red")?"orders":e.startsWith("Battle queue")||e.startsWith("Combat starts")||e.startsWith("  Round ")||e.startsWith("Combat result")?"combat":e.startsWith("Reinforcement:")?"reinforcement":e.startsWith(" - ")&&e.includes(" holds ")&&e.includes(" units.")||e.startsWith("Turn ")&&e.endsWith(" final map state:")?"summary":"misc"}function ve(e){switch(e){case"orders":return"Orders";case"combat":return"Combat";case"reinforcement":return"Reinforcements";case"summary":return"End Of Turn";default:return"Notes"}}function be(e){const t=[];for(const n of e){const r=ye(n),i=t.at(-1);if(!i||i.kind!==r){t.push({title:ve(r),kind:r,entries:[n]});continue}i.entries.push(n)}return t}const Se=/([A-Za-z]+) MOVE (\d+) from ([A-Za-z]+) to ([A-Za-z]+)/,we=/Reinforcement: ([A-Za-z]+) owned by ([A-Za-z]+) gains 1 unit \((\d+) -> (\d+)\)\./,$e=/- ([A-Za-z]+): ([A-Za-z]+) holds (\d+) units\./;function Te(e){const t=new Map;for(const n of e){const r=n.match(Se);if(r){const s=Number(r[2]),d=j(t,r[3]),v=j(t,r[4]);d.movementDelta-=s,v.movementDelta+=s;continue}const i=n.match(we);if(i){const s=j(t,i[1]);s.owner=i[2],s.reinforcementDelta+=1,s.finalUnits=Number(i[4]);continue}const a=n.trim().match($e);if(a){const s=j(t,a[1]);s.owner=a[2],s.finalUnits=Number(a[3])}}return Array.from(t.values()).filter(n=>n.movementDelta!==0||n.reinforcementDelta!==0).sort((n,r)=>n.territory.localeCompare(r.territory))}function j(e,t){const n=e.get(t);if(n)return n;const r={territory:t,owner:null,movementDelta:0,reinforcementDelta:0,finalUnits:null};return e.set(t,r),r}const le=document.querySelector("#app");if(!le)throw new Error("Missing app root");const re=le;let o=null,w={},S=[],p=[],$=[],R=null,f=null,g=null,N="MOVE",b=1,V="",x=0,u=localStorage.getItem("risc_room_id"),h=sessionStorage.getItem("risc_room_token");const F=localStorage.getItem("risc_room_token");!h&&F&&(h=F,sessionStorage.setItem("risc_room_token",F),localStorage.removeItem("risc_room_token"));let M="";u&&(M=u);let C=null,_=!1;const q={mode:"loading",boardWidth:920,boardHeight:620},ke={GREEN:"#63885f",BLUE:"#7ea0be",RED:"#bb6553",YELLOW:"#c7b15a",PURPLE:"#8b6fb8",UNOWNED:"#ffffff"};async function k(e,t){const n={"Content-Type":"application/json"};h&&(n["X-Player-Token"]=h);const r=await fetch(`http://127.0.0.1:8080${e}`,{headers:{...n},...t}),i=await r.text();let a=null;try{a=i?JSON.parse(i):null}catch{a={error:i||"Request failed"}}const s=typeof a=="object"&&a!=null&&"error"in a&&typeof a.error=="string"?String(a.error):null;if(!r.ok||s)throw new Error(s??"Request failed");return a}function z(){return o==null?void 0:o.players.find(e=>e.localPlayer)}function E(){var e;return((e=z())==null?void 0:e.id)??"GREEN"}function A(){return o?o.phase==="ORDERS"&&$.length>0?$:o.territories??[]:[]}function D(e){return A().find(t=>t.name===e)}function H(){const e=A();if(!(!o||e.length===0))return e[(x%e.length+e.length)%e.length]}function L(){const e=E();return A().filter(t=>t.owner===e)}function ie(e,t){return e.neighbors.includes(t.name)}function Ee(e,t){if(e===t)return!0;const n=A(),r=new Map(n.map(d=>[d.name,d])),i=E(),a=[e],s=new Set([e]);for(;a.length>0;){const d=a.shift(),v=r.get(d);if(v)for(const y of v.neighbors){const T=r.get(y);if(!(!T||T.owner!==i)&&!s.has(y)){if(y===t)return!0;s.add(y),a.push(y)}}}return!1}function W(e){const t=D(e);if(!t)return 0;const n=p.filter(r=>r.source===e).reduce((r,i)=>r+i.units,0);return Math.max(0,t.units-n)}function U(){const e=z();return e?e.reserveUnits-Object.values(w).reduce((t,n)=>t+n,0):0}function l(e){V=e,m()}async function se(){if(u&&h)o=await k(`/api/rooms/${u}`);else{o=null,m();return}I(),P(),q.mode="ready",m()}async function Oe(){try{await se()}catch(e){if(u&&h){u=null,h=null,localStorage.removeItem("risc_room_id"),sessionStorage.removeItem("risc_room_token");try{await se();return}catch{}}l(`Failed to load: ${e.message}`)}}function I(){if(!o||o.phase!=="SETUP"){w={};return}const e={};for(const t of L())e[t.name]=w[t.name]??0;w=e}function P(){if(!o||o.phase!=="ORDERS"){$=[],S=[],p=[],R=null;return}R!==o.turnNumber&&(S=[],p=[],R=o.turnNumber,f=null,g=null,b=1),$=o.territories.map(e=>({...e,neighbors:[...e.neighbors]}));for(const e of S)ue(e)}function ue(e){const t=$.find(r=>r.name===e.source),n=$.find(r=>r.name===e.target);!t||!n||(t.units=Math.max(0,t.units-e.units),t.units===0&&(t.owner=null),n.owner==null&&e.units>0&&(n.owner=E()),n.units+=e.units)}async function Re(){u&&h?o=await k(`/api/rooms/${u}/reset`,{method:"POST"}):o=await k("/api/game/reset",{method:"POST"}),S=[],p=[],$=[],R=null,f=null,g=null,b=1,l(""),I(),P(),m()}async function de(){try{if(U()>0){const t=L(),n={...w};let r=U(),i=0;for(;r>0&&t.length>0;){const a=t[i%t.length];n[a.name]=(n[a.name]??0)+1,r-=1,i+=1}w=n}const e=JSON.stringify({allocations:w});u&&h?o=await k(`/api/rooms/${u}/setup`,{method:"POST",body:e}):o=await k("/api/game/setup",{method:"POST",body:e}),S=[],p=[],$=[],R=null,f=null,g=null,b=1,P(),u&&h&&o.phase==="SETUP"&&o.waitingOnPlayers.length>0?l(`Setup submitted. Waiting on: ${o.waitingOnPlayers.join(", ")}.`):l("Setup locked in. Opponents have revealed their placements.")}catch(e){l(e.message)}}function me(){if(!f||!g){l("Choose a source and a target territory first.");return}const e=D(f),t=D(g);if(!e||!t)return;const n=W(f);if(b<1||b>n){l("That territory does not have enough spare units.");return}const r=f,i=g;if(N==="MOVE"){if(t.owner!==E()&&t.owner!==null){l("Move can only target your own territories or an unoccupied territory.");return}if(t.owner===null&&!ie(e,t)){l("Moves into unoccupied territories must be adjacent.");return}if(t.owner===E()&&!Ee(e.name,t.name)){l("Moves into owned territories need a friendly path.");return}const a={type:"MOVE",source:r,target:i,units:b};S=[...S,a],ue(a),l(`Moved ${b} from ${r} to ${i}.`)}else{if(t.owner===E()){l("Attack orders must target enemy or unoccupied territories.");return}if(!ie(e,t)){l("Attack orders must target adjacent territories.");return}p=[...p,{type:"ATTACK",source:r,target:i,units:b}],l(`Queued attack ${b} from ${r} to ${i}.`)}f=null,g=null,b=1,m()}async function fe(){try{const e=JSON.stringify({orders:[...S,...p].map(t=>({type:t.type,source:t.source,target:t.target,units:t.units}))});u&&h?o=await k(`/api/rooms/${u}/turn`,{method:"POST",body:e}):o=await k("/api/game/turn",{method:"POST",body:e}),S=[],p=[],$=[],R=null,b=1,f=null,g=null,P(),o.phase==="GAME_OVER"?l("The war is over."):u&&h&&o.waitingOnPlayers.length>0?l(`Orders submitted. Waiting on: ${o.waitingOnPlayers.join(", ")}.`):l("Turn resolved. Plan your next move.")}catch(e){l(e.message)}}function ae(e,t){const n=w[e]??0,r=Math.max(0,n+t),i=U()+n;r>i||(w={...w,[e]:r},m())}function Ae(e,t){if(!o||o.phase==="GAME_OVER")return;const n=t.getBoundingClientRect(),r=q.boardWidth/n.width,i=q.boardHeight/n.height,a=(e.clientX-n.left)*r,s=(e.clientY-n.top)*i,d=A().find(v=>{const y=v.x-a,T=v.y-s;return Math.sqrt(y*y+T*T)<48});if(d){if(x=A().findIndex(v=>v.name===d.name),!f){if(d.owner!==E()){l("Choose one of your territories as the source.");return}if(W(d.name)<=0){l("That territory has no units available to move or attack.");return}f=d.name,g=null,b=1,l(`Source selected: ${d.name}. Now choose a target.`),m();return}if(d.name===f){f=null,g=null,l("Source cleared."),m();return}g=d.name,l(`Target selected: ${d.name}.`),m()}}function Pe(e){var a;const t=e.getContext("2d");if(!t||!o)return;const n=A();e.width=q.boardWidth,e.height=q.boardHeight,t.clearRect(0,0,e.width,e.height);const r=t.createLinearGradient(0,0,0,e.height);r.addColorStop(0,"#a7cde0"),r.addColorStop(.24,"#dbead8"),r.addColorStop(1,"#cfaf76"),t.fillStyle=r,t.fillRect(0,0,e.width,e.height),t.fillStyle="rgba(255,255,255,0.18)";for(let s=0;s<14;s+=1)t.beginPath(),t.arc(80+s*60,60+s%3*26,24+s%4*8,0,Math.PI*2),t.fill();t.lineWidth=5,t.strokeStyle="rgba(73, 58, 38, 0.28)";const i=new Set;for(const s of n)for(const d of s.neighbors){const v=[s.name,d].sort().join(":");if(i.has(v))continue;i.add(v);const y=D(d);y&&(t.beginPath(),t.moveTo(s.x,s.y),t.lineTo(y.x,y.y),t.stroke())}for(const s of n){const d=s.owner??"UNOWNED",v=ke[d]??"#666",y=s.name===f||s.name===g,T=s.name===((a=H())==null?void 0:a.name);t.beginPath(),t.fillStyle=v,t.strokeStyle=y?"#fff3d1":T?"#1d2b2a":d==="UNOWNED"?"rgba(33, 20, 8, 0.55)":"rgba(33, 20, 8, 0.3)",t.lineWidth=y?8:T?6:4,t.arc(s.x,s.y,43,0,Math.PI*2),t.fill(),t.stroke(),t.fillStyle="#fff8ec",t.textAlign="center",t.font="bold 19px Georgia",t.fillText(s.name,s.x,s.y-8),t.font="bold 24px Georgia",t.fillText(s.hidden?"?":String(s.units),s.x,s.y+24)}t.fillStyle="rgba(33, 24, 16, 0.68)",t.fillRect(18,18,320,44),t.fillStyle="#fff8ec",t.textAlign="left",t.font="bold 22px Georgia",t.fillText(`Turn ${o.turnNumber} • ${o.phase}`,34,47)}function Me(){var t;if(!o)return JSON.stringify({mode:"loading"});const e={mode:o.phase,turn:o.turnNumber,note:o.mapNote,pendingMoves:S,pendingAttacks:p,selection:{source:f,target:g,type:N,units:b,cursor:((t=H())==null?void 0:t.name)??null},territories:A().map(n=>({name:n.name,owner:n.owner,units:n.hidden?"hidden":n.units,x:n.x,y:n.y,neighbors:n.neighbors})),players:o.players,log:o.lastLog};return JSON.stringify(e)}function Ne(e){return be(e).map(n=>`
    <section class="battle-section battle-${n.kind}">
      <h3>${n.title}</h3>
      <div class="battle-lines">
        ${n.entries.map(r=>`<div class="battle-line">${r}</div>`).join("")}
      </div>
    </section>
  `).join("")}function xe(e){const t=Te(e);return t.length===0?'<div class="log-entry">No territory changes resolved yet.</div>':t.map(n=>{const r=n.movementDelta===0?"move 0":`move ${n.movementDelta>0?"+":""}${n.movementDelta}`,i=n.reinforcementDelta===0?"reinforce 0":`reinforce +${n.reinforcementDelta}`,a=n.finalUnits==null?"?":String(n.finalUnits);return`
      <div class="turn-summary-card">
        <strong>${n.territory}</strong>
        <div>${r}</div>
        <div>${i}</div>
        <div>final ${a}${n.owner?` • ${n.owner}`:""}</div>
      </div>
    `}).join("")}function Ie(){window.render_game_to_text=Me,window.advanceTime=()=>{m()}}async function he(){document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}function m(){var oe;if(!o){re.innerHTML=`
      <section class="panel">
        <h1 class="title">RISC</h1>
        <div class="row">
          <button id="create-room">Create room</button>
          <input id="join-room-id" placeholder="Room ID (e.g. ABC123)" value="${M}" />
          <button class="secondary" id="join-room">Join</button>
        </div>
        <div class="hint">${V||"Tip: open another window and Join the same Room ID to get a different player seat."}</div>
      </section>
    `;const c=document.querySelector("#create-room");c&&(c.onclick=()=>{ce().catch(()=>{})});const O=document.querySelector("#join-room-id");O&&(O.oninput=()=>{M=O.value});const G=document.querySelector("#join-room");G&&(G.onclick=()=>{J(M).catch(()=>{})});return}const e=o.phase==="SETUP"?`
      <section class="panel setup">
        <h2>Initial Placement</h2>
        <p class="hint">Distribute your ${((oe=z())==null?void 0:oe.reserveUnits)??0} reserve units. Other players stay hidden until setup is locked in.</p>
        <div class="setup-grid">
          ${L().map(c=>`
            <div class="territory-stepper">
              <strong>${c.name}</strong>
              <button class="secondary" data-setup-minus="${c.name}">-</button>
              <span>${w[c.name]??0}</span>
              <button class="secondary" data-setup-plus="${c.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>Units left: <strong>${U()}</strong></span>
          <button id="start-btn">Lock Placement</button>
        </div>
      </section>`:"",t=L().filter(c=>W(c.name)>0).map(c=>`<option value="${c.name}" ${f===c.name?"selected":""}>${c.name}</option>`).join(""),n=A().map(c=>`<option value="${c.name}" ${g===c.name?"selected":""}>${c.name}</option>`).join("");re.innerHTML=`
    <section class="panel">
      <h1 class="title">RISC</h1>
      <p class="subtitle">Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.</p>
      <section class="controls">
        <h2>Multiplayer</h2>
        ${u&&h?`
            <div class="row">
              <span>Room: <strong>${u}</strong></span>
              <span>You: <strong>${E()}</strong></span>
              <button class="secondary" id="leave-room">Leave</button>
              <button class="secondary" id="new-seat">New seat</button>
            </div>
            ${o.phase==="LOBBY"&&E()==="GREEN"?`
                <div class="row">
                  <button id="start-game" ${o.players.length<2?"disabled":""}>Start game</button>
                  <span class="hint">Need at least 2 players (currently ${o.players.length}).</span>
                </div>
              `:""}
          `:`
            <div class="row">
              <button id="create-room">Create room</button>
              <input id="join-room-id" placeholder="Room ID (e.g. ABC123)" value="${M}" />
              <button class="secondary" id="join-room">Join</button>
            </div>
            <div class="hint">Open a second window to join the same room and play as another color.</div>
          `}
        ${o.waitingOnPlayers.length>0?`<div class="hint">Waiting on: ${o.waitingOnPlayers.join(", ")}</div>`:""}
      </section>
      ${e}
      <section class="controls">
        <h2>Orders</h2>
        <p class="hint">Click territories on the map or use the selectors below. You may move/attack with all units (territories can become unoccupied).</p>
        <div class="buttons">
          <button class="${N==="MOVE"?"":"secondary"}" data-mode="MOVE">Move</button>
          <button class="${N==="ATTACK"?"":"secondary"}" data-mode="ATTACK">Attack</button>
          <button class="secondary" id="fullscreen-btn">Fullscreen (F)</button>
        </div>
        <div class="row">
          <label>Source<select id="source-select"><option value="">Select</option>${t}</select></label>
          <label>Target<select id="target-select"><option value="">Select</option>${n}</select></label>
        </div>
        <div class="row">
          <label>Units<input id="units-input" type="number" min="1" value="${b}" /></label>
          <button id="queue-order" ${o.phase!=="ORDERS"?"disabled":""}>Queue Order</button>
        </div>
        <div class="buttons">
          <button class="secondary" id="clear-orders">Clear Planned Actions</button>
          <button id="commit-turn" ${o.phase!=="ORDERS"?"disabled":""}>Commit Turn</button>
          <button class="secondary" id="reset-game">New Game</button>
        </div>
        <div class="hint">${V||"&nbsp;"}</div>
      </section>
      <section class="players">
        <h2>Factions</h2>
        ${o.players.map(c=>`
          <article>
            <strong>${c.displayName}</strong>
            <div>Territories: ${c.territories}</div>
            <div>Total units: ${c.totalUnits}</div>
            <div>${c.defeated?"Defeated":c.localPlayer?"You":u?"Opponent":"AI opponent"}</div>
          </article>`).join("")}
      </section>
      <section>
        <h2>Queued Attacks</h2>
        <div class="log">
          ${p.length===0?'<div class="log-entry">No queued attacks yet.</div>':p.map((c,O)=>`
              <div class="log-entry">
                ATTACK ${c.units} from ${c.source} to ${c.target}
                <button class="secondary" data-attack-remove="${O}">Remove</button>
              </div>`).join("")}
        </div>
        <div class="hint">Moves apply immediately in your browser. Attacks resolve together when you commit.</div>
      </section>
      <section>
        <h2>Turn Changes</h2>
        <div class="log turn-summary-log">
          ${xe(o.lastLog)}
        </div>
      </section>
      <section>
        <h2>Resolution Log</h2>
        <div class="log battle-log">
          ${Ne(o.lastLog)}
        </div>
      </section>
    </section>
    <section class="panel board-shell">
      <div class="board-meta">
        <div>
          <strong>${o.phase==="GAME_OVER"?`${o.winner} wins`:"Battle Map"}</strong>
          <div class="hint">${o.mapNote}</div>
        </div>
        <div class="hint">Pending actions: ${S.length+p.length}</div>
      </div>
      <canvas id="game-canvas" aria-label="RISC game board"></canvas>
    </section>
  `;const r=document.querySelector("#game-canvas");r&&(Pe(r),r.onclick=c=>Ae(c,r)),document.querySelectorAll("[data-mode]").forEach(c=>{c.onclick=()=>{N=c.dataset.mode,m()}}),document.querySelectorAll("[data-setup-plus]").forEach(c=>{c.onclick=()=>ae(c.dataset.setupPlus??"",1)}),document.querySelectorAll("[data-setup-minus]").forEach(c=>{c.onclick=()=>ae(c.dataset.setupMinus??"",-1)});const i=document.querySelector("#start-btn");i&&(i.onclick=()=>{de()});const a=document.querySelector("#source-select");a&&(a.onchange=()=>{f=a.value||null,m()});const s=document.querySelector("#target-select");s&&(s.onchange=()=>{g=s.value||null,m()});const d=document.querySelector("#units-input");d&&(d.oninput=()=>{b=Math.max(1,Number(d.value)||1)});const v=document.querySelector("#queue-order");v&&(v.onclick=me);const y=document.querySelector("#commit-turn");y&&(y.onclick=()=>{fe()});const T=document.querySelector("#clear-orders");T&&(T.onclick=()=>{S=[],p=[],P(),b=1,l("Cleared planned actions.")}),document.querySelectorAll("[data-attack-remove]").forEach(c=>{c.onclick=()=>{const O=Number(c.dataset.attackRemove??"-1");Number.isNaN(O)||O<0||(p=p.filter((G,ge)=>ge!==O),l("Removed queued attack."),m())}});const K=document.querySelector("#reset-game");K&&(K.onclick=()=>{Re()});const Z=document.querySelector("#fullscreen-btn");Z&&(Z.onclick=()=>{he()});const Q=document.querySelector("#create-room");Q&&(Q.onclick=()=>{ce().catch(()=>{})});const B=document.querySelector("#join-room-id");B&&(B.oninput=()=>{M=B.value});const X=document.querySelector("#join-room");X&&(X.onclick=()=>{J(M).catch(()=>{})});const ee=document.querySelector("#leave-room");ee&&(ee.onclick=()=>{Ce()});const te=document.querySelector("#new-seat");te&&(te.onclick=()=>{qe().catch(()=>{})});const ne=document.querySelector("#start-game");ne&&(ne.onclick=()=>{je().catch(()=>{})})}window.addEventListener("keydown",e=>{if(o){if(e.key==="ArrowRight"){x+=1,m();return}if(e.key==="ArrowLeft"){x-=1,m();return}if(e.key==="ArrowDown"){x+=3,m();return}if(e.key==="ArrowUp"){x-=3,m();return}if(e.key.toLowerCase()==="f"&&he(),e.key.toLowerCase()==="a"&&o.phase==="ORDERS"&&(N="ATTACK",m()),e.key.toLowerCase()==="b"&&o.phase==="ORDERS"&&(N="MOVE",m()),e.key==="Enter"){if(o.phase==="SETUP"){de();return}if(o.phase==="ORDERS"&&f&&g){me();return}o.phase==="ORDERS"&&S.length+p.length>0&&fe()}if(e.key===" "||e.code==="Space"){if(o.phase!=="ORDERS")return;e.preventDefault();const t=H();if(!t)return;if(!f){if(t.owner!==E()){l("Choose one of your territories as the source.");return}if(W(t.name)<=0){l("That territory has no units available to move or attack.");return}f=t.name,g=null,l(`Source selected: ${t.name}. Move the cursor and press Space again for the target.`),m();return}if(t.name===f){f=null,g=null,l("Selection cleared."),m();return}g=t.name,l(`Target selected: ${t.name}. Press Enter to queue the order.`),m();return}e.key==="Escape"&&document.fullscreenElement&&document.exitFullscreen()}});Ie();Oe();async function ce(){try{const e=await k("/api/rooms",{method:"POST"});u=e.roomId,h=e.token,localStorage.setItem("risc_room_id",u),sessionStorage.setItem("risc_room_token",h),o=e.game,I(),P(),Y(),l(`Created room ${u}.`)}catch(e){throw l(e.message),e}}async function J(e){try{const t=(e??"").trim().toUpperCase();if(!t){l("Enter a room ID to join.");return}const n=await k(`/api/rooms/${t}/join`,{method:"POST"});u=n.roomId,h=n.token,localStorage.setItem("risc_room_id",u),sessionStorage.setItem("risc_room_token",h),o=n.game,I(),P(),Y(),l(`Joined room ${u} as ${n.playerId}.`)}catch(t){throw l(t.message),t}}function Ce(){u=null,h=null,localStorage.removeItem("risc_room_id"),sessionStorage.removeItem("risc_room_token"),pe(),S=[],p=[],$=[],R=null,w={},l("Left room."),o=null,m()}async function qe(){if(!u){l("No room to join.");return}h=null,sessionStorage.removeItem("risc_room_token"),pe(),S=[],p=[],$=[],R=null,w={},await J(u)}async function je(){if(!u||!h){l("Create or join a room first.");return}try{o=await k(`/api/rooms/${u}/start`,{method:"POST"}),S=[],p=[],$=[],R=null,f=null,g=null,b=1,I(),P(),l(o.phase==="SETUP"?"Game started. Submit your setup.":"Game started.")}catch(e){throw l(e.message),e}}function Y(){C==null&&(C=window.setInterval(()=>{_e()},1200))}function pe(){C!=null&&(window.clearInterval(C),C=null,_=!1)}async function _e(){if(!(!u||!h||_)){_=!0;try{o=await k(`/api/rooms/${u}`),I(),P(),m()}catch{}finally{_=!1}}}u&&h&&Y();
