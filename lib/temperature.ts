import policyData from './temperature-policy.json';
export type TemperaturePolicy = { id:string; label:string; max:number; warningMax:number|null; criticalMin:number|null; criticalInclusive:boolean };
export const POLICIES:TemperaturePolicy[]=policyData;
export type Unit = { id: string; type: 'Frozen' | 'Chill'; zone: string; min: number | null; max: number | null; category:string|null; policy:TemperaturePolicy|null };
export type Reading = { id: string; businessDate: string; slot: string; scheduledAt: string; recordedAt: string; unit: string; type: string; temperature: number; recorder: string; note: string; min: number|null; max: number|null; category?:string|null; policy?:TemperaturePolicy|null; status?:string };
export const TIMES = Array.from({length:12},(_,i)=>String((7+i*2)%24).padStart(2,'0')+':00');
export const UNITS: Unit[] = Array.from({length:37},(_,i)=>({id:`${i<24?'FZ':'CH'}-${String(i<24?i+1:i-23).padStart(2,'0')}`,type:i<24?'Frozen':'Chill',zone:'',min:null,max:i<24?-20:null,category:i<24?'Frozen':null,policy:i<24?POLICIES[0]:null}));
export function businessDate(time: Date = new Date()) { return new Date(time.getTime()).toISOString().slice(0,10); }
// 07:00 Bangkok is 00:00 UTC, so the UTC calendar date is exactly this business date.
export function slots(day:string) { const start = new Date(day+'T07:00:00+07:00').getTime(); return TIMES.map((time,i)=>({time,at:new Date(start+i*7200000).toISOString(),nextDay:i>=9})); }
export function currentSlot(date=new Date()) { const day=businessDate(date); return {day,slot:slots(day)[Math.floor(date.getUTCHours()/2)]}; }
export function evaluateTemperature(policy:TemperaturePolicy|null, value:number) {
 if(!Number.isFinite(value))return 'ข้อมูลไม่ถูกต้อง';
 if(!policy)return 'รอกำหนดประเภทสินค้า';
 if(policy.criticalMin!==null&&(policy.criticalInclusive?value>=policy.criticalMin:value>policy.criticalMin))return 'วิกฤต';
 if(value<=policy.max)return 'ปกติ';
 if(policy.warningMax!==null&&value<=policy.warningMax)return 'เฝ้าระวัง';
 return 'ผิดปกติ';
}
// Prefer the snapshot saved with the measurement. Registry changes never relabel history.
export function temperatureStatus(unit:Pick<Unit,'min'|'max'> & {policy?:TemperaturePolicy|null}, reading?:{temperature:number}&Partial<Reading>) {
 if(!reading)return 'ไม่มีข้อมูล';
 if(reading.status)return reading.status;
 if('policy' in reading)return evaluateTemperature(reading.policy??null,reading.temperature);
 if('businessDate' in reading){
  const min=reading.min??null,max=reading.max??null;
  if(min===null&&max===null)return 'ยังไม่กำหนดเกณฑ์';
  return (min!==null&&reading.temperature<min)||(max!==null&&reading.temperature>max)?'ผิดเกณฑ์':'ปกติ';
 }
 return evaluateTemperature(unit.policy??null,reading.temperature);
}
export function policyText(policy:TemperaturePolicy|null|undefined) {
 if(!policy)return 'รอกำหนดประเภทสินค้า';
 const parts=[`ปกติ ≤ ${policy.max}°C`];
 if(policy.warningMax!==null)parts.push(`เฝ้าระวัง > ${policy.max} ถึง ${policy.warningMax}°C`);
 parts.push(`ผิดปกติ > ${policy.warningMax??policy.max}${policy.criticalMin!==null?` ถึง ${policy.criticalInclusive?'<':'≤'} ${policy.criticalMin}`:''}°C`);
 if(policy.criticalMin!==null)parts.push(`วิกฤต ${policy.criticalInclusive?'≥':'>'} ${policy.criticalMin}°C`);
 else parts.push('ยังไม่กำหนดเกณฑ์วิกฤต');
 return parts.join(' · ');
}
export function readingSnapshot(unit:Unit, temperature:number){return {min:unit.min,max:unit.max,category:unit.category,policy:unit.policy,status:evaluateTemperature(unit.policy,temperature)};}
export const STATUS_COLORS:Record<string,string>={'ปกติ':'#178259','เฝ้าระวัง':'#d89b10','ผิดปกติ':'#e06a24','ผิดเกณฑ์':'#e06a24','วิกฤต':'#c62348'};
// Keep the entered precision visible at threshold boundaries.
export const temperatureText=(value:number)=>Number.isInteger(value)?value.toFixed(1):String(value);
export const timeText=(iso:string)=>new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
export const dateText=(day:string)=>new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'long',year:'numeric'}).format(new Date(day+'T07:00:00+07:00'));
export function roundStatus(day:string,slot:string,unit:string,records:Reading[],now:Date) {
 const at=slots(day).find(s=>s.time===slot)!.at;
 const found=records.filter(r=>r.businessDate===day&&r.slot===slot&&r.unit===unit).sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
 if(found.length)return {label:'บันทึกแล้ว',reading:found[found.length-1],count:found.length};
 if(now.getTime()<Date.parse(at))return {label:'ยังไม่ถึงรอบ',count:0};
 if(now.getTime()<Date.parse(at)+7200000)return {label:'รอบปัจจุบัน',count:0};
 return {label:'ขาดบันทึก',count:0};
}
