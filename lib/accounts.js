const { randomBytes } = require('node:crypto');
const { hashPassword, matches, tokenHash } = require('./security');
const { fail,string,integer,bool,email,password,requireRole } = require('./validate');
const fields = 'id,name,email,phone,address,role,active';

async function current(db, token) {
  if (!token) return null;
  const {rows} = await db.query(`SELECT a.id,a.name,a.email,a.phone,a.address,a.role,a.active
    FROM sessions s JOIN accounts a ON a.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND a.active`,[tokenHash(token)]);
  return rows[0] || null;
}
async function signIn(db, data, response) {
  const mail=email(data.email);
  let id;
  if (data.action==='register') {
    const name=string(data.name,'nombre',true,100);
    const digest=await hashPassword(password(data.password));
    const result=await db.query("INSERT INTO accounts(name,email,password_hash,role) VALUES($1,$2,$3,'Cliente') RETURNING id",[name,mail,digest]);
    id=result.rows[0].id;
  } else {
    const {rows:[row]}=await db.query('SELECT id,password_hash,active FROM accounts WHERE email=$1',[mail]);
    const input=typeof data.password==='string' && data.password.length<=128 ? data.password : '';
    // Ejecutar la misma derivación aunque el correo no exista.
    const valid=await matches(input,row?.password_hash || '00000000000000000000000000000000.'+'00'.repeat(64));
    if (!row?.active || !valid) fail('Correo o contraseña incorrectos.',401);
    id=row.id;
  }
  const token=randomBytes(32).toString('hex');
  if (response.previous) await db.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(response.previous)]);
  await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[tokenHash(token),id]);
  response.token=token;
  return {user:await current(db,token)};
}
async function profile(db,actor,data) {
  requireRole(actor,'Cliente');
  const {rows:[user]}=await db.query('UPDATE accounts SET phone=$1,address=$2 WHERE id=$3 RETURNING '+fields,
    [string(data.phone,'teléfono',false,60),string(data.address,'dirección',false,250),actor.id]);
  return {user};
}
async function manage(db,actor,data) {
  requireRole(actor,'Superadmin');
  if (data.action==='users') return {users:(await db.query('SELECT '+fields+' FROM accounts ORDER BY id')).rows};
  // Serializa las comprobaciones del último administrador, incluso entre dos cuentas distintas.
  await db.query('SELECT pg_advisory_xact_lock(80392)');
  const fresh=await db.query('SELECT role,active FROM accounts WHERE id=$1',[actor.id]);
  if (!fresh.rows[0]?.active || fresh.rows[0].role!=='Superadmin') fail('Acceso denegado.',403);
  const name=string(data.name,'nombre',true,100),mail=email(data.email),active=bool(data.active);
  const role=data.role;
  if (!['Cliente','Empleado','Superadmin'].includes(role)) fail('Seleccioná un rol válido.');
  const phone=string(data.phone,'teléfono',false,60),address=string(data.address,'dirección',false,250);
  if (!data.id) {
    const digest=await hashPassword(password(data.password));
    await db.query('INSERT INTO accounts(name,email,role,active,phone,address,password_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [name,mail,role,active,phone,address,digest]);
  } else {
    const id=integer(data.id,'usuario',1);
    const {rows:[target]}=await db.query('SELECT * FROM accounts WHERE id=$1 FOR UPDATE',[id]);
    if (!target) fail('El usuario no existe.',404);
    if (target.role==='Superadmin' && target.active && (role!=='Superadmin' || !active)) {
      const other=await db.query("SELECT id FROM accounts WHERE id<>$1 AND role='Superadmin' AND active LIMIT 1",[id]);
      if (!other.rowCount) fail('Debe quedar al menos un Superadmin activo.',409);
    }
    const digest=data.password?await hashPassword(password(data.password)):target.password_hash;
    await db.query('UPDATE accounts SET name=$1,email=$2,role=$3,active=$4,phone=$5,address=$6,password_hash=$7 WHERE id=$8',
      [name,mail,role,active,phone,address,digest,id]);
    if (!active || data.password) await db.query('DELETE FROM sessions WHERE user_id=$1',[id]);
  }
  return {ok:true};
}
module.exports={current,signIn,profile,manage};
