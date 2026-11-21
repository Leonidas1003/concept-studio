/* Concept Studio 2.1: image resilience, editable room copy, floor polygons. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roomPoints=r=>{if(Array.isArray(r?.polygon)&&r.polygon.length>=3)return r.polygon;if(r?.bounds){let b=r.bounds;return [{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}]}return []};
const matching=(f,onlyRoom)=>{const p=current();return (p?.rooms||[]).filter(r=>!r.csVirtual20&&(r.floorId===f.id||(!r.floorId&&p.floors?.length===1))&&(!onlyRoom||r.id===onlyRoom))};
function svgMarks(f,onlyRoom){const rs=matching(f,onlyRoom);return `<svg class="cs21-marks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Raummarkierungen">${rs.map(r=>{const pts=roomPoints(r);if(pts.length<3)return '';const active=onlyRoom===r.id;const poly=pts.map(pt=>`${Number(pt.x)||0},${Number(pt.y)||0}`).join(' ');const x=pts.reduce((a,p)=>a+(Number(p.x)||0),0)/pts.length,y=pts.reduce((a,p)=>a+(Number(p.y)||0),0)/pts.length;return `<polygon points="${poly}" fill="${active?'#399e6555':'#c9846633'}" stroke="${active?'#187747':'#ba785d'}" stroke-width="${active?0.75:0.48}" vector-effect="non-scaling-stroke"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="#173c2b" stroke="white" stroke-width="0.65" paint-order="stroke" font-size="2.6">${safe(r.name)}</text>`}).join('')}</svg>`}
function planFrame(f,onlyRoom,klass=''){if(!f?.image)return '<span class="cs21-no-plan">Kein Grundriss vorhanden</span>';return `<div class="cs21-plan ${klass}"><img src="${safe(f.image)}" alt="${safe(f.name||'Grundriss')}" loading="eager">${svgMarks(f,onlyRoom)}</div>`}
const css=document.createElement('style');css.textContent=`
.cs21-plan{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;display:block;background:#fff}
.cs21-plan>img{display:block;width:100%;height:100%;object-fit:contain}
.cs21-plan>.cs21-marks{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.cs21-overview{position:relative;width:100%;height:170px;background:white;overflow:hidden}
.cs21-overview .cs21-plan{height:145px}
.cs21-overview .cs21-label{font-size:11px;height:25px;padding:4px 6px;font-weight:600}
.sheet .element.floor .cs21-plan{height:100%;width:100%}
.cs21-no-plan{font-size:10px;color:#999;padding:8px}
`;document.head.append(css);
// The overview and room thumbnails now use the same polygons as the floor editor.
window.floorSheetMarkup=function(r){const p=current();const f=p?.floors?.find(f=>f.id===r?.floorId)||p?.floors?.[0];return planFrame(f,r?.id)};
window.allFloorMarkup11=function(){const p=current();if(!p?.floors?.some(f=>f.image))return '<p>Kein Grundriss vorhanden.</p>';return p.floors.filter(f=>f.image).map(f=>`<div class="floor-overview11 cs21-overview"><div class="cs21-label">${safe(f.name)}</div>${planFrame(f,null)}</div>`).join('')};
// If the floorplan's preview already has a room, the brief text must be editable
// using the same v.text property as the editor's text element.
function syncRoomText(){if(typeof page==='undefined'||page!=='concept')return;const r=room?.(),v=variant?.();if(!r||!v)return;
 if(!Array.isArray(v.elements))v.elements=[];
 const hasText=v.elements.some(e=>e.type==='text');
 if(String(v.text||'').trim()&&!hasText){v.elements.push({type:'text',x:85,y:428,w:550,h:95,fontSize:15});}
}
const oldEditor=window.renderEditor;window.renderEditor=function(...args){syncRoomText();return oldEditor.apply(this,args)};
const oldDraw=window.drawSheet;window.drawSheet=function(...args){syncRoomText();const result=oldDraw.apply(this,args);const sheet=byId('sheet');if(!sheet)return result;
 // Restore images after cloud uploads/signed URL refresh, without redrawing text inputs.
 const v=typeof variant==='function'?variant():null;
 if(page==='concept'&&v){sheet.querySelectorAll('.element[data-index]').forEach(node=>{const e=v.elements?.[Number(node.dataset.index)];if(!e||e.type!=='image')return;const im=v.images?.find(x=>x.id===e.imageId);const img=node.querySelector('img');if(!im||!img)return;
   if(im.src&&img.getAttribute('src')!==im.src)img.src=im.src;
   img.addEventListener('error',async()=>{if(img.dataset.cs21Retry==='1')return;img.dataset.cs21Retry='1';const asset=im.srcCloud;const client=window.conceptCloud?.client;if(!asset?.bucket||!asset?.path||!client)return;try{const {data,error}=await client.storage.from(asset.bucket).createSignedUrl(asset.path,3600);if(error)throw error;if(data?.signedUrl){im.src=data.signedUrl;img.src=data.signedUrl}}catch(err){console.warn('Bild konnte nicht neu geladen werden',err)}},{once:true});
 });}
 return result};
// Keep the source image visible when Supabase swaps a data URL for a signed URL.
// No data is persisted locally: this is only an in-memory fallback for the current session.
const originalSave=window.save;
window.save=function(...args){const p=current?.();if(p){window.__cs21ImageCache??=new Map();for(const r of p.rooms||[])for(const v of r.variants||[])for(const im of v.images||[]){if(typeof im.src==='string'&&im.src.startsWith('data:image/'))window.__cs21ImageCache.set(im.id,im.src)}}return originalSave.apply(this,args)};
const oldDraw2=window.drawSheet;window.drawSheet=function(...args){const res=oldDraw2.apply(this,args);const sheet=byId('sheet'),v=typeof variant==='function'?variant():null;if(page==='concept'&&sheet&&v){sheet.querySelectorAll('.element[data-index]').forEach(node=>{const e=v.elements?.[+node.dataset.index];if(e?.type!=='image')return;const im=v.images?.find(x=>x.id===e.imageId),img=node.querySelector('img');if(!img||!im)return;img.addEventListener('error',()=>{const fallback=window.__cs21ImageCache?.get(im.id);if(fallback&&img.src!==fallback)img.src=fallback},{once:true})})}return res};
})();
