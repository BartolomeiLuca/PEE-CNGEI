#!/bin/bash
# uso: runall.sh <site> <browser> <outdir> <portbase> [lista test]
# i test lunghi (collaudo ruoli × dispositivi, utenti a caso, ruoli) hanno più tempo
S=$1; B=$2; O=$3; P=$4; shift 4; L="${@:-$(ls t_*.mjs)}"; mkdir -p $O
export PLAYWRIGHT_BROWSERS_PATH=/home/claude/pw
i=0; for t in $L; do echo "$((P+i)) $t"; i=$((i+1)); done | xargs -P ${PAR:-5} -L1 bash -c 'case "$1" in t_coll.mjs) TO=2400;; t_monkey.mjs|t_roles.mjs|t_new.mjs|t_usc.mjs|t_g14.mjs|t_tip.mjs) TO=700;; *) TO=300;; esac; SITE='$S' PORT=$0 timeout $TO node $1 '$B' > '$O'/$1.log 2>&1; echo $? > '$O'/$1.rc'
