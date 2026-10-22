const a=require('assert'),{parseCSV,forecast,analyze}=require('./engine');
const rows=parseCSV('week,inflow,outflow\n1,100,50\n2,0,200\n3,300,0');
let s=forecast(rows,10000);a.strictEqual(s[0].bal,15000);a.strictEqual(s[1].bal,-5000);
a.strictEqual(analyze(s,0).runway,1);
s=forecast(rows,10000,{delay:1});a.strictEqual(s[0].bal,5000);a.strictEqual(s[1].bal,-5000);
s=forecast(parseCSV('1,0.1,0\n2,0.2,0'),0);a.strictEqual(s[1].bal,30);
console.log('5 tests passed');
