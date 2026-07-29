(function () {
  "use strict";

  const PRODUCTS = [
    { name: "Cerveza", price: 2.50 },
    { name: "Tinto de verano", price: 2.50 },
    { name: "Refresco", price: 2.50 },
    { name: "Cubata", price: 5.00 },
    { name: "Vermú", price: 3.00 },
    { name: "Vino", price: 3.00 },
    { name: "Agua", price: 1.00 },
  ];

  // Pesos en config.js (DRINKS_WEIGHTS, MOMENTS).
  const MOMENTS_LIST = window.MOMENTS;
  const DRINKS_WEIGHTS = window.DRINKS_WEIGHTS;

  const MODES = {
    total: {
      key: "total",
      label: "Sumar total",
      badge: "Total",
      sub: "Suma los precios de cada pedido lo más rápido que puedas.",
      placeholder: "Total (€)",
    },
    twostep: {
      key: "twostep",
      label: "Total + cambio",
      badge: "Total+cambio",
      sub: "Calcula el total y luego el cambio a devolver.",
      placeholder: "Total (€)",
    },
    change: {
      key: "change",
      label: "Cambio mental",
      badge: "Cambio",
      sub: "El cliente paga y debes calcular el cambio mentalmente (sin ver el total).",
      placeholder: "Cambio (€)",
    },
  };

  const round2 = (n) => Math.round(n * 100) / 100;
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const DRINKS_TOTAL = DRINKS_WEIGHTS.reduce((a, b) => a + b, 0);

  function pickDrinks() {
    let r = Math.random() * DRINKS_TOTAL;
    for (let i = 0; i < DRINKS_WEIGHTS.length; i++) {
      r -= DRINKS_WEIGHTS[i];
      if (r < 0) return i + 1;
    }
    return DRINKS_WEIGHTS.length;
  }

  function weightedPick(weights) {
    const entries = Object.entries(weights).filter(([_, w]) => w > 0);
    const r = Math.random();
    let acc = 0;
    for (const [name, w] of entries) {
      acc += w;
      if (r <= acc) return name;
    }
    return entries[entries.length - 1][0];
  }

  // Billetes y monedas habituales en un evento.
  const DENOMS = [
    { value: 50, label: "50 €" },
    { value: 20, label: "20 €" },
    { value: 10, label: "10 €" },
    { value: 5, label: "5 €" },
    { value: 2, label: "2 €" },
    { value: 1, label: "1 €" },
    { value: 0.5, label: "0,50 €" },
  ];

  // Genera la cartera aleatoria del cliente: 1-2 billetes grandes,
  // 0-2 medianos, 1-3 monedas. Devuelve array de valores.
  function genWallet() {
    const wallet = [];
    const LARGE = [50, 20];
    const MED = [10, 5];
    const SMALL = [2, 1, 0.5];
    const nLarge = randInt(1, 2);
    for (let i = 0; i < nLarge; i++) wallet.push(pick(LARGE));
    const nMed = randInt(0, 2);
    for (let i = 0; i < nMed; i++) wallet.push(pick(MED));
    const nSmall = randInt(1, 3);
    for (let i = 0; i < nSmall; i++) wallet.push(pick(SMALL));
    return wallet.sort((a, b) => b - a);
  }

  // Genera un pago realista: el cliente saca un subconjunto de su cartera
  // que cubra el total, cada pieza necesaria (quitar la menor deja suma <= total).
  function genPayment(total) {
    const combos = [];

    function addIfValid(combo) {
      const sum = round2(combo.reduce((a, b) => a + b, 0));
      if (sum <= total) return;
      const minV = Math.min.apply(null, combo);
      if (round2(sum - minV) > total) return;
      combos.push(combo.slice().sort((a, b) => b - a));
    }

    // Probar varias carteras hasta encontrar al menos una opcion valida.
    let wallet, attempts = 0;
    do {
      wallet = genWallet();
      combos.length = 0;
      const n = wallet.length;
      const totalSubs = 1 << n;
      for (let mask = 1; mask < totalSubs; mask++) {
        const sub = [];
        for (let i = 0; i < n; i++) {
          if (mask & (1 << i)) sub.push(wallet[i]);
        }
        addIfValid(sub);
      }
      attempts++;
    } while (combos.length === 0 && attempts < 30);

    if (combos.length === 0) {
      let p = Math.ceil(total / 10) * 10;
      if (p <= total) p += 10;
      return { amount: p, bills: [p], labels: [p + " €"] };
    }

    // Ponderar hacia combos cercanos al total (poco cambio) para que las
    // monedas pequeñas puedan aparecer; los lejanos siguen siendo posibles.
    const weights = combos.map((c) => {
      const over = round2(c.reduce((a, b) => a + b, 0) - total);
      return Math.exp(-over * 0.18);
    });
    const totalW = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW;
    let bills = combos[0];
    for (let i = 0; i < combos.length; i++) {
      r -= weights[i];
      if (r <= 0) { bills = combos[i]; break; }
    }
    const sum = round2(bills.reduce((a, b) => a + b, 0));
    return {
      amount: sum,
      bills,
      labels: bills.map((v) => {
        const d = DENOMS.find((x) => x.value === v);
        return d ? d.label : v + " €";
      }),
    };
  }

  function billsLabel(labels) {
    return labels.join(" + ");
  }

  let round = 1;
  let mode = "total";
  let step = 1; // para twostep
  let total = 0;
  let payment = 0;
  let step1Ok = false; // para twostep
  let start = 0;
  let timerId = null;
  let locked = false;

  const stats = {
    rounds: 0,
    correct: 0,
    best: Infinity,
    sumTime: 0,
  };

  const $ = (id) => document.getElementById(id);
  const orderEl = $("order");
  const inputEl = $("input");
  const resultEl = $("result");
  const timeEl = $("time");
  const roundEl = $("round");
  const statsEl = $("stats");
  const startEl = $("start");
  const gameEl = $("game");
  const paymentEl = $("payment");
  const badgeEl = $("mode-badge");
  const subEl = $("game-sub");
  const checkBtn = $("check");

  function showStart() {
    startEl.classList.add("show");
    gameEl.classList.remove("show");
    clearInterval(timerId);
  }

  function showGame() {
    startEl.classList.remove("show");
    gameEl.classList.add("show");
  }

  function genOrder() {
    const moment = pick(MOMENTS_LIST);
    const weights = moment.weights;

    const drinks = pickDrinks();
    const counts = {};
    for (let i = 0; i < drinks; i++) {
      const name = weightedPick(weights);
      counts[name] = (counts[name] || 0) + 1;
    }

    const items = PRODUCTS
      .filter((p) => counts[p.name])
      .map((p) => {
        const qty = counts[p.name];
        return { ...p, qty, line: round2(p.price * qty) };
      });

    return { moment, items };
  }

  function fmt(n) {
    return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderPriceList() {
    const el = $("price-list");
    el.innerHTML = "";
    PRODUCTS.forEach((p) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML =
        '<span class="name">' + p.name + '</span>' +
        '<span class="p">' + fmt(p.price) + ' €</span>';
      el.appendChild(row);
    });
  }

  function render(items) {
    orderEl.innerHTML = "";
    items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML =
        '<span class="name">' + it.name + ' <span class="qty">×' + it.qty + '</span></span>';
      orderEl.appendChild(div);
    });
  }

  function tick() {
    const elapsed = (performance.now() - start) / 1000;
    timeEl.textContent = elapsed.toFixed(2) + "s";
  }

  function startTimer() {
    start = performance.now();
    clearInterval(timerId);
    timerId = setInterval(tick, 50);
    tick();
  }

  function stopTimer() {
    clearInterval(timerId);
    return (performance.now() - start) / 1000;
  }

  function parseAnswer(s) {
    if (s == null) return NaN;
    s = String(s).trim().replace(",", ".").replace(/\s/g, "");
    if (s === "") return NaN;
    return parseFloat(s);
  }

  function newRound() {
    locked = false;
    resultEl.className = "result";
    resultEl.textContent = "";
    inputEl.value = "";
    inputEl.disabled = false;
    checkBtn.disabled = false;

    total = 0;
    const { items } = genOrder();
    items.forEach((it) => { total += it.line; });
    total = round2(total);
    payment = genPayment(total);
    step = 1;
    step1Ok = false;

    render(items);
    roundEl.textContent = round;
    badgeEl.textContent = MODES[mode].badge;
    subEl.textContent = MODES[mode].sub;

    if (mode === "change") {
      paymentEl.classList.add("show");
      paymentEl.innerHTML =
        '<span class="label">El cliente paga con</span>' +
        '<span class="amt">' + fmt(payment.amount) + ' €</span>' +
        '<span class="label" style="margin-top:4px">(' + billsLabel(payment.labels) + ')</span>';
      inputEl.placeholder = "Cambio (€)";
    } else {
      paymentEl.classList.remove("show");
      paymentEl.textContent = "";
      inputEl.placeholder = "Total (€)";
    }

    startTimer();
    inputEl.focus();
  }

  function recordRound(ok, elapsed) {
    stats.rounds++;
    stats.sumTime += elapsed;
    if (ok) {
      stats.correct++;
      if (elapsed < stats.best) stats.best = elapsed;
    }
  }

  function statsRows(elapsed) {
    const avg = stats.correct > 0 ? stats.sumTime / stats.correct : 0;
    return (
      '<div class="row"><span>Tiempo</span><span>' + elapsed.toFixed(2) + ' s</span></div>' +
      '<div class="row"><span>Mejor tiempo</span><span>' + (isFinite(stats.best) ? stats.best.toFixed(2) + ' s' : "—") + '</span></div>' +
      '<div class="row"><span>Media (aciertos)</span><span>' + (stats.correct ? avg.toFixed(2) + ' s' : "—") + '</div>'
    );
  }

  // --- Modo total ---
  function checkTotal() {
    const guess = parseAnswer(inputEl.value);
    if (isNaN(guess)) { inputEl.focus(); return; }
    const elapsed = stopTimer();
    locked = true;
    inputEl.disabled = true;
    checkBtn.disabled = true;

    const ok = Math.abs(guess - total) < 0.01;
    recordRound(ok, elapsed);

    resultEl.className = "result show " + (ok ? "ok" : "bad");
    resultEl.innerHTML =
      '<div class="row"><span>' + (ok ? "¡Correcto!" : "Incorrecto") + '</span>' +
      '<span>Tú: ' + fmt(guess) + ' € | Real: ' + fmt(total) + ' €</span></div>' +
      statsRows(elapsed);
    round++;
    renderStats();
  }

  // --- Modo twostep, paso 1 (total) ---
  function checkTotalStep1() {
    const guess = parseAnswer(inputEl.value);
    if (isNaN(guess)) { inputEl.focus(); return; }

    step1Ok = Math.abs(guess - total) < 0.01;
    resultEl.className = "result show " + (step1Ok ? "ok" : "bad");
    resultEl.innerHTML =
      '<div class="row"><span>Total: ' + (step1Ok ? "¡Correcto!" : "Incorrecto") + '</span>' +
      '<span>Tú: ' + fmt(guess) + ' € | Real: ' + fmt(total) + ' €</span></div>' +
      '<div class="row"><span>Ahora calcula el cambio</span><span>Cliente paga: ' + fmt(payment.amount) + ' € (' + billsLabel(payment.labels) + ')</span></div>';

    // Transición al paso 2.
    step = 2;
    inputEl.value = "";
    inputEl.placeholder = "Cambio (€)";
    paymentEl.classList.add("show");
    paymentEl.innerHTML =
      '<span class="label">El cliente paga con</span>' +
      '<span class="amt">' + fmt(payment.amount) + ' €</span>' +
      '<span class="label" style="margin-top:4px">(' + billsLabel(payment.labels) + ') · Total: ' + fmt(total) + ' €</span>';
    inputEl.focus();
    // El cronómetro sigue corriendo.
  }

  // --- Cambio (twostep paso 2 y modo change) ---
  function checkChange() {
    const guess = parseAnswer(inputEl.value);
    if (isNaN(guess)) { inputEl.focus(); return; }
    const elapsed = stopTimer();
    locked = true;
    inputEl.disabled = true;
    checkBtn.disabled = true;

    const change = round2(payment.amount - total);
    const changeOk = Math.abs(guess - change) < 0.01;
    const ok = mode === "twostep" ? (changeOk && step1Ok) : changeOk;
    recordRound(ok, elapsed);

    const header =
      mode === "twostep"
        ? '<div class="row"><span>Total: ' + (step1Ok ? "✓" : "✗") + ' · Cambio: ' + (changeOk ? "✓" : "✗") + '</span></div>'
        : '<div class="row"><span>' + (ok ? "¡Cambio correcto!" : "Incorrecto") + '</span></div>';

    resultEl.className = "result show " + (ok ? "ok" : "bad");
    resultEl.innerHTML =
      header +
      '<div class="row"><span>Cambio</span><span>Tú: ' + fmt(guess) + ' € | Real: ' + fmt(change) + ' €</span></div>' +
      '<div class="row"><span>Total</span><span>' + fmt(total) + ' €</span></div>' +
      '<div class="row"><span>Pago</span><span>' + fmt(payment.amount) + ' € (' + billsLabel(payment.labels) + ')</span></div>' +
      statsRows(elapsed);
    round++;
    renderStats();
  }

  function check() {
    if (locked) return;
    if (mode === "total") checkTotal();
    else if (mode === "twostep" && step === 1) checkTotalStep1();
    else checkChange();
  }

  function renderStats() {
    const acc = stats.rounds ? Math.round((stats.correct / stats.rounds) * 100) : 0;
    statsEl.innerHTML =
      "Aciertos: <strong>" + stats.correct + "/" + stats.rounds + "</strong> (" + acc + "%) · " +
      "Mejor: <strong>" + (isFinite(stats.best) ? stats.best.toFixed(2) + "s" : "—") + "</strong>";
  }

  function resetStats() {
    stats.rounds = 0;
    stats.correct = 0;
    stats.best = Infinity;
    stats.sumTime = 0;
    round = 1;
    renderStats();
    newRound();
  }

  function goHome() {
    showStart();
  }

  function startMode(m) {
    mode = m;
    showGame();
    renderStats();
    newRound();
  }

  checkBtn.addEventListener("click", check);
  $("new").addEventListener("click", newRound);
  $("reset").addEventListener("click", resetStats);
  $("home").addEventListener("click", goHome);

  document.querySelectorAll(".modes .cta").forEach((btn) => {
    btn.addEventListener("click", () => startMode(btn.dataset.mode));
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (locked) newRound();
      else check();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && gameEl.classList.contains("show")) {
      e.preventDefault();
      goHome();
      return;
    }
    if (e.key !== "Enter") return;
    if (document.activeElement === inputEl) return;
    e.preventDefault();
    if (gameEl.classList.contains("show")) {
      if (locked) newRound();
      else { inputEl.focus(); }
    }
  });

  // En móvil, al abrir el teclado, hacer que el primer producto quede visible.
  if (window.visualViewport) {
    const vv = window.visualViewport;
    const onViewport = () => {
      if (document.activeElement !== inputEl) return;
      const firstItem = orderEl.firstElementChild;
      if (!firstItem) return;
      const r = firstItem.getBoundingClientRect();
      // Si el primer producto empieza por encima del area visible, subir.
      if (r.top < 8) {
        window.scrollBy({ top: r.top - 8, behavior: "smooth" });
      }
    };
    vv.addEventListener("resize", onViewport);
    inputEl.addEventListener("focus", () => setTimeout(onViewport, 150));
  }

  renderPriceList();
  showStart();
})();
