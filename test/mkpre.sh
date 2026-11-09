#!/bin/bash
# copia di prova dell'anteprima come sito principale (per i test con SITE)
R=/home/claude/repo; D=/tmp/site_pre; rm -rf $D; mkdir -p $D
sed "s/const APP_BUILD='[^']*';/const APP_BUILD='dev';/" $R/anteprima/index.html > $D/index.html
cp -r $R/anteprima/circolare $D/ 2>/dev/null; cp -r $R/video $D/ 2>/dev/null
for f in favicon-16.png favicon-32.png favicon-48.png icon-192.png icon-512.png manifest.webmanifest; do cp $R/$f $D/ 2>/dev/null; done
