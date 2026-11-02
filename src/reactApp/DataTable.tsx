import {useState} from 'react';
import {useText} from './locale';
import {Reading} from './Reading';
import {tableColumns,tableValue,downloadTable,type DataRow,type TableContext} from './tableExport';

export default function DataTable({rows,title,explanation,interpretation,source}:{rows:DataRow[]}&TableContext){
 const t=useText();const [busy,setBusy]=useState(false),[error,setError]=useState('');const columns=tableColumns(rows);
 return <section className="data-table" aria-label={title}><div className="table-heading"><h3>{title}</h3><button type="button" disabled={busy||!rows.length} onClick={async()=>{setBusy(true);setError('');try{await downloadTable(rows,{title,explanation,interpretation,source});}catch{setError(t('No se pudo exportar la tabla. Revisa los datos e inténtalo de nuevo.','Could not export the table. Check the data and retry.'));}finally{setBusy(false);}}}>{busy?t('Preparando Excel…','Preparing Excel…'):t('Descargar Excel','Download Excel')}</button></div>
 {error?<p role="alert">{error}</p>:null}<Reading explanation={explanation} interpretation={interpretation}/>
 {rows.length?<div className="table-scroll" tabIndex={0} role="region" aria-label={title}><table><thead><tr>{columns.map(c=><th scope="col" key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{columns.map(c=>{const value=tableValue(r,c);return <td key={c}>{typeof value==='number'?Number(value).toLocaleString(undefined,{maximumSignificantDigits:6}):value===null||value===undefined?'—':typeof value==='object'?JSON.stringify(value):String(value)}</td>})}</tr>)}</tbody></table></div>:<p>{t('Sin registros disponibles.','No records available.')}</p>}
 <small>{t('Fuente','Source')}: {source}. {t('Excel incluye las filas completas de esta tabla y sus textos explicativos.','Excel contains all rows of this table and its explanatory text.')}</small></section>;
}
