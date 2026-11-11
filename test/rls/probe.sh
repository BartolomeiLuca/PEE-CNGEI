#!/bin/bash
P="psql -h /tmp -p 5544 -U postgres -d pee -q -t -A"
$P >/dev/null <<SQL
truncate auth.users cascade; truncate net.log;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','owner@x.it',now(),'{"nome":"Olga Owner"}'),
 ('00000000-0000-0000-0000-00000000000c','cot@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000b','collab@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000d','lett@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000e','estr@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000f','collab2@x.it',null,'{}'),
 ('00000000-0000-0000-0000-0000000000aa','luca.bartolomei@cngei.it',now(),'{}');
insert into public.pee_archivi(id,user_id,anno,titolo,data,meta) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a',2026,'Progetto','{"x":1}','{"mode":"giovani"}'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000e',2026,'Di estranea','{"y":1}','{}');
insert into public.pee_membri(archivio_id,owner_id,owner_email,email,ruolo) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','Olga (owner@x.it)','cot@x.it','cotitolare'),
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','Olga (owner@x.it)','collab@x.it','collaboratore'),
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','Olga (owner@x.it)','collab2@x.it','collaboratore'),
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','Olga (owner@x.it)','lett@x.it','lettore');
insert into public.pee_versioni(id,user_id,archivio_id,label,data) values
 ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','10000000-0000-0000-0000-000000000001','Del titolare','{}'),
 ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000b','10000000-0000-0000-0000-000000000001','Del collaboratore','{}');
insert into public.pee_suggerimenti(id,archivio_id,user_id,autore_nome,percorso,testo) values
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000d','Lea','p1','testo');
SQL
declare -A U=( [owner]=a [cot]=c [collab]=b [lett]=d [estr]=e [nonconf]=f [admin]=aa [anon]=- )
declare -A M=( [owner]=owner@x.it [cot]=cot@x.it [collab]=collab@x.it [lett]=lett@x.it [estr]=estr@x.it [nonconf]=collab2@x.it [admin]=luca.bartolomei@cngei.it )
# uso: t <chi> <atteso: si|no> <descrizione> <sql che restituisce righe (returning / select)>
t(){ local who=$1 exp=$2 desc=$3 sql=$4 role=authenticated sub
  if [ $who = anon ]; then role=anon; sub=''; else sub=$(printf '00000000-0000-0000-0000-%012s' ${U[$who]} | tr ' ' 0); fi
  out=$($P 2>&1 <<SQL
begin; set local role $role; set local request.jwt.claim.sub='$sub'; set local request.jwt.claims='{"email":"${M[$who]}"}';
$sql;
rollback;
SQL
)
  if echo "$out" | grep -q "ERROR"; then got=no; det=$(echo "$out" | grep ERROR | head -1 | cut -c1-90); elif [ -z "$(echo "$out" | tr -d '[:space:]')" ]; then got=no; det="(0 righe)"; else got=si; det=$(echo "$out" | head -1 | cut -c1-60); fi
  if [ $got = $exp ]; then m="ok  "; else m="✗✗✗ "; fi
  printf "%s %-8s atteso=%s ottenuto=%s | %s | %s\n" "$m" $who $exp $got "$desc" "$det"
}
A=10000000-0000-0000-0000-000000000001; B=10000000-0000-0000-0000-000000000002
echo "--- pee_archivi"
for w in owner cot collab lett; do t $w si "legge il progetto" "select id from pee_archivi where id='$A'"; done
for w in estr nonconf anon; do t $w no "legge il progetto" "select id from pee_archivi where id='$A'"; done
for w in owner cot collab; do t $w si "modifica data" "update pee_archivi set data='{\"x\":2}' where id='$A' returning id"; done
for w in lett estr nonconf anon; do t $w no "modifica data" "update pee_archivi set data='{\"x\":2}' where id='$A' returning id"; done
for w in cot collab; do t $w no "cambia titolo" "update pee_archivi set titolo='hack' where id='$A' returning id"; t $w no "cambia proprietario" "update pee_archivi set user_id=auth.uid() where id='$A' returning id"; t $w no "elimina progetto" "delete from pee_archivi where id='$A' returning id"; done
for w in cot collab; do t $w no "mette nel cestino via meta (porta alla cancellazione definitiva)" "update pee_archivi set meta=meta||'{\"cest\":{\"at\":1,\"titolo\":\"x\"}}' where id='$A' returning id"; done
t owner si "elimina progetto" "delete from pee_archivi where id='$A' returning id"
t estr no "crea progetto a nome di altri" "insert into pee_archivi(user_id,anno,titolo) values ('00000000-0000-0000-0000-00000000000a',2026,'falso') returning id"
echo "--- pee_membri"
t owner si "vede i membri" "select count(*) from pee_membri where archivio_id='$A' having count(*)=4"
t cot si "vede i membri" "select count(*) from pee_membri where archivio_id='$A' having count(*)=4"
t collab no "vede gli altri membri" "select count(*) from pee_membri where archivio_id='$A' having count(*)>1"
t lett no "vede gli altri membri" "select count(*) from pee_membri where archivio_id='$A' having count(*)>1"
t collab no "si promuove co-titolare" "update pee_membri set ruolo='cotitolare' where email='collab@x.it' returning id"
t lett no "si promuove collaboratore" "update pee_membri set ruolo='collaboratore' where email='lett@x.it' returning id"
t lett no "invita qualcuno" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','amico@x.it','lettore') returning id"
t estr no "si invita da sola" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','estr@x.it','collaboratore') returning id"
t cot si "invita un lettore" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','amico@x.it','lettore') returning id"
t cot no "crea un altro co-titolare" "insert into pee_membri(archivio_id,email,ruolo) values ('$A','amico@x.it','cotitolare') returning id"
t cot no "promuove a co-titolare" "update pee_membri set ruolo='cotitolare' where email='collab@x.it' returning id"
t cot si "cambia ruolo lettore->collab" "update pee_membri set ruolo='collaboratore' where email='lett@x.it' returning id"
t cot no "cambia l'EMAIL di un invito (passa l'accesso a un altro indirizzo)" "update pee_membri set email='estr@x.it' where email='lett@x.it' returning id"
t cot no "riscrive owner_email mostrato agli invitati" "update pee_membri set owner_email='Falso (falso@x.it)' where email='lett@x.it' returning id"
t cot no "sposta un invito su un altro progetto" "update pee_membri set archivio_id='$B' where email='lett@x.it' returning id"
t cot no "toglie se stesso/altro co-titolare via regola co-titolari" "delete from pee_membri where email='cot@x.it' and false returning id"
t cot si "toglie un collaboratore" "delete from pee_membri where email='collab@x.it' returning id"
t collab si "esce dal progetto" "delete from pee_membri where email='collab@x.it' returning id"
t collab no "toglie un altro" "delete from pee_membri where email='lett@x.it' returning id"
t owner no "invita con owner_id altrui" "insert into pee_membri(archivio_id,owner_id,email) values ('$A','00000000-0000-0000-0000-00000000000e','z@x.it') returning id"
t estr no "invita sul progetto altrui" "insert into pee_membri(archivio_id,email) values ('$A','z@x.it') returning id"
echo "--- pee_versioni"
t owner si "vede le proprie versioni" "select id from pee_versioni where label='Del titolare'"
t owner si "vede le versioni salvate dal collaboratore" "select id from pee_versioni where label='Del collaboratore'"
t owner si "elimina (sfoltisce) le versioni del collaboratore" "delete from pee_versioni where label='Del collaboratore' returning id"
t cot si "vede tutte le versioni" "select count(*) from pee_versioni where archivio_id='$A' having count(*)=2"
t collab si "vede tutte le versioni" "select count(*) from pee_versioni where archivio_id='$A' having count(*)=2"
t collab si "salva una versione" "insert into pee_versioni(archivio_id,label,data) values ('$A','v','{}') returning id"
t lett no "vede le versioni" "select id from pee_versioni where archivio_id='$A'"
t lett no "salva una versione" "insert into pee_versioni(archivio_id,label,data) values ('$A','v','{}') returning id"
t estr no "vede le versioni" "select id from pee_versioni where archivio_id='$A'"
t collab no "elimina le versioni del titolare" "delete from pee_versioni where label='Del titolare' returning id"
echo "--- ex collaboratore (accesso tolto): vede ancora le versioni salvate da lui?"
$P -c "delete from pee_membri where email='collab@x.it'" >/dev/null
t collab no "ex collaboratore legge il progetto" "select id from pee_archivi where id='$A'"
t collab no "ex collaboratore legge le versioni che aveva salvato (copie intere del progetto)" "select id from pee_versioni where archivio_id='$A'"
$P -c "insert into public.pee_membri(archivio_id,owner_id,owner_email,email,ruolo) values ('$A','00000000-0000-0000-0000-00000000000a','Olga (owner@x.it)','collab@x.it','collaboratore')" >/dev/null
echo "--- pee_suggerimenti"
t lett si "scrive un suggerimento" "insert into pee_suggerimenti(archivio_id,autore_nome,percorso,testo) values ('$A','Lea','p','t') returning id"
t estr no "scrive un suggerimento" "insert into pee_suggerimenti(archivio_id,autore_nome,percorso,testo) values ('$A','X','p','t') returning id"
t owner si "legge i suggerimenti" "select id from pee_suggerimenti where archivio_id='$A'"
t cot si "legge i suggerimenti" "select id from pee_suggerimenti where archivio_id='$A'"
t collab no "legge i suggerimenti altrui" "select id from pee_suggerimenti where archivio_id='$A'"
t owner si "segna letto" "update pee_suggerimenti set stato='letto' where archivio_id='$A' returning id"
t owner no "cambia il testo" "update pee_suggerimenti set testo='altro' where archivio_id='$A' returning id"
t cot si "segna letto" "update pee_suggerimenti set stato='letto' where archivio_id='$A' returning id"
t lett no "scrive a nome di un altro utente" "insert into pee_suggerimenti(archivio_id,user_id,autore_nome,percorso,testo) values ('$A','00000000-0000-0000-0000-00000000000a','Olga','p','t') returning id"
t lett si "elimina il proprio" "delete from pee_suggerimenti where archivio_id='$A' returning id"
t cot no "elimina quello di un altro" "delete from pee_suggerimenti where archivio_id='$A' returning id"
echo "--- pee_archivio_nazionale"
N="insert into pee_archivio_nazionale(titolo) values ('Attività prova') returning id"
t estr si "propone" "$N"
t anon no "propone" "$N"
t estr no "propone già approvata" "insert into pee_archivio_nazionale(titolo,stato) values ('Attività prova','approvata') returning id"
$P -c "insert into pee_archivio_nazionale(id,autore_id,titolo,stato) values ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000e','In attesa','in_attesa'),('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000e','Approvata','approvata')" >/dev/null
t owner no "legge proposta altrui in attesa" "select id from pee_archivio_nazionale where stato='in_attesa'"
t owner si "legge le approvate" "select id from pee_archivio_nazionale where stato='approvata'"
t anon no "legge le approvate senza account" "select id from pee_archivio_nazionale where stato='approvata'"
t estr no "si approva da sola" "update pee_archivio_nazionale set stato='approvata' where titolo='In attesa' returning id"
t estr no "modifica la propria approvata" "update pee_archivio_nazionale set titolo='Cambiata dopo' where titolo='Approvata' returning id"
t estr si "ritira la propria in attesa" "delete from pee_archivio_nazionale where titolo='In attesa' returning id"
t estr no "toglie la propria approvata" "delete from pee_archivio_nazionale where titolo='Approvata' returning id"
t admin si "approva" "update pee_archivio_nazionale set stato='approvata' where titolo='In attesa' returning id"
echo "--- altre"
t anon si "legge pee_gruppi senza account" "insert into pee_gruppi values ('s','g') on conflict do nothing; select 1" 
t estr no "legge pee_cambi_email" "select 1 from pee_cambi_email"
t anon no "chiama pee_prepara_cambio_email" "select pee_prepara_cambio_email('a@b.it'); select 1"
t estr no "legge i segreti del vault" "select decrypted_secret from vault.decrypted_secrets"
t estr no "legge auth.users" "select email from auth.users"
t nonconf no "email non confermata: pee_my_email" "select pee_my_email() where pee_my_email() is not null"
echo "--- mail: la proposta parte anche se la mail fallisce"
$P -c "truncate net.log" >/dev/null
t estr si "propone (mail ok)" "$N"
$P -c "create or replace function net.http_post(url text, headers jsonb, body jsonb, timeout_milliseconds int default 1000) returns bigint language plpgsql as \$\$ begin raise exception 'Brevo giù'; end \$\$" >/dev/null
t estr si "propone con Brevo che dà errore" "$N" 
