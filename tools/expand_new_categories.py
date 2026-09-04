from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "personalizza.html"

ASSET_STAGE = {
    "Sfondopanificio.webp": ROOT / "tools/newcat-assets/Sfondopanificio.webp.b64",
    "Sfondoyogurteria.webp": ROOT / "tools/newcat-assets/Sfondoyogurteria.webp.b64",
    "Sfondodetersivi.webp": ROOT / "tools/newcat-assets/Sfondodetersivi.webp.b64",
    "Sfondofarmacia.webp": ROOT / "tools/newcat-assets/Sfondofarmacia.webp.b64",
    "Sfondofitness.webp": ROOT / "tools/newcat-assets/Sfondofitness.webp.b64",
    "Sfondopasticceria.webp": ROOT / "tools/newcat-assets/Sfondopasticceria.webp.b64",
    "Sfondopub.webp": ROOT / "tools/newcat-assets/Sfondopub.webp.b64",
}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def insert_after(text, marker, addition, label):
    if addition.strip() in text:
        return text
    require(marker in text, f"Marker non trovato: {label}")
    return text.replace(marker, marker + addition, 1)


def write_assets():
    for name, stage in ASSET_STAGE.items():
        require(stage.exists(), f"Staging mancante: {stage}")
        raw = base64.b64decode(stage.read_text(encoding="ascii").strip())
        require(raw[:4] == b"RIFF" and raw[8:12] == b"WEBP", f"Asset WebP non valido: {name}")
        require(len(raw) > 20000, f"Asset troppo piccolo: {name}")
        (ROOT / name).write_bytes(raw)


def patch_html():
    text = HTML_PATH.read_text(encoding="utf-8")

    options_marker = '<option value="centroestetico">Centri estetici</option>'
    options_add = '\n'.join([
        '<option value="panificio">Panificio / Biscottificio</option>',
        '<option value="yogurteria">Yogurterie</option>',
        '<option value="detersivi">Detersivi e casalinghi</option>',
        '<option value="farmacia">Farmacia</option>',
        '<option value="fitness">Palestre / Fitness</option>',
        '<option value="pasticceria">Pasticceria</option>',
        '<option value="pub">Pub / Cocktail bar</option>',
    ])
    text = insert_after(text, options_marker, '\n' + options_add, "select categorie")

    templates_marker = '    centroestetico: ["Centri estetici", "Sfondo wellness luminoso + stile raffinato + pulsante premium + 5 stelle + Powered by Tapreputa."]'
    templates_add = ',\n' + '\n'.join([
        '    panificio: ["Panificio / Biscottificio", "Sfondo artigianale caldo + stile tradizionale premium + pulsante recensioni + 5 stelle + Powered by Tapreputa."],',
        '    yogurteria: ["Yogurterie", "Sfondo fresco e luminoso con yogurt, frutta e topping + pulsante recensioni + 5 stelle + Powered by Tapreputa."],',
        '    detersivi: ["Detersivi e casalinghi", "Sfondo pulito e moderno + palette azzurro/bianco + pulsante recensioni + 5 stelle + Powered by Tapreputa."],',
        '    farmacia: ["Farmacia", "Sfondo farmacia contemporanea + stile affidabile verde/bianco + pulsante recensioni + 5 stelle + Powered by Tapreputa."],',
        '    fitness: ["Palestre / Fitness", "Sfondo palestra moderna + stile energico premium + pulsante recensioni + 5 stelle + Powered by Tapreputa."],',
        '    pasticceria: ["Pasticceria", "Sfondo raffinato con dolci e vetrina premium + pulsante recensioni + 5 stelle + Powered by Tapreputa."],',
        '    pub: ["Pub / Cocktail bar", "Sfondo cocktail bar serale premium + stile blu/ambra + pulsante recensioni + 5 stelle + Powered by Tapreputa."]',
    ])
    text = insert_after(text, templates_marker, templates_add, "mappa descrizioni")

    old_allowed = '["standard","bar","ristorante","ristorantemare","pizzeria","gelateria","stabilimento","parrucchiere","barbershop","centroestetico"]'
    new_allowed = '["standard","bar","ristorante","ristorantemare","pizzeria","gelateria","stabilimento","parrucchiere","barbershop","centroestetico","panificio","yogurteria","detersivi","farmacia","fitness","pasticceria","pub"]'
    if old_allowed in text:
        text = text.replace(old_allowed, new_allowed)
    require(text.count(new_allowed) >= 2, "Whitelist categorie non aggiornata in entrambi i flussi")

    cfg_marker = '        centroestetico: {file:"Sfondocentroestetico.jpg", title:"Ti è piaciuto il tuo momento di benessere?", accent:"#b58b63", accent2:"#8b6548", theme:"#a57c59", box:"rgba(255,253,249,.70)", text:"#493b31", message:"Il tuo feedback ci aiuta a prenderci cura di ogni dettaglio della tua esperienza. Dicci la tua! Bastano 2 secondi!"}'
    cfg_add = ',\n' + '\n'.join([
        '        panificio: {file:"Sfondopanificio.webp", title:"Ti sono piaciuti i nostri prodotti da forno?", accent:"#c88945", accent2:"#7a431d", theme:"#8c5428", box:"rgba(255,248,235,.72)", text:"#422918", message:"La tua opinione ci aiuta a portare in tavola ogni giorno pane, biscotti e bontà ancora migliori. Raccontaci la tua esperienza! Bastano 2 secondi!"},',
        '        yogurteria: {file:"Sfondoyogurteria.webp", title:"Ti è piaciuto il nostro yogurt?", accent:"#e25f93", accent2:"#48aeb7", theme:"#3097a4", box:"rgba(255,255,255,.76)", text:"#4a3340", message:"La tua opinione rende ogni pausa ancora più fresca e golosa. Raccontaci la tua esperienza! Bastano 2 secondi!"},',
        '        detersivi: {file:"Sfondodetersivi.webp", title:"Ti sei trovato bene con noi?", accent:"#2d9bd3", accent2:"#166999", theme:"#247fae", box:"rgba(250,254,255,.82)", text:"#173c52", message:"Il tuo feedback ci aiuta a offrirti ogni giorno un servizio più semplice, ordinato e vicino alle esigenze della tua casa. Bastano 2 secondi!"},',
        '        farmacia: {file:"Sfondofarmacia.webp", title:"Ti sei trovato bene nella nostra farmacia?", accent:"#39a56f", accent2:"#197549", theme:"#27865a", box:"rgba(252,255,253,.82)", text:"#244638", message:"La tua opinione ci aiuta a migliorare attenzione, disponibilità e qualità del servizio. Raccontaci la tua esperienza! Bastano 2 secondi!"},',
        '        fitness: {file:"Sfondofitness.webp", title:"Ti è piaciuto allenarti con noi?", accent:"#d39a4b", accent2:"#33465f", theme:"#1f3045", box:"rgba(18,27,39,.74)", text:"#ffffff", message:"Il tuo feedback ci dà energia e ci aiuta a migliorare ogni allenamento, servizio ed esperienza. Dicci la tua! Bastano 2 secondi!"},',
        '        pasticceria: {file:"Sfondopasticceria.webp", title:"Ti sono piaciuti i nostri dolci?", accent:"#d98a9f", accent2:"#b77a45", theme:"#a86955", box:"rgba(255,251,248,.78)", text:"#563b3f", message:"La tua opinione ci aiuta a rendere ogni dolce e ogni momento ancora più speciale. Raccontaci la tua esperienza! Bastano 2 secondi!"},',
        '        pub: {file:"Sfondopub.webp", title:"Ti è piaciuta la tua serata?", accent:"#d99a4e", accent2:"#253e64", theme:"#152946", box:"rgba(8,18,33,.76)", text:"#ffffff", message:"Il tuo feedback ci aiuta a migliorare atmosfera, cocktail e servizio per rendere ogni serata ancora più speciale. Bastano 2 secondi!"}',
    ])
    text = insert_after(text, cfg_marker, cfg_add, "config template premium")

    text = text.replace('tap-premium-polish.css?v=19', 'tap-premium-polish.css?v=20')
    HTML_PATH.write_text(text, encoding="utf-8")


def cleanup_old_staging():
    stale = [
        ROOT / ".tmp-assets" / "panificio.b85.00",
        ROOT / "assets" / "Sfondopanificio.webp.b64",
        ROOT / "assets" / "Sfondoyogurteria.webp.b64",
        ROOT / "assets" / "Sfondodetersivi.webp.b64",
        ROOT / "assets" / "Sfondofarmacia.webp.b64",
        ROOT / "connector-test.txt",
    ]
    for p in stale:
        if p.exists():
            p.unlink()
    for d in [ROOT / ".tmp-assets", ROOT / "assets"]:
        if d.exists() and d.is_dir() and not any(d.iterdir()):
            d.rmdir()


def qa():
    text = HTML_PATH.read_text(encoding="utf-8")
    expected = {
        "panificio": "Panificio / Biscottificio",
        "yogurteria": "Yogurterie",
        "detersivi": "Detersivi e casalinghi",
        "farmacia": "Farmacia",
        "fitness": "Palestre / Fitness",
        "pasticceria": "Pasticceria",
        "pub": "Pub / Cocktail bar",
    }
    for code, label in expected.items():
        require(f'<option value="{code}">{label}</option>' in text, f"Option mancante: {code}")
        require(f'{code}: {{file:"Sfondo' in text, f"Config mancante: {code}")
    for filename in ASSET_STAGE:
        raw = (ROOT / filename).read_bytes()
        require(raw[:4] == b"RIFF" and raw[8:12] == b"WEBP", f"WebP corrotto: {filename}")
        require(len(raw) > 20000, f"WebP troppo piccolo: {filename}")
    require('previewBtn.classList.toggle("show", type !== "standard")' in text, "Anteprima personalizzata alterata")
    require('finalNfcUrl = "https://tapreputa.github.io/" + slug + "/";' in text, "Link NFC alterato")
    require('type === "standard"' in text and 'window.open(reviewUrl' in text, "Anteprima STANDARD alterata")
    print("QA Python OK: 7 nuove categorie e 7 sfondi verificati")


if __name__ == "__main__":
    write_assets()
    patch_html()
    cleanup_old_staging()
    qa()
