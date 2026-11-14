import {CropProfileSchema, RotationPlanSchema, SeasonSchema} from './contracts.js';
import type {CropProfile, RotationPlan} from './contracts.js';

export const cropSource='https://pau.edu/coa/index.php?DO=viewMatter&_act=manageDepartments&intDepTitleID=339&intLinkID=2';
export const unresolved=['Pilot cultivar schedules for chickpea and mustard','Field-specific thermal survival and stage extremes','Validated local effective rainfall and irrigation demand','Disease-specific crop-family return intervals'];
const seasonEvidence={
  source:cropSource,reference:'PAU College of Agriculture, AGRON-211 and AGRON-212',
  region:'Punjab seasonal classification used for the Ludhiana pilot',
  assumptions:'Broad crop class only. Variety, field suitability and local sowing dates are unresolved.',
  units:'categorical season'
};
function crop(name:string,season:CropProfile['season']):CropProfile {
  return CropProfileSchema({name,season,district:'Ludhiana',seasonEvidence,thresholds:[],rotationRules:[],unresolved});
}
export const catalogue=[crop('Rice','Kharif'),crop('Maize','Kharif'),crop('Moong','Kharif'),crop('Wheat','Rabi'),crop('Chickpea','Rabi'),crop('Mustard','Rabi')];
// Fixed, inclusive planning bins for this example, not planting or harvest advice.
export const calendar=[
  {label:'Kharif 2026',season:'Kharif',start:'2026-06-01',end:'2026-10-31'},
  {label:'Rabi 2026–27',season:'Rabi',start:'2026-11-01',end:'2027-05-31'},
  {label:'Kharif 2027',season:'Kharif',start:'2027-06-01',end:'2027-10-31'}
].map(s=>SeasonSchema(s));

export function validatePilotPlan(input:unknown):RotationPlan {
  const plan=RotationPlanSchema(input,'rotation');
  plan.slots.forEach(({crop,window},i)=>{
    const expected=calendar[i];
    if(window.season!==expected.season || window.start!==expected.start || window.end!==expected.end || window.label!==expected.label)
      throw new Error('Season '+(i+1)+': use the configured '+expected.label+' window.');
    if(!catalogue.some(c=>c.name===crop && c.season===window.season))
      throw new Error('Season '+(i+1)+': select a configured '+window.season+' crop.');
  });
  return plan;
}
export function makePlan(crops:string[],origin:RotationPlan['origin']) {
  return validatePilotPlan({district:'Ludhiana',origin,slots:crops.map((crop,i)=>({crop,window:calendar[i]}))});
}
