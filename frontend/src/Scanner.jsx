import {useEffect,useRef,useState} from 'react';
import {Html5Qrcode} from 'html5-qrcode';
export default function Scanner({onScan}) {
 const scanner=useRef(null),mounted=useRef(true),starting=useRef(false);
 const [active,setActive]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;const s=scanner.current;if(s?.isScanning)s.stop().catch(()=>{});};},[]);
 async function stop(){const s=scanner.current;if(s?.isScanning)await s.stop();if(mounted.current)setActive(false);}
 async function start(){
  if(starting.current)return;starting.current=true;setBusy(true);setError('');
  try{
   if(!window.isSecureContext)throw Error('A câmera precisa de HTTPS. Você também pode digitar o patrimônio abaixo.');
   const s=scanner.current||new Html5Qrcode('camera-reader');scanner.current=s;
   let accepted=false;
   await s.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:150}},value=>{
    if(accepted)return;accepted=true;
    void stop().then(()=>{if(mounted.current)onScan(value.trim());}).catch(()=>{if(mounted.current)onScan(value.trim());});
   },()=>{});
   if(!mounted.current){if(s.isScanning)await s.stop();return;}setActive(s.isScanning);
  }catch(e){if(mounted.current)setError(e.message||'Não foi possível abrir a câmera. Verifique a permissão.');}
  finally{starting.current=false;if(mounted.current)setBusy(false);}
 }
 return <div className="space-y-3"><div id="camera-reader" className="overflow-hidden rounded-xl"/>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button type="button" className="w-full" disabled={busy} onClick={()=>{if(active)void stop().catch(()=>setError('Não foi possível parar a câmera.'));else void start();}}>{busy?'Abrindo câmera…':active?'Fechar câmera':'Abrir câmera • QR / código de barras'}</button></div>;
}
