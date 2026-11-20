#!/bin/bash
# Prove delle regole di accesso per le risposte ai pareri/suggerimenti (richiede il database di prova su porta 5544, come probe.sh,
# con gli script SQL già caricati nell'ordine di sempre, poi supabase_aggiornamento_20novembre_commissario.sql e supabase_aggiornamento_20novembre_risposte_pareri.sql)
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
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000d','Lea','p1','di lea'),
 ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','Marco · Commissario di Sezione','PAG:lettura','parere di marco');
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
A=10000000-0000-0000-0000-000000000001; PM=30000000-0000-0000-0000-000000000002; PL=30000000-0000-0000-0000-000000000001
echo "--- rispondere"
t cg   si  "il Capo Gruppo risponde a un parere" "update pee_suggerimenti set risposta='Grazie, ne parliamo', risposta_da='Capo Gruppo', stato='letto' where id='$PM' returning risposta_il"
t cot  si  "un co-titolare risponde" "update pee_suggerimenti set risposta='ok', risposta_da='Cot' where id='$PM' returning id"
t comm no  "il Commissario risponde al proprio parere" "update pee_suggerimenti set risposta='mi rispondo' where id='$PM' returning id"
t lett no  "un lettore risponde" "update pee_suggerimenti set risposta='x' where id='$PL' returning id"
t estr no  "un estraneo risponde" "update pee_suggerimenti set risposta='x' where id='$PL' returning id"
t cg   no  "risposta vuota" "update pee_suggerimenti set risposta='' where id='$PM' returning id"
t cg   no  "risposta troppo lunga" "update pee_suggerimenti set risposta=repeat('a',2001) where id='$PM' returning id"
t cg   no  "il Capo Gruppo cambia il testo del parere" "update pee_suggerimenti set testo='falso' where id='$PM' returning id"
t cg   no  "il Capo Gruppo cambia la firma del parere" "update pee_suggerimenti set autore_nome='altro' where id='$PM' returning id"
t cg   no  "cambia la data della risposta a mano" "update pee_suggerimenti set risposta_il='2000-01-01' where id='$PM' returning id"
t cg   no  "cambia chi risponde senza cambiare il testo" "update pee_suggerimenti set risposta_da='finto' where id='$PM' returning id"
echo "--- leggere la risposta"
t comm si  "il Commissario legge la risposta al proprio parere" "select id from pee_suggerimenti where id='$PM'"
t comm no  "il Commissario legge il suggerimento di un altro" "select id from pee_suggerimenti where id='$PL'"
t lett no  "il Lettore legge il parere del Commissario" "select id from pee_suggerimenti where id='$PM'"
t lett si  "il Lettore legge il proprio suggerimento" "select id from pee_suggerimenti where id='$PL'"
echo "--- coerenza (una sola sessione: risponde, poi riscrive, poi toglie)"
t cg   si  "togliendo la risposta spariscono anche la firma e la data" "update pee_suggerimenti set risposta='uno', risposta_da='CG' where id='$PM'; with u as (update pee_suggerimenti set risposta=null where id='$PM' returning risposta_il, risposta_da) select 1 from u where risposta_il is null and risposta_da is null"
t cg   si  "scrivendo la risposta la data compare da sola" "with u as (update pee_suggerimenti set risposta='due', risposta_da='CG' where id='$PM' returning risposta_il) select 1 from u where risposta_il is not null"
