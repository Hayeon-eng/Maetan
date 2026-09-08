/* ===== MEMO ===== */
const SLOTS = ['18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:15','21:30','21:45','22:00','22:15','22:30','23:00'];
function paneMemo(ch){
  const m = store.get(K('memo'), {text:'', slots:{}, at:null});
  return `<p class="hint">다른 사람의 진술에서 걸리는 부분을 적고 <b>저장</b>을 누르세요.</p>
  <div class="tgrid"><div class="h">TIME</div><div class="h">누가 · 어디서 · 무엇을 (다른 사람 진술)</div>
  ${SLOTS.map(s=>`<div class="tt">${s}</div><input data-slot="${s}" value="${esc(m.slots[s]||'')}">`).join('')}</div>
  <h3 class="subh">자유 메모</h3>
  <textarea class="memo" id="memotext" placeholder="가설, 질문할 것, 의심 포인트…">${esc(m.text)}</textarea>
  <div class="savebar"><span class="st" id="memost">${m.at?'저장됨 · '+m.at:'저장된 메모 없음'}</span>
    <span><button class="btn ghost sm" onclick="clearMemo()">지우기</button> <button class="btn sm" onclick="saveMemo()">저장</button></span></div>`;
}
function bindMemo(){ document.querySelectorAll('.tgrid input, #memotext').forEach(el=>el.addEventListener('input', ()=>{ const s=$('#memost'); if(s){ s.textContent='저장되지 않은 변경'; s.className='st dirty'; } })); }
function saveMemo(){
  const slots={}; document.querySelectorAll('.tgrid input').forEach(i=>{ if(i.value) slots[i.dataset.slot]=i.value; });
  const at = new Date().toTimeString().slice(0,5);
  store.set(K('memo'),{text:$('#memotext').value, slots, at});
  const s=$('#memost'); s.textContent='저장됨 · '+at; s.className='st';
}
function clearMemo(){ if(confirm('메모를 모두 지울까요?')){ store.set(K('memo'),{text:'',slots:{},at:null}); renderMe('memo'); } }

/* ===== DEDUCTION ===== */
function ded(){ return store.get(K('ded'), {a1:'',a2c:'',a2m:'',a3p:'',a3t:'',a4:'',submitted:false,grade:{},graded:false}); }
function paneDeduce(ch){
  const d = ded(); const endingOpen = !!roundsOpen().ending;
  const sel = (name,val,ph) => `<select name="${name}" ${d.submitted?'disabled':''}><option value="">${ph}</option>${CHARS.map(c=>`<option value="${c.id}" ${val===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>`;
  const ta = (name,val) => d.submitted ? `<div class="ans ${val?'':'empty'}">${esc(val||'(미작성)')}</div>` : `<textarea name="${name}" placeholder="답을 적으세요">${esc(val)}</textarea>`;
  let html = `
  ${d.submitted?`<div class="locked-note"><span>제출 완료 · 수정 불가</span><button class="btn ghost sm" onclick="unsubmit()">수정하기</button></div>`:`<p class="hint">FINAL에 네 항목을 적고 <b>제출</b>을 누르세요. 제출 후에는 잠기며, 엔딩 코드가 열리면 아래에서 직접 채점합니다.</p>`}
  <div class="panel">
    <div class="fld"><label>1. 사망 원인과 사건의 방식</label>${ta('a1',d.a1)}</div>
    <div class="fld"><label>2. 실제 범인</label>${sel('a2c',d.a2c,'범인을 선택')}</div>
    <div class="fld"><label>2. 동기</label>${ta('a2m',d.a2m)}</div>
    <div class="fld"><label>3. 비밀을 밝혀낸 플레이어</label>${sel('a3p',d.a3p,'플레이어를 선택')}</div>
    <div class="fld"><label>3. 그 플레이어의 비밀</label>${ta('a3t',d.a3t)}</div>
    <div class="fld"><label>4. 치킨 3000마리 횡령 사건의 비밀</label>${ta('a4',d.a4)}</div>
    ${d.submitted?'':`<div style="text-align:right"><button class="btn" onclick="submitDed()">제출</button></div>`}
  </div>`;
  if(d.submitted){
    html += endingOpen
      ? `<a class="rowbtn grade" href="#/grade" style="margin-top:4px"><div><b>✅ 채점하기</b><span>엔딩이 열렸습니다. 채점 화면으로 이동합니다.</span></div><span class="chev">›</span></a>`
      : `<div class="panel c-amb"><h3>다음 단계</h3><p style="margin:0;font-size:15px">모두 제출한 뒤 진행자가 엔딩 코드를 알려주면 <a href="#/ending" style="color:var(--red)">엔딩북</a>이 열리고, 홈의 <b>✅ 채점하기</b>에서 채점합니다.</p></div>`;
  }
  return html;
}
function bindDeduce(){ document.querySelectorAll('#pane textarea, #pane select').forEach(el=>el.addEventListener('input', ()=>{ const d=ded(); d[el.name]=el.value; store.set(K('ded'), d); })); }
function submitDed(){ const d=ded(); if(!d.a2c){ alert('2번 범인을 선택하세요.'); return; } if(!confirm('제출하면 수정이 잠깁니다. 제출할까요?')) return; d.submitted=true; store.set(K('ded'),d); renderMe('deduce'); }
function unsubmit(){ if(confirm('제출을 취소하고 수정할까요? (채점 내용도 지워집니다)')){ const d=ded(); d.submitted=false; d.graded=false; d.grade={}; store.set(K('ded'),d); renderMe('deduce'); } }
function scoreOf(d){
  const R = HOST_RUBRIC; const g = d.grade||{};
  const n = k => (g[k]||[]).filter(Boolean).length;
  const culpritOk = d.a2c && byId(d.a2c)?.name===R[1].culprit;
  const s1 = n('c0')>=1?1:0;
  const s2 = culpritOk ? 1 : 0;            // 범인 이름만 맞으면 정답
  const s3 = n('c2')>=1?1:0;
  const s4 = n('c3')>=1?1:0;
  const total = s1+s2+s3+s4;
  // 엔딩 분기: PERFECT 4/4 · TRUE 범인+2개↑ · NORMAL 범인만 · BAD 범인 못맞힘
  let label = 'bad';
  if(!culpritOk) label='bad';
  else if(total===4) label='perfect';
  else if(total>=3) label='true';
  else label='normal';
  return {s:[s1,s2,s3,s4], total, label, culpritOk};
}
function renderGrade(){
  const ch = me() ? byId(me()) : null; if(!ch){ location.hash='#/'; return renderHome(); }
  setMode('grade');
  const d = ded(); const endingOpen = !!roundsOpen().ending;
  let body;
  if(!d.submitted){
    body = `<div class="gate"><h2 style="margin:0 0 8px">아직 제출한 추리가 없습니다</h2><p style="font-family:var(--mono);color:var(--dim);font-size:13px;margin-bottom:14px">FINAL에 네 항목을 적고 제출한 뒤 채점할 수 있습니다.</p><a class="btn" href="#/me/deduce">추리 탭으로</a></div>`;
  } else if(!endingOpen){
    body = `<div class="gate"><div class="seal" style="display:inline-block;transform:rotate(-8deg);color:var(--red);border:3px solid var(--red);border-radius:6px;padding:4px 14px;font-weight:900;letter-spacing:.2em;margin-bottom:10px">SEALED</div>
      <h2 style="margin:0 0 6px">엔딩 코드</h2><div class="gmsg" id="gmsg">모두 제출한 뒤 진행자가 알려줍니다. 코드를 넣으면 엔딩북이 열리고 채점이 시작됩니다.</div>
      <div class="pinrow"><input id="pin" type="tel" inputmode="numeric" maxlength="4" placeholder="····"></div><button class="btn" onclick="tryEndingFromGrade()">개봉</button></div>`;
  } else if(!d.graded){
    body = gradeForm(d);
  } else {
    body = gradeResult(ch, d);
  }
  $('#app').innerHTML = `${topbar('최종 채점 · '+ch.name,'#/')}${modebar('grade', ch.name+'의 답안을 정답과 대조합니다')}<main class="wrap" style="padding-top:16px">${body}</main>`;
  if(!d.submitted || endingOpen) return;
  const inp=$('#pin'); if(inp){ inp.focus(); inp.addEventListener('input',()=>{ if(inp.value.length===4) tryEndingFromGrade(); }); inp.addEventListener('keydown',e=>{ if(e.key==='Enter') tryEndingFromGrade(); }); }
}
function tryEndingFromGrade(){ if($('#pin').value.trim()===META.roundCodes.ending){ const r=store.get('rounds',{}); r.ending=true; store.set('rounds',r); renderGrade(); } else { const m=$('#gmsg'); m.className='gmsg err'; m.textContent='코드가 맞지 않습니다'; $('#pin').value=''; } }
function gradeForm(d){
  const R = HOST_RUBRIC; const g = d.grade||{}; const sc = scoreOf(d);
  const box = (k,i,txt) => `<label class="chk"><input type="checkbox" data-k="${k}" data-i="${i}" ${(g[k]||[])[i]?'checked':''}><span>${esc(txt)}</span></label>`;
  const myAns = {0:d.a1, 1:(d.a2c?byId(d.a2c).name+' · ':'')+d.a2m, 2:(d.a3p?byId(d.a3p).name+' · ':'')+d.a3t, 3:d.a4};
  return `<div class="gintro"><b>이렇게 채점하세요</b><br>① 항목마다 내가 쓴 답이 위에 보여요.<br>② 아래 정답 목록 중 <b>내 답에 있는 것</b>에 체크하세요.<br>③ <b>하나만 맞아도 그 항목은 정답</b>이에요.<br>정답 전체 이야기는 <a href="#/ending" style="color:var(--amber)">엔딩북</a>에 있어요.</div>
  ${R.map((r,k)=>`<div class="gstep">
    <div class="gh"><span class="gn">${k+1}</span><b>${esc(r.item.replace(/^\d+\.\s*/,''))}</b><span class="gpt" id="gpt${k}">${sc.s[k]}</span></div>
    <div class="myans"><label>✍️ 내가 쓴 답</label><div>${esc(myAns[k]||'(미작성)')}</div></div>
    ${k===1?`<div class="key">진짜 범인은 <b>${esc(r.culprit)}</b>. 내가 고른 사람은 <b>${d.a2c?esc(byId(d.a2c).name):'(없음)'}</b> → ${sc.culpritOk?'<span style="color:var(--han)">맞았어요 ✅</span>':'<span style="color:var(--red)">틀렸어요 (범인을 못 맞히면 BAD END)</span>'}</div>`:''}
    <div class="qlabel">내 답에 있는 내용 체크 (1개만 맞아도 정답)</div>
    <div class="checks">${r.checks.map((c,i)=>box('c'+k,i,c)).join('')}</div>
    <div class="itemscore">${sc.s[k]?'✅ 이 항목 정답':'아직 체크 안 됨 (하나만 맞아도 정답)'}</div>
  </div>`).join('')}
  <div style="text-align:center;margin:18px 0 6px"><button class="btn big" onclick="finishGrade()">내 엔딩 확인하기</button></div>`;
}
function gradeResult(ch, d){
  const sc = scoreOf(d);
  const lbl = {perfect:'PERFECT END',true:'TRUE END',normal:'NORMAL END',bad:'BAD END'}[sc.label];
  const sub = {perfect:'네 가지 진실을 모두 밝혀냈습니다. 완벽한 해결.',true:'범인을 지목하고 진실 대부분을 밝혔습니다.',normal:'범인은 맞혔지만 사건의 전모까지는 닿지 못했습니다.',bad:'범인을 놓쳤습니다. 진범은 유유히 회사를 빠져나갔습니다…'}[sc.label];
  return `<div class="result big-result ${sc.label}">
      <div class="rstamp">${sc.label==='bad'?'CASE OPEN':'CASE CLOSED'}</div>
      <div class="who">${esc(ch.name)}</div>
      <div class="big ${sc.label}">${lbl}</div>
      <div class="sc">맞힌 진실 ${sc.total} / 4</div>
      <p class="sub">${sub}</p>
      <div class="bars">${HOST_RUBRIC.map((r,k)=>`<div class="bar-row"><span>${esc(r.item)}</span><i class="v${String(sc.s[k]).replace('.','_')}"></i><b>${sc.s[k]?'○':'×'}</b></div>`).join('')}</div>
    </div>
    <div class="panel">
      ${SYNC? `<div class="autosent ${store.get(K('autosent'))?'ok':''}">${store.get(K('autosent'))?'✅ 진행자에게 자동 전송되었습니다':'⏳ 진행자에게 전송 중… (실패 시 아래 버튼으로 보내세요)'}</div>`:''}
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn big" style="flex:1;background:var(--red)" onclick="shareSub()">📨 ${SYNC?'카톡으로도 보내기':'진행자에게 결과 보내기'}</button><button class="btn ghost sm" onclick="unGrade()">채점 수정</button></div>
      <p class="small" style="margin:10px 0 0">버튼을 누르면 내 이름·판정·점수·답안이 적힌 메시지가 만들어지고 공유 창(카톡 등)이 열립니다. 진행자에게 보내면 됩니다. 메시지 맨 아래 한 줄은 진행자 집계용 코드입니다.</p></div>
    <a class="rowbtn" href="#/ending"><div><b>📖 엔딩북 다시 보기</b></div><span class="chev">›</span></a>
    ${(SSTATE&&SSTATE.finale)? `<button class="rowbtn finale" onclick="playFinale()"><div><b>🎬 최종 연출 보기</b><span>진행자가 최종 연출을 시작했습니다</span></div><span class="chev">›</span></button>`:'<p class="hint" style="text-align:center">진행자가 최종 연출을 시작하면 여기에서 볼 수 있습니다.</p>'}`;
}
/* ===== FINALE (각자 폰, 범인 정답/오답 분기) ===== */
function allResults(){
  // {id: {caught:bool}} — 동기화된 제출 + 내 로컬
  const map={};
  const subs=(SSTATE&&SSTATE.subs)||{};
  Object.values(subs).forEach(v=>{ if(v&&v.id) map[v.id]={caught: byId(v.a2c)?.name===HOST_RUBRIC[1].culprit}; });
  const meId=me(); if(meId){ const d=ded(); if(d.graded){ map[meId]={caught: scoreOf(d).culpritOk}; } }
  return map;
}
function weaveNames(ids){
  const nm=ids.map(id=>byId(id)?.name).filter(Boolean);
  if(nm.length===0) return '';
  if(nm.length===1) return nm[0];
  if(nm.length===2) return nm[0]+'와 '+nm[1];
  return nm.slice(0,-1).join(', ')+', 그리고 '+nm[nm.length-1];
}
function playFinale(){
  const d = ded(); const sc = scoreOf(d); const caught = sc.culpritOk;
  const culprit = CHARS.find(c=>c.name===HOST_RUBRIC[1].culprit) || byId('hyunsun');
  const st = (ENDING.stories && ENDING.stories[sc.label]) || {tag:'',head:[],tail:[],winLead:'',loseLead:''};
  const endName = {perfect:'PERFECT END',true:'TRUE END',normal:'NORMAL END',bad:'BAD END'}[sc.label];
  // 전원 결과로 승진/좌천 분기
  const res = allResults();
  const winners = Object.keys(res).filter(id=>res[id].caught);
  const losers  = Object.keys(res).filter(id=>!res[id].caught);
  const paras = [];
  st.head.forEach(l=>paras.push({t:l}));
  // 승진조
  if(winners.length){
    paras.push({t: st.winLead, cls:'lead win'});
    winners.forEach(id=>{ if(FATE[id]) paras.push({t: FATE[id][0], cls:'fate win', me: id===me()}); });
  }
  // 좌천조
  if(losers.length){
    paras.push({t: st.loseLead, cls:'lead lose'});
    losers.forEach(id=>{ if(FATE[id]) paras.push({t: FATE[id][1], cls:'fate lose', me: id===me()}); });
  }
  if(!winners.length && !losers.length){ paras.push({t:'(다른 참가자들의 채점이 아직 모이지 않았습니다. 잠시 후 다시 열면 모두의 결말이 이어집니다.)', cls:'muted'}); }
  // 이연규(불참) 후일담 + 조사자 크레딧
  if(st.yeongyuCarrier || st.yeongyuEpi){
    const claims=(SSTATE&&SSTATE.claims)||{};
    const carriers=[...new Set([0,1,2].map(i=>claims['yeongyu_'+i]?.by).filter(Boolean))];
    // 내가 조사했으면 로컬도 반영
    const myAcqY = me()? store.get(K('acq'),[]).some(a=>a.o==='yeongyu') : false;
    if(myAcqY && !carriers.includes(me())) carriers.push(me());
    if(st.yeongyuCarrier && carriers.length){
      const who = weaveNames(carriers);
      const mine = carriers.includes(me());
      paras.push({t: st.yeongyuCarrier.replace('{who}', who), cls:'fate '+(sc.culpritOk?'win':'lose'), me: mine});
    }
    if(st.yeongyuEpi) paras.push({t: st.yeongyuEpi, cls:'yeon'});
  }
  st.tail.forEach(l=>paras.push({t:l}));
  const el=document.createElement('div'); el.className='finale'+(caught?' win':' lose'); el.id='finale';
  el.innerHTML = `
    <div class="bars-anim" aria-hidden="true">${Array.from({length:9},()=>'<i></i>').join('')}</div>
    <div class="fstage">
      <div class="fline1">${caught?'용의자 검거':'미제 사건'}</div>
      <div class="fspot">
        <div class="mug"><img src="${img('photo_'+culprit.id)}" alt=""><div class="board">${caught?'GUILTY':'ESCAPED'}</div></div>
      </div>
      <div class="fname">진짜 범인 — ${esc(culprit.name)}</div>
      <div class="fend ${sc.label}">${endName} · ${esc(st.tag)}</div>
      <div class="fstory">${paras.map(p=>`<p class="${p.cls||''}${p.me?' mine':''}">${esc(p.t)}${p.me?' <span class="you">← 나</span>':''}</p>`).join('')}</div>
      <div class="fmeta">범인 지목 성공 ${winners.length}명 · 실패 ${losers.length}명</div>
      <button class="btn" onclick="document.getElementById('finale').remove()">닫기</button>
    </div>`;
  document.body.appendChild(el);
  if(navigator.vibrate) try{ navigator.vibrate(caught?[120,60,120,60,240]:[300]); }catch(e){}
  requestAnimationFrame(()=>el.classList.add('go'));
}
document.addEventListener('change', e=>{
  const t=e.target; if(t.matches && t.matches('.chk input')){ const d=ded(); d.grade[t.dataset.k]=d.grade[t.dataset.k]||[]; d.grade[t.dataset.k][+t.dataset.i]=t.checked; store.set(K('ded'),d); const sc=scoreOf(d); sc.s.forEach((v,k)=>{ const el=$('#gpt'+k); if(el) el.textContent=v; }); }
});
function finishGrade(){ const d=ded(); d.graded=true; store.set(K('ded'),d); renderGrade(); autoSubmit().then(()=>{ if(location.hash==='#/grade') renderGrade(); }); }
async function autoSubmit(){ if(!SYNC||!me()) return; const ch=byId(me()); const d=ded(); const sc=scoreOf(d); const ok=await sput(`subs/${ch.id}`, {id:ch.id,n:ch.name,a1:d.a1,a2c:d.a2c,a2m:d.a2m,a3p:d.a3p,a3t:d.a3t,a4:d.a4,s:sc.s,t:sc.total,l:sc.label,at:new Date().toISOString().slice(0,16)}); store.set(K('autosent'), ok); }
function unGrade(){ const d=ded(); d.graded=false; store.set(K('ded'),d); renderGrade(); }
function b64e(s){ return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function encodeSub(ch,d,sc){ return 'MM36:'+b64e(JSON.stringify({id:ch.id, n:ch.name, a1:d.a1, a2c:d.a2c, a2m:d.a2m, a3p:d.a3p, a3t:d.a3t, a4:d.a4, s:sc.s, t:sc.total, l:sc.label, at:new Date().toISOString().slice(0,16)})); }
async function shareSub(){
  const ch=byId(me()); const d=ded(); const sc=scoreOf(d); const nm=id=>byId(id)?.name||'-';
  const lbl = {perfect:'PERFECT SOLVE',true:'TRUE END',fail:'미해결'}[sc.label];
  const text = `[매탄동 최종 추리] ${ch.name} — ${lbl} (${sc.total}/4)
1. 사망 원인·방식: ${d.a1||'(미작성)'}
2. 범인: ${nm(d.a2c)} / 동기: ${d.a2m||'(미작성)'}
3. ${nm(d.a3p)}의 비밀: ${d.a3t||'(미작성)'}
4. 치킨 사건: ${d.a4||'(미작성)'}
항목 점수 [${sc.s.join(' · ')}]
(집계코드) ${encodeSub(ch,d,sc)}`;
  try{ if(navigator.share){ await navigator.share({text}); return; } }catch(e){}
  try{ await navigator.clipboard.writeText(text); alert('결과가 복사되었습니다. 진행자와의 채팅에 붙여넣어 보내세요.'); }catch(e){ prompt('아래 내용을 복사해 진행자에게 보내세요', text); }
}

