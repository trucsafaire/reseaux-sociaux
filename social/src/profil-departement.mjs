import satori from "satori"; import {Resvg} from "@resvg/resvg-js"; import fs from "node:fs";
import {createRequire} from "node:module"; const require=createRequire(import.meta.url);
const fonts=[{name:"Outfit",weight:700,data:fs.readFileSync(require.resolve("@fontsource/outfit/files/outfit-latin-700-normal.woff"))}];
const s=fs.readFileSync(new URL("../../marque/icone.svg", import.meta.url),"utf8");
const inner=s.replace(/^[\s\S]*?<\/title>/,"").replace(/<path d="M32 0C52[^>]*\/>/,"").replace(/<circle[^>]*\/>/,"").replace(/<\/svg>\s*$/,"");
const [,,code,out]=process.argv;
// le t sans confetti, décalé à gauche ; le numéro prend la place du point
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g transform="translate(4 9.6) scale(0.7)">${inner}</g></svg>`;
const uri="data:image/svg+xml;base64,"+Buffer.from(svg).toString("base64");
const h=(t,st,...c)=>({type:t,props:{style:{display:"flex",...st},children:c.length===1?c[0]:c}});
// tout tient dans le cercle de recadrage des réseaux sociaux
const tree=h("div",{width:1080,height:1080,background:"#2546D8",position:"relative",fontFamily:"Outfit"},
  h("div",{position:"absolute",left:-43,top:4,width:1080,height:1080,transform:"scale(0.82)"},
    {type:"img",props:{src:uri,style:{position:"absolute",left:0,top:0,width:1080,height:1080}}},
    h("div",{position:"absolute",left:640,top:560,color:"#FF8A3D",fontSize:250,fontWeight:700,letterSpacing:-6,lineHeight:1},code)));
fs.writeFileSync(out,new Resvg(await satori(tree,{width:1080,height:1080,fonts})).render().asPng());
