export const transitions = {
 send: {from:'available',to:'in_transit_hq',roles:['admin','tech','user'],location:'Em trânsito para a sede'},
 receive: {from:'in_transit_hq',to:'at_hq',roles:['admin','tech'],location:'Suporte da sede'},
 assign: {from:'at_hq',to:'in_repair',roles:['admin','tech'],location:'Bancada técnica'},
 return: {from:'in_repair',to:'in_transit_user',roles:['admin','tech'],location:'Em trânsito para a unidade'},
 delivered: {from:'in_transit_user',to:'available',roles:['admin','tech','user']}
};
export function validateTransition(asset, action, actor) {
 const step = transitions[action];
 if (!step || step.from !== asset.status) throw Object.assign(new Error('Movimentação incompatível com o estado atual.'),{status:409});
 if (!step.roles.includes(actor.role)) throw Object.assign(new Error('Seu perfil não pode executar esta ação.'),{status:403});
 if (action === 'return' && actor.role === 'tech' && String(asset.assigned_tech_id) !== String(actor.id))
  throw Object.assign(new Error('Somente o técnico responsável ou administrador pode devolver.'),{status:403});
 return step;
}
