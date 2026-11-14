import {stripTypeScriptTypes} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
for (const name of ['schema','contracts','ludhiana','fixture','evaluation-config','evaluator','ui'])writeFileSync('public/planner/'+name+'.js',stripTypeScriptTypes(readFileSync('src/'+name+'.ts','utf8'),{mode:'transform'}));

const {sampleEnvironment}=await import('../public/planner/fixture.js');
writeFileSync('public/planner/environment.json',JSON.stringify(sampleEnvironment));
