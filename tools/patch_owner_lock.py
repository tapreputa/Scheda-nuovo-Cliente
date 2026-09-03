from pathlib import Path
import re

p = Path('clienti.html')
text = p.read_text(encoding='utf-8')
original = text

text = text.replace(
    ".metric-input.money{width:68px}.metric-input:disabled{background:#edf1ef;color:#9aa5a1;border-color:#d8e0dd;cursor:not-allowed;opacity:1}.metric-input:focus",
    ".metric-input.money{width:68px}.metric-input:disabled,.status-select:disabled,.name-btn:disabled,.delete-row:disabled,.action:disabled{background:#edf1ef!important;color:#9aa5a1!important;border-color:#d8e0dd!important;cursor:not-allowed!important;opacity:.72}.name-btn:disabled{font-weight:850}.metric-input:focus",
    1,
)

marker = "function getClient(uuid){return clienti.find(c=>c.id===uuid)}"
if marker not in text:
    raise SystemExit('getClient non trovato')
text = text.replace(marker, marker + "\nfunction isOwner(c){return !!(c&&user&&c.created_by===user.id)}", 1)

new_bind = r'''function bindRows(){
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openClient(b.dataset.open));
  document.querySelectorAll('[data-link]').forEach(b=>b.onclick=()=>openLink(b.dataset.id,b.dataset.link));
  document.querySelectorAll('[data-rename]').forEach(b=>{
    const c=getClient(b.dataset.rename);
    if(!isOwner(c)){b.disabled=true;b.title='Solo '+(c?.operatore||'l’operatore che ha creato il cliente')+' può modificare questa riga.';return}
    b.onclick=()=>renameClient(b.dataset.rename);
  });
  document.querySelectorAll('[data-delete]').forEach(b=>{
    const c=getClient(b.dataset.delete);
    if(!isOwner(c)){b.disabled=true;b.title='Solo '+(c?.operatore||'l’operatore che ha creato il cliente')+' può eliminare questo cliente.';return}
    b.onclick=()=>deleteById(b.dataset.delete);
  });
  document.querySelectorAll('[data-status]').forEach(s=>{
    const c=getClient(s.dataset.status);
    if(!isOwner(c)){s.disabled=true;s.title='Riga in sola lettura: cliente di '+(c?.operatore||'altro operatore')+'.';return}
    s.onchange=()=>patchField(s.dataset.status,'stato',s.value);
  });
  document.querySelectorAll('[data-field]').forEach(i=>{
    const c=getClient(i.dataset.id);
    if(!isOwner(c)){i.disabled=true;i.title='Riga in sola lettura: cliente di '+(c?.operatore||'altro operatore')+'.';return}
    i.onchange=()=>{const f=i.dataset.field;let v=Number(i.value||0);if(!Number.isFinite(v))v=0;v=f==='spesa'?Math.max(0,Math.round(v*100)/100):Math.max(0,Math.floor(v));i.value=v;patchField(i.dataset.id,f,v)};
  });
}'''
text, n = re.subn(r"function bindRows\(\)\{.*?\n\}\nasync function patchField", new_bind + "\nasync function patchField", text, count=1, flags=re.S)
if n != 1:
    raise SystemExit('bindRows non sostituita')

text = text.replace(
    "async function patchField(uuid,field,value){\n  try{",
    "async function patchField(uuid,field,value){\n  const c=getClient(uuid);if(!isOwner(c))return notice('Questo cliente appartiene a '+(c?.operatore||'un altro operatore')+': modifica non consentita.',true);\n  try{",
    1,
)
text = text.replace(
    "async function renameClient(uuid){\n  const c=getClient(uuid);if(!c)return;",
    "async function renameClient(uuid){\n  const c=getClient(uuid);if(!c)return;if(!isOwner(c))return notice('Solo '+(c.operatore||'l’operatore proprietario')+' può modificare questo cliente.',true);",
    1,
)

old_open = "function openClient(uuid){const c=getClient(uuid);if(!c)return;currentId=uuid;mName.textContent=c.nome||'';mId.textContent=displayId(c);mOperator.textContent=c.operatore||'-';mCategory.textContent=c.categoria||'-';mPlace.textContent=c.place_id||'-';mReview.textContent=c.link_recensioni||'-';mNfc.textContent=c.link_nfc||'-';mDate.textContent=dateIt(c.created_at);mStatus.textContent=c.stato||'-';overlay.classList.add('show')}"
new_open = "function openClient(uuid){const c=getClient(uuid);if(!c)return;currentId=uuid;mName.textContent=c.nome||'';mId.textContent=displayId(c);mOperator.textContent=c.operatore||'-';mCategory.textContent=c.categoria||'-';mPlace.textContent=c.place_id||'-';mReview.textContent=c.link_recensioni||'-';mNfc.textContent=c.link_nfc||'-';mDate.textContent=dateIt(c.created_at);mStatus.textContent=c.stato||'-';const owner=isOwner(c);const editBtn=document.getElementById('edit'),deleteBtn=document.getElementById('delete');editBtn.disabled=!owner;deleteBtn.disabled=!owner;editBtn.title=owner?'':'Solo '+(c.operatore||'l’operatore proprietario')+' può modificare questo cliente.';deleteBtn.title=owner?'':'Solo '+(c.operatore||'l’operatore proprietario')+' può eliminare questo cliente.';overlay.classList.add('show')}"
if old_open not in text:
    raise SystemExit('openClient non trovato')
text = text.replace(old_open, new_open, 1)

text = text.replace(
    "async function deleteById(uuid){const c=getClient(uuid);if(!c)return;if(!confirm(`Eliminare definitivamente ID ${displayId(c)} — ${c.nome}?`))return;",
    "async function deleteById(uuid){const c=getClient(uuid);if(!c)return;if(!isOwner(c))return notice('Solo '+(c.operatore||'l’operatore proprietario')+' può eliminare questo cliente.',true);if(!confirm(`Eliminare definitivamente ID ${displayId(c)} — ${c.nome}?`))return;",
    1,
)

old_edit = "document.getElementById('edit').onclick=()=>{const c=getClient(currentId);if(!c)return;const p=new URLSearchParams();"
new_edit = "document.getElementById('edit').onclick=()=>{const c=getClient(currentId);if(!c)return;if(!isOwner(c))return notice('Solo '+(c.operatore||'l’operatore proprietario')+' può modificare questo cliente.',true);const p=new URLSearchParams();"
if old_edit not in text:
    raise SystemExit('handler edit non trovato')
text = text.replace(old_edit, new_edit, 1)

if text == original:
    raise SystemExit('Nessuna modifica applicata')
p.write_text(text, encoding='utf-8')
