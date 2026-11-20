#!/bin/bash
# uso: runall.sh <site> <browser> <outdir> <portbase> [lista test]
# i test lunghi (collaudo ruoli × dispositivi, utenti a caso, ruoli) hanno più tempo
S=$1; B=$2; O=$3; P=$4; shift 4; L="${@:-$(grep -L "= PROFILES\[name\]" t_*.mjs)}"   # i test «per profilo di dispositivo» (t_oss3…) si lanciano a parte, uno per profilo; mkdir -p $O
export PLAYWRIGHT_BROWSERS_PATH=${PW:-/home/claude/pw}
export GUSCIO0=${GUSCIO0:-1}   # i test della versione principale (radice) parlano dell’interfaccia vecchia: l’harness la apre con ?guscio=0
i=0; for t in $L; do echo "$((P+i)) $t"; i=$((i+1)); done | xargs -P ${PAR:-5} -L1 bash -c 'case "$1" in t_coll.mjs) TO=2400;; t_monkey.mjs|t_roles.mjs|t_new.mjs|t_usc.mjs|t_g14.mjs|t_tip.mjs) TO=700;; t_isol.mjs) TO=1500;; *) TO=300;; esac; SITE='$S' PORT=$0 timeout $TO node $1 '$B' > '$O'/$1.log 2>&1; echo $? > '$O'/$1.rc'

# secondo giro: ogni test fallito sotto carico viene rilanciato da solo (senza altri test in parallelo)
# → «rosso vero» se fallisce anche da solo, «instabile sotto carico» se da solo passa. Disattiva con RETRY=0.
# Per girare tutto senza carico basta PAR=1.
if [ "${RETRY:-1}" = "1" ]; then
  VERI=""; INST=""
  for rc in $O/*.rc; do
    t=$(basename $rc .rc); [ "$(cat $rc)" = "0" ] && continue
    case "$t" in t_coll.mjs) TO=2400;; t_monkey.mjs|t_roles.mjs|t_new.mjs|t_usc.mjs|t_g14.mjs|t_tip.mjs) TO=700;; t_isol.mjs) TO=1500;; *) TO=300;; esac
    SITE=$S PORT=$((P+90)) timeout $TO node $t $B > $O/$t.alone.log 2>&1; r=$?; echo $r > $O/$t.alone.rc
    if [ $r = 0 ]; then INST="$INST $t"; else VERI="$VERI $t"; fi
  done
  echo "ROSSI VERI (falliscono anche da soli):${VERI:- nessuno}"
  echo "INSTABILI SOTTO CARICO (da soli passano):${INST:- nessuno}"
fi
