import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTransition} from './workflow.js';
test('ciclo completo mantém a sequência',()=>{
 let asset={status:'available',assigned_tech_id:2};const actor={id:2,role:'tech'};
 for(const action of ['send','receive','assign','return','delivered'])asset.status=validateTransition(asset,action,actor).to;
 assert.equal(asset.status,'available');
});
test('usuário não recebe equipamento na sede',()=>assert.throws(()=>validateTransition({status:'in_transit_hq'},'receive',{role:'user'}),{status:403}));
test('rejeita etapas fora de ordem',()=>assert.throws(()=>validateTransition({status:'available'},'return',{role:'admin'}),{status:409}));
test('outro técnico não pode devolver',()=>assert.throws(()=>validateTransition({status:'in_repair',assigned_tech_id:2},'return',{id:3,role:'tech'}),{status:403}));
