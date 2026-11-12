# Sorgenti dello strumento «Crea le tue attività osservative»

Nell'anteprima (`anteprima/index.html`) lo strumento è già dentro il file: questi sono i sorgenti per rifarlo o cambiarlo.

- `oss_native.js`, `oss_native.css`: pannello nella pagina (elenco, ruoli, «Segna come svolta», suggerimenti, avvisi in «Per te»), ricerca (occasioni e attività osservative dentro «Cerca un'attività», filtri «Attività educative / Occasioni osservative»), riuso (percorso guidato già compilato) e proposta all'archivio nazionale.
- `build_mod.py`: costruisce il percorso guidato isolato (un documento HTML completo, poi in base64) da `shell3.html` (stile), `data.js`, `cooc.js`, `stem_it.js`, `indice.js`, `motore.js`, `app3_const.js`, `orienta.js` e `wiz_part.js` (parte del prototipo `app3.js` dal «Percorso guidato» in poi).
- `integra.py`: inserisce nel file dell'anteprima pannello, stile, documento e i piccoli ritocchi (segno «osservato · n», «Per te», blocco in modifica per chi collabora, ricerca e archivio nazionale). Il riquadro KOS (`kosPathHTML`, barre per Ambito, scadenza solo al primo ciclo) è modificato direttamente in `anteprima/index.html`. Si può rilanciare: sostituisce i blocchi già presenti.
- I percorsi dei file negli script sono quelli della sessione di lavoro (`/home/claude/work/proto/...`): adattarli.
- Test: `test/t_oss.mjs`, `t_oss2.mjs`, `t_oss3.mjs` (12 profili), `t_oss4.mjs` (riquadro KOS, ricerca, riuso), `t_oss5.mjs` (archivio nazionale), `t_oss6.mjs` (Word, JSON, ricarica del file), `t_oss7.mjs` (percorso guidato: scorrimento, pannelli, strumenti per macro tema), `t_oss8.mjs` (campi salvati, modifica, JSON esporta/importa, Word della PE, filtri, lente), `t_oss9.mjs` (focus nella griglia, focus del KOS, riepilogo in fondo).
- Raccolta anonima delle radici delle parole: `supabase_aggiornamento_12novembre.sql` (da eseguire una volta su Supabase).
- Archivio nazionale per le attività osservative: `supabase_aggiornamento_12novembre_archivio_osservative.sql` (da eseguire una volta, dopo `supabase_archivio_nazionale.sql`: aggiunge la colonna `genere`).
