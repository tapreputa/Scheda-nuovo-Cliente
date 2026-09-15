from pathlib import Path

p = Path('risultati.html')
s = p.read_text(encoding='utf-8')
old = '<tr><th>Prodotto</th><th>Francesco</th><th>Gisberto</th><th class="team-col">Team</th></tr>'
new = '<tr><th>Prodotto</th><th>Francesco</th><th>Gisberto</th><th>Enzo</th><th class="team-col">Team</th></tr>'
if old not in s:
    raise SystemExit('Monthly results header pattern not found')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
