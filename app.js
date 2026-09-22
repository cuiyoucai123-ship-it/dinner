const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const STORAGE_KEY = "dailyMeals.v4";
const COMPLETION_KEY = "dailyMeals.completed.v1";
const food = (id, name, amount) => ({ id, name, amount });
const vegetable = (name, amount, index = 1) => food(`vegetable-${index}`, name, `${amount}g`);
const lunch = (vegetables, steps) => ({
  items: [food("chicken-leg", "去皮卤琵琶腿", "2个"), food("egg", "鸡蛋", "1个"), food("rice", "米饭（熟重）", "250g"), ...vegetables],
  steps
});
const afternoon = () => ({
  items: [food("milk", "牛奶", "250ml"), food("oats", "即食燕麦", "25g")],
  steps: "饿了再吃。牛奶搭配即食燕麦，按包装说明泡好即可。"
});
const dinner = (day, items, steps) => ({
  items: [...items, day % 2 === 0 ? food("staple", "米饭（熟重）", "150g") : food("staple", "全麦面包", "60g")],
  steps,
  evening: [food("yogurt", "希腊酸奶", "150g"), food("blueberries", "蓝莓", "90g")]
});

const DEFAULT_PLAN = [
  {
    lunch: lunch([vegetable("小青菜", 150), vegetable("彩椒", 100, 2)], "① 彩椒切块、小青菜洗净。② 水开先下彩椒，再下青菜，煮熟捞出。"),
    snack: afternoon(),
    dinner: dinner(0, [food("chicken", "鸡里脊", "150g"), vegetable("西兰花", 150), vegetable("胡萝卜", 100, 2)], "① 胡萝卜切薄片，先蒸5分钟；加西兰花再蒸5～7分钟。② 蒸菜时，鸡里脊用少量油中小火翻面煎至熟透。")
  },
  {
    lunch: lunch([vegetable("西兰花", 150), vegetable("彩椒", 100, 2)], "① 西兰花切小朵、彩椒切块。② 西兰花先蒸5分钟，加入彩椒再蒸3～5分钟。"),
    snack: afternoon(),
    dinner: dinner(1, [food("chicken", "鸡里脊", "100g"), food("tomato", "番茄", "150g"), food("tofu", "北豆腐", "150g"), vegetable("紫甘蓝", 100)], "① 番茄切块，加少量水煮软；放入豆腐煮5～8分钟，最后加紫甘蓝丝煮熟。② 炖菜时，鸡里脊用少量油中小火翻面煎至熟透。")
  },
  {
    lunch: lunch([vegetable("小青菜", 200)], "小青菜洗净，水开下锅煮熟，捞出沥水。"),
    snack: afternoon(),
    dinner: dinner(2, [food("salmon", "三文鱼", "150g"), vegetable("西兰花", 150), vegetable("彩椒", 100, 2)], "① 西兰花先蒸5分钟，加彩椒再蒸3～5分钟。② 蒸菜时，三文鱼擦干，少油中小火煎；带皮先煎皮面，再翻面煎至中心熟透。")
  },
  {
    lunch: lunch([vegetable("西兰花", 150), vegetable("小青菜", 100, 2)], "① 西兰花切小朵、小青菜洗净。② 水开先煮西兰花，快熟时加青菜，一起煮熟捞出。"),
    snack: afternoon(),
    dinner: dinner(3, [food("chicken", "鸡里脊", "150g"), vegetable("胡萝卜", 100), vegetable("紫甘蓝", 100, 2)], "① 胡萝卜切薄片先蒸5分钟，加紫甘蓝丝再蒸5～7分钟。② 蒸菜时，鸡里脊用少量油中小火翻面煎至熟透，撒少量黑胡椒。")
  },
  {
    lunch: lunch([vegetable("西兰花", 150), vegetable("彩椒", 100, 2)], "① 西兰花切小朵、彩椒切块。② 西兰花先蒸5分钟，加入彩椒再蒸3～5分钟。"),
    snack: afternoon(),
    dinner: dinner(4, [food("shrimp", "虾仁", "150g"), food("tofu", "北豆腐", "150g"), vegetable("小青菜", 200)], "① 豆腐切块，加水煮5分钟。② 加虾仁煮至熟透，放入洗净的小青菜煮熟，少量生抽调味。")
  },
  {
    lunch: lunch([vegetable("小青菜", 150), vegetable("彩椒", 100, 2)], "① 彩椒切块、小青菜洗净。② 水开先下彩椒，再下青菜，煮熟捞出。"),
    snack: afternoon(),
    dinner: dinner(5, [food("chicken", "鸡里脊", "150g"), vegetable("西兰花", 150), vegetable("彩椒", 100, 2)], "① 西兰花先蒸5分钟，加彩椒再蒸3～5分钟。② 蒸菜时，鸡里脊用少量油中小火翻面煎至熟透。")
  },
  {
    lunch: lunch([vegetable("西兰花", 150), vegetable("小青菜", 100, 2)], "① 西兰花切小朵、小青菜洗净。② 水开先煮西兰花，快熟时加青菜，一起煮熟捞出。"),
    snack: afternoon(),
    dinner: dinner(6, [food("egg", "鸡蛋", "2个"), food("tofu", "北豆腐", "200g"), food("tomato", "番茄", "150g"), vegetable("小青菜", 100)], "① 番茄切块加水煮软，放豆腐煮5～8分钟。② 淋入打散的鸡蛋，煮至凝固熟透，再放青菜煮熟，少量盐调味。")
  }
];
const MEAL_META = {
  lunch: { title: "午餐", subtitle: "训练后", icon: "☀️" },
  snack: { title: "下午加餐", subtitle: "16:00", icon: "🍎" },
  dinner: { title: "晚餐", subtitle: "18:00", icon: "🌙" }
};
let activeDay = todayIndex();
let editingMeal = null;
let draft = null;
let currentDate = new Date().toDateString();
let migrationFallback = {};
let toastTimer;

function todayIndex() { return (new Date().getDay() + 6) % 7; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function validItem(item) { return item && typeof item.name === "string" && typeof item.amount === "string"; }
function validMeal(meal) { return meal && Array.isArray(meal.items) && meal.items.every(validItem) && typeof meal.steps === "string" && (!meal.evening || Array.isArray(meal.evening) && meal.evening.every(validItem)); }
function loadCustomPlan() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && typeof value === "object" && !Array.isArray(value) ? value : migrationFallback;
  } catch (_) { return migrationFallback; }
}
function initializeStorage() {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== null) return;
    const previous = JSON.parse(localStorage.getItem("dailyMeals.v3"));
    if (previous && typeof window.migrateLegacyMeals === "function") migrationFallback = window.migrateLegacyMeals(previous, DEFAULT_PLAN);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrationFallback));
  } catch (_) { /* Default meals remain usable when browser storage is unavailable. */ }
}
function getMeal(day, meal) {
  const saved = loadCustomPlan()[day]?.[meal];
  return clone(validMeal(saved) ? saved : DEFAULT_PLAN[day][meal]);
}
function dateText() {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日 · 星期${"日一二三四五六"[now.getDay()]}`;
}
function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function loadCompletions() {
  try {
    const saved = JSON.parse(localStorage.getItem(COMPLETION_KEY));
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch (_) { return {}; }
}
function completedMeals(date = new Date()) {
  const saved = loadCompletions()[localDateKey(date)];
  return Array.isArray(saved) ? saved.filter(meal => Object.hasOwn(MEAL_META, meal)) : [];
}
function setMealDone(meal, done) {
  if (activeDay !== todayIndex() || !Object.hasOwn(MEAL_META, meal)) return;
  const saved = loadCompletions();
  const completed = new Set(completedMeals());
  if (done) completed.add(meal); else completed.delete(meal);
  saved[localDateKey()] = [...completed];
  try { localStorage.setItem(COMPLETION_KEY, JSON.stringify(saved)); }
  catch (_) { showToast("未能保存收起状态，请稍后重试"); return; }
  renderHome();
  showToast(done ? `${MEAL_META[meal].title}已收起，下方可以展开` : `${MEAL_META[meal].title}已展开`);
}
function riceItem(meal) { return meal.items.find(item => /饭|大米|糙米/.test(item.name)); }
function grams(amount) {
  const match = amount.trim().match(/^(\d+(?:\.\d+)?)\s*(?:g|克|公克)(?:\s*[（(]熟重[）)])?$/i);
  return match && Number(match[1]) > 0 ? Number(match[1]) : null;
}
function riceReminder(day) {
  const eveningRice = riceItem(getMeal(day, "dinner"));
  if (!eveningRice || !eveningRice.amount.trim() || /^(0\s*(g|克)|不吃|无)$/i.test(eveningRice.amount.trim())) return "";
  const lunchRice = riceItem(getMeal(day, "lunch"));
  const midday = lunchRice && grams(lunchRice.amount);
  const evening = grams(eveningRice.amount);
  const total = midday && evening ? `，共需熟饭 ${midday + evening}g` : "";
  return `中午把晚餐的饭一起蒸好${total}。留出 ${eveningRice.amount} 熟饭，及时冷藏，晚餐热透。`;
}
function renderFoods(items) {
  return items.length ? items.map(item => `<div class="food-item"><span class="food-name">${esc(item.name)}</span><span class="food-amount">${esc(item.amount)}</span></div>`).join("") : '<div class="empty-card">暂无安排，点编辑添加。</div>';
}
function renderMealCard(meal) {
  const meta = MEAL_META[meal];
  const data = getMeal(activeDay, meal);
  const prep = meal === "lunch" ? riceReminder(activeDay) : "";
  const stapleItem = data.items.find(item => item.id === "staple");
  const finish = meal === "dinner" ? riceItem(data) ? "米饭热透后一起吃。" : stapleItem && /面包/.test(stapleItem.name) ? `配${stapleItem.name}，直接吃。` : "" : "";
  const steps = [data.steps, finish].filter(Boolean).join("\n");
  return `<section class="meal-card ${meal === "snack" ? "snack-card" : ""}" aria-label="${meta.title}">
    <div class="card-head"><span class="meal-icon" aria-hidden="true">${meta.icon}</span><div class="head-copy"><h2>${meta.title}</h2><span class="card-subtitle">${meta.subtitle}</span></div><button class="edit-button" type="button" onclick="openEditor('${meal}')" aria-label="编辑${meta.title}">编辑</button>${activeDay === todayIndex() ? `<button class="done-button" type="button" onclick="setMealDone('${meal}',true)" aria-label="${meta.title}吃好了，收起">吃好了</button>` : ""}</div>
    <div class="food-list">${renderFoods(data.items)}</div>
    ${steps ? `<p class="meal-steps">${esc(steps)}</p>` : ""}
    ${prep ? `<div class="prep-note">${esc(prep)}</div>` : ""}
    ${meal === "dinner" && data.evening?.length ? `<div class="evening"><span class="evening-label">晚间加餐 · 饿了再吃</span><div class="food-list">${renderFoods(data.evening)}</div></div>` : ""}
  </section>`;
}
function renderHome() {
  const mealOrder = ["lunch", "snack", "dinner"];
  const completed = activeDay === todayIndex() ? completedMeals() : [];
  const visible = mealOrder.filter(meal => !completed.includes(meal));
  document.getElementById("app").innerHTML = `<header class="topbar"><div><h1>${activeDay === todayIndex() ? "今天吃什么" : WEEKDAYS[activeDay] + "吃什么"}</h1><div class="date">${activeDay === todayIndex() ? dateText() : "这一天，照着做就好"}</div></div>${activeDay !== todayIndex() ? '<button class="today-button" type="button" onclick="goToday()">回到今天</button>' : ""}</header>
    <nav class="week-strip" aria-label="选择星期">${WEEKDAYS.map((day, index) => `<button class="day-button ${index === activeDay ? "active" : ""}" type="button" onclick="selectDay(${index})" aria-label="${day}" aria-current="${index === activeDay ? "date" : "false"}">${day.replace("周", "")}<span>${index === todayIndex() ? "今天" : "&nbsp;"}</span></button>`).join("")}</nav>
    ${visible.map(renderMealCard).join("")}
    ${!visible.length ? '<div class="day-finished"><strong>今天的饭都吃好了</strong><p>明天的饭单会自动展开。</p></div>' : ""}
    ${completed.length ? `<div class="completed-meals"><span>已收起 · 点名称展开</span>${mealOrder.filter(meal => completed.includes(meal)).map(meal => `<button class="restore-button" type="button" onclick="setMealDone('${meal}',false)" aria-label="展开今天的${MEAL_META[meal].title}">${MEAL_META[meal].title}</button>`).join("")}</div>` : ""}
    <p class="weight-note">米饭按熟重；肉菜按烹调前可食重量。每周循环，想换就点编辑。</p>`;
  window.scrollTo(0, 0);
}
function renderEditRows(items, group) {
  return items.map((item, index) => `<div class="edit-item" data-group="${group}" data-id="${esc(item.id || "")}">
    <input class="name-input" value="${esc(item.name)}" placeholder="食物名称" aria-label="${group === "evening" ? "晚间" : ""}食物名称${index + 1}">
    <input class="amount-input" value="${esc(item.amount)}" placeholder="分量" aria-label="${group === "evening" ? "晚间" : ""}分量${index + 1}">
    <button class="delete-button" type="button" onclick="deleteItem('${group}',${index})" aria-label="删除${esc(item.name || "空白食物")}">×</button></div>`).join("");
}
function renderEditor(scrollToTop = true) {
  const meta = MEAL_META[editingMeal];
  document.getElementById("app").innerHTML = `<div class="edit-page"><header class="edit-topbar"><button class="back-button" type="button" onclick="cancelEdit()" aria-label="返回">‹</button><div><div class="edit-heading">${WEEKDAYS[activeDay]} · ${meta.title}</div><div class="edit-help">改好后保存，每周这一天都会使用</div></div></header>
    <span class="edit-section-title">食物与分量</span><div id="edit-items">${renderEditRows(draft.items, "items")}</div><button class="add-button" type="button" onclick="addItem('items')">＋ 添加食物</button>
    <label class="edit-section-title" for="meal-steps">整顿饭的做法 / 提醒</label><textarea id="meal-steps" placeholder="按先后顺序写，照着做就好">${esc(draft.steps)}</textarea>
    ${editingMeal === "dinner" ? `<span class="edit-section-title">晚间加餐 · 饿了再吃</span><div id="edit-evening">${renderEditRows(draft.evening || [], "evening")}</div><button class="add-button" type="button" onclick="addItem('evening')">＋ 添加晚间加餐</button>` : ""}
    <p class="storage-help">保存在当前设备浏览器中。米饭请填写熟重（如 150g），午餐会自动提醒预留晚餐的饭。</p><button class="reset-button" type="button" onclick="resetMeal()">恢复这顿饭的默认安排</button></div>
    <div class="save-bar"><button class="save-button" type="button" onclick="saveEditor()">保存</button></div>`;
  if (scrollToTop) window.scrollTo(0, 0);
}
function readDraftFromForm() {
  const read = group => Array.from(document.querySelectorAll(`.edit-item[data-group="${group}"]`)).map(row => ({ id: row.dataset.id, name: row.querySelector(".name-input").value.trim(), amount: row.querySelector(".amount-input").value.trim() }));
  draft.items = read("items");
  draft.steps = document.getElementById("meal-steps").value.trim();
  if (editingMeal === "dinner") draft.evening = read("evening");
  return draft;
}
function selectDay(index) { activeDay = index; renderHome(); }
function goToday() { activeDay = todayIndex(); renderHome(); }
function openEditor(meal) { editingMeal = meal; draft = getMeal(activeDay, meal); renderEditor(); }
function cancelEdit() { editingMeal = null; draft = null; renderHome(); }
function addItem(group) {
  readDraftFromForm();
  draft[group] = draft[group] || [];
  draft[group].push(food(`custom-${Date.now()}`, "", ""));
  renderEditor(false);
  const fields = document.querySelectorAll(`.edit-item[data-group="${group}"] .name-input`);
  fields[fields.length - 1]?.focus();
}
function deleteItem(group, index) { readDraftFromForm(); draft[group].splice(index, 1); renderEditor(false); }
function saveEditor() {
  readDraftFromForm();
  if ([...draft.items, ...(draft.evening || [])].some(item => !item.name && item.amount)) { showToast("有分量但没填名称，请补上食物名称"); return; }
  draft.items = draft.items.filter(item => item.name);
  if (draft.evening) draft.evening = draft.evening.filter(item => item.name);
  const custom = loadCustomPlan();
  if (!custom[activeDay] || typeof custom[activeDay] !== "object") custom[activeDay] = {};
  custom[activeDay][editingMeal] = clone(draft);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(custom)); }
  catch (_) { showToast("未能保存，请检查浏览器存储后重试"); return; }
  const title = `${WEEKDAYS[activeDay]}${MEAL_META[editingMeal].title}`;
  editingMeal = null; draft = null; renderHome(); showToast(`${title}已保存`);
}
function resetMeal() {
  if (!confirm("恢复这顿饭的默认安排？保存后生效。")) return;
  draft = clone(DEFAULT_PLAN[activeDay][editingMeal]); renderEditor();
}
function showToast(message) {
  const el = document.getElementById("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}
function refreshDate() {
  const date = new Date().toDateString();
  if (!editingMeal && date !== currentDate) { currentDate = date; goToday(); }
}
initializeStorage();
renderHome();
window.addEventListener("focus", refreshDate);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshDate(); });
window.addEventListener("storage", event => { if ([STORAGE_KEY, COMPLETION_KEY].includes(event.key) && !editingMeal) renderHome(); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
