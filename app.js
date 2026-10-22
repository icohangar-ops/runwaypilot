const SAMPLE=`week,inflow,outflow,memo
1,42000,38000,payroll
2,18000,22000,
3,35000,61000,supplier AUD invoice
4,12000,24000,
5,40000,39000,payroll
6,9000,47000,equipment lease
7,30000,26000,
8,15000,41000,quarterly tax
9,44000,38000,payroll
10,20000,23000,
11,38000,30000,
12,16000,27000,
13,47000,39000,payroll`;
const $=id=>document.getElementById(id),KEY='runwaypilot.v1';
let st=JSON.parse(localStorage.getItem(KEY)||'null')||{plan:'Free',cur:'Acme Minerals',ws:{'Acme Minerals':{csv:SAMPLE,open:130000,floor:25000}}};
const save=()=>localStorage.setItem(KEY,JSON.stringify(st)),usd=c=>'$'+Math.round(c/100).toLocaleString();
function load(){const w=st.ws[st.cur];$('csv').value=w.csv;$('open').value=w.open;$('floor').value=w.floor;$('ws').innerHTML=Object.keys(st.ws).map(k=>`<option ${k==st.cur?'selected':''}>${k}</option>`).join('');$('planlbl').textContent=st.plan;
 document.querySelectorAll('.plan').forEach(p=>p.classList.toggle('cur',p.dataset.p==st.plan));run()}
function run(){const w=st.ws[st.cur];w.csv=$('csv').value;w.open=+$('open').value;w.floor=+$('floor').value;save();
 const gated=st.plan==='Free';const s=forecast(parseCSV(w.csv),w.open*100,gated?{}:{delay:+$('delay').value,cut:+$('cut').value});const a=analyze(s,w.floor*100);
 $('runway').textContent=a.runway+' wks';$('runway').className=a.runway<13?'bad':'ok';$('low').textContent=usd(a.low.bal)+' (wk '+a.low.week+')';$('end').textContent=usd(s[12].bal);
 $('alerts').innerHTML=a.acts.map(x=>`<li>${x}</li>`).join('')+(gated?'<li><i>Scenarios & email alerts are Pro features.</i></li>':'');
 $('tbl').innerHTML='<tr><th>Week</th><th>In</th><th>Out</th><th>Balance</th><th>Memo</th></tr>'+s.map(r=>`<tr><td>${r.week}</td><td>${usd(r.in)}</td><td>${usd(r.out)}</td><td class="${r.bal<w.floor*100?'bad':''}">${usd(r.bal)}</td><td>${r.memo}</td></tr>`).join('');
 const mx=Math.max(...s.map(r=>r.bal),w.floor*100,1),mn=Math.min(...s.map(r=>r.bal),0),Y=v=>200-(v-mn)/(mx-mn)*180,X=i=>30+i*58;
 $('chart').innerHTML=`<line x1="20" x2="790" y1="${Y(w.floor*100)}" y2="${Y(w.floor*100)}" stroke="#ff7b72" stroke-dasharray="6"/><polyline fill="none" stroke="#6ee6a0" stroke-width="3" points="${s.map((r,i)=>X(i)+','+Y(r.bal)).join(' ')}"/>`+s.map((r,i)=>`<circle cx="${X(i)}" cy="${Y(r.bal)}" r="4" fill="${r.bal<w.floor*100?'#ff7b72':'#6ee6a0'}"/>`).join('')}
$('run').onclick=run;$('ws').onchange=e=>{st.cur=e.target.value;save();load()};
$('newws').onclick=()=>{if(st.plan!=='Firm'&&Object.keys(st.ws).length>=1){alert('Multiple client workspaces need the Firm plan.');return}const n=prompt('Client name');if(n){st.ws[n]={csv:SAMPLE,open:50000,floor:20000};st.cur=n;save();load()}};
document.querySelectorAll('.plan').forEach(p=>p.onclick=()=>{st.plan=p.dataset.p;save();load()});
const q=new URLSearchParams(location.search);if(q.get('plan')){st.plan=q.get('plan');if(q.get('delay'))setTimeout(()=>{$('delay').value=q.get('delay');$('cut').value=q.get('cut')||0;run()},0)}
load();
