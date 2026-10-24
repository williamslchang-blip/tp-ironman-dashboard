'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const chart=require('../scripts/assets/weekly-review.js');
const rows=[{week:1,hours:{swim:0,total:2}},{week:2,hours:{swim:1,total:4}},{week:3,hours:{swim:null,total:null}},{week:4,hours:{swim:2,total:6}}];
const p=chart.buildPaths(rows,'swim',i=>i,v=>v);
assert.equal((p.match(/M/g)||[]).length,2,'missing data must split lines');assert.equal((p.match(/L/g)||[]).length,1);assert.ok(p.startsWith('M0.00,0.00'),'known zero is a valid point');assert.equal(chart.buildPaths([{hours:{swim:null}}],'swim',i=>i,v=>v),'');assert.equal(chart.maximum(rows,['total']),10);assert.equal(chart.maximum(rows,['swim']),5);
const all=chart.recordsFor({2:{training_review:rows[1]}});assert.equal(all.length,52);assert.equal(all[0].hours.total,null);assert.equal(all[1].hours.total,4);assert.equal(all[51].hours.total,null);
const source=fs.readFileSync(path.join(__dirname,'../scripts/assets/weekly-review.js'),'utf8');for(const file of ['../docs/weekly-review.js','../outputs/weekly-review.js'])assert.equal(fs.readFileSync(path.join(__dirname,file),'utf8'),source);
console.log('PASS: null gaps, genuine zeros, 52-week coverage, axis scaling and identical deployed chart assets.');
