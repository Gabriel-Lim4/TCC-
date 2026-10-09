import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import pg from 'pg';
const db=new pg.Client({connectionString:process.env.DIRECT_URL,connectionTimeoutMillis:10000,statement_timeout:20000});
const tables=['usuarios','contas_vinculadas','campanhas','metricas','analises_ia'];
async function counts(){const result={};for(const table of tables)result[table]=(await db.query(`SELECT count(*)::int AS count FROM public."${table}"`)).rows[0].count;return result;}
try {
 await db.connect(); await db.query('BEGIN'); await db.query("SET LOCAL lock_timeout='5s'");
 const before=await counts();
 const constraints=(await db.query("SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.usuarios'::regclass")).rows;
 const columns=(await db.query("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position")).rows;
 writeFileSync('/tmp/eyesight-activation/schema-before.json',JSON.stringify({counts:before,constraints,columns},null,2),{mode:0o600,flag:'wx'});
 await db.query(readFileSync(new URL('./activation-additions.sql',import.meta.url),'utf8'));
 const after=await counts();
 if(JSON.stringify(before)!==JSON.stringify(after))throw new Error('Existing row counts changed.');
 const preserved=(await db.query("SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.usuarios'::regclass")).rows;
 if(JSON.stringify(constraints)!==JSON.stringify(preserved))throw new Error('Existing user constraints changed.');
 await db.query('COMMIT');console.log('Additive update committed. Existing row counts and Auth constraints preserved.');
} catch(error){await db.query('ROLLBACK').catch(()=>{});console.error('Update not applied:',error.code||error.name);process.exitCode=1;}finally{await db.end();}
