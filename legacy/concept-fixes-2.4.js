/* Concept Studio 2.4: room text sync, floor overview, mask cropping, page-type priority. */
(()=>{'use strict';
const el=id=>document.getElementById(id);
const p=()=>typeof current==='function'?current():null;
const v=()=>typeof variant==='function'?variant():null;
const r=()=>typeof room==='function'?room():null;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
.cs24-mask-overlay{position:fixed;inset:0;z-index:11000;background:#101b17cc;display:flex;align-items:center;justify-content:center;padding:18px}
.cs24-mask-dialog{width:min(880px,96vw);background:white;color:#1b2722;border-radius:16px;padding:20px;max-height:95vh;overflow:auto}
.cs24-stage{position:relative;height:420px;max-height:55vh;background:#d9dfdb;overflow:hidden;border-radius:8px;touch-action:none}
.cs24-mask{position:absolute;left:20%;top:14%;width:60%;height:70%;overflow:hidden;resize:both;border:2px solid #147a55;outline:1px solid white;box-shadow:0 0 0 999px #14251b44;min-width:45px;min-height:45px;max-width:95%;max-height:95%;cursor:move}
.cs24-mask img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none}
.cs24-actions{display:flex;gap:10px;justify-content:flex-end;align-items:center;margin-top:12px;flex-wrap:wrap}
.cs24-hint{font-size:13px;color:#53665b;margin:8px 0}
#editor .editcontrols .cs24-type{order:-9999;margin:0 0 12px;padding:10px;background:#eff6f1;border:1px solid #d4e7d9;border-radius:9px}
#editor .editcontrols .cs24-type label{margin-top:0}
.cs24-overview{position:relative;height:235px;margin:10px 0;overflow:hidden}
.cs24-overview img{width:100%;height:100%;object-fit:contain}
.cs24-overview svg{position:absolute;pointer-events:none}
@media print{.cs24-mask-overlay{display:none!important}}
`;document.head.append(css);
// The page type is the first choice, independent of legacy collapsible panels.
function typeFirst(){const host=document.querySelector('#editor .editcontrols'),sel=el('pageType');if(!host||!sel)return;let group=el('cs24-type');if(!group){group=document.createElement('div');group.className='cs24-type';group.id='cs24-type';const label=document.createElement('label');label.textContent='Seitentyp';group.append(label,sel);host.prepend(group)}else if(host.firstElementChild!==group)host.prepend(group);
 // Remove empty legacy label, not the select itself.
 [...host.querySelectorAll('label')].filter(x=>x!==group.querySelector('label')&&x.textContent.trim()==='Seitentyp').forEach(x=>x.style.display='none');
}
// Keep a single independently editable room brief. Never resurrect after manual deletion.
function syncText(){if(typeof page==='undefined'||page!=='concept')return;const room=r(),pageData=v();if(!room||!pageData)return;pageData.elements??=[];
 const raw=String(room.notes||room.description||'').trim();if(!raw)return;
 // Version 2.2 owns its initial migration. Here we only import new content written afterwards.
 if(!pageData.cs24RoomText){pageData.cs24RoomText={lastImported:'',deleted:false};}
 const state=pageData.cs24RoomText;
 const existing=pageData.elements.find(e=>e.cs24FromRoom);
 if(existing){state.lastImported=raw;return;}
 // If a previously inserted field was deleted, do not restore it.
 if(state.inserted){state.deleted=true;return;}
 // A text already imported by 2.2 should not be duplicated.
 const already=pageData.elements.some(e=>(e.type==='extra'||e.type==='text')&&String(e.text||pageData.text||'').trim()===raw);
 if(already){state.inserted=true;state.lastImported=raw;return;}
 // Only import later edits once; do not overwrite the manually edited concept text.
 if(!pageData.cs22TextInitialized)return;
 pageData.elements.push({type:'extra',text:raw,x:360,y:160,w:360,h:180,fontSize:15,cs24FromRoom:true});
 state.inserted=true;state.lastImported=raw;pageData.locked=true;if(typeof save==='function')save();
}
// Detect later room description changes from the project form and import on editor entry.
const oldEditor=window.renderEditor;
if(typeof oldEditor==='function')window.renderEditor=function(...args){const result=oldEditor.apply(this,args);syncText();typeFirst();return result};
const oldDraw=window.drawSheet;
if(typeof oldDraw==='function')window.drawSheet=function(...args){syncText();const result=oldDraw.apply(this,args);typeFirst();requestAnimationFrame(drawOverview);return result};
// Floor overview: overlay every room, with stable individual color, over the actual contained image rectangle.
function drawOverview(){if(typeof page==='undefined'||page!=='overview')return;const proj=p(),sheet=el('sheet');if(!proj||!sheet)return;
 const floors=(proj.floors||[]).filter(f=>f.image);const blocks=[...sheet.querySelectorAll('.floor-overview11')];
 blocks.forEach((block,i)=>{const floor=floors[i];if(!floor)return;const img=block.querySelector('img');if(!img)return;
 let overlay=block.querySelector('svg.cs24-markers');if(overlay)overlay.remove();
 const bw=img.clientWidth,bh=img.clientHeight,nw=img.naturalWidth||bw,nh=img.naturalHeight||bh;if(!bw||!bh)return;
 const scale=Math.min(bw/nw,bh/nh),dw=nw*scale,dh=nh*scale;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('cs24-markers');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');
 const parent=block.getBoundingClientRect(),rect=img.getBoundingClientRect();block.style.position='relative';
 Object.assign(svg.style,{position:'absolute',left:(rect.left-parent.left+(bw-dw)/2)+'px',top:(rect.top-parent.top+(bh-dh)/2)+'px',width:dw+'px',height:dh+'px',pointerEvents:'none',zIndex:'5'});
 (proj.rooms||[]).filter(room=>!room.csVirtual20&&(room.floorId===floor.id||(!room.floorId&&floors.length===1))).forEach(room=>{
 let pts=Array.isArray(room.polygon)&&room.polygon.length>=3?room.polygon:null;
 if(!pts&&room.bounds){const b=room.bounds;pts=[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}]}
 if(!pts)return;const index=proj.rooms.indexOf(room),hue=(index*137.508+18)%360;
 const poly=document.createElementNS(svg.namespaceURI,'polygon');poly.setAttribute('points',pts.map(q=>`${Number(q.x)||0},${Number(q.y)||0}`).join(' '));poly.setAttribute('fill',`hsla(${hue},80%,45%,.27)`);poly.setAttribute('stroke',`hsl(${hue},75%,35%)`);poly.setAttribute('stroke-width','.6');svg.append(poly);
 });block.append(svg);
 });
}
// Resizable Pages-style mask: drag the picture within a resizable frame.
function openMask(index){const pageData=v(),item=pageData?.elements?.[index];if(!item||item.type!=='image')return;
 const image=pageData.images?.find(x=>x.id===item.imageId);if(!image?.src){alert('Bilddatei ist derzeit nicht verfügbar.');return;}
 document.querySelector('.cs24-mask-overlay')?.remove();
 const modal=document.createElement('div');modal.className='cs24-mask-overlay';modal.innerHTML=`<div class="cs24-mask-dialog" role="dialog" aria-modal="true"><h3>Bildmaske bearbeiten</h3><p class="cs24-hint">Ziehe an der rechten unteren Ecke der grünen Maske, um den sichtbaren Rahmen zu verändern. Ziehe das Bild innerhalb der Maske, um den Ausschnitt zu verschieben.</p><div class="cs24-stage"><div class="cs24-mask"><img alt="Bild zuschneiden" src="${safe(image.src)}"></div></div><div class="cs24-actions"><button type="button" data-action="all">Vollständig anzeigen</button><button type="button" data-action="cancel">Abbrechen</button><button type="button" class="primary" data-action="apply">Übernehmen</button></div></div>`;
 document.body.append(modal);const stage=modal.querySelector('.cs24-stage'),mask=modal.querySelector('.cs24-mask'),pic=mask.querySelector('img');
 const initialW=Math.max(45,Math.min(stage.clientWidth*.9,item.w/840*stage.clientWidth)),initialH=Math.max(45,Math.min(stage.clientHeight*.9,item.h/594*stage.clientHeight));
 mask.style.width=initialW+'px';mask.style.height=initialH+'px';mask.style.left=((stage.clientWidth-initialW)/2)+'px';mask.style.top=((stage.clientHeight-initialH)/2)+'px';
 let ox=item.cropX??50,oy=item.cropY??50;pic.style.objectPosition=`${ox}% ${oy}%`;pic.style.objectFit=item.fit==='contain'?'contain':'cover';
 let drag=null;mask.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;const rect=mask.getBoundingClientRect();if(ev.clientX>rect.right-24&&ev.clientY>rect.bottom-24)return;drag={x:ev.clientX,y:ev.clientY,ox,oy};mask.setPointerCapture(ev.pointerId);ev.preventDefault()});
 mask.addEventListener('pointermove',ev=>{if(!drag)return;ox=Math.max(0,Math.min(100,drag.ox-(ev.clientX-drag.x)/Math.max(1,mask.clientWidth)*100));oy=Math.max(0,Math.min(100,drag.oy-(ev.clientY-drag.y)/Math.max(1,mask.clientHeight)*100));pic.style.objectPosition=`${ox}% ${oy}%`});
 mask.addEventListener('pointerup',()=>drag=null);
 modal.querySelector('[data-action="all"]').onclick=()=>{pic.style.objectFit='contain';ox=oy=50;pic.style.objectPosition='50% 50%'};
 modal.querySelector('[data-action="cancel"]').onclick=()=>modal.remove();
 modal.querySelector('[data-action="apply"]').onclick=()=>{const w=Math.round(mask.clientWidth/stage.clientWidth*840),h=Math.round(mask.clientHeight/stage.clientHeight*594);item.w=Math.min(840,Math.max(30,w));item.h=Math.min(594,Math.max(30,h));item.x=Math.max(0,Math.min(840-item.w,Math.round((parseFloat(mask.style.left)||0)/stage.clientWidth*840)));item.y=Math.max(0,Math.min(594-item.h,Math.round((parseFloat(mask.style.top)||0)/stage.clientHeight*594)));item.cropX=ox;item.cropY=oy;item.cropZoom=1;item.fit=pic.style.objectFit==='contain'?'contain':'cover';pageData.locked=true;modal.remove();if(typeof save==='function')save();if(typeof drawSheet==='function')drawSheet()};
 modal.addEventListener('click',ev=>{if(ev.target===modal)modal.remove()});
}
window.cs24OpenMask=openMask;
// Capture dblclick before earlier handlers and their stopPropagation calls.
document.addEventListener('dblclick',ev=>{const node=ev.target.closest?.('#sheet .element[data-index]');if(!node)return;const index=Number(node.dataset.index);if(v()?.elements?.[index]?.type!=='image')return;ev.preventDefault();ev.stopImmediatePropagation();openMask(index)},true);
// Override old crop launcher so existing toolbar also uses the new mask editor.
window.cs22OpenCrop=openMask;
const observer=new MutationObserver(()=>{if(typeof view!=='undefined'&&view==='editor'){typeFirst();if(typeof page!=='undefined'&&page==='overview')requestAnimationFrame(drawOverview)}});
observer.observe(document.querySelector('#editor')||document.body,{childList:true,subtree:true});
})();
