const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'client-preview.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const listing=fs.readFileSync(path.join(root,'clienti.html'),'utf8').match(/function previewUrl\(c\)[^\n]+/)[0];
async function resolve(rows,{slug='fimis-bar',ok=true,offline=false}={}){
  let destination=null;
  const calls=[],status={textContent:''},retry={hidden:true,addEventListener(){}};
  await vm.runInNewContext(code,{
    URL,URLSearchParams,
    location:{search:'?c='+encodeURIComponent(slug),href:'https://tapreputa.github.io/Scheda-nuovo-Cliente/client-preview.html',replace:href=>destination=href},
    document:{getElementById:id=>id==='status'?status:retry},
    fetch:async(url,options)=>{calls.push({url,options});if(offline)throw Error('offline');return{ok,json:async()=>rows};}
  });
  return{destination,calls,status,retry};
}
(async()=>{
  const custom=await resolve([{html:'<!doctype html><html>saved composition</html>'}]);
  assert.equal(new URL(custom.destination).pathname,'/Scheda-nuovo-Cliente/manual-logo.html');
  assert.equal(new URL(custom.destination).searchParams.get('c'),'fimis-bar');
  assert.equal(custom.calls.length,1);
  assert.ok(custom.calls[0].url.endsWith('/rpc/get_public_manual_logo_page'),'Preview uses only a read-only lookup');
  const legacy=await resolve([]);
  assert.equal(new URL(legacy.destination).pathname,'/Scheda-nuovo-Cliente/cliente.html');
  assert.equal(new URL(legacy.destination).searchParams.get('preview'),'1','Legacy preview does not count visits');
  for(const options of [{ok:false},{offline:true}]) {
    const failure=await resolve([],options);
    assert.equal(failure.destination,null,'Failures must not open a different layout');
    assert.equal(failure.retry.hidden,false);
  }
  const invalid=await resolve([],{slug:'../foreign'});
  assert.equal(invalid.destination,null);assert.equal(invalid.calls.length,0);
  const context={URL};vm.createContext(context);vm.runInContext(listing,context);
  assert.ok(context.previewUrl({link_nfc:'https://tapreputa.github.io/Scheda-nuovo-Cliente/tap.html?c=fimis-bar'}).startsWith('client-preview.html?c=fimis-bar'));
  assert.equal(context.previewUrl({link_nfc:'https://example.com/review'}),'https://example.com/review');
  console.log('PASS: saved composition, legacy fallback, read-only preview, errors, invalid slug, listing and direct review URL.');
})().catch(error=>{console.error(error);process.exitCode=1;});

