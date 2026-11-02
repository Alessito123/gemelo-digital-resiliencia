import test from 'node:test';
import assert from 'node:assert/strict';
import {imageSize,safeImageName} from '../src/reactApp/imageExport';

test('export dimensions preserve 4K landscape and bound portrait GPU memory',()=>{
 assert.deepEqual(imageSize(3840,16/9),{width:3840,height:2160});
 const portrait=imageSize(3840,.25,4096);
 assert.ok(portrait.width<=4096&&portrait.height<=4096);
 assert.ok(portrait.width*portrait.height<=16_777_216);
 assert.ok(Math.abs(portrait.width/portrait.height-.25)<.001);
 assert.throws(()=>imageSize(10,1));assert.throws(()=>imageSize(3840,0));assert.throws(()=>imageSize(3840,NaN));
 assert.throws(()=>imageSize(3840,1,0));
});
test('image filenames remain portable with translated titles',()=>{
 assert.equal(safeImageName('Correlación / Lima: 30 min'),'correlacion-lima-30-min');
 assert.equal(safeImageName('***'),'resilience-figure');
 assert.ok(safeImageName('a'.repeat(300)).length<=100);
});
