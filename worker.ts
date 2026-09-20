import handler from 'vinext/server/fetch-handler';

type Env = {WEB_USERNAME?:string;WEB_PASSWORD?:string;ASSETS:Fetcher};
async function sameSecret(a:string,b:string){
 const encoder=new TextEncoder();
 const [aHash,bHash]=await Promise.all([a,b].map(s=>crypto.subtle.digest('SHA-256',encoder.encode(s))));
 const av=new Uint8Array(aHash),bv=new Uint8Array(bHash);let difference=0;
 for(let i=0;i<av.length;i++)difference|=av[i]^bv[i];
 return difference===0;
}
export async function checkAccess(request:Request,env:Pick<Env,'WEB_USERNAME'|'WEB_PASSWORD'>){
 if(!env.WEB_USERNAME||!env.WEB_PASSWORD||env.WEB_PASSWORD.length<12){
  return new Response('ตั้งค่า WEB_USERNAME และ WEB_PASSWORD (อย่างน้อย 12 ตัวอักษร) ใน Cloudflare → Settings → Variables and Secrets แล้วกด Deploy',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 }
 const authorization=request.headers.get('Authorization')||'';let credential='';
 if(/^Basic /i.test(authorization)){
  try{credential=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(authorization.slice(6)),c=>c.charCodeAt(0)));}catch{}
 }
 if(!await sameSecret(credential,env.WEB_USERNAME+':'+env.WEB_PASSWORD)){
  return new Response('กรุณาเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านของทีม',{status:401,headers:{'Content-Type':'text/plain; charset=utf-8','WWW-Authenticate':'Basic realm="Temperature Record", charset="UTF-8"','Cache-Control':'no-store'}});
 }
 return null;
}
export default {
 async fetch(request:Request,env:Env,ctx:ExecutionContext){
  const denied=await checkAccess(request,env);if(denied)return denied;
  const response=await handler.fetch(request,env,ctx);
  const protectedResponse=new Response(response.body,response);
  protectedResponse.headers.set('Cache-Control','private, no-store');
  return protectedResponse;
 }
};
