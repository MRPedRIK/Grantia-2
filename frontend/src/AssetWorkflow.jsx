import {useEffect,useState} from 'react';
import {api,post,statuses,actions} from './api';
export default function AssetWorkflow({asset,user,onRefresh}){
 const [techs,setTechs]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{api('/users').then(setTechs).catch(e=>setError(e.message));},[]);
 const action={available:'send',in_transit_hq:'receive',at_hq:'assign',in_repair:'return',in_transit_user:'delivered'}[asset.status];
 const permitted=['send','delivered'].includes(action)||user.role==='admin'||(user.role==='tech'&&(action!=='return'||String(asset.assigned_tech_id)===String(user.id)));
 async function submit(e){e.preventDefault();const form=e.currentTarget;setBusy(true);setError('');
 try{await post('/assets/movement',{...Object.fromEntries(new FormData(form)),patrimony_number:asset.patrimony_number,version:asset.version,action});await onRefresh(asset.patrimony_number);form.reset();}
 catch(e){setError(e.message);}finally{setBusy(false);}}
 return <div className="space-y-4">
 <section className="card space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-teal-700">Patrimônio</p><h2 className="text-3xl">{asset.patrimony_number}</h2></div><span className="rounded-full bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">{statuses[asset.status]}</span></div>
 <dl className="grid grid-cols-2 gap-4 text-sm">{[['Equipamento',asset.device_type],['Modelo',asset.model],['Localização',asset.current_location],['Técnico',asset.tech_name||'Não atribuído']].map(([k,v])=><div key={k}><dt className="text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
 <button className="bg-slate-700" onClick={()=>onRefresh(asset.patrimony_number).catch(e=>setError(e.message))}>Atualizar dados</button></section>
 <section className="card"><h2 className="mb-4">Próxima movimentação</h2>{permitted?<form key={asset.version} onSubmit={submit} className="space-y-4">
 {action==='assign'&&<label>Técnico responsável<select name="assigned_tech_id" required defaultValue=""><option value="" disabled>Selecione</option>{techs.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
 {action==='return'&&<><label>Quem retirou o equipamento<input name="collector" required maxLength={200}/></label><label>Quem fará a entrega<input name="deliverer" required maxLength={200}/></label></>}
 <label>{action==='send'?'Descrição do defeito':action==='return'?'Reparo realizado':'Observações'}<textarea name="notes" rows={3} maxLength={2000} required={['send','return'].includes(action)}/></label>
 <button disabled={busy} className="w-full">{busy?'Registrando…':actions[action]}</button></form>:<p>Esta etapa deve ser concluída pelo suporte responsável.</p>}
 {error&&<p role="alert" className="mt-3 text-red-700">{error}</p>}</section>
 <section className="card"><h2 className="mb-4">Chamados</h2>{asset.tickets.length?asset.tickets.map(t=><article key={t.id} className="border-b border-slate-100 py-3"><p className="font-semibold">#{t.id} • {t.status==='open'?'Aberto':'Encerrado'}</p><p className="whitespace-pre-wrap">{t.description}</p><small>{new Date(t.created_at).toLocaleString('pt-BR')}</small></article>):<p className="text-slate-500">Nenhum chamado registrado.</p>}</section>
 <section className="card"><h2 className="mb-4">Histórico de custódia</h2>{asset.logs.length?<ol className="space-y-4">{asset.logs.map(log=><li key={log.id} className="border-l-2 border-teal-600 pl-4"><p className="font-semibold">{actions[log.action_type]}</p><p className="text-sm">{log.from_location} → {log.to_location}</p><p className="text-sm text-slate-500">{log.handler_name} • {new Date(log.timestamp).toLocaleString('pt-BR')}</p>{log.collector&&<p className="text-sm">Retirou: {log.collector} • Entregará: {log.deliverer}</p>}{log.notes&&<p className="mt-1 whitespace-pre-wrap text-sm">{log.notes}</p>}</li>)}</ol>:<p className="text-slate-500">Nenhuma movimentação registrada.</p>}</section>
 </div>;
}
