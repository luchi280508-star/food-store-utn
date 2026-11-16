import EmbeddedPostgres from 'embedded-postgres';
import {randomBytes} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const dir = path.resolve(process.env.FOOD_STORE_DEMO_DIR || '.local');
mkdirSync(dir,{recursive:true});
const settings = path.join(dir,'claves.json');
if (!existsSync(settings)) {
  const keys = ['PG_PASSWORD','DEMO_CLIENT_PASSWORD','DEMO_STAFF_PASSWORD','DEMO_ADMIN_PASSWORD'];
  writeFileSync(settings,JSON.stringify(Object.fromEntries(keys.map(k=>[k,randomBytes(18).toString('base64url')])),null,2),{mode:0o600,flag:'wx'});
}
const secrets = JSON.parse(readFileSync(settings,'utf8'));
const port = Number(process.env.DEMO_PG_PORT || 55438);
const databaseDir = path.join(dir,'postgres');
const pg = new EmbeddedPostgres({databaseDir,port,user:'postgres',password:secrets.PG_PASSWORD,
  authMethod:'scram-sha-256',initdbFlags:['--locale=C','--encoding=UTF8'],postgresFlags:['-h','127.0.0.1'],
  autoRehydrateSymlinks:true,persistent:true,onLog:()=>{},onError:message=>console.error(String(message))});
if (!existsSync(path.join(databaseDir,'PG_VERSION'))) await pg.initialise();
await pg.start();
let stopping=false;
const stop = async code => {
  if (stopping) return;
  stopping=true;
  try {await pg.stop();} finally {process.exit(code);}
};
process.on('SIGINT',()=>stop(0));
process.on('SIGTERM',()=>stop(0));
try {
  Object.assign(process.env,secrets,{DATABASE_URL:'postgresql://postgres:'+secrets.PG_PASSWORD+'@127.0.0.1:'+port+'/postgres'});
  const seed = spawnSync(process.execPath,['db/seed.js'],{stdio:'inherit'});
  if (seed.status !== 0) throw new Error('Falló la carga inicial.');
  console.log('Cuentas locales: cliente@foodstore.example, empleado@foodstore.example y admin@foodstore.example.');
  console.log('Tus claves de demo están en '+settings);
  await import('./server.js');
} catch (err) {console.error(err.message);await stop(1);}

