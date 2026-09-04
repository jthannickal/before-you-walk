import {writeFile,mkdir} from 'node:fs/promises';
import {runAgent} from './runner.ts';
const result=await runAgent();
await mkdir('public/evidence',{recursive:true});
await writeFile('public/evidence/strands-run.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(!result.trace.some(e=>e.tool==='record_interpretation'&&(e.output as {recorded?:boolean})?.recorded))process.exitCode=1;
