const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let compared=JSON.parse(localStorage.getItem("motoCompared")||"[]");
let favorites=JSON.parse(localStorage.getItem("motoFavorites")||"[]");

$("#modelCount").textContent=MOTOS.length+"+";
$("#brandCount").textContent=BRANDS.length;

const bf=$("#brandFilter"), tf=$("#typeFilter");
BRANDS.forEach(b=>bf.innerHTML+=`<option>${b.name}</option>`);
[...new Set(MOTOS.map(m=>m.type))].forEach(t=>tf.innerHTML+=`<option>${t}</option>`);

$("#chips").innerHTML='<button class="chip active" data-type="">همه</button>'+[...new Set(MOTOS.map(m=>m.type))].map(t=>`<button class="chip" data-type="${t}">${t}</button>`).join("");
$$(".chip").forEach(c=>c.onclick=()=>{$$(".chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");tf.value=c.dataset.type;render();});

function render(){
 const q=$("#search").value.trim().toLowerCase(), b=bf.value,t=tf.value,c=$("#ccFilter").value;
 const list=MOTOS.filter(m=>{
  const hay=(m.name+" "+m.brand+" "+m.type+" "+m.engine+" "+m.desc).toLowerCase();
  return (!q||hay.includes(q))&&(!b||m.brand===b)&&(!t||m.type===t)&&(!c||(c==="small"?m.cc<=500:c==="mid"?m.cc>500&&m.cc<=1000:m.cc>1000));
 });
 $("#results").textContent=list.length+" مدل";
 $("#cards").innerHTML=list.length?list.map(m=>card(m)).join(""):`<div class="empty" style="grid-column:1/-1">چیزی پیدا نشد. یک فیلتر دیگر امتحان کن.</div>`;
}
function card(m){
 const fav=favorites.includes(m.id), cmp=compared.includes(m.id);
 return `<article class="card"><div class="cardVisual"><span class="emoji">🏍️</span><span class="year">${m.year}</span></div><div class="cardBody">
 <span class="meta">${m.brand} • ${m.type}</span><h3>${m.name}</h3><p class="desc">${m.desc}</p>
 <div class="specs"><div class="spec"><b>${m.cc}</b><span>CC</span></div><div class="spec"><b>${m.hp}</b><span>HP</span></div><div class="spec"><b>${m.kg}</b><span>KG</span></div></div>
 <div class="cardActions"><button class="primary" onclick="details(${m.id})">مشخصات</button><button onclick="toggleCompare(${m.id})">${cmp?"✓ در مقایسه":"+ مقایسه"}</button><button onclick="toggleFav(${m.id})">${fav?"★":"☆"}</button></div>
 </div></article>`;
}
[$("#search"),bf,tf,$("#ccFilter")].forEach(x=>x.addEventListener("input",render));

function details(id){
 const m=MOTOS.find(x=>x.id===id);
 $("#modalBody").innerHTML=`<div class="detailTop"><div class="detailBike">🏍️</div><div><span class="meta">${m.brand} • ${m.type}</span><h2>${m.name}</h2><p class="desc">${m.desc}</p></div></div>
 <div class="detailGrid">${[["حجم موتور",m.cc+" cc"],["قدرت",m.hp+" hp"],["گشتاور",m.nm+" Nm"],["وزن",m.kg+" kg"],["حداکثر سرعت",m.top+" km/h"],["موتور",m.engine],["سال مدل",m.year],["شتاب تقریبی 0–100",m.accel+" ثانیه"],["مصرف نظری تقریبی",m.fuel+" L/100km"]].map(a=>`<div><small>${a[0]}</small><b>${a[1]}</b></div>`).join("")}</div>
 <p style="color:#707b88;font-size:11px;margin-top:20px">اعداد نمایش‌داده‌شده برای نسخه نمایشی سایت هستند و در نسخه دیتابیس نهایی باید با داده رسمی هر بازار و سال مدل جایگزین و منبع‌دهی شوند.</p>`;
 $("#modal").classList.add("open");
}
function closeModal(){$("#modal").classList.remove("open")}
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

function toggleCompare(id){
 compared=compared.includes(id)?compared.filter(x=>x!==id):[...compared,id].slice(-4);
 localStorage.setItem("motoCompared",JSON.stringify(compared)); renderCompare(); render();
 if(location.hash!=="#compare" && compared.length>=2) $("#compare").scrollIntoView({behavior:"smooth"});
}
function renderCompare(){
 if(compared.length<2){$("#compareBox").innerHTML='<div class="empty">برای شروع از کارت موتورها «مقایسه» را بزن. حداکثر ۴ مدل.</div>';return}
 const xs=compared.map(id=>MOTOS.find(m=>m.id===id));
 $("#compareBox").innerHTML=`<div class="compareWrap"><table class="compareTable"><tr><th>مشخصه</th>${xs.map(x=>`<th>${x.name}</th>`).join("")}</tr>${[["برند","brand"],["کلاس","type"],["حجم موتور","cc"],["قدرت","hp"],["گشتاور","nm"],["وزن","kg"],["حداکثر سرعت","top"],["موتور","engine"]].map(r=>`<tr><td>${r[0]}</td>${xs.map(x=>`<td>${x[r[1]]}</td>`).join("")}</tr>`).join("")}</table></div>`;
}
function toggleFav(id){
 favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];
 localStorage.setItem("motoFavorites",JSON.stringify(favorites));render();renderGarage();
}
function renderGarage(){
 const xs=favorites.map(id=>MOTOS.find(m=>m.id===id)).filter(Boolean);
 $("#garageBox").innerHTML=xs.length?`<div class="garageItems">${xs.map(x=>`<div class="garageItem"><button class="remove" onclick="toggleFav(${x.id})">×</button><small>${x.brand}</small><h4>${x.name}</h4><span style="font-size:10px;color:#737e8b">${x.cc}cc • ${x.hp}hp</span></div>`).join("")}</div>`:'<div class="empty">گاراژت خالی است. روی ☆ کارت هر موتور بزن تا ذخیره شود.</div>';
}

$("#brandGrid").innerHTML=BRANDS.map(b=>`<article class="brandCard" onclick="brandJump('${b.name.replace(/'/g,"\\'")}')"><div class="brandLogo">${b.name}</div><small>${b.country} • ${b.logo}</small><p>${b.desc}</p></article>`).join("");
function brandJump(name){bf.value=name;tf.value="";$("#search").value="";$("#catalog").scrollIntoView({behavior:"smooth"});render()}

$("#factGrid").innerHTML=FACTS.map((f,i)=>`<article class="fact"><span class="num">0${i+1}</span><h3>${f[1]}</h3><p>${f[2]}</p><small style="color:#ff633c">${f[0]}</small></article>`).join("");
function randomFact(){const f=FACTS[Math.floor(Math.random()*FACTS.length)];detailsFact(f)}
function detailsFact(f){$("#modalBody").innerHTML=`<span class="kicker">${f[0]}</span><h2>${f[1]}</h2><p style="color:#a1abb6;line-height:2">${f[2]}</p>`;$("#modal").classList.add("open")}

$("#glossaryGrid").innerHTML=GLOSSARY.map(x=>`<div class="term"><b>${x[0]}</b><p>${x[1]}</p></div>`).join("");

let quizIndex=0,score=0;
function quiz(){
 if(quizIndex>=QUIZZES.length){$("#quizBox").innerHTML=`<div class="quizResult"><span class="kicker">FINISHED</span><h3>کوییز تمام شد!</h3><b>${score}/${QUIZZES.length}</b><p style="color:#7c8794">دوباره امتحان کن و رکورد خودت را بهتر کن.</p><button class="randomBtn" onclick="quizIndex=0;score=0;quiz()">شروع دوباره</button></div>`;return}
 const q=QUIZZES[quizIndex];
 $("#quizBox").innerHTML=`<div class="kicker">QUESTION ${quizIndex+1}/${QUIZZES.length}</div><h3 class="quizQuestion">${q[0]}</h3><div class="quizOptions">${q[1].map((o,i)=>`<button onclick="answer(${i})">${o}</button>`).join("")}</div>`;
}
function answer(i){if(i===QUIZZES[quizIndex][2])score++;quizIndex++;quiz()}
$("#theme").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("motoTheme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("motoTheme")==="light")document.body.classList.add("light");

function jumpSearch(){const v=$("#globalSearch").value;$("#search").value=v;$("#catalog").scrollIntoView({behavior:"smooth"});render()}
$("#globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter")jumpSearch()});
$("#menu").onclick=()=>{const nav=$(".header nav");nav.style.display=nav.style.display==="flex"?"none":"flex";nav.style.position="absolute";nav.style.top="76px";nav.style.right="0";nav.style.left="0";nav.style.padding="18px 5vw";nav.style.background="#080b10";nav.style.flexDirection="column"};

render();renderCompare();renderGarage();quiz();

// ---------- MOTO LAB ----------
function lab(){
 const hp=+$("#powerRange").value, cc=+$("#ccRange").value, kg=+$("#weightRange").value;
 $("#powerVal").textContent=hp;
 const angle=-60+(hp-40)/(220-40)*120;
 $("#needle").style.transform=`translateX(-50%) rotate(${angle}deg)`;
 let candidates=MOTOS.map(m=>({m,score:Math.abs(m.hp-hp)/2+Math.abs(m.cc-cc)/30+Math.abs(m.kg-kg)/12})).sort((a,b)=>a.score-b.score).slice(0,3);
 $("#labResult").innerHTML=`<strong>نزدیک‌ترین انتخاب‌ها:</strong> ${candidates.map(x=>x.m.name).join(" • ")}<br><small>این ابزار برای سرگرمی و کشف مدل‌هاست.</small>`;
}
["powerRange","ccRange","weightRange"].forEach(id=>$("#"+id).addEventListener("input",lab));
lab();

function spinOracle(){
 const btn=document.querySelector(".spin"); btn.classList.add("spinning");
 setTimeout(()=>{const m=MOTOS[Math.floor(Math.random()*MOTOS.length)];btn.classList.remove("spinning");$("#oracleText").innerHTML=`امروز انتخابت: <strong style="color:#fff">${m.name}</strong> — ${m.brand}، ${m.type}، ${m.cc}cc. <button class="randomBtn" onclick="details(${m.id})">ببینش</button>`;unlock("lucky");},900);
}

// ---------- ACHIEVEMENTS ----------
const achievementDefs=[
 ["explorer","🧭","کاوشگر","۵ موتور را باز کن"],
 ["collector","⭐","کلکسیونر","۳ موتور را در گاراژ ذخیره کن"],
 ["compare","⚖️","مقایسه‌گر","۲ موتور را مقایسه کن"],
 ["reader","🧠","دانشمند","بخش دانستنی‌ها را ببین"],
 ["lucky","🎰","خوش‌شانس","گردونه را بچرخان"]
];
let unlocked=JSON.parse(localStorage.getItem("motoAchievements")||"[]");
function unlock(id){if(!unlocked.includes(id)){unlocked.push(id);localStorage.setItem("motoAchievements",JSON.stringify(unlocked));renderAchievements()}}
function renderAchievements(){
 $("#achievements").innerHTML=achievementDefs.map(a=>`<div class="achievement ${unlocked.includes(a[0])?"unlocked":""}"><div class="medal">${a[1]}</div><h4>${a[2]}</h4><p>${a[3]}</p></div>`).join("");
}
renderAchievements();

const oldDetails=details;
window.details=function(id){unlock("explorer");oldDetails(id)};
const oldToggleFav=toggleFav;
window.toggleFav=function(id){oldToggleFav(id);if(favorites.length>=3)unlock("collector")};
const oldToggleCompare=toggleCompare;
window.toggleCompare=function(id){oldToggleCompare(id);if(compared.length>=2)unlock("compare")};
document.querySelector("#knowledge")?.addEventListener("click",()=>unlock("reader"));
