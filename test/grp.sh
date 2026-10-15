#!/bin/bash
eng=$1; shift
for t in "$@"; do
  unset SITE; if [ $t = t_upd ]; then mkdir -p /tmp/site_upd; sed "s/const APP_BUILD='[^']*';/const APP_BUILD='b1';/" /home/claude/pee-cngei/index.html > /tmp/site_upd/index.html; export SITE=/tmp/site_upd; fi
  out=$(timeout 560 node $t.mjs $eng 2>&1); r=$(echo "$out" | grep -E "ok, .* falliti" | tail -1); f=$(echo "$out" | grep -c "✗")
  echo "$eng $t: ${r:-(nessun riepilogo)} ✗=$f"
done
