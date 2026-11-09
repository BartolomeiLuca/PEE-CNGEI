#!/bin/bash
# uso: runall.sh <site> <browser> <outdir> <portbase> [lista test]
S=$1; B=$2; O=$3; P=$4; shift 4; L="${@:-$(ls t_*.mjs)}"; mkdir -p $O
export PLAYWRIGHT_BROWSERS_PATH=/home/claude/pw
i=0; for t in $L; do echo "$((P+i)) $t"; i=$((i+1)); done | xargs -P ${PAR:-5} -L1 bash -c 'SITE='$S' PORT=$0 timeout 300 node $1 '$B' > '$O'/$1.log 2>&1; echo $? > '$O'/$1.rc'
