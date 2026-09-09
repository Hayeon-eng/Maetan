const mem = {};
const GAME = (new URLSearchParams(location.search).get('g')||'v5').replace(/[^A-Za-z0-9]/g,'').slice(0,12) || 'v5';
const PFX = 'mm36:'+GAME+':';
const store = {
  get(k, d){ try{ const v = localStorage.getItem(PFX+k); return v===null? (mem[k]??d) : JSON.parse(v);}catch(e){ return mem[k]??d; } },
  set(k, v){ mem[k]=v; try{ localStorage.setItem(PFX+k, JSON.stringify(v)); }catch(e){} }
};
const img = k => !IMG[k] ? '' : (IMG[k].startsWith('img/') ? IMG[k] : `data:image/jpeg;base64,${IMG[k]}`);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g,'<b class="hl">$1</b>').replace(/__(.+?)__/g,'<u class="ul">$1</u>');
const fCls = f => f==='한의학파'?'h':(f==='마운자로파'?'m':'n');
const fBadge = f => `<span class="badge ${f==='한의학파'?'b-han':(f==='마운자로파'?'b-mou':'b-non')}">${esc(f)}</span>`;
const $ = sel => document.querySelector(sel);
CHARS.sort((a,b)=>a.name.localeCompare(b.name,'ko'));   // ㄱㄴㄷ 순
const byId = id => CHARS.find(c=>c.id===id);
const me = () => store.get('me', null);
const clueCode = (ownerId, i) => String(CHARS.findIndex(c=>c.id===ownerId)+1).padStart(2,'0')+'-'+(i+1);   // 예: 05-2
function parseClueCode(t){ const m=String(t).trim().match(/^(\d{1,2})\s*-\s*([1-3])$/); if(!m) return null; const ch=CHARS[+m[1]-1]; if(!ch) return null; return {o:ch.id,i:+m[2]-1}; }
const K = name => (me()||'_')+':'+name;   // 캐릭터별로 분리 저장

function setMode(m){ document.body.dataset.mode = m; }
function route(){
  const h = location.hash.replace(/^#\/?/,'');
  const [a,b,c] = h.split('/');
  window.scrollTo(0,0);
  if(a==='me') return renderMe(b);
  if(a==='inv' && b) return renderInv(b);
  if(a==='pick' && b) return renderPin(b);
  if(a==='shared') return renderShared(b);
  if(a==='ending') return renderEnding();
  if(a==='grade') return renderGrade();
  renderHome();
}
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', ()=>{ route(); startSync(1200); if(SYNC){ pollOnce().then(()=>{ const h=location.hash; if(h===''||h==='#/'||h==='#/shared') route(); }); } });
let lastRound = null;
onSync((st, prev)=>{
  if(st.reset && store.get('resetSeen',0)!==st.reset){
    store.set('resetSeen', st.reset);
    try{ Object.keys(localStorage).filter(k=>k.startsWith(PFX)&&!k.endsWith(':resetSeen')&&!k.endsWith(':seenRound')).forEach(k=>localStorage.removeItem(k)); }catch(e){}
    for(const k in mem) if(k!=='resetSeen') delete mem[k];
    location.hash='#/'; renderHome();
    const el=document.createElement('div'); el.className='rov'; el.innerHTML='<div class="rov-in"><div class="rov-stamp" style="color:var(--red);border-color:var(--red)">초기화</div><div class="rov-desc">진행자가 게임을 초기화했습니다.</div><button class="btn" onclick="this.closest(\'.rov\').remove()">확인</button></div>'; document.body.appendChild(el);
    return;
  }
  const r = st.round||'lobby';
  if(lastRound===null){ lastRound = r; store.set('seenRound', r); }  // 첫 동기화: 현재 라운드를 기준선으로만 잡고 오버레이 X
  else if(r!==lastRound){
    if(roundIdx(r)>roundIdx(lastRound)) showRoundOverlay(lastRound, r, META.tokens[r]?`조사 토큰 +${META.tokens[r]}`:'');
    lastRound=r; store.set('seenRound', r);
  }
  if(me() && st.finaleStage){
    const cur = +st.finaleStage;
    if(store.get('finaleStageSeen',-1)!==cur){
      store.set('finaleStageSeen', cur);
      if(cur>=1) renderFinaleStage(cur);
    }
  }
  const h=location.hash;
  if(h.startsWith('#/inv/')) renderInv(h.split('/')[2]);
  else if(h.startsWith('#/me/acq')) renderMe('acq');
  else if(h==='#/shared' || h==='#/') route();
});

function topbar(title, back, act){
  return `<header class="top"><div class="wrap">
    ${back?`<a class="back" href="${back}" aria-label="뒤로">‹</a>`:''}
    <div class="ttl">${esc(title)}</div>
    ${act||''}
  </div></header>`;
}
function roundBanner(){
  const cur = curRound(); const info = ROUND_INFO[cur]||ROUND_INFO.lobby;
  const idx = roundIdx(cur);
  const steps = ROUND_ORDER.slice(1).map((k,i)=>`<span class="${i+1<idx?'done':''} ${k===cur?'now':''}">${ROUND_INFO[k].n.replace('ROUND ','R')}</span>`).join('');
  return `<div class="rbanner ${cur}">
    <div class="rb-top"><span class="rb-now">${info.n}</span><span class="rb-title">${esc(info.title)}</span></div>
    <div class="rb-desc">${esc(info.desc)}</div>
    <div class="rb-steps">${steps}</div>
  </div>`;
}
function modebar(kind, text){
  const ic = {me:'🔒', inv:'🔍', shared:'📋', home:'', ending:'📖', grade:'✅'}[kind]||'';
  const lbl = {me:'나만 보는 화면', inv:'다른 플레이어 조사', shared:'공용 · 모두 같은 내용', ending:'엔딩북', grade:'최종 채점'}[kind]||'';
  return `<div class="modebar ${kind}"><span class="ic">${ic}</span><b>${lbl}</b><span class="tx">${esc(text||'')}</span></div>`;
}
function acc(title, body, open, id){ return `<div class="acc ${open?'open':''}" ${id?`id="${id}"`:''}><button onclick="this.parentNode.classList.toggle('open')"><span>${title}</span><span class="chev">›</span></button><div class="body">${body}</div></div>`; }

/* ===== tokens & inventory ===== */
function roundsOpen(){
  if(SYNC){
    // 동기화 모드: 오직 서버의 현재 라운드만 신뢰 (로컬 잔여 플래그 무시)
    const r={}; if(SSTATE){ const idx=roundIdx(curRound()); ROUND_ORDER.slice(1, idx+1).forEach(k=>{ r[k]=true; }); }
    return r;
  }
  return Object.assign({}, store.get('rounds',{}));
}
function tokenState(){
  const rounds = roundsOpen(); const T = META.tokens;
  const total = T.start + (rounds.r2?T.r2:0) + (rounds.r3?T.r3:0) + (rounds.r4?T.r4:0);
  const acq = store.get(K('acq'), []);
  return { total, acq, left: Math.max(0, total - acq.length) };
}
function nextTokenHint(){ const r=roundsOpen(); if(!r.r2) return 'ROUND 2 코드 입력 시 +1'; if(!r.r3) return 'ROUND 3 코드 입력 시 +1'; if(!r.r4) return 'ROUND 4 코드 입력 시 +1'; return '추가 토큰 없음'; }

/* ===== HOME ===== */
function renderHome(){
  setMode('home');
  const my = me() ? byId(me()) : null;
  const ts = tokenState(); const view = store.get('alibiView','list');
  $('#app').innerHTML = `
  ${topbar(META.title, null, my?`<a class="act me" href="#/me">🔒 내 화면</a>`:'')}
  <main class="wrap">
    ${roundBanner()}
    ${my && roundsOpen().ending? `<a class="finalbanner" href="#/grade"><span>📖 엔딩이 열렸습니다</span><b>✅ 최종 채점하기 →</b></a>`:''}
    <div class="titleblk">
      <div class="stamp">[대외비]<small>열람 주의</small></div>
      <div class="kicker">${esc(META.sub)}</div>
      <h1>매탄동 전자회사의<br>대증적 처방</h1>
      <p class="tag">${esc(META.tagline)}</p>
    </div>

    <div class="section-h"><span>게임 소개</span><small>눌러서 펼치기</small></div>
    ${acc('세계관 · 2036년, 종파전쟁', `${RULES.world.map(p=>`<p style="font-size:15px">${md(p)}</p>`).join('')}<div class="panel c-mou"><h3>2년 전, 치킨 3000마리 횡령 사건</h3><p style="margin:0;font-size:15px">${md(RULES.chicken)}</p></div>`, true)}
    ${acc('사건 개요 · 그리고 이번에는 사람이 죽었다', `<dl class="kv">${RULES.scene.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${md(v)}</dd>`).join('')}</dl><div class="panel c-red" style="margin-top:14px"><h3>오늘 밤의 질문</h3><p style="margin:0">${esc(RULES.question)}</p></div><p class="hint">캐릭터북과 공개된 카드에 적힌 사실만 사용합니다. 진행자가 아직 공개하지 않은 자료는 미리 열람하지 않습니다.</p>`)}
    ${acc('게임 규칙 · 진행 흐름과 대화 규칙', `<ul class="tl navy">${RULES.flow.map(([t,h,d])=>`<li><div class="t">${esc(t)}</div><div class="d"><b>${esc(h)}</b><br>${esc(d)}</div></li>`).join('')}</ul>
      <dl class="kv" style="margin-top:14px">${RULES.talking.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <div class="panel c-amb" style="margin-top:14px"><h3>조사 토큰</h3><p style="margin:0;font-size:15px">다른 플레이어의 개인 단서를 1장 열어볼 때 <b>내 토큰 1개</b>를 씁니다. 시작 ${META.tokens.start}개, ROUND 2·3 코드 입력 시 각 1개가 추가됩니다(총 3개). 내 단서는 토큰 없이 봅니다. 열어본 단서는 내 화면의 ‘획득 단서’에 남습니다.${SYNC?' <b>한 단서는 한 사람만 조사할 수 있고</b>, 이미 조사된 단서는 그 사람이 공개해 줘야 볼 수 있습니다.':''}</p></div>`)}
    ${acc('최종 추리 · 네 가지 항목', `${RULES.finalItems.map(([n,t,d])=>`<div class="panel"><h3>${n}. ${esc(t)}</h3><p style="margin:0;font-size:15px">${esc(d)}</p></div>`).join('')}<div class="panel c-amb"><h3>TRUE END 기준</h3><p style="margin:0;font-size:15px">${esc(RULES.trueEnd)}</p></div><p class="hint">제출은 내 화면의 <b>추리</b> 탭에서 합니다.</p>`)}

    <div class="section-h"><span>공개 정보 · 누구나 볼 수 있음</span></div>
    ${acc('공용 NPC 카드 · 조성혁 / 김대현 / 정수환', NPCS.map(n=>`<div class="npc"><img src="${img(n.img)}" alt=""><div><div class="nm">${esc(n.name)} <span class="small">${esc(n.age)}</span></div><div class="rl">${esc(n.role)} · ${esc(n.faction)}</div><p>${esc(n.info)}</p><p class="small">${esc(n.note)}</p></div></div>`).join(''))}
    ${acc('이연규 (불참 · 자동 공개) · 단서는 토큰으로 조사', yeongyuBlock())}
    ${acc('인물 관계도', `<div class="npcline">${esc(RELATIONS.npcLine)}</div><div class="rel">${CHARS.map(ch=>`<div><b>${esc(ch.name)}</b> ${fBadge(ch.faction)}<small>${esc(ch.group)}</small></div>`).join('')}</div><p class="small" style="margin:10px 0 0">${esc(RELATIONS.note)}</p>`)}
    ${acc('12명의 공개 알리바이 · 목록 / 시간별 그래프', `<div class="seg"><button class="${view==='list'?'on':''}" onclick="setAlibiView('list')">목록</button><button class="${view==='graph'?'on':''}" onclick="setAlibiView('graph')">시간별 그래프</button></div><div id="alibiwrap">${view==='graph'?alibiGraph():alibiList()}</div>`, false, 'acc-alibi')}

    <div class="section-h"><span>내 캐릭터</span></div>
    ${my? `<div class="mecard">
        <img src="${img('photo_'+my.id)}" alt="">
        <div class="mi"><div class="nm">${esc(my.name)}</div><div class="gp">${esc(my.group)} · ${esc(my.title)} ${fBadge(my.faction)}</div>
          <div class="stat"><span>🪙 토큰 <b>${ts.left}</b>/${ts.total}</span><span>📎 획득 단서 <b>${ts.acq.length}</b></span></div>
          <div class="small" style="font-size:11px">${ts.left<ts.total||true?nextTokenHint():''}</div></div>
        <div class="mb"><a class="btn" href="#/me">내 화면</a><button class="btn ghost sm" onclick="changeMe()">변경</button></div>
      </div>`
    : `<div class="mecard empty"><div><b>아직 내 캐릭터가 없습니다.</b><br><span class="small">아래 카드 중 배정받은 캐릭터의 <b>내 캐릭터로 설정</b>을 누르고 번호를 입력하세요.</span></div></div>`}

    <div class="section-h"><span>캐릭터 카드 12장</span><small>누르면 뒤집혀 공개 정보가 보입니다</small></div>
    ${my? `<p class="guide">다른 사람의 카드를 뒤집어 공개 정보를 확인하고, <b>🔍 단서 조사</b>로 내 토큰을 써서 그 사람의 단서를 열어보세요.</p>`
        : `<p class="guide"><b>배정받은 캐릭터를 선택하세요.</b> 카드를 뒤집고 <b>내 캐릭터로 설정</b>을 눌러 진행자가 준 번호를 입력하면 시작됩니다.</p>`}
    <div class="grid" id="cards">
      ${CHARS.map(ch=>cardHTML(ch, my)).join('')}
    </div>

    <div class="section-h"><span>진행자 공개 단서 · 엔딩</span></div>
    <a class="rowbtn" href="#/shared"><div><b>📋 진행자 공개 단서</b><span>라운드마다 진행자가 알려주는 코드로 개봉 · 현장 구조도 · 감식 · 부검 · 회수 증거</span></div><span class="chev">›</span></a>
    <a class="rowbtn" href="#/ending"><div><b>📖 엔딩북</b><span>${roundsOpen().ending?'열려 있음':'최종 추리 제출 후 열림'}</span></div><span class="chev">›</span></a>
    ${my && roundsOpen().ending? `<a class="rowbtn grade" href="#/grade"><div><b>✅ 채점하기</b><span>엔딩이 열렸습니다 · 내 답을 정답과 대조합니다</span></div><span class="chev">›</span></a>`:''}
    <p class="foot">${esc(META.version)}<br><button class="lnk" onclick="resetAll()">이 기기 데이터 초기화</button></p>
  </main>`;
}
function cardHTML(ch, my){
  const isMe = my && my.id===ch.id;
  return `<div class="flip ${isMe?'isme':''}" id="card-${ch.id}">
    <button class="face front idb" onclick="flipCard('${ch.id}')" aria-label="${esc(ch.name)} 카드 뒤집기">
      <div class="strip ${fCls(ch.faction)}"><span>MX WELLNESS TF</span><span>${esc(ch.faction)}</span></div>
      <div class="hole"></div>
      <div class="body"><img src="${img('photo_'+ch.id)}" alt=""><div><div class="nm">${esc(ch.name)}</div><div class="gp">${esc(ch.group)}<br>${esc(ch.title.split(' · ').pop())}</div></div></div>
      <div class="bar"></div>
      ${isMe?'<span class="lk ok">내 캐릭터</span>':''}
      <span class="tapme">탭 → 공개 정보</span>
    </button>
    <div class="face back">
      <div class="bh"><span>${esc(ch.name)} · 공개 정보</span><button class="x" onclick="flipCard('${ch.id}')" aria-label="닫기">×</button></div>
      <div class="bb">
        <div class="pubtop"><img src="${img('photo_'+ch.id)}" alt=""><div><div class="meta">${esc(ch.birth)}<br>${esc(ch.group)}<br>${esc(ch.title)}</div>${fBadge(ch.faction)}</div></div>
        <div class="panel c-han"><h3>공개 알리바이</h3><p class="quote">${esc(ch.alibi)}</p></div>
        <div class="panel"><h3>누구나 아는 정보</h3><p style="margin:0">${esc(ch.publicInfo)}</p></div>
        <div class="panel"><h3>피해자와의 공개 관계</h3><p style="margin:0">${esc(ch.relation)}</p></div>
        <div class="panel c-amb"><h3>첫 자기소개</h3><p class="quote">${esc(ch.intro)}</p></div>
        <div class="bact">
          ${isMe? `<a class="btn" href="#/me">🔒 내 화면 열기</a>`
                : (my? `<a class="btn inv" href="#/inv/${ch.id}">🔍 단서 조사 (내 토큰 사용)</a>` : `<a class="btn ghost" href="#/pick/${ch.id}">내 캐릭터로 설정</a>`)}
          ${my && !isMe? `<a class="lnk small" href="#/pick/${ch.id}">이 캐릭터가 나라면 → 변경</a>`:''}
        </div>
      </div>
    </div>
  </div>`;
}
function flipCard(id){
  const el = $('#card-'+id); if(!el) return;
  const was = el.classList.contains('flipped');
  document.querySelectorAll('.flip.flipped').forEach(f=>f.classList.remove('flipped'));
  if(!was){ el.classList.add('flipped'); setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),60); }
}
function changeMe(){ if(confirm('내 캐릭터를 변경할까요? 토큰·획득 단서·메모·추리는 캐릭터별로 따로 저장됩니다.')){ store.set('me', null); renderHome(); } }
function resetAll(){ if(confirm('이 기기에 저장된 내 캐릭터·토큰·획득 단서·메모·추리·봉인 해제 상태를 모두 지울까요?')){ try{ Object.keys(localStorage).filter(k=>k.startsWith(PFX)).forEach(k=>localStorage.removeItem(k)); }catch(e){} for(const k in mem) delete mem[k]; location.hash='#/'; renderHome(); } }

/* ===== PIN ===== */
function renderPin(id){
  const ch = byId(id); if(!ch) return renderHome();
  setMode('home'); const n = ch.pin.length;
  $('#app').innerHTML = `
  ${topbar('내 캐릭터로 설정','#/')}
  <main class="wrap">
    <div class="gate">
      <div class="who"><img src="${img('photo_'+ch.id)}" alt=""><div><h2>${esc(ch.name)}</h2><p>${esc(ch.group)}<br>${esc(ch.title)}</p></div></div>
      <div class="gmsg" id="gmsg">진행자가 알려준 ${n}자리 번호를 입력하세요</div>
      <div class="pinrow"><input id="pin" type="tel" inputmode="numeric" maxlength="${n}" autocomplete="off" placeholder="${'·'.repeat(n)}" aria-label="번호"></div>
      <button class="btn" onclick="tryPin('${ch.id}')">이 캐릭터로 시작</button>
    </div>
    <p class="hint" style="text-align:center;color:var(--dim)">배정받은 캐릭터만 설정하세요. 다른 사람의 캐릭터북을 여는 것은 규칙 위반입니다.</p>
  </main>`;
  const inp=$('#pin'); inp.focus();
  inp.addEventListener('input', ()=>{ if(inp.value.length===n) tryPin(ch.id); });
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter') tryPin(ch.id); });
}
function tryPin(id){
  const ch = byId(id); const v=$('#pin').value.trim();
  if(v===ch.pin){ store.set('me', id); location.hash='#/me'; renderMe(); }
  else { const m=$('#gmsg'); m.className='gmsg err'; m.textContent='번호가 맞지 않습니다'; $('#pin').value=''; $('#pin').focus(); }
}

