// آدرس Worker برای API و پنل مدیریت
const API_BASE = "https://mahdi-pinke.hmty00697.workers.dev";
const $ = (id) => document.getElementById(id);
const pageOne = $("page-one"), pageTwo = $("page-two"), pageDone = $("page-done");
const firstYes = $("first-yes"), firstNo = $("first-no");
const secondYes = $("second-yes"), secondNo = $("second-no");
const visitorKey = "mahdiPinkVisitorId";
const visitorId = getVisitorId();
let firstAttempts = 0, secondAttempts = 0, toastTimer;

function getVisitorId() {
  let id = localStorage.getItem(visitorKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(visitorKey, id);
  }
  return id;
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}
function goTo(page) {
  [pageOne,pageTwo,pageDone].forEach(p => p.classList.add("hidden"));
  page.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}
function track(eventType) {
  const payload = { visitorId, event: eventType };
  fetch(`${API_BASE}/api/track`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload),
    keepalive:true
  }).catch(() => {});
}
function moveAcrossPage(button, scale=1) {
  const margin = 18;
  const width = button.offsetWidth;
  const height = button.offsetHeight;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(80, window.innerHeight - height - margin);
  const x = margin + Math.random() * Math.max(0, maxX - margin);
  const y = margin + Math.random() * Math.max(0, maxY - margin);
  button.style.position = "fixed";
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;
  button.style.zIndex = "10";
  button.style.transform = `scale(${scale})`;
}
function escapeFirst(countAttempt) {
  if (countAttempt) {
    firstAttempts++;
    track("first_yes_attempt");
  }
  const lines = ["نه دیگه کات کن 😂","عه! نزدیک بودا 😭","این‌قدر اصرار نکن 😂","بی‌خیال آره شو، نه رو بزن 🙈","دکمه آره امروز مرخصیه! 😂"];
  $("first-hint").textContent = lines[Math.min(firstAttempts, lines.length)-1] || lines[4];
  moveAcrossPage(firstYes, Math.max(.72, 1-firstAttempts*.035));
}
firstYes.addEventListener("pointerenter", e => {
  if (e.pointerType === "mouse") escapeFirst(false);
});
firstYes.addEventListener("pointerdown", e => {
  e.preventDefault();
  escapeFirst(true);
});
firstYes.addEventListener("click", e => e.preventDefault());
firstNo.addEventListener("click", () => {
  firstYes.style.position = "";
  firstYes.style.left = "";
  firstYes.style.top = "";
  firstYes.style.transform = "";
  goTo(pageTwo);
});

function escapeSecond(countAttempt) {
  if (countAttempt) {
    secondAttempts++;
    track("second_no_attempt");
  }
  const messages = ["حالا فکراتو کن! 😂","ترو خدا نه نگو 🥺","آخه چرااا؟ 😭","من هنوز امید دارم! 💔","این دکمه هم تسلیم نمی‌شه! 😂"];
  $("second-hint").textContent = messages[Math.min(secondAttempts, messages.length)-1] || messages[4];
  moveAcrossPage(secondNo, Math.max(.72, 1-secondAttempts*.025));
}
secondNo.addEventListener("pointerenter", e => {
  if (e.pointerType === "mouse") escapeSecond(false);
});
secondNo.addEventListener("pointerdown", e => {
  e.preventDefault();
  escapeSecond(true);
});
secondNo.addEventListener("click", e => e.preventDefault());

secondYes.addEventListener("click", () => {
  secondYes.disabled = true;
  secondYes.textContent = "ثبت شد! 💗";
  track("final_yes");
  goTo(pageDone);
});

track("page_view");

// پنل مدیریت
const adminPanel = $("admin-panel");
let adminToken = sessionStorage.getItem("mahdiPinkAdminToken") || "";
$("admin-open").addEventListener("click", () => adminPanel.classList.remove("hidden"));
$("admin-close").addEventListener("click", () => adminPanel.classList.add("hidden"));
adminPanel.addEventListener("click", e => {
  if (e.target === adminPanel) adminPanel.classList.add("hidden");
});
function showAdminError(message) { $("admin-error").textContent = message; }
async function loadStats() {
  const response = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { "Authorization": `Bearer ${adminToken}` }
  });
  if (!response.ok) throw new Error("دسترسی نامعتبر یا نشست منقضی شده است.");
  const data = await response.json();
  $("stat-visitors").textContent = data.summary.visitors;
  $("stat-views").textContent = data.summary.pageViews;
  $("stat-first").textContent = data.summary.firstYesAttempts;
  $("stat-second").textContent = data.summary.secondNoAttempts;
  $("stat-final").textContent = data.summary.finalYes;
  const tbody = $("visitor-rows");
  tbody.replaceChildren();
  if (!data.visitors.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7; td.textContent = "هنوز آماری ثبت نشده است.";
    tr.appendChild(td); tbody.appendChild(tr); return;
  }
  for (const v of data.visitors) {
    const tr = document.createElement("tr");
    const values = [v.shortId,v.deviceType || "نامشخص",v.browser || "نامشخص",v.country || "نامشخص",v.firstYesAttempts,v.secondNoAttempts,v.finalYes ? "بله" : "خیر"];
    for (const value of values) {
      const td = document.createElement("td");
      td.textContent = String(value);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}
$("admin-login").addEventListener("submit", async e => {
  e.preventDefault();
  showAdminError("در حال بررسی...");
  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({password:$("admin-password").value})
    });
    const data = await response.json();
    if (!response.ok || !data.token) throw new Error(data.error || "رمز عبور درست نیست.");
    adminToken = data.token;
    sessionStorage.setItem("mahdiPinkAdminToken", adminToken);
    $("admin-login").classList.add("hidden");
    $("admin-content").classList.remove("hidden");
    showAdminError("");
    await loadStats();
  } catch (err) { showAdminError(err.message || "اتصال برقرار نشد."); }
});
$("refresh-stats").addEventListener("click", async () => {
  try { await loadStats(); showToast("آمار به‌روز شد."); }
  catch (err) { showAdminError(err.message); }
});
$("admin-logout").addEventListener("click", () => {
  adminToken = "";
  sessionStorage.removeItem("mahdiPinkAdminToken");
  $("admin-content").classList.add("hidden");
  $("admin-login").classList.remove("hidden");
  $("admin-password").value = "";
});
