'use strict';
// The Business page's live team workspace: one shared #general where people and agents talk. @name an agent and it
// answers in the thread; anything that would send, book or buy waits for a person. Posts are shared through the
// artifact's database, agents answer through Claude. Without either, it still works for the person viewing.
(() => {
  const agents = {
    dispatch: {name: 'Dispatch', shape: 'Soft', hue: 0.58, job: 'scheduling: who is free, booking jobs, routing techs'},
    quotes: {name: 'Quotes', shape: 'Round', hue: 0.12, job: 'pricing and estimates, from the price book only'},
    parts: {name: 'Parts', shape: 'Hexagon', hue: 0.33, job: 'parts on trucks and in the warehouse, and ordering from suppliers'}
  };
  const brain = [
    'Techs: Ana Ruiz (water heaters; free Tuesday 9 AM–12 PM; drives Truck 2), Marco Lee (drains; booked all day Tuesday), Dee Park (HVAC; free Tuesday after 1 PM).',
    'Job 4182: Linda Shaw, 14 Elm St. Water heater not heating. Last visit in March: replaced the thermostat. Prefers texts.',
    'Job 4190: 88 Oak Ave. Slow kitchen drain. Not scheduled yet.',
    'Price book: 50-gal gas water heater replacement $1,709 flat (unit $899, labor $640, haul-away $75, permit $95). Heating element replacement $289. Drain clearing $195. Discounts over 10% need the owner.',
    'Parts: Truck 2 carries 3 heating elements and 2 thermostats. Warehouse has two 50-gal Rheem gas heaters. Supplier Ferguson delivers next day.'
  ];
  const starters = ['@Dispatch who can take job 4182 on Tuesday morning?', '@Quotes what would a new 50-gal water heater cost Linda?', '@Dispatch book Ana for job 4182 Tuesday at 9 and text Linda'];
  const MAX_HOPS = 2, WORKING_MS = 120000;

  const esc = v => String(v).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const mentioned = textValue => [...new Set([...textValue.matchAll(/@(dispatch|quotes|parts)\b/gi)].map(m => m[1].toLowerCase()))];
  // Asks for something that leaves the room or changes a record (the app's TeamWorkspace.wantsAction).
  const wantsAction = t => /\b(send|text (him|her|them|it|linda|ana)|email|book|buy|order|pay|refund|cancel|delete|post|(re)?schedule (him|her|them|it|a|an)|assign|invoice|charge)\b(?! me\b)/i.test(t);
  const APPROVE = 'APPROVE:';

  let db = null, sample = null, user = null, me = {id: null, name: 'You'}, owner = false;
  let posts = [], names = {}, replyTo = null, local = false, mount = null, problem = '';

  const blob = a => window.reveredBlob ? window.reveredBlob(a.shape, a.hue) : '';
  function avatar(p) {
    if (p.kind === 'agent' && agents[p.agent]) return `<span class="tl-avatar agent">${blob(agents[p.agent])}</span>`;
    const n = nameOf(p);
    return `<span class="tl-avatar person">${esc(n.slice(0, 1).toUpperCase())}</span>`;
  }
  const nameOf = p => p.kind === 'agent' ? (agents[p.agent]?.name || 'Agent') : (p.author && p.author === me.id ? (me.name || 'You') : (names[p.author] || 'Teammate'));
  const time = at => new Date(at).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  function body(p) {
    const lines = String(p.text || '').split('\n').filter(l => !l.trim().startsWith(APPROVE));
    return esc(lines.join('\n').trim()).replace(/@(Dispatch|Quotes|Parts)\b/gi, m => `<b class="tl-at">${m}</b>`).replace(/\n/g, '<br>');
  }
  function approvalCard(p) {
    if (!p.approval) return '';
    const action = (String(p.text).split('\n').find(l => l.trim().startsWith(APPROVE)) || '').trim().slice(APPROVE.length).trim();
    const settled = p.approval !== 'pending';
    return `<div class="tl-approve"><span class="tl-approve-label">Needs approval</span><p>${esc(action)}</p>${settled
      ? `<span class="tl-settled ${p.approval.startsWith('Approved') ? 'yes' : 'no'}">${esc(p.approval)}</span>`
      : `<div class="tl-approve-actions"><button data-settle="${esc(p.id)}" data-ok="1">Approve</button><button data-settle="${esc(p.id)}" data-ok="0" class="quiet">Decline</button></div>`}</div>`;
  }
  function row(p) {
    const working = p.status === 'working' && Date.now() - p.at < WORKING_MS;
    return `<div class="tl-post${p.kind === 'agent' ? ' is-agent' : ''}">${avatar(p)}<div class="tl-main">
      <div class="tl-meta"><b>${esc(nameOf(p))}</b>${p.kind === 'agent' ? '<span class="tl-badge">Agent</span>' : ''}<time>${time(p.at)}</time></div>
      ${working ? '<p class="tl-working"><i></i><i></i><i></i> Working on it</p>' : `<p class="tl-text">${body(p)}</p>${approvalCard(p)}`}
    </div></div>`;
  }

  function render() {
    if (!mount || !mount.isConnected) return;
    const list = mount.querySelector('.tl-list');
    const top = posts.filter(p => !p.thread);
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
    list.innerHTML = top.length ? top.map(t => `<div class="tl-thread">${row(t)}${posts.filter(p => p.thread === t.id).map(p => `<div class="tl-reply">${row(p)}</div>`).join('')}
        <button class="tl-reply-btn" data-reply="${esc(t.id)}">Reply in thread</button></div>`).join('')
      : `<div class="tl-empty"><p>Nothing in #general yet. Try one:</p>${starters.map(s => `<button class="tl-starter">${esc(s)}</button>`).join('')}</div>`;
    if (atBottom || !list.dataset.seen) { list.scrollTop = list.scrollHeight; list.dataset.seen = '1'; }
    const reply = mount.querySelector('.tl-replying');
    const target = replyTo && posts.find(p => p.id === replyTo);
    reply.hidden = !target;
    if (target) reply.querySelector('span').textContent = 'Replying to ' + nameOf(target);
    mount.querySelector('.tl-status').textContent = problem || (local ? 'Only you see this channel in this view.' : 'Live: everyone with this page sees the same channel.');
    mount.querySelector('.tl-clear').hidden = !owner || !posts.length || local;
  }

  // Storage: the shared database when there is one, else this page only.
  async function save(p) {
    if (local) { const i = posts.findIndex(x => x.id === p.id); if (i < 0) posts.push(p); else posts[i] = p; render(); return; }
    const {id, ...data} = p;
    await db.collection('posts').doc(id).set(data);
  }
  async function patch(id, data) {
    if (local) { Object.assign(posts.find(p => p.id === id) || {}, data); render(); return; }
    await db.collection('posts').doc(id).update(data);
  }
  const newID = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  async function post(textValue) {
    textValue = textValue.trim().slice(0, 1500);
    if (!textValue) return;
    const p = {id: newID(), kind: 'person', author: me.id, text: textValue, thread: replyTo, hop: 0, at: Date.now()};
    replyTo = null;
    try { await save(p); } catch (e) { problem = 'That post didn’t go through: ' + (e.message || e.code); render(); return; }
    for (const key of mentioned(textValue)) answer(key, p, p);
  }

  async function answer(key, ask, origin) {
    const agent = agents[key];
    const reply = {id: newID(), kind: 'agent', agent: key, text: '', thread: ask.thread || ask.id, hop: (ask.hop || 0) + 1, at: Date.now(), status: 'working', asker: origin.author};
    try { await save(reply); } catch { return; }
    let textValue;
    if (!sample) textValue = 'Agents answer when you open this page signed in to Claude.';
    else {
      const thread = reply.thread;
      const history = posts.filter(p => p.status !== 'working' && (!p.thread || p.thread === thread || p.id === thread)).slice(-14)
        .map(p => `${nameOf(p)}: ${String(p.text).slice(0, 500)}`).join('\n');
      const prompt = `You are ${agent.name}, an AI agent in the team workspace of Northside Plumbing & Heating, a sample company in a live demo of AMI for Business by Revered Labs. Your job: ${agent.job}.

Company brain. Use only these facts; never invent jobs, people, times or prices:
${brain.map(f => '- ' + f).join('\n')}

Other agents in the channel: ${Object.values(agents).filter(a => a !== agent).map(a => `@${a.name} (${a.job})`).join(', ')}. If part of the task is clearly another agent's job, hand it over in one line by @naming them.

Conversation in #general, oldest first:
${history || '(empty)'}

${ask.kind === 'agent' ? agents[ask.agent].name : nameOf(ask)} just asked you: "${ask.text}"

Reply in 1 to 4 short lines of plain text: no markdown, no emoji, no headings. Friendly and professional, like a sharp coworker. If the task would send a message, book, buy, order or change a record, do not claim it is done: draft what you would do, then end with one line starting with "${APPROVE}" that states the exact action for a person to approve.`;
      try { textValue = (await sample(prompt, {cache: false})).text.trim(); }
      catch (e) { textValue = e.code === 'rate_limited' ? 'I’m being asked a lot right now. Try me again in a minute.' : 'I couldn’t answer just now (' + (e.code || 'error') + ').'; }
    }
    textValue = textValue.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');
    let pending = textValue.split('\n').some(l => l.trim().startsWith(APPROVE));
    if (!pending && ask.kind === 'person' && wantsAction(ask.text) && sample) {
      textValue += `\n${APPROVE} ` + ask.text.replace(/@\S+\s?/g, '').trim().slice(0, 160); pending = true;
    }
    try { await patch(reply.id, {text: textValue, status: 'done', approval: pending ? 'pending' : null, at: Date.now()}); } catch { return; }
    if (reply.hop < MAX_HOPS) for (const next of mentioned(textValue)) if (next !== key) answer(next, {...reply, text: textValue}, origin);
  }

  async function settle(id, ok) {
    const p = posts.find(x => x.id === id);
    if (!p || p.approval !== 'pending') return;
    try { await patch(id, {approval: (ok ? 'Approved by ' : 'Declined by ') + (me.name || 'a teammate')}); }
    catch (e) { problem = 'Only teammates who can edit this page can approve.'; render(); }
  }
  async function clearAll() {
    if (!owner || local) return;
    for (const p of [...posts]) { try { await db.collection('posts').doc(p.id).delete(); } catch {} }
  }

  function shell(el) {
    el.innerHTML = `<div class="tl-copy"><p class="label">Live demo</p><h2>Your team and its agents, in one channel.</h2>
        <p>@name an agent and it does the task in the thread, with your company’s context. Anything that sends, books or buys waits for a person to approve.</p>
        <ul class="tl-agents">${Object.values(agents).map(a => `<li>${blob(a)}<span><b>@${a.name}</b><small>${esc(a.job)}</small></span></li>`).join('')}</ul>
        <p class="tl-fine">Northside Plumbing &amp; Heating is a sample company. In this demo the agents run on a hosted model; AMI for Business runs on hardware your company controls.</p></div>
      <div class="tl-panel" aria-label="Team workspace, #general">
        <div class="tl-head"><span># general</span><span class="tl-status"></span><button class="tl-clear" hidden>Clear</button></div>
        <div class="tl-list" aria-live="polite"></div>
        <div class="tl-replying" hidden><span></span><button>Cancel</button></div>
        <div class="tl-suggest" hidden></div>
        <form class="tl-composer"><input aria-label="Message #general" placeholder="Message #general, @ an agent" autocomplete="off"><button aria-label="Send">↑</button></form>
      </div>`;
    const input = el.querySelector('input'), suggest = el.querySelector('.tl-suggest');
    el.querySelector('form').onsubmit = e => { e.preventDefault(); const v = input.value; input.value = ''; suggest.hidden = true; post(v); };
    input.oninput = () => {
      const word = input.value.split(' ').pop();
      const hits = word.startsWith('@') ? Object.values(agents).filter(a => a.name.toLowerCase().startsWith(word.slice(1).toLowerCase())) : [];
      suggest.hidden = !hits.length;
      suggest.innerHTML = hits.map(a => `<button type="button" data-name="${a.name}">${blob(a)}@${a.name}</button>`).join('');
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.name) { const words = input.value.split(' '); words[words.length - 1] = '@' + b.dataset.name; input.value = words.join(' ') + ' '; suggest.hidden = true; input.focus(); }
      else if (b.classList.contains('tl-starter')) { input.value = b.textContent; input.focus(); }
      else if (b.dataset.reply) { replyTo = b.dataset.reply; render(); input.focus(); }
      else if (b.parentElement.classList.contains('tl-replying')) { replyTo = null; render(); }
      else if (b.dataset.settle) settle(b.dataset.settle, b.dataset.ok === '1');
      else if (b.classList.contains('tl-clear')) clearAll();
    });
  }

  let started = false;
  async function start() {
    if (started) return; started = true;
    const claude = window.claude;
    const use = name => claude?.use ? claude.use(name).catch(() => null) : Promise.resolve(null);
    [db, sample, user] = await Promise.all([use('db'), use('sample'), use('user')]);
    if (user) {
      try { const v = await user.me(); me = {id: v.id || (await user.id()), name: v.name || 'You'}; owner = !!v.isOwner; } catch {}
    }
    local = !db;
    if (!local) {
      db.collection('posts').onSnapshot(snap => {
        posts = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => a.at - b.at);
        const ids = [...new Set(posts.filter(p => p.kind === 'person' && p.author && !names[p.author]).map(p => p.author))];
        if (ids.length && user?.profiles) user.profiles(ids).then(ps => { for (const id of ids) names[id] = ps[id]?.name || 'Teammate'; render(); }).catch(() => {});
        problem = ''; render();
      }, () => { problem = 'The shared channel isn’t reachable right now.'; render(); });
    }
    render();
  }

  window.mountTeamLive = el => { mount = el; shell(el); render(); start(); };
  setInterval(() => { if (posts.some(p => p.status === 'working')) render(); }, 5000);
})();
