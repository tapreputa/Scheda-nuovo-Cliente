from pathlib import Path

p = Path('risultati.html')
s = p.read_text(encoding='utf-8')

s = s.replace('th:nth-child(4),td:nth-child(4){display:none!important}', 'th:nth-child(5),td:nth-child(5){display:none!important}')
s = s.replace('th:first-child,td:first-child{position:static!important;width:30%!important;min-width:30%!important;max-width:30%!important;box-shadow:none!important}', 'th:first-child,td:first-child{position:static!important;width:28%!important;min-width:28%!important;max-width:28%!important;box-shadow:none!important}')
s = s.replace('th:nth-child(2),td:nth-child(2),th:nth-child(3),td:nth-child(3){width:35%!important;min-width:35%!important;max-width:35%!important}', 'th:nth-child(2),td:nth-child(2),th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4){width:24%!important;min-width:24%!important;max-width:24%!important}')
s = s.replace('th:first-child,td:first-child{width:32%!important;min-width:32%!important;max-width:32%!important}', 'th:first-child,td:first-child{width:31%!important;min-width:31%!important;max-width:31%!important}')
s = s.replace('th:nth-child(2),td:nth-child(2),th:nth-child(3),td:nth-child(3){width:34%!important;min-width:34%!important;max-width:34%!important}', 'th:nth-child(2),td:nth-child(2),th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4){width:23%!important;min-width:23%!important;max-width:23%!important}')

p.write_text(s, encoding='utf-8')
