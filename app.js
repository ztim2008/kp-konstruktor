const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const r2=x=>Math.round(x*100)/100,rub=x=>r2(x).toLocaleString("ru-RU")+" ₽",fd=d=>d?d.split("-").reverse().join("."):"";
const iso=d=>d.toISOString().slice(0,10),plus=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const PI=()=>PLATS.findIndex(p=>p[0]==S.plat);

/* ===== slide content with local edits ===== */
const DEF=JSON.parse(JSON.stringify(C));let EDITS={};try{EDITS=JSON.parse(localStorage.getItem("kv_slide_edits")||"{}")}catch(e){}
const getP=(o,p)=>p.split(".").reduce((a,k)=>a==null?a:a[k],o);
function setP(o,p,v){const k=p.split(".");let a=o;for(let i=0;i<k.length-1;i++)a=a[k[i]];a[k[k.length-1]]=v}
function applyEdits(){const fresh=JSON.parse(JSON.stringify(DEF));Object.keys(C).forEach(k=>C[k]=fresh[k]);for(const p in EDITS){try{if(getP(C,p)!=null)setP(C,p,EDITS[p])}catch(e){}}}
applyEdits();

/* ===== state ===== */
const BLK=[["team","О команде",1],["why","Почему мы",1],["case1","Кейс: Фабричные бани",1],["case2","Кейс: Спортивный клуб",1],["list","Более 140 проектов",0]];
const DEFAULT=()=>({client:"",proj:"",task:"",rate:RATE,tax:TAX,plat:"tilda",type:"landing",pages:5,sel:{},hov:{},custom:[],needs:"",wish:[],
 kp:{date:iso(new Date()),valid:plus(14),pay:"50",stages:"",hpd:6,days:"",b:Object.fromEntries(BLK.map(b=>[b[0],!!b[2]]))}});
let S=DEFAULT();try{const sv=JSON.parse(localStorage.getItem("kv_state")||"null");if(sv)S=Object.assign(DEFAULT(),sv)}catch(e){}
function preset(p){S.plat=p.plat;S.type=p.type;S.sel={};S.hov={};p.on.forEach(id=>S.sel[id]=true)}
if(!Object.keys(S.sel).length&&!S.custom.length)preset(PRESETS[0]);
let VIEW=null,step=1,doc="kp",banner="";
const H=location.hash;
try{if(H.startsWith("#kp=")||H.startsWith("#tz=")){VIEW=H.slice(1,3);S=Object.assign(DEFAULT(),decState(H.slice(4)));}
else if(H.startsWith("#calc=")){const c=decState(H.slice(6));S.sel={};S.hov={};S.rate=c.rate;S.tax=c.tax;S.proj=c.proj||S.proj;S.client=c.client||S.client;
 S.custom=c.items.filter(i=>i.on).map(i=>({n:i.n,h:+i.h,on:true}));step=3;banner="Загружен расчёт из калькулятора смет: пункты добавлены в «Дополнительно». Можно дополнить бриф галочками.";history.replaceState(null,"",location.pathname)}}catch(e){console.warn(e)}
const save=()=>{if(!VIEW)localStorage.setItem("kv_state",JSON.stringify(S))};

/* ===== calculation ===== */
function itemName(it){return Array.isArray(it.n)?it.n[PI()]:it.n}
function defH(it){return Array.isArray(it.h)?it.h[PI()]:it.h}
function autoItems(){const a=[],p=PI(),des=ITEMS.some(i=>i.g=="design"&&S.sel[i.id]),N=Math.max(0,+S.pages||0);
 if(S.type=="multi"&&N){if(des)a.push({id:"a_pd",g:"design",n:`Дизайн внутренних страниц (${N} шт.)`,h:N*3,d:`Дизайн ${N} внутренних страниц на основе главной.`,auto:1});
  a.push({id:"a_pb",g:"plat",n:`Вёрстка внутренних страниц (${N} шт.)`,h:N*[2,3,4][p],d:`Сборка ${N} внутренних страниц (перечень согласуется на этапе структуры).`,auto:1})}
 if(S.type=="shop"){if(des)a.push({id:"a_sd",g:"design",n:"Дизайн карточки товара и корзины",h:6,d:"Макеты каталога, карточки товара, корзины и оформления заказа.",auto:1});
  a.push({id:"a_sb",g:"plat",n:"Каталог товаров, корзина и оформление заказа",h:[10,16,30][p],d:"Каталог с категориями и фильтрами, карточка товара, корзина, оформление заказа, уведомления о заказах.",auto:1})}
 return a}
function lines(){const L=[];const all=ITEMS.concat(autoItems());
 all.forEach(it=>{if(!(it.auto||S.sel[it.id]))return;const h=S.hov[it.id]!=null?S.hov[it.id]:defH(it);L.push({id:it.id,g:it.g,n:itemName(it),h:it.client?0:+h||0,d:it.d,client:it.client})});
 S.custom.forEach(c=>{if(c.on&&c.n.trim())L.push({g:"custom",n:c.n,h:+c.h||0,d:"Дополнительная работа по согласованию с заказчиком."})});return L}
function totals(L=lines()){const Hh=L.reduce((a,l)=>a+l.h,0),Sm=Hh*S.rate,T=Sm*S.tax/100;return{H:Hh,S:Sm,T,I:Sm+T}}
const autoDays=c=>Math.max(1,Math.ceil(c.H/(+S.kp.hpd||6))),daysText=c=>(S.kp.days||"").trim()||autoDays(c)+" раб. дн.";
function sched(){const k=S.kp;if(k.pay=="100")return[["Предоплата 100%",100]];if(k.pay=="50")return[["Предоплата",50],["После сдачи работ",50]];
 if(k.pay=="30")return[["Предоплата",30],["После согласования дизайна / прототипа",40],["После сдачи работ",30]];
 return k.stages.split("\n").map(l=>l.split(";")).filter(a=>a[0].trim()).map(a=>[a[0].trim(),parseFloat((a[1]||"").replace(",","."))||0])}

/* ===== STEP 1: deck ===== */
const E=(p,tag="span",cls="")=>`<${tag} class="${cls}" data-e="${p}">${esc(getP(C,p))}</${tag}>`;
const sh=(kick,title,body,cls="")=>`<div class="sl ${cls}"><div class="skick">${kick}</div><h2>${title}</h2>${body}<div class="sfoot"><a href="http://leadweb.site" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">Lead-web · leadweb.site</a></div></div>`;
function slides(){const s=[];
 s.push(`<div class="sl scover"><div class="skick">${E("deck.kicker")}</div><h1>${E("deck.brand")}</h1><div class="stag">${E("deck.tagline")}</div><div class="sbar"></div></div>`);
 s.push(sh("Знакомство",E("team.title"),`<p class="slead">${E("team.lead")}</p><div class="sg2">${C.team.people.map((p,j)=>`<div class="sc"><div class="spn">${E(`team.people.${j}.n`)}</div><div class="spr">${E(`team.people.${j}.r`)}</div><div class="spy">${E(`team.people.${j}.y`)}</div><p>«${E(`team.people.${j}.q`)}»</p></div>`).join("")}</div>`));
 s.push(sh("Знакомо?",E("pains.title"),`<div class="sg2">${C.pains.items.map((p,j)=>`<div class="sc"><div class="snum">0${j+1}</div><h3>${E(`pains.items.${j}.0`)}</h3><p>${E(`pains.items.${j}.1`)}</p></div>`).join("")}</div><div class="sband">${E("pains.foot")}</div>`));
 s.push(sh("Что мы делаем",E("services.title"),`<div class="sg4">${C.services.items.map((p,j)=>`<div class="sc"><div class="snum">0${j+1}</div><h3>${E(`services.items.${j}.0`)}</h3><p>${E(`services.items.${j}.1`)}</p></div>`).join("")}</div>`));
 s.push(sh("Процесс",E("process.title"),`<div class="sproc">${C.process.items.map((p,j)=>`<div class="sp"><div class="snum">${j+1}</div><h3>${E(`process.items.${j}.0`)}</h3><p>${E(`process.items.${j}.1`)}</p><div class="sget">→ ${E(`process.items.${j}.2`)}</div></div>`).join("")}</div>`));
 ["case1","case2"].forEach((k,n)=>s.push(sh("Кейс "+(n+1),E(k+".title"),`<a class="surl" href="${C[k].url}" target="_blank">${C[k].url.replace(/^https?:\/\//,"").replace(/\/$/,"")}</a><div class="scase"><div class="sc"><h3>Было</h3><p>${E(k+".was")}</p></div><div class="sc"><h3>Сделали</h3><ul>${C[k].did.map((d,j)=>`<li>${E(`${k}.did.${j}`)}</li>`).join("")}</ul></div><div class="sc dark"><h3>Результат</h3><p>${E(k+".res")}</p></div></div>`)));
 s.push(sh("Кейсы",E("list.title"),`<div class="slist">${C.list.groups.map(([g,a],gi)=>`<div><h3>${esc(g)}</h3><ul>${a.map(([t,u],j)=>`<li>${E(`list.groups.${gi}.1.${j}.0`)} — <a href="${u}" target="_blank">${u.replace(/^https?:\/\//,"").replace(/\/$/,"")}</a></li>`).join("")}</ul></div>`).join("")}</div>`,"slong"));
 s.push(sh("Чем мы отличаемся",E("why.title"),`<p class="slead">${E("team.lead")}</p><div class="sg3">${C.why.items.map((p,j)=>`<div class="sc"><div class="snum">0${j+1}</div><h3>${E(`why.items.${j}.0`)}</h3><p>${E(`why.items.${j}.1`)}</p></div>`).join("")}</div>`));
 s.push(`<div class="sl scont"><div class="skick">Контакты</div><h2>${E("contacts.title")}</h2><p class="slead">${E("contacts.lead")}</p><div class="scl"><a href="${C.contacts.tgUrl}" target="_blank"><small>Telegram</small>${esc(C.contacts.tg)}</a><a href="${C.contacts.tel}"><small>Телефон</small>${esc(C.contacts.phone)}</a><a href="mailto:${C.contacts.mail}"><small>Почта</small>${esc(C.contacts.mail)}</a><a href="http://leadweb.site" target="_blank"><small>Сайт</small>leadweb.site</a></div></div>`);
 return s}
let cur=0,editing=false,NS=0;
function renderDeck(){const s=slides();NS=s.length;$("deck").innerHTML=s.map((h,j)=>h.replace('class="sl','data-i="'+j+'" class="sl')).join("");$("dots").innerHTML=s.map((_,j)=>`<button data-j="${j}"></button>`).join("");setEdit(editing);go(cur)}
function go(i){cur=Math.max(0,Math.min(NS-1,i));[...$("deck").children].forEach((e,j)=>e.classList.toggle("on",j==cur));[...$("dots").children].forEach((e,j)=>e.classList.toggle("on",j==cur));$("cnt").textContent=$("fscnt").textContent=(cur+1)+" / "+NS}
function setEdit(v){editing=v;$("deck").querySelectorAll("[data-e]").forEach(e=>e.contentEditable=v?"true":"false");$("deck").classList.toggle("editing",v);$("edit").textContent=v?"Готово":"Редактировать";$("edit").classList.toggle("on",v)}
function initDeck(){renderDeck();
 $("prev").onclick=()=>go(cur-1);$("next").onclick=()=>go(cur+1);$("dots").onclick=e=>{if(e.target.dataset.j!=null)go(+e.target.dataset.j)};
 $("edit").onclick=()=>setEdit(!editing);
 $("reset").onclick=()=>{if(!confirm("Сбросить все правки текстов слайдов?"))return;EDITS={};localStorage.removeItem("kv_slide_edits");applyEdits();renderDeck();render()};
 $("deck").addEventListener("input",e=>{const p=e.target.closest("[data-e]");if(!p)return;const v=p.textContent;EDITS[p.dataset.e]=v;setP(C,p.dataset.e,v);localStorage.setItem("kv_slide_edits",JSON.stringify(EDITS))});
 $("fs").onclick=()=>{const st=$("stage");document.fullscreenElement?document.exitFullscreen():(st.requestFullscreen||st.webkitRequestFullscreen).call(st)};
 document.addEventListener("keydown",e=>{if(step!=1||$("cwrap").style.display=="none"||editing&&e.target.isContentEditable)return;if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName))return;
  if(["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();go(cur+1)}else if(["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();go(cur-1)}else if(e.key=="Home")go(0);else if(e.key=="End")go(NS-1);else if(e.key=="f")$("fs").click()});
 let tx=null,ty=null;$("stage").addEventListener("touchstart",e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
 $("stage").addEventListener("touchend",e=>{if(tx==null||editing)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))go(cur+(dx<0?1:-1));tx=null},{passive:true})}

/* ===== STEP 2: brief ===== */
function renderBrief(){const p=PI();let h="";
 GROUPS.forEach(([g,gn])=>{h+=`<div class="card0 grp" data-g="${g}"><h3>${gn}<span class="gsum" id="gs_${g}"></span></h3>`;
  if(g=="plat"){h+=`<div class="radios"><small>Платформа</small>${PLATS.map(([k,n])=>`<label class="rad ${S.plat==k?"on":""}"><input type="radio" name="plat" value="${k}" ${S.plat==k?"checked":""}>${n}</label>`).join("")}</div>
   <div class="radios"><small>Тип сайта</small>${TYPES.map(([k,n])=>`<label class="rad ${S.type==k?"on":""}"><input type="radio" name="type" value="${k}" ${S.type==k?"checked":""}>${n}</label>`).join("")}
   ${S.type=="multi"?`<label class="pages">Внутренних страниц (кроме главной)<input id="pages" type="number" min="0" value="${S.pages}"></label>`:""}</div>`}
  const its=ITEMS.filter(i=>i.g==g).concat(autoItems().filter(i=>i.g==g));
  if(its.length||g=="custom")h+=`<div class="items">`+its.map(it=>{const on=it.auto||S.sel[it.id],hv=S.hov[it.id]!=null?S.hov[it.id]:defH(it);
   return `<div class="it ${on?"":"off"}"><label class="ck"><input type="checkbox" data-id="${it.id}" ${on?"checked":""} ${it.auto?"disabled":""}><span>${esc(itemName(it))}${it.client?' <em class="cp">оплачивает клиент</em>':""}${it.auto?' <em class="cp">авто</em>':""}</span></label>
   ${it.client?'<span class="hz">0 ч</span>':`<span class="hin"><input type="number" min="0" step="0.5" value="${hv}" data-h="${it.id}"> ч</span>`}</div>`}).join("")+
   (g=="custom"?S.custom.map((c,j)=>`<div class="it ${c.on?"":"off"}"><label class="ck"><input type="checkbox" data-c="${j}" ${c.on?"checked":""}><input class="cn" type="text" value="${esc(c.n)}" data-cn="${j}" placeholder="Название работы"></label><span class="hin"><input type="number" min="0" step="0.5" value="${c.h}" data-ch="${j}"> ч</span><button class="x" data-cx="${j}" title="Удалить">×</button></div>`).join("")+`<button id="addC" class="ghost">+ Добавить строку</button>`:"")+`</div>`;
  if(g=="blocks"&&S.type!="landing")h+=`<p class="note">Блоки — для главной страницы.</p>`;
  h+=`</div>`});
 $("groups").innerHTML=h;updPrice()}
function updPrice(){const L=lines(),c=totals(L);$("pH").textContent=r2(c.H);$("pS").textContent=rub(c.S);$("pTl").textContent="Налог "+S.tax+"%";$("pT").textContent=rub(c.T);$("pI").textContent=$("mI").textContent=rub(c.I);$("mH").textContent=r2(c.H)+" ч";
 $("pNote").textContent=NOTE;const sub={};L.forEach(l=>sub[l.g]=(sub[l.g]||0)+l.h);
 $("psub").innerHTML=GROUPS.filter(g=>sub[g[0]]).map(([g,n])=>`<div class="prow sm"><span>${n}</span><span>${r2(sub[g])} ч</span></div>`).join("");
 GROUPS.forEach(([g])=>{const e=$("gs_"+g);if(e)e.textContent=sub[g]?r2(sub[g])+" ч · "+rub(sub[g]*S.rate):""});save()}
function initBrief(){$("presets").innerHTML=PRESETS.map((p,j)=>`<button data-p="${j}">${p.n}</button>`).join("")+`<button data-p="x" class="ghost">Очистить</button>`;
 $("presets").onclick=e=>{const j=e.target.dataset.p;if(j==null)return;if(j=="x"){S.sel={};S.hov={};S.custom=[]}else preset(PRESETS[j]);renderBrief()};
 ["client","proj","task"].forEach(k=>{$(k).value=S[k];$(k).oninput=()=>{S[k]=$(k).value;save()}});
 ["rate","tax"].forEach(k=>{$(k).value=S[k];$(k).oninput=()=>{S[k]=+$(k).value||0;updPrice();renderBriefSums()}});
 const G=$("groups");
 G.addEventListener("change",e=>{const t=e.target,d=t.dataset;
  if(t.name=="plat"){S.plat=t.value;ITEMS.forEach(i=>{if(Array.isArray(i.h))delete S.hov[i.id]});["a_pb","a_sb"].forEach(k=>delete S.hov[k]);renderBrief();return}
  if(t.name=="type"){S.type=t.value;renderBrief();return}
  if(d.id){S.sel[d.id]=t.checked;renderBrief();return}
  if(d.c!=null){S.custom[d.c].on=t.checked;t.closest(".it").classList.toggle("off",!t.checked);updPrice()}});
 G.addEventListener("input",e=>{const t=e.target,d=t.dataset;
  if(d.h){S.hov[d.h]=+t.value||0;updPrice()}else if(d.ch!=null){S.custom[d.ch].h=+t.value||0;updPrice()}else if(d.cn!=null){S.custom[d.cn].n=t.value;updPrice()}
  else if(t.id=="pages"){S.pages=+t.value||0;delete S.hov.a_pd;delete S.hov.a_pb;clearTimeout(window._pt);window._pt=setTimeout(()=>{renderBrief();const p=$("pages");p.focus();p.setSelectionRange&&0},600)}});
 G.addEventListener("click",e=>{const t=e.target;if(t.id=="addC"){S.custom.push({n:"",h:1,on:true});renderBrief();const ins=G.querySelectorAll(".cn");ins[ins.length-1].focus()}else if(t.dataset.cx!=null){S.custom.splice(+t.dataset.cx,1);renderBrief()}});
 $("toDocs").onclick=$("toDocs2").onclick=()=>setStep(4);renderBrief()}
function renderBriefSums(){}

/* ===== STEP 3: documents ===== */
const PF=`<div class="pfoot">Lead-web · leadweb.site · Сайты, которые приводят заявки</div>`;
const sec=(num,kick,title,body,cls="")=>`<section class="pg ${cls}"><div class="kick"><span>${num}</span>${kick}</div><h2>${title}</h2>${body}${PF}</section>`;
const grpL=L=>GROUPS.map(([g,n])=>[n,L.filter(l=>l.g==g)]).filter(x=>x[1].length);
const platN=()=>PLATS[PI()][1],typeN=()=>TYPES.find(t=>t[0]==S.type)[1]+(S.type=="multi"?` (главная + ${S.pages} внутр. стр.)`:"");
function cover(kind,c){return `<section class="pg cover"><div class="ctop"><div class="brand"><a href="http://leadweb.site" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">Lead-web</a></div></div><div class="cmid"><div class="kick"><span>${kind=="kp"?"КП":"ТЗ"}</span>${kind=="kp"?"Коммерческое предложение":"Техническое задание"}</div>
 <h1>${esc(S.proj||"Разработка сайта")}</h1>${S.client?`<div class="for">для <b>${esc(S.client)}</b></div>`:""}${S.task.trim()?`<div class="task"><small>Задача</small><p>${esc(S.task).replace(/\n/g,"<br>")}</p></div>`:""}</div>
 <div class="cbot"><div><small>Дата</small>${fd(S.kp.date)}</div>${kind=="kp"&&S.kp.valid?`<div><small>Предложение действительно до</small>${fd(S.kp.valid)}</div><div><small>Стоимость</small><b class="acc">${rub(c.I)}</b></div>`:`<div><small>Платформа</small>${platN()}</div><div><small>Тип сайта</small>${typeN()}</div>`}</div></section>`}
function renderKP(){const L=lines(),c=totals(L),b=S.kp.b,o=[];let n=0;const N=()=>String(++n).padStart(2,"0");
 o.push(cover("kp",c));
 {const w=wishL();if(S.needs.trim()||w.length)o.push(sec(N(),"Ваша задача","Что вы хотите получить",(S.needs.trim()?`<p class="lead">${esc(S.needs.trim().length>600?S.needs.trim().slice(0,600)+"…":S.needs.trim()).replace(/\n/g,"<br>")}</p>`:"")+(w.length?`<ul>${w.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"")))}
 o.push(sec(N(),"Что сделаем","Состав работ",`<div class="tags"><span>${platN()}</span><span>${typeN()}</span></div><div class="scope">${grpL(L).map(([g,a])=>`<div class="card"><h3>${g}</h3><ul>${a.map(l=>`<li>${esc(l.n)}${l.client?" <em>— оплачивает клиент</em>":""}</li>`).join("")}</ul></div>`).join("")}</div>`));
 o.push(sec(N(),"Расчёт","Стоимость работ",`<table class="t calc"><thead><tr><th>Работа</th><th class="r">Часы</th><th class="r">Стоимость</th></tr></thead><tbody>${grpL(L).map(([g,a])=>`<tr class="gh"><td colspan="3">${g}</td></tr>`+a.map(l=>`<tr><td>${esc(l.n)}${l.client?" <em>(оплачивает клиент)</em>":""}</td><td class="r">${l.client?"—":r2(l.h)}</td><td class="r">${l.client?"—":rub(l.h*S.rate)}</td></tr>`).join("")).join("")}</tbody></table>
  <div class="tots"><div><span>Ставка за час</span><b>${rub(S.rate)}</b></div><div><span>Часов всего</span><b>${r2(c.H)}</b></div><div><span>Предварительная стоимость</span><b>${rub(c.S)}</b></div><div><span>Налог ${S.tax}%</span><b>${rub(c.T)}</b></div><div class="big"><span>Итого</span><b>${rub(c.I)}</b></div></div><p class="note">${NOTE}</p>`,"flow"));
 const sc=sched(),sp=sc.reduce((a,x)=>a+x[1],0);
 o.push(sec(N(),"Условия","Оплата и сроки",`<table class="t"><thead><tr><th>Платёж</th><th class="r">Доля</th><th class="r">Сумма</th></tr></thead><tbody>${sc.map(([t,p])=>`<tr><td>${esc(t)}</td><td class="r">${p}%</td><td class="r">${rub(c.I*p/100)}</td></tr>`).join("")}</tbody></table>${Math.abs(sp-100)>.01?`<p class="warn">Сумма долей: ${sp}% (должно быть 100%)</p>`:""}
  <div class="tots"><div class="big"><span>Ориентировочный срок</span><b>${esc(daysText(c))}</b></div>${S.kp.valid?`<div><span>Предложение действительно до</span><b>${fd(S.kp.valid)}</b></div>`:""}</div>`));
 if(b.team)o.push(sec(N(),"Знакомство",esc(C.team.title),`<p class="lead">${esc(C.team.lead)}</p><div class="g2">${C.team.people.map(p=>`<div class="card"><div class="pn">${esc(p.n)}</div><div class="pr">${esc(p.r)}</div><div class="py">${esc(p.y)}</div><p>«${esc(p.q)}»</p></div>`).join("")}</div>`));
 if(b.why)o.push(sec(N(),"Чем мы отличаемся",esc(C.why.title),`<div class="g3">${C.why.items.map((s,j)=>`<div class="card"><div class="num">0${j+1}</div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join("")}</div>`));
 ["case1","case2"].forEach((k,i)=>{if(!b[k])return;const x=C[k];o.push(sec(N(),"Кейс "+(i+1),esc(x.title),`<a class="url" href="${x.url}" target="_blank">${x.url.replace(/^https?:\/\//,"").replace(/\/$/,"")}</a><div class="case"><div class="card"><h3>Было</h3><p>${esc(x.was)}</p></div><div class="card"><h3>Сделали</h3><ul>${x.did.map(d=>`<li>${esc(d)}</li>`).join("")}</ul></div><div class="card dark"><h3>Результат</h3><p>${esc(x.res)}</p></div></div>`))});
 if(b.list)o.push(sec(N(),"Кейсы",esc(C.list.title),C.list.groups.map(([g,a])=>`<h3>${esc(g)}</h3><ul class="pl">${a.map(([t,u])=>`<li>${esc(t)} — <a href="${u}" target="_blank">${u.replace(/^https?:\/\//,"").replace(/\/$/,"")}</a></li>`).join("")}</ul>`).join(""),"flow"));
 o.push(`<section class="pg contacts"><div class="kick"><span>${N()}</span>Контакты</div><h2>${esc(C.contacts.title)}</h2><p class="lead">${esc(C.contacts.lead)}</p><div class="cl"><a href="${C.contacts.tgUrl}" target="_blank"><small>Telegram</small>${esc(C.contacts.tg)}</a><a href="${C.contacts.tel}"><small>Телефон</small>${esc(C.contacts.phone)}</a><a href="mailto:${C.contacts.mail}"><small>Почта</small>${esc(C.contacts.mail)}</a><a href="http://leadweb.site" target="_blank"><small>Сайт</small>leadweb.site</a></div><a class="ctab" href="${C.contacts.tgUrl}" target="_blank">Обсудить в Telegram →</a>${PF}</section>`);
 $("doc-kp").innerHTML=o.join("")}
const PLAT_D={tilda:"Сайт собирается на конструкторе Тильда (стандартные блоки и Zero Block). Заказчик оплачивает тариф Тильды и получает доступ к редактированию.",cms:"Сайт с системой управления (CMS): заказчик самостоятельно меняет тексты, фото, цены и добавляет материалы через админ-панель.",code:"Сайт разрабатывается на собственном коде (фронтенд и бэкенд) с админ-панелью; размещается на хостинге/сервере заказчика."};
const TYPE_D={landing:"Одностраничный сайт (лендинг): все блоки на одной странице, навигация по якорям.",multi:"Многостраничный сайт: главная страница и внутренние страницы с общим меню и футером.",shop:"Интернет-магазин: каталог товаров, карточки, корзина и оформление заказа."};
function tzData(){const L=lines(),has=id=>L.some(l=>l.id==id),T=[];
 T.push(["Общие сведения",[["Проект",S.proj||"—"],["Заказчик",S.client||"—"],["Исполнитель","Команда «Lead-web» (leadweb.site)"],["Дата",fd(S.kp.date)]],"kv"]);
 T.push(["Цели и задачи",[S.task.trim()||"Задача уточняется с заказчиком.","Сайт должен понятно представлять компанию и продукт, вызывать доверие и приводить заявки."],"p"]);
 T.push(["Платформа и тип сайта",[["Платформа",platN()+". "+PLAT_D[S.plat]],["Тип сайта",typeN()+". "+TYPE_D[S.type]]],"kv"]);
 const bl=L.filter(l=>l.g=="blocks");const st=[];if(bl.length)st.push([S.type=="landing"?"Главная страница (лендинг) — блоки по порядку":"Главная страница — блоки по порядку",bl.map(l=>[l.n,l.d])]);
 L.filter(l=>l.id=="a_pb"||l.id=="a_sb").forEach(l=>st.push([l.n,[["Состав",l.d]]]));
 if(st.length)T.push(["Структура сайта",st,"struct"]);
 const sect=(t,g,extra=[])=>{const a=L.filter(l=>g.includes(l.g)&&!l.auto&&l.id!="domain"&&l.id!="hosting").map(l=>[l.n,l.d]).concat(extra).filter((x,i,arr)=>arr.findIndex(y=>y[0]==x[0])==i);if(a.length)T.push([t,a,"kv"])};
 {const w=wishL();if(S.needs.trim()||w.length){const a=[];if(S.needs.trim())a.push(["Что нужно клиенту",S.needs.trim()]);w.forEach((x,j)=>a.push(["Пожелание "+(j+1),x]));T.push(["Пожелания клиента",a,"kv"])}}
 sect("Подготовка",["prep"]);sect("Дизайн",["design"],L.filter(l=>l.id=="a_pd"||l.id=="a_sd").map(l=>[l.n,l.d]));
 sect("Вёрстка и технические требования",["plat"],[["Общие требования","Валидная вёрстка, HTTPS, корректная работа форм, быстрая загрузка, отображение в актуальных версиях браузеров."]]);
 sect("Функции и интеграции",["func"]);sect("SEO, аналитика и юридические требования",["launch"]);sect("Дополнительные работы",["custom"]);
 const give=["Тексты о компании, услугах/товарах и контакты (или согласование текстов исполнителя)","Фото, видео, логотип и фирменный стиль (при наличии)","Примеры сайтов, которые нравятся и не нравятся","Домен и хостинг: покупка и оплата на имя заказчика, доступы к регистратору и хостингу"];
 if(S.plat=="tilda")give.push("Аккаунт и оплаченный тариф Тильды (или доступ к нему)");if(has("f_pay"))give.push("ИП/ООО/самозанятость и подключённая ЮKassa, доступы к кабинету");
 if(has("f_crm"))give.push("Доступ к CRM для настройки интеграции");if(has("f_tg"))give.push("Telegram-аккаунт/чат для уведомлений");if(has("metrika")||has("direct"))give.push("Доступ к Яндекс ID для Метрики, Вебмастера"+(has("direct")?" и Директа; рекламный бюджет":""));
 if(has("f_lang"))give.push("Переводы текстов на дополнительные языки");if(has("b_rev"))give.push("Отзывы клиентов");if(has("b_cat")||S.type=="shop")give.push("Список товаров/услуг с описаниями, ценами и фото");
 T.push(["Что предоставляет заказчик",give,"ul"]);
 const stg=[];if(L.some(l=>l.g=="prep"))stg.push("Подготовка: бриф, исследование, структура");if(L.some(l=>l.g=="design"))stg.push("Дизайн: прототип и макеты, согласование с заказчиком");
 stg.push("Разработка: вёрстка, блоки и функции на выбранной платформе");if(has("content"))stg.push("Наполнение контентом");stg.push("Тестирование и запуск: проверка, публикация, подключение домена");
 if(has("seo")||has("metrika")||has("direct"))stg.push("SEO, аналитика"+(has("direct")?" и запуск рекламы":""));T.push(["Этапы работ",stg,"ol"]);
 T.push(["Критерии приёмки",["Все блоки и страницы из ТЗ реализованы и соответствуют согласованным макетам/структуре","Сайт корректно отображается на телефоне, планшете и десктопе","Формы отправляют заявки, уведомления приходят по указанным каналам","Сайт опубликован на домене заказчика и открывается по HTTPS"].concat(has("metrika")?["Метрика собирает данные, цели на заявки срабатывают"]:[],has("cookie")?["Есть баннер cookie, политика конфиденциальности и согласия в формах"]:[],has("f_pay")?["Тестовая оплата проходит успешно"]:[],["Заказчику переданы доступы к сайту и инструкции"]),"ul"]);
 T.push(["Не входит в работы",[NOTE.replace("В стоимость не входит: ","")+" Оплачиваются заказчиком отдельно."],"p"]);return T}
function renderTZ(){const T=tzData(),c=totals(),o=[cover("tz",c)];let body="";
 T.forEach(([t,a,k],i)=>{let h=`<div class="tzs"><h3><b>${i+1}.</b> ${t}</h3>`;
  if(k=="kv")h+=`<table class="t kv"><tbody>${a.map(([x,y])=>`<tr><td>${esc(x)}</td><td>${esc(y)}</td></tr>`).join("")}</tbody></table>`;
  else if(k=="struct")h+=a.map(([n,r])=>`<h4>${esc(n)}</h4><table class="t kv"><tbody>${r.map(([x,y],j)=>`<tr><td>${j+1}. ${esc(x)}</td><td>${esc(y)}</td></tr>`).join("")}</tbody></table>`).join("");
  else if(k=="p")h+=a.map(x=>`<p>${esc(x).replace(/\n/g,"<br>")}</p>`).join("");else h+=`<${k}>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</${k}>`;
  body+=h+"</div>"});
 o.push(`<section class="pg flow tz"><div class="kick"><span>ТЗ</span>Техническое задание</div><h2>${esc(S.proj||"Разработка сайта")}</h2>${body}${PF}</section>`);
 o.push(`<section class="pg contacts"><div class="kick"><span>✓</span>Контакты</div><h2>${esc(C.contacts.title)}</h2><p class="lead">${esc(C.contacts.lead)}</p><div class="cl"><a href="${C.contacts.tgUrl}" target="_blank"><small>Telegram</small>${esc(C.contacts.tg)}</a><a href="${C.contacts.tel}"><small>Телефон</small>${esc(C.contacts.phone)}</a><a href="mailto:${C.contacts.mail}"><small>Почта</small>${esc(C.contacts.mail)}</a><a href="http://leadweb.site" target="_blank"><small>Сайт</small>leadweb.site</a></div>${PF}</section>`);
 $("doc-tz").innerHTML=o.join("")}
function txtKP(){const L=lines(),c=totals(L),D="-".repeat(64),pad=(a,n)=>a.length>=n?a:a+" ".repeat(n-a.length);
 let s=`КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ — Lead-web (http://leadweb.site)\n${D}\n`+(S.client?`Клиент: ${S.client}\n`:"")+`Проект: ${S.proj||"—"}\nДата: ${fd(S.kp.date)}\n`+(S.kp.valid?`Действительно до: ${fd(S.kp.valid)}\n`:"")+(S.task.trim()?`\nЗадача клиента:\n${S.task.trim()}\n`:"");
 {const w=wishL();if(S.needs.trim()||w.length){s+=`\nПожелания клиента:\n`+(S.needs.trim()?S.needs.trim()+"\n":"")+w.map(x=>"- "+x+"\n").join("")}}
 s+=`\nПлатформа: ${platN()}\nТип сайта: ${typeN()}\n\n${D}\nСТОИМОСТЬ РАБОТ (ставка ${rub(S.rate)} / час)\n${D}\n`;
 grpL(L).forEach(([g,a])=>{s+=`\n${g.toUpperCase()}\n`;a.forEach(l=>{const t="- "+l.n+(l.client?" (оплачивает клиент)":"");s+=(t.length>45?t+"\n"+" ".repeat(46):pad(t,46))+(l.client?"—":pad(String(r2(l.h)),7)+rub(l.h*S.rate))+"\n"})});
 s+=`\n${D}\nЧасов всего:               ${r2(c.H)}\nПредварительная стоимость: ${rub(c.S)}\nНалог ${S.tax}%:                  ${rub(c.T)}\nИТОГО:                     ${rub(c.I)}\n\n${NOTE}\n\n${D}\nГРАФИК ОПЛАТЫ\n`;
 sched().forEach(([t,p])=>s+=`- ${t}: ${p}% — ${rub(c.I*p/100)}\n`);s+=`Ориентировочный срок: ${daysText(c)}\n\n${D}\nКонтакты: Telegram ${C.contacts.tg} (${C.contacts.tgUrl}), ${C.contacts.phone}, ${C.contacts.mail}, http://leadweb.site\n`;return s}
function txtTZ(){const D="-".repeat(64);let s=`ТЕХНИЧЕСКОЕ ЗАДАНИЕ — Lead-web (http://leadweb.site)\n${D}\n`;
 tzData().forEach(([t,a,k],i)=>{s+=`\n${i+1}. ${t.toUpperCase()}\n`;if(k=="kv")a.forEach(([x,y])=>s+=`- ${x}: ${y}\n`);else if(k=="struct")a.forEach(([n,r])=>{s+=`${n}:\n`;r.forEach(([x,y],j)=>s+=`  ${j+1}. ${x} — ${y}\n`)});else if(k=="p")a.forEach(x=>s+=x+"\n");else a.forEach((x,j)=>s+=(k=="ol"?(j+1)+". ":"- ")+x+"\n")});
 return s+`\n${D}\nКонтакты: Telegram ${C.contacts.tg} (${C.contacts.tgUrl}), ${C.contacts.phone}, ${C.contacts.mail}, http://leadweb.site\n`}
function dl(name,s){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+s],{type:"text/plain;charset=utf-8"}));a.download=name;a.click()}
function initDocs(){const k=S.kp;["date","valid","stages","days"].forEach(x=>{$(x).value=k[x];$(x).oninput=()=>{k[x]=$(x).value;render()}});$("hpd").value=k.hpd;$("hpd").oninput=()=>{k.hpd=+$("hpd").value||6;render()};
 $("pay").value=k.pay;$("pay").onchange=()=>{k.pay=$("pay").value;if(k.pay=="st"&&!k.stages.trim()){k.stages="Предоплата; 30\nДизайн / прототип; 30\nРазработка; 30\nЗапуск; 10";$("stages").value=k.stages}render()};
 $("kpb").innerHTML=BLK.map(([x,n])=>`<label class="ck"><input type="checkbox" data-b="${x}" ${k.b[x]?"checked":""}><span>${n}</span></label>`).join("");$("kpb").onchange=e=>{k.b[e.target.dataset.b]=e.target.checked;render()};
 document.querySelector(".dtabs").onclick=e=>{const d=e.target.dataset.d;if(d){doc=d;render()}};
 $("pdf").onclick=()=>window.print();$("txt").onclick=()=>dl((doc=="kp"?"kp-":"tz-")+(k.date||"")+".txt",doc=="kp"?txtKP():txtTZ());
 $("share").onclick=()=>{const u=location.origin+location.pathname+"#"+doc+"="+encState(S);$("link").value=u;$("link").select();(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>$("msg").textContent="Ссылка на "+(doc=="kp"?"КП":"ТЗ")+" скопирована.",()=>$("msg").textContent="Скопируйте ссылку из поля.")}}
function render(){if(VIEW||step==4){renderKP();renderTZ()}
 document.body.dataset.doc=doc;document.querySelectorAll(".dtabs button").forEach(b=>b.classList.toggle("on",b.dataset.d==doc));
 if(!VIEW){$("stBox").style.display=S.kp.pay=="st"?"":"none";$("kpset").style.display=doc=="kp"?"":"none";$("tzset").style.display=doc=="tz"?"":"none";$("dHint").textContent="Авто: "+autoDays(totals())+" раб. дн. ("+r2(totals().H)+" ч ÷ "+(S.kp.hpd||6)+" ч/день)";save()}
 document.title=(doc=="kp"?"КП":"ТЗ")+(S.client?" — "+S.client:"")+" — Lead-web"}
function wishL(){return (S.wish||[]).map(x=>String(x).trim()).filter(Boolean)}
function renderW(){$("wl").innerHTML=S.wish.map((x,j)=>`<div class="it"><input type="text" value="${esc(x)}" data-w="${j}" placeholder="Например: онлайн-запись, каталог, отзывы…"><button class="x" data-wx="${j}" title="Удалить">×</button></div>`).join("")}
function initW(){if(!Array.isArray(S.wish))S.wish=[];$("needs").value=S.needs||"";$("needs").oninput=()=>{S.needs=$("needs").value;save()};
 $("wl").oninput=e=>{const j=e.target.dataset.w;if(j!=null){S.wish[j]=e.target.value;save()}};
 $("wl").onclick=e=>{const j=e.target.dataset.wx;if(j!=null){S.wish.splice(+j,1);renderW();save()}};
 $("addW").onclick=()=>{S.wish.push("");renderW();const i=$("wl").querySelectorAll("input");i[i.length-1].focus();save()};
 $("toBrief").onclick=()=>setStep(3);renderW()}
function initIntro(){const m=v=>{$("gwrap").style.display=v?"":"none";$("cwrap").style.display=v?"none":"";$("modeG").classList.toggle("on",v);$("modeC").classList.toggle("on",!v);localStorage.setItem("kv_deck",v?"g":"c");if(!v)go(cur)};
 $("modeG").onclick=()=>m(true);$("modeC").onclick=()=>m(false);m(localStorage.getItem("kv_deck")!="c")}
function setStep(n){step=n;document.body.dataset.step=n;document.querySelectorAll("#steps button").forEach(b=>b.classList.toggle("on",+b.dataset.s==n));if(n==3)renderBrief();if(n==2)renderW();render();window.scrollTo(0,0)}

if(VIEW){doc=VIEW;document.body.classList.add("client");document.body.dataset.step=4;render()}
else{$("calcLink").href=CALC_URL;$("steps").onclick=e=>{const b=e.target.closest("button");if(b)setStep(+b.dataset.s)};
 if(banner){$("banner").textContent=banner;$("banner").style.display="block"}
 initDeck();initIntro();initW();initBrief();initDocs();setStep(step)}
