/* Migrate v3 per-food overrides without carrying old defaults into the new menu.
 * v3 has no IDs: match original names first, then fall back to the same index
 * for renamed foods. A simultaneous rename/reorder can only be best-effort.
 * This function is pure and never reads, writes, or removes browser storage.
 */
(function (root) {
  "use strict";
  // Snapshot extracted from git HEAD:index.html (dailyMeals.v3).
  const OLD_LUNCH = [
  {
    "emoji": "🍗",
    "name": "去皮卤琵琶腿",
    "amount": "2个",
    "how": "一次卤三天的量，吃前彻底加热。"
  },
  {
    "emoji": "🥚",
    "name": "卤蛋",
    "amount": "1个",
    "how": "与鸡腿一起卤，或换成水煮蛋。"
  },
  {
    "emoji": "🍚",
    "name": "三色糙米混白米饭",
    "amount": "原有分量",
    "how": "午餐盛出晚餐需要的米饭后及时冷藏。"
  },
  {
    "emoji": "🥬",
    "name": "蔬菜",
    "amount": "按当天安排",
    "how": "青菜、西兰花、胡萝卜、彩椒或西红柿均可搭配。"
  }
];
  const OLD_SNACK = [
  {
    "emoji": "🥛",
    "name": "下午四点 · 牛奶",
    "amount": "250ml",
    "how": "饿时再喝，不强求。"
  },
  {
    "emoji": "🌾",
    "name": "干燕麦",
    "amount": "20～30g",
    "how": "需要时加入牛奶；不饿可以不吃。"
  },
  {
    "emoji": "🥣",
    "name": "晚间 · 希腊酸奶",
    "amount": "150g",
    "how": "按食欲安排，不必紧接晚饭。"
  },
  {
    "emoji": "🫐",
    "name": "蓝莓",
    "amount": "80～100g",
    "how": "搭配酸奶，按产品食用说明处理。"
  }
];
  const OLD_DINNERS = [
  [
    {
      "emoji": "🐔",
      "name": "煎鸡里脊",
      "amount": "150g",
      "how": "锅刷少量油，中小火煎，中途翻面；厚处切开检查，内部熟透。已调味，不另腌。"
    },
    {
      "emoji": "🥦",
      "name": "西兰花",
      "amount": "150g",
      "how": "与胡萝卜分段放入蒸锅。"
    },
    {
      "emoji": "🥕",
      "name": "胡萝卜",
      "amount": "100g",
      "how": "切薄片先蒸约5分钟，加入西兰花再蒸5～7分钟。"
    },
    {
      "emoji": "🌽",
      "name": "晚餐主食 · 三选一",
      "amount": "米饭150g / 面包60g / 玉米1根",
      "how": "按当天食欲选择一种；南瓜可以穿插蒸，但不默认完全替代主食。"
    }
  ],
  [
    {
      "emoji": "🐔",
      "name": "煎鸡里脊",
      "amount": "100g",
      "how": "锅刷少量油，中小火煎熟。"
    },
    {
      "emoji": "🍅",
      "name": "番茄豆腐",
      "amount": "番茄150g＋北豆腐150g",
      "how": "番茄加少量水煮软，放入豆腐煮5～8分钟，少量盐调味。"
    },
    {
      "emoji": "🥬",
      "name": "紫甘蓝",
      "amount": "100g",
      "how": "切丝，沸水煮1～2分钟，捞出沥水，加少量醋。"
    },
    {
      "emoji": "🌽",
      "name": "晚餐主食 · 三选一",
      "amount": "米饭150g / 面包60g / 玉米1根",
      "how": "按当天食欲选择一种；南瓜可以穿插蒸，但不默认完全替代主食。"
    }
  ],
  [
    {
      "emoji": "🐟",
      "name": "煎三文鱼",
      "amount": "150g",
      "how": "擦干表面，锅少刷油；带皮先煎皮面，中小火翻面煎，厚块可加盖焖至中心熟透。"
    },
    {
      "emoji": "🥦",
      "name": "西兰花",
      "amount": "150g",
      "how": "先蒸5分钟，再加入彩椒。"
    },
    {
      "emoji": "🫑",
      "name": "彩椒",
      "amount": "100g",
      "how": "与已蒸5分钟的西兰花再一起蒸3～5分钟。"
    },
    {
      "emoji": "🌽",
      "name": "晚餐主食 · 三选一",
      "amount": "米饭150g / 面包60g / 玉米1根",
      "how": "按当天食欲选择一种；南瓜可以穿插蒸，但不默认完全替代主食。"
    }
  ],
  [
    {
      "emoji": "🐔",
      "name": "煎鸡里脊",
      "amount": "150g",
      "how": "同周一，出锅后可加少量黑胡椒换口味。"
    },
    {
      "emoji": "🥕",
      "name": "胡萝卜",
      "amount": "100g",
      "how": "切薄片蒸8～12分钟。"
    },
    {
      "emoji": "🥬",
      "name": "紫甘蓝",
      "amount": "100g",
      "how": "切丝，单独煮1～2分钟。"
    },
    {
      "emoji": "🌽",
      "name": "晚餐主食 · 三选一",
      "amount": "米饭150g / 面包60g / 玉米1根",
      "how": "按当天食欲选择一种；南瓜可以穿插蒸，但不默认完全替代主食。"
    }
  ],
  [
    {
      "emoji": "🍤",
      "name": "虾仁豆腐煲",
      "amount": "虾仁150g＋北豆腐150g",
      "how": "少量油炒香姜片，加一小碗水；放豆腐煮5分钟，再加虾仁煮熟，少量盐或生抽调味。"
    },
    {
      "emoji": "🥬",
      "name": "小青菜",
      "amount": "200g",
      "how": "洗净切段，虾仁接近熟时加入同一锅，一起煮熟。"
    },
    {
      "emoji": "🌽",
      "name": "晚餐主食 · 三选一",
      "amount": "米饭150g / 面包60g / 玉米1根",
      "how": "按当天食欲选择一种；南瓜可以穿插蒸，但不默认完全替代主食。"
    }
  ],
  [
    {
      "emoji": "🐔",
      "name": "煎鸡里脊",
      "amount": "150g",
      "how": "同周一，不做炒饭。"
    },
    {
      "emoji": "🥦",
      "name": "西兰花",
      "amount": "150g",
      "how": "先蒸5分钟，再加入彩椒。"
    },
    {
      "emoji": "🫑",
      "name": "彩椒",
      "amount": "100g",
      "how": "与西兰花再蒸3～5分钟，蒸熟后加少量生抽或醋调味。"
    },
    {
      "emoji": "🌽",
      "name": "晚餐主食 · 三选一",
      "amount": "米饭150g / 面包60g / 玉米1根",
      "how": "按当天食欲选择一种；南瓜可以穿插蒸，但不默认完全替代主食。"
    }
  ],
  [
    {
      "emoji": "🍅",
      "name": "番茄鸡蛋烩豆腐",
      "amount": "鸡蛋2个＋北豆腐200g＋番茄150g",
      "how": "少油炒蛋盛出；番茄加水煮软，加入豆腐煮5～8分钟，放回鸡蛋煮透。"
    },
    {
      "emoji": "🥬",
      "name": "小青菜",
      "amount": "100g",
      "how": "沸水煮熟，捞出沥水。"
    },
    {
      "emoji": "🌽",
      "name": "晚餐主食 · 三选一",
      "amount": "米饭150g / 面包60g / 玉米1根",
      "how": "按当天食欲选择一种；南瓜可以穿插蒸，但不默认完全替代主食。"
    }
  ]
];

  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const validItem = item => isObject(item) && typeof item.name === "string" && item.name.trim() &&
    ["emoji", "amount", "how"].every(key => item[key] === undefined || typeof item[key] === "string");
  const clone = value => JSON.parse(JSON.stringify(value));

  function migrateLegacyMeals(legacyCustom, newDefaults) {
    if (!isObject(legacyCustom) || !Array.isArray(newDefaults)) return {};
    const migrated = {};

    for (let day = 0; day < Math.min(7, newDefaults.length); day++) {
      const savedDay = legacyCustom[day], defaults = newDefaults[day];
      if (!isObject(savedDay) || !isObject(defaults)) continue;

      function ensureMeal(meal) {
        if (!isObject(defaults[meal]) || !Array.isArray(defaults[meal].items)) return null;
        if (!migrated[day]) migrated[day] = {};
        if (!migrated[day][meal]) migrated[day][meal] = clone(defaults[meal]);
        return migrated[day][meal];
      }

      function destination(sourceMeal, oldIndex) {
        let meal = sourceMeal, section = "items", ids, name;
        if (sourceMeal === "lunch") {
          ids = [["chicken-leg"], ["egg"], ["rice"], ["vegetable-1"]][oldIndex];
        } else if (sourceMeal === "snack") {
          if (oldIndex >= 2) {
            meal = "dinner"; section = "evening";
            name = ["希腊酸奶", "蓝莓"][oldIndex - 2];
          } else {
            name = ["牛奶", "即食燕麦"][oldIndex];
          }
        } else {
          name = OLD_DINNERS[day][oldIndex].name;
          ids = {
            "煎鸡里脊": ["chicken"], "煎三文鱼": ["salmon"],
            "晚餐主食 · 三选一": ["staple"],
            "番茄豆腐": ["tomato", "tofu"],
            "虾仁豆腐煲": ["shrimp", "tofu"],
            "番茄鸡蛋烩豆腐": ["egg", "tofu", "tomato"]
          }[name];
        }
        const items = defaults[meal]?.[section];
        const originals = Array.isArray(items)
          ? items.filter(item => isObject(item) && (ids ? ids.includes(item.id) : item.name === name)) : [];
        return { meal, section, originals, original: originals[0], combined: ids?.length > 1 };
      }

      function findTarget(items, original) {
        if (!original) return -1;
        return items.findIndex(item => original.id ? item.id === original.id : item.name === original.name);
      }

      function addNote(mealName, foodName, how) {
        if (typeof how !== "string" || !how.trim()) return;
        const meal = ensureMeal(mealName);
        if (!meal) return;
        const note = "自定义备注：" + foodName + "：" + how.trim();
        meal.steps = [typeof meal.steps === "string" ? meal.steps : "", note].filter(Boolean).join("\n");
      }

      function appendItem(mealName, section, item, sourceMeal, savedIndex) {
        const meal = ensureMeal(mealName);
        if (!meal) return;
        if (!Array.isArray(meal[section])) meal[section] = [];
        const items = meal[section];
        let id = "legacy-" + sourceMeal + "-" + savedIndex;
        while (items.some(existing => existing.id === id)) id += "-added";
        items.push({
          id,
          emoji: typeof item.emoji === "string" ? item.emoji : "🍽️",
          name: item.name,
          amount: typeof item.amount === "string" ? item.amount : ""
        });
        addNote(mealName, item.name, item.how);
      }

      for (const sourceMeal of ["lunch", "dinner", "snack"]) {
        const saved = savedDay[sourceMeal];
        // A malformed saved card is ignored, not interpreted as deleting foods.
        if (!Array.isArray(saved) || !saved.every(validItem)) continue;
        const original = sourceMeal === "lunch" ? OLD_LUNCH
          : sourceMeal === "snack" ? OLD_SNACK : OLD_DINNERS[day];
        const matches = Array(original.length).fill(-1), used = new Set();
        original.forEach((item, oldIndex) => {
          const savedIndex = saved.findIndex((candidate, index) => !used.has(index) && candidate.name === item.name);
          if (savedIndex >= 0) { matches[oldIndex] = savedIndex; used.add(savedIndex); }
        });
        original.forEach((_, oldIndex) => {
          if (matches[oldIndex] < 0 && oldIndex < saved.length && !used.has(oldIndex)) {
            matches[oldIndex] = oldIndex;
            used.add(oldIndex);
          }
        });

        original.forEach((oldItem, oldIndex) => {
          const target = destination(sourceMeal, oldIndex);
          const savedIndex = matches[oldIndex];
          if (savedIndex < 0) {
            if (!target.original) return;
            const meal = ensureMeal(target.meal);
            if (!meal) return;
            const items = meal[target.section] || [];
            target.originals.forEach(originalItem => {
              const index = findTarget(items, originalItem);
              if (index >= 0) items.splice(index, 1);
            });
            return;
          }
          const item = saved[savedIndex];
          const changedFields = ["emoji", "name", "amount"].filter(key =>
            typeof item[key] === "string" && item[key] !== oldItem[key]);
          if (changedFields.length) {
            if (target.original) {
              const meal = ensureMeal(target.meal);
              if (meal) {
                const index = findTarget(meal[target.section] || [], target.original);
                if (index >= 0 && target.combined) {
                  // Keep an edited legacy recipe as one item, replacing all its
                  // split ingredients so amounts cannot be applied to the wrong food.
                  const items = meal[target.section];
                  target.originals.forEach(originalItem => {
                    const at = findTarget(items, originalItem);
                    if (at >= 0) items.splice(at, 1);
                  });
                  items.splice(index, 0, {
                    id: "legacy-combined-" + oldIndex,
                    name: item.name, amount: item.amount ?? oldItem.amount,
                    emoji: item.emoji ?? oldItem.emoji
                  });
                } else if (index >= 0) changedFields.forEach(key => { meal[target.section][index][key] = item[key]; });
              }
            } else {
              appendItem(target.meal, target.section, item, sourceMeal, savedIndex);
            }
          }
          if (target.original && typeof item.how === "string" && item.how !== oldItem.how) {
            addNote(target.meal, item.name, item.how);
          }
        });

        saved.forEach((item, savedIndex) => {
          // Unknown additions to the old combined snack card stay in afternoon snack.
          if (!used.has(savedIndex)) appendItem(sourceMeal, "items", item, sourceMeal, savedIndex);
        });
      }
    }
    return migrated;
  }

  root.migrateLegacyMeals = migrateLegacyMeals;
})(typeof window !== "undefined" ? window : globalThis);
