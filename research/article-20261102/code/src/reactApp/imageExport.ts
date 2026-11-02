/** Exporta figuras a resolución real, sin capturar controles de la aplicación. */
export interface ExportImage { blob:Blob; width:number; height:number }
export interface FigureInfo { title:string; caption:string; background:string; foreground:string }
export type ImageFormat='png'|'svg';
const NS='http://www.w3.org/2000/svg';

export function safeImageName(name:string){
 return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)||'resilience-figure';
}

export function imageSize(width:number,aspect:number,maxSide=8192){
 if(![1920,3840].includes(width)||!Number.isFinite(aspect)||aspect<=0||!Number.isFinite(maxSide)||maxSide<1)throw new Error('Invalid image dimensions');
 const height=Math.round(width/aspect);
 const scale=Math.min(1,maxSide/width,maxSide/height,Math.sqrt(16_777_216/(width*height)));
 return {width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale))};
}

export function saveImage(image:ExportImage,name:string,format:ImageFormat){
 const url=URL.createObjectURL(image.blob);const link=document.createElement('a');
 link.href=url;link.download=`${safeImageName(name)}-${image.width}px.${format}`;
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function canvasBlob(canvas:HTMLCanvasElement):Promise<Blob>{
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed')),'image/png'));
}

function captionLines(text:string,max=100){
 const lines:string[]=[];let line='';
 for(const word of text.split(/\s+/)){if((line+' '+word).trim().length>max&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}
 if(line)lines.push(line);return lines;
}

export async function frameCanvas(source:HTMLCanvasElement,info:FigureInfo,legend:{label:string;color:string}[]=[]):Promise<ExportImage>{
 const width=source.width,unit=width/1200,lines=captionLines(info.caption);
 const header=Math.ceil(90*unit),footer=Math.ceil((35+lines.length*20+(legend.length?36:0))*unit);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=source.height+header+footer;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
 ctx.fillStyle=info.background;ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle=info.foreground;
 ctx.font=`${28*unit}px Georgia`;ctx.fillText(info.title,32*unit,55*unit,width-64*unit);
 ctx.drawImage(source,0,header);let y=header+source.height+28*unit;
 if(legend.length){let x=32*unit;ctx.font=`${15*unit}px sans-serif`;
  for(const item of legend){ctx.fillStyle=item.color;ctx.beginPath();ctx.arc(x+6*unit,y-5*unit,5*unit,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#888';ctx.stroke();ctx.fillStyle=info.foreground;ctx.fillText(item.label,x+20*unit,y);x+=ctx.measureText(item.label).width+58*unit;}y+=32*unit;}
 ctx.fillStyle=info.foreground;ctx.font=`${14*unit}px sans-serif`;
 for(const line of lines){ctx.fillText(line,32*unit,y,width-64*unit);y+=20*unit;}
 return {blob:await canvasBlob(canvas),width,height:canvas.height};
}

export function standaloneSvg(source:SVGSVGElement,info:FigureInfo,width:number):SVGSVGElement{
 const box=source.viewBox.baseVal;const bounds=source.getBoundingClientRect();
 const originalWidth=box.width||bounds.width,originalHeight=box.height||bounds.height;
 if(!originalWidth||!originalHeight)throw new Error('Figure is not ready');
 const size=imageSize(width,originalWidth/originalHeight),unit=size.width/1200,header=90*unit;
 const lines=captionLines(info.caption);const footer=(35+lines.length*20)*unit;
 const root=document.createElementNS(NS,'svg');root.setAttribute('xmlns',NS);root.setAttribute('width',String(size.width));
 root.setAttribute('height',String(Math.ceil(size.height+header+footer)));root.setAttribute('viewBox',`0 0 ${size.width} ${Math.ceil(size.height+header+footer)}`);
 const background=document.createElementNS(NS,'rect');background.setAttribute('width','100%');background.setAttribute('height','100%');background.setAttribute('fill',info.background);root.append(background);
 const title=document.createElementNS(NS,'text');title.setAttribute('x',String(32*unit));title.setAttribute('y',String(55*unit));title.setAttribute('font-family','Georgia, serif');title.setAttribute('font-size',String(28*unit));title.setAttribute('fill',info.foreground);title.textContent=info.title;root.append(title);
 const graphic=source.cloneNode(true) as SVGSVGElement;
 const originals=[source,...source.querySelectorAll('*')],copies=[graphic,...graphic.querySelectorAll('*')];
 const properties=['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','opacity','font-family','font-size','font-weight','text-anchor','dominant-baseline'];
 originals.forEach((node,i)=>{const style=getComputedStyle(node);for(const key of properties){const value=style.getPropertyValue(key);if(value)(copies[i] as SVGElement).style.setProperty(key,value);}});
 graphic.querySelectorAll('script,foreignObject').forEach(node=>node.remove());
 graphic.removeAttribute('class');graphic.style.width=`${size.width}px`;graphic.style.height=`${size.height}px`;
 graphic.setAttribute('x','0');graphic.setAttribute('y',String(header));graphic.setAttribute('width',String(size.width));graphic.setAttribute('height',String(size.height));
 graphic.setAttribute('viewBox',box.width?`${box.x} ${box.y} ${box.width} ${box.height}`:`0 0 ${originalWidth} ${originalHeight}`);root.append(graphic);
 lines.forEach((line,i)=>{const text=document.createElementNS(NS,'text');text.setAttribute('x',String(32*unit));text.setAttribute('y',String(header+size.height+(28+i*20)*unit));text.setAttribute('font-size',String(14*unit));text.setAttribute('font-family','sans-serif');text.setAttribute('fill',info.foreground);text.textContent=line;root.append(text);});
 return root;
}

export async function exportSvg(source:SVGSVGElement,info:FigureInfo,width:number,format:ImageFormat):Promise<ExportImage>{
 const svg=standaloneSvg(source,info,width),w=Number(svg.getAttribute('width')),h=Number(svg.getAttribute('height'));
 const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'});
 if(format==='svg')return {blob,width:w,height:h};
 const url=URL.createObjectURL(blob);try{
  const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('Could not render SVG'));image.src=url;});
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.drawImage(image,0,0);
  return {blob:await canvasBlob(canvas),width:w,height:h};
 }finally{URL.revokeObjectURL(url);}
}
