# Sorgenti dello strumento «Crea le tue attività osservative»

Nell'anteprima (`anteprima/index.html`) lo strumento è già dentro il file: questi sono i sorgenti per rifarlo o cambiarlo.

- `oss_native.js`, `oss_native.css`: pannello nella pagina (elenco, ruoli, «Segna come svolta», suggerimenti, avvisi in «Per te»).
- `build_mod.py`: costruisce il percorso guidato isolato (un documento HTML completo, poi in base64) da `shell3.html` (stile), `data.js`, `cooc.js`, `stem_it.js`, `indice.js`, `motore.js`, `app3_const.js`, `orienta.js` e `wiz_part.js` (parte del prototipo `app3.js` dal «Percorso guidato» in poi).
- `integra.py`: inserisce nel file dell'anteprima pannello, stile, documento e i piccoli ritocchi (segno «osservato · n», «Per te», blocco in modifica per chi collabora). Si può rilanciare: sostituisce i blocchi già presenti.
- I percorsi dei file negli script sono quelli della sessione di lavoro (`/home/claude/work/proto/...`): adattarli.
- Test: `test/t_oss.mjs`, `test/t_oss2.mjs`.
- Raccolta anonima delle radici delle parole: `supabase_aggiornamento_12novembre.sql` (da eseguire una volta su Supabase).
