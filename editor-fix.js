/* Concept Studio 1.6.1 – stable text editing patch */
(function () {
  'use strict';
  const sheet = document.getElementById('sheet');
  if (!sheet) return;
  const activeVariant = () => typeof variant === 'function' ? variant() : null;
  const textFor = (e, v) => e.type === 'text' ? (v.text || '') : (e.text || '');
  let editing = null;
  let saveTimer = null;
  const queueSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { save(); } catch (err) { console.error('Speichern fehlgeschlagen', err); } }, 450);
  };
  const setModelText = (e, v, value) => {
    if (e.type === 'text') v.text = value;
    else e.text = value;
    v.locked = true;
    queueSave();
  };
  const updateNodeText = (index, value) => {
    const node = sheet.querySelector('.element[data-index="' + index + '"]');
    if (!node || node === editing?.node) return;
    // Preserve resize grips while updating visible text.
    [...node.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).forEach(n => n.remove());
    node.insertBefore(document.createTextNode(value), node.firstChild);
  };
  // The old sidebar handler recreated the whole sheet on every keystroke.
  window.editSelectedText11 = function (value) {
    const v = activeVariant(), index = selected, e = v?.elements?.[index];
    if (!e || !['text','extra'].includes(e.type)) return;
    setModelText(e, v, value);
    updateNodeText(index, value);
  };
  function finishEditing() {
    if (!editing) return;
    const {node, element, v} = editing;
    editing = null;
    const content = node.innerText.replace(/\n$/, '');
    node.contentEditable = 'false';
    node.classList.remove('cs16-editing');
    setModelText(element, v, content);
    const sidebar = document.querySelector('#selectedControls textarea');
    if (sidebar) sidebar.value = content;
  }
  function beginEditing(node, index) {
    const v = activeVariant(), element = v?.elements?.[index];
    if (!element || !['text','extra'].includes(element.type)) return;
    if (editing?.node === node) return;
    finishEditing();
    selected = index;
    node.classList.add('selected','cs16-editing');
    node.contentEditable = 'true';
    node.setAttribute('spellcheck','true');
    // Do not allow the resizing grip to become part of editable text.
    node.querySelectorAll('.cs16-grip,.resize-handle11').forEach(h => h.contentEditable='false');
    editing = {node,element,v};
    node.addEventListener('blur', finishEditing, {once:true});
    requestAnimationFrame(() => {
      node.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      const text = [...node.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
      if(text){range.selectNodeContents(text);range.collapse(false);selection.removeAllRanges();selection.addRange(range)}
    });
  }
  // Capture second pointer press BEFORE legacy startDrag() redraws the node.
  sheet.addEventListener('pointerdown', function(ev) {
    const node = ev.target.closest('.element[data-index]');
    if (!node) return;
    if (editing?.node === node) {ev.stopImmediatePropagation();return;}
    if (ev.detail >= 2 && !ev.target.closest('.cs16-grip,.resize-handle11')) {
      const index = Number(node.dataset.index);
      const e = activeVariant()?.elements?.[index];
      if (e && ['text','extra'].includes(e.type)) {
        ev.stopImmediatePropagation();
        beginEditing(node,index);
      }
    }
  }, true);
  sheet.addEventListener('dblclick', function(ev) {
    if (editing && editing.node.contains(ev.target)) ev.stopImmediatePropagation();
  }, true);
  // Prevent legacy click from rebuilding a contenteditable node.
  sheet.addEventListener('click', function(ev){
    if (editing && editing.node.contains(ev.target)) ev.stopImmediatePropagation();
  },true);
  sheet.addEventListener('keydown',function(ev){
    if (!editing) return;
    if (ev.key === 'Escape') {ev.preventDefault();editing.node.blur()}
    ev.stopPropagation();
  },true);
  // Keep the original 1.6 toolbar controls but avoid accidental selection loss
  // when typing into the sidebar or editing a text node.
  const priorDraw = window.drawSheet;
  window.drawSheet = function(...args){
    if(editing) finishEditing();
    return priorDraw.apply(this,args);
  };
  // Font / color controls update the actual selected element, then redraw.
  // The old 1.6 toolbar is retained; its cs16Text() persists settings.
  const priorText = window.cs16Text;
  window.cs16Text = function(key,value){
    if(editing) finishEditing();
    return priorText(key,value);
  };
  // Extra CSS makes resize handles visible even with an empty text box.
  const css=document.createElement('style');
  css.textContent='#sheet .element.textel.selected{min-height:28px;overflow:visible!important}#sheet .element.textel.selected .cs16-grip{display:block!important}#sheet .element.cs16-editing{user-select:text!important;-webkit-user-select:text!important;cursor:text!important}';
  document.head.appendChild(css);
})();
