import React from 'react';
export {Locale,useText} from './locale';
export function Heading({eyebrow,title,children}:{eyebrow:string;title:string;children?:React.ReactNode}){return <header className="page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{children?<p>{children}</p>:null}</header>}
export function Note({children,error=false}:{children:React.ReactNode;error?:boolean}){return <p className={`notice ${error?'error':''}`} role={error?'alert':'status'}>{children}</p>}
export function Metric({label,value}:{label:string;value:React.ReactNode}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>}
export {default as Table} from './DataTable';
