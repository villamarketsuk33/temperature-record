import { readFileSync, writeFileSync } from 'node:fs';
const policies=JSON.parse(readFileSync(new URL('../lib/temperature-policy.json',import.meta.url),'utf8'));
const path=new URL('../public/Code.gs',import.meta.url);
const source=readFileSync(path,'utf8');
const updated=source.replace(/\/\/ BEGIN GENERATED POLICY[\s\S]*?\/\/ END GENERATED POLICY/,`// BEGIN GENERATED POLICY\nconst TEMP_POLICIES = ${JSON.stringify(policies)};\n// END GENERATED POLICY`);
if(updated===source&&!source.includes(`const TEMP_POLICIES = ${JSON.stringify(policies)};`))throw new Error('Policy markers not found');
writeFileSync(path,updated);
