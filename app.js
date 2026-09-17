const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);

/* ---------- state ---------- */
let compared=JSON.parse(localStorage.getItem("motoCompared")||"[]");
let favorites=JSON.parse(localStorage.getItem("motoFavorites")||"[]");
let visibleCount=12;
const PAGE_SIZE=12;
let viewedBrands=new Set(JSON.parse(localStorage.getItem("motoBrandsViewed")||"[]"));

/* ---------- type colors & icon ---------- */
const TYPE_COLORS={
  "سوپراسپرت":"#ff4d4d","نیکد":"#ff9d32","ادونچر":"#3ddc84","تورینگ":"#4fa3ff",
  "کروزر":"#b98cff","شهری":"#29d3c6","اسکوتر":"#ff6fae","کلاسیک":"#d8a657","برقی":"#29e0ff"
};
function tint(t){return TYPE_COLORS[t]||"#ff5a30"}
function bikeIcon(){return `<svg viewBox="0 0 64 64"><use href="#i-bike"/></svg>`}

/* ---------- toast ---------- */
function toast(msg){
  const wrap=$("#toastWrap");
  const t=document.createElement("div");
  t.className="toast"; t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>t.remove(),2600);
}

/* ---------- header stats ---------- */
$("#modelCount").textContent=MOTOS.length+"+";
$("#brandCount").textContent=BRANDS.length;

/* ---------- filters setup ---------- */
const bf=$("#brandFilter"), tf=$("#typeFilter"), cf=$("#ccFilter"), pf=$("#budgetFilter"), sf=$("#sortFilter");
BRANDS.forEach(b=>bf.innerHTML+=`<option>${b.name}</option>`);
[...new Set(MOTOS.map(m=>m.type))].sort().forEach(t=>tf.innerHTML+=`<option>${t}</option>`);

$("#chips").innerHTML='<button class="chip active" data-type="">همه</button>'+[...new Set(MOTOS.map(m=>m.type))].sort().map(t=>`<button class="chip" data-type="${t}" style="--tint:${tint(t)}">${t}</button>`).join("");
$$(".chip").forEach(c=>c.onclick=()=>{$$(".chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");tf.value=c.dataset.type;visibleCount=PAGE_SIZE;render();});

function fmtPrice(p){return "$"+p.toLocaleString("en-US")}

function matches(m){
  const q=$("#search").value.trim().toLowerCase(), b=bf.value,t=tf.value,c=cf.value,budget=pf.value;
  const hay=(m.name+" "+m.brand+" "+m.type+" "+m.engine+" "+m.desc).toLowerCase();
  const okQ=!q||hay.includes(q);
  const okB=!b||m.brand===b;
  const okT=!t||m.type===t;
  const okC=!c||(c==="electric"?m.cc===0:c==="small"?(m.cc>0&&m.cc<=500):c==="mid"?(m.cc>500&&m.cc<=1000):m.cc>1000);
  const okP=!budget||(budget==="low"?m.price<8000:budget==="mid"?(m.price>=8000&&m.price<=18000):m.price>18000);
  return okQ&&okB&&okT&&okC&&okP;
}
function sortList(list){
  const s=sf.value;
  const arr=[...list];
  if(s==="power")arr.sort((a,b)=>b.hp-a.hp);
  else if(s==="light")arr.sort((a,b)=>a.kg-b.kg);
  else if(s==="priceAsc")arr.sort((a,b)=>a.price-b.price);
  else if(s==="priceDesc")arr.sort((a,b)=>b.price-a.price);
  else if(s==="name")arr.sort((a,b)=>a.name.localeCompare(b.name));
  else if(s==="rating")arr.sort((a,b)=>b.rating-a.rating);
  return arr;
}

function render(){
  const full=sortList(MOTOS.filter(matches));
  $("#results").textContent=full.length+" مدل";
  const list=full.slice(0,visibleCount);
  $("#cards").innerHTML=list.length?list.map(m=>card(m)).join(""):`<div class="empty" style="grid-column:1/-1">چیزی پیدا نشد. یک فیلتر دیگر امتحان کن.</div>`;
  const lm=$("#loadMoreWrap");
  lm.innerHTML = full.length>visibleCount ? `<button onclick="loadMore()">نمایش ${Math.min(PAGE_SIZE,full.length-visibleCount)} مدل بیشتر ↓</button>` : "";
}
function loadMore(){visibleCount+=PAGE_SIZE;render()}

function card(m){
  const fav=favorites.includes(m.id), cmp=compared.includes(m.id), c=tint(m.type);
  return `<article class="card" style="--tint:${c}">
   <div class="cardVisual">${bikeIcon()}<span class="year num">${m.year}</span><span class="typeTag">${m.type}</span></div>
   <div class="cardBody">
    <span class="meta">${m.brand}</span><h3>${m.name}</h3><p class="desc">${m.desc}</p>
    <div class="specs">
      <div class="spec"><b class="num">${m.cc||"—"}</b><span>CC</span></div>
      <div class="spec"><b class="num">${m.hp}</b><span>HP</span></div>
      <div class="spec"><b class="num">${m.kg}</b><span>KG</span></div>
    </div>
    <div class="priceRow"><b class="num">${fmtPrice(m.price)}</b><span class="rating">★ ${m.rating}</span></div>
    <div class="cardActions">
      <button class="primary" onclick="details(${m.id})">مشخصات</button>
      <button onclick="toggleCompare(${m.id})">${cmp?"✓ مقایسه":"+ مقایسه"}</button>
      <button onclick="toggleFav(${m.id})">${fav?"★":"☆"}</button>
    </div>
   </div></article>`;
}
[$("#search"),bf,tf,cf,pf].forEach(x=>x.addEventListener("input",()=>{visibleCount=PAGE_SIZE;render()}));
sf.addEventListener("input",render);

/* ---------- details modal ---------- */
function details(id){
  const m=MOTOS.find(x=>x.id===id);
  const maxHp=Math.max(...MOTOS.map(x=>x.hp)), maxNm=Math.max(...MOTOS.map(x=>x.nm)), maxTop=Math.max(...MOTOS.map(x=>x.top));
  const bar=(label,val,max,unit)=>`<div class="barRow"><small>${label}: <b class="num">${val}${unit}</b></small><div class="barTrack"><div class="barFill" style="width:${Math.min(100,val/max*100)}%"></div></div></div>`;
  $("#modalBody").innerHTML=`<div class="detailTop"><div class="detailBike" style="color:${tint(m.type)}">${bikeIcon()}</div><div><span class="meta">${m.brand} • ${m.type}</span><h2 style="margin:4px 0">${m.name}</h2><p class="desc" style="color:var(--text-dim);font-size:13px">${m.desc}</p></div></div>
  <div class="detailGrid">${[["حجم موتور",(m.cc||"—")+" cc"],["قدرت",m.hp+" hp"],["گشتاور",m.nm+" Nm"],["وزن",m.kg+" kg"],["حداکثر سرعت",m.top+" km/h"],["موتور",m.engine],["سال مدل",m.year],["شتاب تقریبی ۰–۱۰۰",m.accel+" ثانیه"],["قیمت تقریبی",fmtPrice(m.price)]].map(a=>`<div><small>${a[0]}</small><b class="num">${a[1]}</b></div>`).join("")}</div>
  <div style="margin-top:18px">${bar("قدرت نسبی",m.hp,maxHp,"hp")}${bar("گشتاور نسبی",m.nm,maxNm,"Nm")}${bar("سرعت نسبی",m.top,maxTop,"km/h")}</div>
  <p style="color:var(--text-faint);font-size:11px;margin-top:20px">اعداد نمایش‌داده‌شده برای نسخه نمایشی سایت هستند و در نسخه دیتابیس نهایی باید با داده رسمی هر بازار و سال مدل جایگزین و منبع‌دهی شوند.</p>`;
  $("#modal").classList.add("open");
}
function closeModal(){$("#modal").classList.remove("open")}
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

/* ---------- compare ---------- */
function toggleCompare(id){
  const already=compared.includes(id);
  compared=already?compared.filter(x=>x!==id):[...compared,id].slice(-4);
  localStorage.setItem("motoCompared",JSON.stringify(compared));
  renderCompare(); render();
  if(!already){toast("به مقایسه اضافه شد");}
  if(location.hash!=="#compare" && compared.length>=2) $("#compare").scrollIntoView({behavior:"smooth"});
}
function renderCompare(){
  if(compared.length<2){$("#compareBox").innerHTML='<div class="empty">برای شروع از کارت موتورها «مقایسه» را بزن. حداکثر ۴ مدل.</div>';return}
  const xs=compared.map(id=>MOTOS.find(m=>m.id===id));
  const rows=[["برند","brand",false,false],["کلاس","type",false,false],["حجم موتور","cc",true,true],["قدرت","hp",true,true],["گشتاور","nm",true,true],["وزن","kg",true,false],["حداکثر سرعت","top",true,true],["قیمت","price",true,false],["امتیاز","rating",true,true]];
  $("#compareBox").innerHTML=`<div class="compareWrap"><table class="compareTable"><tr><th>مشخصه</th>${xs.map(x=>`<th>${x.name}</th>`).join("")}</tr>${rows.map(r=>{
    const[label,key,isNum,higherBetter]=r;
    let best=null;
    if(isNum){const vals=xs.map(x=>x[key]);best=higherBetter?Math.max(...vals):Math.min(...vals);}
    return `<tr><td>${label}</td>${xs.map(x=>{
      const v=x[key];
      const disp=key==="price"?fmtPrice(v):v;
      const cls=isNum&&v===best?"best num":isNum?"num":"";
      return `<td class="${cls}">${disp}</td>`;
    }).join("")}</tr>`;
  }).join("")}</table></div>
  <div class="compareActions"><button onclick="clearCompare()">پاک‌کردن مقایسه</button></div>`;
}
function clearCompare(){compared=[];localStorage.setItem("motoCompared","[]");renderCompare();render()}

/* ---------- favorites / garage ---------- */
function toggleFav(id){
  const already=favorites.includes(id);
  favorites=already?favorites.filter(x=>x!==id):[...favorites,id];
  localStorage.setItem("motoFavorites",JSON.stringify(favorites));render();renderGarage();
  if(!already){toast("به گاراژ اضافه شد");if(favorites.length>=3)unlock("collector");}
}
function renderGarage(){
  const xs=favorites.map(id=>MOTOS.find(m=>m.id===id)).filter(Boolean);
  $("#garageBox").innerHTML=xs.length?`<div class="garageItems">${xs.map(x=>`<div class="garageItem"><button class="remove" onclick="toggleFav(${x.id})">×</button><small>${x.brand}</small><h4>${x.name}</h4><span style="font-size:10px;color:var(--text-faint)" class="num">${x.cc||0}cc • ${x.hp}hp</span></div>`).join("")}</div>`:'<div class="empty">گاراژت خالی است. روی ☆ کارت هر موتور بزن تا ذخیره شود.</div>';
}

/* ---------- brands ---------- */
$("#brandGrid").innerHTML=BRANDS.map(b=>`<article class="brandCard" onclick="brandJump('${b.name.replace(/'/g,"\\'")}')"><div class="brandLogo">${b.name.slice(0,2).toUpperCase()}</div><small>${b.country} • ${b.logo}</small><p>${b.desc}</p></article>`).join("");
function brandJump(name){
  bf.value=name;tf.value="";$("#search").value="";visibleCount=PAGE_SIZE;
  $("#catalog").scrollIntoView({behavior:"smooth"});render();
  viewedBrands.add(name);localStorage.setItem("motoBrandsViewed",JSON.stringify([...viewedBrands]));
  if(viewedBrands.size>=4)unlock("brandScout");
}

/* ---------- facts / knowledge ---------- */
let factCat="";
function renderFacts(){
  const cats=[...new Set(FACTS.map(f=>f[0]))];
  $("#factTabs").innerHTML='<button class="chip'+(factCat===""?" active":"")+'" onclick="setFactCat(\'\')">همه</button>'+cats.map(c=>`<button class="chip${factCat===c?" active":""}" onclick="setFactCat('${c}')">${c}</button>`).join("");
  const list=FACTS.filter(f=>!factCat||f[0]===factCat);
  $("#factGrid").innerHTML=list.map((f,i)=>`<article class="fact"><span class="catlabel">${f[0]}</span><h3>${f[1]}</h3><p>${f[2]}</p></article>`).join("");
}
function setFactCat(c){factCat=c;renderFacts();unlock("reader")}
function randomFact(){const f=FACTS[Math.floor(Math.random()*FACTS.length)];detailsFact(f);unlock("reader")}
function detailsFact(f){$("#modalBody").innerHTML=`<span class="kicker">${f[0]}</span><h2 style="margin:10px 0">${f[1]}</h2><p style="color:var(--text-dim);line-height:2">${f[2]}</p>`;$("#modal").classList.add("open")}

/* ---------- glossary ---------- */
$("#glossaryGrid").innerHTML=GLOSSARY.map(x=>`<div class="term"><b>${x[0]}</b><p>${x[1]}</p></div>`).join("");

/* ---------- quiz ---------- */
let quizIndex=0,score=0,answered=false;
function quiz(){
  answered=false;
  if(quizIndex>=QUIZZES.length){
    if(score===QUIZZES.length)unlock("quizMaster");
    $("#quizBox").innerHTML=`<div class="quizResult"><span class="kicker">FINISHED</span><h3>کوییز تمام شد!</h3><b class="num">${score}/${QUIZZES.length}</b><p style="color:var(--text-dim)">دوباره امتحان کن و رکورد خودت را بهتر کن.</p><button class="randomBtn" onclick="quizIndex=0;score=0;quiz()">شروع دوباره</button></div>`;
    return;
  }
  const q=QUIZZES[quizIndex];
  $("#quizBox").innerHTML=`<div class="kicker">سؤال ${quizIndex+1} از ${QUIZZES.length}</div><h3 class="quizQuestion">${q[0]}</h3><div class="quizOptions">${q[1].map((o,i)=>`<button onclick="answer(${i})">${o}</button>`).join("")}</div>`;
}
function answer(i){
  if(answered)return; answered=true;
  const q=QUIZZES[quizIndex];
  const btns=$$("#quizBox .quizOptions button");
  btns.forEach((b,idx)=>{if(idx===q[2])b.classList.add("correct");else if(idx===i)b.classList.add("wrong");b.disabled=true});
  if(i===q[2])score++;
  setTimeout(()=>{quizIndex++;quiz()},850);
}

/* ---------- theme ---------- */
$("#theme").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("motoTheme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("motoTheme")==="light")document.body.classList.add("light");

/* ---------- search / nav ---------- */
function jumpSearch(){const v=$("#globalSearch").value;$("#search").value=v;visibleCount=PAGE_SIZE;$("#catalog").scrollIntoView({behavior:"smooth"});render()}
$("#globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter")jumpSearch()});
$("#menu").onclick=()=>{
  const nav=$(".header nav");
  const open=nav.style.display==="flex";
  nav.style.display=open?"none":"flex";
  nav.style.position="absolute";nav.style.top="72px";nav.style.insetInlineStart="0";nav.style.right="0";nav.style.left="0";
  nav.style.padding="18px 5vw";nav.style.background="var(--bg2)";nav.style.borderBottom="1px solid var(--border)";nav.style.flexDirection="column";
};

/* ---------- lab ---------- */
function lab(){
  const hp=+$("#powerRange").value, cc=+$("#ccRange").value, kg=+$("#weightRange").value;
  $("#powerVal").textContent=hp;
  const angle=-60+(hp-40)/(220-40)*120;
  $("#needle").style.transform=`translateX(-50%) rotate(${angle}deg)`;
  let candidates=MOTOS.map(m=>({m,score:Math.abs(m.hp-hp)/2+Math.abs((m.cc||cc)-cc)/30+Math.abs(m.kg-kg)/12})).sort((a,b)=>a.score-b.score).slice(0,3);
  $("#labResult").innerHTML=`<strong>نزدیک‌ترین انتخاب‌ها:</strong> ${candidates.map(x=>`<span class="num">${x.m.name}</span>`).join(" • ")}<br><small>این ابزار برای سرگرمی و کشف مدل‌هاست.</small>`;
}
["powerRange","ccRange","weightRange"].forEach(id=>$("#"+id).addEventListener("input",lab));

function spinOracle(){
  const btn=document.querySelector(".spin"); btn.classList.add("spinning");
  setTimeout(()=>{const m=MOTOS[Math.floor(Math.random()*MOTOS.length)];btn.classList.remove("spinning");$("#oracleText").innerHTML=`امروز انتخابت: <strong style="color:var(--text)">${m.name}</strong> — ${m.brand}، ${m.type}، ${m.cc||"برقی"}${m.cc?"cc":""}. <button class="randomBtn" onclick="details(${m.id})">ببینش</button>`;unlock("lucky");},900);
}

/* ---------- leaderboard ---------- */
function renderLeaderboard(){
  const top=(arr,n)=>arr.slice(0,n);
  const byPower=top([...MOTOS].sort((a,b)=>b.hp-a.hp),5);
  const byLight=top([...MOTOS].sort((a,b)=>a.kg-b.kg),5);
  const byValue=top([...MOTOS].sort((a,b)=>(a.price/a.hp)-(b.price/b.hp)),5);
  const row=(m,val)=>`<div class="podiumRow"><span class="podiumRank num">#</span><div class="podiumName"><b>${m.name}</b><small>${m.brand}</small></div><span class="podiumVal num">${val}</span></div>`;
  const buildRows=(list,fn)=>list.map((m,i)=>row(m,fn(m)).replace(">#<",">"+(i+1)+"<")).join("");
  $("#podiumPower").innerHTML=buildRows(byPower,m=>m.hp+" hp");
  $("#podiumLight").innerHTML=buildRows(byLight,m=>m.kg+" kg");
  $("#podiumValue").innerHTML=buildRows(byValue,m=>fmtPrice(m.price));
}

/* ---------- achievements ---------- */
const achievementDefs=[
 ["explorer","🧭","کاوشگر","۵ موتور را باز کن"],
 ["collector","⭐","کلکسیونر","۳ موتور را در گاراژ ذخیره کن"],
 ["compare","⚖️","مقایسه‌گر","۲ موتور را مقایسه کن"],
 ["reader","🧠","دانشمند","بخش دانستنی‌ها را ببین"],
 ["lucky","🎰","خوش‌شانس","گردونه را بچرخان"],
 ["brandScout","🏷️","برندشناس","۴ برند مختلف را ببین"],
 ["quizMaster","🏆","استاد کوییز","کوییز را کامل و بدون اشتباه تمام کن"]
];
let unlocked=JSON.parse(localStorage.getItem("motoAchievements")||"[]");
function unlock(id){
  if(!unlocked.includes(id)){
    unlocked.push(id);localStorage.setItem("motoAchievements",JSON.stringify(unlocked));
    renderAchievements();
    const def=achievementDefs.find(a=>a[0]===id);
    if(def)toast(`مدال جدید: ${def[1]} ${def[2]}`);
  }
}
function renderAchievements(){
  $("#achievements").innerHTML=achievementDefs.map(a=>`<div class="achievement ${unlocked.includes(a[0])?"unlocked":""}"><div class="medal">${a[1]}</div><h4>${a[2]}</h4><p>${a[3]}</p></div>`).join("");
  const pct=Math.round(unlocked.length/achievementDefs.length*100);
  $("#achieveProgress").style.width=pct+"%";
  $("#achieveCount").textContent=`${unlocked.length} از ${achievementDefs.length} مدال باز شده`;
}

let detailsCount=JSON.parse(localStorage.getItem("motoDetailsCount")||"0");
const oldDetails=details;
window.details=function(id){
  detailsCount++;localStorage.setItem("motoDetailsCount",JSON.stringify(detailsCount));
  if(detailsCount>=5)unlock("explorer");
  oldDetails(id);
};
const oldToggleCompare=toggleCompare;
window.toggleCompare=function(id){oldToggleCompare(id);if(compared.length>=2)unlock("compare")};

/* ---------- newsletter ---------- */
function subscribe(e){
  e.preventDefault();
  const input=$("#newsletterEmail");
  if(input.value.trim().includes("@")){toast("عضویت با موفقیت ثبت شد ✓");input.value="";}
  else toast("یک ایمیل معتبر وارد کن");
  return false;
}

/* ---------- scroll progress + back to top ---------- */
window.addEventListener("scroll",()=>{
  const h=document.documentElement;
  const pct=(h.scrollTop)/(h.scrollHeight-h.clientHeight)*100;
  $("#scrollbar").style.width=pct+"%";
  $("#toTop").classList.toggle("show",h.scrollTop>700);
});
$("#toTop").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});

/* ---------- init ---------- */
render();renderCompare();renderGarage();renderFacts();quiz();lab();renderLeaderboard();renderAchievements();
