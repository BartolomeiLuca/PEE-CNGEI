#!/bin/bash
# Prove delle regole di accesso per il ruolo «commissario» (richiede il database di prova su porta 5544, come probe.sh,
# con gli script SQL già caricati nell'ordine di sempre e poi supabase_aggiornamento_20novembre_commissario.sql)
P="psql -h /tmp -p 5544 -U postgres -d pee -q -t -A"
$P >/dev/null <<SQL
truncate auth.users cascade;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','cg@x.it',now(),'{"nome":"Capo Gruppo"}'),
 ('00000000-0000-0000-0000-00000000000c','cot@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000d','lett@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000e','estr@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-0000000000b1','comm@x.it',now(),'{}');
insert into public.pee_archivi(id,user_id,anno,titolo,data,meta) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a',2026,'Formativa','{"x":1}','{"mode":"staff"}');
insert into public.pee_membri(archivio_id,owner_id,owner_email,email,ruolo) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','CG (cg@x.it)','cot@x.it','cotitolare'),
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','CG (cg@x.it)','lett@x.it','lettore'),
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','CG (cg@x.it)','comm@x.it','commissario');
insert into public.pee_suggerimenti(id,archivio_id,user_id,autore_nome,percorso,testo) values
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000d','Lea','p1','di lea');
SQL
declare -A U=( [cg]=a [cot]=c [lett]=d [estr]=e [comm]=b1 )
declare -A M=( [cg]=cg@x.it [cot]=cot@x.it [lett]=lett@x.it [estr]=estr@x.it [comm]=comm@x.it )
t(){ local who=$1 exp=$2 desc=$3 sql=$4 sub
  sub=$(printf '00000000-0000-0000-0000-%012s' ${U[$who]} | tr ' ' 0)
  out=$($P 2>&1 <<SQL
begin; set local role authenticated; set local request.jwt.claim.sub='$sub'; set local request.jwt.claims='{"email":"${M[$who]}"}';
$sql;
rollback;
SQL
)
  if echo "$out" | grep -q "ERROR"; then got=no; det=$(echo "$out" | grep ERROR | head -1 | cut -c1-90); elif [ -z "$(echo "$out" | tr -d '[:space:]')" ]; then got=no; det="(0 righe)"; else got=si; det=$(echo "$out" | head -1 | cut -c1-60); fi
  if [ $got = $exp ]; then m="ok  "; else m="✗✗✗ "; fi
  printf "%s %-6s atteso=%s ottenuto=%s | %s | %s\n" "$m" $who $exp $got "$desc" "$det"
}
A=10000000-0000-0000-0000-000000000001
echo "--- il commissario legge, non modifica"
t comm si  "legge il progetto" "select id from pee_archivi where id='$A'"
t comm no  "modifica il contenuto" "update pee_archivi set data='{\"x\":2}' where id='$A' returning id"
t comm no  "cambia titolo" "update pee_archivi set titolo='hack' where id='$A' returning id"
t comm no  "elimina il progetto" "delete from pee_archivi where id='$A' returning id"
t comm no  "mette nel cestino via meta" "update pee_archivi set meta=meta||'{\"cest\":{\"at\":1}}' where id='$A' returning id"
t comm no  "salva una versione precedente" "insert into pee_versioni(user_id,archivio_id,label,data) values (auth.uid(),'$A','x','{}') returning id"
echo "--- inviti"
t cg   si  "invita un commissario" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','nuovo@x.it','commissario') returning id"
t cg   si  "cambia un lettore in commissario" "update pee_membri set ruolo='commissario' where email='lett@x.it' returning id"
t cot  no  "un co-titolare invita un commissario" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','altro@x.it','commissario') returning id"
t cot  no  "un co-titolare promuove a commissario" "update pee_membri set ruolo='commissario' where email='lett@x.it' returning id"
t comm no  "si promuove co-titolare" "update pee_membri set ruolo='cotitolare' where email='comm@x.it' returning id"
t comm no  "si promuove collaboratore" "update pee_membri set ruolo='collaboratore' where email='comm@x.it' returning id"
t comm no  "invita qualcuno" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','amico@x.it','lettore') returning id"
t comm no  "vede gli altri membri" "select count(*) from pee_membri where archivio_id='$A' having count(*)>1"
t comm si  "vede il proprio invito" "select id from pee_membri where email='comm@x.it'"
t comm si  "esce dal progetto" "delete from pee_membri where email='comm@x.it' returning id"
t estr no  "si invita da solo come commissario" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','estr@x.it','commissario') returning id"
t cg   no  "ruolo inventato" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','x@x.it','capo') returning id"
echo "--- pareri firmati (suggerimenti)"
t comm si  "scrive un parere" "insert into pee_suggerimenti(archivio_id,user_id,autore_nome,percorso,testo) values ('$A',auth.uid(),'Marco (Commissario)','p1','parere') returning id"
t comm no  "scrive a nome di un altro" "insert into pee_suggerimenti(archivio_id,user_id,autore_nome,percorso,testo) values ('$A','00000000-0000-0000-0000-00000000000d','Finto','p1','x') returning id"
t comm no  "legge i suggerimenti di un altro" "select id from pee_suggerimenti where autore_nome='Lea'"
t cg   si  "il Capo Gruppo legge tutti i suggerimenti" "select id from pee_suggerimenti where autore_nome='Lea'"
t cg   si  "il Capo Gruppo segna letto" "update pee_suggerimenti set stato='letto' where id='30000000-0000-0000-0000-000000000001' returning id"
t comm no  "segna letto un parere altrui" "update pee_suggerimenti set stato='letto' where id='30000000-0000-0000-0000-000000000001' returning id"
t estr no  "un estraneo scrive un parere" "insert into pee_suggerimenti(archivio_id,user_id,autore_nome,percorso,testo) values ('$A',auth.uid(),'X','p1','x') returning id"
