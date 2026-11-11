const fs=require('fs');const path=require('path');
const sharp=require('sharp') // npm i --no-save sharp;
const [,,officialJson,outDir,tsOut]=process.argv;
const items=JSON.parse(fs.readFileSync(officialJson,'utf8')).items;
fs.mkdirSync(outDir,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const ok=[];
  for(const o of items){
    const dest=path.join(outDir,`${o.code}.jpg`);
    if(!fs.existsSync(dest)){
      let done=false;
      for(const url of o.fotos.slice(0,3)){
        try{
          const res=await fetch(url,{headers:{'User-Agent':'NanUrubamba-data-import/1.0'}});
          if(!res.ok) continue;
          const buf=Buffer.from(await res.arrayBuffer());
          await sharp(buf).rotate().resize({width:960,height:640,fit:'cover',position:'attention'}).jpeg({quality:68,mozjpeg:true}).toFile(dest);
          done=true;break;
        }catch(e){console.log('err',o.code,e.message)}
        await sleep(400);
      }
      if(!done){console.log('sin foto',o.code,o.name);continue;}
      await sleep(500);
    }
    ok.push(o.code);process.stdout.write(o.code+' ');
  }
  const lines=ok.map(c=>`  '${c}': require('../../assets/places/${c}.jpg'),`).join('\n');
  fs.writeFileSync(tsOut,`// Generado por scripts: portadas oficiales (MINCETUR, fichas del Inventario Nacional de Recursos Turísticos)\n// redimensionadas a 960x640 y empaquetadas para funcionar sin conexión.\n/* eslint-disable @typescript-eslint/no-require-imports */\nexport const COVERS: Record<string, number> = {\n${lines}\n};\n`);
  console.log('\ncovers:',ok.length);
})();
