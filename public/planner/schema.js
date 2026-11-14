function fail(path, message) {
    throw new Error(path + ': ' + message);
}
export const nonempty = (x, p = 'value')=>{
    if (typeof x !== 'string' || !x.trim()) fail(p, 'enter a non-empty value');
    return x.trim();
};
export const finite = (x, p = 'value')=>{
    if (typeof x !== 'number' || !Number.isFinite(x)) fail(p, 'enter a finite number');
    return x;
};
export function oneOf(...values) {
    return (x, p = 'value')=>{
        if (typeof x !== 'string' || !values.includes(x)) fail(p, 'choose ' + values.join(', '));
        return x;
    };
}
export function nullable(parse) {
    return (x, p)=>x === null ? null : parse(x, p);
}
export function list(parse) {
    return (x, p = 'value')=>{
        if (!Array.isArray(x)) fail(p, 'expected a list');
        return Array.from(x, (item, i)=>parse(item, p + '[' + i + ']'));
    };
}
export function object(shape) {
    return (x, p = 'value')=>{
        if (!x || typeof x !== 'object' || Array.isArray(x)) fail(p, 'expected a record');
        const raw = x;
        for (const key of Object.keys(raw))if (!Object.hasOwn(shape, key)) fail(p + '.' + key, 'unrecognized field');
        return Object.fromEntries(Object.entries(shape).map(([key, parse])=>[
                key,
                parse(raw[key], p + '.' + key)
            ]));
    };
}
export function checked(parse, test, message) {
    return (x, p = 'value')=>{
        const v = parse(x, p);
        if (!test(v)) fail(p, message);
        return v;
    };
}
export const date = checked(nonempty, (v)=>/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'use a valid calendar date (YYYY-MM-DD)');
