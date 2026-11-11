const fs=require('fs');
const [,,inFile,dir,outFile]=process.argv;
const rows=JSON.parse(fs.readFileSync(inFile,'utf8'));
const dec=s=>s.replace(/&nbsp;/g,' ').replace(/&aacute;/g,'á').replace(/&eacute;/g,'é').replace(/&iacute;/g,'í').replace(/&oacute;/g,'ó').replace(/&uacute;/g,'ú').replace(/&ntilde;/g,'ñ').replace(/&Ntilde;/g,'Ñ').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n));
const toLines=s=>dec(s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'\n')).split('\n').map(x=>x.trim()).filter(Boolean);
const HEAD=['Galería de fotos','Descripción','Estado actual','Tipo de Visitante','Ruta de acceso al recurso','Tipo de ingreso','Época propicia de visita al recurso','Actividades desarrolladas dentro del recurso turístico','Servicios Turísticos actuales fuera del recurso','Infraestructura','Servicios Turísticos actuales dentro del recurso'];
const out=[];
for(const r of rows){
  const code=r['CODIGO DEL RECURSO'].trim();
  const html=fs.readFileSync(`${dir}/${code}.html`,'utf8');
  const L=toLines(html);
  const after=(k)=>{const i=L.indexOf(k);return i>=0?L[i+1]:undefined};
  const section=(h)=>{const i=L.indexOf(h);if(i<0)return[];const res=[];for(let j=i+1;j<L.length;j++){if(HEAD.includes(L[j])&&L[j]!==h)break;res.push(L[j]);}return res;};
  const desc=section('Descripción').filter(x=>x!=='Descripción').join('\n\n');
  const estado=section('Estado actual').join(' ');
  // ruta: filas tras encabezados
  const ruta=section('Ruta de acceso al recurso');
  const rh=ruta.indexOf('Distancia en kms./tiempo');
  const rutaRows=[];
  if(rh>=0){const cells=ruta.slice(rh+1);let cur=null;for(const x of cells){if(/^\d+$/.test(x)){cur={n:+x,parts:[]};rutaRows.push(cur);continue;}if(cur)cur.parts.push(x);}
for(const r of rutaRows){r.parts=r.parts.filter(x=>x!=="-");}}
  const ing=section('Tipo de ingreso');const ingreso=ing.slice(ing.indexOf('Observaciones')+1).join(' ');
  const ep=section('Época propicia de visita al recurso');const epc=ep.slice(ep.indexOf('Observaciones')+1);
  const act=section('Actividades desarrolladas dentro del recurso turístico');
  const acts=act.slice(act.indexOf('Observación')+1).filter(x=>x!=='--');
  const fotos=[...new Set([...html.matchAll(/foto\.aspx\?cod=(\d+)/g)].map(m=>m[1]))];
  let lon=parseFloat(r.LATITUD),lat=parseFloat(r.LONGITUD);
  if(Math.abs(lat)>Math.abs(lon)){[lat,lon]=[lon,lat]} // corrige columnas invertidas
  out.push({code,name:r['NOMBRE DEL RECURSO'].trim().replace(/\s+/g,' '),district:r.DISTRITO.trim(),categoria:r['CATEGORÍA'],tipo:r['TIPO DE CATEGORÍA'],subtipo:r['SUB TIPO CATEGORÍA'],url:r.URL,lat,lon,
    toponimia:after('Toponimia:'),referencia:(()=>{const i=L.indexOf('Referencia:');return i>=0&&L[i+1]!=='Categoría:'?L[i+1]:undefined})(),
    jerarquia:(()=>{const i=L.indexOf('Jerarquía:');return i>=0?L[i+1]:undefined})(),altitud:(()=>{const i=L.indexOf('Altitud:');const v=i>=0?L[i+1]:'';return /\d/.test(v)?parseInt(v.replace(/[^\d]/g,'')):undefined})(),
    desc,estado,ruta:rutaRows,ingreso,epoca:epc,acts,fotos});
}
fs.writeFileSync(outFile,JSON.stringify(out,null,1));
console.log('ok',out.length);
