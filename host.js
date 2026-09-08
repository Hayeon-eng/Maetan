const GAME = (new URLSearchParams(location.search).get('g')||'v5').replace(/[^A-Za-z0-9]/g,'').slice(0,12) || 'v5';
const mem = {};
const NOPERSIST = new Set(['ok']);   // 잠금 상태는 저장하지 않음 → 열 때마다 번호 입력
const store = {
  get(k, d){ if(NOPERSIST.has(k)) return mem[k]??d; try{ const v = localStorage.getItem('mm36h:'+k); return v===null? (mem[k]??d) : JSON.parse(v);}catch(e){ return mem[k]??d; } },
  set(k, v){ mem[k]=v; if(NOPERSIST.has(k)) return; try{ localStorage.setItem('mm36h:'+k, JSON.stringify(v)); }catch(e){} }
};
const img = k => !IMG[k] ? '' : (IMG[k].startsWith('img/') ? IMG[k] : `data:image/jpeg;base64,${IMG[k]}`);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = sel => document.querySelector(sel);
CHARS.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
const byId = id => CHARS.find(c=>c.id===id);
function acc(title, body, open, id){ return `<div class="acc ${open?'open':''}" ${id?`id="${id}"`:''}><button onclick="this.parentNode.classList.toggle('open')"><span>${title}</span><span class="chev">›</span></button><div class="body">${body}</div></div>`; }
function topbar(title, act){ return `<header class="top"><div class="wrap"><div class="ttl">${esc(title)}</div>${act||''}</div></header>`; }
window.addEventListener('DOMContentLoaded', ()=>{ render(); startSync(3000); });
onSync(()=>{ if(store.get('ok',false)){ const el=document.getElementById('live'); if(el) el.innerHTML=liveBoard(); const s=document.getElementById('subsbody'); if(s) s.innerHTML=hostSubs(); const rk=document.getElementById('rankbody'); if(rk) rk.innerHTML=hostRanking(); } });

function render(){
  document.body.dataset.mode='host';
  if(!store.get('ok', false)){
    $('#app').innerHTML = `${topbar('진행자 전용')}<main class="wrap"><div class="gate">
      <h2 style="margin:0 0 6px">진행자 번호</h2><div class="gmsg" id="gmsg">열 때마다 번호를 입력합니다. 화면을 닫으면 자동으로 잠깁니다.</div>
      <div class="pinrow"><input id="pin" type="tel" inputmode="numeric" maxlength="${META.hostPin.length}" placeholder="${'·'.repeat(META.hostPin.length)}"></div>
      <button class="btn" onclick="tryHost()">열기</button></div></main>`;
    const inp=$('#pin'); inp.focus(); inp.addEventListener('input',()=>{ if(inp.value.length===META.hostPin.length) tryHost(); }); inp.addEventListener('keydown',e=>{ if(e.key==='Enter') tryHost(); });
    return;
  }
  const rc = META.roundCodes;
  $('#app').innerHTML = `
  ${topbar('진행자 전용', `<button class="act" onclick="store.set('ok',false);render()">잠금</button>`)}
  <div class="modebar host"><span class="ic">🎬</span><b>FACILITATOR ONLY</b><span class="tx">플레이어에게 이 화면을 보이지 마세요</span></div>
  <main class="wrap" style="padding-top:16px">
    ${SYNC? acc('라운드 진행 · 실시간', `<div id="live">${liveBoard()}</div>`, true)
          : `<div class="warn">실시간 동기화가 꺼져 있습니다(data/config.js의 SYNC_URL 미설정). 라운드 코드 방식으로 진행하며, 제출 결과는 카톡 메시지로 받습니다.</div>`}
    ${acc('코드 한눈에 보기', `<table class="pinlist">
      <tr><td>ROUND 1 · 현장 구조도 + 발견 브리핑</td><td></td><td>${rc.r1}</td></tr>
      <tr><td>ROUND 2 · 1차 감식 <span class="small">플레이어 토큰 +1</span></td><td></td><td>${rc.r2}</td></tr>
      <tr><td>ROUND 3 · 공식 부검 <span class="small">토큰 +1</span></td><td></td><td>${rc.r3}</td></tr>
      <tr><td>ROUND 4 · 지하 2층 회수 <span class="small">토큰 +1</span></td><td></td><td>${rc.r4}</td></tr>
      <tr><td>FINAL · 조건부 로그</td><td class="small">막혔을 때만</td><td>${rc.final}</td></tr>
      <tr><td><b>엔딩 코드</b></td><td class="small">전원 제출 후</td><td><b>${rc.ending}</b></td></tr></table>
      <p class="hint">플레이어는 공용 자료 › 진행자 공개 단서에서 코드를 입력합니다. 엔딩 코드는 홈 › 엔딩북 또는 채점하기에서 입력합니다.</p>`)}
    ${acc('라운드 타이머', `<div class="timer"><div class="tdisp mono" id="tdisp">25:00</div>
      <div class="tbtns">${[15,20,25].map(m=>`<button class="btn ghost sm" onclick="setTimer(${m})">${m}분</button>`).join('')} <button class="btn sm" onclick="toggleTimer()" id="tgo">시작</button></div>
      <p class="hint">권장: 시작 15 · R1 20 · R2 25 · R3 25 · R4 25 · FINAL 15 · 엔딩 15 (총 140분). 0이 되면 화면이 깜빡입니다.</p></div>`)}
    ${acc('최종 추리 제출 현황', `<div id="subsbody">${hostSubs()}</div>`, false, 'acc-subs')}
    ${acc('점수 랭킹 (공용 화면용)', `<div id="rankbody">${hostRanking()}</div>`, false, 'acc-rank')}
    ${acc('라운드 카드 · 내용', HOST_CARDS.map(c=>`<div class="env open ${c.key==='final'?'final':''}"><div class="hh"><span>${esc(c.round)} · <b>${esc(c.title)}</b></span><span class="code">${rc[c.key]}</span></div><img src="${img(c.img)}" alt="" onclick="openZoom(this.src)"><div class="ht">${esc(c.text)}</div></div>`).join(''))}
    ${acc('캐릭터 번호(PIN) 목록', `<p class="hint">번호는 무작위 2자리입니다. 배정한 플레이어에게만 개별로 알려주세요. 진행자 번호는 ${META.hostPin}.</p><table class="pinlist">${CHARS.map(ch=>`<tr><td>${esc(ch.name)}</td><td class="small">${esc(ch.group)}</td><td>${ch.pin}</td></tr>`).join('')}</table>`)}
    ${acc('세팅 · 시작 전 5분 체크', `<dl class="kv">${HOST.setup.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
    ${acc('라운드별 진행 가이드', `<dl class="kv">${HOST.roundGuide.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
    ${acc('마스터 타임라인 · 실제로 일어난 일', `<ul class="tl">${HOST.masterTimeline.map(([t,d])=>`<li><div class="t">${esc(t)}</div><div class="d">${esc(d)}</div></li>`).join('')}</ul>`)}
    ${acc('추리 경로 · 핵심 진실별 두 갈래', `<dl class="kv">${HOST.cluePaths.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
    ${acc('채점 기준 · TRUE END 판정', `<dl class="kv">${HOST.judging.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
    ${acc('9~12인 조정', `<dl class="kv">${HOST.playerCount.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
    ${acc('게임 초기화 · 새 게임 시작', `<p class="hint">서버가 없어 플레이어 폰을 원격으로 지울 수는 없습니다. 대신 <b>새 게임 코드</b>가 붙은 링크를 배포하면, 그 링크로 여는 모든 폰이 깨끗한 상태로 시작합니다. (이전 링크의 기록은 남지만 새 링크에는 영향이 없습니다.)</p>
      <div class="panel"><h3>플레이어용 링크</h3><div class="codebox" id="glink">${esc(playerLink())}</div>
        ${SYNC?`<p class="small" style="margin:8px 0 0">진행자도 같은 게임 코드로 열어야 합니다: <a href="${esc(hostLink())}" style="color:var(--red)">${esc(hostLink())}</a></p>`:''}
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><button class="btn ghost sm" onclick="copyText(document.getElementById('glink').textContent)">링크 복사</button><button class="btn sm" onclick="newGame()">새 게임 코드 만들기</button></div></div>
      <div class="panel c-red"><h3>전체 초기화</h3><p style="margin:0 0 8px;font-size:14px">${SYNC?'진행자 데이터와 <b>모든 플레이어 폰</b>을 초기화합니다(플레이어는 새로고침 시 적용).':'진행자 데이터(제출·타이머·라운드)를 지웁니다. 동기화가 꺼져 있어 플레이어 폰은 각자 초기화해야 합니다.'}</p><button class="btn" style="background:var(--red)" onclick="resetHost()">전체 초기화</button></div>
      <div class="panel"><h3>플레이어 개별 초기화</h3><p style="margin:0;font-size:14px">각 플레이어도 홈 맨 아래 <b>이 기기 데이터 초기화</b>로 자기 폰만 지울 수 있습니다.</p></div>`)}
    ${acc('엔딩북', `<div class="ending">${HOST.ending.truths.map(([k,v])=>`<div class="panel c-red"><h3>${esc(k)}</h3><p style="margin:0;font-size:15px">${esc(v)}</p></div>`).join('')}${HOST.ending.deep.map(([k,v])=>`<div class="panel c-mou"><h3>${esc(k)}</h3><p style="margin:0;font-size:15px">${esc(v)}</p></div>`).join('')}<div class="panel"><h3>각 인물의 밤</h3><dl class="kv">${HOST.ending.aftermath.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div></div>`)}
    <p class="foot">${esc(META.version)} · HOST</p>
  </main>`;
  tickTimerUI();
}
function tryHost(){ if($('#pin').value.trim()===META.hostPin){ store.set('ok',true); render(); } else { const m=$('#gmsg'); m.className='gmsg err'; m.textContent='번호가 맞지 않습니다'; $('#pin').value=''; } }
function openZoom(src){ $('#zoomimg').src=src; $('#zoom').classList.add('on'); }
function closeZoom(){ $('#zoom').classList.remove('on'); }

/* timer */
let tEnd = store.get('tEnd', null), tLeft = store.get('tLeft', 25*60), tInt;
function setTimer(m){ tLeft=m*60; tEnd=null; store.set('tEnd',null); store.set('tLeft',tLeft); tickTimerUI(); }
function toggleTimer(){ if(tEnd){ tLeft=Math.max(0,Math.round((tEnd-Date.now())/1000)); tEnd=null; } else { tEnd=Date.now()+tLeft*1000; } store.set('tEnd',tEnd); store.set('tLeft',tLeft); tickTimerUI(); }
function tickTimerUI(){
  clearInterval(tInt);
  const upd=()=>{ const el=$('#tdisp'); if(!el) return clearInterval(tInt);
    const left = tEnd? Math.max(0,Math.round((tEnd-Date.now())/1000)) : tLeft;
    el.textContent = String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
    el.classList.toggle('over', tEnd && left===0); $('#tgo').textContent = tEnd?'일시정지':'시작'; };
  upd(); tInt=setInterval(upd, 500);
}

/* submissions */
function b64d(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; return decodeURIComponent(escape(atob(s))); }
function decodeSubs(txt){ const out=[]; (txt.match(/MM36:[A-Za-z0-9_\-]+/g)||[]).forEach(c=>{ try{ out.push(JSON.parse(b64d(c.slice(5)))); }catch(e){} }); return out; }
function hostRanking(){
  const subs=Object.assign({}, store.get('subs',{}), (SSTATE&&SSTATE.subs)||{});
  const rows=Object.values(subs).filter(s=>s.t!=null).map(s=>({name:s.n,t:s.t,l:s.l})).sort((a,b)=>b.t-a.t);
  if(!rows.length) return '<p class="small">아직 채점 결과가 없습니다.</p>';
  const medal=i=>['🥇','🥈','🥉'][i]||`${i+1}`;
  const lbl={perfect:'PERFECT',true:'TRUE',normal:'NORMAL',bad:'BAD'};
  return `<div class="hostrank">${rows.map((r,i)=>`<div class="hr-row ${i===0?'top':''}"><span class="rk">${medal(i)}</span><span class="rn">${esc(r.name)}</span><span class="rl tag ${r.l}">${lbl[r.l]||''}</span><span class="rs">${r.t}/4</span></div>`).join('')}</div>`;
}
function hostSubs(){
  const subs = Object.assign({}, store.get('subs', {}), (SSTATE&&SSTATE.subs)||{}); const list = Object.values(subs);
  const lbl = l => ({perfect:'PERFECT',true:'TRUE END',fail:'미해결'}[l]||'-');
  const nm = id => byId(id)?.name || '-';
  return `<p class="hint">${SYNC?'실시간 동기화 중에는 플레이어가 채점을 확정하면 자동으로 표에 들어옵니다. 실패한 경우에만 아래에 메시지를 붙여넣으세요.':''} 플레이어가 채점 후 보낸 카톡 메시지를 <b>그대로</b> 붙여넣고 <b>반영</b>을 누르세요. 메시지 끝의 집계코드를 읽어 표에 넣습니다. 여러 명 것을 한 번에 붙여도 됩니다.</p>
  <textarea class="memo" id="subin" style="min-height:70px" placeholder="MM36:eyJpZCI6..."></textarea>
  <div style="text-align:right;margin:8px 0 14px"><button class="btn ghost sm" onclick="if(confirm('제출 현황을 모두 지울까요?')){store.set('subs',{});render();}">모두 지우기</button> <button class="btn sm" onclick="addSubs()">반영</button></div>
  ${list.length? `<table class="subs"><tr><th>플레이어</th><th>범인</th><th>점수</th><th>판정</th></tr>${list.map((s,i)=>`<tr onclick="const d=document.getElementById('sd${i}');d.style.display=d.style.display==='none'?'block':'none'"><td><b>${esc(s.n)}</b><div class="small">${esc(s.at||'')}</div></td><td>${esc(nm(s.a2c))} ${byId(s.a2c)?.name===HOST.rubric[1].culprit?'✓':'✗'}</td><td class="mono">${s.t==null?'-':s.t+'/4'}</td><td><span class="tag ${s.l}">${lbl(s.l)}</span></td></tr>
    <tr><td colspan="4" style="padding:0"><div class="subdetail" id="sd${i}" style="display:none">1. ${esc(s.a1||'(미작성)')}\n\n2. 범인 ${esc(nm(s.a2c))} · 동기: ${esc(s.a2m||'(미작성)')}\n\n3. ${esc(nm(s.a3p))}의 비밀: ${esc(s.a3t||'(미작성)')}\n\n4. ${esc(s.a4||'(미작성)')}${s.s?`\n\n항목 점수 [${s.s.join(' · ')}]`:''}</div></td></tr>`).join('')}</table>
    <p class="hint">행을 누르면 답안 전체가 펼쳐집니다. 집계: PERFECT ${list.filter(s=>s.l==='perfect').length} · TRUE END ${list.filter(s=>s.l==='true').length} · 미해결 ${list.filter(s=>s.l==='fail').length} / ${list.length}명</p>`
    : `<p class="small">아직 제출된 추리가 없습니다.</p>`}`;
}
function addSubs(){
  const arr = decodeSubs($('#subin').value); if(!arr.length){ alert('코드를 찾지 못했습니다. MM36: 으로 시작하는 문자열을 붙여넣어 주세요.'); return; }
  const subs = store.get('subs', {}); arr.forEach(s=>{ subs[s.id]=s; }); store.set('subs', subs); render(); const el=$('#acc-subs'); if(el){ el.classList.add('open'); el.scrollIntoView(); }
}

function playerLink(){ const g=store.get('game','') ; const base=location.href.replace(/[^\/]*$/,'')+'index.html'; return g? base+'?g='+g : base; }
function hostLink(){ const g=store.get('game',''); return g? location.href.split('?')[0]+'?g='+g : location.href.split('?')[0]; }
function newGame(){ const g=Math.random().toString(36).slice(2,6).toUpperCase(); store.set('game',g); if(SYNC) sput('', {round:'lobby'}); store.set('subs',{}); store.set('tEnd',null); store.set('tLeft',25*60); render(); const el=document.querySelectorAll('.acc'); el.forEach(a=>{ if(a.querySelector('button span')?.textContent.startsWith('게임 초기화')) a.classList.add('open'); }); alert('새 게임 코드 '+g+' 생성. 플레이어에게 새 링크를 공유하세요.'); }
async function resetHost(){
  if(!confirm('전체 초기화할까요?\n- 진행자: 제출 현황·타이머·라운드 리셋\n'+(SYNC?'- 모든 플레이어 폰: 다음 새로고침 때 캐릭터·토큰·단서·추리가 초기화됩니다':'- (동기화 꺼짐) 플레이어 폰은 각자 홈 맨 아래 초기화 버튼으로 지워야 합니다'))) return;
  store.set('subs',{}); store.set('tEnd',null); store.set('tLeft',25*60);
  if(SYNC){ await sput('', {round:'lobby', reset: Date.now()}); await pollOnce(); }
  render(); alert(SYNC? '초기화했습니다. 플레이어 폰은 화면을 새로고침하면 깨끗한 상태가 됩니다.' : '진행자 데이터를 초기화했습니다.');
}
async function copyText(t){ try{ await navigator.clipboard.writeText(t); alert('복사했습니다.'); }catch(e){ prompt('복사하세요', t); } }

/* ===== 실시간 진행 보드 ===== */
const RNAME = {lobby:'대기(시작 전)', r1:'ROUND 1', r2:'ROUND 2', r3:'ROUND 3', r4:'ROUND 4', final:'FINAL', ending:'ENDING'};
function liveBoard(){
  const st = SSTATE||{}; const cur = st.round||'lobby'; const idx=ROUND_ORDER.indexOf(cur);
  const next = ROUND_ORDER[idx+1];
  const claims = st.claims||{}; const shared = st.shared||{}; const subs = st.subs||{};
  const nm = id => byId(id)?.name||'?';
  const initials = id => nm(id).slice(0,1);
  const info = ROUND_INFO[cur]||ROUND_INFO.lobby;
  return `<div class="rb-nowbox ${cur}"><div class="rb-now">${info.n} · ${esc(info.title)}</div><div class="rb-desc">${esc(info.desc)}</div></div>
    <div class="livehead"><div><div class="lbl">현재 단계</div><div class="cur">${RNAME[cur]}</div></div>
      ${next? `<button class="btn big" onclick="advanceRound('${next}')">${cur==='lobby'?'ROUND 1 시작':(RNAME[cur]+' 종료 → '+RNAME[next]+' 시작')}</button>` : `<button class="btn big" style="background:var(--red)" onclick="startFinale()">🎬 최종 연출 시작(전원 폰)</button>`}
    </div>
    ${cur==='ending'? `<p class="hint">전원 채점이 끝나면 위 버튼을 누르세요. 각자 폰에서 범인 정답/오답에 따라 검거·미제 연출이 재생됩니다.</p>`:''}
    <div class="rsteps">${ROUND_ORDER.slice(1).map((k,i)=>`<span class="${i+1<=idx?'done':''} ${k===cur?'now':''}">${RNAME[k].replace('ROUND ','R')}</span>`).join('')}</div>
    <p class="hint">버튼을 누르면 모든 플레이어 폰에 “${RNAME[cur]} 종료 → 다음 라운드 시작” 화면이 뜨고, 해당 라운드 카드와 조사 토큰이 자동으로 열립니다. 잘못 눌렀으면 아래 되돌리기.</p>
    ${idx>0? `<div style="text-align:right;margin:-6px 0 10px"><button class="lnk small" onclick="if(confirm('${RNAME[ROUND_ORDER[idx-1]]}(으)로 되돌릴까요?')) advanceRound('${ROUND_ORDER[idx-1]}')">← ${RNAME[ROUND_ORDER[idx-1]]}(으)로 되돌리기</button></div>`:''}
    <h3 class="subh">조사 현황 · 누가 어떤 단서를 열었나</h3>
    <table class="claims"><tr><th>단서 소유자</th><th>1</th><th>2</th><th>3</th></tr>
      ${CHARS.concat([{id:'yeongyu',name:'이연규 (불참)'}]).map(ch=>`<tr><td>${esc(ch.name)}</td>${[0,1,2].map(i=>{ const c=claims[ch.id+'_'+i]; const sh=Object.values(shared).filter(v=>v&&v.o===ch.id&&v.i===i); return `<td class="${c?'taken':''}" title="${c?nm(c.by)+' 조사':''}">${c?`<b>${esc(nm(c.by))}</b>`:'<span class="dim">—</span>'}${sh.length?`<div class="shd">📣 ${sh.map(v=>v.to==='all'?'전체':nm(v.to)).join(', ')}</div>`:''}</td>`; }).join('')}</tr>`).join('')}
    </table>
    <p class="hint">열린 단서 ${Object.keys(claims).length}/33 · 공개 ${Object.keys(shared).length}건 · 제출 ${Object.keys(subs).length}/12</p>`;
}
async function startFinale(){ if(!SYNC) return; await sput('finale', Date.now()); alert('전원 폰에서 최종 연출을 재생합니다. (채점을 마친 사람만 보입니다)'); }
async function advanceRound(next){
  if(!SYNC) return;
  const ok = await sput('round', next) && await sput('roundAt', Date.now());
  if(!ok){ alert('전송 실패. 네트워크를 확인하세요.'); return; }
  await pollOnce(); const el=document.getElementById('live'); if(el) el.innerHTML=liveBoard();
  const c=document.querySelector('.livehead .cur'); if(c){ c.classList.add('flash'); setTimeout(()=>c.classList.remove('flash'),1200); }
}
