from pathlib import Path

p = Path('tap-clienti-tools.js')
s = p.read_text(encoding='utf-8')
old = "['abbigliamento','Abbigliamento'],['autolavaggio','Autolavaggio'],['bar','Bar / Caffetterie'],['barbershop','Barber Shop']"
new = "['abbigliamento','Abbigliamento'],['autolavaggio','Autolavaggio'],['bar','Bar / Caffetterie'],['barextra','Bar Extra'],['barbershop','Barber Shop']"
if old not in s:
    if "['barextra','Bar Extra']" in s:
        print('Bar Extra already present')
    else:
        raise SystemExit('Category anchor not found')
else:
    s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    print('Bar Extra added to saved-client category editor')
