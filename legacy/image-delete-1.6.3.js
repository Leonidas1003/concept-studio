/* Concept Studio 1.6.3 — remove selected image from page and its page image collection. */
(()=>{'use strict';
const controls=document.getElementById('selectedControls');
if(!controls)return;
function removeSelected(){
 const v=typeof variant==='function'?variant():null;
 const i=typeof selected==='number'?selected:-1;
 if(!v||!Array.isArray(v.elements)||i<0||i>=v.elements.length)return;
 const el=v.elements[i];
 if(el.type==='image'){
   const id=el.imageId;
   // Remove the source only if no other element on this page references it.
   v.elements.splice(i,1);
   if(Array.isArray(v.images)&&!v.elements.some(e=>e.type==='image'&&e.imageId===id)){
     v.images=v.images.filter(im=>im.id!==id);
   }
 }else{
   v.elements.splice(i,1);
 }
 selected=-1;v.locked=true;
 save();drawSheet();
}
window.csRemoveSelected163=removeSelected;
// Existing toolbar button and the text editor's removal action use the same safe deletion.
window.deleteSelected=removeSelected;
window.csStableDelete=removeSelected;
const toolbar=[...document.querySelectorAll('#editor .layoutbuttons button')].find(b=>b.textContent.includes('Element entfernen'));
if(toolbar)toolbar.onclick=removeSelected;
// The selected-element panel is rebuilt by existing code; update its button after each render.
function refreshButton(){
 const v=typeof variant==='function'?variant():null;
 const el=v?.elements?.[typeof selected==='number'?selected:-1];
 let b=document.getElementById('cs-image-delete-163');
 if(!el||el.type!=='image'){if(b)b.remove();return}
 if(!b){b=document.createElement('button');b.id='cs-image-delete-163';b.type='button';b.textContent='Bild löschen';b.style.cssText='margin-top:10px;width:100%;border:1px solid #e8b6b2;background:#fff2f0;color:#a12b25';b.addEventListener('click',removeSelected)}
 if(b.parentElement!==controls)controls.appendChild(b);
}
const prior=window.selectControls;
window.selectControls=function(...args){const result=prior.apply(this,args);refreshButton();return result};
refreshButton();
})();
