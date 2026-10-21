import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {pool} from './db.js';
import {validateTransition} from './workflow.js';
const app=express();
const secret=process.env.JWT_SECRET;
if (!secret || secret.length<32 || secret.startsWith('troque-')) throw new Error('Configure JWT_SECRET aleatório (32 caracteres ou mais).');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const text=(value,label,max=500)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw fail(400,label+' inválido.');return value.trim();};
const hash=password=>{const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');};
const verify=(password,stored)=>{const [salt,key]=stored.split(':');return timingSafeEqual(Buffer.from(key,'hex'),scryptSync(password,salt,64));};
app.disable('x-powered-by');
app.use(helmet(),express.json({limit:'32kb'}));
app.get('/api/health',async(req,res)=>{await pool.query('SELECT 1');res.json({ok:true});});
app.post('/api/login',rateLimit({windowMs:15*60*1000,limit:30}),async(req,res)=>{
 const email=text(req.body.email,'E-mail',200).toLowerCase();
 const password=text(req.body.password,'Senha',200);
 const {rows:[user]}=await pool.query('SELECT * FROM users WHERE email=$1',[email]);
 if(!user||!verify(password,user.password_hash))throw fail(401,'E-mail ou senha incorretos.');
 res.json({token:jwt.sign({id:user.id},secret,{expiresIn:'8h'}),user:{id:user.id,name:user.name,role:user.role}});
});
app.use('/api',async(req,res,next)=>{
 try {
  const payload=jwt.verify((req.headers.authorization||'').replace(/^Bearer /,''),secret);
  const {rows:[user]}=await pool.query('SELECT id,name,role FROM users WHERE id=$1',[payload.id]);
  if(!user)throw Error();req.user=user;next();
 }catch{next(fail(401,'Entre novamente para continuar.'));}
});
const staff=(req,res,next)=>['admin','tech'].includes(req.user.role)?next():next(fail(403,'Acesso restrito ao suporte.'));
app.get('/api/users',async(req,res)=>res.json((await pool.query("SELECT id,name,role FROM users WHERE role IN ('admin','tech') ORDER BY name")).rows));
app.post('/api/users',async(req,res)=>{
 if(req.user.role!=='admin')throw fail(403,'Acesso restrito ao administrador.');
 const name=text(req.body.name,'Nome',100),email=text(req.body.email,'E-mail',200).toLowerCase(),password=text(req.body.password,'Senha',200),role=req.body.role;
 if(password.length<12||!['admin','tech','user'].includes(role))throw fail(400,'Use senha com pelo menos 12 caracteres e perfil válido.');
 const {rows:[user]}=await pool.query('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,role',[name,email,hash(password),role]);
 res.status(201).json(user);
});
app.post('/api/assets',staff,async(req,res)=>{
 const b=req.body; const values=[text(b.patrimony_number,'Patrimônio',100),text(b.device_type,'Tipo',100),text(b.model,'Modelo',200),text(b.current_location,'Localização',200)];
 res.status(201).json((await pool.query('INSERT INTO assets(patrimony_number,device_type,model,current_location,home_location) VALUES($1,$2,$3,$4,$4) RETURNING *',values)).rows[0]);
});
app.get('/api/assets/:patrimony',async(req,res)=>{
 const {rows:[asset]}=await pool.query('SELECT a.*,u.name AS tech_name FROM assets a LEFT JOIN users u ON u.id=a.assigned_tech_id WHERE patrimony_number=$1',[req.params.patrimony]);
 if(!asset)throw fail(404,'Patrimônio não encontrado. Peça ao suporte para cadastrá-lo.');
 const logs=await pool.query('SELECT m.*,u.name AS handler_name FROM movement_logs m JOIN users u ON u.id=m.handled_by_user WHERE asset_id=$1 ORDER BY m.id DESC',[asset.id]);
 const tickets=await pool.query('SELECT * FROM tickets WHERE asset_id=$1 ORDER BY id DESC',[asset.id]);
 res.json({...asset,logs:logs.rows,tickets:tickets.rows});
});
app.post('/api/assets/movement',async(req,res)=>{
 const b=req.body,c=await pool.connect();
 try {
  await c.query('BEGIN');
  // Lock serializes concurrent scans; version rejects stale forms.
  const {rows:[asset]}=await c.query('SELECT * FROM assets WHERE patrimony_number=$1 FOR UPDATE',[text(b.patrimony_number,'Patrimônio',100)]);
  if(!asset)throw fail(404,'Patrimônio não encontrado.');
  if(!Number.isInteger(b.version)||b.version!==asset.version)throw fail(409,'Dados atualizados por outra pessoa. Consulte o patrimônio novamente.');
  const step=validateTransition(asset,b.action,req.user);
  const notes=typeof b.notes==='string'?b.notes.trim().slice(0,2000):'';
  let tech=asset.assigned_tech_id,collector=null,deliverer=null;
  if(b.action==='send'){
   if(!notes)throw fail(400,'Descreva o defeito.');
   await c.query('INSERT INTO tickets(asset_id,description,opened_by) VALUES($1,$2,$3)',[asset.id,notes,req.user.id]);
  }
  if(b.action==='assign'){
   const {rows:[assigned]}=await c.query("SELECT id FROM users WHERE id=$1 AND role IN ('admin','tech')",[b.assigned_tech_id||null]);
   if(!assigned)throw fail(400,'Selecione um técnico válido.'); tech=assigned.id;
  }
  if(b.action==='return'){
   collector=text(b.collector,'Quem retirou',200);deliverer=text(b.deliverer,'Quem entregará',200);
   if(!notes)throw fail(400,'Descreva o reparo realizado.');
  }
  const location=b.action==='delivered'?asset.home_location:step.location;
  await c.query('INSERT INTO movement_logs(asset_id,action_type,from_location,to_location,handled_by_user,collector,deliverer,notes,assigned_tech_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[asset.id,b.action,asset.current_location,location,req.user.id,collector,deliverer,notes,tech]);
  if(b.action==='delivered'){
   await c.query("UPDATE tickets SET status='closed',closed_at=now() WHERE asset_id=$1 AND status='open'",[asset.id]);tech=null;
  }
  await c.query('UPDATE assets SET status=$1,current_location=$2,assigned_tech_id=$3,version=version+1 WHERE id=$4',[step.to,location,tech,asset.id]);
  await c.query('COMMIT');res.json({ok:true});
 }catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
});
app.use((err,req,res,next)=>{
 const status=err.status||(err.code==='23505'?409:err.code==='22P02'?400:500);
 if(status===500)console.error(err);
 res.status(status).json({error:status===500?'Erro interno. Tente novamente.':err.code==='23505'?'Registro já cadastrado.':err.code==='22P02'?'Identificador inválido.':err.message});
});
const {rows:[existing]}=await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
if(!existing){
 const password=process.env.ADMIN_PASSWORD;
 if(!password||password.length<12||password.startsWith('troque-'))throw Error('Configure ADMIN_PASSWORD (mínimo 12 caracteres).');
 await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES('Administrador','admin@local',$1,'admin') ON CONFLICT DO NOTHING",[hash(password)]);
}
const server=app.listen(3000,'0.0.0.0',()=>console.log('API na porta 3000'));
process.on('SIGTERM',()=>server.close(async()=>{await pool.end();process.exit(0);}));
