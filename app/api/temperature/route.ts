import { env } from 'cloudflare:workers';

async function bridge(payload:object) {
 const config=env as unknown as Record<string,string>;
 if(!config.GAS_ENDPOINT||!config.GAS_API_KEY)return Response.json({connected:false,reason:'ยังไม่ได้เชื่อม Google Sheets'},{status:503});
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(config.GAS_ENDPOINT))return Response.json({error:'ตรวจสอบ URL ของ Apps Script'},{status:503});
 try {
  const response=await fetch(config.GAS_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,apiKey:config.GAS_API_KEY}),redirect:'follow',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('ไม่สามารถเชื่อม Google Sheets');
  const data=await response.json() as {ok?:boolean;error?:string};
  return Response.json(data,{status:data.ok?200:400,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'ติดต่อ Google Sheets ไม่สำเร็จ กรุณาลองอีกครั้ง ข้อมูลยังไม่ยืนยันการบันทึก'},{status:502});}
}
export async function GET(request:Request) {
 const day=new URL(request.url).searchParams.get('day');
 if(!day||!/^\d{4}-\d{2}-\d{2}$/.test(day))return Response.json({error:'วันที่ไม่ถูกต้อง'},{status:400});
 return bridge({action:'read',day});
}
export async function POST(request:Request) {
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'ไม่อนุญาตคำขอนี้'},{status:403});
 try{
  const text=await request.text();if(text.length>5000)return Response.json({error:'ข้อมูลยาวเกินไป'},{status:400});
  const p=JSON.parse(text);
  return bridge({action:'record',record:p});
 }catch{return Response.json({error:'ข้อมูลไม่ถูกต้อง'},{status:400});}
}
