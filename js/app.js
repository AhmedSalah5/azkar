(() => {
  const KEY = "azkar-state-v1";
  const today = new Date().toDateString();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  const state = {
    counts: saved.day === today ? saved.counts || {} : {},
    cat: saved.cat || "morning",
    font: saved.font || 24,
    theme: saved.theme || null
  };
  const $ = id => document.getElementById(id);
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ day: today, ...state })); } catch (e) {}
  };

  function applyPrefs() {
    document.documentElement.style.setProperty("--font", state.font + "px");
    if (state.theme) document.documentElement.dataset.theme = state.theme;
  }

  function renderTabs() {
    $("tabs").innerHTML = "";
    Object.entries(AZKAR).forEach(([k, v]) => {
      const b = document.createElement("button");
      b.textContent = v.title;
      b.className = k === state.cat ? "active" : "";
      b.onclick = () => { state.cat = k; save(); renderTabs(); renderList(); };
      $("tabs").appendChild(b);
    });
  }

  function updateProgress() {
    const items = AZKAR[state.cat].items;
    const done = items.filter((it, i) => (state.counts[state.cat + i] || 0) >= it.c).length;
    $("bar").style.width = (done / items.length * 100) + "%";
  }

  function renderList() {
    const list = $("list");
    list.innerHTML = "";
    AZKAR[state.cat].items.forEach((it, i) => {
      const id = state.cat + i;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = (it.n ? `<p class="note">${it.n}</p>` : "") +
        `<p class="text">${it.t}</p><span class="count"></span>`;
      const label = card.querySelector(".count");
      const refresh = () => {
        const n = state.counts[id] || 0;
        label.textContent = n >= it.c ? "✓ تم" : `${n} / ${it.c}`;
        card.classList.toggle("done", n >= it.c);
      };
      card.onclick = () => {
        const n = state.counts[id] || 0;
        if (n >= it.c) return;
        state.counts[id] = n + 1;
        if (navigator.vibrate) navigator.vibrate(state.counts[id] >= it.c ? 80 : 15);
        save(); refresh(); updateProgress();
      };
      refresh();
      list.appendChild(card);
    });
    updateProgress();
  }

  $("fontPlus").onclick = () => { state.font = Math.min(40, state.font + 2); applyPrefs(); save(); };
  $("fontMinus").onclick = () => { state.font = Math.max(16, state.font - 2); applyPrefs(); save(); };
  $("theme").onclick = () => {
    const dark = document.documentElement.dataset.theme === "dark" ||
      (!state.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    state.theme = dark ? "light" : "dark";
    applyPrefs(); save();
  };
  $("reset").onclick = () => {
    if (!confirm("إعادة عد هذا القسم من البداية؟")) return;
    AZKAR[state.cat].items.forEach((_, i) => delete state.counts[state.cat + i]);
    save(); renderList();
  };

  let deferred;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; $("install").hidden = false; });
  $("install").onclick = async () => {
    if (!deferred) return;
    deferred.prompt(); await deferred.userChoice; deferred = null; $("install").hidden = true;
  };
  addEventListener("appinstalled", () => { $("install").hidden = true; });

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

  applyPrefs(); renderTabs(); renderList();
})();
