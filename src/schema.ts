// Runtime contracts also infer the TypeScript types accepted by application code.
export type Schema<T> = (input: unknown, path?: string) => T;
export type Parsed<S extends Schema<unknown>> = ReturnType<S>;
function fail(path: string, message: string): never {
  throw new Error(path + ': ' + message);
}
export const nonempty: Schema<string> = (x,p='value') => {
  if(typeof x !== 'string' || !x.trim()) fail(p,'enter a non-empty value');
  return x.trim();
};
export const finite: Schema<number> = (x,p='value') => {
  if(typeof x !== 'number' || !Number.isFinite(x)) fail(p,'enter a finite number');
  return x;
};
export function oneOf<const T extends readonly string[]>(...values:T): Schema<T[number]> {
  return (x,p='value') => {
    if(typeof x !== 'string' || !values.includes(x)) fail(p,'choose '+values.join(', '));
    return x as T[number];
  };
}
export function nullable<T>(parse: Schema<T>): Schema<T|null> {
  return (x,p) => x===null ? null : parse(x,p);
}
export function list<T>(parse: Schema<T>): Schema<T[]> {
  return (x,p='value') => {
    if(!Array.isArray(x)) fail(p,'expected a list');
    return Array.from(x,(item,i)=>parse(item,p+'['+i+']'));
  };
}
export function object<S extends Record<string,Schema<unknown>>>(shape:S): Schema<{[K in keyof S]:ReturnType<S[K]>}> {
  return (x,p='value') => {
    if(!x || typeof x!=='object' || Array.isArray(x)) fail(p,'expected a record');
    const raw=x as Record<string,unknown>;
    for(const key of Object.keys(raw)) if(!Object.hasOwn(shape,key)) fail(p+'.'+key,'unrecognized field');
    return Object.fromEntries(Object.entries(shape).map(([key,parse])=>[key,parse(raw[key],p+'.'+key)])) as {[K in keyof S]:ReturnType<S[K]>};
  };
}
export function checked<T>(parse:Schema<T>,test:(v:T)=>boolean,message:string):Schema<T> {
  return (x,p='value')=>{
    const v=parse(x,p);
    if(!test(v)) fail(p,message);
    return v;
  };
}
export const date=checked(nonempty,v=>/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v,'use a valid calendar date (YYYY-MM-DD)');
