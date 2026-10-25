/* global Buffer, __dirname */
const crypto = require('node:crypto');
const { WebSocketServer, WebSocket } = require('ws');
const fs = require('node:fs');
const path = require('node:path');
const secret = () => crypto.randomBytes(32).toString('hex');
const equal = (a,b) => typeof a === 'string' && typeof b === 'string' && /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
const send = (ws,value) => { if(ws?.readyState===WebSocket.OPEN) ws.send(JSON.stringify(value)); };
function createInternetRelay({ accessKey, now=Date.now, pairingMs=600000, sessionMs=14400000 }) {
  accessKey = accessKey.toLowerCase();
  const sessions=new Map();
  const wss=new WebSocketServer({noServer:true,maxPayload:524288,perMessageDeflate:false});
  function end(s,reason) {
    if(!sessions.delete(s.id)) return;
    for(const ws of [s.host,s.viewer]) { send(ws,{type:'ended',reason}); ws?.close(1000,'Session ended'); }
  }
  function handle(req,res) {
    const stopId = /^\/invitations\/([a-f0-9]{32})\/stop$/.exec(req.url || '')?.[1];
    if(stopId){
      const s=sessions.get(stopId);
      if(!s){res.writeHead(410);res.end('{}');return true;}
      if(req.method!=='POST'||req.headers.origin||!equal(req.headers.authorization?.replace(/^Bearer /,''),s.viewerToken)){res.writeHead(403);res.end('{}');return true;}
      end(s,'stopped');res.writeHead(200);res.end('{}');return true;
    }
    const assets={'/internet-viewer':['internet-viewer.html','text/html; charset=utf-8'],'/internet-viewer.js':['internet-viewer.js','text/javascript; charset=utf-8']};
    if(req.method==='GET' && Object.hasOwn(assets,req.url)) {
      const [file,type]=assets[req.url]; res.writeHead(200,{'Content-Type':type});res.end(fs.readFileSync(path.join(__dirname,file)));return true;
    }
    if(req.url!=='/invitations') return false;
    if(req.method!=='POST'||req.headers.origin||!equal(req.headers.authorization?.replace(/^Bearer /,''),accessKey)) {res.writeHead(403);res.end('{}');return true;}
    if(sessions.size>=16) {res.writeHead(429);res.end('{}');return true;}
    const s={id:crypto.randomBytes(16).toString('hex'),shareToken:secret(),viewerToken:secret(),host:null,viewer:null,paused:false,started:false,created:now(),expires:now()+pairingMs,lastViewer:now()};
    sessions.set(s.id,s);
    res.writeHead(201,{'Content-Type':'application/json'});
    res.end(JSON.stringify({id:s.id,shareToken:s.shareToken,viewerToken:s.viewerToken,expiresAt:s.expires}));return true;
  }
  function upgrade(req,socket,head) {
    if(req.url!=='/internet-phone') return false;
    if(wss.clients.size>=48 || (req.headers.origin && req.headers.origin !== 'https://phone.lecomax.com')) {socket.destroy();return true;}
    wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));return true;
  }
  wss.on('connection',ws=>{
    let session,role,count=0,bucket=now();ws.alive=true;
    const timeout=setTimeout(()=>ws.close(1008,'Authentication required'),10000);
    ws.on('pong',()=>{ws.alive=true;});ws.on('error',()=>{});
    ws.on('message',(data,binary)=>{
      if(now()-bucket>=1000){bucket=now();count=0;}
      if(++count>30){ws.close(1008,'Rate limit');return;}
      if(session&&now()>=session.expires){end(session,'expired');return;}
      if(binary){
        if(role!=='host'||!session?.started||data.length<4||data[0]!==255||data[1]!==216){ws.close(1008,'Not sharing');return;}
        if(!session.paused&&session.viewer?.readyState===WebSocket.OPEN&&session.viewer.bufferedAmount<524288)session.viewer.send(data,{binary:true});return;
      }
      if(data.length>2048){ws.close(1008,'Invalid message');return;}
      let m;try{m=JSON.parse(data.toString());}catch{ws.close(1008,'Invalid message');return;}
      if(!m||typeof m!=='object'){ws.close(1008,'Invalid message');return;}
      if(!role){
        const s=typeof m.id==='string'&&sessions.get(m.id);
        if(!s||now()>=s.expires){ws.close(1008,'Invitation unavailable');return;}
        if(m.type==='watch'&&equal(m.token,s.viewerToken)&&!s.viewer){role='viewer';session=s;s.viewer=ws;s.paused=false;s.lastViewer=now();send(ws,{type:s.started?'connected':'waiting',viewOnly:true});}
        else if(m.type==='publish'&&equal(m.token,s.shareToken)&&!s.started&&!s.host){
          // Only the capture service calls publish, after explicit app and Android consent.
          role='host';session=s;s.host=ws;s.started=true;s.shareToken='';s.expires=now()+sessionMs;s.lastViewer=now();
          send(ws,{type:'connected',viewOnly:true});send(s.viewer,{type:'connected',viewOnly:true});
        }else{ws.close(1008,'Invitation unavailable');return;}
        clearTimeout(timeout);return;
      }
      if(m.type==='stop'){end(session,'stopped');return;}
      if(role==='viewer'&&(m.type==='pause'||m.type==='resume')){session.paused=m.type==='pause';return;}
      // Read-only is enforced at the relay, independent of any client UI.
      if(m.type==='control'){ws.close(1008,'View only');return;}
    });
    ws.on('close',()=>{
      clearTimeout(timeout);if(!session)return;
      if(role==='host'){end(session,'capture-ended');return;}
      if(session.viewer===ws){session.viewer=null;session.lastViewer=now();}
    });
  });
  const timer=setInterval(()=>{
    for(const s of sessions.values())if(now()>=s.expires||(s.started&&!s.viewer&&now()-s.lastViewer>60000))end(s,'expired');
    for(const ws of wss.clients){if(!ws.alive)ws.terminate();else{ws.alive=false;ws.ping();}}
  },15000);timer.unref();
  return {handle,upgrade,close:async()=>{clearInterval(timer);for(const ws of wss.clients)ws.terminate();await new Promise(resolve=>wss.close(resolve));}};
}
module.exports={createInternetRelay};
