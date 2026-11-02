import type * as SheetJS from 'xlsx';
import {safeImageName} from './imageExport';

export interface TableContext {title:string;explanation:string;interpretation:string;source:string}
export type DataRow=Record<string,unknown>;
export function tableColumns(rows:DataRow[]){return Array.from(new Set(rows.flatMap(row=>Object.keys(row))));}
export function tableValue(row:DataRow,column:string){return Object.prototype.hasOwnProperty.call(row,column)?row[column]:undefined;}

/** Las cadenas son celdas de texto explícitas: no se ejecutan como fórmulas. */
export function literalCell(value:unknown):SheetJS.CellObject{
 if(value===null||value===undefined)return {t:'z'};
 if(typeof value==='number'&&Number.isFinite(value))return {t:'n',v:value,z:Number.isInteger(value)?'#,##0':Math.abs(value)>0&&Math.abs(value)<.0001?'0.000000E+00':'0.0000'};
 if(typeof value==='boolean')return {t:'b',v:value};
 const text=typeof value==='object'?JSON.stringify(value):String(value);
 if(text.length>32767)throw new Error('A cell exceeds the Excel text limit');
 return {t:'s',v:text};
}

export function buildTableWorkbook(xlsx:typeof SheetJS,rows:DataRow[],context:TableContext,now=new Date()){
 const columns=tableColumns(rows);if(!rows.length||!columns.length)throw new Error('No data to export');
 if(rows.length>1_048_575||columns.length>16384)throw new Error('Excel size limit exceeded');
 const sheet:SheetJS.WorkSheet={};
 columns.forEach((col,c)=>{sheet[xlsx.utils.encode_cell({r:0,c})]=literalCell(col);});
 rows.forEach((row,i)=>columns.forEach((col,c)=>{sheet[xlsx.utils.encode_cell({r:i+1,c})]=literalCell(tableValue(row,col));}));
 sheet['!ref']=xlsx.utils.encode_range({s:{r:0,c:0},e:{r:rows.length,c:columns.length-1}});
 sheet['!autofilter']={ref:sheet['!ref']};
 sheet['!cols']=columns.map(col=>({wch:Math.min(48,Math.max(16,col.length+2,...rows.slice(0,100).map(row=>String(tableValue(row,col)??'').length)))}));
 const workbook=xlsx.utils.book_new();xlsx.utils.book_append_sheet(workbook,sheet,'Datos');
 const reading:SheetJS.WorkSheet={};let index=0;
 const metadata:[string,unknown][]=[['Tabla / Table',context.title],['Explicación / Explanation',context.explanation],['Interpretación / Interpretation',context.interpretation],['Fuente / Source',context.source],['Filas / Rows',rows.length],['Exportación UTC / Exported UTC',now.toISOString()],['Alcance / Scope','Instantánea de esta tabla; no incluye registros que la aplicación no haya mostrado en esta tabla. / Snapshot of this table, not additional dataset rows.']];
 for(const [label,value]of metadata){
  if(typeof value==='number'){reading[`A${index+1}`]=literalCell(label);reading[`B${index+1}`]=literalCell(value);index++;continue;}
  const words=String(value).split(/\s+/);const chunks:string[]=[];let line='';
  for(const word of words){if((line+' '+word).trim().length>95&&line){chunks.push(line);line=word;}else line=(line+' '+word).trim();}if(line)chunks.push(line);
  chunks.forEach((chunk,i)=>{reading[`A${index+1}`]=literalCell(i===0?label:'');reading[`B${index+1}`]=literalCell(chunk);index++;});index++;
 }
 reading['!ref']=`A1:B${index}`;reading['!cols']=[{wch:34},{wch:110}];
 xlsx.utils.book_append_sheet(workbook,reading,'Lectura');
 workbook.Props={Title:context.title,Subject:context.explanation,Comments:context.interpretation};
 return workbook;
}

export async function downloadTable(rows:DataRow[],context:TableContext){
 const xlsx=await import('xlsx');const book=buildTableWorkbook(xlsx,rows,context);
 const bytes=xlsx.write(book,{bookType:'xlsx',type:'array',compression:true});
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const link=document.createElement('a');link.href=url;link.download=`${safeImageName(context.title)}.xlsx`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
