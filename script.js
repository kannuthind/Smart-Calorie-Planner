const $ = (id) => document.getElementById(id);

const form = document.getElementById("form");
const resetBtn = $("resetBtn");
const copyBtn = $("copyBtn");
const saveBtn = $("saveBtn");
const themeToggle = $("themeToggle");

const out = {
  bmr: $("bmr"),
  tdee: $("tdee"),
  goalRange: $("goalRange"),
  goalNote: $("goalNote"),

  bmi: $("bmi"),
  bmiNote: $("bmiNote"),

  protein: $("protein"),
  carbs: $("carbs"),
  fats: $("fats"),
  barProtein: $("barProtein"),
  barCarbs: $("barCarbs"),
  barFats: $("barFats"),

  tips: $("tips"),

  weekGrid: $("weekGrid"),
  weekAvg: $("weekAvg"),
  weekNote: $("weekNote"),
};

const inputs = {
  age: $("age"),
  sex: $("sex"),
  height: $("height"),
  weight: $("weight"),
  activity: $("activity"),
  goal: $("goal"),
};

function round(n){ return Math.round(n); }
function formatKcal(n){ return `${round(n).toLocaleString("en-CA")} kcal`; }

// Mifflin–St Jeor (metric)
function calcBMR({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}
function calcTDEE(bmr, activityMultiplier){ return bmr * activityMultiplier; }

function goalAdjustment(goal){
  // Gentle adjustments (avoid extremes)
  if (goal === "lose") return 0.90;
  if (goal === "gain") return 1.10;
  return 1.00;
}

function safeMinimumCalories(age, sex){
  // Simple guardrails (not medical advice)
  if (age < 18) return sex === "male" ? 2000 : 1800;
  return sex === "male" ? 1600 : 1400;
}

function macroSplit(goal){
  if (goal === "lose") return { p: 0.30, c: 0.35, f: 0.35 };
  if (goal === "gain") return { p: 0.25, c: 0.50, f: 0.25 };
  return { p: 0.30, c: 0.40, f: 0.30 };
}

function gramsFromCalories(totalCalories, split){
  return {
    proteinG: (totalCalories * split.p) / 4,
    carbsG: (totalCalories * split.c) / 4,
    fatsG: (totalCalories * split.f) / 9,
  };
}

function calcBMI(weightKg, heightCm){
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function bmiLabel(bmi, age){
  // Gentle + informational
  if (age < 18) return "For teens, BMI is interpreted differently (use growth charts).";
  if (bmi < 18.5) return "Below typical adult range (consider professional guidance).";
  if (bmi < 25) return "Within typical adult range.";
  if (bmi < 30) return "Above typical adult range (focus on habits, not extremes).";
  return "Higher adult range (consider professional guidance).";
}

function tipsFor(goal, age){
  const base = [
    "Aim for consistent meals and enough sleep.",
    "Choose protein + fiber (helps energy and fullness).",
    "Hydration matters—water first.",
    "Try a simple routine: walk + strength basics.",
  ];

  const goalTips =
    goal === "lose"
      ? [
          "Go gentle—sustainable changes beat extreme cutting.",
          "Prioritize protein at each meal.",
          "Add daily steps (small wins matter).",
        ]
      : goal === "gain"
      ? [
          "Increase calories slowly and track energy levels.",
          "Strength train + include enough protein.",
          "Add nutrient-dense snacks (nuts, yogurt, sandwiches).",
        ]
      : [
          "Maintain by keeping intake and activity consistent.",
          "Use weekly averages instead of daily perfection.",
          "Balance meals: protein + carbs + healthy fats.",
        ];

  if (age < 18) goalTips.unshift("If you’re under 18, ask a trusted adult/professional for personalized guidance.");
  return [...goalTips, ...base].slice(0, 7);
}

function renderBars(split){
  out.barProtein.style.width = `${Math.round(split.p * 100)}%`;
  out.barCarbs.style.width = `${Math.round(split.c * 100)}%`;
  out.barFats.style.width = `${Math.round(split.f * 100)}%`;
}

function renderTips(list){
  out.tips.innerHTML = "";
  list.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    out.tips.appendChild(li);
  });
}

function buildWeeklyPlan(target){
  // 5 days at target, 2 days flexible (±5%)
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const plan = days.map((d, i) => {
    const flex = (i === 5) ? 1.05 : (i === 6) ? 0.95 : 1.00;
    return { day: d, calories: Math.round(target * flex) };
  });
  const avg = plan.reduce((s,x)=>s+x.calories,0)/plan.length;
  return { plan, avg };
}

function renderWeekly(weekly){
  out.weekGrid.innerHTML = "";
  weekly.plan.forEach(item => {
    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `<div class="d">${item.day}</div><div class="k">${item.calories.toLocaleString("en-CA")} kcal</div>`;
    out.weekGrid.appendChild(div);
  });
  out.weekAvg.textContent = `${Math.round(weekly.avg).toLocaleString("en-CA")} kcal/day`;
  out.weekNote.textContent = "Tip: weekly consistency matters more than perfect daily numbers.";
}

function calculate(){
  const age = Number(inputs.age.value);
  const sex = inputs.sex.value;
  const heightCm = Number(inputs.height.value);
  const weightKg = Number(inputs.weight.value);
  const activity = Number(inputs.activity.value);
  const goal = inputs.goal.value;

  const bmr = calcBMR({ sex, weightKg, heightCm, age });
  const tdee = calcTDEE(bmr, activity);

  let target = tdee * goalAdjustment(goal);

  const floor = safeMinimumCalories(age, sex);
  target = Math.max(target, floor);

  const low = target * 0.95;
  const high = target * 1.05;

  const split = macroSplit(goal);
  const grams = gramsFromCalories(target, split);

  const bmi = calcBMI(weightKg, heightCm);
  const weekly = buildWeeklyPlan(target);

  return { age, sex, heightCm, weightKg, activity, goal, bmr, tdee, low, high, target, split, grams, floor, bmi, weekly };
}

function render(result){
  out.bmr.textContent = formatKcal(result.bmr);
  out.tdee.textContent = formatKcal(result.tdee);
  out.goalRange.textContent = `${formatKcal(result.low)} – ${formatKcal(result.high)}`;

  const noteParts = [];
  noteParts.push(result.goal === "lose" ? "Gentle loss target" : result.goal === "gain" ? "Gentle gain target" : "Maintenance target");
  if (result.target === result.floor) noteParts.push("Safety floor applied");
  out.goalNote.textContent = noteParts.join(" • ");

  out.protein.textContent = `${Math.round(result.grams.proteinG)} g/day`;
  out.carbs.textContent = `${Math.round(result.grams.carbsG)} g/day`;
  out.fats.textContent = `${Math.round(result.grams.fatsG)} g/day`;
  renderBars(result.split);

  out.bmi.textContent = result.bmi.toFixed(1);
  out.bmiNote.textContent = bmiLabel(result.bmi, result.age);

  renderTips(tipsFor(result.goal, result.age));
  renderWeekly(result.weekly);
}

/* local save/load */
function saveInputs(){
  const data = {
    age: inputs.age.value,
    sex: inputs.sex.value,
    height: inputs.height.value,
    weight: inputs.weight.value,
    activity: inputs.activity.value,
    goal: inputs.goal.value,
  };
  localStorage.setItem("smartCaloriePlanner:v2", JSON.stringify(data));
}
function loadInputs(){
  const raw = localStorage.getItem("smartCaloriePlanner:v2");
  if (!raw) return;
  try{
    const data = JSON.parse(raw);
    if (!data) return;
    inputs.age.value = data.age ?? inputs.age.value;
    inputs.sex.value = data.sex ?? inputs.sex.value;
    inputs.height.value = data.height ?? inputs.height.value;
    inputs.weight.value = data.weight ?? inputs.weight.value;
    inputs.activity.value = data.activity ?? inputs.activity.value;
    inputs.goal.value = data.goal ?? inputs.goal.value;
  } catch {}
}

function summaryText(result){
  const goalName = result.goal === "lose" ? "Lose (gentle)" : result.goal === "gain" ? "Gain (gentle)" : "Maintain";
  return [
    `Smart Calorie Planner Summary`,
    `Age: ${result.age}`,
    `Sex: ${result.sex}`,
    `Height: ${result.heightCm} cm`,
    `Weight: ${result.weightKg} kg`,
    `BMI: ${result.bmi.toFixed(1)} (${bmiLabel(result.bmi, result.age)})`,
    `BMR: ${Math.round(result.bmr)} kcal/day`,
    `TDEE (maintenance): ${Math.round(result.tdee)} kcal/day`,
    `Goal: ${goalName}`,
    `Suggested range: ${Math.round(result.low)}–${Math.round(result.high)} kcal/day`,
    `Weekly avg: ${Math.round(result.weekly.avg)} kcal/day`,
    `Macros (approx): Protein ${Math.round(result.grams.proteinG)}g, Carbs ${Math.round(result.grams.carbsG)}g, Fats ${Math.round(result.grams.fatsG)}g`,
    `Note: Demo tool. For personalized guidance, consult a professional.`,
  ].join("\n");
}

/* Theme toggle */
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) themeToggle.textContent = theme === "light" ? "🌞" : "🌙";
  localStorage.setItem("scpTheme", theme);
}
function initTheme(){
  const saved = localStorage.getItem("scpTheme");
  if (saved === "light" || saved === "dark") return applyTheme(saved);
  applyTheme("dark");
}

function init(){
  document.getElementById("year").textContent = new Date().getFullYear();

  initTheme();
  loadInputs();

  try { render(calculate()); } catch {}

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    render(calculate());
  });

  resetBtn.addEventListener("click", () => {
    inputs.age.value = 20;
    inputs.sex.value = "female";
    inputs.height.value = 170;
    inputs.weight.value = 70;
    inputs.activity.value = "1.55";
    inputs.goal.value = "maintain";
    render(calculate());
  });

  saveBtn.addEventListener("click", () => {
    saveInputs();
    saveBtn.textContent = "Saved ✅";
    setTimeout(() => (saveBtn.textContent = "Save locally"), 1200);
  });

  copyBtn.addEventListener("click", async () => {
    const res = calculate();
    const text = summaryText(res);
    try{
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied ✅";
      setTimeout(() => (copyBtn.textContent = "Copy summary"), 1200);
    } catch {
      alert(text);
    }
  });

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }
}

init();

