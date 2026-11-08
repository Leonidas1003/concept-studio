/* Concept Studio 1.7: faithful, editable PPTX export based on actual rendered sheet.
   Does not change auth, project persistence, or existing PDF print workflow. */
(function(){
'use strict';
const W=840,H=594,SW=11.6929,SH=8.2677;
const sx=x=>x*SW/W, sy=y=>y*SH/H;
const finite=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const safeName=s=>String(s||'Lichtkonzept').replace(/[\\/:*?"<>|]/g,'-').slice(0,100);
function bounds(node, sheet){
 const a=node.getBoundingClientRect(),b=sheet.getBoundingClientRect();
 const kx=W/b.width,ky=H/b.height;
 return {x:(a.left-b.left)*kx,y:(a.top-b.top)*ky,w:a.width*kx,h:a.height*ky};
}
function visible(node){const s=getComputedStyle(node);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0;}
function hexColor(css,fallback='242824'){
 const m=String(css||'').match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
 if(m)return m.slice(1,4).map(v=>Number(v).toString(16).padStart(2,'0')).join('').toUpperCase();
 const h=String(css||'').match(/#([\da-f]{6})/i);return h?h[1].toUpperCase():fallback;
}
async function imageData(src){
 if(!src)return null;
 if(src.startsWith('data:image/'))return src;
 try{
  const res=await fetch(src,{mode:'cors'});if(!res.ok)throw Error('HTTP '+res.status);
  const blob=await res.blob();if(!blob.type.startsWith('image/'))return null;
  return await new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(rd.result);rd.onerror=reject;rd.readAsDataURL(blob)});
 }catch(e){console.warn('Bild nicht exportierbar:',src,e);return null;}
}
function addText(sl,node,rect){
 const t=(node.innerText||node.textContent||'').trim();if(!t)return;
 const st=getComputedStyle(node),fs=finite(parseFloat(st.fontSize),15);
 const pad=finite(parseFloat(st.paddingLeft));
 sl.addText(t,{x:sx(rect.x+pad),y:sy(rect.y),w:Math.max(.06,sx(rect.w-pad*2)),h:Math.max(.05,sy(rect.h)),
  fontFace:st.fontFamily.split(',')[0].replace(/["']/g,'')||'Arial',fontSize:Math.max(6,fs*.75),
  color:hexColor(st.color),bold:parseInt(st.fontWeight,10)>=600,italic:st.fontStyle==='italic',
  align:st.textAlign==='center'?'center':st.textAlign==='right'?'right':'left',
  breakLine:false,margin:0,vertAlign:'top',transparency:0});
}
async function addImage(sl,node,rect,missing){
 const src=node.currentSrc||node.getAttribute('src');let data=await imageData(src);
 if(!data){missing.push(src||'unbekannt');return;}
 try{
  const st=getComputedStyle(node),fit=st.objectFit;
  let opts={data,x:sx(rect.x),y:sy(rect.y),w:sx(rect.w),h:sy(rect.h)};
  if(fit==='contain')opts.sizingContain=true;
  // Preserve visual image box and editability. PowerPoint's own image fit may vary.
  sl.addImage(opts);
 }catch(e){missing.push(src||'unbekannt');console.warn(e)}
}
async function addSheet(sl,sheet,missing){
 sl.background={color:'FFFFFF'};
 // Preserve DOM paint order, but only export leaf text nodes and actual images.
 const nodes=[...sheet.querySelectorAll('*')];
 for(const node of nodes){
  if(!visible(node)||node.closest('.resize-handle, .image-resize-handle, .editor-handle'))continue;
  const rect=bounds(node,sheet);
  if(rect.w<1||rect.h<1||rect.x>W||rect.y>H||rect.x+rect.w<0||rect.y+rect.h<0)continue;
  const tag=node.tagName.toLowerCase();
  if(tag==='img'){await addImage(sl,node,rect,missing);continue;}
  if(tag==='svg')continue;
  if(node.children.length===0&&node.textContent.trim())addText(sl,node,rect);
  // Lines in the sheet are CSS borders, so export them as editable PPTX shapes.
  if(node.classList.contains('ruleleft'))sl.addShape('line',{x:sx(62),y:0,w:0,h:SH,line:{color:'555555',width:.7}});
  if(node.classList.contains('rulebottom'))sl.addShape('line',{x:0,y:sy(537),w:SW,h:0,line:{color:'555555',width:.7}});
 }
}
async function exportFaithful17(){
 if(typeof pptxgen==='undefined'){alert('PowerPoint-Bibliothek konnte nicht geladen werden.');return;}
 const p=current();if(!p){alert('Bitte zuerst ein Projekt auswählen.');return;}
 const btn=document.querySelector('#exportPptx17');if(btn){btn.disabled=true;btn.textContent='PowerPoint wird erstellt …';}
 const savedRoom=roomId,savedPage=page,savedSelected=selected;
 const ids=(p.rooms||[]).map(r=>r.activePageId),pptx=new pptxgen(),missing=[];
 pptx.defineLayout({name:'A4L',width:SW,height:SH});pptx.layout='A4L';
 pptx.author='Die Lichtgestalter';pptx.subject='Lichtkonzept';pptx.title=p.name||'Lichtkonzept';
 try{
  const pages=[{kind:'cover'},{kind:'overview'},{kind:'projectintro'}];
  for(const r of p.rooms||[]){normalizePages(r);for(const v of r.variants||[])pages.push({kind:'concept',room:r,variant:v});}
  pages.push({kind:'last'});
  for(const item of pages){
   page=item.kind;if(item.room){roomId=item.room.id;item.room.activePageId=item.variant.id;}
   selected=-1;drawSheet();
   const sheet=document.getElementById('sheet');
   if(!sheet)throw Error('Konzeptseite konnte nicht gerendert werden');
   await addSheet(pptx.addSlide(),sheet,missing);
  }
  const blob=await pptx.write({outputType:'blob'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=safeName(p.name)+'-Lichtkonzept.pptx';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  if(missing.length)alert('PowerPoint wurde erstellt. '+missing.length+' Bild(er) konnten nicht eingebettet werden. Bitte die Präsentation kontrollieren.');
 }catch(e){console.error('PPTX export',e);alert('PowerPoint-Export fehlgeschlagen: '+e.message);}
 finally{
  (p.rooms||[]).forEach((r,i)=>r.activePageId=ids[i]);roomId=savedRoom;page=savedPage;selected=savedSelected;drawSheet();
  if(btn){btn.disabled=false;btn.textContent='PowerPoint (.pptx)';}
 }
}
window.exportPptx11=exportFaithful17;
// Existing PDF print uses the same live layout. Add an export shortcut next to PDF.
function install(){
 const editor=document.querySelector('#editor .between .row');if(!editor)return;
 if(!document.getElementById('exportPptx17')){
  const b=document.createElement('button');b.id='exportPptx17';b.textContent='PowerPoint (.pptx)';b.onclick=exportFaithful17;editor.appendChild(b);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
