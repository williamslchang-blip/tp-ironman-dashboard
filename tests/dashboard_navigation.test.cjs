'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function block(text){const a=text.indexOf("let currentSubtab = 'estimate';"),b=text.indexOf('function renderMainContent(',a);assert.ok(a>=0&&b>a);return text.slice(a,b).trim();}
const generated=fs.readFileSync(path.join(root,'scripts/generate_web_dashboard.py'),'utf8');
const expected=block(generated).replaceAll('{{','{').replaceAll('}}','}');
function browser(code,url){
let current=new URL(url),scrolls=0;const timers=[],state={week:43};
const names=['estimate','targets','overview','articles','review'];
function node(){const classes=new Set();return {classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},scrollIntoView:()=>scrolls++};}
const views=Object.fromEntries(names.map(n=>[n,node()])),buttons=Object.fromEntries(names.map(n=>[n,node()])),anchors=Object.fromEntries(['summary','swim','bike','run','recovery','recovery-guideline','coachInsightsBox'].map(n=>[n,node()]));
const window={history:{state,replaceState:(s,unused,url)=>{assert.equal(s,state);current=new URL(url,current);}}};Object.defineProperty(window,'location',{get:()=>current});
const ctx=vm.createContext({window,setTimeout:f=>{timers.push(f);},document:{querySelectorAll:s=>s==='.subtab-view'?Object.values(views):Object.values(buttons),getElementById:id=>id.startsWith('subview-')?views[id.slice(8)]:anchors[id],querySelector:s=>buttons[s.match(/data-tab="([^"]+)"/)?.[1]]}});
vm.runInContext(code,ctx);
return {ctx,views,get url(){return current;},flush:()=>{while(timers.length)timers.shift()();},get scrolls(){return scrolls;}};
}
for(const file of ['docs/index.html','outputs/index.html']){
const text=fs.readFileSync(path.join(root,file),'utf8'),code=block(text);assert.equal(code,expected,file+' must match generator');
const navStart=text.indexOf('<!-- SUBNAV TABS'),navEnd=text.indexOf('<!-- SUBTAB 1:',navStart),tabs=[...text.slice(navStart,navEnd).matchAll(/data-tab="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(tabs,['estimate','targets','overview','articles','review']);assert.ok(!text.includes('id="subview-plan"'));assert.ok(text.includes('id="subview-targets"'));
for(const category of ['summary','swim','bike','run','recovery'])for(const target of ['estimate','targets','overview','review']){
const b=browser(code,'https://example.org/tp/index.html?week=43#'+category);b.ctx.checkUrlHash();assert.ok(b.views.articles.classList.contains('active'));assert.equal(b.url.hash,'#'+category);b.ctx.openSubtab(target);assert.ok(b.views[target].classList.contains('active'));assert.equal(b.url.href,'https://example.org/tp/index.html?week=43');b.ctx.checkUrlHash();assert.ok(b.views[target].classList.contains('active'),'week change must not reopen articles');b.flush();assert.equal(b.scrolls,0,'obsolete article scroll must not run');
}
for(const [hash,target]of [['targets','targets'],['target-races','targets'],['races','targets'],['plan','overview'],['workout','overview'],['strength','overview'],['review','review'],['estimate','estimate'],['overview','overview'],['coach-recovery','overview'],['swim','articles']]){
const b=browser(code,'https://example.org/tp/index.html#'+hash);b.ctx.checkUrlHash();assert.ok(b.views[target].classList.contains('active'),hash);assert.equal(b.url.hash,'#'+hash,'shared link preserved');
}
const b=browser(code,'https://example.org/tp/index.html');b.ctx.openSubtab('overview');assert.equal(b.url.hash,'');assert.ok(b.views.overview.classList.contains('active'));
}
console.log('PASS: five article categories × four main tabs, clean URLs/query preservation, week re-routing, cancelled scrolls, deep links, target order, removed plan and generator/output consistency.');
