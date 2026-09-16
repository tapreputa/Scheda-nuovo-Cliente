from pathlib import Path

p = Path('cliente.html')
s = p.read_text(encoding='utf-8')

marker = '/* tap-abbigliamento-preview-parity-pilot-v1 */'
if marker not in s:
    css = r'''

/* tap-abbigliamento-preview-parity-pilot-v1 */
.page.abbigliamento{
  background-position:center center;
  background-size:cover;
}
.page.abbigliamento:before{
  background:linear-gradient(180deg,rgba(0,0,0,.16) 0%,rgba(0,0,0,.08) 42%,rgba(0,0,0,.28) 100%);
}
.page.abbigliamento .content{
  padding:max(34px,env(safe-area-inset-top)) 22px max(92px,calc(env(safe-area-inset-bottom) + 74px));
}
.page.abbigliamento .logo{
  width:min(48vw,220px);
  max-height:165px;
  margin:0 auto clamp(150px,18vh,220px);
  filter:drop-shadow(0 6px 16px rgba(0,0,0,.42));
}
.page.abbigliamento .headline{
  width:min(92vw,620px);
  max-width:620px;
  margin:0 auto;
  font-size:clamp(22px,5vw,30px);
  line-height:1.12;
  letter-spacing:.075em;
  font-weight:950;
  text-shadow:0 3px 12px rgba(0,0,0,.90);
}
.page.abbigliamento .box{
  width:min(86vw,610px);
  margin-top:28px;
  padding:24px 22px;
  border-radius:28px;
  background:rgba(16,10,7,.58);
  border:1px solid rgba(255,255,255,.34);
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
  font-size:clamp(17px,4vw,21px);
  line-height:1.34;
  font-weight:760;
  box-shadow:0 12px 30px rgba(0,0,0,.20);
}
.page.abbigliamento .review{
  width:min(86vw,610px);
  min-height:64px;
  margin-top:28px;
  padding:16px 18px;
  border-radius:25px;
  font-size:clamp(21px,5vw,25px);
  font-weight:950;
  background:linear-gradient(135deg,#c79762,#8c623d);
  color:#fff;
  border:1px solid rgba(255,255,255,.50);
  box-shadow:0 12px 28px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.22);
}
.page.abbigliamento .stars{
  margin-top:24px;
  font-size:clamp(38px,8vw,46px);
  letter-spacing:4px;
  color:#fff200;
  text-shadow:0 0 12px rgba(255,235,0,.95),0 4px 10px rgba(0,0,0,.45);
}
.page.abbigliamento .footer{
  right:18px;
  bottom:max(14px,env(safe-area-inset-bottom));
  font-size:11px;
}
.page.abbigliamento .footer strong{
  font-size:23px;
}
@media(max-height:820px){
  .page.abbigliamento .content{padding-top:24px;padding-bottom:82px}
  .page.abbigliamento .logo{width:min(44vw,190px);max-height:135px;margin-bottom:clamp(108px,15vh,150px)}
  .page.abbigliamento .headline{font-size:clamp(20px,4.7vw,26px)}
  .page.abbigliamento .box{margin-top:20px;padding:18px 18px;font-size:clamp(15px,3.7vw,18px)}
  .page.abbigliamento .review{margin-top:20px;min-height:56px;font-size:clamp(19px,4.6vw,23px);padding:14px 16px}
  .page.abbigliamento .stars{margin-top:18px;font-size:clamp(34px,7.5vw,42px)}
}
'''
    anchor = '\n@media (max-height:780px)'
    if anchor not in s:
        raise SystemExit('CSS anchor not found')
    s = s.replace(anchor, css + anchor, 1)

old = "if(cat==='barextra') page.classList.add('barextra');"
new = "if(cat==='barextra') page.classList.add('barextra');\n if(cat==='abbigliamento') page.classList.add('abbigliamento');"
if "page.classList.add('abbigliamento')" not in s:
    if old not in s:
        raise SystemExit('Category class anchor not found')
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('Abbigliamento pilot applied only to cliente.html')
