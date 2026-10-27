const SANDBOX = 'https://cybqa.pesapal.com/pesapalv3/api';
const LIVE = 'https://pay.pesapal.com/v3/api';
const cors = {'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:cors});
const enc=new TextEncoder();
async function sha(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function token(env){
 if(!env.PESAPAL_CONSUMER_KEY||!env.PESAPAL_CONSUMER_SECRET)throw Error('Pesapal credentials are not configured');
 const res=await fetch(base(env)+'/Auth/RequestToken',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({consumer_key:env.PESAPAL_CONSUMER_KEY,consumer_secret:env.PESAPAL_CONSUMER_SECRET})});
 const body=await res.json();if(!res.ok||!body.token)throw Error('Pesapal authentication failed');return body.token;
}
function base(env){return env.PESAPAL_ENV==='LIVE'?LIVE:SANDBOX}
async function requestBody(req){if(Number(req.headers.get('content-length')||0)>10000)throw Error('Request too large');return req.json()}
async function statusFromPesapal(env,trackingId){
 const t=await token(env);
 const response=await fetch(base(env)+'/Transactions/GetTransactionStatus?orderTrackingId='+encodeURIComponent(trackingId),{headers:{'Accept':'application/json','Content-Type':'application/json','Authorization':'Bearer '+t}});
 const data=await response.json();if(!response.ok||data.error?.message)throw Error('Unable to verify Pesapal payment');return data;
}
function confirmed(data,order){return data.payment_status_description==='COMPLETED' && Number(data.status_code)===1 && Number(data.amount)===order.amount && data.currency===order.currency && data.merchant_reference===order.id}
export default {async fetch(req,env){
 const url=new URL(req.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(req);
 try{
 if(!env.DB)return json({error:'Database binding is not configured'},503);
 if(url.pathname==='/api/health'&&req.method==='GET')return json({ok:true,host:'cloudflare'});
 if(url.pathname==='/api/checkout'&&req.method==='POST'){
  if(!env.PESAPAL_IPN_ID)return json({error:'Pesapal IPN ID not configured'},503);
  const b=await requestBody(req);const email=String(b.email||'').trim().slice(0,160);const name=String(b.name||'').trim().slice(0,160);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<2)return json({error:'Valid name and email are required'},400);
  const price=Number(env.CV_PRICE_UGX||3000);if(!Number.isSafeInteger(price)||price<1000)return json({error:'Price configuration error'},503);
  const id='CCV-'+crypto.randomUUID();const checkoutKey=crypto.randomUUID()+'-'+crypto.randomUUID();
  await env.DB.prepare('INSERT INTO orders(id,checkout_hash,amount,currency) VALUES(?,?,?,?)').bind(id,await sha(checkoutKey),price,'UGX').run();
  const bearer=await token(env);const [firstName,...rest]=name.split(/\s+/);
  const payload={id,currency:'UGX',amount:price,description:'Campus CV Builder A4 PDF',callback_url:new URL('/payment-success.html',url.origin).href,notification_id:env.PESAPAL_IPN_ID,billing_address:{email_address:email,first_name:firstName,last_name:rest.join(' ')||'Student',country_code:'UG'}};
  const res=await fetch(base(env)+'/Transactions/SubmitOrderRequest',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':'Bearer '+bearer},body:JSON.stringify(payload)});
  const data=await res.json();
  if(!res.ok||!data.redirect_url||!data.order_tracking_id){return json({error:'Payment checkout could not be started'},502)}
  await env.DB.prepare('UPDATE orders SET tracking_id=? WHERE id=?').bind(data.order_tracking_id,id).run();
  return json({ok:true,redirect_url:data.redirect_url,order_id:id,checkout_key:checkoutKey});
 }
 if(url.pathname==='/api/payment-status'&&req.method==='POST'){
  const b=await requestBody(req);if(!b?.orderId||!b?.checkoutKey)return json({error:'Checkout details are required'},400);
  const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(String(b.orderId).slice(0,80)).first();
  if(!order||await sha(String(b.checkoutKey))!==order.checkout_hash)return json({error:'Checkout details not recognised'},403);
  if(!order.tracking_id)return json({paid:false,status:'PENDING'});
  const data=await statusFromPesapal(env,order.tracking_id);const paid=confirmed(data,order);
  const state=paid?'COMPLETED':String(data.payment_status_description||'PENDING');
  await env.DB.prepare('UPDATE orders SET status=? WHERE id=?').bind(state,order.id).run();
  return json({paid,status:state});
 }
 // Pesapal IPN is an indication of an update, not proof of payment. Always verify server-side.
 if(url.pathname==='/api/pesapal-ipn'&&['POST','GET'].includes(req.method)){
  const params=req.method==='GET'?Object.fromEntries(url.searchParams):await req.json();
  const tracking=params.OrderTrackingId;
  if(!tracking)return json({error:'Missing tracking ID'},400);
  const order=await env.DB.prepare('SELECT * FROM orders WHERE tracking_id=?').bind(String(tracking)).first();
  if(!order)return json({error:'Unknown order'},404);
  const data=await statusFromPesapal(env,order.tracking_id);
  await env.DB.prepare('UPDATE orders SET status=? WHERE id=?').bind(confirmed(data,order)?'COMPLETED':String(data.payment_status_description||'PENDING'),order.id).run();
  return json({orderNotificationType:'IPNCHANGE',orderTrackingId:tracking,orderMerchantReference:order.id,status:200});
 }
 if(url.pathname==='/api/generate-experience'&&req.method==='POST')return json({success:false,message:'Gemini AI endpoint is not yet configured. Your manual CV builder remains available.'},503);
 return json({error:'Not found'},404);
 }catch(error){console.error('Request failed',error);return json({error:'Service could not complete the request. Please try again.'},500)}
}};
