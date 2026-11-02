import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {buildTableWorkbook,literalCell,tableColumns,tableValue} from '../src/reactApp/tableExport';

const context={title:'Datos científicos',explanation:'Explicación de la muestra',interpretation:'Resultados exploratorios',source:'UCI · CC BY 4.0'};
test('Excel preserves precision, all columns, missing values and explanatory context',()=>{
 const rows=[{id:'0001',value:.0000219,missing:null},{id:'0002',value:-.1576,missing:null,later:9}];
 const book=buildTableWorkbook(XLSX,rows,context,new Date('2026-10-26T00:00:00Z'));
 const saved=XLSX.read(XLSX.write(book,{bookType:'xlsx',type:'buffer'}),{type:'buffer'});
 assert.deepEqual(saved.SheetNames,['Datos','Lectura']);
 assert.equal(saved.Sheets.Datos.A2.v,'0001');assert.equal(saved.Sheets.Datos.A2.t,'s');
 assert.equal(saved.Sheets.Datos.B2.v,.0000219);assert.equal(saved.Sheets.Datos.B2.t,'n');
 assert.equal(saved.Sheets.Datos.B3.v,-.1576);assert.equal(saved.Sheets.Datos.D3.v,9);
 assert.equal(saved.Sheets.Datos.C2?.v,undefined);
 assert.match(JSON.stringify(saved.Sheets.Lectura),/Resultados exploratorios/);
 assert.equal(saved.Sheets.Datos['!autofilter']?.ref,'A1:D3');
});
test('untrusted strings and nested objects never become formulas or prototype fields',()=>{
 for(const value of ['=HYPERLINK("https://example.com")','+SUM(A1:A5)','@cmd','-1+2']){
  const cell=literalCell(value);assert.equal(cell.t,'s');assert.equal(cell.f,undefined);assert.equal(cell.v,value);
 }
 assert.equal(literalCell({f:'1+1'}).t,'s');assert.equal(literalCell(NaN).v,'NaN');
 const row=JSON.parse('{"__proto__":"literal","constructor":"text"}');
 assert.deepEqual(tableColumns([row,{later:1}]),['__proto__','constructor','later']);
 assert.equal(tableValue({},'constructor'),undefined);assert.equal(tableValue(row,'__proto__'),'literal');
 const book=buildTableWorkbook(XLSX,[{text:'=1+1'}],context);
 const saved=XLSX.read(XLSX.write(book,{bookType:'xlsx',type:'buffer'}),{type:'buffer'});
 assert.equal(saved.Sheets.Datos.A2.t,'s');assert.equal(saved.Sheets.Datos.A2.f,undefined);
 assert.throws(()=>literalCell('x'.repeat(32768)));assert.throws(()=>buildTableWorkbook(XLSX,[],context));
});
