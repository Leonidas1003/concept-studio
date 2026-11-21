/* Concept Studio 1.4 – precise floor tools, no browser persistence */
(() => {
'use strict';
const $ = id => document.getElementById(id);
let zoom = 100, showLabels = true, showGrid = false, checkPoints = [], lastGeometry = null;
const pts = r => getPoints(r);
const calc = (r,f) => {
  const c=f?.calibration;
  if(!c?.widthM||!c?.heightM)return null;
  const a=pts(r);if(a.length<3)return null;
  let signed=0,perimeter=0;
  for(let i=0;i<a.length;i++){
    const u=a[i],v=a[(i+1)%a.length];
    signed+=u.x*v.y-v.x*u.y;
    perimeter+=Math.hypot((v.x-u.x)*c.widthM/100,(v.y-u.y)*c.heightM/100);
  }
  return {area:Math.abs(signed)*c.widthM*c.heightM/20000, perimeter};
};
function seg(a,b,c,d){
 const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
 const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);
 return ab1*ab2<0&&cd1*cd2<0;
}
function selfIntersects(p){
 for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
  if(Math.abs(i-j)<=1||(i===0&&j===p.length-1))continue;
  if(seg(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))return true;
 }return false;
}
function refresh(){
 const p=current();if(!p)return;
 for(const r of p.rooms||[]){const f=(p.floors||[]).find(x=>x.id===r.floorId);const d=calc(r,f);r.areaM2=d?Math.round(d.area*100)/100:null;r.perimeterM=d?Math.round(d.perimeter*100)/100:null;}
}
window.cs13RefreshAreas=refresh;
function drawGrid(){
 const canvas=$('floorCanvas');if(!canvas)return;
 canvas.querySelector('.cs14-grid')?.remove();
 if(!showGrid)return;
 const f=floor(),c=f?.calibration;
 if(!c?.widthM||!c?.heightM)return;
 const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('class','cs14-grid');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');
 function line(x1,y1,x2,y2){const el=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1,y1,x2,y2}))el.setAttribute(k,v);svg.append(el)}
 const nx=Math.ceil(c.widthM),ny=Math.ceil(c.heightM);
 if(nx+ny>500)return;
 for(let i=0;i<=nx;i++)line(i/c.widthM*100,0,i/c.widthM*100,100);
 for(let i=0;i<=ny;i++)line(0,i/c.heightM*100,100,i/c.heightM*100);
 canvas.append(svg);
}
function adjustLabels(){const canvas=$('floorCanvas');if(!canvas)return;canvas.querySelectorAll('.poly-label').forEach(el=>el.style.display=showLabels?'':'none')}
function applyZoom(){
 const canvas=$('floorCanvas');if(!canvas)return;
 let viewport=canvas.parentElement;
 if(!viewport.classList.contains('cs14-viewport')){
  viewport=document.createElement('div');viewport.className='cs14-viewport';canvas.parentNode.insertBefore(viewport,canvas);viewport.append(canvas);
 }
 canvas.style.width=zoom+'%';canvas.style.maxWidth='none';
 drawGrid();adjustLabels();
}
function calibrationError(){
 const f=floor(),c=f?.calibration;if(!c)return 'Noch nicht kalibriert';
 return `Plan: ${c.widthM.toFixed(3)} × ${c.heightM.toFixed(3)} m · ${((c.widthM*100)/($('floorCanvas')?.querySelector('img')?.naturalWidth||1)).toFixed(4)} m/100 Bildpixel`;
}
function measuredDistance(a,b,f){const c=f.calibration;return Math.hypot((b.x-a.x)*c.widthM/100,(b.y-a.y)*c.heightM/100)}
function checkClick(e){
 e.preventDefault();e.stopImmediatePropagation();const el=$('floorCanvas');checkPoints.push(pctPoint(e,el));
 if(checkPoints.length<2)return;
 el.removeEventListener('pointerdown',checkClick,true);el.classList.remove('cs14-measuring');
 const [a,b]=checkPoints;checkPoints=[];
 const measured=measuredDistance(a,b,floor());
 const entered=prompt(`Gemessene Länge: ${measured.toFixed(3)} m\nWie lang ist diese Strecke tatsächlich in Metern?`);
 if(entered===null)return;
 const actual=Number(entered.replace(',','.'));if(!Number.isFinite(actual)||actual<=0)return alert('Ungültige Länge.');
 const deviation=(measured-actual)/actual*100;
 alert(`Kontrollmessung:\nSoll: ${actual.toFixed(3)} m\nIst: ${measured.toFixed(3)} m\nAbweichung: ${deviation.toFixed(2)} %\n\nBei deutlichen Abweichungen bitte erneut kalibrieren.`);
}
function renderTools(){
 const p=current(),canvas=$('floorCanvas'),side=$('stepSide');if(!p||p.step!==2||!side)return;
 const old=$('cs14Tools');old?.remove();
 const f=floor();if(!f)return;
 const el=document.createElement('section');el.id='cs14Tools';el.className='cs14-tools';
 el.innerHTML=`<h3>Präzisionswerkzeuge</h3><p class="muted">Kalibrierung: <strong id="cs14MeasureStatus"></strong></p><div class="cs14-toolbar"><button type="button" id="cs14Check">Kontrollstrecke messen</button><button type="button" id="cs14Grid">${showGrid?'Raster ausblenden':'1-m-Raster anzeigen'}</button><button type="button" id="cs14Labels">${showLabels?'Raumnamen ausblenden':'Raumnamen anzeigen'}</button></div><div class="cs14-toolbar"><button type="button" id="cs14Minus">−</button><span id="cs14ZoomLabel">${zoom}%</span><button type="button" id="cs14Plus">+</button><button type="button" id="cs14ResetZoom">100 %</button></div><p class="muted">Zoom vergrößert nur die Ansicht, nicht den Maßstab. Auf kleinen Bildschirmen im Planbereich scrollen.</p><h3>Raumgeometrie</h3><div id="cs14RoomMetrics"></div>`;
 side.prepend(el);
 $('cs14MeasureStatus').textContent=calibrationError();
 $('cs14Check').disabled=!f.calibration||!canvas;
 $('cs14Check').onclick=()=>{if(!canvas)return;checkPoints=[];canvas.classList.add('cs14-measuring');canvas.addEventListener('pointerdown',checkClick,true);alert('Bitte zwei Punkte auf einer bekannten Kontrollstrecke im Grundriss anklicken.')};
 $('cs14Grid').onclick=()=>{showGrid=!showGrid;renderProject()};
 $('cs14Labels').onclick=()=>{showLabels=!showLabels;renderProject()};
 $('cs14Minus').onclick=()=>{zoom=Math.max(100,zoom-25);applyZoom();$('cs14ZoomLabel').textContent=zoom+'%'};
 $('cs14Plus').onclick=()=>{zoom=Math.min(300,zoom+25);applyZoom();$('cs14ZoomLabel').textContent=zoom+'%'};
 $('cs14ResetZoom').onclick=()=>{zoom=100;applyZoom();$('cs14ZoomLabel').textContent='100%'};
 const rs=p.rooms.filter(r=>r.floorId===f.id);
 $('cs14RoomMetrics').innerHTML=rs.length?rs.map(r=>{const g=calc(r,f);return `<div class="cs14-room"><strong>${esc(r.name)}</strong><span>${g?g.area.toFixed(2)+' m² · Umfang '+g.perimeter.toFixed(2)+' m':'Kalibrierung fehlt'}</span>${selfIntersects(pts(r))?'<span class="cs14-warning">⚠ Polygon überschneidet sich selbst</span>':''}<button type="button" data-select="${esc(r.id)}">Raum auswählen</button></div>`}).join(''):'<p class="muted">Noch keine Räume definiert.</p>';
 $('cs14RoomMetrics').querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{roomId=b.dataset.select;renderProject()});
 applyZoom();
}
const oldRender=renderProject;
renderProject=function(){oldRender();renderTools()};
const oldFinish=finishPolygon;
finishPolygon=function(){
 if(polygonDraft.length>=3&&selfIntersects(polygonDraft))return alert('Die Raumkontur überschneidet sich selbst. Bitte Eckpunkte korrigieren.');
 oldFinish();refresh();
};
const oldPointerUp=polygonPointerUp;
polygonPointerUp=function(e){
 const r=vertexMove&&current()?.rooms.find(x=>x.id===vertexMove.id);
 if(r&&selfIntersects(pts(r))){alert('Die Raumkontur darf sich nicht selbst überschneiden. Bitte den Eckpunkt erneut verschieben.');}
 oldPointerUp(e);refresh();
};
const style=document.createElement('style');style.textContent=`.cs14-tools{border:1px solid #dce6de;border-radius:12px;padding:12px;margin-bottom:14px;background:#f8faf8}.cs14-toolbar{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;align-items:center}.cs14-toolbar button,.cs14-room button{padding:7px 9px;font-size:12px}.cs14-viewport{width:100%;max-height:650px;overflow:auto;border-radius:12px}.cs14-viewport .floorcanvas{min-height:0}.cs14-grid{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}.cs14-grid line{stroke:#14845d;stroke-width:.18;opacity:.5;vector-effect:non-scaling-stroke}.cs14-measuring{cursor:crosshair!important;outline:3px solid #318b6b}.cs14-room{display:flex;flex-direction:column;gap:5px;padding:9px 0;border-bottom:1px solid #e3e8e4}.cs14-room span{font-size:12px}.cs14-warning{color:#a44b24;font-weight:700}`;document.head.append(style);
})();
