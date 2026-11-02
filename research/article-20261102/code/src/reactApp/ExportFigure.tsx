import {useRef,useState,type ReactNode} from 'react';
import {exportSvg,saveImage,type ExportImage,type ImageFormat} from './imageExport';
import {useText} from './ui';

export function ExportTools({name,vector=false,render}:{name:string;vector?:boolean;render:(width:number,format:ImageFormat)=>Promise<ExportImage>}){
 const t=useText();const [width,setWidth]=useState(3840),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
 async function save(format:ImageFormat){setBusy(true);setStatus('');setError('');try{const result=await render(width,format);saveImage(result,name,format);setStatus(`${format.toUpperCase()} · ${result.width} × ${result.height} px`);}catch{setError(t('No se pudo exportar. Espera a que cargue la figura o prueba 1920 px.','Export failed. Wait for the figure to load or try 1920 px.'));}finally{setBusy(false);}}
 return <div className="image-export"><div className="image-export-controls"><label>{t('Ancho de imagen','Image width')}<select value={width} disabled={busy} onChange={e=>setWidth(Number(e.target.value))}><option value={1920}>1920 px · HD</option><option value={3840}>3840 px · 4K</option></select></label><button disabled={busy} onClick={()=>void save('png')}>{busy?t('Exportando…','Exporting…'):t('Descargar PNG','Download PNG')}</button>{vector?<button disabled={busy} onClick={()=>void save('svg')}>{t('Descargar SVG','Download SVG')}</button>:null}</div>{status?<small role="status">{status}</small>:null}{error?<small className="export-error" role="alert">{error}</small>:null}</div>;
}

export default function ExportFigure({title,caption,name,children}:{title:string;caption:string;name:string;children:ReactNode}){
 const host=useRef<HTMLDivElement>(null);
 return <figure className="export-figure"><figcaption><h3>{title}</h3><ExportTools name={name} vector render={async(width,format)=>{
  const svg=host.current?.querySelector('svg');if(!svg)throw new Error('Figure not ready');
  const style=getComputedStyle(document.documentElement);
  return exportSvg(svg,{title,caption,background:style.getPropertyValue('--paper').trim(),foreground:style.getPropertyValue('--ink').trim()},width,format);
 }}/></figcaption><div ref={host}>{children}</div><small>{caption}</small></figure>;
}
