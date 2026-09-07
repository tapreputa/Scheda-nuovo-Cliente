(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'risultati.html') return;

  const LAST_EXPORT_KEY = 'tapreputa_last_excel_export_v1';
  const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  const MONTHS_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const enc = new TextEncoder();

  const esc = value => String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const n = value => { const x = Number(value); return Number.isFinite(x) ? Math.max(0, x) : 0; };
  const i = value => Math.floor(n(value));
  const isoDate = value => {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
  };
  const excelSerial = d => d ? (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) + 25569 : null;
  const colName = num => { let s=''; while(num){ num--; s=String.fromCharCode(65+(num%26))+s; num=Math.floor(num/26); } return s; };

  function injectUi(){
    const refresh = document.getElementById('refreshBtn');
    if (!refresh || document.getElementById('exportExcelBtn')) return;
    const headline = refresh.parentElement;
    const actions = document.createElement('div');
    actions.className = 'tap-results-export-actions';
    const exportBtn = document.createElement('button');
    exportBtn.id = 'exportExcelBtn';
    exportBtn.className = 'tap-export-btn';
    exportBtn.type = 'button';
    exportBtn.innerHTML = '<span class="tap-export-icon">⇩</span><span>Esporta</span>';
    exportBtn.title = 'Esporta clienti, vendite e risultati in Excel';
    const stamp = document.createElement('div');
    stamp.id = 'lastExportStamp';
    stamp.className = 'tap-export-stamp';
    actions.append(refresh, exportBtn, stamp);
    headline.appendChild(actions);

    const style = document.createElement('style');
    style.textContent = `
      .tap-results-export-actions{display:grid;grid-template-columns:auto auto;gap:8px;align-items:center;justify-items:end}
      .tap-export-btn{border:1px solid #b99128;background:linear-gradient(135deg,#fff8df,#f7e3a0);color:#5f4500;border-radius:13px;min-height:44px;padding:0 15px;font:inherit;font-size:13px;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;gap:7px;box-shadow:0 8px 18px rgba(185,145,40,.13)}
      .tap-export-btn:disabled{opacity:.6;cursor:wait}.tap-export-icon{font-size:18px;line-height:1}
      .tap-export-stamp{grid-column:1/-1;color:#74817d;font-size:10px;text-align:right;min-height:13px}
      @media(max-width:760px){.headline{gap:10px}.tap-results-export-actions{grid-template-columns:1fr 1fr;width:100%;max-width:236px}.tap-results-export-actions .refresh,.tap-export-btn{width:100%;padding:0 10px;font-size:11px}.tap-export-stamp{font-size:9px}}
      @media(max-width:430px){.headline{display:block}.tap-results-export-actions{margin-top:14px;max-width:none;justify-items:stretch}.tap-export-stamp{text-align:left}}
    `;
    document.head.appendChild(style);
    updateStamp();
    exportBtn.addEventListener('click', runExport);
  }

  function updateStamp(){
    const el = document.getElementById('lastExportStamp');
    if (!el) return;
    const raw = localStorage.getItem(LAST_EXPORT_KEY);
    if (!raw) { el.textContent = 'Nessuna esportazione effettuata'; return; }
    const d = new Date(raw);
    el.textContent = Number.isNaN(d.getTime()) ? 'Nessuna esportazione effettuata' : 'Ultima esportazione: ' + d.toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'});
  }

  function aggregate(clients){
    const operators = {Francesco:{targhe:0,carte:0,adesivi:0,euro:0},Gisberto:{targhe:0,carte:0,adesivi:0,euro:0}};
    const categories = new Map();
    let delivered=0, pending=0;
    for (const c of clients){
      const op = operators[c.operatore];
      if (op){ op.targhe += i(c.targhe); op.carte += i(c.carte); op.adesivi += i(c.adesivi); op.euro += n(c.spesa); }
      const cat = String(c.categoria || c.categoria_codice || 'Non specificata').trim() || 'Non specificata';
      categories.set(cat, (categories.get(cat) || 0) + 1);
      if (String(c.stato||'') === 'Consegnato') delivered++; else pending++;
    }
    const team = {
      targhe: operators.Francesco.targhe + operators.Gisberto.targhe,
      carte: operators.Francesco.carte + operators.Gisberto.carte,
      adesivi: operators.Francesco.adesivi + operators.Gisberto.adesivi,
      euro: operators.Francesco.euro + operators.Gisberto.euro
    };
    const ranking = [...categories.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'it'));
    return {operators,team,ranking,delivered,pending};
  }

  function monthly(clients, year){
    return MONTHS_SHORT.map((label,month)=>{
      const subset = clients.filter(c=>{ const d=isoDate(c.created_at); return d && d.getFullYear()===year && d.getMonth()===month; });
      const a = aggregate(subset);
      return {label,month,fr:a.operators.Francesco.euro,gi:a.operators.Gisberto.euro,team:a.team.euro,targhe:a.team.targhe,carte:a.team.carte,adesivi:a.team.adesivi,clients:subset.length};
    });
  }

  function cell(ref, value, style=0, type=null){
    if (value === null || value === undefined || value === '') return `<c r="${ref}" s="${style}"/>`;
    if (type === 'n' || typeof value === 'number') return `<c r="${ref}" s="${style}"><v>${Number(value)}</v></c>`;
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
  }
  function rowXml(rowNum, values, opts={}){
    const {styles=[],types=[],height=null} = opts;
    const cells = values.map((v,idx)=>cell(`${colName(idx+1)}${rowNum}`,v,styles[idx]||0,types[idx]||null)).join('');
    return `<row r="${rowNum}"${height?` ht="${height}" customHeight="1"`:''}>${cells}</row>`;
  }
  function colsXml(widths){ return `<cols>${widths.map((w,idx)=>`<col min="${idx+1}" max="${idx+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`; }
  function sheetXml({tabColor='0B5E55',cols=[],rows=[],freezeRow=0,autoFilter='',drawing=false}){
    const freeze = freezeRow ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${freezeRow}" topLeftCell="A${freezeRow+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><tabColor rgb="FF${tabColor}"/></sheetPr>${freeze}<sheetFormatPr defaultRowHeight="18"/>${colsXml(cols)}<sheetData>${rows.join('')}</sheetData>${autoFilter?`<autoFilter ref="${autoFilter}"/>`:''}${drawing?'<drawing r:id="rId1"/>':''}</worksheet>`;
  }

  function stylesXml(){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="€ #,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="0.0%"/></numFmts>
<fonts count="7">
<font><sz val="11"/><name val="Aptos"/><family val="2"/></font>
<font><b/><sz val="22"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font>
<font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font>
<font><b/><sz val="11"/><color rgb="FF7A2E23"/><name val="Aptos"/></font>
<font><b/><sz val="11"/><color rgb="FF08735F"/><name val="Aptos"/></font>
<font><b/><sz val="12"/><color rgb="FF173B34"/><name val="Aptos"/></font>
</fonts>
<fills count="10">
<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF003C33"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0B5E55"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF4C95D"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE9F8F1"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF0ED"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF4F8F7"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF8DF"/></patternFill></fill>
</fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFD9E5E2"/></left><right style="thin"><color rgb="FFD9E5E2"/></right><top style="thin"><color rgb="FFD9E5E2"/></top><bottom style="thin"><color rgb="FFD9E5E2"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="15">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="6" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf numFmtId="0" fontId="6" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment horizontal="center"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="6" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="3" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="6" fillId="9" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="8" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
<xf numFmtId="166" fontId="0" fillId="8" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }

  function dashboardSheet(clients, summary, monthlyRows, exportDate){
    const rows=[];
    rows.push(rowXml(1,['TAPREPUTA · REPORT COMMERCIALE'],{styles:[1],height:34}));
    rows.push(rowXml(2,['Esportazione',exportDate.toLocaleString('it-IT')],{styles:[10,10]}));
    rows.push(rowXml(4,['INDICATORI PRINCIPALI','','',''],{styles:[9,9,9,9],height:24}));
    rows.push(rowXml(5,['Totale Team',summary.team.euro,'Clienti',clients.length],{styles:[10,11,10,3],types:[null,'n',null,'n'],height:30}));
    rows.push(rowXml(6,['Francesco',summary.operators.Francesco.euro,'Consegnati',summary.delivered],{styles:[10,4,10,5],types:[null,'n',null,'n']}));
    rows.push(rowXml(7,['Gisberto',summary.operators.Gisberto.euro,'Da consegnare',summary.pending],{styles:[10,4,10,5],types:[null,'n',null,'n']}));
    rows.push(rowXml(9,['PRODOTTI VENDUTI','','',''],{styles:[9,9,9,9],height:24}));
    rows.push(rowXml(10,['Targhe',summary.team.targhe,'Cards',summary.team.carte],{styles:[10,5,10,5],types:[null,'n',null,'n']}));
    rows.push(rowXml(11,['Adesivi',summary.team.adesivi,'Categoria principale',summary.ranking[0]?.name || '—'],{styles:[10,5,10,12],types:[null,'n']}));
    rows.push(rowXml(13,['ANDAMENTO VENDITE MENSILI'],{styles:[9],height:24}));
    rows.push(rowXml(14,['Mese','Francesco','Gisberto','Team'],{styles:[2,2,2,2]}));
    monthlyRows.forEach((m,idx)=>rows.push(rowXml(15+idx,[m.label,m.fr,m.gi,m.team],{styles:[10,4,4,4],types:[null,'n','n','n']})));
    return sheetXml({tabColor:'003C33',cols:[18,18,18,18,3,18,18,18],rows,drawing:true});
  }

  function clientsSheet(clients){
    const headers=['ID','Nome attività','Operatore','Categoria','Stato','Targhe','Cards','Adesivi','Totale €','Data','Link recensioni','Link NFC'];
    const rows=[rowXml(1,headers,{styles:headers.map(()=>2),height:28})];
    clients.forEach((c,idx)=>{
      const d=isoDate(c.created_at || c.data);
      const status = String(c.stato||'') === 'Consegnato' ? 'Consegnato' : 'Da consegnare';
      const styles=[5,10,10,10,status==='Consegnato'?8:7,5,5,5,4,6,0,0];
      const types=['n',null,null,null,null,'n','n','n','n',d?'n':null,null,null];
      rows.push(rowXml(idx+2,[c.id ?? '',c.nome ?? '',c.operatore ?? '',c.categoria ?? c.categoria_codice ?? '',status,i(c.targhe),i(c.carte),i(c.adesivi),n(c.spesa),d?excelSerial(d):'',c.link_recensioni ?? c.linkReview ?? '',c.link_nfc ?? c.linkNfc ?? c.url ?? ''],{styles,types}));
    });
    return sheetXml({tabColor:'0B5E55',cols:[9,28,14,25,18,10,10,10,14,13,45,45],rows,freezeRow:1,autoFilter:`A1:L${Math.max(2,clients.length+1)}`});
  }

  function salesSheet(clients, year, monthlyRows){
    const headers=['Mese','Francesco €','Gisberto €','Team €','Targhe','Cards','Adesivi','Clienti'];
    const rows=[rowXml(1,headers,{styles:headers.map(()=>2),height:28})];
    monthlyRows.forEach((m,idx)=>rows.push(rowXml(idx+2,[MONTHS[m.month],m.fr,m.gi,m.team,m.targhe,m.carte,m.adesivi,m.clients],{styles:[10,4,4,4,5,5,5,5],types:[null,'n','n','n','n','n','n','n']})));
    const yearClients=clients.filter(c=>{const d=isoDate(c.created_at);return d&&d.getFullYear()===year;});
    const total=aggregate(yearClients);
    rows.push(rowXml(14,['TOTALE ANNO',total.operators.Francesco.euro,total.operators.Gisberto.euro,total.team.euro,total.team.targhe,total.team.carte,total.team.adesivi,yearClients.length],{styles:[9,11,11,11,3,3,3,3],types:[null,'n','n','n','n','n','n','n'],height:28}));
    return sheetXml({tabColor:'B99128',cols:[16,16,16,16,11,11,11,11],rows,freezeRow:1,autoFilter:'A1:H13'});
  }

  function categoriesSheet(clients, summary){
    const rows=[rowXml(1,['Categoria','Clienti','Incidenza %'],{styles:[2,2,2],height:28})];
    const total = Math.max(1,clients.length);
    summary.ranking.forEach((r,idx)=>rows.push(rowXml(idx+2,[r.name,r.count,r.count/total],{styles:[10,5,14],types:[null,'n','n']})));
    return sheetXml({tabColor:'2F80ED',cols:[30,12,15],rows,freezeRow:1,autoFilter:`A1:C${Math.max(2,summary.ranking.length+1)}`});
  }

  function chart1Xml(){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="it-IT" sz="1400" b="1"/><a:t>Andamento vendite Team</a:t></a:r></a:p></c:rich></c:tx><c:layout/></c:title><c:plotArea><c:layout/><c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>Team</c:v></c:tx><c:spPr><a:ln w="28575"><a:solidFill><a:srgbClr val="0B5E55"/></a:solidFill></a:ln></c:spPr><c:cat><c:strRef><c:f>'Vendite mensili'!$A$2:$A$13</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>'Vendite mensili'!$D$2:$D$13</c:f></c:numRef></c:val></c:ser><c:marker val="1"/><c:axId val="48165120"/><c:axId val="48166656"/></c:lineChart><c:catAx><c:axId val="48165120"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:tickLblPos val="nextTo"/><c:crossAx val="48166656"/><c:crosses val="autoZero"/></c:catAx><c:valAx><c:axId val="48166656"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="€ #,##0" sourceLinked="0"/><c:majorGridlines/><c:crossAx val="48165120"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:legend><c:legendPos val="b"/><c:layout/></c:legend><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;
  }
  function chart2Xml(){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="it-IT" sz="1400" b="1"/><a:t>Confronto operatori per mese</a:t></a:r></a:p></c:rich></c:tx><c:layout/></c:title><c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>Francesco</c:v></c:tx><c:spPr><a:solidFill><a:srgbClr val="003C33"/></a:solidFill></c:spPr><c:cat><c:strRef><c:f>'Vendite mensili'!$A$2:$A$13</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>'Vendite mensili'!$B$2:$B$13</c:f></c:numRef></c:val></c:ser><c:ser><c:idx val="1"/><c:order val="1"/><c:tx><c:v>Gisberto</c:v></c:tx><c:spPr><a:solidFill><a:srgbClr val="F4C95D"/></a:solidFill></c:spPr><c:cat><c:strRef><c:f>'Vendite mensili'!$A$2:$A$13</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>'Vendite mensili'!$C$2:$C$13</c:f></c:numRef></c:val></c:ser><c:axId val="77123456"/><c:axId val="77124567"/></c:barChart><c:catAx><c:axId val="77123456"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:tickLblPos val="nextTo"/><c:crossAx val="77124567"/><c:crosses val="autoZero"/></c:catAx><c:valAx><c:axId val="77124567"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="€ #,##0" sourceLinked="0"/><c:majorGridlines/><c:crossAx val="77123456"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:legend><c:legendPos val="b"/><c:layout/></c:legend><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;
  }

  function drawingXml(){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<xdr:twoCellAnchor><xdr:from><xdr:col>5</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>2</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>12</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>17</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Andamento vendite Team"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>
<xdr:twoCellAnchor><xdr:from><xdr:col>5</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>18</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>12</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>33</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="3" name="Confronto operatori"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId2"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>
</xdr:wsDr>`;
  }

  function packageFiles(clients, year, exportDate){
    const summary = aggregate(clients);
    const monthRows = monthly(clients, year);
    const files = {};
    files['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/xl/charts/chart2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
    files['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
    files['docProps/core.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Tapreputa - Report commerciale</dc:title><dc:creator>Tapreputa</dc:creator><cp:lastModifiedBy>Tapreputa</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${exportDate.toISOString()}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${exportDate.toISOString()}</dcterms:modified></cp:coreProperties>`;
    files['docProps/app.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Tapreputa</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company>Tapreputa</Company><AppVersion>1.0</AppVersion></Properties>`;
    files['xl/workbook.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/></bookViews><sheets><sheet name="Dashboard" sheetId="1" r:id="rId1"/><sheet name="Clienti" sheetId="2" r:id="rId2"/><sheet name="Vendite mensili" sheetId="3" r:id="rId3"/><sheet name="Categorie" sheetId="4" r:id="rId4"/></sheets><calcPr calcId="191029"/></workbook>`;
    files['xl/_rels/workbook.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    files['xl/styles.xml'] = stylesXml();
    files['xl/worksheets/sheet1.xml'] = dashboardSheet(clients,summary,monthRows,exportDate);
    files['xl/worksheets/sheet2.xml'] = clientsSheet(clients);
    files['xl/worksheets/sheet3.xml'] = salesSheet(clients,year,monthRows);
    files['xl/worksheets/sheet4.xml'] = categoriesSheet(clients,summary);
    files['xl/worksheets/_rels/sheet1.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`;
    files['xl/drawings/drawing1.xml'] = drawingXml();
    files['xl/drawings/_rels/drawing1.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart2.xml"/></Relationships>`;
    files['xl/charts/chart1.xml'] = chart1Xml();
    files['xl/charts/chart2.xml'] = chart2Xml();
    return files;
  }

  let crcTable;
  function crc32(bytes){
    if (!crcTable){ crcTable = new Uint32Array(256); for(let x=0;x<256;x++){ let c=x; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); crcTable[x]=c>>>0; } }
    let c=0xFFFFFFFF; for(const b of bytes) c=crcTable[(c^b)&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0;
  }
  function u16(x){ return Uint8Array.of(x&255,(x>>>8)&255); }
  function u32(x){ return Uint8Array.of(x&255,(x>>>8)&255,(x>>>16)&255,(x>>>24)&255); }
  function concat(parts){ const len=parts.reduce((s,p)=>s+p.length,0); const out=new Uint8Array(len); let o=0; for(const p of parts){out.set(p,o);o+=p.length;} return out; }
  function dosDateTime(date){ const y=Math.max(1980,date.getFullYear()); return {time:(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1),date:((y-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate()}; }
  function zipStore(files){
    const now=new Date(), dt=dosDateTime(now), locals=[], centrals=[]; let offset=0;
    for(const [name,text] of Object.entries(files)){
      const nameBytes=enc.encode(name), data=typeof text==='string'?enc.encode(text):text, crc=crc32(data);
      const local=concat([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),nameBytes,data]);
      locals.push(local);
      const central=concat([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBytes]);
      centrals.push(central); offset+=local.length;
    }
    const centralData=concat(centrals); const localData=concat(locals);
    const end=concat([u32(0x06054b50),u16(0),u16(0),u16(centrals.length),u16(centrals.length),u32(centralData.length),u32(localData.length),u16(0)]);
    return concat([localData,centralData,end]);
  }

  function bytesToBase64(bytes){ let binary=''; const chunk=0x8000; for(let p=0;p<bytes.length;p+=chunk) binary+=String.fromCharCode(...bytes.subarray(p,p+chunk)); return btoa(binary); }
  function saveBytes(bytes,fileName){
    if (window.TapAndroid?.saveBase64File){
      window.TapAndroid.saveBase64File(bytesToBase64(bytes),fileName,MIME_XLSX);
      return;
    }
    const blob=new Blob([bytes],{type:MIME_XLSX});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=fileName; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000);
  }

  async function runExport(){
    const btn=document.getElementById('exportExcelBtn');
    const previous=btn?.innerHTML;
    try{
      if(btn){btn.disabled=true;btn.textContent='Creo Excel…';}
      const user=await TapNfc.requireAuth(); if(!user) return;
      const clients=await TapNfc.listClients();
      if(!Array.isArray(clients) || !clients.length) throw new Error('Non ci sono clienti da esportare.');
      const year=Number(document.getElementById('yearSelect')?.value)||new Date().getFullYear();
      const now=new Date();
      const files=packageFiles(clients,year,now); const bytes=zipStore(files);
      const stamp=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
      saveBytes(bytes,`Tapreputa_Report_${stamp}.xlsx`);
      localStorage.setItem(LAST_EXPORT_KEY,now.toISOString()); updateStamp();
      if(btn){btn.textContent='✓ Esportato'; setTimeout(()=>{btn.innerHTML=previous;btn.disabled=false;},1600);}
    }catch(err){
      console.error('[Tapreputa Excel export]',err);
      alert('Esportazione non riuscita: '+(err?.message||'riprova.'));
      if(btn){btn.innerHTML=previous;btn.disabled=false;}
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',injectUi,{once:true}); else injectUi();
  window.TapExcelExport = Object.freeze({run:runExport,version:'1.0'});
})();