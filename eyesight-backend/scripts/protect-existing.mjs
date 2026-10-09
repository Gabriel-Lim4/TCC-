import 'dotenv/config';
import pg from 'pg';
import {writeFileSync} from 'node:fs';
const db=new pg.Client({connectionString:process.env.DIRECT_URL,connectionTimeoutMillis:10000,statement_timeout:15000});
const tables=['usuarios','contas_vinculadas','campanhas','metricas','analises_ia'];
try {
 await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'");
 const role=(await db.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];
 if(!role?.rolbypassrls)throw new Error('Backend role cannot bypass RLS.');
 const before=(await db.query("SELECT c.relname,c.relrowsecurity,c.relacl::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=ANY($1)",[tables])).rows;
 writeFileSync('/tmp/eyesight-activation/access-before.json',JSON.stringify(before,null,2),{mode:0o600,flag:'wx'});
 for(const table of tables){await db.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY`);await db.query(`REVOKE ALL ON TABLE public."${table}" FROM anon,authenticated`);}
 const after=(await db.query("SELECT c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT') AS public_read,has_table_privilege('authenticated',c.oid,'SELECT') AS client_read FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=ANY($1)",[tables])).rows;
 if(after.some(row=>!row.relrowsecurity||row.public_read||row.client_read))throw new Error('Verification failed.');
 await db.query('COMMIT');console.log('Existing tables protected:',after.length,'Backend role retains access.');
}catch(e){await db.query('ROLLBACK').catch(()=>{});console.error('Protection not applied:',e.code||e.name);process.exitCode=1;}finally{await db.end();}
