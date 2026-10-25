'use strict';
(() => {
  let socket, config, frame, ended=false, retry;
  const status=document.getElementById('status');
  const screen=document.getElementById('screen');
  const post=type=>window.ReactNativeWebView?.postMessage(JSON.stringify({type}));
  function clear(){screen.removeAttribute('src');if(frame)URL.revokeObjectURL(frame);frame=undefined;}
  function stop(){ended=true;clearTimeout(retry);if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'stop'}));socket?.close();clear();post('ended');}
  function connect(){
    if(ended||!config)return;
    const ws=socket=new WebSocket(`wss://${location.host}/internet-phone`);ws.binaryType='blob';
    ws.onopen=()=>{ws.send(JSON.stringify({type:'watch',id:config.id,token:config.token}));if(document.hidden)ws.send(JSON.stringify({type:'pause'}));};
    ws.onmessage=event=>{
      if(socket!==ws||ended)return;
      if(typeof event.data!=='string'){
        if(document.hidden)return;
        const old=frame;frame=URL.createObjectURL(event.data);screen.src=frame;if(old)URL.revokeObjectURL(old);return;
      }
      let m;try{m=JSON.parse(event.data);}catch{stop();return;}
      if(m.type==='waiting'){status.textContent=config.waiting;post('waiting');}
      if(m.type==='connected'){status.textContent=config.connected;post('connected');}
      if(m.type==='ended'){ended=true;clear();status.textContent=config.ended;post('ended');ws.close();}
    };
    ws.onclose=e=>{if(ended||socket!==ws)return;clear();if(e.code===1008){ended=true;status.textContent=config.ended;post('ended');return;}status.textContent=config.reconnecting;retry=setTimeout(connect,2000);};
    ws.onerror=()=>ws.close();
  }
  window.lecomaxInternetStart=value=>{
    if(config||!value||!/^[a-f0-9]{32}$/.test(value.id)||!/^[a-f0-9]{64}$/.test(value.token))return;
    config=value;document.getElementById('stop').textContent=value.stop;connect();
  };
  window.lecomaxInternetStop=stop;
  document.getElementById('stop').onclick=stop;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:document.hidden?'pause':'resume'}));});
  post('ready');
})();
