// Finto supabase-js (solo per i test): ogni operazione va al processo Node tramite window.__sb
(function(){
  const SKEY = 'fake_sb_session';
  const getS = () => { try{ return JSON.parse(localStorage.getItem(SKEY)||'null'); }catch(e){ return null; } };
  const setS = s => { try{ s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); }catch(e){} };
  const call = async req => { const s = getS(); return await window.__sb(Object.assign({uid: s && s.user && s.user.id}, req)); };
  const cbs = [];
  const fire = (ev, s) => cbs.forEach(cb => { try{ cb(ev, s); }catch(e){ console.error(e); } });
  window.__sbChannels = [];
  window.__sbEmit = function(msg){
    window.__sbChannels.forEach(ch => {
      if(msg.kind === 'pg'){
        ch.handlers.filter(h => h.type === 'postgres_changes').forEach(h => {
          const f = h.filter || {}; if(f.table && f.table !== msg.table) return;
          if(f.event && f.event !== '*' && f.event !== msg.event) return;
          if(f.filter){ const m = /^(\w+)=eq\.(.*)$/.exec(f.filter); if(m && String((msg.row||{})[m[1]]) !== m[2]) return; }
          try{ h.cb({eventType: msg.event, new: msg.row, old: msg.old||{}}); }catch(e){ console.error(e); }
        });
      } else if(msg.kind === 'presence' && msg.channel === ch.name){
        ch._state = msg.state;
        ch.handlers.filter(h => h.type === 'presence').forEach(h => { try{ h.cb(); }catch(e){} });
      }
    });
  };
  function Q(table){
    const q = {table, filters:[], op:'select', cols:'*', vals:null, ret:null, single:null, order:null, limit:null};
    const api = {
      select(c){ if(q.op === 'select') q.cols = c||'*'; else q.ret = c||'*'; return api; },
      insert(v){ q.op = 'insert'; q.vals = v; return api; },
      update(v){ q.op = 'update'; q.vals = v; return api; },
      delete(){ q.op = 'delete'; return api; },
      eq(c,v){ q.filters.push(['eq',c,v]); return api; },
      neq(c,v){ q.filters.push(['neq',c,v]); return api; },
      in(c,v){ q.filters.push(['in',c,v]); return api; },
      is(c,v){ q.filters.push(['is',c,v]); return api; },
      not(c,o,v){ q.filters.push(['not',c,[o,v]]); return api; },
      order(c,o){ q.order = [c, !(o && o.ascending === false)]; return api; },
      limit(n){ q.limit = n; return api; },
      maybeSingle(){ q.single = 'maybe'; return api; },
      single(){ q.single = 'one'; return api; },
      then(res, rej){ return call({kind:'query', q}).then(res, rej); }
    };
    return api;
  }
  const client = {
    auth: {
      async getSession(){
        // link della mail: #access_token=<id>&type=recovery (come fa supabase-js con detectSessionInUrl)
        const m = /access_token=([^&]+).*type=recovery/.exec(location.hash || '');
        if(m){ const r = await window.__sb({kind:'me', uid:m[1]}); if(r && r.user){ const s0 = {user:r.user, access_token:'t'}; setS(s0); history.replaceState(null, '', location.pathname); setTimeout(() => { fire('SIGNED_IN', s0); fire('PASSWORD_RECOVERY', s0); }, 0); return {data:{session:s0}}; } }
        const s = getS(); if(s){ const r = await call({kind:'me'}); if(r && r.user){ s.user = r.user; setS(s); return {data:{session:s}}; } setS(null); } return {data:{session:null}}; },
      onAuthStateChange(cb){ cbs.push(cb); return {data:{subscription:{unsubscribe(){}}}}; },
      async signInWithPassword(c){ const r = await window.__sb({kind:'login', email:c.email, password:c.password}); if(r.error) return {data:{}, error:r.error}; const s = {user:r.user, access_token:'t'}; setS(s); fire('SIGNED_IN', s); return {data:{user:r.user, session:s}, error:null}; },
      async signUp(c){ const r = await window.__sb({kind:'signup', email:c.email, password:c.password, data:(c.options||{}).data||{}}); if(r.error) return {data:{}, error:r.error}; const s = {user:r.user, access_token:'t'}; setS(s); fire('SIGNED_IN', s); return {data:{user:r.user, session:s}, error:null}; },
      async resetPasswordForEmail(email, o){ const r = await window.__sb({kind:'reset', email, redirectTo:(o||{}).redirectTo}); return {data:{}, error:r.error||null}; },
      async updateUser(v, o){ const r = await call({kind:'updateUser', v, o}); if(r.error) return {data:{}, error:r.error}; const s = getS(); if(s){ s.user = r.user; setS(s); } fire('USER_UPDATED', s); return {data:{user:r.user}, error:null}; },
      async signOut(){ setS(null); fire('SIGNED_OUT', null); return {error:null}; }
    },
    from: Q,
    rpc(name, args){ return call({kind:'rpc', name, args}); },
    channel(name, opts){
      const ch = {name, handlers:[], _state:{}, key: opts && opts.config && opts.config.presence && opts.config.presence.key,
        on(type, filter, cb){ if(typeof filter === 'function'){ cb = filter; filter = {}; } ch.handlers.push({type, filter, cb}); return ch; },
        subscribe(cb){ window.__sbChannels.push(ch); setTimeout(() => cb && cb('SUBSCRIBED'), 10); return ch; },
        presenceState(){ return ch._state; },
        track(p){ call({kind:'track', channel:name, key:ch.key, payload:p}); return Promise.resolve('ok'); },
        unsubscribe(){} };
      return ch;
    },
    removeChannel(ch){ window.__sbChannels = window.__sbChannels.filter(c => c !== ch); }
  };
  window.supabase = {createClient(){ return client; }};
})();
