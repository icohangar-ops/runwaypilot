// PayPal receivables panel: invoices -> forecast inflows, breach-aware send/remind, AI memo.
(function(){
const $=id=>document.getElementById(id);let INV=[],SRC='';
const weekOf=d=>Math.min(13,Math.max(1,Math.ceil((new Date(d)-Date.now())/6048e5)));
window.invoiceRows=()=>$('useinv')&&$('useinv').checked?INV.filter(i=>i.status!=='DRAFT'||true).map(i=>({week:weekOf(i.due_date),in:Math.round(i.amount*100),out:0,memo:'PayPal '+(i.number||'')+' '+i.customer})):[];
function breachWeek(){const st=window.rpState(),s=window.lastSeries(),f=st.ws[st.cur].floor*100;const b=s.find(x=>x.bal<f);return b?b.week:null}
function render(){const bw=breachWeek();$('ppsrc').textContent=SRC==='mock'?'MOCK DATA (PayPal env vars not set)':SRC==='paypal-sandbox'?'Live: PayPal sandbox':'';
 $('ppmsg').textContent=INV.length?(bw?`Cash-floor breach forecast in week ${bw}: invoices due before then are flagged — send or remind now.`:'No breach forecast. Invoices are counted as expected inflows in their due week.'):'No open invoices yet. Click "Seed demo invoices" to create sandbox drafts.';
 $('invtbl').innerHTML='<tr><th>Invoice</th><th>Customer</th><th>Due (wk)</th><th>Status</th><th>Amount</th><th>Action</th></tr>'+INV.map(i=>{const wk=weekOf(i.due_date),urgent=bw&&wk<=bw;const act=i.status==='DRAFT'?'send':'remind';
  return `<tr class="${urgent?'urgent':''}"><td>${i.number||i.id.slice(0,9)}</td><td>${i.customer}</td><td>${i.due_date} (${wk})</td><td>${i.status}</td><td>$${i.amount.toLocaleString()}</td><td><button class="pp" data-id="${i.id}" data-act="${act}">${act==='send'?'Send invoice':'Send reminder'}</button></td></tr>`}).join('');
 document.querySelectorAll('#invtbl button').forEach(b=>b.onclick=()=>act(b.dataset.id,b.dataset.act,b))}
async function load(){$('ppmsg').textContent='Loading PayPal invoices…';const r=await fetch('/api/invoices');const j=await r.json();SRC=j.source;INV=j.invoices||[];if(j.error)$('ppmsg').textContent='PayPal error: '+j.error;window.runForecast();render()}
async function act(id,action,btn){btn.disabled=true;btn.textContent='…';const r=await fetch('/api/invoice-action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action})});const j=await r.json();
 $('ppmsg').textContent=j.ok?`PayPal ${action==='send'?'sent':'reminded'} ${id} → status ${j.status}${j.mock?' (mock)':''}`:'Error: '+j.error;await load();$('ppmsg').textContent=j.ok?`✔ PayPal ${action==='send'?'sent invoice':'sent reminder for'} ${id} → ${j.status}${j.mock?' (mock)':''}`:'Error: '+j.error}
$('seed').onclick=async()=>{$('ppmsg').textContent='Creating sandbox invoices…';const j=await (await fetch('/api/seed',{method:'POST'})).json();await load();$('ppmsg').textContent=j.created?`Created ${j.created} draft invoices in PayPal sandbox.`:(j.note||j.error||'Nothing created.')};
$('refresh').onclick=load;$('useinv').onchange=()=>{window.runForecast();render()};
$('memobtn').onclick=async()=>{$('memo').textContent='Thinking like a CFO…';const st=window.rpState();
 const j=await (await fetch('/api/memo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace:st.cur,floor:st.ws[st.cur].floor,forecast:window.lastSeries(),invoices:INV})})).json();
 $('aitag').textContent=j.ai?'AI: '+j.model:'deterministic fallback';$('memo').textContent=j.memo+'\n\nCHASE ORDER\n'+(j.ranked||[]).map((x,i)=>`${i+1}. ${x.customer} — $${x.amount.toLocaleString()} — ${x.action}${x.reason?' — '+x.reason:''}`).join('\n')};
const _run=window.runForecast;window.runForecast=()=>{_run();if(INV.length)render()};document.getElementById('run').onclick=window.runForecast;
load();})();
