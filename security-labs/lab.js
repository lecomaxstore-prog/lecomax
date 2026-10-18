let csrf='';
const el=id=>document.getElementById(id);
async function request(path,body){
 const options=body?{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(body)}:{};
 try{const response=await fetch(path,options);const data=await response.json();el('result').textContent=JSON.stringify({status:response.status,data},null,2);return {response,data};}
 catch(error){el('result').textContent='Local request failed: '+error.message;return null;}
}
el('session').onclick=async()=>{const result=await request('/api/session',{actor:el('actor').value});if(result?.response.ok){csrf=result.data.csrf;el('identity').textContent='Synthetic actor: '+result.data.actor;}};
for(const mode of ['unsafe','fixed']){
 el('order-'+mode).onclick=()=>request('/api/order?mode='+mode+'&id='+encodeURIComponent(el('order').value));
 el('search-'+mode).onclick=()=>request('/api/search?mode='+mode+'&name='+encodeURIComponent(el('name').value));
 el('checkout-'+mode).onclick=()=>request('/api/checkout?mode='+mode,{productId:'bag',quantity:Number(el('quantity').value),priceCents:Number(el('price').value),coupon:el('coupon').value});
 el('xss-'+mode).onclick=()=>window.open('/xss?mode='+mode+'&name='+encodeURIComponent(el('markup').value),'_blank','noopener,noreferrer');
}
el('state').onclick=()=>request('/api/state');