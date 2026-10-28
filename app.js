const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const r2=x=>Math.round(x*100)/100,rub=x=>r2(x).toLocaleString("ru-RU")+" ₽",fd=d=>d?d.split("-").reverse().join("."):"";
const today=new Date().toISOString().slice(0,10),plus=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const vIdx=(g,v)=>P.findIndex(p=>p.g==g&&p.n.startsWith("Вариант "+(v+1)));
function itemsOf(g,v){return P[vIdx(g,v)].i.map(([n,h])=>({n,h,on:true}))}
let S={client:"",logo:"",task:"",date:today,valid:plus(14),b:Object.fromEntries(BLOCKS.map(b=>[b[0],!!b[2]])),pains:[1,1,1,1],g:2,v:0,rate:RATE,tax:TAX,proj:"",items:null,pay:"50",stages:"",hpd:6,days:""};
S.items=itemsOf(S.g,S.v);S.proj=P[vIdx(S.g,S.v)].p;
let client=false;
const h=location.hash;
try{if(h.startsWith("#kp=")){Object.assign(S,decState(h.slice(4)));client=true}
else if(h.startsWith("#calc=")){const c=decState(h.slice(6));Object.assign(S,{g:c.g,v:c.v,rate:c.rate,tax:c.tax,items:c.items,proj:c.proj||S.proj,client:c.client||""})}}catch(e){console.warn("bad hash",e)}

function calc(){let H=0,Sum=0;S.items.forEach(i=>{if(i.on){H+=+i.h||0;Sum+=(+i.h||0)*S.rate}});const T=Sum*S.tax/100;return{H,S:Sum,T,I:Sum+T}}
function autoDays(c){return Math.max(1,Math.ceil(c.H/(+S.hpd||6)))}
function daysText(c){return S.days.trim()||(autoDays(c)+" раб. дн.")}
function sched(c){const I=c.I;if(S.pay=="100")return[["Предоплата 100%",100]];if(S.pay=="50")return[["Предоплата",50],["После сдачи работ",50]];
 if(S.pay=="30")return[["Предоплата",30],["После согласования дизайна / прототипа",40],["После сдачи работ",30]];
 return S.stages.split("\n").map(l=>l.split(";")).filter(a=>a[0].trim()).map(a=>[a[0].trim(),parseFloat((a[1]||"").replace(",","."))||0])}

/* ---------- editor ---------- */
function buildEditor(){
 $("back").href=CALC_URL;
 $("blocks").innerHTML=BLOCKS.map(([k,n])=>`<label class="ck"><input type="checkbox" data-b="${k}" ${S.b[k]?"checked":""}> ${n}</label>`).join("");
 $("pains").innerHTML=C.pains.items.map((p,j)=>`<label class="ck"><input type="checkbox" data-p="${j}" ${S.pains[j]?"checked":""}> ${esc(p[0])}</label>`).join("");
 $("blocks").onchange=e=>{S.b[e.target.dataset.b]=e.target.checked;render()};
 $("pains").onchange=e=>{S.pains[e.target.dataset.p]=e.target.checked?1:0;render()};
 $("gsel").innerHTML=G.map((g,j)=>`<button type="button" data-g="${j}" style="--c:${g[1]}">${g[0]}</button>`).join("");
 $("vsel").innerHTML=["Вариант 1 — Оптимально","Вариант 2 — Максимально"].map((n,j)=>`<button type="button" data-v="${j}">${n}</button>`).join("");
 $("gsel").onclick=e=>{const g=e.target.dataset.g;if(g==null)return;S.g=+g;S.items=itemsOf(S.g,S.v);S.proj=P[vIdx(S.g,S.v)].p;syncInputs();render()};
 $("vsel").onclick=e=>{const v=e.target.dataset.v;if(v==null)return;S.v=+v;S.items=itemsOf(S.g,S.v);S.proj=P[vIdx(S.g,S.v)].p;syncInputs();render()};
 ["client","task","date","valid","proj","stages","days"].forEach(k=>$(k).oninput=()=>{S[k]=$(k).value;render()});
 ["rate","tax","hpd"].forEach(k=>$(k).oninput=()=>{S[k]=+$(k).value||0;render()});
 $("pay").onchange=()=>{S.pay=$("pay").value;if(S.pay=="st"&&!S.stages.trim()){S.stages="Предоплата; 30\nДизайн / прототип; 30\nРазработка; 30\nЗапуск; 10";}syncInputs();render()};
 $("logo").onchange=()=>{const f=$("logo").files[0];if(!f)return;const im=new Image();im.onload=()=>{const k=Math.min(1,240/im.width,120/im.height),cv=document.createElement("canvas");cv.width=im.width*k;cv.height=im.height*k;cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);S.logo=cv.toDataURL("image/png");render()};im.src=URL.createObjectURL(f)};
 $("logoX").onclick=()=>{S.logo="";$("logo").value="";render()};
 $("eitems").oninput=$("eitems").onchange=e=>{const j=e.target.dataset.j;if(j==null)return;if(e.target.type=="checkbox")S.items[j].on=e.target.checked;else S.items[j].h=+e.target.value||0;render(false)};
 $("pdf").onclick=()=>window.print();
 $("share").onclick=share;$("txt").onclick=txt;
 syncInputs();
}
function syncInputs(){["client","task","date","valid","proj","stages","days","rate","tax","hpd","pay"].forEach(k=>$(k).value=S[k]);
 $("stBox").style.display=S.pay=="st"?"":"none";
 [...$("gsel").children].forEach((b,j)=>b.classList.toggle("on",j==S.g));[...$("vsel").children].forEach((b,j)=>b.classList.toggle("on",j==S.v));
 $("eitems").innerHTML=S.items.map((i,j)=>`<tr><td><input type="checkbox" data-j="${j}" ${i.on?"checked":""}></td><td>${esc(i.n)}</td><td><input type="number" min="0" step="0.5" value="${i.h}" data-j="${j}"></td></tr>`).join("");}
function share(){let st={...S};let note="";if(st.logo&&st.logo.length>30000){st.logo="";note=" Логотип слишком большой для ссылки и в неё не вошёл."}
 const u=location.origin+location.pathname+"#kp="+encState(st);$("link").value=u;$("link").select();
 (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>$("msg").textContent="Ссылка скопирована."+note,()=>$("msg").textContent="Скопируйте ссылку из поля."+note)}

/* ---------- preview ---------- */
const sec=(k,num,kick,title,body,cls="")=>`<section class="pg ${cls}" data-k="${k}"><div class="kick"><span>${num}</span>${kick}</div><h2>${title}</h2>${body}<div class="pfoot">КОНВЕРСУС · Сайты, которые приводят заявки</div></section>`;
function render(){
 const c=calc(),out=[];let n=0;const N=()=>String(++n).padStart(2,"0");
 out.push(`<section class="pg cover"><div class="ctop"><div class="brand">КОНВЕРСУС</div>${S.logo?`<img class="clogo" src="${S.logo}" alt="">`:""}</div>
  <div class="cmid"><div class="kick"><span>КП</span>Коммерческое предложение</div><h1>${esc(S.proj||"Коммерческое предложение")}</h1>
  ${S.client?`<div class="for">для <b>${esc(S.client)}</b></div>`:""}
  ${S.task.trim()?`<div class="task"><small>Задача</small><p>${esc(S.task).replace(/\n/g,"<br>")}</p></div>`:""}</div>
  <div class="cbot"><div><small>Дата</small>${fd(S.date)}</div>${S.valid?`<div><small>Предложение действительно до</small>${fd(S.valid)}</div>`:""}${S.b.calc?`<div><small>Стоимость</small><b class="acc">${rub(c.I)}</b></div>`:""}</div></section>`);
 const b=S.b;
 if(b.team)out.push(sec("team",N(),"Знакомство",C.team.title,`<p class="lead">${C.team.lead}</p><div class="g2">${C.team.people.map(p=>`<div class="card"><div class="pn">${p.n}</div><div class="pr">${p.r}</div><div class="py">${p.y}</div><p>«${p.q}»</p></div>`).join("")}</div>`));
 if(b.pains){const it=C.pains.items.map((p,j)=>[p,j]).filter(x=>S.pains[x[1]]);if(it.length)out.push(sec("pains",N(),"Знакомо?",C.pains.title,`<div class="g2">${it.map(([p],j)=>`<div class="card"><div class="num">${String(j+1).padStart(2,"0")}</div><h3>${p[0]}</h3><p>${p[1]}</p></div>`).join("")}</div><div class="band">${C.pains.foot}</div>`))}
 if(b.services)out.push(sec("services",N(),"Что мы делаем",C.services.title,`<div class="g2">${C.services.items.map((s,j)=>`<div class="card"><div class="num">0${j+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join("")}</div>`));
 if(b.process)out.push(sec("process",N(),"Процесс",C.process.title,`<table class="t"><thead><tr><th>Шаг</th><th>Что делаем</th><th>Что получаете</th></tr></thead><tbody>${C.process.items.map((s,j)=>`<tr><td><b class="acc">${j+1}.</b> ${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td></tr>`).join("")}</tbody></table>`));
 [["case1","Кейс 1"],["case2","Кейс 2"]].forEach(([k,kk])=>{if(!b[k])return;const x=C[k];out.push(sec(k,N(),kk,x.title,`<a class="url" href="${x.url}" target="_blank">${x.url.replace(/^https?:\/\//,"").replace(/\/$/,"")}</a><div class="case"><div class="card"><h3>Было</h3><p>${x.was}</p></div><div class="card"><h3>Сделали</h3><ul>${x.did.map(d=>`<li>${d}</li>`).join("")}</ul></div><div class="card dark"><h3>Результат</h3><p>${x.res}</p></div></div>`))});
 if(b.list)out.push(sec("list",N(),"Кейсы",C.list.title,C.list.groups.map(([g,a])=>`<h3>${g}</h3><ul class="pl">${a.map(([t,u])=>`<li>${t} — <a href="${u}" target="_blank">${u.replace(/^https?:\/\//,"").replace(/\/$/,"")}</a></li>`).join("")}</ul>`).join(""),"long"));
 if(b.why)out.push(sec("why",N(),"Чем мы отличаемся",C.why.title,`<p class="lead">${C.team.lead}</p><div class="g3">${C.why.items.map((s,j)=>`<div class="card"><div class="num">0${j+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join("")}</div>`));
 if(b.calc)out.push(sec("calc",N(),G[S.g][0]+" · Вариант "+(S.v+1)+" — "+(S.v?"Максимально":"Оптимально"),"Расчёт стоимости",`<table class="t calc"><thead><tr><th>Состав работ</th><th class="r">Часы</th><th class="r">Стоимость</th></tr></thead><tbody>${S.items.filter(i=>i.on).map(i=>`<tr><td>${esc(i.n)}</td><td class="r">${i.h}</td><td class="r">${rub(i.h*S.rate)}</td></tr>`).join("")}</tbody></table>
  <div class="tots"><div><span>Ставка за час</span><b>${rub(S.rate)}</b></div><div><span>Часов всего</span><b>${r2(c.H)}</b></div><div><span>Предварительная стоимость</span><b>${rub(c.S)}</b></div><div><span>Налог ${S.tax}%</span><b>${rub(c.T)}</b></div><div class="big"><span>Итого</span><b>${rub(c.I)}</b></div></div><p class="note">${NOTE}</p>`));
 if(b.pay){const sc=sched(c),sp=sc.reduce((a,x)=>a+x[1],0);out.push(sec("pay",N(),"Условия","График оплаты и сроки",`<table class="t"><thead><tr><th>Платёж</th><th class="r">Доля</th><th class="r">Сумма</th></tr></thead><tbody>${sc.map(([t,p])=>`<tr><td>${esc(t)}</td><td class="r">${p}%</td><td class="r">${rub(c.I*p/100)}</td></tr>`).join("")}</tbody></table>${Math.abs(sp-100)>0.01?`<p class="warn">Сумма долей: ${sp}% (должно быть 100%)</p>`:""}
  <div class="tots"><div class="big"><span>Ориентировочный срок</span><b>${esc(daysText(c))}</b></div></div>`))}
 if(b.contacts)out.push(`<section class="pg contacts" data-k="contacts"><div class="kick"><span>${N()}</span>Контакты</div><h2>${C.contacts.title}</h2><p class="lead">${C.contacts.lead}</p>
  <div class="cl"><a href="${C.contacts.tgUrl}" target="_blank"><small>Telegram</small>${C.contacts.tg}</a><a href="${C.contacts.tel}"><small>Телефон</small>${C.contacts.phone}</a><a href="mailto:${C.contacts.mail}"><small>Почта</small>${C.contacts.mail}</a></div><div class="pfoot">КОНВЕРСУС · Сайты, которые приводят заявки</div></section>`);
 $("pv").innerHTML=out.join("");
 if(!client){$("daysHint").textContent="Авто: "+autoDays(c)+" раб. дн. ("+r2(c.H)+" ч ÷ "+(S.hpd||6)+" ч/день)";}
 document.title="КП"+(S.client?" — "+S.client:"")+" — Конверсус";
}
function txt(){const c=calc(),L="-".repeat(64),pad=(a,n)=>a.length>=n?a:a+" ".repeat(n-a.length);let s=`КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ — КОНВЕРСУС\n${L}\n`;
 if(S.client)s+=`Клиент:   ${S.client}\n`;s+=`Проект:   ${S.proj}\nДата:     ${fd(S.date)}\n`;if(S.valid)s+=`Действительно до: ${fd(S.valid)}\n`;
 if(S.task.trim())s+=`\nЗадача клиента:\n${S.task.trim()}\n`;
 if(S.b.calc){s+=`\n${L}\nРАСЧЁТ: ${G[S.g][0]} — Вариант ${S.v+1} — ${S.v?"Максимально":"Оптимально"}\nСтавка: ${rub(S.rate)} / час\n${L}\n`;
  S.items.filter(i=>i.on).forEach((i,k)=>{const t=(k+1)+". "+i.n;s+=(t.length>37?t+"\n"+" ".repeat(38):pad(t,38))+pad(String(i.h),8)+rub(i.h*S.rate)+"\n"});
  s+=`${L}\nЧасов всего:               ${r2(c.H)}\nПредварительная стоимость: ${rub(c.S)}\nНалог ${S.tax}%:                  ${rub(c.T)}\nИТОГО:                     ${rub(c.I)}\n\n${NOTE}\n`}
 if(S.b.pay){s+=`\n${L}\nГРАФИК ОПЛАТЫ\n`;sched(c).forEach(([t,p])=>s+=`- ${t}: ${p}% — ${rub(c.I*p/100)}\n`);s+=`Ориентировочный срок: ${daysText(c)}\n`}
 s+=`\n${L}\nКонтакты: Telegram ${C.contacts.tg} (${C.contacts.tgUrl}), ${C.contacts.phone}, ${C.contacts.mail}\n`;
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+s],{type:"text/plain;charset=utf-8"}));a.download="kp-"+(S.date||"")+".txt";a.click()}

if(client){document.body.classList.add("client");}else buildEditor();
render();
