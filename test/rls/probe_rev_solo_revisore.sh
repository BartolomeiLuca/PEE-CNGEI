#!/bin/bash
# La revisione si apre solo con un revisore (richiede il database di prova su porta 5544, come probe.sh)
P="psql -h /tmp -p 5544 -U postgres -d pee -q -t -A"
$P >/dev/null 2>&1 <<SQL
truncate auth.users cascade;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000a','owner@x.it',now(),'{}');
insert into public.pee_archivi(id,user_id,anno,titolo,data) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a',2026,'P','{"x":1}');
SQL
q(){ $P -c "$1" 2>&1; }
G(){ q "insert into public.pee_giri(id,archivio_id,owner_id,n,sezioni,data) values ('$1','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a',$2,'{1,2,3}','{}')" >/dev/null; }
chk(){ if [ "$2" = "$3" ]; then echo "ok   $1"; else echo "✗✗✗ $1 (atteso $3, ottenuto $2)"; fi; }
A="select count(*) from public.pee_revisioni where stato='aperta'"
G 40000000-0000-0000-0000-000000000001 1
chk "un giro solo congelato non apre nessuna revisione" "$(q "$A")" 0
q "insert into public.pee_giri_dest(giro_id,email,ruolo,nome) values ('40000000-0000-0000-0000-000000000001','cg@x.it','copia','CG')" >/dev/null
chk "un destinatario in copia non apre nessuna revisione" "$(q "$A")" 0
q "insert into public.pee_giri_dest(giro_id,email,ruolo,nome) values ('40000000-0000-0000-0000-000000000001','tutor@x.it','revisore','Tutor')" >/dev/null
chk "il revisore apre la revisione, con la sua email" "$(q "select count(*)||':'||max(revisore_email) from public.pee_revisioni where stato='aperta'")" "1:tutor@x.it"
G 40000000-0000-0000-0000-000000000002 2
chk "un giro successivo si aggancia alla revisione aperta" "$(q "select count(*)||':'||(max(ultimo_giro_id::text)='40000000-0000-0000-0000-000000000002') from public.pee_revisioni")" "1:true"
chk "un altro revisore, mentre c'è la revisione, è rifiutato" "$($P -c "set request.jwt.claim.sub='00000000-0000-0000-0000-00000000000a'; insert into public.pee_giri_dest(giro_id,email,ruolo,nome) values ('40000000-0000-0000-0000-000000000002','altro@x.it','revisore','Altro')" 2>&1 | grep -c 'già stato scelto')" 1
