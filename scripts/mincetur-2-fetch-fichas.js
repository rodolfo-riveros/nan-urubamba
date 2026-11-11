const fs=require('fs');
const [,,inFile,outDir]=process.argv;
const rows=JSON.parse(fs.readFileSync(inFile,'utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dec=s=>s.replace(/&nbsp;/g,' ').replace(/&aacute;/g,'á').replace(/&eacute;/g,'é').replace(/&iacute;/g,'í').replace(/&oacute;/g,'ó').replace(/&uacute;/g,'ú').replace(/&ntilde;/g,'ñ').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n));
(async()=>{
  fs.mkdirSync(outDir,{recursive:true});
  for(const r of rows){
    const code=r['CODIGO DEL RECURSO'].trim();
    const f=`${outDir}/${code}.html`;
    if(fs.existsSync(f)) continue;
    try{
      const res=await fetch(`https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=${code}`,{headers:{'User-Agent':'NanUrubamba-data-import/1.0'}});
      fs.writeFileSync(f,await res.text());
      process.stdout.write(code+' ');
    }catch(e){console.log('ERR',code,e.message)}
    await sleep(800);
  }
  console.log('\ndone');
})();
