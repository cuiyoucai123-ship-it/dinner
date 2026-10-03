const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../magic-button.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const core=script.slice(0,script.indexOf('const $='));
const context=vm.createContext({Date,Math});
vm.runInContext(core,context);
const now=new Date(2026,9,3,12);
const week=context.days(now);
test('study window includes today and six preceding local days across year boundary',()=>{
  assert.deepEqual(Array.from(context.days(new Date(2026,0,2,12))),['2026-01-02','2026-01-01','2025-12-31','2025-12-30','2025-12-29','2025-12-28','2025-12-27']);
});
test('a capped neglected subject actually shrinks after its first study',()=>{
  const before=context.shares([1,...Array(8).fill(0)]);
  const after=context.shares([context.priority([week[0]],now),...Array(8).fill(0)]);
  assert.ok(Math.abs(before[0]-1/3)<1e-8);
  assert.ok(after[0]<before[0]-.01);
  assert.ok(after[1]>before[1]);
});
test('more study days lower both area and stable color input',()=>{
  const five=context.priority(week.slice(0,5),now),six=context.priority(week.slice(0,6),now);
  assert.ok(six<five);assert.ok(five<.4);
  const areas=context.shares([six,...Array(8).fill(five)]);
  assert.ok(areas[0]<areas[1]);
  assert.equal(context.priority(week,now),0);
  assert.equal(context.priority([],now),1);
});
test('smooth allocation respects maximum area for 1 to 60 subjects',()=>{
  for(let n=1;n<=60;n++){
    for(const values of [Array(n).fill(0),Array(n).fill(1),[1,...Array(n-1).fill(0)],Array.from({length:n},(_,i)=>i/n)]){
      const areas=context.shares(values);
      assert.ok(areas.every(area=>area>0&&area<=1/3+1e-8));
      assert.ok(areas.reduce((a,b)=>a+b,0)<=1+1e-8);
    }
  }
});
test('scrolling boards also respect one third of the visible phone area',()=>{
  const width=354,height=2160,phoneArea=390*844,cap=phoneArea/(3*width*height);
  const areas=context.shares([1,...Array(39).fill(0)],cap);
  assert.ok(areas.every(area=>area*width*height<=phoneArea/3+1e-6));
});
test('continuous daily study reduces attention instead of staying at the same level',()=>{
  let records=[],previous=1;
  for(let i=0;i<7;i++){
    const date=new Date(2026,9,3+i,12);records.push(context.dayKey(date));
    const next=context.priority(records,date);assert.ok(next<previous);previous=next;
  }
});
test('new local day increases attention and duplicate dates do not increase credit',()=>{
  assert.ok(context.priority(week,new Date(2026,9,4,12))>context.priority(week,now));
  assert.equal(context.priority([week[0],week[0]],now),context.priority([week[0]],now));
});
test('nine-subject layout preserves columns and order after every subject is clicked',()=>{
  const values=[1,.9,.75,.6,.5,.4,.3,.2,.1];
  const make=list=>context.layout(context.shares(list).map((area,id)=>({id,area})),0,0,354,682);
  const before=make(values);
  for(let id=0;id<9;id++){
    const changed=values.map((value,i)=>i===id?Math.max(0,value-.15):value),after=make(changed);
    for(let i=0;i<9;i++){
      assert.equal(after[i].id,before[i].id);
      assert.equal(after[i].x===0,before[i].x===0);
      assert.ok(after[i].w>=105);assert.ok(after[i].h>=66);
    }
    for(let i=1;i<5;i++)assert.ok(after[i].y>after[i-1].y);
    for(let i=6;i<9;i++)assert.ok(after[i].y>after[i-1].y);
    for(let i=0;i<9;i++)for(let j=i+1;j<9;j++){
      const a=after[i],b=after[j];
      assert.ok(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<1e-6||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<1e-6);
    }
  }
});
test('history corrections add and cancel dates without modifying other subjects',()=>{
  let list=[{id:'english',records:[week[1]]},{id:'math',records:[week[0]]}];
  let renders=0;
  const sandbox=vm.createContext({Date,Math,subjects:()=>list,days:()=>Array.from(week),updateSubjects:next=>{list=next;return true;},render:()=>renders++,renderHistory:()=>{},$:()=>({open:false})});
  const body=script.slice(script.indexOf('function setStudy('),script.indexOf('function record('));
  vm.runInContext(body,sandbox);
  assert.equal(sandbox.setStudy('english',week[2],true),true);
  assert.ok(list[0].records.includes(week[2]));
  sandbox.setStudy('english',week[2],true);
  assert.equal(list[0].records.filter(date=>date===week[2]).length,1);
  sandbox.setStudy('english',week[2],false);
  assert.equal(list[0].records.includes(week[2]),false);
  assert.deepEqual(Array.from(list[1].records),[week[0]]);
  assert.equal(sandbox.setStudy('english','2026-09-20',true),false);
  assert.equal(sandbox.setStudy('unknown',week[0],true),false);
  assert.equal(renders,3);
});
test('long press opens history without recording and dragging cancels the hold',()=>{
  let pending=null,open=0,recorded=0,prevented=0;
  const handlers={};
  const button={addEventListener:(name,fn)=>{handlers[name]=fn;}};
  const sandbox=vm.createContext({Math,editing:false,setTimeout:fn=>{pending=fn;return 1;},clearTimeout:()=>{pending=null;},openHistory:()=>open++,record:()=>recorded++,openSubject:()=>{}});
  vm.runInContext(script.slice(script.indexOf('function bindSubject('),script.indexOf('function openHistory(')),sandbox);
  sandbox.bindSubject(button,'english');
  const event={button:0,clientX:100,clientY:100,preventDefault:()=>prevented++};
  handlers.pointerdown(event);assert.ok(pending);pending();handlers.pointerup(event);button.onclick(event);
  assert.equal(open,1);assert.equal(recorded,0);assert.equal(prevented,1);
  handlers.pointerdown(event);handlers.pointermove({...event,clientX:125});assert.equal(pending,null);button.onclick(event);
  assert.equal(open,1);assert.equal(recorded,0);
  handlers.pointerdown(event);handlers.pointerup(event);button.onclick(event);assert.equal(recorded,1);
});

function openStoredApp(disk,failWrites=false){
  const sandbox=vm.createContext({Date,Math,document:{getElementById:()=>({open:false})},localStorage:{getItem:key=>disk.get(key)||null,setItem:(key,value)=>{if(failWrites)throw new Error('Storage unavailable');disk.set(key,value);}}});
  vm.runInContext(core,sandbox);
  vm.runInContext(script.slice(script.indexOf('const $='),script.indexOf('function color(')),sandbox);
  vm.runInContext('render=()=>{};renderHistory=()=>{};animatePress=()=>{};notify=()=>{};',sandbox);
  vm.runInContext(script.slice(script.indexOf('function setStudy('),script.indexOf('function bindSubject(')),sandbox);
  return sandbox;
}
test('first-use subject edits and study records survive reopening without a start action',()=>{
  const disk=new Map();let app=openStoredApp(disk);
  assert.equal(vm.runInContext('subjects().every(s=>s.records.length===0)',app),true);
  assert.equal(vm.runInContext("updateSubjects(subjects().map((s,i)=>i===0?{...s,name:'我的英语'}:s))",app),true);
  assert.equal(vm.runInContext("record(subjects()[0].id)",app),true);
  app=openStoredApp(disk);
  assert.equal(vm.runInContext('subjects()[0].name',app),'我的英语');
  assert.equal(vm.runInContext('subjects()[0].records.includes(dayKey())',app),true);
  assert.equal(vm.runInContext('subjects().length',app),9);
});
test('existing records retain names and dates regardless of the old started flag',()=>{
  for(const started of [true,false]){
    const disk=new Map([['magic-study:v1',JSON.stringify({version:1,started,subjects:[{id:'mine',name:'我的数学',records:['2026-10-01']}]})]]);
    const app=openStoredApp(disk);
    assert.equal(vm.runInContext('subjects()[0].name',app),'我的数学');
    assert.equal(vm.runInContext('subjects()[0].records[0]',app),'2026-10-01');
    vm.runInContext("updateSubjects([...subjects(),{id:'new',name:'英语',records:[]}])",app);
    assert.equal(vm.runInContext('subjects().length',openStoredApp(disk)),2);
  }
});
test('failed local writes do not pretend to save a study record',()=>{
  const disk=new Map(),app=openStoredApp(disk,true);
  assert.equal(vm.runInContext('record(subjects()[0].id)',app),false);
  assert.equal(vm.runInContext('subjects()[0].records.length',app),0);
  assert.equal(disk.size,0);
});
