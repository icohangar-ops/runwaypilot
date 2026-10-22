// Pure forecast engine (integer cents to avoid float drift). Shared by browser + tests.
function parseCSV(t){return t.trim().split(/\n/).filter(l=>l&&!/^week/i.test(l)).map(l=>{const[w,i,o,...m]=l.split(',');return{week:+w,in:Math.round(+i*100),out:Math.round(+o*100),memo:m.join(',').trim()}})}
function forecast(rows,openCents,{delay=0,cut=0}={}){const W=13,inf=Array(W+8).fill(0),outf=Array(W).fill(0),memo=Array(W).fill('');
 rows.forEach(r=>{if(r.week<1||r.week>W)return;inf[r.week-1+delay]+=r.in;outf[r.week-1]+=Math.round(r.out*(100-cut)/100);if(r.memo&&!memo[r.week-1])memo[r.week-1]=r.memo});
 let b=openCents;return Array.from({length:W},(_,i)=>{b+=inf[i]-outf[i];return{week:i+1,in:inf[i],out:outf[i],bal:b,memo:memo[i]}})}
function analyze(series,floorCents){const breach=series.find(s=>s.bal<floorCents);const low=series.reduce((a,s)=>s.bal<a.bal?s:a);
 const acts=[];if(breach){const gap=floorCents-breach.bal;acts.push(`Cash falls below floor in week ${breach.week} (short $${(gap/100).toLocaleString()}). Defer non-critical payables or draw $${Math.ceil(gap/100/1000)*1000} on the credit line by week ${Math.max(1,breach.week-1)}.`);
  const big=series.filter(s=>s.week<=breach.week).sort((a,b)=>b.out-a.out)[0];if(big)acts.push(`Largest outflow before breach: week ${big.week} $${(big.out/100).toLocaleString()}${big.memo?' ('+big.memo+')':''}. Negotiate terms first.`)}
 else acts.push('Runway covers all 13 weeks above floor. Consider sweeping excess to a yield account.');
 return{runway:breach?breach.week-1:13,low,acts}}
if(typeof module!=='undefined')module.exports={parseCSV,forecast,analyze};
