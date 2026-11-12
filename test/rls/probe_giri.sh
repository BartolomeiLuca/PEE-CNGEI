#!/bin/bash
# Prove delle regole di accesso per i giri di revisione (richiede il database di prova su porta 5544, come probe.sh)
P="psql -h /tmp -p 5544 -U postgres -d pee -q -t -A"
A=10000000-0000-0000-0000-000000000001; G=40000000-0000-0000-0000-000000000001; G2=40000000-0000-0000-0000-000000000002
$P >/dev/null <<SQL
truncate auth.users cascade;
update public.pee_config set valore='no' where chiave='revisori_aperto';
delete from public.pee_revisori_ammessi where email<>'luca.bartolomei@cngei.it';
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','owner@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000d','lett@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000e','estr@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-00000000000f','tutor@x.it',now(),'{}'),
 ('00000000-0000-0000-0000-0000000000aa','luca.bartolomei@cngei.it',now(),'{}');
insert into public.pee_archivi(id,user_id,anno,titolo,data) values ('$A','00000000-0000-0000-0000-00000000000a',2026,'Progetto','{"x":1}');
insert into public.pee_membri(archivio_id,owner_id,owner_email,email,ruolo) values ('$A','00000000-0000-0000-0000-00000000000a','Olga','lett@x.it','lettore');
SQL
declare -A U=( [owner]=a [lett]=d [estr]=e [tutor]=f [admin]=aa [anon]=- )
declare -A M=( [owner]=owner@x.it [lett]=lett@x.it [estr]=estr@x.it [tutor]=tutor@x.it [admin]=luca.bartolomei@cngei.it )
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
  printf "%s %-6s atteso=%s ottenuto=%s | %s | %s\n" "$m" $who $exp $got "$desc" "$det"
}
# giro di partenza + destinatari (inseriti come amministratore del database)
$P >/dev/null <<SQL
insert into public.pee_giri(id,archivio_id,owner_id,sezioni,data) values ('$G','$A','00000000-0000-0000-0000-00000000000a','{1,2,3}','{"pp":"copia"}');
insert into public.pee_giri_dest(giro_id,email,ruolo,nome) values
 ('$G','luca.bartolomei@cngei.it','revisore','Luca'),('$G','tutor@x.it','revisore','Tutor'),('$G','lett@x.it','copia','Capo Gruppo');
SQL
echo "--- interruttore"
t estr no "legge pee_config" "select * from pee_config"
t owner no "legge pee_config (titolare)" "select * from pee_config"
t owner no "scrive pee_config" "update pee_config set valore='si' returning 1"
t estr no "legge l'elenco ammessi" "select * from pee_revisori_ammessi"
t estr no "si aggiunge all'elenco" "insert into pee_revisori_ammessi(email) values ('estr@x.it') returning 1"
t anon no "chiama revisore_abilitato senza account" "select revisore_abilitato('luca.bartolomei@cngei.it')"
t estr si "revisore_abilitato risponde sì per l'indirizzo ammesso" "select 1 where revisore_abilitato('Luca.Bartolomei@cngei.it')"
t estr no "revisore_abilitato risponde no per un altro" "select 1 where revisore_abilitato('tutor@x.it')"
echo "--- giri: creazione e immutabilità"
t owner si "congela un giro (numero assegnato)" "insert into pee_giri(archivio_id,sezioni,data) values ('$A','{1,2}','{}') returning n"
t owner si "congela un secondo e un terzo giro: nessun tetto" "insert into pee_giri(archivio_id,data) values ('$A','{}'),('$A','{}'),('$A','{}'),('$A','{}'),('$A','{}') returning n"
t lett no "un lettore congela" "insert into pee_giri(archivio_id,data) values ('$A','{}') returning n"
t estr no "un'estranea congela sul progetto altrui" "insert into pee_giri(archivio_id,data) values ('$A','{}') returning n"
t estr no "congela a nome del titolare" "insert into pee_giri(archivio_id,owner_id,data) values ('$A','00000000-0000-0000-0000-00000000000a','{}') returning n"
t owner no "modifica un giro" "update pee_giri set data='{\"x\":2}' where id='$G' returning id"
t owner no "cancella un giro" "delete from pee_giri where id='$G' returning id"
t owner no "cambia il numero" "update pee_giri set n=99 where id='$G' returning id"
t admin no "il revisore modifica il giro" "update pee_giri set data='{}' where id='$G' returning id"
t admin no "il revisore cancella il giro" "delete from pee_giri where id='$G' returning id"
echo "--- giri: chi li legge"
t owner si "titolare legge" "select id from pee_giri where id='$G'"
t admin si "revisore ammesso legge la copia" "select id from pee_giri where id='$G'"
t lett si "in copia legge" "select id from pee_giri where id='$G'"
t tutor no "revisore NON ammesso non legge (anche se indicato)" "select id from pee_giri where id='$G'"
t estr no "estranea non legge" "select id from pee_giri where id='$G'"
t anon no "senza account non legge" "select id from pee_giri where id='$G'"
t admin no "il revisore NON legge il progetto vivo" "select id from pee_archivi where id='$A'"
t admin no "il revisore NON vede i membri" "select id from pee_membri"
t admin no "il revisore NON vede le versioni" "select id from pee_versioni"
echo "--- destinatari"
t owner si "titolare aggiunge un revisore ammesso" "delete from pee_giri_dest where email='luca.bartolomei@cngei.it'; insert into pee_giri_dest(giro_id,email,ruolo) values ('$G','luca.bartolomei@cngei.it','revisore') returning 1" 
t owner no "titolare aggiunge un revisore NON ammesso (database rifiuta)" "insert into pee_giri_dest(giro_id,email,ruolo) values ('$G','estr@x.it','revisore') returning id"
t owner si "titolare aggiunge chi è in copia (nessun limite)" "insert into pee_giri_dest(giro_id,email,ruolo) values ('$G','estr@x.it','copia') returning id"
t estr no "estranea si aggiunge" "insert into pee_giri_dest(giro_id,email,ruolo) values ('$G','estr@x.it','copia') returning id"
t admin no "il revisore aggiunge altri" "insert into pee_giri_dest(giro_id,email,ruolo) values ('$G','estr@x.it','copia') returning id"
t admin si "il revisore vede il proprio invito" "select id from pee_giri_dest where giro_id='$G'"
t admin no "il revisore vede gli altri invitati" "select count(*) from pee_giri_dest where giro_id='$G' having count(*)>1"
t owner si "titolare vede tutti" "select count(*) from pee_giri_dest where giro_id='$G' having count(*)=3"
t owner si "titolare toglie un destinatario" "delete from pee_giri_dest where giro_id='$G' and email='lett@x.it' returning id"
t lett no "chi è in copia toglie un destinatario" "delete from pee_giri_dest where giro_id='$G' and email='tutor@x.it' returning id"
t owner no "titolare cambia l'email in una non ammessa come revisore" "update pee_giri_dest set email='estr@x.it' where email='tutor@x.it' returning id"
echo "--- note, stati, check, esiti"
t admin si "revisore scrive una nota" "insert into pee_giri_rev(giro_id,autore_nome,tipo,chiave,testo) values ('$G','Luca','nota','sez2','Rivedi l''obiettivo') returning id"
t admin si "revisore dà lo stato di una sezione" "insert into pee_giri_rev(giro_id,tipo,chiave,valore) values ('$G','stato','sez2','rivedere') returning id"
t admin no "stato con valore inventato" "insert into pee_giri_rev(giro_id,tipo,chiave,valore) values ('$G','stato','sez2','boh') returning id"
t admin si "revisore segna un criterio della check-list" "insert into pee_giri_rev(giro_id,tipo,chiave,valore) values ('$G','check','c3','si') returning id"
t admin si "revisore dà il proprio esito" "insert into pee_giri_rev(giro_id,tipo,chiave,valore) values ('$G','esito','','approva') returning id"
t admin no "esito con valore inventato" "insert into pee_giri_rev(giro_id,tipo,chiave,valore) values ('$G','esito','','forse') returning id"
t admin no "revisore scrive a nome di altri" "insert into pee_giri_rev(giro_id,user_id,tipo,testo) values ('$G','00000000-0000-0000-0000-00000000000a','nota','x') returning id"
t admin no "revisore si segna già recepita" "insert into pee_giri_rev(giro_id,tipo,testo,recepita) values ('$G','nota','x',true) returning id"
t admin no "revisore finge di essere il titolare" "insert into pee_giri_rev(giro_id,autore_ruolo,tipo,valore,registrata) values ('$G','titolare','esito','approva',true) returning id"
t tutor no "revisore non ammesso scrive" "insert into pee_giri_rev(giro_id,tipo,testo) values ('$G','nota','x') returning id"
t estr no "estranea scrive" "insert into pee_giri_rev(giro_id,tipo,testo) values ('$G','nota','x') returning id"
t lett si "chi è in copia scrive una nota" "insert into pee_giri_rev(giro_id,autore_ruolo,tipo,testo) values ('$G','copia','nota','Suggerimento') returning id"
t lett no "chi è in copia dà un esito" "insert into pee_giri_rev(giro_id,autore_ruolo,tipo,valore) values ('$G','copia','esito','approva') returning id"
t lett no "chi è in copia si spaccia per revisore" "insert into pee_giri_rev(giro_id,autore_ruolo,tipo,valore) values ('$G','revisore','esito','approva') returning id"
t owner si "titolare registra a mano un'approvazione" "insert into pee_giri_rev(giro_id,autore_nome,autore_ruolo,tipo,valore,registrata) values ('$G','Tutor Mario','titolare','esito','approva',true) returning id"
t owner no "titolare scrive come se fosse il revisore" "insert into pee_giri_rev(giro_id,autore_nome,autore_ruolo,tipo,valore) values ('$G','Falso','revisore','esito','approva') returning id"
# dati di prova per le letture/modifiche
$P >/dev/null <<SQL
insert into public.pee_giri_rev(id,giro_id,user_id,autore_nome,tipo,chiave,testo,valore) values
 ('50000000-0000-0000-0000-000000000001','$G','00000000-0000-0000-0000-0000000000aa','Luca','nota','sez2','Rivedi','' ),
 ('50000000-0000-0000-0000-000000000002','$G','00000000-0000-0000-0000-00000000000d','CG','nota','sez1','Bene','' );
update public.pee_giri_rev set autore_ruolo='copia' where id='50000000-0000-0000-0000-000000000002';
SQL
R1=50000000-0000-0000-0000-000000000001; R2=50000000-0000-0000-0000-000000000002
t owner si "titolare legge tutto" "select count(*) from pee_giri_rev where giro_id='$G' having count(*)=2"
t admin si "revisore legge le proprie" "select id from pee_giri_rev where id='$R1'"
t admin no "revisore NON legge quelle degli altri" "select id from pee_giri_rev where id='$R2'"
t lett no "chi è in copia NON legge quelle del revisore" "select id from pee_giri_rev where id='$R1'"
t estr no "estranea non legge" "select id from pee_giri_rev where giro_id='$G'"
t admin si "revisore corregge la propria nota" "update pee_giri_rev set testo='Meglio così' where id='$R1' returning id"
t admin no "revisore modifica la nota di un altro" "update pee_giri_rev set testo='x' where id='$R2' returning id"
t admin no "revisore si segna la propria nota recepita (resta falso)" "select 1 from (update pee_giri_rev set recepita=true where id='$R1' returning recepita) x where recepita"
t admin no "revisore cambia il tipo" "update pee_giri_rev set tipo='esito',valore='approva' where id='$R1' returning id"
t admin no "revisore sposta la nota su un altro giro" "update pee_giri_rev set giro_id='$G2' where id='$R1' returning id"
t owner si "titolare segna recepita" "update pee_giri_rev set recepita=true where id='$R1' returning recepita"
t owner no "titolare riscrive la nota del revisore (il testo non cambia)" "select 1 from (update pee_giri_rev set testo='Falsa' where id='$R1' returning testo) x where testo='Falsa'"
t owner si "titolare cancella una nota" "delete from pee_giri_rev where id='$R1' returning id"
t admin si "revisore cancella la propria" "delete from pee_giri_rev where id='$R1' returning id"
t admin no "revisore cancella quella di un altro" "delete from pee_giri_rev where id='$R2' returning id"
echo "--- interruttore aperto / chiuso / revoca"
$P -c "update pee_config set valore='si' where chiave='revisori_aperto'" >/dev/null
t owner si "aperto a tutti: titolare aggiunge un revisore qualunque" "insert into pee_giri_dest(giro_id,email,ruolo) values ('$G','estr@x.it','revisore') returning id"
$P -c "insert into pee_giri_dest(giro_id,email,ruolo) values ('$G','estr@x.it','revisore') on conflict do nothing" >/dev/null
t estr si "aperto a tutti: il revisore legge la copia" "select id from pee_giri where id='$G'"
t estr si "aperto a tutti: il revisore dà un esito" "insert into pee_giri_rev(giro_id,tipo,valore) values ('$G','esito','chiarimenti') returning id"
$P -c "update pee_config set valore='no' where chiave='revisori_aperto'" >/dev/null
t estr no "richiuso: perde la lettura (nessun dato cancellato)" "select id from pee_giri where id='$G'"
t estr no "richiuso: non scrive più" "insert into pee_giri_rev(giro_id,tipo,valore) values ('$G','esito','approva') returning id"
t admin si "richiuso: l'ammesso continua" "select id from pee_giri where id='$G'"
t owner si "richiuso: il titolare vede ancora tutto" "select id from pee_giri where id='$G'"
$P -c "delete from pee_revisori_ammessi where email='luca.bartolomei@cngei.it'" >/dev/null
t admin no "revocato dall'elenco: perde la lettura" "select id from pee_giri where id='$G'"
$P -c "insert into pee_revisori_ammessi(email) values ('luca.bartolomei@cngei.it')" >/dev/null
echo "--- eliminazione del progetto"
t owner si "elimina il progetto: i giri vanno con lui" "delete from pee_archivi where id='$A' returning id"
