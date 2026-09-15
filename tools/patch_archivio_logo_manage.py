from pathlib import Path

js = Path('archivio-logo.js')
s = js.read_text(encoding='utf-8')

old_select = "let path = 'logo_archive?select=id,business_name,thumb_path,file_size,uploaded_by_name,created_at&order=created_at.desc&limit=' + SEARCH_LIMIT;"
new_select = "let path = 'logo_archive?select=id,business_name,storage_path,thumb_path,file_size,uploaded_by_name,created_at&order=created_at.desc&limit=' + SEARCH_LIMIT;"
if old_select not in s and new_select not in s:
    raise SystemExit('listLogos select pattern not found')
s = s.replace(old_select, new_select)

old_copy = "      copy.append(name, meta);\n      card.append(thumb, copy);"
new_copy = """      const actions = document.createElement('div');
      actions.className = 'logo-actions';
      const renameBtn = document.createElement('button');
      renameBtn.type = 'button';
      renameBtn.className = 'logo-action logo-action-edit';
      renameBtn.textContent = 'Rinomina';
      renameBtn.setAttribute('aria-label', 'Rinomina ' + item.business_name);
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'logo-action logo-action-delete';
      deleteBtn.textContent = 'Elimina';
      deleteBtn.setAttribute('aria-label', 'Elimina ' + item.business_name);
      actions.append(renameBtn, deleteBtn);
      copy.append(name, meta, actions);
      card.append(thumb, copy);

      renameBtn.addEventListener('click', async () => {
        const proposed = window.prompt('Nuovo nome attività:', item.business_name);
        if (proposed === null) return;
        const nextName = proposed.trim().replace(/\\s+/g, ' ');
        if (nextName.length < 2) return setStatus('Inserisci un nome attività valido.', 'err');
        if (nextName.length > 120) return setStatus('Il nome è troppo lungo.', 'err');
        renameBtn.disabled = true;
        deleteBtn.disabled = true;
        try {
          const response = await TapNfc.rest('logo_archive?id=eq.' + encodeURIComponent(item.id), {
            method:'PATCH',
            headers:{ Prefer:'return=minimal' },
            body:JSON.stringify({ business_name:nextName })
          });
          await parseResponse(response, 'Rinomina non riuscita.');
          setStatus('Nome aggiornato correttamente.', 'ok');
          await refresh(searchInput.value);
        } catch (err) {
          console.error(err);
          setStatus(err.message || 'Rinomina non riuscita.', 'err');
          renameBtn.disabled = false;
          deleteBtn.disabled = false;
        }
      });

      deleteBtn.addEventListener('click', async () => {
        const confirmed = window.confirm('Eliminare definitivamente "' + item.business_name + '" dall’Archivio Logo?\\n\\nQuesta operazione non modifica eventuali pagine cliente già create.');
        if (!confirmed) return;
        renameBtn.disabled = true;
        deleteBtn.disabled = true;
        try {
          const response = await TapNfc.rest('logo_archive?id=eq.' + encodeURIComponent(item.id), {
            method:'DELETE',
            headers:{ Prefer:'return=minimal' }
          });
          await parseResponse(response, 'Eliminazione non riuscita.');
          await Promise.all([deleteObject(item.storage_path), deleteObject(item.thumb_path)]);
          signedUrlCache.delete(item.thumb_path);
          signedUrlCache.delete(item.storage_path);
          setStatus('Logo eliminato correttamente dall’archivio.', 'ok');
          await refresh(searchInput.value);
        } catch (err) {
          console.error(err);
          setStatus(err.message || 'Eliminazione non riuscita.', 'err');
          renameBtn.disabled = false;
          deleteBtn.disabled = false;
        }
      });"""
if old_copy not in s and "logo-action-edit" not in s:
    raise SystemExit('renderRows insertion pattern not found')
s = s.replace(old_copy, new_copy)
js.write_text(s, encoding='utf-8')

css = Path('archivio-logo.css')
c = css.read_text(encoding='utf-8')
marker = '/* LOGO ARCHIVE MANAGEMENT */'
if marker not in c:
    c += """

/* LOGO ARCHIVE MANAGEMENT */
.logo-actions{display:flex;gap:7px;margin-top:11px;padding-top:10px;border-top:1px solid #e8edf4}
.logo-action{flex:1;min-width:0;height:34px;border-radius:10px;font:inherit;font-size:10px;font-weight:900;cursor:pointer;transition:transform .12s ease,opacity .12s ease}
.logo-action:active{transform:scale(.97)}
.logo-action:disabled{opacity:.5;cursor:not-allowed}
.logo-action-edit{border:1px solid #bfd3f4;background:#f1f6ff;color:#155fcf}
.logo-action-delete{border:1px solid #efc6cb;background:#fff2f3;color:#a52636}
@media(max-width:430px){.logo-actions{gap:5px}.logo-action{height:32px;font-size:9.5px}}
"""
    css.write_text(c, encoding='utf-8')

html = Path('archivio-logo.html')
h = html.read_text(encoding='utf-8')
h = h.replace('archivio-logo.css?v=1', 'archivio-logo.css?v=2')
h = h.replace('archivio-logo.js?v=1', 'archivio-logo.js?v=2')
html.write_text(h, encoding='utf-8')
