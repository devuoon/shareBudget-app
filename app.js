// ─── 상수 ───────────────────────────────────────
const CE=[
  '식비','카페/음료','배달/외식',
  '교통','대중교통','주유/주차',
  '쇼핑','의류/잡화',
  '문화/여가','여행','운동/스포츠',
  '의료/건강','병원','약국',
  '주거/생활','관리비/공과금',
  '통신','구독서비스',
  '교육/학원','경조사/선물','보험','기타지출'
];
const CI=['월급/급여','사업소득','부업/프리랜서','주식수익','적금만기','기타수입'];
const CC=[
  '#E8A838','#F0C060','#F08050',
  '#378ADD','#5BA0E8','#88BBEE',
  '#D4537E','#E880A0',
  '#7F77DD','#9B8FE8','#B8B0F0',
  '#E24B4A','#E87070','#F09090',
  '#9B6B4A','#C08060',
  '#888780','#AAAAAA',
  '#BA7517','#888780','#7F77DD','#555555'
];
const IC={
  '식비':'🍚','카페/음료':'☕','배달/외식':'🍜',
  '교통':'🚗','대중교통':'🚌','주유/주차':'⛽',
  '쇼핑':'🛍','의류/잡화':'👗',
  '문화/여가':'🎬','여행':'✈️','운동/스포츠':'🏃',
  '의료/건강':'💊','병원':'🏥','약국':'💉',
  '주거/생활':'🏠','관리비/공과금':'💡',
  '통신':'📱','구독서비스':'📺',
  '교육/학원':'📚','경조사/선물':'🎁','보험':'🛡️','기타지출':'📌',
  '월급/급여':'💰','사업소득':'💼','부업/프리랜서':'🔧',
  '주식수익':'📈','적금만기':'🏦','기타수입':'💵'
};
const AB=['#B5D4F4','#9FE1CB','#F5C4B3','#F4C0D1','#CECBF6','#FAC775'];
const AF=['#0C447C','#085041','#712B13','#72243E','#3C3489','#633806'];

// ─── 상태 ───────────────────────────────────────
let me='', txType='expense', myTx=[], budgets={}, budgetIds={}, vm='', sel='';
let members=['윤지','정희'], barI=null, pieI=null;
let editId=null, editType='expense', filterCat='전체';
let editingBudgetId=null;

// ─── 유틸 ───────────────────────────────────────
const fmt = n => '₩'+Math.round(n).toLocaleString('ko-KR');
const curM = () => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; };
const mlFmt = m => { const[y,mo]=m.split('-'); return `${y}.${mo}`; };
const pM = m => { const[y,mo]=m.split('-'); const d=new Date(+y,+mo-2,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const nM = m => { const[y,mo]=m.split('-'); const d=new Date(+y,+mo,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const lsGet = k => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){ return null; } };
const lsSet = (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const $ = id => document.getElementById(id);

function showLoading(msg='불러오는 중...') { $('loadingMsg').textContent=msg; $('loading').classList.add('on'); }
function hideLoading() { $('loading').classList.remove('on'); }
function toast(msg) { const t=$('toast'); t.textContent=msg; t.classList.add('on'); setTimeout(()=>t.classList.remove('on'),2500); }

// ─── API ─────────────────────────────────────────
const apiFetch = (url, opt={}) => fetch(url, opt).then(r=>r.json());

const apiSaveTx   = tx  => apiFetch('/api/tx-save',   {method:'POST',  headers:{'Content-Type':'application/json'}, body:JSON.stringify(tx)});
const apiDeleteTx = id  => apiFetch(`/api/tx-delete?id=${id}`, {method:'DELETE'});
const apiUpdateTx = (id,d) => apiFetch('/api/tx-update', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,...d})});
const apiLoadTx   = (user,month) => { const p=new URLSearchParams({month}); if(user) p.append('user',user); return apiFetch(`/api/tx-load?${p}`); };
const apiSaveBudget = (user,month,cat,amount) => apiFetch('/api/budget_save', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user,month,cat,amount})});
const apiLoadBudget = (user,month) => apiFetch(`/api/budget_load?${new URLSearchParams({user,month})}`);
const apiDeleteBudget = id => apiFetch(`/api/budget-delete?id=${id}`, {method:'DELETE'});
const apiSaveMember = nickname => fetch('/api/member-save', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nickname})}).catch(()=>{});

// ─── 멤버 ────────────────────────────────────────
function loadMembers() {
  const saved=lsGet('bg_members');
  if(saved) saved.forEach(m=>{ if(!members.includes(m)) members.push(m); });
  lsSet('bg_members', members);
}

function renderHome() {
  $('memList').innerHTML = members.map((m,i)=>{
    const idx=i%AB.length, s=sel===m;
    return `<div class="hmem${s?' sel':''}" onclick="selectM('${m}')">
      <div class="ava" style="background:${AB[idx]};color:${AF[idx]};">${m.slice(0,2)}</div>
      <span style="flex:1;font-size:14px;font-weight:${s?600:400};">${m}</span>
      ${s?'<span style="font-size:12px;color:#185FA5;font-weight:600;">✓</span>':''}
    </div>`;
  }).join('');
}

function selectM(name) { sel=name; $('startBtn').disabled=false; $('startBtn').style.opacity='1'; renderHome(); }

async function addMem() {
  const v=$('nickIn').value.trim();
  if(!v) return;
  if(!members.includes(v)) { members.push(v); lsSet('bg_members',members); apiSaveMember(v); }
  $('nickIn').value='';
  selectM(v); renderHome();
  toast(`${v} 추가됐어요 👋`);
}

// ─── 앱 시작 ─────────────────────────────────────
async function start() {
  if(!sel) return;
  me=sel; lsSet('bg_last',me);
  $('sHome').classList.remove('on');
  $('sMain').classList.add('on');
  const i=members.indexOf(me)%AB.length;
  $('myPill').innerHTML=`<span class="pill"><span class="mava" style="background:${AB[i]};color:${AF[i]};">${me.slice(0,2)}</span>${me}의 가계부</span>`;
  vm=curM();
  $('mlbl').textContent=mlFmt(vm);
  setType('expense');
  $('fDate').value=new Date().toISOString().split('T')[0];
  $('bCat').innerHTML=
    '<optgroup label="── 지출 카테고리 ──">'+CE.map(c=>`<option>${c}</option>`).join('')+'</optgroup>'+
    '<optgroup label="── 수입 카테고리 ──">'+CI.map(c=>`<option>${c}</option>`).join('')+'</optgroup>';
  apiSaveMember(me);
  await loadMyTx();
}

// ─── 데이터 로드 ──────────────────────────────────
async function loadMyTx() {
  showLoading('Notion에서 불러오는 중...');
  try {
    const [txData, budData] = await Promise.all([apiLoadTx(me,vm), apiLoadBudget(me,vm)]);
    myTx = txData.txList || [];
    budgets = budData.budgets || {};
    budgetIds = budData.budgetIds || {};
  } catch(e) {
    myTx=[]; budgets={};
    toast('Notion 연결 실패 — 오프라인 모드');
  }
  hideLoading(); render();
}

// ─── 거래 CRUD ────────────────────────────────────
async function addTx() {
  const amt=parseFloat($('fAmt').value), date=$('fDate').value, cat=$('fCat').value;
  const desc=$('fDesc').value.trim()||cat;
  if(!amt||amt<=0||!date){ toast('날짜와 금액을 입력해 주세요'); return; }
  const btn=$('sBtn'), ico=$('sIco');
  btn.disabled=true; ico.innerHTML='<span class="spin"></span>';
  try {
    const result = await apiSaveTx({type:txType,amount:amt,date,cat,desc,user:me});
    if(result.ok) {
      if(date.slice(0,7)===vm) myTx.push({id:result.id,type:txType,amount:amt,date,cat,desc,user:me});
      render(); toast('✓ Notion에 저장됐어요');
      $('fAmt').value=''; $('fDesc').value='';
    } else toast('저장 실패 — 다시 시도해 주세요');
  } catch(e) { toast('저장 오류 발생'); }
  btn.disabled=false; ico.textContent='💾';
}

async function delTx(id) {
  showLoading('삭제 중...');
  try { await apiDeleteTx(id); myTx=myTx.filter(t=>t.id!==id); render(); toast('삭제됐어요'); }
  catch(e) { toast('삭제 실패'); }
  hideLoading();
}

// ─── 거래 수정 모달 ───────────────────────────────
function openEdit(id) {
  const t=myTx.find(x=>x.id===id); if(!t) return;
  editId=id; editType=t.type;
  $('eAmt').value=t.amount; $('eDate').value=t.date; $('eDesc').value=t.desc;
  $('eCat').innerHTML=(t.type==='expense'?CE:CI).map(c=>`<option${c===t.cat?' selected':''}>${c}</option>`).join('');
  $('etE').className='tbtn E'+(t.type==='expense'?' on':'');
  $('etI').className='tbtn I'+(t.type==='income'?' on':'');
  $('editModal').classList.add('on');
}
function closeEdit() { $('editModal').classList.remove('on'); editId=null; }
function setEditType(t) {
  editType=t;
  $('etE').className='tbtn E'+(t==='expense'?' on':'');
  $('etI').className='tbtn I'+(t==='income'?' on':'');
  $('eCat').innerHTML=(t==='expense'?CE:CI).map(c=>`<option>${c}</option>`).join('');
}
async function submitEdit() {
  const amt=parseFloat($('eAmt').value), date=$('eDate').value;
  const cat=$('eCat').value, desc=$('eDesc').value.trim()||cat;
  if(!amt||amt<=0||!date){ toast('날짜와 금액을 입력해 주세요'); return; }
  const btn=$('eBtn'), ico=$('eIco');
  btn.disabled=true; ico.innerHTML='<span class="spin"></span>';
  try {
    await apiUpdateTx(editId,{type:editType,amount:amt,date,cat,desc});
    const idx=myTx.findIndex(t=>t.id===editId);
    if(idx>=0) myTx[idx]={...myTx[idx],type:editType,amount:amt,date,cat,desc};
    render(); toast('✓ 수정됐어요'); closeEdit();
  } catch(e) { toast('수정 오류 발생'); }
  btn.disabled=false; ico.textContent='✏️';
}

// ─── 예산 ─────────────────────────────────────────
async function saveBud() {
  const cat=$('bCat').value, amt=parseFloat($('bAmt').value);
  if(!amt||amt<=0){ toast('예산 금액을 입력해 주세요'); return; }
  budgets[cat]=amt;
  if(editingBudgetId) budgetIds[cat]=editingBudgetId;
  render();
  const btn=$('budSaveBtn'); if(btn) btn.disabled=true;
  try {
    const result=await apiSaveBudget(me,vm,cat,amt);
    if(result.id) budgetIds[cat]=result.id;
    toast(`✓ ${cat} 예산 저장됐어요`);
  } catch(e) { toast(`✓ ${cat} 예산 설정됐어요`); }
  if(btn) btn.disabled=false;
  $('bAmt').value=''; cancelBudEdit();
}

function editBudget(cat,amt,id) {
  editingBudgetId=id;
  const sel=$('bCat');
  for(let i=0;i<sel.options.length;i++){ if(sel.options[i].value===cat){ sel.selectedIndex=i; break; } }
  $('bAmt').value=amt;
  $('editBanner').style.display='block';
  $('editCatName').textContent=cat;
  $('budSaveBtn').textContent='✏️ 수정 저장';
  $('budForm').scrollIntoView({behavior:'smooth'});
}

function cancelBudEdit() {
  editingBudgetId=null;
  $('editBanner').style.display='none';
  $('bAmt').value='';
  $('budSaveBtn').textContent='🎯 예산 저장';
}

async function deleteBudget(cat,id) {
  if(!confirm(`${cat} 예산을 삭제할까요?`)) return;
  delete budgets[cat]; delete budgetIds[cat]; render();
  if(id) { try { await apiDeleteBudget(id); } catch(e){} toast(`${cat} 예산 삭제됐어요`); }
}

// ─── 필터 ─────────────────────────────────────────
function setFilter(cat) { filterCat=cat; render(); }

// ─── 월 이동 ──────────────────────────────────────
async function chM(d) {
  const n=d<0?pM(vm):nM(vm);
  if(n>curM()) return;
  vm=n; $('mlbl').textContent=mlFmt(vm);
  await loadMyTx();
  if($('pMembers').classList.contains('on')) await renderMembers();
}

function setType(t) {
  txType=t;
  $('tE').className='tbtn E'+(t==='expense'?' on':'');
  $('tI').className='tbtn I'+(t==='income'?' on':'');
  $('fCat').innerHTML=(t==='expense'?CE:CI).map(c=>`<option>${c}</option>`).join('');
}

function sw(name,el) {
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on')); el.classList.add('on');
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
  $({my:'pMy',members:'pMembers',budget:'pBudget',chart:'pChart',roast:'pRoast'}[name]).classList.add('on');
  if(name==='chart') renderCharts();
  if(name==='members') renderMembers();
}

function tgl() {
  const f=$('addForm'), b=$('ftgl'), o=f.style.display==='none';
  f.style.display=o?'block':'none'; b.textContent=o?'✕ 닫기':'+ 추가';
}

// ─── 렌더 ─────────────────────────────────────────
function render() {
  const tx=myTx;
  const inc=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const bal=inc-exp;
  $('vI').textContent=fmt(inc); $('vE').textContent=fmt(exp);
  const bv=$('vB'); bv.textContent=fmt(bal); bv.className='mv '+(bal>=0?'pos':'neg');

  // 예산 사용률
  const be=Object.entries(budgets);
  if(be.length){
    const tot=be.reduce((s,[,v])=>s+v,0), pct=Math.min(100,exp/tot*100);
    const c=pct>=100?'#E24B4A':pct>=80?'#BA7517':'#1D9E75';
    $('budOv').innerHTML=`<div style="background:#f4f4f0;border-radius:8px;padding:9px 13px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">
        <span style="color:#888;">예산 사용률</span>
        <span style="color:${c};font-weight:600;">${pct.toFixed(0)}% · ${fmt(exp)} / ${fmt(tot)}</span>
      </div>
      <div class="bw" style="height:7px;"><div class="bf" style="width:${pct.toFixed(1)}%;background:${c};"></div></div>
    </div>`;
  } else $('budOv').innerHTML='';

  // 카테고리 필터
  const allCats=['전체',...new Set(tx.map(t=>t.cat))];
  $('txFilter').innerHTML=allCats.map(c=>`<button class="filter-btn${c===filterCat?' on':''}" onclick="setFilter('${c}')">${c}</button>`).join('');

  // 거래 목록
  const filtered=filterCat==='전체'?tx:tx.filter(t=>t.cat===filterCat);
  const sorted=[...filtered].sort((a,b)=>b.date.localeCompare(a.date));
  $('myList').innerHTML=sorted.length
    ? sorted.map(t=>`<div class="tx">
        <div class="txic" style="background:${t.type==='income'?'#EAF3DE':'#FCEBEB'};">${IC[t.cat]||'📌'}</div>
        <div class="txin"><div class="txn">${t.desc}</div><div class="txm">${t.date} · ${t.cat}</div></div>
        <div class="txa ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</div>
        <button class="del" style="color:#888;font-size:13px;margin-right:2px;" onclick="openEdit('${t.id}')">✏️</button>
        <button class="del" onclick="delTx('${t.id}')">✕</button>
      </div>`).join('')
    : '<div style="padding:22px;text-align:center;font-size:12px;color:#aaa;">이번 달 내역 없음<br>위 "+ 추가" 버튼으로 입력하세요</div>';

  // 예산 현황
  $('bList').innerHTML=be.map(([cat,bgt])=>{
    const sp=tx.filter(t=>t.type==='expense'&&t.cat===cat).reduce((s,t)=>s+t.amount,0);
    const pct=Math.min(100,sp/bgt*100), c=pct>=100?'#E24B4A':pct>=80?'#BA7517':'#1D9E75';
    const id=budgetIds[cat]||null;
    return `<div class="card" style="margin-bottom:7px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;font-weight:500;">${IC[cat]||'📌'} ${cat}</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:11px;color:${c};font-weight:600;">${fmt(sp)} / ${fmt(bgt)}</span>
          <button onclick="editBudget('${cat}',${bgt},'${id}')" style="background:none;border:none;cursor:pointer;font-size:13px;" title="수정">✏️</button>
          <button onclick="deleteBudget('${cat}','${id}')" style="background:none;border:none;cursor:pointer;font-size:13px;" title="삭제">🗑️</button>
        </div>
      </div>
      <div class="bw" style="height:6px;margin-top:5px;"><div class="bf" style="width:${pct.toFixed(1)}%;background:${c};"></div></div>
      ${pct>=100?`<div style="font-size:11px;color:#A32D2D;margin-top:3px;">초과 ${fmt(sp-bgt)}</div>`:''}
    </div>`;
  }).join('')||'<div style="font-size:12px;color:#aaa;">예산 미설정</div>';
}

// ─── 멤버 보기 ────────────────────────────────────
async function renderMembers() {
  showLoading('멤버 데이터 불러오는 중...');
  try {
    const allTx=(await apiLoadTx(null,vm)).txList||[];
    const memberMap={};
    for(const m of members) memberMap[m]={user:m,txList:[],expense:0,income:0,catMap:{}};
    for(const t of allTx){
      if(!memberMap[t.user]) memberMap[t.user]={user:t.user,txList:[],expense:0,income:0,catMap:{}};
      memberMap[t.user].txList.push(t);
      if(t.type==='expense'){ memberMap[t.user].expense+=t.amount; memberMap[t.user].catMap[t.cat]=(memberMap[t.user].catMap[t.cat]||0)+t.amount; }
      else memberMap[t.user].income+=t.amount;
    }
    const all=members.map(m=>({...memberMap[m]||{user:m,txList:[],expense:0,income:0,catMap:{}},isMe:m===me}));
    const maxE=Math.max(...all.map(a=>a.expense),1);
    $('mSum').innerHTML=all.map((a,i)=>{
      const idx=i%AB.length;
      return `<div class="mc">
        <div class="mh" onclick="toggleM('mb${i}')">
          <div class="ava" style="background:${AB[idx]};color:${AF[idx]};">${a.user.slice(0,2)}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:500;">${a.user}${a.isMe?' <span style="font-size:10px;color:#aaa;">(나)</span>':''}</div>
            <div style="font-size:10px;color:#888;">수입 ${fmt(a.income)} · 지출 ${fmt(a.expense)}</div>
          </div>
          <div style="font-size:13px;font-weight:600;color:#A32D2D;margin-right:6px;">${fmt(a.expense)}</div>
          <span style="color:#ccc;font-size:11px;">▼</span>
        </div>
        <div id="mb${i}" class="mb">
          <div class="bw" style="height:6px;margin-bottom:8px;"><div class="bf" style="width:${(a.expense/maxE*100).toFixed(1)}%;background:${AB[idx]};"></div></div>
          ${Object.entries(a.catMap).sort((x,y)=>y[1]-x[1]).map(([cat,amt])=>
            `<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #f0f0ec;">
              <span style="color:#888;">${IC[cat]||'📌'} ${cat}</span><span style="font-weight:500;">${fmt(amt)}</span>
            </div>`).join('')||'<div style="font-size:11px;color:#aaa;">내역 없음</div>'}
        </div>
      </div>`;
    }).join('');
    allTx.sort((a,b)=>b.date.localeCompare(a.date));
    $('mDet').innerHTML=allTx.length
      ? `<div class="tip">다른 멤버 내역은 <b>열람 전용</b>이에요.</div>`
        +allTx.map(t=>`<div class="tx">
          <div class="txic" style="background:${t.type==='income'?'#EAF3DE':'#FCEBEB'};">${IC[t.cat]||'📌'}</div>
          <div class="txin"><div class="txn">${t.desc} <span style="font-size:10px;color:#aaa;">· ${t.user}</span></div><div class="txm">${t.date} · ${t.cat}</div></div>
          <div class="txa ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</div>
          ${t.user===me?`<button class="del" onclick="delTx('${t.id}')">✕</button>`:'<span class="rb">열람</span>'}
        </div>`).join('')
      : '<div style="padding:20px;text-align:center;font-size:12px;color:#aaa;">이번 달 내역 없음</div>';
  } catch(e) { $('mSum').innerHTML='<div style="font-size:12px;color:#aaa;">데이터 로드 실패</div>'; }
  hideLoading();
}

function setMV(v,el) {
  document.querySelectorAll('#pMembers .sm').forEach(b=>b.style.background='');
  el.style.background='#efefeb';
  $('mSum').style.display=v==='s'?'block':'none';
  $('mDet').style.display=v==='d'?'block':'none';
}
function toggleM(id){ $(id).classList.toggle('on'); }

// ─── 통계 ─────────────────────────────────────────
function get6M(){
  const ms=[],n=new Date();
  for(let i=5;i>=0;i--){ const d=new Date(n.getFullYear(),n.getMonth()-i,1); ms.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }
  return ms;
}

async function renderCharts() {
  showLoading('통계 불러오는 중...');
  const months=get6M(), chartData={};
  try { await Promise.all(months.map(async m=>{ chartData[m]=(await apiLoadTx(me,m)).txList||[]; })); } catch(e){}
  hideLoading();
  const iD=months.map(m=>(chartData[m]||[]).filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0));
  const eD=months.map(m=>(chartData[m]||[]).filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));
  if(barI){ barI.destroy(); barI=null; }
  barI=new Chart($('barC'),{type:'bar',data:{labels:months.map(m=>parseInt(m.split('-')[1])+'월'),datasets:[{label:'수입',data:iD,backgroundColor:'#5DCAA5',borderRadius:4},{label:'지출',data:eD,backgroundColor:'#F0997B',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{callback:v=>'₩'+(v/10000).toFixed(0)+'만',font:{size:9}}}}}});
  const cm={};
  myTx.filter(t=>t.type==='expense').forEach(t=>{ cm[t.cat]=(cm[t.cat]||0)+t.amount; });
  const cats=Object.keys(cm),vals=cats.map(c=>cm[c]),tot=vals.reduce((s,v)=>s+v,0);
  if(pieI){ pieI.destroy(); pieI=null; }
  if(cats.length){
    pieI=new Chart($('pieC'),{type:'doughnut',data:{labels:cats,datasets:[{data:vals,backgroundColor:CC.slice(0,cats.length),borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:'55%'}});
    $('pieLeg').innerHTML=cats.map((c,i)=>`<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;"><span style="width:9px;height:9px;border-radius:2px;background:${CC[i]};flex-shrink:0;"></span><span style="color:#888;">${c}</span><span style="margin-left:auto;font-weight:500;">${tot>0?((vals[i]/tot*100).toFixed(1)):0}%</span></div>`).join('');
  } else $('pieLeg').innerHTML='<div style="font-size:12px;color:#aaa;">지출 없음</div>';
}

// ─── AI 질타 ──────────────────────────────────────
async function roast(target) {
  const tx=myTx;
  const sys=`당신은 소비 습관 분석 독설가입니다. 규칙:\n1. 수치를 직접 인용하며 구체적으로 질타\n2. 문제 소비 패턴 3개 이상 명확히 지적\n3. 칭찬 최대 1줄만\n4. 한국어, 이모지 적극 사용\n5. 마지막 줄 반드시 "💬 한 줄 평: "으로 시작\n6. 500자 이내`;
  let data='';
  if(target==='me'){
    const exp=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const inc=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const cm={};tx.filter(t=>t.type==='expense').forEach(t=>{ cm[t.cat]=(cm[t.cat]||0)+t.amount; });
    const bs=Object.entries(budgets).map(([c,b])=>{const s=cm[c]||0;return`${c}:예산${fmt(b)} 실제${fmt(s)}(${b>0?((s/b*100).toFixed(0)):0}%)`;}).join(', ');
    data=`사용자:${me} / 월:${vm}\n수입:${fmt(inc)}, 지출:${fmt(exp)}, 잔액:${fmt(inc-exp)}\n카테고리별:\n${Object.entries(cm).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${fmt(v)}`).join('\n')||'없음'}\n예산: ${bs||'미설정'}\n거래:\n${[...tx].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`- ${t.date} ${t.type==='expense'?'-':'+'}${fmt(t.amount)} [${t.cat}] ${t.desc}`).join('\n')||'없음'}`;
  } else {
    showLoading('그룹 데이터 불러오는 중...');
    const allTx=(await apiLoadTx(null,vm)).txList||[];
    hideLoading();
    const mmap={};
    for(const t of allTx){
      if(!mmap[t.user]) mmap[t.user]={user:t.user,expense:0,income:0,catMap:{}};
      if(t.type==='expense'){ mmap[t.user].expense+=t.amount; mmap[t.user].catMap[t.cat]=(mmap[t.user].catMap[t.cat]||0)+t.amount; }
      else mmap[t.user].income+=t.amount;
    }
    data=`그룹 ${Object.keys(mmap).length}명 ${vm}:\n`+Object.values(mmap).map(a=>`[${a.user}] 지출:${fmt(a.expense)} 수입:${fmt(a.income)}\n`+Object.entries(a.catMap).sort((x,y)=>y[1]-x[1]).map(([c,v])=>`  - ${c}: ${fmt(v)}`).join('\n')).join('\n\n');
  }
  const btnId=target==='me'?'rMe':'rAll';
  $(btnId).disabled=true;
  $('roastOut').innerHTML=`<div style="display:flex;align-items:center;gap:9px;padding:20px 0;font-size:12px;color:#888;"><span class="spin"></span> AI가 소비 데이터를 뜯어보고 있어요...</div>`;
  $('roastCat').innerHTML='';
  try {
    const d=await apiFetch('/api/roast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:sys,messages:[{role:'user',content:`냉정하게 분석해줘:\n\n${data}`}]})});
    if(d.text) $('roastOut').innerHTML=`<div class="roastbox">${d.text.replace(/\n/g,'<br>')}</div>`;
    else throw new Error();
  } catch(e) {
    $('roastOut').innerHTML=`<div style="color:#A32D2D;font-size:12px;padding:10px;background:#fff5f5;border-radius:8px;margin-top:12px;">AI 연결 오류 — ANTHROPIC_API_KEY 환경변수를 확인해 주세요.</div>`;
  }
  $(btnId).disabled=false;
  const cm={};tx.filter(t=>t.type==='expense').forEach(t=>{ cm[t.cat]=(cm[t.cat]||0)+t.amount; });
  const tot=Object.values(cm).reduce((s,v)=>s+v,0);
  if(Object.keys(cm).length){
    $('roastCat').innerHTML=`<div class="sec" style="margin-top:14px;">${me}의 이번 달 지출 분포</div>`+
      Object.entries(cm).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>`<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;"><span style="font-size:11px;min-width:60px;color:#888;">${cat}</span><div class="bw" style="flex:1;"><div class="bf" style="width:${tot>0?((amt/tot*100).toFixed(1)):0}%;background:#E24B4A;"></div></div><span style="font-size:11px;font-weight:500;min-width:66px;text-align:right;">${fmt(amt)}</span><span style="font-size:10px;color:#aaa;min-width:28px;text-align:right;">${tot>0?((amt/tot*100).toFixed(0)):0}%</span></div>`).join('');
  }
}

function goHome(){
  me=''; myTx=[]; budgets={}; budgetIds={}; sel=''; filterCat='전체';
  $('sMain').classList.remove('on'); $('sHome').classList.add('on');
  $('startBtn').disabled=true; $('startBtn').style.opacity='.4';
  renderHome();
}

// ─── 초기화 ───────────────────────────────────────
loadMembers(); renderHome();
const last=lsGet('bg_last'); if(last) selectM(last);
