/* ===== 실시간 동기화 (선택) =====
   data/config.js 에 SYNC_URL 이 설정되어 있으면 Firebase Realtime Database REST로 상태를 공유한다.
   없으면 모든 기능은 이 기기 안에서만(코드 입력 방식) 동작한다. */
const SYNC = (typeof SYNC_URL==='string' && /^https?:\/\/.+/.test(SYNC_URL)) ? { base: SYNC_URL.replace(/\/+$/,'') } : null;
const ROUND_ORDER = ['lobby','r1','r2','r3','r4','final','ending'];
let SSTATE = null;            // 마지막으로 받은 원격 상태
let SLISTENERS = [];
function gpath(p){ return `${SYNC.base}/games/${GAME}/${p}.json`; }
async function sget(p){ if(!SYNC) return null; try{ const r=await fetch(gpath(p),{cache:'no-store'}); return r.ok? await r.json(): null; }catch(e){ return null; } }
async function sput(p,v){ if(!SYNC) return false; try{ const r=await fetch(gpath(p),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)}); return r.ok; }catch(e){ return false; } }
async function spatch(p,v){ if(!SYNC) return false; try{ const r=await fetch(gpath(p),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)}); return r.ok; }catch(e){ return false; } }
/* 조건부 생성: 이미 값이 있으면 실패 (선착순 조사) */
async function sclaim(p, v){
  if(!SYNC) return true;
  try{
    const r=await fetch(gpath(p),{headers:{'X-Firebase-ETag':'true'},cache:'no-store'});
    if(!r.ok) return false;
    const cur=await r.json(); if(cur) return false;
    const etag=r.headers.get('ETag')||'null_etag';
    const w=await fetch(gpath(p),{method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(v)});
    return w.ok;
  }catch(e){ return false; }
}
function onSync(fn){ SLISTENERS.push(fn); }
let pollTimer=null, lastJSON='';
async function pollOnce(){
  const st = await sget(''); if(st===null && !SYNC) return;
  const j = JSON.stringify(st||{});
  const prev = SSTATE; SSTATE = st||{};
  if(j!==lastJSON){ lastJSON=j; SLISTENERS.forEach(fn=>{ try{ fn(SSTATE, prev||{}); }catch(e){} }); }
}
function startSync(ms){ if(!SYNC) return; pollOnce(); clearInterval(pollTimer); pollTimer=setInterval(pollOnce, ms||3000); document.addEventListener('visibilitychange',()=>{ if(!document.hidden) pollOnce(); }); }
const roundIdx = r => Math.max(0, ROUND_ORDER.indexOf(r||'lobby'));
const curRound = () => (SSTATE && SSTATE.round) || 'lobby';
/* 라운드 전환 오버레이 */
function showRoundOverlay(prevKey, nextKey, extra){
  const NM = {lobby:'대기', r1:'ROUND 1', r2:'ROUND 2', r3:'ROUND 3', r4:'ROUND 4', final:'FINAL', ending:'ENDING'};
  const DESC = {r1:'현장 구조도 · 발견 브리핑 공개', r2:'1차 감식 속보 공개', r3:'공식 부검 결과 공개', r4:'지하 2층 회수 증거 공개', final:'최종 추리를 작성해 제출하세요', ending:'엔딩북이 열렸습니다 · 채점을 진행하세요'};
  const old=document.getElementById('rov'); if(old) old.remove();
  const el=document.createElement('div'); el.className='rov'; el.id='rov';
  el.innerHTML=`<div class="rov-in">
    ${prevKey && prevKey!=='lobby' ? `<div class="rov-end">${NM[prevKey]} 종료</div>` : ''}
    <div class="rov-stamp">${NM[nextKey]}</div>
    <div class="rov-sub">${nextKey==='ending'?'':'시작'}</div>
    <div class="rov-desc">${DESC[nextKey]||''}${extra?`<br>${extra}`:''}</div>
    <button class="btn" onclick="document.getElementById('rov').remove()">확인</button>
  </div>`;
  document.body.appendChild(el);
  if(navigator.vibrate) try{ navigator.vibrate([80,40,80]); }catch(e){}
}
