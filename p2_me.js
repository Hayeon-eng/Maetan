/* ===== MY SCREEN ===== */
const TABS = [['story','이야기'],['timeline','시간표'],['secret','비밀'],['clues','내 단서'],['acq','획득 단서'],['memo','메모'],['deduce','추리']];
function renderMe(tab){
  const ch = me() ? byId(me()) : null; if(!ch){ location.hash='#/'; return renderHome(); }
  setMode('me');
  tab = tab || store.get(K('tab'), 'story'); store.set(K('tab'), tab);
  const ts = tokenState();
  $('#app').innerHTML = `
  ${topbar(ch.name+' · 내 화면','#/',`<span class="act tok">🪙 ${ts.left}</span>`)}
  ${modebar('me', ch.name+' 본인 외에는 보여주지 마세요')}
  <main class="wrap">
    <div class="doc book">
      <div class="bookhead">
        <div class="ph"><span class="clip"></span><img src="${img('photo_'+ch.id)}" alt=""></div>
        <div>
          <div class="nm">${esc(ch.name)}</div>
          <div class="meta">${esc(ch.birth)} · ${esc(ch.career)}<br>${esc(ch.group)}<br>${esc(ch.title)}</div>
          <div style="margin-top:6px">${fBadge(ch.faction)} ${ch.canLie?'<span class="badge b-red">거짓말 범위 있음</span>':'<span class="badge b-non">거짓말 불가</span>'}</div>
        </div>
      </div>
    </div>
    <nav class="tabs">${TABS.map(([k,l])=>`<button class="tab ${k===tab?'on':''}" onclick="location.hash='#/me/${k}'">${l}</button>`).join('')}</nav>
    <section class="pane on" id="pane">${renderPane(ch, tab)}</section>
  </main>`;
  if(tab==='memo') bindMemo(ch);
  if(tab==='deduce') bindDeduce(ch);
}
function renderPane(ch, tab){
  return ({story:paneStory, timeline:paneTimeline, secret:paneSecret, clues:paneClues, acq:paneAcq, memo:paneMemo, deduce:paneDeduce}[tab]||paneStory)(ch);
}
function paneStory(ch){ return `<p class="legend-hl"><b class="hl">굵은 글씨</b>는 반드시 기억할 사실, <u class="ul">밑줄</u>은 말할 때 조심할 문장입니다.</p><div class="panel story">${ch.story.map(p=>`<p>${md(p)}</p>`).join('')}</div>`; }
function paneTimeline(ch){
  return `<ul class="tl">${ch.timeline.map(([t,d])=>`<li><div class="t">${esc(t)}</div><div class="d">${md(d)}</div></li>`).join('')}</ul>
  ${ch.knows.length?`<div class="panel c-han" style="margin-top:14px"><h3>당신이 확실히 아는 것</h3><ul class="plain">${ch.knows.map(k=>`<li>${md(k)}</li>`).join('')}</ul></div>`:''}
  ${ch.weak.length?`<div class="panel c-red"><h3>알리바이가 흔들리는 지점</h3><ul class="plain">${ch.weak.map(k=>`<li>${md(k)}</li>`).join('')}</ul></div>`:''}`;
}
function paneSecret(ch){
  const L = ch.lie;
  return `
  <div class="panel c-red"><h3>비공개 사실</h3><ul class="plain">${ch.secrets.map(s=>`<li>${md(s)}</li>`).join('')}</ul></div>
  <div class="panel"><h3>${ch.canLie?'거짓말 범위 · 이 선을 넘지 마세요':'말하기 규칙'}</h3>
    <div class="lie">
      ${L.can?`<div class="ok"><b>가능 · 사실과 다르게 말해도 됨</b><u class="ul">${esc(L.can)}</u></div>`:''}
      ${L.hide?`<div class="hide"><b>숨김 · 답변 거절은 되지만 부정은 안 됨</b><u class="ul">${esc(L.hide)}</u></div>`:''}
      ${L.forbid?`<div class="no"><b>${ch.canLie?'금지':'규칙'}</b>${esc(L.forbid)}</div>`:''}
    </div></div>
  ${ch.tips.length?`<div class="panel c-amb"><h3>PLAY / 거짓말 TIP</h3><ul class="plain">${ch.tips.map(s=>`<li>${md(s)}</li>`).join('')}</ul></div>`:''}
  <div class="panel"><h3>누가 내 비밀을 알고 있나</h3><p style="margin:0">${md(ch.whoKnows)}</p></div>
  ${ch.targets.length?`<div class="panel c-mou"><h3>먼저 타겟할 인물</h3><ul class="plain">${ch.targets.map(s=>`<li>${md(s)}</li>`).join('')}</ul></div>`:''}
  <div class="panel c-amb"><h3>미션</h3><p style="margin:0 0 6px"><b>공통</b> 실제 범인과 범행 동기를 맞힌다.</p><p style="margin:0"><b>개인</b> ${md(ch.mission)}</p></div>`;
}
function clueCard(owner, c, i, opts={}){
  return `<div class="clue ${opts.cls||''}" id="${opts.id||''}">
    <div class="ch"><b>${esc(c.title)}</b><span class="ev">${esc(owner.name)} · 코드 ${clueCode(owner.id,i)}</span></div>
    <div class="im"><img src="${img(c.img)}" alt="${esc(c.title)}" onclick="openZoom(this.src)"></div>
    <div class="ct">${esc(c.text)}</div>
    ${opts.foot||''}
  </div>`;
}
function paneClues(ch){
  const rev = store.get(K('rev'), {});
  return `<p class="hint">내 개인 단서 3장입니다. 토큰 없이 볼 수 있습니다. 공개하기로 결정한 순간에만 다른 사람에게 보여줍니다.</p>
  ${ch.clues.map((c,i)=>clueCard(ch,c,i,{foot:`<div class="cf"><button class="rev ${rev[i]?'on':''}" onclick="toggleRev(${i},this)">${rev[i]?'공개함':'미공개'}</button><button class="btn sm" onclick="shareClue('${ch.id}',${i})">📣 공개하기</button></div>`})).join('')}
  <p class="hint">카드에 적힌 사실을 바꾸거나 새 증거를 만들어 말할 수 없습니다.</p>`;
}
function toggleRev(i,btn){ const r=store.get(K('rev'),{}); r[i]=!r[i]; store.set(K('rev'),r); btn.classList.toggle('on',r[i]); btn.textContent = r[i]?'공개함':'미공개'; }
function sharedForMe(){
  const sh=(SSTATE&&SSTATE.shared)||{}; const out=[];
  Object.values(sh).forEach(v=>{ if(v && (v.to==='all'||v.to===me()) && v.by!==me()) out.push({o:v.o,i:v.i,at:v.at?new Date(v.at).toTimeString().slice(0,5):'',from:v.by,auto:true}); });
  return out;
}
function paneAcq(ch){
  const ts = tokenState();
  const list = ts.acq.slice().reverse();
  const seen=new Set(); const recv = store.get(K('recv'), []).concat(sharedForMe()).filter(a=>{ const k=a.o+'_'+a.i; if(seen.has(k)) return false; seen.add(k); return true; }).slice().reverse();
  return `<div class="tokbar"><div><div class="lbl">조사 토큰</div><div class="mono" style="font-size:12px;color:var(--dim)">${ts.left>0?`남은 토큰 ${ts.left}개`:'토큰 없음 · '+nextTokenHint()}</div></div>
    <div class="coins">${Array.from({length:ts.total},(_,i)=>`<span class="coin ${i<ts.left?'':'ghost'}">T</span>`).join('')}</div></div>

  <div class="panel c-amb"><h3>공개받은 단서 추가</h3>
    <p style="margin:0 0 8px;font-size:14px">${SYNC?'누가 <b>모두에게 공개</b>하거나 <b>나에게 보내기</b>를 누르면 여기 자동으로 들어옵니다. 말로 들은 코드(예: <b>05-2</b>)를 직접 넣을 수도 있습니다.':'누가 단서를 공개하면 카드 코드(예: <b>05-2</b>)를 말해주거나 카톡으로 보냅니다. 코드를 입력하면 그 단서가 내 단서함에 들어옵니다. 토큰은 들지 않습니다.'}</p>
    <div class="coderow"><input id="recvcode" type="text" inputmode="numeric" placeholder="05-2" maxlength="5"><button class="btn sm" onclick="addRecv()">추가</button></div></div>

  <h3 class="subh">토큰으로 조사한 단서 · ${list.length}장</h3>
  ${list.length? list.map(a=>{ const o=a.o==='yeongyu'?YEONGYU:byId(a.o); const c=o.clues[a.i]; return clueCard(o,c,a.i,{foot:`<div class="cf"><span class="small">${esc(a.at||'')} 조사${a.o==='yeongyu'?' (이연규·불참)':` · <a class="lnk small" href="#/inv/${o.id}">${esc(o.name)} 더 조사</a>`}</span><button class="btn sm" onclick="shareClue('${o.id}',${a.i})">📣 공개하기</button></div>`}); }).join('')
    : `<div class="panel"><p style="margin:0;font-size:14px">아직 없습니다. 홈에서 다른 캐릭터 카드를 뒤집고 <b>🔍 단서 조사</b>를 누르면 토큰 1개로 그 사람의 단서 1장을 열어볼 수 있습니다.</p></div>`}

  <h3 class="subh">공개받은 단서 · ${recv.length}장</h3>
  ${recv.length? recv.map(a=>{ const o=a.o==='yeongyu'?YEONGYU:byId(a.o); const c=o.clues[a.i]; const oo=a.o==='yeongyu'?YEONGYU:byId(a.o); return clueCard(oo,c,a.i,{foot:`<div class="cf"><span class="small">${esc(a.at||'')} ${a.auto?(byId(a.from)?.name||'')+'가 공개':'코드로 받음'}</span>${a.auto?'':`<button class="lnk small" onclick="removeRecv('${a.o}',${a.i})">제거</button>`}</div>`}); }).join('')
    : `<div class="panel"><p style="margin:0;font-size:14px">아직 없습니다.</p></div>`}`;
}
function addRecv(){
  const inp=$('#recvcode'); const p=parseClueCode(inp.value);
  if(!p){ inp.value=''; inp.placeholder='형식: 05-2'; inp.focus(); return; }
  if(p.o===me()){ alert('내 단서입니다. 내 단서 탭에서 볼 수 있습니다.'); inp.value=''; return; }
  const recv=store.get(K('recv'),[]); if(!recv.some(a=>a.o===p.o&&a.i===p.i)) recv.push({o:p.o,i:p.i,at:new Date().toTimeString().slice(0,5)}); store.set(K('recv'),recv);
  renderMe('acq');
}
function removeRecv(o,i){ store.set(K('recv'), store.get(K('recv'),[]).filter(a=>!(a.o===o&&a.i===i))); renderMe('acq'); }
function shareClue(ownerId, i){
  const o=byId(ownerId); const c=o.clues[i]; const code=clueCode(ownerId,i);
  const sheet=document.createElement('div'); sheet.className='sheet'; sheet.id='sheet';
  sheet.innerHTML=`<div class="sh">
    <div class="shh"><b>단서 공개</b><button class="x" onclick="closeSheet()">×</button></div>
    <p class="small" style="margin:0 0 6px">${esc(o.name)}의 단서 · ${esc(c.title)}</p>
    <div class="bigcode">${code}</div>
    <p style="font-size:14px;margin:0 0 12px">이 코드를 받은 사람은 <b>내 화면 › 획득 단서 › 공개받은 단서 추가</b>에 입력하면 카드를 볼 수 있습니다.</p>
    ${SYNC? `<button class="btn" style="width:100%;margin-bottom:8px" onclick="shareTo('${ownerId}',${i},'all')">📣 모두에게 공개</button>
      <div class="small" style="margin:6px 0 4px">특정인에게만 보내기</div>
      <div class="whogrid">${CHARS.filter(x=>x.id!==me()).map(x=>`<button class="who" onclick="shareTo('${ownerId}',${i},'${x.id}')">${esc(x.name)}</button>`).join('')}</div>`
    : `<button class="btn" style="width:100%;margin-bottom:8px" onclick="closeSheet();alert('테이블에 이렇게 말하세요:\\n\\n“${code} 공개합니다 — ${esc(o.name)}의 ${esc(c.title)}”')">📣 모두에게 공개 (말로 알리기)</button>
    <button class="btn inv" style="width:100%" onclick="sendClue('${ownerId}',${i})">✉️ 특정인에게 보내기 (카톡 공유)</button>`}
  </div>`;
  document.body.appendChild(sheet);
}
async function shareTo(ownerId,i,to){
  closeSheet();
  const ok = await sput(`shared/${ownerId}_${i}_${to}`, {o:ownerId,i,to,by:me(),at:Date.now()});
  alert(ok? (to==='all'?'모두에게 공개했습니다.':`${byId(to).name}에게 보냈습니다.`) : '전송에 실패했습니다. 네트워크를 확인하세요.');
}
function closeSheet(){ const s=$('#sheet'); if(s) s.remove(); }
async function sendClue(ownerId,i){
  const o=byId(ownerId); const c=o.clues[i]; const code=clueCode(ownerId,i);
  const text=`[매탄동 단서 공개] ${o.name}의 단서 「${c.title}」\n코드: ${code}\n→ 내 화면 › 획득 단서 › 공개받은 단서 추가에 입력`;
  closeSheet();
  try{ if(navigator.share){ await navigator.share({text}); return; } }catch(e){}
  try{ await navigator.clipboard.writeText(text); alert('복사했습니다. 보낼 사람과의 채팅에 붙여넣으세요.'); }catch(e){ prompt('아래 내용을 복사해 보내세요', text); }
}

/* ===== INVESTIGATE another player ===== */
function claimOf(owner,i){ const c=(SSTATE&&SSTATE.claims)||{}; return c[owner+'_'+i]||null; }
function renderInv(id){
  const my = me() ? byId(me()) : null; const t = byId(id);
  if(!t) return renderHome(); if(!my){ location.hash='#/pick/'+id; return renderPin(id); }
  if(t.id===my.id){ location.hash='#/me/clues'; return renderMe('clues'); }
  setMode('inv');
  const ts = tokenState();
  const mine = ts.acq.filter(a=>a.o===t.id).map(a=>a.i);
  const recvd = store.get(K('recv'),[]).concat(sharedForMe()).filter(a=>a.o===t.id).map(a=>a.i);
  $('#app').innerHTML = `
  ${topbar(t.name+' 조사','#/',`<span class="act tok">🪙 ${ts.left}</span>`)}
  ${modebar('inv', my.name+'의 토큰으로 '+t.name+'의 단서를 열어봅니다')}
  <main class="wrap">
    <div class="doc invhead">
      <img src="${img('photo_'+t.id)}" alt="">
      <div><div class="nm">${esc(t.name)}</div><div class="meta">${esc(t.group)} · ${esc(t.title)}</div>${fBadge(t.faction)}
        <div class="small" style="margin-top:6px">공개 알리바이: “${esc(t.alibi)}”</div></div>
    </div>
    <div class="tokbar"><div><div class="lbl">내 조사 토큰 (${esc(my.name)})</div><div class="mono" style="font-size:12px;color:var(--dim)">${ts.left>0?`남은 토큰 ${ts.left}개 · 1장 개봉에 1개`:'토큰 없음 · '+nextTokenHint()}</div></div>
      <div class="coins" id="coins">${Array.from({length:ts.total},(_,i)=>`<span class="coin ${i<ts.left?'':'ghost'}">T</span>`).join('')}</div></div>
    ${SYNC?`<p class="hint" style="color:var(--dim)">한 단서는 <b>한 사람만</b> 조사할 수 있습니다. 이미 조사된 단서는 그 사람에게 공유받아야 볼 수 있습니다.</p>`:''}
    ${t.clues.map((c,i)=>{ const cl=claimOf(t.id,i); const takenByOther = cl && cl.by!==my.id && !mine.includes(i);
      if(mine.includes(i)) return clueCard(t,c,i,{id:'clue-'+i, foot:`<div class="cf"><span class="small">내가 조사한 단서 · 내 획득 단서에 보관됨</span></div>`});
      if(recvd.includes(i)) return clueCard(t,c,i,{id:'clue-'+i, foot:`<div class="cf"><span class="small">공유받은 단서</span></div>`});
      if(takenByOther) return `<div class="clue sealedc taken" id="clue-${i}">
          <div class="ch"><b>조사 완료된 단서</b><span class="ev">${esc(t.name)} · ${i+1}/3</span></div>
          <div class="sealface"><div><div class="seal gray">TAKEN</div><p><b>${esc(byId(cl.by)?.name||'다른 플레이어')}</b> 님이 먼저 조사했습니다</p></div></div>
          <div class="cf" style="padding-top:12px"><span class="small">공유받아야 볼 수 있습니다 (토큰으로 열 수 없음)</span></div></div>`;
      return `<div class="clue sealedc" id="clue-${i}">
          <div class="ch"><b>봉인된 단서</b><span class="ev">${esc(t.name)} · ${i+1}/3</span></div>
          <div class="sealface"><div><div class="seal ${ts.left>0?'blink':''}">SEALED</div><p>${ts.left>0?'내 토큰 1개로 열어볼 수 있습니다':'토큰이 없습니다'}</p></div></div>
          <div class="cf" style="padding-top:12px"><span class="small">열면 내 획득 단서에 남습니다</span><button class="btn inv sm" ${ts.left>0?'':'disabled style="opacity:.4"'} onclick="investigate('${t.id}',${i})">🪙 토큰 1개로 열기</button></div>
        </div>`; }).join('')}
    <p class="hint" style="color:var(--dim)">상대 화면에는 아무 표시도 남지 않습니다. 열어본 내용을 말로 공개할지는 내 선택입니다.</p>
  </main>`;
}
async function investigate(ownerId, i){
  const ts = tokenState(); if(ts.left<=0) return;
  const btn = document.querySelector(`#clue-${i} .btn`); if(btn){ btn.disabled=true; btn.textContent='확인 중…'; }
  if(SYNC){
    const ok = await sclaim(`claims/${ownerId}_${i}`, {by:me(), at:Date.now()});
    if(!ok){ await pollOnce(); renderInv(ownerId); const el=$('#clue-'+i); if(el){ el.classList.add('shake'); } return; }
  }
  const coins = document.querySelectorAll('#coins .coin:not(.ghost)');
  const coin = coins[coins.length-1]; if(coin) coin.classList.add('fly');
  tearEnvelope(i, ()=>{
    const acq = store.get(K('acq'), []); if(!acq.some(a=>a.o===ownerId&&a.i===i)) acq.push({o:ownerId,i,at:new Date().toTimeString().slice(0,5)}); store.set(K('acq'), acq);
    renderInv(ownerId);
    const el=$('#clue-'+i); if(el){ el.classList.add('reveal'); el.scrollIntoView({behavior:'smooth',block:'center'}); }
  });
}
function openZoom(src){ $('#zoomimg').src=src; $('#zoom').classList.add('on'); }
function closeZoom(){ $('#zoom').classList.remove('on'); }

