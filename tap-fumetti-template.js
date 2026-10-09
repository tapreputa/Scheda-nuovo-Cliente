(() => {
  'use strict';
  const title='La tua prossima avventura inizia qui!';
  const message='Fumetti, giochi e nuove sfide: ti è piaciuta la tua esperienza?\nRaccontacela con una recensione.\nBastano 2 secondi!';
  const css=`
html:has(.page.fumetti),body:has(.page.fumetti){margin:0;min-height:100%;background-color:#102036;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%}
.page.fumetti{position:relative!important;min-height:100vh!important;min-height:100svh!important;color:#fff!important;background-size:cover!important;background-position:center center!important;background-repeat:no-repeat!important;isolation:isolate;overflow:hidden!important}
.page.fumetti:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(4,11,25,.13),transparent 23%,rgba(4,11,25,.13) 48%,rgba(4,11,25,.06) 80%,rgba(4,11,25,.30))!important}
body:has(.page.fumetti) .content{position:relative!important;width:100%!important;max-width:none!important;min-height:100vh!important;min-height:100svh!important;margin:0!important;padding:0!important;transform:none!important;display:block!important}
body:has(.page.fumetti) .name{display:none!important}
body:has(.page.fumetti) .logo{position:absolute!important;top:6svh!important;left:50%!important;transform:translateX(-50%)!important;width:min(65vw,300px)!important;height:auto!important;max-height:19svh!important;object-fit:contain!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;filter:drop-shadow(0 4px 12px #0007)!important;display:none}
body:has(.page.fumetti) .logo.show{display:block}
body:has(.page.fumetti) .fumetti-copy{position:absolute;top:29svh;left:6%;right:6%;width:min(88%,520px);margin:auto;padding:18px 15px;text-align:center;border-radius:20px;background:rgba(8,17,34,.76);border:1px solid rgba(255,255,255,.35);box-shadow:0 8px 24px #0002}
body:has(.page.fumetti) .headline{position:static!important;margin:0 0 13px!important;padding:0!important;font-size:clamp(18px,5.2vw,24px)!important;font-weight:900!important;line-height:1.2!important;letter-spacing:.02em!important;color:#fff!important;text-transform:uppercase!important;text-wrap:balance;text-shadow:0 2px 6px #0005!important;transform:none!important}
body:has(.page.fumetti) .box{position:static!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;font-size:clamp(14px,3.9vw,18px)!important;font-weight:600!important;line-height:1.45!important;color:#fff!important;text-wrap:balance;white-space:pre-line;transform:none!important}
body:has(.page.fumetti) .review{position:absolute!important;top:69svh!important;left:50%!important;transform:translateX(-50%)!important;width:min(80%,420px)!important;min-height:54px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;border:1px solid #fff9!important;border-radius:999px!important;background:linear-gradient(135deg,#fff6d8,#ffdf70)!important;color:#17274a!important;font-size:clamp(16px,4.25vw,20px)!important;font-weight:900!important;box-shadow:0 8px 23px #0005!important;padding:12px 10px!important;animation:none!important;text-decoration:none!important;margin:0!important}
body:has(.page.fumetti) .review:before,body:has(.page.fumetti) .review:after{display:none!important}
body:has(.page.fumetti) .fumetti-google{font-size:20px;font-weight:900;color:#4285f4;background:#fff;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}
body:has(.page.fumetti) .stars{position:absolute!important;top:79svh!important;left:0!important;right:0!important;text-align:center!important;color:#ffd44d!important;font-size:clamp(28px,8.2vw,38px)!important;letter-spacing:.12em!important;text-shadow:0 0 8px #ffb900,0 0 18px #ffac00aa,0 3px 5px #0009!important;background:transparent!important;margin:0!important;padding:0!important;transform:none!important}
body:has(.page.fumetti) .footer{position:absolute!important;right:6%!important;bottom:3svh!important;text-align:right!important;text-shadow:0 2px 5px #000!important;font-size:11px!important;color:#fff!important;margin:0!important;padding:0!important}
body:has(.page.fumetti) .footer strong{display:block!important;font-size:20px!important;font-weight:950!important;line-height:1.1!important;color:#fff!important}
@media(max-height:600px),(orientation:landscape){.page.fumetti,body:has(.page.fumetti) .content{min-height:650px!important}body:has(.page.fumetti) .logo{top:26px!important;max-height:95px!important}body:has(.page.fumetti) .fumetti-copy{top:185px}body:has(.page.fumetti) .review{top:450px!important}body:has(.page.fumetti) .stars{top:525px!important}body:has(.page.fumetti) .footer{bottom:20px!important}}
`;
  function escape(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function build(logo,reviewUrl,background){
    return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Recensioni</title><style>'+css+'</style></head><body><main class="page fumetti" style="background-image:url(&quot;'+escape(background)+'&quot;)"><div class="content">'+(logo?'<img class="logo show" alt="Logo attività" src="'+escape(logo)+'">':'')+'<div class="fumetti-copy"><div class="headline">'+escape(title)+'</div><div id="message" class="box">'+escape(message)+'</div></div><a class="review" href="'+escape(reviewUrl)+'" aria-label="Lascia una recensione"><span class="fumetti-google" aria-hidden="true">G</span><span class="button-text">Lascia una recensione</span></a><div class="stars" aria-label="Cinque stelle">★★★★★</div></div><div class="footer">Powered by<strong>Tapreputa</strong></div></main></body></html>';
  }
  function applyLegacy(page){
    page.classList.add('fumetti');
    const doc=page.ownerDocument;
    if(!doc.getElementById('tap-fumetti-style')){const style=doc.createElement('style');style.id='tap-fumetti-style';style.textContent=css;doc.head.appendChild(style);}
    const group=doc.createElement('div');group.className='fumetti-copy';
    const headline=page.querySelector('.headline'),box=page.querySelector('.box');
    headline.before(group);group.append(headline,box);
    const review=page.querySelector('.review');review.innerHTML='<span class="fumetti-google" aria-hidden="true">G</span><span class="button-text">Lascia una recensione</span>';review.setAttribute('aria-label','Lascia una recensione');
  }
  window.TapFumettiTemplate=Object.freeze({build,applyLegacy,title,message});
  if(!location.pathname.endsWith('/personalizza.html'))return;
  const activity=document.getElementById('activityType'),preview=document.getElementById('previewBtn');
  preview.addEventListener('click',async event=>{
    if(activity.value!=='fumetti')return;
    event.preventDefault();event.stopImmediatePropagation();
    const review=normalizeReviewUrl(document.getElementById('destinationUrl').value);
    if(!review)return warn('Il link recensioni non è presente.');
    try{
      preview.disabled=true;
      const bg=await loadBackgroundDataUrl('Sfondofumetti.webp');
      const html=build(window.tapLogoSkipped?'':logoDataUrl,review,bg);
      openInlinePreview(html);
      msg.className='message show ok';msg.textContent='Anteprima Fumetti/Giochi pronta.';
    }catch(error){warn('Impossibile caricare lo sfondo Fumetti/Giochi.');console.error(error);}
    finally{preview.disabled=false;}
  },true);
})();
