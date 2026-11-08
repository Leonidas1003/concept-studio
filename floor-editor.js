/* Concept Studio 1.3 – calibrated floor and room planning */
(() => {
'use strict';
let calibrationPoints=[];
const $=id=>document.getElementById(id);
const number=v=>Number.isFinite(Number(v))?Number(v):0;
const area=pts=>Math.abs(pts.reduce((sum,p,i)=>{const q=pts[(i+1)%pts.length];return sum+p.x*q.y-q.x*p.y},0))/2;
function dimensions(f){const width=number(f?.calibration?.widthM);const height=number(f?.calibration?.heightM);return width>0&&height>0?{width,height}:null}
function roomArea(r,f){const d=dimensions(f);if(!d)return null;const pts=getPoints(r);if(pts.length<3)return null;return area(pts)*d.width*d.height/10000}
function roomFloorById(r){return (current()?.floors||[]).find(f=>f.id===r.floorId)}
function roomStats(){const p=current();if(!p)return;const f=floor();const host=$('stepSide');if(!host||p.step!==2)return;
 const block=document.createElement('div');block.className='cs13tools';block.innerHTML=`<h3>Maßstab & Raumflächen</h3><p class="muted">Zwei Punkte mit bekanntem Abstand auf dem Plan anklicken. Die gemessene Strecke muss auf derselben Planebene liegen.</p><div class="row"><button id="cs13Calibrate" type="button">↔ Strecke kalibrieren</button><button id="cs13Reset" type="button">Kalibrierung löschen</button></div><div id="cs13ScaleStatus" class="note"></div><p class="muted">Flächen sind Näherungswerte aus den eingezeichneten Polygonen. Vor technischer Planung den Maßstab kontrollieren.</p><h3>Raumdetails</h3><div id="cs13Rooms"></div>`;
 host.prepend(block);
 $('cs13Calibrate').onclick=()=>{if(!f?.image)return alert('Bitte zuerst einen Grundriss hochladen.');calibrationPoints=[];const canvas=$('floorCanvas');if(!canvas)return;canvas.classList.add('cs13-calibrating');canvas.addEventListener('pointerdown',calibrationClick,true);updateScaleStatus()};
 $('cs13Reset').onclick=()=>{if(!confirm('Kalibrierung dieses Geschosses entfernen?'))return;delete f.calibration;save();renderProject()};
 updateScaleStatus();renderRoomDetails();
}
function calibrationClick(e){const canvas=$('floorCanvas');if(!canvas)return; e.preventDefault();e.stopImmediatePropagation();const f=floor();calibrationPoints.push(pctPoint(e,canvas));if(calibrationPoints.length<2){updateScaleStatus();return}canvas.removeEventListener('pointerdown',calibrationClick,true);canvas.classList.remove('cs13-calibrating');const [a,b]=calibrationPoints;calibrationPoints=[];const known=prompt('Reale Länge zwischen den beiden Punkten in Metern (z. B. 4,25):');if(known===null){updateScaleStatus();return}const meters=Number(known.replace(',','.'));if(!Number.isFinite(meters)||meters<=0)return alert('Bitte eine positive Länge in Metern eingeben.');const img=canvas.querySelector('img');const w=img?.naturalWidth||0,h=img?.naturalHeight||0;if(!w||!h)return alert('Bildabmessungen nicht verfügbar.');const dx=(b.x-a.x)/100,dy=(b.y-a.y)/100;const normalized=Math.hypot(dx,dy*h/w);if(normalized<=0.00001)return alert('Bitte zwei unterschiedliche Punkte auswählen.');const widthM=meters/normalized;f.calibration={widthM,heightM:widthM*h/w,knownDistanceM:meters,points:[a,b],sourceWidth:w,sourceHeight:h};save();renderProject()}
function updateScaleStatus(){const el=$('cs13ScaleStatus');if(!el)return;const f=floor(),d=dimensions(f);el.textContent=calibrationPoints.length===1?'Erster Punkt gesetzt. Bitte den zweiten Punkt anklicken.':d?`Kalibriert · Planbreite ${d.width.toFixed(2)} m · Planhöhe ${d.height.toFixed(2)} m`:'Noch nicht kalibriert – Raumflächen werden erst nach Kalibrierung berechnet.'}
function renderRoomDetails(){const target=$('cs13Rooms');if(!target)return;const f=floor(),rs=current().rooms.filter(r=>r.floorId===f.id||(!r.floorId&&current().floors.length===1));if(!rs.length){target.innerHTML='<p class="muted">Noch keine Räume eingezeichnet.</p>';return}rs.forEach(r=>{const d=roomArea(r,f);r.areaM2=d===null?null:Math.round(d*100)/100});target.innerHTML=rs.map(r=>`<div class="cs13room"><div class="between"><b>${esc(r.name)}</b><span>${r.areaM2===null?'Nicht kalibriert':r.areaM2.toLocaleString('de-DE',{maximumFractionDigits:2})+' m²'}</span></div><label>Raumnummer</label><input data-room="${r.id}" data-field="roomNumber" value="${esc(r.roomNumber||'')}" placeholder="z. B. 1.02"><label>Planungshinweis</label><textarea data-room="${r.id}" data-field="plannerNotes" rows="2" placeholder="Hinweise für die Lichtplanung">${esc(r.plannerNotes||'')}</textarea></div>`).join('');target.querySelectorAll('[data-room]').forEach(el=>el.addEventListener('change',()=>{const r=current().rooms.find(r=>r.id===el.dataset.room);if(!r)return;r[el.dataset.field]=el.value;save()}))}
const previousRender=renderProject;
renderProject=function(){previousRender();roomStats()};
const previousComplete=completeFloorPlan;
completeFloorPlan=function(){const p=current();for(const r of p.rooms){const f=roomFloorById(r);if(f){const a=roomArea(r,f);r.areaM2=a===null?null:Math.round(a*100)/100}}previousComplete()};
// Refresh persisted area values after a vertex drag, new room, or floor switch.
const previousSave=save;
// The cloud adapter replaces save after this script runs, so do not wrap it.
window.cs13RefreshAreas=()=>{const p=current();if(!p)return;for(const r of p.rooms){const f=roomFloorById(r);if(!f)continue;const a=roomArea(r,f);r.areaM2=a===null?null:Math.round(a*100)/100}};
// Save area values at the same time as each cloud save by observing edits.
const oldRenderOverlay=renderPolygonOverlay;
renderPolygonOverlay=function(){oldRenderOverlay();window.cs13RefreshAreas()};
const oldFinish=finishPolygon;
finishPolygon=function(){oldFinish();window.cs13RefreshAreas();save()};
const oldUp=polygonPointerUp;
polygonPointerUp=function(e){oldUp(e);window.cs13RefreshAreas();save()};
// Supabase logout; no local-only mock logout.
async function logout(){const cloud=window.conceptCloud;if(!cloud?.client)return alert('Supabase-Verbindung ist nicht verfügbar.');if(cloud.busy||cloud.dirty)return alert('Änderungen werden noch gespeichert. Bitte warten, bis „In Supabase gespeichert“ erscheint.');const btn=$('cs13Logout');btn.disabled=true;btn.textContent='Melde ab …';try{const {error}=await cloud.client.auth.signOut();if(error)throw error;cloud.ready=false;cloud.user=null;cloud.profile=null;db={projects:[],current:null,library:[]};btn.textContent='Abmelden';}catch(err){alert('Abmelden fehlgeschlagen: '+(err.message||err));btn.textContent='Abmelden'}finally{btn.disabled=false}}
const btn=document.createElement('button');btn.id='cs13Logout';btn.className='cs13logout';btn.textContent='↪ Abmelden';btn.onclick=logout;const side=document.querySelector('.sidebar');side?.append(btn);
const style=document.createElement('style');style.textContent=`.cs13logout{background:#274338;color:#fff;border:1px solid #577063;margin-top:4px;text-align:left}.cs13logout:hover{background:#345745}.cs13tools{padding:13px;background:#f7faf7;border:1px solid #dce8de;border-radius:12px;margin-bottom:16px}.cs13tools h3{margin:8px 0}.cs13tools .row{margin:10px 0}.cs13tools button{font-size:12px;padding:8px}.cs13-calibrating{cursor:crosshair!important;outline:3px solid #32855d}.cs13room{padding:12px 0;border-bottom:1px solid #e0e9df}.cs13room input,.cs13room textarea{margin-top:3px}.cs13room label{margin-top:9px}`;document.head.append(style);
})();
