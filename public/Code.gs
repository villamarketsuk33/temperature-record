// TemperatureRecord: server connector for the Villa Cold Chain web app.
// Deployment guide: https://developers.google.com/apps-script/guides/web
// Set TEMPERATURE_API_KEY in Script Properties. Never place it in client code.
const TEMPERATURE_SHEET_ID = '1pv8M0JS6VMIX__p7I5vv7x4-8OYX6mhBE7XUFx_1TQQ';
const TEMP_TIMES = Array.from({length:12}, (_,i)=>String((7+i*2)%24).padStart(2,'0')+':00');
// Run this once from the Apps Script editor to authorize access and create the key.
function prepareConnection(){
 const book=tempBook_();
 ['ทะเบียนตู้','บันทึกอุณหภูมิ','รอบตรวจ'].forEach(name=>{if(!book.getSheetByName(name))throw new Error('ไม่พบชีท '+name);});
 const properties=PropertiesService.getScriptProperties();
 if(!properties.getProperty('TEMPERATURE_API_KEY'))properties.setProperty('TEMPERATURE_API_KEY',(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,''));
 console.log('พร้อมแล้ว เปิด Project Settings → Script Properties แล้วคัดลอกค่า TEMPERATURE_API_KEY ไปตั้งเป็น GAS_API_KEY ใน Cloudflare');
}
// BEGIN GENERATED POLICY
const TEMP_POLICIES = [{"id":"frozen-v1","label":"Frozen","max":-20,"warningMax":-15,"criticalMin":-10,"criticalInclusive":true},{"id":"deli-v1","label":"เดลิกา / เนื้อสัตว์","max":2,"warningMax":null,"criticalMin":10,"criticalInclusive":false},{"id":"dairy-v1","label":"นม / ชีส","max":4,"warningMax":null,"criticalMin":null,"criticalInclusive":false},{"id":"produce-v1","label":"ผัก / ผลไม้","max":8,"warningMax":null,"criticalMin":null,"criticalInclusive":false}];
// END GENERATED POLICY
function tempStatus_(policy,value){
 if(!policy)return 'รอกำหนดประเภทสินค้า';
 if(policy.criticalMin!==null&&(policy.criticalInclusive?value>=policy.criticalMin:value>policy.criticalMin))return 'วิกฤต';
 if(value<=policy.max)return 'ปกติ';
 if(policy.warningMax!==null&&value<=policy.warningMax)return 'เฝ้าระวัง';
 return 'ผิดปกติ';
}
function doPost(e) {
 try {
  const p=JSON.parse(e.postData.contents);
  const key=PropertiesService.getScriptProperties().getProperty('TEMPERATURE_API_KEY');
  if(!key||p.apiKey!==key)throw new Error('ไม่อนุญาตให้เข้าถึง');
  if(p.action==='read')return tempJson_({ok:true,...tempRead_(p.day)});
  if(p.action==='record')return tempJson_({ok:true,reading:tempRecord_(p.record)});
  throw new Error('ไม่พบคำสั่ง');
 }catch(err){return tempJson_({ok:false,error:err.message});}
}
function tempJson_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function tempBook_(){return SpreadsheetApp.openById(TEMPERATURE_SHEET_ID);}
function tempUnits_(book){
 const s=book.getSheetByName('ทะเบียนตู้');
 if(!s)throw new Error('ไม่พบชีททะเบียนตู้');
 return s.getDataRange().getValues().slice(1).filter(r=>r[0]).map(r=>{
  const type=String(r[1]),category=type==='Frozen'?'Frozen':String(r[5]||'').trim();
  if(type!=='Frozen'&&type!=='Chill')throw new Error('ประเภทตู้ไม่ถูกต้อง: '+r[0]);
  const policy=TEMP_POLICIES.find(p=>p.label===category)||null;
  if(category&&(!policy||(type==='Chill'&&policy.id==='frozen-v1')))throw new Error('ประเภทสินค้าไม่ถูกต้อง: '+r[0]);
  return {id:String(r[0]),type,zone:String(r[2]||''),min:null,max:policy?policy.max:null,category:category||null,policy};
 });
}
function tempRecords_(book){
 const s=book.getSheetByName('บันทึกอุณหภูมิ');
 if(!s)throw new Error('ไม่พบชีทบันทึกอุณหภูมิ');
 if(s.getLastRow()<2)return [];
 return s.getRange(2,1,s.getLastRow()-1,15).getValues().filter(r=>r[0]).map(r=>({
  id:String(r[0]),businessDate:r[1] instanceof Date?Utilities.formatDate(r[1],'Asia/Bangkok','yyyy-MM-dd'):String(r[1]),
  slot:r[2] instanceof Date?Utilities.formatDate(r[2],'Asia/Bangkok','HH:mm'):String(r[2]),
  scheduledAt:new Date(r[3]).toISOString(),recordedAt:new Date(r[4]).toISOString(),unit:String(r[5]),type:String(r[6]),temperature:Number(r[7]),recorder:String(r[8]),note:String(r[9]),min:r[10]===''?null:Number(r[10]),max:r[11]===''?null:Number(r[11]),status:String(r[12]||''),category:r[13]?String(r[13]):null,...(r[14]?{policy:JSON.parse(r[14])}:{})
 }));
}
function tempRead_(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('วันที่ไม่ถูกต้อง');
 const book=tempBook_();return {units:tempUnits_(book),readings:tempRecords_(book).filter(r=>r.businessDate===day),serverNow:new Date().toISOString()};
}
function tempRecord_(p){
 if(!p||typeof p.id!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(p.id)||typeof p.temperature!=='number'||!isFinite(p.temperature)||p.temperature < -80||p.temperature>80)throw new Error('ตรวจสอบอุณหภูมิและรหัสรายการ');
 if(typeof p.recorder!=='string'||!p.recorder.trim()||p.recorder.length>100||typeof p.note!=='string'||p.note.length>500)throw new Error('ตรวจสอบชื่อผู้บันทึกและหมายเหตุ');
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try {
  const book=tempBook_(),unit=tempUnits_(book).find(u=>u.id===p.unit);if(!unit)throw new Error('ไม่พบรหัสตู้');
  const records=tempRecords_(book), prior=records.find(r=>r.id===p.id);
  if(prior){if(prior.unit!==p.unit||prior.temperature!==p.temperature||prior.recorder!==p.recorder.trim()||prior.note!==p.note.trim()||prior.businessDate!==p.businessDate||prior.slot!==p.slot)throw new Error('รหัสรายการซ้ำกับข้อมูลอื่น กรุณาส่งรายการใหม่');return prior;}
  const now=new Date(), day=now.toISOString().slice(0,10), index=Math.floor(now.getUTCHours()/2), slot=TEMP_TIMES[index];
  if(p.businessDate!==day||p.slot!==slot)throw new Error('เปลี่ยนรอบตรวจแล้ว กรุณาโหลดหน้าใหม่และยืนยันรอบปัจจุบัน');
  const at=new Date(day+'T07:00:00+07:00');at.setTime(at.getTime()+index*7200000);
  const record={id:p.id,businessDate:day,slot,scheduledAt:at.toISOString(),recordedAt:now.toISOString(),unit:unit.id,type:unit.type,temperature:p.temperature,recorder:p.recorder.trim(),note:p.note.trim(),min:unit.min,max:unit.max,category:unit.category,policy:unit.policy,status:tempStatus_(unit.policy,p.temperature)};
  const row=[record.id,record.businessDate,record.slot,new Date(record.scheduledAt),now,unit.id,unit.type,p.temperature,tempLiteral_(record.recorder),tempLiteral_(record.note),unit.min===null?'':unit.min,unit.max===null?'':unit.max,record.status,unit.category||'',JSON.stringify(unit.policy)];
  const sh=book.getSheetByName('บันทึกอุณหภูมิ'),n=sh.getLastRow()+1;
  sh.getRange(n,1,1,3).setNumberFormat('@');
  sh.getRange(n,1,1,15).setValues([row]);sh.getRange(n,4,1,2).setNumberFormat('dd/MM/yyyy HH:mm:ss');sh.getRange(n,8).setNumberFormat('0.0#########');
  SpreadsheetApp.flush();return record;
 }finally{lock.releaseLock();}
}
function tempLiteral_(s){return /^[=+\-@]/.test(s)?"'"+s:s;}
