// آدرس Worker بعد از Deploy در این خط قرار می‌گیرد.
const WORKER_URL = "https://mahdi-pinke.hmty00697.workers.dev"; // مثال: https://mahdi-pink-api.YOUR-SUBDOMAIN.workers.dev

const $ = (id) => document.getElementById(id);
const pageOne = $("page-one"), pageTwo = $("page-two"), pageDone = $("page-done");
const firstYes = $("first-yes"), firstNo = $("first-no");
const secondYes = $("second-yes"), secondNo = $("second-no");
let firstEscapes = 0, secondEscapes = 0, toastTimer;

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
}
function goTo(page) {
  [pageOne,pageTwo,pageDone].forEach(p => p.classList.add("hidden"));
  page.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}
function moveButton(button, container, scale) {
  const area = container.getBoundingClientRect();
  const btn = button.getBoundingClientRect();
  const maxX = Math.max(0, area.width - btn.width);
  const maxY = 28;
  const x = Math.random() * maxX - maxX/2;
  const y = (Math.random() * maxY) - maxY/2;
  button.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
}
function escapeFirst() {
  firstEscapes++;
  firstYes.style.transform = `scale(${Math.max(.48, 1 - firstEscapes*.13)})`;
  firstYes.style.opacity = String(Math.max(.45, 1 - firstEscapes*.09));
  firstNo.style.transform = `scale(${1 + firstEscapes*.12})`;
  moveButton(firstYes, $("page-one"), Math.max(.48, 1-firstEscapes*.13));
  const lines = ["نه دیگه کات کن 😂","عه! نزدیک بودا 😭","این‌قدر اصرار نکن 😂","بی‌خیال آره شو، نه رو بزن 🙈"];
  $("first-hint").textContent = lines[Math.min(firstEscapes-1, lines.length-1)];
}
firstYes.addEventListener("pointerenter", (e) => { if(e.pointerType === "mouse") escapeFirst(); });
firstYes.addEventListener("pointerdown", (e) => { e.preventDefault(); escapeFirst(); });
firstYes.addEventListener("click", (e) => { e.preventDefault(); escapeFirst(); });
firstNo.addEventListener("click", () => goTo(pageTwo));

function escapeSecond() {
  secondEscapes++;
  const messages = ["حالا فکراتو کن! 😂","ترو خدا نه نگو 🥺","آخه چرااا؟ 😭","من هنوز امید دارم! 💔"];
  $("second-hint").textContent = messages[Math.min(secondEscapes-1,messages.length-1)];
  if(secondEscapes >= 4) {
    secondNo.classList.add("vanish");
    secondNo.style.transition = "opacity .35s, transform .35s";
    secondNo.style.opacity = "0";
    secondNo.style.transform = "scale(.1) rotate(25deg)";
    setTimeout(() => secondNo.remove(), 380);
    showToast("دکمه نه استعفا داد! 😂");
  } else {
    const scale = Math.max(.72,1-secondEscapes*.08);
    secondNo.style.transform = `translate(${(Math.random()-.5)*100}px,${(Math.random()-.5)*35}px) scale(${scale})`;
  }
}
secondNo.addEventListener("pointerenter", (e) => { if(e.pointerType === "mouse") escapeSecond(); });
secondNo.addEventListener("pointerdown", (e) => { e.preventDefault(); escapeSecond(); });
secondNo.addEventListener("click", (e) => { e.preventDefault(); escapeSecond(); });

secondYes.addEventListener("click", async () => {
  secondYes.disabled = true;
  secondYes.textContent = "ثبت شد! 💗";
  goTo(pageDone);
  if (!WORKER_URL) {
    showToast("برای فعال شدن اعلان تلگرام، آدرس Worker را تنظیم کن.");
    return;
  }
  try {
    const response = await fetch(WORKER_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({event:"yes_clicked", page:"second"})
    });
    if(!response.ok) throw new Error("notify failed");
  } catch(err) {
    showToast("جواب ثبت شد، اما ارسال اعلان ناموفق بود.");
  }
});

// قلب‌های شناور تزئینی
const heartLayer = document.querySelector(".hearts");
const symbols = ["♥","♡","✦","💕"];
setInterval(() => {
  const heart = document.createElement("span");
  heart.className = "heart";
  heart.textContent = symbols[Math.floor(Math.random()*symbols.length)];
  heart.style.left = Math.random()*100+"%";
  heart.style.fontSize = (12+Math.random()*15)+"px";
  heart.style.animationDuration = (7+Math.random()*6)+"s";
  heartLayer.appendChild(heart);
  setTimeout(()=>heart.remove(),14000);
},850);
