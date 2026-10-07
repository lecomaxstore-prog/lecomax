import 'server-only';
import {NextRequest,NextResponse} from 'next/server';
export const mobileJson=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function mobileOwner(req:NextRequest){
 const bearer=req.headers.get('authorization');
 if(!bearer?.startsWith('Bearer ')||bearer.length>12000)return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;const owner=process.env.ADMIN_EMAIL?.trim().toLowerCase();
 if(!url||!key||!owner)return null;
 const response=await fetch(`${url}/auth/v1/user`,{headers:{Authorization:bearer,apikey:key},cache:'no-store',signal:AbortSignal.timeout(8000)}).catch(()=>null);
 if(!response?.ok)return null;
 const user=await response.json().catch(()=>null);
 return user?.email_confirmed_at&&typeof user.email==='string'&&user.email.toLowerCase()===owner?user.email as string:null;
}
