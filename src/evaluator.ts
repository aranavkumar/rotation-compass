import {calendar,catalogue} from './ludhiana.js';
import {families,systems,wheatPartners} from './evaluation-config.js';
import type {PowerSummary} from './power.js';
export const components=['Climate suitability','Water-demand fit','Rotation diversity','Soil-supporting practice'] as const;
export interface FieldConditions {
  irrigation:string; drainage:string; salt:string; texture:string; ph:number|null;
  residue:string; history:PowerSummary['seasons']; weights:number[];
}
type Value=number|null;
const day=86400000;
const mean=(values:number[])=>values.reduce((a,b)=>a+b,0)/values.length;
const completeMean=(values:Value[])=>values.length===3 && values.every((n):n is number=>n!==null)?mean(values):null;
function distance(a:string[],b:string[]){return a.filter((crop,i)=>crop!==b[i]).length}
export function assess(sequence:string[],field:FieldConditions) {
  if(sequence.length!==3)throw Error('Choose exactly three seasons.');
  if(field.weights.length!==4||field.weights.some(n=>!Number.isFinite(n)||n<0))throw Error('Use four nonnegative priority weights.');
  const failures=new Set<string>(),missing=new Set<string>(),schedule:string[]=[], notes=new Set<string>();
  const climate:Value[]=[],water:Value[]=[];
  let previousEnd='';
  function requirement(value:string,expected:string,label:string) {
    if(!value)missing.add(label+' · field input missing');
    else if(value!==expected)failures.add(label);
  }
  sequence.forEach((crop,i)=>{
    const slot=calendar[i], system=systems[crop], prefix=crop+' · ';
    if(!catalogue.some(c=>c.name===crop&&c.season===slot.season))failures.add(prefix+'outside configured season');
    if(!system){missing.add(prefix+'cultivar window and duration unavailable');water.push(null);climate.push(null);return}
    const year=slot.start.slice(0,4);
    const start=[slot.start,year+'-'+system.earliest].sort()[1];
    const end=new Date(Date.parse(start)+(system.days-1)*day).toISOString().slice(0,10);
    if(start>year+'-'+system.latest || end>slot.end)failures.add(prefix+'cannot fit the planting window and duration');
    if(previousEnd>=start)failures.add(prefix+'overlaps the preceding crop');
    previousEnd=end;
    schedule.push(system.variety+' · '+start+' to '+end+' ('+system.days+' days)');
    if(system.irrigated)requirement(field.irrigation,'yes',prefix+'irrigation required for reference system');
    if(crop!=='Rice')requirement(field.drainage,'yes',prefix+'requires a well-drained field');
    if(crop==='Wheat'||crop==='Moong')requirement(field.salt,'no',prefix+'requires absence of severe saline/alkaline soil limitation');
    if(crop==='Rice'){
      if(field.ph===null||!Number.isFinite(field.ph))missing.add('Rice · soil pH missing');
      else if(field.ph<5||field.ph>9)failures.add('Rice · outside PAU documented pH suitability range 5–9');
    }
    if(!field.texture)missing.add('Field soil texture missing');
    if(crop==='Moong'&&field.texture && field.texture!=='Loam')missing.add('Moong · texture outside verified loamy reference conditions');
    const history=field.history.filter(row=>row.season===slot.season);
    const t=system.thermalC, w=system.waterMm;
    const temperature=t && history.length && history.every(r=>r.tempDays===r.days&&r.meanC!==null)
      ?100*mean(history.map(r=>Number(r.meanC!>=t[0]&&r.meanC!<=t[1]))):null;
    const rain=w && history.length && history.every(r=>r.rainDays===r.days&&r.totalMm!==null)
      ?100*mean(history.map(r=>Math.min(1,r.totalMm!/mean(w)))):null;
    climate.push(temperature);water.push(rain);
    if(temperature===null)notes.add(prefix+'climate component lacks a comparable band or complete historical coverage');
    if(rain===null)notes.add(prefix+'water component lacks a demand range or complete historical coverage');
    if(i>0){
      const pair=[sequence[i-1],crop];
      if(!pair.includes('Wheat') || !pair.some(c=>wheatPartners.includes(c)))
        missing.add(pair.join(' → ')+' · transition outside documented pilot rotations');
    }
  });
  const distinct=new Set(sequence).size;
  const breaks=sequence.slice(1).filter((c,i)=>families[c]!==families[sequence[i]]).length;
  const scores:Value[]=[completeMean(climate),completeMean(water),25*(distinct-1+breaks),field.residue==='yes'?100:field.residue==='no'?0:null];
  if(scores[3]===null)notes.add('Residue retention plan missing');
  const totalWeight=field.weights.reduce((a,b)=>a+b,0);
  const status=failures.size?'Failed':missing.size?'Incomplete':'Feasible within pilot checks';
  const score=status==='Feasible within pilot checks' && totalWeight>0 && scores.every((v,i)=>v!==null || field.weights[i]===0)
    ?scores.reduce<number>((sum,v,i)=>sum+(v??0)*field.weights[i],0)/totalWeight:null;
  return {sequence,status,score,scores,schedule,failures:[...failures],missing:[...missing],notes:[...notes],distinct,breaks};
}
export function evaluate(current:string[],field:FieldConditions){
  const baseline=assess(current,field);
  const slots=calendar.map(s=>catalogue.filter(c=>c.season===s.season).map(c=>c.name));
  const candidates=[];
  for(const first of slots[0])for(const second of slots[1])for(const third of slots[2]){
    const sequence=[first,second,third];
    if(distance(sequence,current))candidates.push(assess(sequence,field));
  }
  const eligible=candidates.filter(p=>p.score!==null).sort((a,b)=>{
    const diff=b.score!-a.score!;
    const x=a.sequence.join('/'),y=b.sequence.join('/');
    return diff||(x<y?-1:x>y?1:0);
  });
  const alternatives:typeof candidates=[];
  for(const candidate of eligible){
    if(alternatives.every(p=>distance(p.sequence,candidate.sequence)>=2))alternatives.push(candidate);
    if(alternatives.length===3)break;
  }
  return {baseline,alternatives,candidates,ranked:eligible};
}

export function scenarioField(base:FieldConditions,rainPercent:number,tempDeltaC:number,irrigation:string,weights:number[]):FieldConditions {
  return {...base,irrigation,weights:[...weights],history:base.history.map(row=>({...row,
    totalMm:row.totalMm===null?null:row.totalMm*(1+rainPercent/100),
    meanC:row.meanC===null?null:row.meanC+tempDeltaC
  }))};
}
