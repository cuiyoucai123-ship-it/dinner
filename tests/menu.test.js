const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadMenu() {
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const storage = new Map();
  const context = vm.createContext({ Date, window: {}, localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  }});
  vm.runInContext(source.slice(0, source.lastIndexOf('\ninitializeStorage();')), context);
  return { storage, run: code => vm.runInContext(code, context) };
}

test('week has explicit lunch quantities, alternating dinner staples and separated snacks', () => {
  const {run} = loadMenu();
  const days = JSON.parse(run('JSON.stringify(DEFAULT_PLAN)'));
  assert.equal(days.length, 7);
  days.forEach((day, index) => {
    assert.equal(day.lunch.items.find(item => item.id === 'rice').amount, '250g');
    const staple = day.dinner.items.find(item => item.id === 'staple');
    assert.equal(staple.name, index % 2 === 0 ? '米饭（熟重）' : '全麦面包');
    assert.equal(staple.amount, index % 2 === 0 ? '150g' : '60g');
    assert.ok(day.lunch.items.filter(item => item.id.startsWith('vegetable-')).every(item => /^\d+g$/.test(item.amount)));
    assert.equal(day.snack.items.length, 2);
    assert.equal(day.dinner.evening.length, 2);
    assert.doesNotMatch(JSON.stringify(day), /按当天安排|三选一|同周一|原有分量|一次卤/);
  });
});

test('rice reminder follows saved dinner amount and disappears when switched to bread', () => {
  const {storage,run} = loadMenu();
  assert.match(run('riceReminder(0)'), /400g.*150g/);
  assert.equal(run('riceReminder(1)'), '');
  const dinner = JSON.parse(run('JSON.stringify(DEFAULT_PLAN[0].dinner)'));
  const rice = dinner.items.find(item => item.id === 'staple');
  rice.amount = '200g';
  storage.set('dailyMeals.v4', JSON.stringify({0:{dinner}}));
  assert.match(run('riceReminder(0)'), /450g.*200g/);
  rice.name = '全麦面包'; rice.amount = '60g';
  storage.set('dailyMeals.v4', JSON.stringify({0:{dinner}}));
  assert.equal(run('riceReminder(0)'), '');
});

test('non-gram rice portions do not produce a fabricated gram total', () => {
  const {storage,run} = loadMenu();
  const dinner = JSON.parse(run('JSON.stringify(DEFAULT_PLAN[0].dinner)'));
  dinner.items.find(item => item.id === 'staple').amount = '一小碗';
  storage.set('dailyMeals.v4', JSON.stringify({0:{dinner}}));
  assert.match(run('riceReminder(0)'), /一小碗/);
  assert.doesNotMatch(run('riceReminder(0)'), /共需|NaN/);
});

test('invalid stored meals fall back without crashing or losing defaults', () => {
  const {storage,run} = loadMenu();
  storage.set('dailyMeals.v4', '{broken');
  assert.equal(run('getMeal(0,"lunch").items[2].amount'), '250g');
  storage.set('dailyMeals.v4', JSON.stringify({0:{lunch:{items:[null],steps:'x'}}}));
  assert.equal(run('getMeal(0,"lunch").items[2].amount'), '250g');
});

test('user-supplied food and cooking text are displayed as text, not HTML', () => {
  const {storage,run} = loadMenu();
  const dinner = JSON.parse(run('JSON.stringify(DEFAULT_PLAN[0].dinner)'));
  dinner.items[0].name = '<img src=x onerror=alert(1)>';
  dinner.steps = '<script>alert(1)</script>';
  storage.set('dailyMeals.v4', JSON.stringify({0:{dinner}}));
  const html = run('activeDay=0; renderMealCard("dinner")');
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|<img/);
});

test('completion is per local calendar day, not a repeating weekday', () => {
  const {storage,run} = loadMenu();
  storage.set('dailyMeals.completed.v1', JSON.stringify({'2026-09-22':['lunch','snack']}));
  assert.equal(run('JSON.stringify(completedMeals(new Date(2026,8,22,23,59)))'), '["lunch","snack"]');
  assert.equal(run('JSON.stringify(completedMeals(new Date(2026,8,23,0,1)))'), '[]');
  assert.equal(run('JSON.stringify(completedMeals(new Date(2026,8,29,12)))'), '[]');
});

test('closing and reopening meals persists without modifying food edits', () => {
  const {storage,run} = loadMenu();
  run('renderHome=()=>{}; showToast=()=>{};');
  const custom = '{"0":{"snack":{"items":[],"steps":"custom"}}}';
  storage.set('dailyMeals.v4', custom);
  run('setMealDone("lunch",true); setMealDone("snack",true);');
  assert.equal(run('JSON.stringify(completedMeals())'), '["lunch","snack"]');
  // A fresh application instance, with the same browser storage, sees the same state.
  const fresh = loadMenu();
  fresh.storage.set('dailyMeals.completed.v1', storage.get('dailyMeals.completed.v1'));
  assert.equal(fresh.run('JSON.stringify(completedMeals())'), '["lunch","snack"]');
  run('setMealDone("lunch",false)');
  assert.equal(run('JSON.stringify(completedMeals())'), '["snack"]');
  assert.equal(storage.get('dailyMeals.v4'), custom);
});

test('other weekday views cannot mark today as done', () => {
  const {storage,run} = loadMenu();
  run('renderHome=()=>{}; showToast=()=>{}; activeDay=(todayIndex()+1)%7; setMealDone("lunch",true);');
  assert.equal(storage.has('dailyMeals.completed.v1'), false);
});
