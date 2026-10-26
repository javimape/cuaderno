const supers={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','−':'⁻','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ'};
const subs={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','−':'₋','-':'₋','=':'₌','(':'₍',')':'₎','a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'};
const script=(text,map,fallback)=>[...text].every(c=>map[c])?[...text].map(c=>map[c]).join(''):`${fallback}(${text})`;
function walk(node){
 if(node.nodeType===3)return node.textContent;
 const children=[...node.children];const val=i=>walk(children[i]||document.createTextNode(''));
 switch(node.localName){
  case 'annotation':case 'annotation-xml':return '';
  case 'semantics':return val(0);
  case 'mfrac':return `(${val(0)})/(${val(1)})`;
  case 'msup':return val(0)+script(val(1),supers,'^');
  case 'msub':return val(0)+script(val(1),subs,'_');
  case 'msubsup':return val(0)+script(val(1),subs,'_')+script(val(2),supers,'^');
  case 'msqrt':return `√(${children.map(walk).join('')})`;
  case 'mroot':return `raíz[${val(1)}](${val(0)})`;
  case 'mover':{const accent=val(1);return /[→⃗]/.test(accent)?`vec(${val(0)})`:accent==='¯'?`${val(0)}̄`:`${val(0)}[${accent}]`;}
  case 'munder':return `${val(0)}_(${val(1)})`;
  case 'munderover':return `${val(0)}_(${val(1)})^(${val(2)})`;
  case 'mtable':return children.map(walk).join('; ');
  case 'mtr':return children.map(walk).join('  ');
  case 'mspace':return ' ';
  case 'mo':{const text=node.textContent;return /[=<>≤≥+−±∓≈∈∉⇒→×⋅∧∨]/.test(text)?` ${text} `:text;}
  default:return children.length?children.map(walk).join(''):node.textContent;
 }
}
export function mathToText(tex){try{const html=window.katex.renderToString(tex,{output:'mathml',throwOnError:true,strict:false,trust:false});const doc=new DOMParser().parseFromString(html,'text/html');return walk(doc.querySelector('math')).replace(/\u2061/g,' ').replace(/[ \t]+/g,' ').trim();}catch{return tex;}}
export function plainText(value){return String(value??'').replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$|(?<!\\)\$([^\n$]+?)\$/g,(all,a,b,c,d)=>`${a!==undefined||c!==undefined?'\n':''}${mathToText(a??b??c??d)}${a!==undefined||c!==undefined?'\n':''}`).replace(/^#{1,6}\s+/gm,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/__([^_]+)__/g,'$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1 ($2)').replace(/`([^`]+)`/g,'$1').replace(/\n{3,}/g,'\n\n').trim();}
export function exerciseText(e,topic,format='plain'){
 const parts=[`${e.subject==='fisica'?'FÍSICA':'CÁLCULO'} · ${topic?.title||''} · Ejercicio ${e.number}`,e.title,'ENUNCIADO',e.statement];
 if(e.note)parts.push('OBSERVACIÓN SOBRE EL ENUNCIADO',e.note);
 if(e.diagrams?.length){parts.push('DIBUJOS PARA ENTENDER EL EJERCICIO');e.diagrams.forEach(d=>parts.push(d.title,d.caption,...d.guide.map((g,i)=>`${i+1}. ${g}`)));}
 e.steps.forEach((s,i)=>parts.push(`PASO ${i+1} · ${s.question}`,`Pista: ${s.hint}`,s.explanation,s.math?`\\[${s.math}\\]`:''));
 parts.push('RESULTADO',e.answer,'COMPROBACIONES',...(e.checks||[]).map(x=>`• ${x}`),'DUDAS Y ERRORES HABITUALES',...(e.pitfalls||[]).map(x=>`• ${x}`),`Fuente: ${e.source.file}, página ${e.source.page||1}.`);
 const text=parts.filter(Boolean).join('\n\n');return format==='latex'?text:plainText(text);
}
export async function copyText(text){
 try{await navigator.clipboard.writeText(text);return true;}catch{
  const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:.01';document.body.append(area);area.focus();area.select();area.setSelectionRange(0,text.length);let ok=false;try{ok=document.execCommand('copy');}catch{}area.remove();return ok;
 }
}
