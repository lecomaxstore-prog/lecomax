const origin = 'https://lecomax.com';
async function post(path, body, cookie) {
  const response = await fetch(origin + path, {method:'POST', headers:{'Content-Type':'application/json', Origin:origin, ...(cookie ? {Cookie:cookie} : {})}, body:JSON.stringify(body)});
  const data = await response.json();
  if (!response.ok) throw new Error(path + ': HTTP ' + response.status);
  return {data, cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const question = 'My returned item was received and validated. How long does refund processing take?';
const mobile = await post('/api/assistant', {platform:'mobile_app', messages:[{role:'user',content:question}]});
console.log(JSON.stringify({channel:'expo-backend', answer:mobile.data.message}));
if (!/5.*7/.test(mobile.data.message)) throw new Error('Expo refund answer missing expected timeframe');
const start = await post('/api/chat/start', {name:'Assistant quality verification', fresh:true});
try {
  const website = await post('/api/chat/message', {session_id:start.data.id, body:question},start.cookie);
  console.log(JSON.stringify({channel:'website', result:website.data}));
} finally {
  await post('/api/chat/message', {session_id:start.data.id, body:'End this conversation'},start.cookie);
}
