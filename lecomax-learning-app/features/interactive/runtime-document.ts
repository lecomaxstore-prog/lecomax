export function runtimeDocument(worker: string) {
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval'; worker-src blob:; connect-src 'none';"><script>
  let worker, url, timer;
  function stop() { clearTimeout(timer); if(worker) worker.terminate(); worker=null; if(url) URL.revokeObjectURL(url); url=null; }
  addEventListener('message', e => {
    if(e.source !== parent) return;
    if(e.data?.type === 'ping') { parent.postMessage({type:'ready'},'*'); return; }
    if(e.data?.type === 'stop') { stop(); return; }
    if(e.data?.type !== 'run' || worker) return;
    url=URL.createObjectURL(new Blob([${JSON.stringify(worker).replaceAll('<', '\\u003c')}],{type:'text/javascript'}));
    worker=new Worker(url);
    const fail = message => { parent.postMessage({type:'result',result:{output:'',error:message,tables:[],tests:[]}},'*'); stop(); };
    timer=setTimeout(()=>fail('Execution exceeded 8 seconds and was terminated.'),8000);
    worker.onerror=()=>fail('Runtime failed. Retry or reduce the program.');
    worker.onmessage=({data})=>{parent.postMessage({type:'result',result:data},'*');stop();};
    worker.postMessage(e.data);
  });
  parent.postMessage({type:'ready'},'*');</script>`;
}
export function htmlDocument(code: string) {
  // HTML/CSS exercises intentionally do not execute scripts. DOM runtimes have no portable memory limit.
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none';">${code}`;
}
