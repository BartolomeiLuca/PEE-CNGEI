#!/bin/bash
# copia di prova del sito: APP_BUILD='dev' (niente ricarica automatica)
rm -rf /tmp/site_sh; mkdir -p /tmp/site_sh/anteprima
cp /home/claude/pee-cngei/anteprima/index.html /tmp/site_sh/anteprima/index.html
sed -i "s/const APP_BUILD='[^']*';/const APP_BUILD='dev';/" /tmp/site_sh/anteprima/index.html
for f in favicon-16.png favicon-32.png favicon-48.png icon-192.png icon-512.png manifest.webmanifest; do cp /home/claude/pee-cngei/$f /tmp/site_sh/ 2>/dev/null; done
cp -r /home/claude/pee-cngei/video /tmp/site_sh/ 2>/dev/null; cp -r /home/claude/pee-cngei/circolare /tmp/site_sh/ 2>/dev/null
cp -r /home/claude/pee-cngei/anteprima/circolare /tmp/site_sh/anteprima/; cp /home/claude/pee-cngei/anteprima/icon-*.png /home/claude/pee-cngei/anteprima/manifest.webmanifest /tmp/site_sh/anteprima/ 2>/dev/null
