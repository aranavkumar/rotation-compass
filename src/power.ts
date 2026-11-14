import demo from '../data/ludhiana-daily.json' with {type:'json'};

interface DailyPayload {
  header: {title:string; sources:string[]; fill_value:number; start:string; end:string; time_standard:string};
  parameters: Record<string,{units:string;longname:string}>;
  geometry: {coordinates:number[]};
  properties:{parameter: Record<string,Record<string,number|null>>};
}
const day = 86400000;
function windowFor(year:number,winter:boolean) {
  return winter ? {season:'Rabi',start:year+'-11-01',end:(year+1)+'-05-31'}
    : {season:'Kharif',start:year+'-06-01',end:year+'-10-31'};
}
function requestUrl(first:number,last:number) {
  const url=new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
  url.search=new URLSearchParams({parameters:'PRECTOTCORR,T2M',community:'AG',longitude:'75.86',latitude:'30.90',start:first+'0601',end:(last+1)+'0531',format:'JSON','time-standard':'UTC'}).toString();
  return url.toString();
}
export function summarize(data:DailyPayload,first:number,last:number,retrieved:string) {
  const {header,parameters,geometry,properties}=data;
  if(header.start!==first+'0601'||header.end!==(last+1)+'0531'||header.time_standard!=='UTC'||
     !Number.isFinite(header.fill_value)||parameters.PRECTOTCORR.units!=='mm/day'||parameters.T2M.units!=='C'||
     !Array.isArray(header.sources)||!Array.isArray(geometry.coordinates)||geometry.coordinates.length<2||
     !geometry.coordinates.every(Number.isFinite)||!properties.parameter.PRECTOTCORR||!properties.parameter.T2M)
    throw Error('Unexpected POWER response metadata.');
  const series=properties.parameter;
  function daily(parameter:string,key:string) {
    const value=series[parameter][key];
    if(typeof value!=='number'||!Number.isFinite(value)||value===header.fill_value) return null;
    return parameter==='PRECTOTCORR' && value<0 ? null : value;
  }
  function seasonSummary(year:number,winter:boolean) {
    const window=windowFor(year,winter);
    let days=0,rainDays=0,tempDays=0,rainSum=0,tempSum=0;
    for(let t=Date.parse(window.start);t<=Date.parse(window.end);t+=day) {
      const key=new Date(t).toISOString().slice(0,10).replaceAll('-','');
      const rain=daily('PRECTOTCORR',key),temp=daily('T2M',key);
      days++;
      if(rain!==null){rainDays++;rainSum+=rain}
      if(temp!==null){tempDays++;tempSum+=temp}
    }
    return {...window,days,rainDays,tempDays,totalMm:rainDays===days?rainSum:null,meanC:tempDays?tempSum/tempDays:null};
  }
  const seasons=[];
  for(let year=first;year<=last;year++)seasons.push(seasonSummary(year,false),seasonSummary(year,true));
  if(!seasons.some(s=>s.rainDays||s.tempDays))throw Error('No valid daily observations in period.');
  return {seasons,provenance:{product:header.title,sources:header.sources,parameters,requested:[75.86,30.90],
    returned:geometry.coordinates,gridCentre:null,resolution:'0.5° latitude × 0.625° longitude',timeStandard:header.time_standard,
    start:header.start,end:header.end,retrieved,fillValue:header.fill_value,url:requestUrl(first,last)}};
}
export type PowerSummary=ReturnType<typeof summarize>;
const cache=new Map<string,PowerSummary>();
export async function power(request:Request) {
  const query=new URL(request.url).searchParams;
  const first=Number(query.get('first')??2022),last=Number(query.get('last')??2024);
  const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  const end=Date.UTC(last+1,4,31);
  if(!Number.isInteger(first)||!Number.isInteger(last)||first<1981||last<first||last-first>=10||!Number.isFinite(end)||end>=Date.now()-day)
    return json({origin:'unavailable',message:'Select 1–10 completed crop years starting in 1981 or later.'},400);
  const key=requestUrl(first,last);
  const snapshot=first===2022 && last===2024;
  const stored=cache.get(key)??(snapshot?summarize(demo.payload,first,last,demo.retrieved):null);
  if(stored && query.get('refresh')!=='1')return json({origin:'cached-real',...stored});
  try {
    const response=await fetch(key,{signal:AbortSignal.timeout(20000),cache:'no-store'});
    if(!response.ok)throw Error('NASA POWER returned HTTP '+response.status);
    const result=summarize(await response.json(),first,last,new Date().toISOString());
    if(cache.size>=40)cache.delete(cache.keys().next().value!);
    cache.set(key,result);
    return json({origin:'live-retrieved',...result});
  } catch {
    const message='Could not retrieve usable NASA POWER data for the requested period.';
    return stored?json({origin:'cached-real',message,...stored}):json({origin:'unavailable',message},503);
  }
}
