const {Pool} = require('pg');
const accounts=require('../lib/accounts');
const catalog=require('../lib/catalog');
const orders=require('../lib/orders');
const {tokenHash}=require('../lib/security');
const {fail,integer}=require('../lib/validate');
let pool;

async function action(db, data, actor, cookie) {
  switch(data.action) {
    case 'me': return {user:actor};
    case 'register':
    case 'login': return accounts.signIn(db,data,cookie);
    case 'logout':
      if (cookie.previous) await db.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(cookie.previous)]);
      cookie.token='';
      return {ok:true};
    case 'profile': return accounts.profile(db,actor,data);
    case 'users':
    case 'user': return accounts.manage(db,actor,data);
    case 'catalog':
    case 'inventory': return catalog.read(db,actor,data.action==='inventory');
    case 'category':
    case 'product': return catalog.save(db,actor,data);
    case 'dashboard': return catalog.dashboard(db,actor);
    case 'checkout': return orders.checkout(db,actor,data);
    case 'order': return orders.one(db,actor,integer(data.id,'pedido',1));
    case 'orders': return orders.list(db,actor,null,data.status);
    case 'pay':
    case 'advance':
    case 'cancel': return orders.change(db,actor,data);
    default: fail('Operación desconocida.',404);
  }
}
async function readBody(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')) fail('Se requiere JSON.',415);
  let value=req.body;
  if (value===undefined) {
    let length=0;
    const chunks=[];
    for await (const chunk of req) {
      const buffer=Buffer.from(chunk);
      length+=buffer.length;
      if (length>32768) fail('Solicitud demasiado grande.',413);
      chunks.push(buffer);
    }
    value=Buffer.concat(chunks);
  }
  if (typeof value==='string' || Buffer.isBuffer(value)) {
    if (Buffer.byteLength(value)>32768) fail('Solicitud demasiado grande.',413);
    try { value=JSON.parse(value.toString()); } catch { fail('JSON inválido.'); }
  }
  if (!value || typeof value!=='object' || typeof value.action!=='string') fail('Indicá una operación.');
  return value;
}
function reply(res,status,body) {
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  let db;
  try {
    const url=new URL(req.url,'http://localhost');
    const screen=req.method==='GET' && (req.query?.screen==='admin' || url.searchParams.get('screen')==='admin' || url.pathname==='/admin');
    if (!screen && req.method!=='POST') fail('Método no permitido.',405);
    if (req.headers['sec-fetch-site']==='cross-site' && req.method==='POST') fail('Origen no permitido.',403);
    const data=screen?null:await readBody(req);
    const previous=(req.headers.cookie||'').match(/(?:^|;\s*)food_session=([0-9a-f]{64})(?:;|$)/)?.[1];
    const cookie={previous};
    if (!process.env.DATABASE_URL) fail('Falta configurar la conexión a PostgreSQL.',503);
    pool ||= new Pool({connectionString:process.env.DATABASE_URL,max:4,connectionTimeoutMillis:8000,idleTimeoutMillis:10000,allowExitOnIdle:true});
    db=await pool.connect();
    await db.query('BEGIN');
    const actor=await accounts.current(db,previous);
    if (screen) {
      if (actor?.role!=='Superadmin') fail('Acceso reservado al Superadmin.',403);
      await db.query('COMMIT');
      res.writeHead(302,{Location:'/#admin'});
      res.end();
      return;
    }
    const body=await action(db,data,actor,cookie);
    await db.query('COMMIT');
    if (cookie.token!==undefined) {
      const secure=process.env.VERCEL || req.socket?.encrypted || req.headers['x-forwarded-proto']==='https';
      res.setHeader('Set-Cookie','food_session='+cookie.token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+(cookie.token?604800:0)+(secure?'; Secure':''));
    }
    reply(res,200,body);
  } catch (error) {
    if (db) await db.query('ROLLBACK').catch(()=>{});
    if (error.status) reply(res,error.status,{error:error.message});
    else if (error.code==='23505') reply(res,409,{error:'El correo o nombre ya está en uso.'});
    else if (error.code==='23503') reply(res,400,{error:'La categoría o el registro indicado no existe.'});
    else if (['40001','40P01'].includes(error.code)) reply(res,409,{error:'Otro cambio coincidió con esta operación. Volvé a intentarlo.'});
    else {
      console.error('Error interno de Food Store',error.code || error.name);
      reply(res,500,{error:'No se pudo completar la operación. Revisá la conexión y la inicialización de la base.'});
    }
  } finally { db?.release(); }
}
module.exports=handler;
