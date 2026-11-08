/* Concept Studio 1.5 – Word-like image resize. Existing data format retained. */
(function () {
  'use strict';
  const css = document.createElement('style');
  css.textContent = `
    .sheet .element.image-resize15 { overflow:visible !important; }
    .sheet .element.image-resize15 > img { width:100%; height:100%; object-fit:contain !important; }
    .image-resize15 .resize-handle11 { display:none !important; }
    .image-resize15 .cs-resize-grip { position:absolute; width:13px; height:13px;
      border:2px solid #fff; background:#286b51; border-radius:3px; z-index:35;
      box-shadow:0 0 0 1px #286b51; touch-action:none; }
    .cs-resize-grip.nw { left:-7px; top:-7px; cursor:nwse-resize; }
    .cs-resize-grip.ne { right:-7px; top:-7px; cursor:nesw-resize; }
    .cs-resize-grip.sw { left:-7px; bottom:-7px; cursor:nesw-resize; }
    .cs-resize-grip.se { right:-7px; bottom:-7px; cursor:nwse-resize; }
    .cs-image-hint { font-size:11px; color:#637469; margin-top:7px; line-height:1.4; }
    @media print { .cs-resize-grip { display:none!important; } }
  `;
  document.head.append(css);

  function active() { try { return typeof variant === 'function' ? variant() : null; } catch (_) { return null; } }
  function ratioFor(e, v, node) {
    const im = (v.images || []).find(x => x.id === e.imageId);
    if (im && Number(im.naturalWidth)>0 && Number(im.naturalHeight)>0) return im.naturalWidth/im.naturalHeight;
    const img = node?.querySelector('img');
    if (img?.naturalWidth && img?.naturalHeight) {
      if (im) { im.naturalWidth=img.naturalWidth; im.naturalHeight=img.naturalHeight; }
      return img.naturalWidth/img.naturalHeight;
    }
    return Math.max(.05, Number(e.w)/Math.max(1,Number(e.h)));
  }
  function saveChange() { const v=active(); if(v) v.locked=true; if(typeof save==='function')save(); if(typeof drawSheet==='function')drawSheet(); }
  function resizeImage(e, width, height, anchor) {
    const ratio=e.csLockAspect===false ? null : e.csAspectRatio;
    const minW=36,minH=36;
    let w=Math.max(minW,width),h=Math.max(minH,height);
    if(ratio){w=Math.max(minW,minH*ratio,w);h=w/ratio;}
    // Keep image within the 840 x 594 page, including when resizing from left/top.
    const x0=anchor.x, y0=anchor.y;
    const maxW=anchor.fromLeft ? x0 : 840-x0;
    const maxH=anchor.fromTop ? y0 : 594-y0;
    if(ratio){const k=Math.min(1,maxW/w,maxH/h);w*=k;h*=k;}
    else {w=Math.min(w,maxW);h=Math.min(h,maxH);}
    e.w=Math.round(w*10)/10;e.h=Math.round(h*10)/10;
    e.x=Math.round((anchor.fromLeft ? x0-e.w : x0)*10)/10;
    e.y=Math.round((anchor.fromTop ? y0-e.h : y0)*10)/10;
  }
  function setupImage(node,i,e,v){
    node.classList.add('image-resize15');
    const img=node.querySelector('img');
    if(img){img.style.objectFit='contain';img.addEventListener('load',()=>{const im=(v.images||[]).find(x=>x.id===e.imageId);if(im){im.naturalWidth=img.naturalWidth;im.naturalHeight=img.naturalHeight;}},{once:true});}
    // Remove old unconstrained handle and its pointer callbacks.
    node.querySelectorAll('.resize-handle11').forEach(h=>h.remove());
    for(const corner of ['nw','ne','sw','se']){
      const grip=document.createElement('span');grip.className='cs-resize-grip '+corner;
      grip.title='Bild proportional vergrößern oder verkleinern';
      grip.addEventListener('pointerdown', ev=>{
        if(ev.button!==0)return;
        ev.preventDefault();ev.stopPropagation();
        if(typeof selected!=='undefined')selected=i;
        const ratio=ratioFor(e,v,node);
        e.csAspectRatio=ratio;
        if(e.csLockAspect===undefined)e.csLockAspect=true;
        const scale=document.getElementById('sheet').getBoundingClientRect().width/840;
        const start={clientX:ev.clientX,clientY:ev.clientY,x:e.x,y:e.y,w:e.w,h:e.h};
        const fromLeft=corner.includes('w'),fromTop=corner.includes('n');
        const anchor={x:fromLeft?start.x+start.w:start.x,y:fromTop?start.y+start.h:start.y,fromLeft,fromTop};
        // Use actual image ratio, not the former cropped frame ratio.
        let moved=false;
        grip.setPointerCapture(ev.pointerId);
        const onMove=mv=>{
          moved=true;
          const dx=(mv.clientX-start.clientX)/scale,dy=(mv.clientY-start.clientY)/scale;
          const rawW=start.w+(fromLeft?-dx:dx),rawH=start.h+(fromTop?-dy:dy);
          if(e.csLockAspect!==false){
            // The stronger of the two pointer movements drives proportional resizing.
            const dw=rawW-start.w,dh=rawH-start.h;
            const targetW=Math.abs(dw)>=Math.abs(dh*ratio)?rawW:start.w+dh*ratio;
            resizeImage(e,targetW,targetW/ratio,anchor);
          } else resizeImage(e,rawW,rawH,anchor);
          node.style.left=e.x+'px';node.style.top=e.y+'px';
          node.style.width=e.w+'px';node.style.height=e.h+'px';
        };
        const finish=()=>{
          grip.removeEventListener('pointermove',onMove);
          grip.removeEventListener('pointerup',finish);
          grip.removeEventListener('pointercancel',finish);
          if(moved)saveChange();else if(typeof selectControls==='function')selectControls(i);
        };
        grip.addEventListener('pointermove',onMove);
        grip.addEventListener('pointerup',finish);
        grip.addEventListener('pointercancel',finish);
      });
      node.appendChild(grip);
    }
  }
  const previousDraw=window.drawSheet;
  window.drawSheet=function(){
    previousDraw.apply(this,arguments);
    if(typeof page!=='undefined' && page!=='concept')return;
    const v=active(),sheet=document.getElementById('sheet');if(!v||!sheet)return;
    sheet.querySelectorAll('.element[data-index]').forEach(node=>{
      const i=Number(node.dataset.index),e=v.elements?.[i];
      if(e?.type==='image')setupImage(node,i,e,v);
    });
  };
  const previousSelectControls=window.selectControls;
  window.selectControls=function(i){
    previousSelectControls.apply(this,arguments);
    const e=active()?.elements?.[i],container=document.getElementById('selectedControls');
    if(e?.type!=='image'||!container)return;
    const block=document.createElement('div');
    block.innerHTML='<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="csAspectLock15" style="width:auto" checked> Seitenverhältnis beibehalten</label><div class="cs-image-hint">Bild an einer Ecke ziehen – wie in Word. Das Bild wird vollständig und ohne Verzerrung angezeigt.</div>';
    container.appendChild(block);
    const input=block.querySelector('input');input.checked=e.csLockAspect!==false;
    input.onchange=()=>{e.csLockAspect=input.checked;if(input.checked){const v=active();const node=document.querySelector('#sheet .element[data-index="'+i+'"]');e.csAspectRatio=ratioFor(e,v,node);e.h=Math.min(594-e.y,e.w/e.csAspectRatio);e.w=Math.min(e.w,(840-e.x),e.h*e.csAspectRatio);}saveChange();};
    // Original 'cover' option must not silently crop resized images.
    const fit=container.querySelector('select');if(fit){fit.value='contain';fit.disabled=true;fit.title='Bilder werden für proportionalen Zuschnitt vollständig angezeigt';}
  };
  const previousResize=window.resizeElement;
  window.resizeElement=function(k,val){
    const e=active()?.elements?.[typeof selected==='undefined'?-1:selected];
    if(e?.type!=='image')return previousResize.apply(this,arguments);
    const ratio=e.csAspectRatio||ratioFor(e,active(),document.querySelector('#sheet .element.selected'));
    e.csAspectRatio=ratio;
    const amount=Math.max(36,Number(val)||36);
    if(e.csLockAspect!==false){
      const w=k==='h'?amount*ratio:amount;
      resizeImage(e,w,w/ratio,{x:e.x,y:e.y,fromLeft:false,fromTop:false});
    }else{
      resizeImage(e,k==='w'?amount:e.w,k==='h'?amount:e.h,{x:e.x,y:e.y,fromLeft:false,fromTop:false});
    }
    saveChange();
  };
  const previousSetFit=window.setFit;
  window.setFit=function(val){
    const e=active()?.elements?.[typeof selected==='undefined'?-1:selected];
    if(e?.type==='image'){e.fit='contain';saveChange();return;}
    return previousSetFit.apply(this,arguments);
  };
})();
