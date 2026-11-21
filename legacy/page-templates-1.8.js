/* Concept Studio 1.8: customizable fixed-canvas template pages. */
(()=>{
'use strict';
const W=840,H=594;
const types=['cover','overview','projectintro','last'];
const names={cover:'Titelseite',overview:'Grundrissseite',projectintro:'Projektvorstellung',last:'Nutzungsvereinbarung'};
const base={
 cover:[{id:'heading',kind:'text',x:235,y:245,w:490,h:80,size:28},{id:'subtitle',kind:'text',x:235,y:333,w:490,h:42,size:13}],
 overview:[{id:'heading',kind:'text',x:86,y:37,w:635,h:45,size:21},{id:'floor',kind:'floor',x:86,y:102,w:665,h:406,size:12}],
 projectintro:[{id:'heading',kind:'text',x:86,y:40,w:650,h:45,size:21},{id:'projectname',kind:'text',x:107,y:139,w:600,h:52,size:22},{id:'description',kind:'text',x:107,y:207,w:590,h:235,size:16},{id:'meta',kind:'text',x:107,y:463,w:590,h:37,size:12}],
 last:[{id:'heading',kind:'text',x:110,y:93,w:615,h:38,size:19},{id:'german',kind:'text',x:110,y:143,w:615,h:160,size:12},{id:'english',kind:'text',x:110,y:323,w:615,h:160,size:12}]
};
const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let floorIndex=0, active=null, dragging=null;
function project(){try{return current()}catch{return null}}
function key(){return page==='overview'?'overview:'+floorIndex:page}
function data(){let p=project();if(!p)return null;p.templateLayouts18??={};let k=key();if(!p.templateLayouts18[k])p.templateLayouts18[k]=structuredClone(base[page]||[]);return p.templateLayouts18[k]}
function floor(){return (project()?.floors||[])[floorIndex]}
function textFor(id){let p=project()||{};switch(id){case'heading':return ({cover:p.name||'Lichtkonzept',overview:p.overviewTitle||'Grundriss und Raumübersicht',projectintro:p.introTitle||'Das Projekt',last:p.legalTitle18||'Nutzungsvereinbarung'})[page]||'';case'subtitle':return p.coverSubtitle18||('LICHTKONZEPT · '+(p.client||'Die Lichtgestalter'));case'projectname':return p.name||'';case'description':return p.projectDescription||p.brief||'Projektbeschreibung';case'meta':return p.introMeta18||('Auftraggeber: '+(p.client||'–')+' · '+(p.rooms||[]).length+' Räume');case'german':return p.legalGerman18??legalDE;case'english':return p.legalEnglish18??legalEN;default:return ''}}
function textValue(e){return e.customText!==undefined?e.customText:textFor(e.id)}
function persist(){if(typeof save==='function')save()}
function render(){if(!types.includes(page))return;const s=document.getElementById('sheet'),p=project();if(!s||!p)return;const entries=data();if(!entries)return;
 s.innerHTML=(typeof commonBase11==='function'?commonBase11(page==='cover'?'':page==='last'?'':page==='overview'?2:3):'')+'<div class="template-layer18"></div>';
 const layer=s.querySelector('.template-layer18');
 for(const e of entries){let node=document.createElement('div');node.className='template-item18'+(active===e.id?' selected18':'');node.dataset.item=e.id;node.style.cssText=`left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;z-index:${e.z||2};`;
 if(e.kind==='floor'){
  node.classList.add('template-floor18');let f=floor();if(f?.image){let im=document.createElement('img');im.src=f.image;im.alt=f.name||'Grundriss';node.append(im)}else node.textContent='Kein Grundriss für dieses Geschoss hinterlegt';
  if(f?.name){let label=document.createElement('div');label.className='floor-label18';label.textContent=f.name;node.append(label)}
 }else{node.classList.add('template-text18');node.style.fontSize=(e.size||14)+'px';node.style.color=e.color||'#242824';node.style.textAlign=e.align||'left';node.style.fontWeight=e.bold?'700':'400';node.style.fontStyle=e.italic?'italic':'normal';node.textContent=textValue(e)}
 const handle=document.createElement('span');handle.className='template-handle18';handle.title='Größe ändern';node.append(handle);layer.append(node);
 node.addEventListener('pointerdown',ev=>{if(ev.target===handle||ev.button!==0||node.isContentEditable)return;ev.stopPropagation();active=e.id;let startX=ev.clientX,startY=ev.clientY,rect=s.getBoundingClientRect(),scale=rect.width/W;dragging={e,x:e.x,y:e.y,startX,startY,scale,mode:'move'};node.setPointerCapture(ev.pointerId);node.classList.add('selected18');updatePanel()});
 handle.addEventListener('pointerdown',ev=>{ev.stopPropagation();ev.preventDefault();active=e.id;dragging={e,w:e.w,h:e.h,startX:ev.clientX,startY:ev.clientY,scale:s.getBoundingClientRect().width/W,mode:'resize'};node.setPointerCapture(ev.pointerId);updatePanel()});
 node.addEventListener('pointermove',ev=>{if(!dragging||dragging.e!==e)return;let dx=(ev.clientX-dragging.startX)/dragging.scale,dy=(ev.clientY-dragging.startY)/dragging.scale;if(dragging.mode==='move'){e.x=Math.max(0,Math.min(W-e.w,Math.round(dragging.x+dx)));e.y=Math.max(0,Math.min(H-e.h,Math.round(dragging.y+dy)))}else{e.w=Math.max(45,Math.min(W-e.x,Math.round(dragging.w+dx)));e.h=Math.max(25,Math.min(H-e.y,Math.round(dragging.h+dy)))}node.style.left=e.x+'px';node.style.top=e.y+'px';node.style.width=e.w+'px';node.style.height=e.h+'px'});
 node.addEventListener('pointerup',()=>{if(dragging?.e===e){dragging=null;persist();updatePanel()}});
 node.addEventListener('dblclick',ev=>{if(e.kind!=='text')return;ev.stopPropagation();active=e.id;node.contentEditable='true';node.focus();let selection=window.getSelection(),range=document.createRange();range.selectNodeContents(node);range.collapse(false);selection.removeAllRanges();selection.addRange(range);updatePanel()});
 node.addEventListener('blur',()=>{if(!node.isContentEditable)return;e.customText=node.innerText.trim();node.contentEditable='false';persist();updatePanel()});
 }
 updatePanel();
}
function updatePanel(){let pane=document.getElementById('template-controls18');if(!pane)return;const is=types.includes(page);pane.hidden=!is;if(!is)return;let p=project(),items=data()||[],e=items.find(x=>x.id===active),fl=p?.floors||[];
 pane.innerHTML=`<h3>Seitenvorlage · ${names[page]}</h3><p class="small">Vordefinierte Elemente lassen sich verschieben, skalieren und bearbeiten. Die Seitenfläche entspricht A4 quer.</p>`+
 (page==='overview'?`<label>Geschoss / Grundriss</label><select id="template-floor18">${fl.map((f,i)=>`<option value="${i}" ${i===floorIndex?'selected':''}>${escHtml(f.name||'Geschoss '+(i+1))}</option>`).join('')}</select>`:'')+
 `<div class="row"><button id="template-add18">+ Textfeld</button><button id="template-reset18">Vorlage zurücksetzen</button></div>`+
 (e?`<div class="divider"></div><strong>${e.kind==='floor'?'Grundriss':'Textfeld'} bearbeiten</strong>`+
 (e.kind==='text'?`<label>Inhalt</label><textarea id="template-text18" rows="5">${escHtml(textValue(e))}</textarea><div class="row"><label>Schriftgröße <input id="template-size18" type="number" min="7" max="90" value="${e.size||14}" style="width:85px"></label><label>Farbe <input id="template-color18" type="color" value="${e.color||'#242824'}" style="width:70px;padding:2px;height:40px"></label></div><div class="row"><button id="template-bold18">Fett ${e.bold?'✓':''}</button><button id="template-align18">Ausrichtung: ${e.align||'links'}</button></div>`:'<p class="small">Der Grundriss wird vollständig und ohne Beschnitt im Rahmen dargestellt.</p>')+
 `<div class="row"><button id="template-delete18" ${e.id==='floor'?'disabled':''}>Element löschen</button></div>`:'<p class="small">Element auf der Seite auswählen, um es anzupassen.</p>');
 const bind=(id,event,fn)=>{let n=document.getElementById(id);if(n)n.addEventListener(event,fn)};
 bind('template-floor18','change',ev=>{floorIndex=+ev.target.value;active=null;render()});
 bind('template-add18','click',()=>{let id='custom'+Date.now();data().push({id,kind:'text',x:120,y:200,w:370,h:75,size:16,customText:'Neues Textfeld'});active=id;persist();render()});
 bind('template-reset18','click',()=>{if(!confirm('Diese Seitenvorlage auf die Standardanordnung zurücksetzen?'))return;p.templateLayouts18[key()]=structuredClone(base[page]);active=null;persist();render()});
 bind('template-text18','input',ev=>{e.customText=ev.target.value;let node=document.querySelector('.template-item18.selected18');if(node){let h=node.querySelector('.template-handle18');node.textContent=e.customText;node.append(h)}persist()});
 bind('template-size18','input',ev=>{e.size=Math.max(7,Math.min(90,+ev.target.value||14));let n=document.querySelector('.template-item18.selected18');if(n)n.style.fontSize=e.size+'px';persist()});
 bind('template-color18','input',ev=>{e.color=ev.target.value;let n=document.querySelector('.template-item18.selected18');if(n)n.style.color=e.color;persist()});
 bind('template-bold18','click',()=>{e.bold=!e.bold;persist();render()});
 bind('template-align18','click',()=>{e.align=e.align==='center'?'right':e.align==='right'?'left':'center';persist();render()});
 bind('template-delete18','click',()=>{p.templateLayouts18[key()]=items.filter(v=>v.id!==e.id);active=null;persist();render()});
}
function setup(){let host=document.querySelector('#editor .editcontrols');if(host&&!document.getElementById('template-controls18')){let el=document.createElement('div');el.id='template-controls18';el.className='template-controls18';host.prepend(el)}updatePanel()}
const oldDraw=window.drawSheet;window.drawSheet=function(...args){if(types.includes(page)){render();return}return oldDraw.apply(this,args)};
const oldEditor=window.renderEditor;window.renderEditor=function(...args){let r=oldEditor.apply(this,args);setup();if(types.includes(page))render();return r};
const oldChange=window.changePageType;window.changePageType=function(v){active=null;floorIndex=0;return oldChange(v)};
// Each floor gets a separate full-sized A4 landscape page, rather than four tiny floorplans.
const oldSeq=window.pageSequence11;window.pageSequence11=function(){let seq=oldSeq();let result=[];for(const item of seq){if(item.kind==='overview'){let fs=project()?.floors||[];for(let i=0;i<Math.max(1,fs.length);i++)result.push({kind:'overview',floorIndex:i})}else result.push(item)}return result};
const oldWith=window.withPage11;window.withPage11=function(item){if(item.kind==='overview'){floorIndex=item.floorIndex||0;page='overview';render();return document.getElementById('sheet').outerHTML.replace('id="sheet"','')}return oldWith(item)};
const oldGather=window.gatherSheets11;window.gatherSheets11=function(){let fi=floorIndex;try{return oldGather()}finally{floorIndex=fi;if(types.includes(page))render()}};
// Ensure print matches the fixed 840×594 design coordinates exactly (no independent mm reflow).
const css=document.createElement('style');css.textContent=`
.template-controls18{border:1px solid #dce5de;border-radius:12px;padding:13px;margin-bottom:15px;background:#f7faf7}.template-controls18[hidden]{display:none}.template-controls18 .row{margin-top:8px}.template-controls18 label{margin-top:8px}.template-controls18 textarea{min-height:100px}
.template-item18{position:absolute;box-sizing:border-box;white-space:pre-wrap;overflow:hidden;overflow-wrap:anywhere;line-height:1.3;cursor:move}.template-item18.selected18{outline:2px solid #286b51;outline-offset:2px}.template-text18{padding:2px 4px}.template-floor18{background:#fbfcfa;border:1px solid #dce5de;display:flex;align-items:center;justify-content:center}.template-floor18 img{width:100%;height:100%;object-fit:contain;display:block}.floor-label18{position:absolute;left:8px;top:7px;padding:3px 8px;background:#ffffffdf;font-size:12px;font-weight:600}.template-handle18{display:none;position:absolute;right:0;bottom:0;width:15px;height:15px;background:#286b51;border:2px solid white;cursor:nwse-resize}.template-item18.selected18 .template-handle18{display:block}
@media print{.sheet{width:840px!important;height:594px!important;transform:scale(1.336);transform-origin:top left;margin:0!important;box-shadow:none!important;break-after:page!important;page-break-after:always!important}.template-item18{outline:none!important}.template-handle18{display:none!important}}
`;document.head.append(css);
// The print popup has its own document: inject matching rules and use an outer fixed-size page wrapper.
const oldPrint=window.openPrint11;window.openPrint11=function(doPrint){let oldOpen=window.open;try{window.open=function(...args){let w=oldOpen.apply(window,args);if(w){let originalWrite=w.document.write.bind(w.document);w.document.write=function(html){html=html.replace('</style></head>',`${css.textContent} @media print{.sheet{width:840px!important;height:594px!important;transform:scale(1.336);transform-origin:top left;margin:0!important;box-shadow:none!important;break-after:page!important}.template-handle18{display:none!important}.template-item18{outline:none!important}} </style></head>`);return originalWrite(html)}}return w};return oldPrint(doPrint)}finally{window.open=oldOpen}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
