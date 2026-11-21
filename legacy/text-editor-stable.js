/* Concept Studio 1.6.2 – reliable text controls; keeps existing cloud integration. */
(()=>{'use strict';
const sheet=document.getElementById('sheet');if(!sheet)return;
const $=id=>document.getElementById(id);
const vget=()=>typeof variant==='function'?variant():null;
const isText=e=>e&&(e.type==='text'||e.type==='extra');
const value=(e,v)=>e.type==='text'?(v.text||''):(e.text||'');
const setValue=(e,v,s)=>{if(e.type==='text')v.text=s;else e.text=s;v.locked=true};
let editor=null, timer=null;
function saveSoon(){clearTimeout(timer);timer=setTimeout(()=>{try{save()}catch(e){console.error(e)}},600)}
function closeEditor(){if(!editor)return;const {area,e,v,node}=editor;editor=null;setValue(e,v,area.value);area.remove();node.style.visibility='';saveSoon();drawSheet()}
function startEditor(index){if(editor)closeEditor();const v=vget(),e=v?.elements?.[index],node=sheet.querySelector(`.element[data-index="${index}"]`);if(!isText(e)||!node)return;
 selected=index;
 const area=document.createElement('textarea');area.className='cs-stable-inline';area.value=value(e,v);
 const st=getComputedStyle(node);Object.assign(area.style,{position:'absolute',left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',zIndex:'1000',boxSizing:'border-box',resize:'none',padding:'4px',margin:'0',fontFamily:st.fontFamily,fontSize:(e.fontSize||15)+'px',fontWeight:e.bold?'700':'400',fontStyle:e.italic?'italic':'normal',color:e.color||'#222725',textAlign:e.align||'left',background:'#ffffff',border:'2px solid #28734b',outline:'none',lineHeight:'1.35'});
 node.style.visibility='hidden';sheet.appendChild(area);editor={area,e,v,node};
 area.addEventListener('input',()=>{setValue(e,v,area.value);saveSoon();const sidebar=$('cs-stable-text');if(sidebar&&document.activeElement!==sidebar)sidebar.value=area.value});
 area.addEventListener('blur',closeEditor);area.addEventListener('keydown',ev=>{ev.stopPropagation();if(ev.key==='Escape'){ev.preventDefault();area.blur()}});
 area.focus();area.setSelectionRange(area.value.length,area.value.length);
}
// Intercept the double click before legacy inline handlers start dragging/redrawing.
sheet.addEventListener('pointerdown',ev=>{if(ev.detail<2)return;const n=ev.target.closest('.element[data-index]');if(n&&isText(vget()?.elements?.[Number(n.dataset.index)])){ev.preventDefault();ev.stopImmediatePropagation()}},true);
sheet.addEventListener('dblclick',ev=>{const n=ev.target.closest('.element[data-index]');if(!n)return;const i=Number(n.dataset.index);if(!isText(vget()?.elements?.[i]))return;ev.preventDefault();ev.stopImmediatePropagation();startEditor(i)},true);
// Replace sidebar textarea input behavior: mutate model and visible text without rebuilding controls.
const priorControls=window.selectControls;
window.selectControls=function(i){if(editor)return;priorControls(i);const host=$('selectedControls'),v=vget(),e=v?.elements?.[i];if(!host||!isText(e))return;
 host.querySelectorAll('textarea').forEach(n=>n.remove());
 host.querySelectorAll('label').forEach(n=>{if(n.textContent.trim()==='Textinhalt')n.remove()});
 const label=document.createElement('label');label.textContent='Textinhalt bearbeiten';const area=document.createElement('textarea');area.id='cs-stable-text';area.rows=5;area.value=value(e,v);area.placeholder='Hier Text eingeben';
 area.addEventListener('input',()=>{setValue(e,v,area.value);const node=sheet.querySelector(`.element[data-index="${i}"]`);if(node){const textNode=[...node.childNodes].find(n=>n.nodeType===3);if(textNode)textNode.textContent=area.value;else node.insertBefore(document.createTextNode(area.value),node.firstChild)}saveSoon()});
 host.prepend(area);host.prepend(label);
 const del=document.createElement('button');del.type='button';del.textContent='Textfeld löschen';del.style.cssText='margin-top:8px;background:#fff2f0;color:#a12b25;border:1px solid #e8b6b2';del.onclick=()=>window.csStableDelete();host.appendChild(del);
};
window.csStableDelete=function(){if(editor)closeEditor();const v=vget(),i=selected;if(!v?.elements?.[i])return;v.elements.splice(i,1);selected=-1;v.locked=true;save();drawSheet()};
window.csStableAdd=function(){if(editor)closeEditor();const v=vget();if(!v)return;ensureElements();v.elements.push({type:'extra',text:'Neues Textfeld',x:100,y:160,w:340,h:85,fontSize:18,color:'#222725'});selected=v.elements.length-1;v.locked=true;save();drawSheet();startEditor(selected)};
window.cs16TextEdit=function(){if(selected>=0)startEditor(selected)};
// Replace legacy add/remove buttons without changing underlying persistence.
document.querySelectorAll('#editor .layoutbuttons button').forEach(b=>{const t=b.textContent.trim();if(t.includes('Textfeld')){b.onclick=window.csStableAdd}else if(t.includes('Element entfernen')){b.onclick=window.csStableDelete}});
const oldDraw=window.drawSheet;window.drawSheet=function(...args){if(editor){const a=editor.area;if(document.activeElement===a)return;closeEditor()}return oldDraw.apply(this,args)};
const css=document.createElement('style');css.textContent='.cs-stable-inline{white-space:pre-wrap;overflow:auto}#cs-stable-text{min-height:110px;line-height:1.4}';document.head.appendChild(css);
})();
