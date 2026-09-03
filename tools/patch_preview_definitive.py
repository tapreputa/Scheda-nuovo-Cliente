from pathlib import Path

p = Path('personalizza.html')
text = p.read_text(encoding='utf-8')
original = text

shared_landscape = r'''@media (orientation:landscape) and (max-height:680px){.pagina{min-height:100dvh;align-items:center;padding:10px 16px 46px}.card{width:min(100%,900px);display:grid;grid-template-columns:minmax(125px,.58fr) minmax(0,1.42fr);grid-template-areas:"logo eyebrow" "logo message" "logo button" "logo stars";align-items:center;column-gap:20px;row-gap:8px;padding:0}.logo{grid-area:logo;width:min(220px,100%);max-height:min(29vh,116px);margin:0 auto;padding:6px 9px;border-radius:17px}.eyebrow{grid-area:eyebrow;margin:0;font-size:12px;line-height:1.2;letter-spacing:.12em}.messaggio-box{grid-area:message;margin:0;padding:9px 12px;border-radius:14px}.messaggio{font-size:14px;line-height:1.32}.bottone-google{grid-area:button;min-height:48px;font-size:15px;padding:8px 14px;border-radius:14px}.stelle{grid-area:stars;margin-top:1px;font-size:24px;line-height:1}footer{right:14px;bottom:9px;font-size:9px}footer strong{font-size:18px}}@media(prefers-reduced-motion:reduce){.bottone-google,.bottone-google:before,.bottone-google:after{animation:none!important}}'''

bar_landscape = r'''@media (orientation:landscape) and (max-height:680px){.pagina{min-height:100dvh;display:grid;grid-template-columns:minmax(120px,32%) minmax(0,1fr);grid-template-rows:1fr auto;column-gap:22px;row-gap:8px;padding:10px 20px 48px}.brand{grid-column:1;grid-row:1 / span 2;align-self:center;justify-self:center;width:min(100%,220px);max-height:116px}.logo{max-height:116px;max-width:100%}.centro{grid-column:2;grid-row:1;align-self:end;justify-self:stretch;width:100%;margin:0}.eyebrow{transform:none;margin:0 0 8px;gap:8px;font-size:clamp(.72rem,1.8vw,.92rem);letter-spacing:.08em}.eyebrow::before,.eyebrow::after{width:28px}.messaggio-box{border-radius:16px}.messaggio{padding:13px 15px;font-size:clamp(.92rem,2vw,1.08rem);line-height:1.28}.recensione{grid-column:2;grid-row:2;justify-self:stretch;width:100%;gap:7px;margin:0}.bottone-google{width:min(100%,380px);min-width:0;height:50px;padding:0 20px;font-size:1.08rem;border-radius:13px}.stelle{font-size:1.8rem}footer{right:14px;bottom:9px;font-size:.58rem}footer strong{font-size:1.15rem}}'''

# Pulizia testi dell'interfaccia.
text = text.replace(
    '<span>Al momento il primo template master configurato è Bar / Caffetterie.</span>',
    '<span>Seleziona una categoria: ogni attività utilizza il proprio template master definitivo.</span>',
    1
)
text = text.replace('<div class="user-pill">Francesco Terreno</div>', '<div class="user-pill">Operatore</div>', 1)


def patch_builder(source: str, start_marker: str, end_marker: str, add_landscape: str) -> str:
    start = source.find(start_marker)
    if start < 0:
        raise SystemExit(f'Marker non trovato: {start_marker}')
    end = source.find(end_marker, start)
    if end < 0:
        raise SystemExit(f'Fine funzione non trovata: {end_marker}')
    section = source[start:end]
    if add_landscape in section:
        return source

    # Migliora stabilità WebView/mobile eliminando background-attachment fixed.
    section = section.replace('center/cover no-repeat fixed', 'center/cover no-repeat')
    section = section.replace('center center / cover no-repeat fixed;', 'center center / cover no-repeat;')

    # Usa dynamic viewport height senza perdere il fallback vh.
    section = section.replace('.pagina{min-height:100vh;display:flex', '.pagina{min-height:100vh;min-height:100dvh;display:flex', 1)
    section = section.replace('  min-height:100vh;\n  display:flex;', '  min-height:100vh;\n  min-height:100dvh;\n  display:flex;', 1)

    close = section.rfind('</style>')
    if close < 0:
        raise SystemExit(f'</style> non trovato in {start_marker}')
    section = section[:close] + add_landscape + section[close:]
    return source[:start] + section + source[end:]


text = patch_builder(text, 'function buildPremiumTemplate(', 'function buildSeaRestaurantTemplate(', shared_landscape)
text = patch_builder(text, 'function buildSeaRestaurantTemplate(', 'function buildRestaurantTemplate(', shared_landscape)
text = patch_builder(text, 'function buildRestaurantTemplate(', 'const BAR_CSS = `', shared_landscape)

# Layout Bar specifico in orizzontale.
bar_start = text.find('const BAR_CSS = `')
bar_end = text.find('`;\n\nfunction buildBarTemplate', bar_start)
if bar_start < 0 or bar_end < 0:
    raise SystemExit('BAR_CSS non trovato')
bar = text[bar_start:bar_end]
if bar_landscape not in bar:
    marker = '''/* =====================================================\n   ACCESSIBILITÀ\n===================================================== */'''
    if marker not in bar:
        raise SystemExit('Marker accessibilità BAR non trovato')
    bar = bar.replace(marker, bar_landscape + '\n\n' + marker, 1)
    text = text[:bar_start] + bar + text[bar_end:]

if text == original:
    raise SystemExit('Nessuna modifica applicata')

p.write_text(text, encoding='utf-8')
print('Patch anteprime definitive applicata')
