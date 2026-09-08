/* ===== SHARED ===== */
function renderShared(sub){
  setMode('shared');
  const rounds = roundsOpen(); const view = store.get('alibiView','list');
  $('#app').innerHTML = `
  ${topbar('진행자 공개 단서','#/')}
  ${modebar('shared', '모든 플레이어가 같은 내용을 봅니다')}
  <main class="wrap" style="padding-top:16px">
    <p class="hint" style="color:var(--dim)">진행자가 라운드마다 알려주는 4자리 코드를 입력하면 봉인이 풀립니다. ROUND 2·3 코드는 내 조사 토큰도 1개씩 추가합니다(총 3개).</p>
    ${HOST_CARDS.map((c,i)=>envelope(c,i,rounds)).join('')}
    <p class="foot">${esc(META.version)}</p>
  </main>`;
}
function setAlibiView(v){ store.set('alibiView',v); document.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on', b.textContent===(v==='list'?'목록':'시간별 그래프'))); $('#alibiwrap').innerHTML = v==='graph'?alibiGraph():alibiList(); }
function alibiList(){ return `<div class="alibi-list">${CHARS.map(ch=>`<div class="item"><div class="who">${esc(ch.name)} <span>${esc(ch.group)}</span> ${fBadge(ch.faction)}</div><p>“${esc(ch.alibi)}”</p></div>`).join('')}</div>`; }
const GCOL = {exec:'#C8322B', seat:'#2F5A46', out:'#2D3B5E', room:'#C99A3A', room2:'#8a6a1f', hall:'#8a7f73', unk:'url(#hatch)'};
const GLBL = {exec:'임원실', seat:'자기 자리', out:'사옥 밖', room:'회의실', room2:'발표 중', unk:'시간·위치 불명(진술 기준)'};
function alibiGraph(){
  const t0 = 19*60, t1 = 23*60+10, W=720, L=78, R=10, rowH=36, top=26;
  const H = top + CHARS.length*rowH + 6;
  const x = tm => { const [h,m]=tm.split(':').map(Number); return L + (h*60+m - t0)/(t1-t0)*(W-L-R); };
  let s = `<div class="gscroll"><svg class="agraph" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="공개 알리바이 시간표">
  <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#efe7d3"/><line x1="0" y1="0" x2="0" y2="6" stroke="#a89f8c" stroke-width="2"/></pattern></defs>`;
  for(let h=19;h<=23;h++){ const X=x(`${h}:00`); s+=`<line class="grid" x1="${X}" y1="${top-6}" x2="${X}" y2="${H-2}"/><text x="${X}" y="12" text-anchor="middle">${h}:00</text>`; if(h<23){ const X2=x(`${h}:30`); s+=`<line class="grid" x1="${X2}" y1="${top-2}" x2="${X2}" y2="${H-2}" stroke-dasharray="2 3"/>`; } }
  CHARS.forEach((ch,i)=>{
    const y = top + i*rowH; const g = ALIBI_GRAPH[ch.id]||{bars:[],pts:[]};
    const fc = {h:'#2F5A46',m:'#2D3B5E',n:'#8a7f73'}[fCls(ch.faction)];
    s += `<rect x="0" y="${y}" width="4" height="${rowH-8}" fill="${fc}"/><text class="nm" x="10" y="${y+18}">${esc(ch.name)}</text>`;
    s += `<line class="grid" x1="${L}" y1="${y+rowH-6}" x2="${W-R}" y2="${y+rowH-6}"/>`;
    g.bars.forEach(b=>{ const x1=x(b.f), x2=x(b.t); const sub=b.type==='room2'; s+=`<rect x="${x1}" y="${y+(sub?12:5)}" width="${Math.max(3,x2-x1)}" height="${sub?10:20}" rx="2" fill="${GCOL[b.type]}" opacity="${sub?.9:.92}"><title>${esc(ch.name)} · ${b.f}~${b.t} · ${esc(b.l)}</title></rect>`; if(x2-x1>70 && !sub) s+=`<text x="${x1+5}" y="${y+19}" fill="${b.type==='unk'?'#5a534c':'#fff'}" font-size="10">${esc(b.l)}</text>`; });
    g.pts.forEach(p=>{ const X=x(p.at); s+=`<g><polygon points="${X},${y+2} ${X+6},${y+10} ${X},${y+18} ${X-6},${y+10}" fill="#C8322B" stroke="#fff" stroke-width="1.2"/><title>${esc(ch.name)} · ${p.at} · ${esc(p.l)}</title></g>`; });
  });
  s += `</svg></div>`;
  s += `<div class="legend">${Object.keys(GLBL).map(k=>`<span><i style="background:${k==='unk'?'repeating-linear-gradient(45deg,#efe7d3 0 2px,#a89f8c 2px 4px)':GCOL[k]}"></i>${GLBL[k]}</span>`).join('')}<span><i style="background:#C8322B;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)"></i>시점(전달·목격 등)</span></div>
  <p class="hint" style="margin-top:8px">공개 진술에 나온 시간만 그렸습니다. 좌우로 밀어 볼 수 있고, 막대를 길게 누르면 내용이 보입니다.</p>`;
  return s;
}
function yeongyuBlock(){
  const my = me()?byId(me()):null; const ts = tokenState();
  const mineArr = my? store.get(K('acq'),[]).filter(a=>a.o==='yeongyu').map(a=>a.i):[];
  const recvd = my? store.get(K('recv'),[]).concat(sharedForMe()).filter(a=>a.o==='yeongyu').map(a=>a.i):[];
  let h = `<div class="npc"><img src="${img('photo_yeongyu')}" alt=""><div><div class="nm">이연규 <span class="badge b-non">불참</span></div><div class="rl">${esc(YEONGYU.group)} · ${esc(YEONGYU.title)} · ${esc(YEONGYU.faction)}</div><p class="small">공개 알리바이: “${esc(YEONGYU.alibi)}”</p><p>${esc(YEONGYU.publicInfo)}</p></div></div>`;
  if(!my){ h+='<p class="hint">내 캐릭터를 설정하면 토큰으로 이연규의 단서를 조사할 수 있습니다.</p>'; return h; }
  h += YEONGYU.clues.map((c,i)=>{
    const cl=claimOf('yeongyu',i); const takenByOther = cl && cl.by!==my.id && !mineArr.includes(i);
    if(mineArr.includes(i)) return clueCard(YEONGYU,c,i,{id:'yclue-'+i, foot:`<div class="cf"><span class="small">내가 조사함 · 획득 단서에 보관</span></div>`});
    if(recvd.includes(i)) return clueCard(YEONGYU,c,i,{id:'yclue-'+i, foot:`<div class="cf"><span class="small">공유받음</span></div>`});
    if(takenByOther) return `<div class="clue sealedc taken" id="yclue-${i}"><div class="ch"><b>조사 완료된 단서</b><span class="ev">이연규 · ${i+1}/3</span></div><div class="sealface"><div><div class="seal gray">TAKEN</div><p><b>${esc(byId(cl.by)?.name||'다른 플레이어')}</b> 님이 먼저 조사</p></div></div></div>`;
    return `<div class="clue sealedc" id="yclue-${i}"><div class="ch"><b>봉인된 단서</b><span class="ev">이연규 · ${i+1}/3</span></div><div class="sealface"><div><div class="seal ${ts.left>0?'blink':''}">SEALED</div><p>${ts.left>0?'내 토큰 1개로 조사':'토큰 없음'}</p></div></div><div class="cf" style="padding-top:12px"><span class="small">열면 내 획득 단서에 남습니다</span><button class="btn inv sm" ${ts.left>0?'':'disabled style=\"opacity:.4\"'} onclick="investigateY(${i})">🪙 토큰 1개로 열기</button></div></div>`;
  }).join('');
  return h;
}
async function investigateY(i){
  const ts=tokenState(); if(ts.left<=0) return;
  const btn=document.querySelector(`#yclue-${i} .btn`); if(btn){ btn.disabled=true; btn.textContent='확인 중…'; }
  if(SYNC){ const ok=await sclaim(`claims/yeongyu_${i}`, {by:me(), at:Date.now()}); if(!ok){ await pollOnce(); renderHome(); reopenY(i); return; } }
  tearEnvelope2(i, ()=>{ const acq=store.get(K('acq'),[]); if(!acq.some(a=>a.o==='yeongyu'&&a.i===i)) acq.push({o:'yeongyu',i,at:new Date().toTimeString().slice(0,5)}); store.set(K('acq'),acq);
    renderHome(); reopenY(i);
    const el=$('#yclue-'+i); if(el){ el.classList.add('reveal'); el.scrollIntoView({behavior:'smooth',block:'center'}); }
  });
}
function reopenY(i){ const a=[...document.querySelectorAll('.acc')].find(x=>x.querySelector('button span')?.textContent.includes('이연규')); if(a) a.classList.add('open'); }
function tearEnvelope2(i, done){ const host=$('#yclue-'+i); if(!host){done();return;} const face=host.querySelector('.sealface')||host; const ov=document.createElement('div'); ov.className='tear'; ov.innerHTML='<div class="tf tl"></div><div class="tf tr"></div><div class="trip">개봉</div>'; face.style.position='relative'; face.appendChild(ov); requestAnimationFrame(()=>ov.classList.add('go')); if(navigator.vibrate)try{navigator.vibrate(30)}catch(e){} setTimeout(done,620); }
function envelope(c,i,rounds,justOpened){
  const open = !!rounds[c.key];
  return `<div class="env ${open?'open':''} ${c.key==='final'?'final':''}" id="env-${i}">
    ${justOpened?'<div class="unseal"><div>봉인 해제</div></div>':''}
    <div class="hh"><span>${esc(c.round)}</span><b>${esc(c.title)}</b></div>
    ${open? `<img src="${img(c.img)}" alt="" onclick="openZoom(this.src)"><div class="ht">${esc(c.text)}</div>`
          : `<div class="sealed"><div class="seal">SEALED</div><div class="row"><input type="tel" inputmode="numeric" maxlength="4" placeholder="····" aria-label="${esc(c.title)} 코드" onkeydown="if(event.key==='Enter')tryRound('${c.key}',${i},this)"><button class="btn" onclick="tryRound('${c.key}',${i},this.previousElementSibling)">개봉</button></div></div>`}
  </div>`;
}
function tryRound(key, i, inp){
  if(inp.value.trim()===META.roundCodes[key]){
    const r=store.get('rounds',{}); r[key]=true; store.set('rounds',r);
    HOST_CARDS.forEach((c,j)=>{ if(c.key===key){ const el=$('#env-'+j); if(el){ const w=document.createElement('div'); w.innerHTML=envelope(c,j,r,true); el.replaceWith(w.firstElementChild);} } });
    setTimeout(()=>showRoundOverlay(ROUND_ORDER[roundIdx(key)-1], key, META.tokens[key]?`조사 토큰 +${META.tokens[key]}`:''), 700);
  } else { inp.value=''; inp.placeholder='다름'; inp.focus(); }
}

/* ===== ENDING ===== */
function renderEnding(){
  setMode('ending');
  const finaleStarted = SYNC ? !!(SSTATE&&SSTATE.finale) : !!store.get('finaleSeen',0);
  if(!finaleStarted){
    $('#app').innerHTML = `${topbar('엔딩북','#/')}${modebar('ending','아직 열람할 수 없습니다')}<main class="wrap"><div class="gate">
      <div class="seal" style="display:inline-block;transform:rotate(-8deg);color:var(--red);border:3px solid var(--red);border-radius:6px;padding:4px 14px;font-weight:900;letter-spacing:.2em;margin-bottom:12px">SEALED</div>
      <h2 style="margin:0 0 6px">사건의 진상은 아직 봉인되어 있습니다</h2>
      <p style="font-family:var(--mono);color:var(--dim);font-size:13px;line-height:1.8">전원이 최종 추리를 제출하고,<br>진행자가 <b>최종 연출</b>을 시작하면<br>결말과 함께 진상이 열립니다.</p></div></main>`;
    return;
  }
  const rounds = roundsOpen();
  if(false){
    $('#app').innerHTML = `${topbar('엔딩북','#/')}${modebar('ending','최종 추리 제출 후 진행자가 코드를 알려줍니다')}<main class="wrap"><div class="gate">
      <div class="seal" style="display:inline-block;transform:rotate(-8deg);color:var(--red);border:3px solid var(--red);border-radius:6px;padding:4px 14px;font-weight:900;letter-spacing:.2em;margin-bottom:10px">SEALED</div>
      <h2 style="margin:0 0 6px">엔딩 코드</h2><div class="gmsg" id="gmsg"></div>
      <div class="pinrow"><input id="pin" type="tel" inputmode="numeric" maxlength="4" placeholder="····" aria-label="엔딩 코드"></div>
      <button class="btn" onclick="tryEnding()">개봉</button></div></main>`;
    const inp=$('#pin'); inp.focus(); inp.addEventListener('input',()=>{ if(inp.value.length===4) tryEnding(); }); inp.addEventListener('keydown',e=>{ if(e.key==='Enter') tryEnding(); });
    return;
  }
  $('#app').innerHTML = `${topbar('사건의 진상','#/')}${modebar('ending','네 가지 진실 · 2036.10.28 그날 밤')}<main class="wrap" style="padding-top:16px">
    ${endingBody()}
    ${me()?`<a class="rowbtn grade" href="#/grade"><div><b>✅ 채점하기</b><span>정답 항목을 체크해 점수를 확정합니다</span></div><span class="chev">›</span></a>`:''}
    <p class="foot">${esc(META.version)}</p></main>`;
}
function tryEnding(){ if($('#pin').value.trim()===META.roundCodes.ending){ const r=store.get('rounds',{}); r.ending=true; store.set('rounds',r); renderEnding(); } else { const m=$('#gmsg'); m.className='gmsg err'; m.textContent='코드가 맞지 않습니다'; $('#pin').value=''; } }
function endingBody(){
  return `<div class="ending">
    ${ENDING.truths.map(([k,v])=>`<div class="panel c-red"><h3>${esc(k)}</h3><p style="margin:0;font-size:15px">${esc(v)}</p></div>`).join('')}
    ${acc('그날 밤 실제로 일어난 일 · 타임라인', `<ul class="tl">${MASTER_TIMELINE.map(([t,d])=>`<li><div class="t">${esc(t)}</div><div class="d">${esc(d)}</div></li>`).join('')}</ul>`)}
    ${acc('숨은 진실', ENDING.deep.map(([k,v])=>`<div class="panel c-mou"><h3>${esc(k)}</h3><p style="margin:0;font-size:15px">${esc(v)}</p></div>`).join(''))}
    ${acc('각 인물의 밤', `<dl class="kv">${ENDING.aftermath.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
  </div>`;
}
