/* Concept Studio 2.0 — no required physical room; deterministic project switching. */
(function(){'use strict';
function realRooms(p){return (p?.rooms||[]).filter(r=>!r.csVirtual20)}
window.csEnsureConceptWorkspace20=function(p){
 if(!p)return null;p.rooms??=[];
 let r=p.rooms.find(x=>x.csVirtual20);
 if(!r){r={id:uid(),name:'Freies Lichtkonzept',csVirtual20:true,notes:'',variants:[{id:uid(),title:'Leuchten & Moodboard',text:'',images:[],positions:[],elements:[],locked:true}]};p.rooms.push(r)}
 if(!r.variants?.length)r.variants=[{id:uid(),title:'Leuchten & Moodboard',text:'',images:[],positions:[],elements:[],locked:true}];
 return r;
};
function normalizeProject(p){if(!p)return;p.rooms??=[];if(p.withoutFloorplan19){const r=csEnsureConceptWorkspace20(p);roomId=r.id;}}
// Replace the old no-floorplan action, which previously created an ordinary room.
window.csStartWithoutFloor19=function(){const p=current();if(!p)return;p.withoutFloorplan19=true;p.floorPlanReady=true;p.step=3;p.stage=2;const r=csEnsureConceptWorkspace20(p);roomId=r.id;page='concept';selected=-1;save();go('editor')};
// Keep project ID, selected room and selected page tied to the card clicked.
const baseOpen=openProject;
openProject=function(id){const p=db.projects.find(x=>x.id===id);if(!p){alert('Projekt nicht gefunden. Bitte die Übersicht neu laden.');return}db.current=p.id;roomId=null;page='concept';selected=-1;normalizeProject(p);baseOpen(p.id);if(db.current!==p.id)db.current=p.id;renderProject()};
const baseGo=go;
go=function(where){const p=current();if(!p){if(where!=='dashboard'){baseGo('dashboard');return}baseGo(where);return}if(where==='editor'){normalizeProject(p);if(!p.rooms.length){const r=csEnsureConceptWorkspace20(p);roomId=r.id}if(!p.rooms.some(r=>r.id===roomId))roomId=p.rooms[0].id;}baseGo(where);if(where==='editor')hideVirtualRoomUI(p)};
function hideVirtualRoomUI(p){const sel=document.getElementById('editorRoom');if(!sel)return;const visible=realRooms(p);if(!visible.length){sel.style.display='none';const label=sel.previousElementSibling;if(label?.tagName==='LABEL')label.style.display='none'}else{sel.style.display='';const label=sel.previousElementSibling;if(label?.tagName==='LABEL')label.style.display='';}}
const oldRenderEditor=renderEditor;
renderEditor=function(){const p=current();if(!p)return;normalizeProject(p);if(!p.rooms.length){const r=csEnsureConceptWorkspace20(p);roomId=r.id}if(!p.rooms.some(r=>r.id===roomId))roomId=p.rooms[0].id;oldRenderEditor();hideVirtualRoomUI(p)};
// Project dashboard must not show the internal page workspace as a physical room.
const baseDashboard=renderDashboard;
renderDashboard=function(){baseDashboard();document.querySelectorAll('.projectcard').forEach(card=>{const id=card.getAttribute('onclick')?.match(/openProject\('([^']+)'\)/)?.[1];const p=db.projects.find(x=>x.id===id);if(!p)return;const small=card.querySelector('small');if(small)small.textContent=(p.client||'Kein Kunde')+' · '+realRooms(p).length+' Räume'})};
// Projects without floorplans can start at any point; no room prerequisite.
const oldStart=startConceptPhase;
startConceptPhase=function(){const p=current();if(!p)return;if(!realRooms(p).length){csStartWithoutFloor19();return}oldStart()};
const oldComplete=completeFloorPlan;
completeFloorPlan=function(){const p=current();if(p&&!realRooms(p).length){csStartWithoutFloor19();return}oldComplete()};
const oldRenderProject=renderProject;
renderProject=function(){const p=current();if(!p)return;oldRenderProject();if(!realRooms(p).length){const side=document.getElementById('stepSide');if(side&&!side.querySelector('#cs-free-start20')){const box=document.createElement('div');box.id='cs-free-start20';box.className='note';box.innerHTML='<strong>Ohne Grundriss und ohne Raum starten</strong><p>Direkt ein freies Lichtkonzept mit Moodbildern und Leuchten gestalten.</p><button type="button" class="primary" onclick="csStartWithoutFloor19()">Freies Lichtkonzept öffnen →</button>';side.appendChild(box)}}};
// The old concept-mode helper must never add a second, regular room.
// Ensure the internal workspace is not confused with user-defined rooms.
const oldUseFloor=window.csUseFloor19;
window.csUseFloor19=function(){const p=current();if(p){p.withoutFloorplan19=false;p.rooms=(p.rooms||[]).filter(r=>!r.csVirtual20);roomId=null}oldUseFloor?.()};
})();