/* Concept Studio 2.2 — room text, polygons, crop controls, compact inspector. */
(()=>{'use strict';
const $id=id=>document.getElementById(id);
const esc22=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const color22=i=>`hsl(${(i*137.508+18)%360} 62% 42%)`;
const css=document.createElement('style');css.textContent=`
.cs22-plan{position:relative;width:100%;height:100%;overflow:hidden;background:white}
.cs22-plan>img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.cs22-plan>svg{position:absolute;pointer-events:none;overflow:visible}
.cs22-plan svg text{paint-order:stroke;stroke:white;stroke-width:.8px;stroke-linejoin:round}
.cs22-modal{position:fixed;inset:0;z-index:10010;background:#14251dcc;display:flex;align-items:center;justify-content:center;padding:20px}
.cs22-dialog{background:white;width:min(740px,96vw);max-height:94vh;overflow:auto;border-radius:16px;padding:20px;box-shadow:0 18px 70px #0004}
.cs22-cropframe{height:340px;position:relative;overflow:hidden;background:#e9ede9;border:1px solid #d4ddd5;border-radius:9px}
.cs22-cropframe img{position:absolute;width:100%;height:100%;object-fit:cover;max-width:none;max-height:none}
.cs22-dialog .row{margin:10px 0}
.cs22-inspector{border:1px solid #dce4dc;border-radius:10px;margin:9px 0;overflow:hidden}
.cs22-inspector>summary{cursor:pointer;padding:12px 14px;font-size:13px;font-weight:650;background:#f2f6f2}
.cs22-inspector>.cs22-inside{padding:10px 13px}
.cs22-inspector label{margin-top:7px}
.sheet .element.textel{overflow:hidden!important;white-space:pre-wrap;overflow-wrap:break-word}
@media print{.cs22-modal,.resize-handle11,.resize-handle,.selected-controls,.cs22-crop-trigger{display:none!important}.sheet .element{outline:none!important;box-shadow:none!important}.sheet .element.textel{overflow:hidden!important}.cs22-plan svg{pointer-events:none}}
`;document.head.append(css);
function project22(){return typeof current==='function'?current():null}
function room22(){return typeof room==='function'?room():null}
function variant22(){return typeof variant==='function'?variant():null}
function migrate22(){
 if(typeof page==='undefined'||page!=='concept')return;
 const v=variant22(),r=room22();if(!v||!r)return;
 v.elements??=[];
 // Only once per page: transfer the room brief to ONE independent editable element.
 if(!v.cs22TextInitialized){
  const txt=String(v.text||r.notes||r.description||'').trim();
  const texts=v.elements.filter(e=>e.type==='text');
  const extras=v.elements.filter(e=>e.type==='extra');
  const matches=extras.filter(e=>String(e.text||'').trim()===txt&&txt);
  if(txt){
   let primary=matches[0]||texts[0];
   if(primary){primary.type='extra';primary.text=txt;primary.x=Number.isFinite(+primary.x)?+primary.x:85;primary.y=Math.min(455,Math.max(110,+primary.y||250));primary.w=Math.min(600,Math.max(180,+primary.w||420));primary.h=Math.min(310,Math.max(90,+primary.h||190));primary.fontSize=primary.fontSize||15;}
   else v.elements.push({type:'extra',text:txt,x:350,y:135,w:390,h:280,fontSize:15});
   v.elements=v.elements.filter(e=>e===primary||e.type!=='text'&&!(e.type==='extra'&&String(e.text||'').trim()===txt));
  }else v.elements=v.elements.filter(e=>e.type!=='text');
  v.text='';v.cs22TextInitialized=true;v.locked=true;
  if(typeof save==='function')save();
 }
 // Legacy text elements are not resurrected after deletion.
 if(v.cs22TextInitialized){v.text='';v.elements=v.elements.filter(e=>e.type!=='text');}
}
const originalDraw=window.drawSheet;
window.drawSheet=function(...args){migrate22();const result=originalDraw.apply(this,args);const v=variant22(),sheet=$id('sheet');if(!sheet||!v||page!=='concept')return result;
 sheet.querySelectorAll('.element[data-index]').forEach(node=>{
  const e=v.elements?.[+node.dataset.index];if(!e)return;
  if(e.type==='image'){
   const img=node.querySelector('img');if(!img)return;
   img.style.objectFit=e.fit==='contain'?'contain':'cover';img.style.objectPosition=`${e.cropX??50}% ${e.cropY??50}%`;
   img.style.transform=e.fit==='contain'?'none':`scale(${e.cropZoom||1})`;
   img.style.transformOrigin=`${e.cropX??50}% ${e.cropY??50}%`;
   node.addEventListener('dblclick',ev=>{ev.stopPropagation();ev.preventDefault();window.cs22OpenCrop(+node.dataset.index)});
  }
  if(e.type==='extra'){node.style.overflow='hidden';node.style.fontSize=(e.fontSize||15)+'px';}
 });return result;
};
// Make the crop preview reflect the same CSS as the editor.
window.cs22OpenCrop=function(i){const v=variant22(),e=v?.elements?.[i];if(!e||e.type!=='image')return;
 const im=v.images?.find(x=>x.id===e.imageId);if(!im)return;
 const modal=document.createElement('div');modal.className='cs22-modal';modal.innerHTML=`<div class="cs22-dialog" role="dialog" aria-modal="true" aria-label="Bild zuschneiden"><h3>Bild zuschneiden</h3><p class="muted">Ausschnitt und Zoom anpassen. Das Originalbild bleibt erhalten.</p><div class="cs22-cropframe" style="aspect-ratio:${Math.max(1,e.w)}/${Math.max(1,e.h)};height:min(45vh,340px)"><img alt="Bildvorschau" src="${esc22(im.src||'')}"></div><label>Darstellung</label><select id="cs22-fit"><option value="cover">Rahmen füllen / zuschneiden</option><option value="contain">Vollständig anzeigen</option></select><label>Zoom <span id="cs22-zlabel"></span></label><input id="cs22-zoom" type="range" min="100" max="300" step="5"><label>Horizontaler Ausschnitt</label><input id="cs22-x" type="range" min="0" max="100"><label>Vertikaler Ausschnitt</label><input id="cs22-y" type="range" min="0" max="100"><div class="row"><button id="cs22-cancel">Abbrechen</button><button id="cs22-apply" class="primary">Übernehmen</button></div></div>`;
 document.body.append(modal);const get=id=>modal.querySelector('#'+id),img=modal.querySelector('img');
 get('cs22-fit').value=e.fit==='contain'?'contain':'cover';get('cs22-zoom').value=Math.round((e.cropZoom||1)*100);get('cs22-x').value=e.cropX??50;get('cs22-y').value=e.cropY??50;
 function update(){const fit=get('cs22-fit').value,x=+get('cs22-x').value,y=+get('cs22-y').value,z=+get('cs22-zoom').value/100;img.style.objectFit=fit;img.style.objectPosition=`${x}% ${y}%`;img.style.transform=fit==='contain'?'none':`scale(${z})`;img.style.transformOrigin=`${x}% ${y}%`;get('cs22-zlabel').textContent=Math.round(z*100)+' %';}
 modal.querySelectorAll('input,select').forEach(n=>n.addEventListener('input',update));update();
 get('cs22-cancel').onclick=()=>modal.remove();modal.addEventListener('click',ev=>{if(ev.target===modal)modal.remove()});
 get('cs22-apply').onclick=()=>{e.fit=get('cs22-fit').value;e.cropZoom=+get('cs22-zoom').value/100;e.cropX=+get('cs22-x').value;e.cropY=+get('cs22-y').value;v.locked=true;modal.remove();save();drawSheet()};
};
// The original fit dropdown is rebuilt on every selection; override its action to persist the setting.
window.setFit=function(value){const e=variant22()?.elements?.[selected];if(!e)return;e.fit=value;variant22().locked=true;save();drawSheet()};
// Draw polygons in the actual displayed image rectangle, including object-fit:contain letterboxing.
function points22(r){const a=r.polygon;if(Array.isArray(a)&&a.length>=3)return a;if(r.bounds){const b=r.bounds;return [{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}]}return []}
function mark22(f,only){const p=project22();const rooms=(p?.rooms||[]).filter(r=>!r.csVirtual20&&(r.floorId===f.id||(!r.floorId&&p.floors?.length===1))&&(!only||r.id===only));return rooms.map(r=>{const pts=points22(r);if(pts.length<3)return '';const index=p.rooms.filter(x=>!x.csVirtual20).findIndex(x=>x.id===r.id);const c=color22(Math.max(0,index));const coords=pts.map(q=>`${+q.x||0},${+q.y||0}`).join(' ');const x=pts.reduce((a,q)=>a+(+q.x||0),0)/pts.length,y=pts.reduce((a,q)=>a+(+q.y||0),0)/pts.length;return `<polygon points="${coords}" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width=".75" vector-effect="non-scaling-stroke"/><text x="${x}" y="${y}" font-size="2.8" fill="${c}" text-anchor="middle" dominant-baseline="central">${esc22(r.name)}</text>`}).join('')}
function frame22(f,only){if(!f?.image)return '<span>Kein Grundriss vorhanden</span>';const id='cs22-'+Math.random().toString(36).slice(2);return `<div class="cs22-plan" data-cs22="${id}"><img src="${esc22(f.image)}" alt="${esc22(f.name||'Grundriss')}"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${mark22(f,only)}</svg></div>`}
window.floorSheetMarkup=function(r){const p=project22(),f=p?.floors?.find(f=>f.id===r?.floorId)||p?.floors?.[0];return frame22(f,r?.id)};
window.allFloorMarkup11=function(){const p=project22();return (p?.floors||[]).filter(f=>f.image).map(f=>`<div class="floor-overview11" style="position:relative;height:240px"><div class="floor-title11">${esc22(f.name)}</div><div style="height:205px">${frame22(f,null)}</div></div>`).join('')||'<p>Kein Grundriss vorhanden.</p>'};
// Resize SVG overlay to the actual painted image area (not the outer container).
function align22(root=document){root.querySelectorAll('.cs22-plan').forEach(frame=>{const img=frame.querySelector('img'),svg=frame.querySelector('svg');if(!img||!svg)return;const w=frame.clientWidth,h=frame.clientHeight;if(!w||!h)return;const iw=img.naturalWidth||w,ih=img.naturalHeight||h;const scale=Math.min(w/iw,h/ih),dw=iw*scale,dh=ih*scale;svg.style.left=(w-dw)/2+'px';svg.style.top=(h-dh)/2+'px';svg.style.width=dw+'px';svg.style.height=dh+'px'})}
const observer=new MutationObserver(()=>{requestAnimationFrame(()=>align22())});observer.observe(document.body,{subtree:true,childList:true});document.addEventListener('load',ev=>{if(ev.target?.matches?.('.cs22-plan img'))align22()},{capture:true});window.addEventListener('resize',()=>align22());
// Keep room miniatures showing only the active room, and restore image geometry after layout.
const oldDraw2=window.drawSheet;window.drawSheet=function(...args){const out=oldDraw2.apply(this,args);align22($id('sheet')||document);return out};
// Compact, collapsible left sidebar without replacing existing field event handlers.
function compact22(){const host=document.querySelector('#editor .editcontrols');if(!host||host.dataset.cs22Compact)return;host.dataset.cs22Compact='1';const advanced=$id('advancedEditor'),selectedHost=$id('selectedControls');
 const children=[...host.children];const details=(title,nodes,open)=>{const d=document.createElement('details');d.className='cs22-inspector';d.open=open;const sum=document.createElement('summary');sum.textContent=title;d.append(sum);const inside=document.createElement('div');inside.className='cs22-inside';nodes.forEach(n=>inside.append(n));d.append(inside);host.append(d);return d};
 const groups=[['Seite & Raum',[],true],['Text & Formatierung',[],false],['Bilder & Ausschnitt',[],false],['Elemente & Position',[],true],['Export',[],false]];let bucket=0;
 for(const n of children){if(n===advanced){groups[3][1].push(n);continue}if(n===selectedHost){groups[3][1].push(n);continue}const label=n.tagName==='LABEL'?n.textContent.trim().toLowerCase():'';if(label.includes('seitentyp')||label.includes('raum')||label.includes('seitentitel'))bucket=0;else if(label.includes('konzepttext'))bucket=1;else if(label.includes('leuchten-')||label.includes('architekturbilder'))bucket=2;else if(n.classList.contains('layoutbuttons'))bucket=3;else if(label.includes('ausgewähltes'))bucket=3;else if(n.textContent?.includes('Gesamtes Konzept drucken'))bucket=4;
 groups[bucket][1].push(n)}groups.forEach(g=>{if(g[1].length)details(...g)});
 const selectedGroup=selectedHost?.closest('details');if(selectedGroup)selectedGroup.open=true;
}
const oldRenderEditor=window.renderEditor;window.renderEditor=function(...args){const r=oldRenderEditor.apply(this,args);compact22();return r};
// Improve sidebar text editing: update live without rebuilding the input or losing focus.
window.editSelectedText11=function(value){const v=variant22(),e=v?.elements?.[selected];if(!e)return;if(e.type==='extra')e.text=value;else if(e.type==='text')v.text=value;v.locked=true;const node=$id('sheet')?.querySelector(`.element[data-index="${selected}"]`);if(node)node.childNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)n.textContent=value});save()};
})();
