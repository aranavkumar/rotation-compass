import assert from 'node:assert/strict';
import './build-planner.mjs';
const {default: worker} = await import('../dist/server/index.js');
const get = path => worker.fetch(new Request('https://local/planner/' + path));
const html = await (await get('index.html')).text();
for (const view of ['setup','evidence','explorer','details','scenario','methodology']) {
  assert.ok(html.includes('href="#'+view+'"'));
  assert.ok(html.includes('id="'+view+'"'));
}
const {sample, choices, sampleEnvironment, sampleProfile} = await import('../public/planner/fixture.js');
for (const sequence of [sample.farm.sequence,...sample.alternatives]) {
  assert.equal(sequence.length,3);
  sequence.forEach((crop,i)=>assert.ok(choices[i].includes(crop)));
}
assert.deepEqual(await (await get('environment.json')).json(), sampleEnvironment);
assert.equal((await get('engine.js')).status,404);
console.log('Passed six-view routes, season choices, example chart payload and absence of scoring asset.');
const {CropProfileSchema,FarmProfileSchema,ScenarioSchema,EnvironmentalContextSchema,RotationPlanSchema}=await import('../public/planner/contracts.js');
const {catalogue,makePlan,validatePilotPlan}=await import('../public/planner/ludhiana.js');
const plan=makePlan(sample.farm.sequence,'sample');
const overlap=structuredClone(plan);
overlap.slots[1].window.start=overlap.slots[0].window.end;
assert.throws(()=>RotationPlanSchema(overlap),/shared dates/);
const gap=structuredClone(plan);
gap.slots[1].window.start='2026-11-02';
assert.throws(()=>validatePilotPlan(gap),/configured/);
assert.throws(()=>makePlan(['Rice','Maize','Rice'],'sample'),/season|Season/);
assert.throws(()=>makePlan(['Rice','Wheat'],'sample'),/three seasons/);
for(const basis of ['measured','farmer-reported','estimated']) {
  const soil={...sampleProfile.soil,basis,origin:'user-entered'};
  assert.deepEqual(FarmProfileSchema({...sampleProfile,soil}).soil,soil);
}
const unknown={...sampleProfile.soil,texture:null,basis:'unknown'};
assert.equal(FarmProfileSchema({...sampleProfile,soil:unknown}).soil.texture,null);
assert.throws(()=>FarmProfileSchema({...sampleProfile,soil:{...unknown,basis:'measured'}}),/input basis/);
assert.throws(()=>FarmProfileSchema({...sampleProfile,soil:{...unknown,measuredOn:'2026-02-30'}}),/calendar date/);
assert.throws(()=>ScenarioSchema({kind:'hypothetical',waterPriorityPercent:101,rainfallChangePercent:null}),/priority/);
assert.throws(()=>EnvironmentalContextSchema({...sampleEnvironment,origin:'downloaded'}),/retrieval date/);
assert.throws(()=>CropProfileSchema({...catalogue[0],rotationRules:[{rule:'unsupported'}]}),/evidence/);
assert.throws(()=>CropProfileSchema({...catalogue[0],thresholds:[{parameter:'temp',value:20,evidence:{}}]}),/source/);
assert.equal(catalogue.length,6);
console.log('Passed contract checks for dates, overlapping windows, season eligibility, soil provenance, environmental provenance, scenario bounds and agricultural citations.');
const powerRequest = (query='')=>worker.fetch(new Request('https://local/api/power?'+query));
const baseline=await (await powerRequest()).json();
assert.equal(baseline.origin,'cached-real');
assert.equal(baseline.seasons.length,6);
const {readFileSync}=await import('node:fs');
const raw=JSON.parse(readFileSync('data/ludhiana-daily.json')).payload;
const rain=raw.properties.parameter.PRECTOTCORR;
const reference=Object.entries(rain).filter(([key])=>key>='20220601'&&key<='20221031').reduce((sum,[,v])=>sum+v,0);
assert.equal(baseline.seasons[0].totalMm,reference);
assert.equal(baseline.seasons[3].days,213); // Winter 2023 includes leap day.
const {summarize}=await import('../dist/server/index.js');
const broken=structuredClone(raw);
delete broken.properties.parameter.PRECTOTCORR['20220601'];
broken.properties.parameter.T2M['20220601']=raw.header.fill_value;
const first=summarize(broken,2022,2024,'test').seasons[0];
assert.equal(first.totalMm,null);
assert.equal(first.tempDays,first.days-1);
assert.equal(first.rainDays,first.days-1);
globalThis.fetch=async()=>new Response('',{status:503});
assert.equal((await powerRequest('first=2020&last=2021')).status,503);
assert.match((await (await powerRequest('refresh=1')).json()).message,/retrieve/);
assert.equal((await powerRequest('first=2024&last=2022')).status,400);
globalThis.fetch=async()=>Response.json(raw);
assert.equal((await (await powerRequest('refresh=1')).json()).origin,'live-retrieved');
assert.equal((await (await powerRequest()).json()).origin,'cached-real');
console.log('Passed NASA snapshot, leap year, missing days, cache isolation, refresh and outage checks.');
const {evaluate,assess}=await import('../public/planner/evaluator.js');
const conditions={irrigation:'yes',drainage:'yes',salt:'no',texture:'Loam',ph:7,residue:'yes',history:baseline.seasons,weights:[25,25,25,25]};
const crops=['Rice','Wheat','Rice'];
const evaluation=evaluate(crops,conditions);
assert.deepEqual(evaluation,evaluate(crops,conditions));
assert.equal(evaluation.candidates.length,26);
assert.ok(evaluation.baseline.score!==null);
assert.ok(evaluation.alternatives.length>0 && evaluation.alternatives.length<=3);
for (const [i,a] of evaluation.alternatives.entries()){
  assert.equal(a.status,'Feasible within pilot checks');
  assert.ok(a.score>=0&&a.score<=100);
  for(const b of evaluation.alternatives.slice(0,i))assert.ok(a.sequence.filter((c,j)=>c!==b.sequence[j]).length>=2);
}
assert.equal(evaluate(crops,{...conditions,irrigation:''}).alternatives.length,0);
assert.equal(assess(crops,{...conditions,ph:null}).status,'Incomplete');
assert.equal(assess(crops,{...conditions,ph:10}).status,'Failed');
assert.equal(assess(crops,{...conditions,irrigation:'no'}).status,'Failed');
assert.equal(assess(crops,{...conditions,history:[]}).score,null);
assert.equal(assess(crops,{...conditions,weights:[0,0,0,0]}).score,null);
assert.equal(assess(crops,{...conditions,history:[],weights:[0,0,1,0]}).score,25);
console.log('Passed 27-sequence enumeration, deterministic ranking, missing inputs, hard exclusions, score bounds and alternative distance.');
console.log('Sample:',evaluation.baseline.score,evaluation.alternatives.map(p=>[p.sequence.join(' → '),p.score]));
const {scenarioField}=await import('../public/planner/evaluator.js');
const snapshot=structuredClone(conditions);
const dry=scenarioField(conditions,-100,3,'no',[10,40,25,25]);
assert.deepEqual(conditions,snapshot);
assert.ok(dry.history.every((s,i)=>s.totalMm===0 && s.meanC===conditions.history[i].meanC+3));
assert.equal(assess(crops,dry).status,'Failed');
assert.equal(assess(crops,dry).scores[1],0);
const dryIrrigated={...dry,irrigation:'yes'};
assert.ok(evaluate(crops,dryIrrigated).ranked.length);
assert.deepEqual(evaluate(crops,scenarioField(conditions,0,0,'yes',conditions.weights)),evaluation);
const gaps={...conditions,history:[{...conditions.history[0],totalMm:null,meanC:null}]};
assert.deepEqual(scenarioField(gaps,25,-2,'yes',conditions.weights).history,gaps.history);
console.log('Passed scenario isolation, units, missing observations, irrigation failure, reranking and reset equivalence.');
// Reference-system field occupation uses inclusive dates.
assert.deepEqual(evaluation.baseline.schedule,[
  'PR 126, transplanted · 2026-06-21 to 2026-09-21 (93 days)',
  'PBW 826, timely irrigated · 2026-11-01 to 2027-03-28 (148 days)',
  'PR 126, transplanted · 2027-06-21 to 2027-09-21 (93 days)'
]);
assert.ok(assess(crops,{...conditions,drainage:'no',salt:'yes'}).failures.includes('Wheat · requires a well-drained field'));
assert.ok(assess(crops,{...conditions,texture:'',ph:null}).missing.includes('Field soil texture missing'));
const partial=assess(crops,{...conditions,history:conditions.history.map(r=>({...r,tempDays:r.days-1}))});
assert.equal(partial.score,null);
assert.equal(partial.scores[0],null);
assert.equal(partial.scores[1],evaluation.baseline.scores[1]);
const scaled=evaluate(crops,{...conditions,weights:[1,1,1,1]});
assert.deepEqual(scaled.ranked.map(p=>p.sequence),evaluation.ranked.map(p=>p.sequence));
assert.ok(Math.abs(scaled.baseline.score-evaluation.baseline.score)<1e-10);
for(const weights of [[1],[-1,1,1,1],[1,1,NaN,1]])assert.throws(()=>assess(crops,{...conditions,weights}),/weights/);
const failed=evaluate(crops,{...conditions,irrigation:'no',salt:'yes',drainage:'no'});
assert.ok(failed.candidates.every(p=>p.status==='Failed'));
assert.deepEqual(failed.alternatives,[]);
const shifted=evaluate(crops,scenarioField(conditions,-50,3,'yes',[100,25,25,25]));
assert.notDeepEqual(shifted.ranked.map(p=>p.sequence),evaluation.ranked.map(p=>p.sequence));
globalThis.fetch=async()=>{throw Error('offline')};
const fallback=await (await powerRequest('refresh=1')).json();
assert.equal(fallback.origin,'cached-real');
assert.deepEqual(fallback.seasons,baseline.seasons);
assert.equal((await (await powerRequest('first=2019&last=2019')).json()).origin,'unavailable');
console.log('Passed calendar, evidence-gap, priority, scenario rank movement, empty shortlist and offline fallback regressions.');
