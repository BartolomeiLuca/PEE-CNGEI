#!/bin/bash
# Matrice completa persona × progetto × operazione sul Postgres vero (porta 5544, script SQL di sempre + 20 novembre commissario + risposte).
# Stesso mondo del collaudo t_isol.mjs: 7 persone, 6 progetti, ruoli incrociati (Fede è lettrice in U e co-titolare in G; Gina è titolare di U, G, P e lettrice in A e C).
# Ogni riga: persona, progetto, operazione → atteso si/no; per i conteggi: numero atteso. Un solo errore = uscita 1.
P="psql -h /tmp -p 5544 -U postgres -d pee -q -t -A"
U(){ printf '00000000-0000-0000-0000-%012s' "$1" | tr ' ' 0; }
declare -A UID_=( [gi]=a1 [al]=a2 [be]=a3 [fe]=a4 [da]=a5 [co]=a6 [st]=a7 )
declare -A MAIL=( [gi]=gina@x.it [al]=alex@x.it [be]=bea@x.it [fe]=fede@x.it [da]=dario@x.it [co]=comm@x.it [st]=stra@x.it )
declare -A AR=( [U]=10000000-0000-0000-0000-0000000000a1 [G]=10000000-0000-0000-0000-0000000000a2 [P]=10000000-0000-0000-0000-0000000000a3 [A]=10000000-0000-0000-0000-0000000000a4 [C]=10000000-0000-0000-0000-0000000000a5 [B]=10000000-0000-0000-0000-0000000000a6 )
declare -A OWN=( [U]=gi [G]=gi [P]=gi [A]=al [C]=co [B]=be )
setup(){ $P >/dev/null <<SQL
truncate auth.users cascade;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
$(for k in gi al be fe da co st; do echo " ('$(U ${UID_[$k]})','${MAIL[$k]}',now(),'{\"nome\":\"$k\"}'),"; done | sed '$ s/,$/;/')
insert into public.pee_archivi(id,user_id,anno,titolo,data,meta) values
$(for c in U G P A C B; do echo " ('${AR[$c]}','$(U ${UID_[${OWN[$c]}]})',2026,'Prog $c','{\"x\":\"$c\"}','{}'),"; done | sed '$ s/,$/;/')
insert into public.pee_membri(archivio_id,owner_id,owner_email,email,ruolo) values
 ('${AR[U]}','$(U a1)','Gina (gina@x.it)','alex@x.it','collaboratore'),
 ('${AR[U]}','$(U a1)','Gina (gina@x.it)','bea@x.it','lettore'),
 ('${AR[U]}','$(U a1)','Gina (gina@x.it)','fede@x.it','lettore'),
 ('${AR[G]}','$(U a1)','Gina (gina@x.it)','comm@x.it','commissario'),
 ('${AR[G]}','$(U a1)','Gina (gina@x.it)','dario@x.it','collaboratore'),
 ('${AR[G]}','$(U a1)','Gina (gina@x.it)','fede@x.it','cotitolare'),
 ('${AR[A]}','$(U a2)','Alex (alex@x.it)','gina@x.it','lettore'),
 ('${AR[C]}','$(U a6)','Marco (comm@x.it)','gina@x.it','lettore');
-- pareri: (progetto, autore, chiave) con chiavi uguali tra progetti
insert into public.pee_suggerimenti(archivio_id,user_id,autore_nome,percorso,testo) values
 ('${AR[U]}','$(U a3)','bea','P1','U-be-P1'),('${AR[U]}','$(U a4)','fede','P1','U-fe-P1'),('${AR[U]}','$(U a2)','alex','P1','U-al-P1'),
 ('${AR[G]}','$(U a6)','marco','P1','G-co-P1'),('${AR[G]}','$(U a6)','marco','PAG:cg1','G-co-PAG'),('${AR[G]}','$(U a5)','dario','P1','G-da-P1'),('${AR[G]}','$(U a4)','fede','P1','G-fe-P1'),
 ('${AR[A]}','$(U a1)','gina','P1','A-gi-P1'),('${AR[C]}','$(U a1)','gina','P1','C-gi-P1');
SQL
}
setup
FAIL=0; N=0
run(){ local who=$1 sql=$2 sub; sub=$(U ${UID_[$who]})
  $P 2>&1 <<SQL
begin; set local role authenticated; set local request.jwt.claim.sub='$sub'; set local request.jwt.claims='{"email":"${MAIL[$who]}"}';
$sql;
rollback;
SQL
}
# t: atteso si/no (righe restituite o errore)
t(){ local who=$1 exp=$2 desc=$3 sql=$4 out got; out=$(run $who "$sql"); N=$((N+1))
  if echo "$out" | grep -q "ERROR"; then got=no; elif [ -z "$(echo "$out" | tr -d '[:space:]')" ]; then got=no; else got=si; fi
  if [ $got != $exp ]; then FAIL=$((FAIL+1)); printf "✗✗✗ %-3s atteso=%s ottenuto=%s | %s | %s\n" $who $exp $got "$desc" "$(echo "$out" | head -2 | tr '\n' ' ' | cut -c1-100)"; fi; }
# c: conteggio atteso
c(){ local who=$1 exp=$2 desc=$3 sql=$4 out; out=$(run $who "$sql" | grep -E '^[0-9]+$' | head -1); N=$((N+1))
  if [ "$out" != "$exp" ]; then FAIL=$((FAIL+1)); printf "✗✗✗ %-3s atteso=%s ottenuto=%s | %s\n" $who $exp "${out:-?}" "$desc"; fi; }
has(){ case " $1 " in *" $2 "*) echo si;; *) echo no;; esac; }
PEOPLE="gi al be fe da co st"
echo "--- 1. progetti (pee_archivi): leggere, modificare, eliminare, creare"
declare -A SEL=( [U]="gi al be fe" [G]="gi co da fe" [P]="gi" [A]="al gi" [C]="co gi" [B]="be" )
declare -A UPD=( [U]="gi al" [G]="gi da fe" [P]="gi" [A]="al" [C]="co" [B]="be" )
for c in U G P A C B; do for w in $PEOPLE; do
  t $w $(has "${SEL[$c]}" $w) "legge $c" "select id from pee_archivi where id='${AR[$c]}'"
  t $w $(has "${UPD[$c]}" $w) "aggiunge dati a $c" "update pee_archivi set data=data || '{\"hack\":1}' where id='${AR[$c]}' returning id"
  t $w $( [ ${OWN[$c]} = $w ] && echo si || echo no ) "elimina $c" "delete from pee_archivi where id='${AR[$c]}' returning id"
  t $w $( [ ${OWN[$c]} = $w ] && echo si || echo no ) "cambia titolo/proprietà di $c" "update pee_archivi set titolo='x' where id='${AR[$c]}' and user_id=auth.uid() returning id"
done; done
for w in $PEOPLE; do
  t $w si "crea un progetto proprio" "insert into pee_archivi(user_id,anno,titolo,data,meta) values (auth.uid(),2027,'nuovo','{}','{}') returning id"
  for c in U G P A; do t $w no "crea un progetto intestato a un altro (come proprietario di $c)" "insert into pee_archivi(user_id,anno,titolo,data,meta) select user_id,2027,'forgia','{}','{}' from pee_archivi where id='${AR[$c]}' and not (user_id=auth.uid()) returning id"; done
  t $w no "sposta un progetto altrui a sé" "update pee_archivi set user_id=auth.uid() where id='${AR[U]}' and user_id<>auth.uid() returning id"
done
t al no "Alex (collaboratore) toglie una parte dai dati di U" "update pee_archivi set data='{\"hack\":1}' where id='${AR[U]}' returning id"
t da no "Dario (collaboratore) toglie una parte dai dati di G" "update pee_archivi set data='{\"hack\":1}' where id='${AR[G]}' returning id"
t fe si "Fede (co-titolare) può riscrivere i dati di G" "update pee_archivi set data='{\"hack\":1}' where id='${AR[G]}' returning id"
echo "--- 2. membri (pee_membri)"
declare -A MSEL=( [U]="gi" [G]="gi fe" [P]="gi" [A]="al" [C]="co" [B]="be" )   # chi vede TUTTI i membri (titolare e co-titolari)
declare -A MEMS=( [U]="al be fe" [G]="co da fe" [A]="gi" [C]="gi" )                  # chi vede almeno la propria riga
for c in U G A C; do for w in $PEOPLE; do
  t $w $( [ "$(has "${MSEL[$c]} ${MEMS[$c]}" $w)" = si ] && echo si || echo no ) "vede qualche riga dei membri di $c" "select id from pee_membri where archivio_id='${AR[$c]}'"
  n_exp=0; [ $(has "${MSEL[$c]}" $w) = si ] && n_exp=$(echo ${MEMS[$c]} | wc -w); [ $(has "${MSEL[$c]}" $w) = no ] && [ $(has "${MEMS[$c]}" $w) = si ] && n_exp=1
  c $w $n_exp "quante righe dei membri di $c vede" "select count(*) from pee_membri where archivio_id='${AR[$c]}'"
done; done
# invitare
declare -A INV=( [U]="gi" [G]="gi fe" [P]="gi" [A]="al" [C]="co" [B]="be" )
for c in U G P A C B; do for w in $PEOPLE; do
  t $w $(has "${INV[$c]}" $w) "invita come lettore su $c" "insert into pee_membri(archivio_id,owner_id,owner_email,email,ruolo) values ('${AR[$c]}',auth.uid(),'x','nuovo@x.it','lettore') returning id"
  t $w $( [ ${OWN[$c]} = $w ] && echo si || echo no ) "invita come co-titolare su $c" "insert into pee_membri(archivio_id,owner_id,owner_email,email,ruolo) values ('${AR[$c]}',auth.uid(),'x','cot2@x.it','cotitolare') returning id"
done; done
# cambiare ruolo, togliere
t gi si  "il titolare cambia il ruolo di Bea in U" "update pee_membri set ruolo='collaboratore' where archivio_id='${AR[U]}' and email='bea@x.it' returning id"
t fe si  "il co-titolare di G cambia Dario in lettore" "update pee_membri set ruolo='lettore' where archivio_id='${AR[G]}' and email='dario@x.it' returning id"
t fe no  "il co-titolare di G promuove Dario a co-titolare" "update pee_membri set ruolo='cotitolare' where archivio_id='${AR[G]}' and email='dario@x.it' returning id"
t fe no  "il co-titolare di G cambia il ruolo del Commissario in co-titolare" "update pee_membri set ruolo='cotitolare' where archivio_id='${AR[G]}' and email='comm@x.it' returning id"
t fe no  "Fede (solo lettrice in U) cambia un ruolo in U" "update pee_membri set ruolo='lettore' where archivio_id='${AR[U]}' and email='alex@x.it' returning id"
t be no  "Bea si fa co-titolare" "update pee_membri set ruolo='cotitolare' where archivio_id='${AR[U]}' and email='bea@x.it' returning id"
t al no  "Alex (collaboratore) si fa co-titolare" "update pee_membri set ruolo='cotitolare' where archivio_id='${AR[U]}' and email='alex@x.it' returning id"
t co no  "il Commissario si fa co-titolare" "update pee_membri set ruolo='cotitolare' where archivio_id='${AR[G]}' and email='comm@x.it' returning id"
t da no  "Dario (collaboratore) cambia il ruolo di Fede" "update pee_membri set ruolo='lettore' where archivio_id='${AR[G]}' and email='fede@x.it' returning id"
t st no  "l'estranea si dà un ruolo" "update pee_membri set ruolo='lettore' where archivio_id='${AR[U]}' returning id"
t gi si  "il titolare toglie Fede da G" "delete from pee_membri where archivio_id='${AR[G]}' and email='fede@x.it' returning id"
t fe si  "Fede (co-titolare) toglie il Commissario da G" "delete from pee_membri where archivio_id='${AR[G]}' and email='comm@x.it' returning id"
t be si  "Bea esce da U" "delete from pee_membri where archivio_id='${AR[U]}' and email='bea@x.it' returning id"
t be no  "Bea toglie Alex da U" "delete from pee_membri where archivio_id='${AR[U]}' and email='alex@x.it' returning id"
t co si  "il Commissario esce da G" "delete from pee_membri where archivio_id='${AR[G]}' and email='comm@x.it' returning id"
t da no  "Dario toglie Fede da G" "delete from pee_membri where archivio_id='${AR[G]}' and email='fede@x.it' returning id"
t st no  "l'estranea toglie qualcuno" "delete from pee_membri where archivio_id='${AR[U]}' returning id"
t gi si  "Gina (lettrice in A) esce da A" "delete from pee_membri where archivio_id='${AR[A]}' and email='gina@x.it' returning id"
t gi no  "Gina (lettrice in A) invita qualcuno in A" "insert into pee_membri(archivio_id,owner_id,owner_email,email,ruolo) values ('${AR[A]}',auth.uid(),'x','nuovo@x.it','lettore') returning id"
echo "--- 3. pareri e suggerimenti (pee_suggerimenti)"
declare -A SGV=( [U]="gi" [G]="gi fe" [A]="al" [C]="co" [P]="gi" [B]="be" )     # chi legge tutti i pareri di un progetto
declare -A SGN=( [U]=3 [G]=4 [A]=1 [C]=1 [P]=0 [B]=0 )
declare -A SGA=( [U]="be fe al" [G]="co da fe" [A]="gi" [C]="gi" )                # autori (una riga ciascuno, tranne co ×2 in G)
for c in U G A C P B; do for w in $PEOPLE; do
  if [ $(has "${SGV[$c]}" $w) = si ]; then e=${SGN[$c]}; elif [ $(has "${SGA[$c]}" $w) = si ]; then e=1; else e=0; fi
  [ $c = G ] && [ $w = co ] && e=2
  c $w $e "righe di pareri visibili su $c" "select count(*) from pee_suggerimenti where archivio_id='${AR[$c]}'"
done; done
# stessa chiave P1 in più progetti: ognuno vede solo ciò che gli spetta
c fe 4 "Fede, chiave P1 in tutti i progetti (U: solo la sua; G: tutte e 3)" "select count(*) from pee_suggerimenti where percorso='P1'"
c gi 6 "Gina titolare, chiave P1 in U e G: 3 + 3" "select count(*) from pee_suggerimenti where percorso='P1' and archivio_id in ('${AR[U]}','${AR[G]}')"
c co 2 "il Commissario, chiave P1 e PAG: solo i suoi" "select count(*) from pee_suggerimenti where archivio_id='${AR[G]}'"
c st 0 "l'estranea non legge nulla" "select count(*) from pee_suggerimenti"
c al 2 "Alex: la sua riga in U e la riga di Gina in A (titolare)" "select count(*) from pee_suggerimenti"
# scrivere: chi è nel progetto (o titolare), mai con l'autore falso
ins(){ echo "insert into pee_suggerimenti(archivio_id,user_id,autore_nome,percorso,testo) values ('${AR[$1]}',auth.uid(),'x','P1','nuovo') returning id"; }
declare -A SGW=( [U]="al be fe" [G]="co da fe" [A]="gi" [C]="gi" [P]="" [B]="" )   # solo chi è invitato: la titolare non scrive pareri sul proprio progetto
for c in U G A C P B; do for w in $PEOPLE; do t $w $(has "${SGW[$c]}" $w) "scrive un parere su $c" "$(ins $c)"; done; done
for w in $PEOPLE; do t $w no "scrive a nome di un altro" "insert into pee_suggerimenti(archivio_id,user_id,autore_nome,percorso,testo) values ('${AR[U]}','$(U a1)','x','P1','forgia') returning id"; done
# rispondere: titolare o co-titolare, mai chi scrive, mai il Commissario
ROW(){ echo "(select id from pee_suggerimenti where archivio_id='${AR[$1]}' and testo='$2')"; }
for w in $PEOPLE; do
  t $w $(has "gi" $w) "risponde a Bea in U" "update pee_suggerimenti set risposta='r', risposta_da='x' where id=$(ROW U U-be-P1) returning id"
  t $w $(has "gi fe" $w) "risponde al Commissario in G" "update pee_suggerimenti set risposta='r', risposta_da='x' where id=$(ROW G G-co-P1) returning id"
  t $w $(has "al" $w) "risponde a Gina in A (titolare Alex)" "update pee_suggerimenti set risposta='r', risposta_da='x' where id=$(ROW A A-gi-P1) returning id"
done
t be no "Bea risponde a sé stessa" "update pee_suggerimenti set risposta='r', risposta_da='x' where id=$(ROW U U-be-P1) and user_id=auth.uid() returning id"
t co no "il Commissario risponde a sé stesso" "update pee_suggerimenti set risposta='r', risposta_da='x' where id=$(ROW G G-co-P1) and user_id=auth.uid() returning id"
# eliminare: l'autore (se ancora membro) o il titolare
for w in $PEOPLE; do
  t $w $(has "gi be" $w | sed 's/^no$/no/') "elimina il parere di Bea in U" "delete from pee_suggerimenti where id=$(ROW U U-be-P1) returning id"
  t $w $(has "gi co" $w) "elimina il parere del Commissario in G" "delete from pee_suggerimenti where id=$(ROW G G-co-P1) returning id"
done
echo "--- 4. dopo la revoca"
$P >/dev/null <<SQL
delete from pee_membri where archivio_id='${AR[G]}' and email='comm@x.it';
SQL
c co 0 "il Commissario revocato non legge più i suoi pareri" "select count(*) from pee_suggerimenti where archivio_id='${AR[G]}'"
t co no "il Commissario revocato non legge il progetto" "select id from pee_archivi where id='${AR[G]}'"
t co no "il Commissario revocato non scrive più pareri" "$(ins G)"
c gi 4 "la titolare conserva i pareri del Commissario revocato (3 di Fede/Dario/Marco in G + 1 PAG = 4)" "select count(*) from pee_suggerimenti where archivio_id='${AR[G]}'"
t co si "il progetto proprio C del Commissario resta suo" "select id from pee_archivi where id='${AR[C]}' and user_id=auth.uid()"
echo "--- $N prove, $FAIL difformi"
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
