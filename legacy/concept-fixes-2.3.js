/* Concept Studio 2.3 — non-destructive editor improvements */
(()=>{'use strict';
const by=id=>document.getElementById(id), project=()=>typeof current==='function'?current():null;
const active=()=>typeof variant==='function'?variant():null;
const clone=x=>JSON.parse(JSON.stringify(x));
const style=document.createElement('style');style.textContent=`
/* Room locator is a page fixture, never an editable text/image */
#sheet .element.floor{pointer-events:none!important;z-index:3}
#sheet .element.floor .resize-handle11,#sheet .element.floor .resize-handle{display:none!important}
#sheet .element.floor .cs22-plan{width:100%;height:100%}
#sheet .element.floor .cs22-plan>img{width:100%;height:100%;object-fit:contain}
#sheet .element.floor .cs22-plan>svg{pointer-events:none}
.cs23-toolbar{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0;padding:8px;background:#f4f7f4;border:1px solid #dce5dc;border-radius:10px}
.cs23-toolbar button{font-size:12px;padding:7px 10px}
.cs23-toolbar button:disabled{opacity:.4;cursor:not-allowed}
@media print{.cs23-toolbar{display:none!important}#sheet .element.floor{outline:none!important}}
`;document.head.append(style);
// Fix floor miniature geometry: a fixed page coordinate, independent of inserted text.
function pinFloor(){if(typeof page==='undefined'||page!=='concept')return;const v=active();if(!v?.elements)return;for(const e of v.elements){if(e.type==='floor'){e.x=688;e.y=430;e.w=115;e.h=105;}}
}
const draw=window.drawSheet;
if(typeof draw==='function')window.drawSheet=function(...args){pinFloor();const out=draw.apply(this,args);const sheet=by('sheet');if(sheet){sheet.querySelectorAll('.element.floor').forEach(n=>{n.style.left='688px';n.style.top='430px';n.style.width='115px';n.style.height='105px';n.classList.remove('selected');n.removeAttribute('onpointerdown');n.removeAttribute('onclick');});}
 return out};
// Don't permit selecting or dragging the fixed locator.
const originalDrag=window.startDrag;
if(typeof originalDrag==='function')window.startDrag=function(e,i){if(active()?.elements?.[i]?.type==='floor'){e.preventDefault();e.stopPropagation();return;}return originalDrag.apply(this,arguments)};
const originalSelect=window.selectElement;
if(typeof originalSelect==='function')window.selectElement=function(i){if(active()?.elements?.[i]?.type==='floor')return;return originalSelect.apply(this,arguments)};
// Per-project editor snapshots, saved on user actions (not every cloud autosave).
const histories=new Map();let restoring=false;
function key(){const p=project();return p?.id||null}
function snapshot(){const p=project();return p?JSON.stringify(p):null}
function history(){const k=key();if(!k)return null;if(!histories.has(k))histories.set(k,{undo:[],redo:[],last:snapshot()});return histories.get(k)}
function record(){if(restoring)return;const h=history(),s=snapshot();if(!h||!s)return;if(h.last!==s){h.undo.push(h.last);if(h.undo.length>40)h.undo.shift();h.redo=[];h.last=s;refreshButtons();}}
function restore(s){const p=project();if(!p||!s)return;restoring=true;try{const data=JSON.parse(s),i=db.projects.findIndex(x=>x.id===p.id);if(i<0)return;db.projects[i]=data;if(typeof selected!=='undefined')selected=-1;if(typeof save==='function')save();if(typeof drawSheet==='function')drawSheet();if(typeof renderEditor==='function')renderEditor();}finally{restoring=false;}}
function undo(){const h=history();if(!h)return;record();if(!h.undo.length)return;h.redo.push(h.last);const s=h.undo.pop();h.last=s;restore(s);refreshButtons()}
function redo(){const h=history();if(!h?.redo.length)return;h.undo.push(h.last);const s=h.redo.pop();h.last=s;restore(s);refreshButtons()}
function refreshButtons(){const h=history(),u=by('cs23-undo'),r=by('cs23-redo');if(u)u.disabled=!h?.undo.length;if(r)r.disabled=!h?.redo.length;}
// Establish a pre-action baseline before editor gestures and form changes.
function captureBefore(){history()}
document.addEventListener('pointerdown',captureBefore,true);document.addEventListener('focusin',captureBefore,true);
const saved=window.save;
if(typeof saved==='function')window.save=function(...args){if(!restoring)record();return saved.apply(this,args)};
// Editing state is scoped to the active project. Ensure toolbar exists after re-render.
function toolbar(){const host=document.querySelector('#editor .editcontrols');if(!host)return;if(by('cs23-toolbar'))return;const bar=document.createElement('div');bar.className='cs23-toolbar';bar.id='cs23-toolbar';bar.innerHTML='<button type="button" id="cs23-undo" title="Rückgängig (⌘Z / Strg+Z)">↶ Zurück</button><button type="button" id="cs23-redo" title="Wiederholen (⌘⇧Z)">↷ Wiederholen</button><button type="button" id="cs23-crop" title="Bildzuschnitt">Bild zuschneiden</button><button type="button" id="cs23-remove" title="Ausgewähltes Element löschen">Löschen</button>';host.prepend(bar);by('cs23-undo').onclick=undo;by('cs23-redo').onclick=redo;by('cs23-crop').onclick=()=>{const e=active()?.elements?.[selected];if(e?.type==='image'&&typeof window.cs22OpenCrop==='function')window.cs22OpenCrop(selected)};by('cs23-remove').onclick=()=>{if(typeof deleteSelected==='function'&&active()?.elements?.[selected]?.type!=='floor'){deleteSelected();refreshButtons()}};refreshButtons()}
const render=window.renderEditor;if(typeof render==='function')window.renderEditor=function(...args){const out=render.apply(this,args);toolbar();refreshButtons();return out};
// Dblclick crop is delegated, so rerenders and resize handlers cannot swallow it.
document.addEventListener('dblclick',ev=>{const node=ev.target.closest?.('#sheet .element[data-index]');if(!node)return;const i=Number(node.dataset.index),e=active()?.elements?.[i];if(e?.type==='image'&&typeof window.cs22OpenCrop==='function'){ev.preventDefault();ev.stopImmediatePropagation();window.cs22OpenCrop(i)}},true);
// Shortcut handling only outside editable fields.
document.addEventListener('keydown',ev=>{const t=ev.target;if(t?.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"]'))return;if(typeof view==='undefined'||view!=='editor')return;
 const mod=ev.metaKey||ev.ctrlKey;
 if(mod&&ev.key.toLowerCase()==='z'){ev.preventDefault();if(ev.shiftKey)redo();else undo();return}
 if(mod&&ev.key.toLowerCase()==='y'){ev.preventDefault();redo();return}
 const v=active(),e=v?.elements?.[selected];if(!e||e.type==='floor')return;
 if(ev.key==='Delete'||ev.key==='Backspace'){ev.preventDefault();if(typeof deleteSelected==='function')deleteSelected();return}
 const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];if(!delta||mod||ev.altKey)return;ev.preventDefault();const step=ev.shiftKey?10:1;e.x=Math.max(0,Math.min(840-e.w,(+e.x||0)+delta[0]*step));e.y=Math.max(0,Math.min(594-e.h,(+e.y||0)+delta[1]*step));v.locked=true;if(typeof save==='function')save();if(typeof drawSheet==='function')drawSheet();
},true);
// Mark all rooms on floor overview, preserving separate stable colors.
function overlay(){const p=project();if(!p)return;const blocks=document.querySelectorAll('#sheet .floor-overview11');blocks.forEach((block,idx)=>{const f=(p.floors||[]).filter(x=>x.image)[idx];if(!f)return;let img=block.querySelector('img');if(!img)return;let old=block.querySelector('.cs23-overview');if(old)return;const rect=img.getBoundingClientRect(),parent=block.getBoundingClientRect();if(!rect.width||!rect.height)return;const nw=img.naturalWidth||rect.width,nh=img.naturalHeight||rect.height,scale=Math.min(rect.width/nw,rect.height/nh),w=nw*scale,h=nh*scale;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.classList.add('cs23-overview');Object.assign(svg.style,{position:'absolute',pointerEvents:'none',left:(rect.left-parent.left+(rect.width-w)/2)+'px',top:(rect.top-parent.top+(rect.height-h)/2)+'px',width:w+'px',height:h+'px',overflow:'visible'});
 (p.rooms||[]).filter(r=>!r.csVirtual20&&(r.floorId===f.id||(!r.floorId&&p.floors.length===1))).forEach(r=>{let pts=Array.isArray(r.polygon)&&r.polygon.length>=3?r.polygon:null;if(!pts&&r.bounds){const b=r.bounds;pts=[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}]}if(!pts)return;const i=p.rooms.indexOf(r),hue=(i*137.508+18)%360;const poly=document.createElementNS(svg.namespaceURI,'polygon');poly.setAttribute('points',pts.map(q=>`${Number(q.x)||0},${Number(q.y)||0}`).join(' '));poly.setAttribute('fill',`hsla(${hue},75%,48%,.25)`);poly.setAttribute('stroke',`hsl(${hue},75%,35%)`);poly.setAttribute('stroke-width','.65');svg.append(poly)});block.style.position='relative';block.append(svg)})}
const obs=new MutationObserver(()=>{if(typeof view==='undefined'||view!=='editor')return;requestAnimationFrame(overlay)});obs.observe(document.body,{subtree:true,childList:true});
window.addEventListener('resize',overlay);
})();
