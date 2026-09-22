const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const script = fs.readFileSync(path.join(root, 'plan-migration.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
// Use the real new plan and the immutable v3 snapshot shipped by the migrator.
const defaults = JSON.parse(vm.runInNewContext(app.slice(0, app.indexOf('const MEAL_META')) + '\nJSON.stringify(DEFAULT_PLAN)'));
const old = JSON.parse(vm.runInNewContext(script.slice(script.indexOf('  const OLD_LUNCH'), script.indexOf('  const isObject')) + '\nJSON.stringify(OLD_DINNERS.map(dinner => ({lunch:OLD_LUNCH,dinner,snack:OLD_SNACK})))'));
const context = {window:{}};
vm.runInNewContext(script, context);
const migrate = (legacy, plan = defaults) => clone(context.window.migrateLegacyMeals(legacy, plan));
const card = (day, meal) => ({[day]: {[meal]:clone(old[day][meal])}});
const byId = (meal, id) => meal.items.find(item => item.id === id);

test('invalid or absent legacy data is ignored safely', () => {
  for (const value of [undefined,null,[],1,'bad']) assert.deepEqual(migrate(value),{});
  assert.deepEqual(migrate({0:{lunch:[null]}}),{});
  for (const value of [undefined,null,{},[],[null]]) assert.deepEqual(migrate(card(0,'lunch'),value),{});
});
test('all seven unchanged old cards leave every new default intact', () => {
  assert.deepEqual(migrate(Object.fromEntries(old.map((day,i) => [i,day]))),{});
});
test('old egg amount edits map to new chicken-egg name and preserve 250g rice', () => {
  const saved = card(0,'lunch'); saved[0].lunch[1].amount = '2个';
  const result = migrate(saved)[0];
  assert.deepEqual(Object.keys(result),['lunch']);
  assert.deepEqual(byId(result.lunch,'egg'),{id:'egg',name:'鸡蛋',amount:'2个'});
  assert.equal(byId(result.lunch,'rice').amount,'250g');
  assert.ok(byId(result.lunch,'vegetable-2'));
});
test('actual old rice quantity edits survive without restoring old generic name', () => {
  const saved = card(0,'lunch'); saved[0].lunch[2].amount = '300g';
  const rice = byId(migrate(saved)[0].lunch,'rice');
  assert.equal(rice.name,'米饭（熟重）'); assert.equal(rice.amount,'300g');
});
test('deleting old egg or generic vegetable does not remove new second vegetable', () => {
  const saved = card(0,'lunch'); saved[0].lunch = saved[0].lunch.filter((_,i) => i !== 1 && i !== 3);
  const result = migrate(saved)[0].lunch;
  assert.equal(byId(result,'egg'),undefined); assert.equal(byId(result,'vegetable-1'),undefined);
  assert.ok(byId(result,'vegetable-2')); assert.equal(byId(result,'rice').amount,'250g');
});
test('same-slot rename preserves the new unchanged amount', () => {
  const saved = card(0,'lunch'); saved[0].lunch[2].name = '杂粮饭';
  const rice = byId(migrate(saved)[0].lunch,'rice');
  assert.equal(rice.name,'杂粮饭'); assert.equal(rice.amount,'250g');
});
test('added foods and edited how become custom notes', () => {
  const saved = card(0,'lunch'); saved[0].lunch[0].how = '自己安排';
  saved[0].lunch.push({name:'香蕉',amount:'1根',how:'直接吃'});
  const result = migrate(saved)[0].lunch;
  assert.equal(result.items.at(-1).name,'香蕉');
  assert.ok(result.steps.includes('自定义备注：去皮卤琵琶腿：自己安排'));
  assert.ok(result.steps.includes('自定义备注：香蕉：直接吃'));
  assert.ok(!result.steps.includes(old[0].lunch[1].how));
});
test('Tuesday chicken and cabbage edits map by identity across split ingredients', () => {
  const saved = card(1,'dinner'); saved[1].dinner[0].amount = '180g'; saved[1].dinner[2].amount = '120g';
  const result = migrate(saved)[1].dinner;
  assert.equal(byId(result,'chicken').name,'鸡里脊'); assert.equal(byId(result,'chicken').amount,'180g');
  assert.equal(result.items.find(item => item.name === '紫甘蓝').amount,'120g');
  assert.equal(byId(result,'tomato').amount,'150g'); assert.equal(byId(result,'tofu').amount,'150g');
  assert.equal(byId(result,'staple').name,'全麦面包');
});
test('salmon amount maps to simplified new name', () => {
  const saved = card(2,'dinner'); saved[2].dinner[0].amount = '180g';
  assert.deepEqual(byId(migrate(saved)[2].dinner,'salmon'),{id:'salmon',name:'三文鱼',amount:'180g'});
});
test('edited tomato-tofu recipe replaces both ingredients without duplication', () => {
  const saved = card(1,'dinner'); saved[1].dinner[1].amount = '番茄200g＋北豆腐180g';
  const result = migrate(saved)[1].dinner;
  assert.equal(byId(result,'tomato'),undefined); assert.equal(byId(result,'tofu'),undefined);
  assert.equal(result.items.find(item => item.name === '番茄豆腐').amount,'番茄200g＋北豆腐180g');
  assert.equal(byId(result,'chicken').amount,'100g');
  assert.equal(result.items.find(item => item.name === '紫甘蓝').amount,'100g');
});
test('edited shrimp-tofu recipe and separate greens remain distinct', () => {
  const saved = card(4,'dinner'); saved[4].dinner[0].amount = '虾仁180g＋北豆腐100g'; saved[4].dinner[1].amount = '250g';
  const result = migrate(saved)[4].dinner;
  assert.equal(byId(result,'shrimp'),undefined); assert.equal(byId(result,'tofu'),undefined);
  assert.equal(result.items.find(item => item.name === '虾仁豆腐煲').amount,'虾仁180g＋北豆腐100g');
  assert.equal(result.items.find(item => item.name === '小青菜').amount,'250g');
  assert.equal(byId(result,'staple').amount,'150g');
});
test('Sunday combined recipe edit removes all three old component defaults', () => {
  const saved = card(6,'dinner'); saved[6].dinner[0].name = '自制番茄蛋豆腐';
  const result = migrate(saved)[6].dinner;
  for (const id of ['egg','tofu','tomato']) assert.equal(byId(result,id),undefined);
  assert.equal(result.items[0].name,'自制番茄蛋豆腐');
  assert.equal(result.items[0].amount,old[6].dinner[0].amount);
  assert.equal(result.items.find(item => item.name === '小青菜').amount,'100g');
});
test('deleting combined recipe deletes each represented component only', () => {
  const saved = card(6,'dinner'); saved[6].dinner.shift();
  const result = migrate(saved)[6].dinner;
  assert.deepEqual(result.items.map(item => item.name),['小青菜','米饭（熟重）']);
});
test('how-only edit preserves new split ingredients and adds one note', () => {
  const saved = card(1,'dinner'); saved[1].dinner[1].how = '加一点蒜末';
  const result = migrate(saved)[1].dinner;
  assert.deepEqual(result.items,defaults[1].dinner.items);
  assert.equal(result.steps,defaults[1].dinner.steps+'\n自定义备注：番茄豆腐：加一点蒜末');
});
test('evening food edits move to dinner while milk and oats use new defaults', () => {
  const saved = card(0,'snack'); saved[0].snack[2].amount = '200g'; saved[0].snack[3].how = '洗净';
  const result = migrate(saved)[0];
  assert.deepEqual(Object.keys(result),['dinner']);
  assert.equal(result.dinner.evening[0].amount,'200g'); assert.equal(result.dinner.evening[1].amount,'90g');
  assert.ok(result.dinner.steps.includes('自定义备注：蓝莓：洗净'));
});
test('milk edits remain afternoon-only and retain new oats quantity', () => {
  const saved = card(0,'snack'); saved[0].snack[0].amount = '100ml';
  const result = migrate(saved)[0];
  assert.deepEqual(Object.keys(result),['snack']);
  assert.equal(byId(result.snack,'milk').amount,'100ml'); assert.equal(byId(result.snack,'oats').amount,'25g');
});
test('empty old snack removes both afternoon and evening without touching dinner foods', () => {
  const result = migrate({0:{snack:[]}})[0];
  assert.deepEqual(result.snack.items,[]); assert.deepEqual(result.dinner.evening,[]);
  assert.deepEqual(result.dinner.items,defaults[0].dinner.items);
});
test('dinner and evening edits merge and inputs remain unchanged', () => {
  const saved = {0:{dinner:clone(old[0].dinner),snack:clone(old[0].snack)}};
  saved[0].dinner[0].amount = '180g'; saved[0].snack[2].amount = '180g';
  const beforeSaved = JSON.stringify(saved), beforeDefaults = JSON.stringify(defaults);
  const result = migrate(saved)[0].dinner;
  assert.equal(byId(result,'chicken').amount,'180g'); assert.equal(result.evening[0].amount,'180g');
  assert.equal(JSON.stringify(saved),beforeSaved); assert.equal(JSON.stringify(defaults),beforeDefaults);
});
