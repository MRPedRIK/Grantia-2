export async function api(path,options={}) {
 const response=await fetch('/api'+path,{...options,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(sessionStorage.getItem('token')||''),...options.headers}});
 const data=await response.json().catch(()=>({error:'Servidor indisponível.'}));
 if(!response.ok){if(response.status===401){sessionStorage.removeItem('token');window.dispatchEvent(new Event('session-expired'));}throw new Error(data.error||'Não foi possível concluir.');}
 return data;
}
export const post=(path,body)=>api(path,{method:'POST',body:JSON.stringify(body)});
export const statuses={available:'Na unidade',in_transit_hq:'A caminho da sede',at_hq:'Recebido na sede',in_repair:'Em manutenção',in_transit_user:'Voltando à unidade'};
export const actions={send:'Enviar para a sede',receive:'Confirmar recebimento na sede',assign:'Atribuir técnico',return:'Enviar de volta',delivered:'Confirmar entrega na unidade'};
