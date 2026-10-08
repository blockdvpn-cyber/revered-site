'use strict';
// Personal, Business and Student are AMI's pages; Dev is the model library. Each tab is a link (#personal…),
// so it can be shared and survives a reload. What works today is listed apart from what's next.
(() => {
  const icon = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
    soon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/></svg>',
    people: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/><circle cx="16.5" cy="8" r="2.6"/><path d="M15.5 13.6c2.3 0 4.3 1.4 5 4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>'
  };

  // AMI's own companions, as the app draws them (AgentSilhouette + two capsule eyes that blink), in a 100-unit box.
  function shapePath(style) {
    const poly = points => 'M' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
    switch (style) {
      case 'Round': return '<circle cx="50" cy="50" r="50"/>';
      case 'Capsule': return '<rect x="0" y="19" width="100" height="62" rx="31"/>';
      case 'Boxy': return '<rect x="0" y="0" width="100" height="100" rx="20"/>';
      case 'Hexagon': case 'Triangle': {
        const n = style === 'Hexagon' ? 6 : 3;
        return `<path d="${poly([...Array(n)].map((_, i) => { const a = i * 2 * Math.PI / n - Math.PI / 2; return [50 + Math.cos(a) * 50, 50 + Math.sin(a) * 50]; }))}"/>`;
      }
      case 'Droplet': return '<path d="M50 0C130 50 100 100 50 100C0 100 -30 50 50 0Z"/>';
      case 'Cloud': return `<path d="${poly([...Array(120)].map((_, i) => { const a = i / 120 * 2 * Math.PI, r = 0.43 + 0.065 * Math.cos(5 * a); return [50 + Math.cos(a) * 100 * r, 50 + Math.sin(a) * 100 * r]; }))}"/>`;
      default: return '<rect x="2.5" y="2.5" width="95" height="95" rx="37"/>';   // Soft: AMI's own
    }
  }
  // Color(hue:saturation:0.25 brightness:0.88), as the app tints them.
  function tint(hue) {
    const s = 0.25, v = 0.88, i = Math.floor(hue * 6), f = hue * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
    return '#' + [r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
  }
  const blob = (style = 'Soft', hue = 0.12, label = '') => `<svg class="blobatar" viewBox="-4 -4 108 108" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>
    <g fill="${tint(hue)}">${shapePath(style)}</g><g class="eyes" fill="#262626"><rect x="36.5" y="42.75" width="6.5" height="14.5" rx="3.25"/><rect x="57" y="42.75" width="6.5" height="14.5" rx="3.25"/></g></svg>`;

  window.reveredBlob = blob;

  // The product, drawn small: each feature shows the thing it describes.
  const bars = [10, 18, 26, 14, 22, 30, 12, 24, 18, 28, 16, 8, 20, 26, 12, 22, 16, 10, 24, 18]
    .map((h, i) => `<span style="--h:${h}px;animation-delay:${(i * 0.07).toFixed(2)}s"></span>`).join('');
  const visuals = {
    deal: `<div class="visual deal"><h4>Neuro Gum Energy &amp; Focus</h4>
      <div class="row best"><div>Amazon <span class="tag">Best value</span><small>90 pieces · 24¢ each · $9.30 off</small></div><span class="price">$21.69</span></div>
      <div class="row"><div>Costco<small>72 pieces · 31¢ each</small></div><span class="price">$21.99</span></div>
      <div class="row"><div>Walmart<small>90 pieces · 28¢ each</small></div><span class="price">$24.79</span></div>
      <p class="foot">Also checked Target and Best Buy · Watching for drops</p></div>`,
    call: `<div class="visual"><div class="callbar" aria-hidden="true"><span class="face">${blob()}</span><span class="bars">${bars}</span><span class="round">${icon.mic}</span><span class="round end">${icon.close}</span></div>
      <p class="said you">Can you check the price on Neuro Gum?</p>
      <p class="said">Best I’m seeing is 90 pieces for $21.69 at Amazon. I put the other options in the chat.</p></div>`,
    agents: `<div class="visual">
      <div class="agent"><span class="dot">${blob('Soft', 0.12)}</span><div><b>AMI</b><small>Your everyday assistant</small></div></div>
      <div class="agent"><span class="dot">${blob('Round', 0.58)}</span><div><b>Deal Watcher</b><small>Watches prices on what you’re shopping for</small></div></div>
      <div class="agent"><span class="dot">${blob('Cloud', 0.33)}</span><div><b>Fitness Coach</b><small>Plans your week of workouts</small></div></div>
      <div class="agent"><span class="dot group">${blob('Round', 0.58)}${blob('Cloud', 0.33)}</span><div><b>Weekend plans</b><small>Group chat · each agent takes its part</small></div></div></div>`,
    brain: `<div class="visual">
      <div class="fact">${icon.people}<div>The Elm St customer prefers texts, not calls<small>Told in chat · everyone</small></div></div>
      <div class="fact">${icon.people}<div>Job 4182 · completed, water heater element replaced<small>jobs.csv · everyone</small></div></div>
      <div class="fact">${icon.lock}<div>Margin on water heater jobs is 32%<small>Told in chat · owners only</small></div></div>
      <div class="fact">${icon.people}<div>Gate code for 14 Elm St updated<small>Replaces the code from March · history kept</small></div></div></div>`,
    trained: `<div class="visual"><h4 style="margin:0;font:600 15px/1.3 Inter,sans-serif">How often the team fixed AMI’s draft</h4>
      <div class="chart" role="img" aria-label="Fixes needed fell from 62% to 9% over eight weeks">${[62, 55, 44, 38, 27, 19, 14, 9].map(v => `<span style="height:${v}%"></span>`).join('')}</div>
      <div class="chart-key"><span>Week 1 · 62%</span><span>Week 8 · 9%</span></div>
      <div class="approved"><span>Job updates</span><span>Customer replies</span><span>Quotes</span></div></div>`,
    roles: `<div class="visual"><div class="roles">
      <div class="role"><b>Owner</b><span>Job history</span><span>Customer notes</span><span>Margins and pricing</span></div>
      <div class="role"><b>Team</b><span>Job history</span><span>Customer notes</span><span class="no">Margins and pricing</span></div></div>
      <p style="margin-top:8px;font-size:13px;color:var(--faint)">Checked before anything reaches the model.</p></div>`,
    due: `<div class="visual">
      <div class="due"><time>Wed</time><div>Bio lab report<small>Due 11:59 PM</small></div></div>
      <div class="due"><time>Thu</time><div>Calc quiz · derivatives<small>10:00 AM · Room 204</small></div></div>
      <div class="due"><time>Fri</time><div>Study group<small>3:00 PM · Library</small></div></div>
      <p class="said" style="margin-top:8px">Want a study plan around these?</p></div>`,
    buddy: `<div class="visual">
      <p class="said">Quick one: what’s the derivative of x³?</p>
      <p class="said you">3x²</p>
      <p class="said">Right. Next: the derivative of sin(x)? Last time you mixed it up with cos, so take your time.</p></div>`
  };

  const pages = {
    personal: {
      label: 'AMI for you',
      title: 'Your own AI.\nPersonalized.\nOn your own devices.',
      intro: 'AMI is a private assistant for iPhone and Mac. It shops every store for the best price, talks with you, and remembers what matters, on hardware you own.',
      chat: [
        ['you', 'Where can I get AirPods Pro 3 cheapest right now?'],
        ['ami', 'On it — checking the stores now.', 'progress'],
        ['ami', 'Here’s the best price I found for AirPods Pro 3:\n\n$179 at Amazon and Walmart — $70 off the usual $249\n\nOther stores: Target $179.99 · Best Buy $179.99\n\nI’ll watch it and ping you if it drops.']
      ],
      features: [
        ['deal', 'It checks every store, so you don’t.', 'Ask for a price and AMI reads Amazon, Walmart, Target, Best Buy, Costco and the brand’s own store in a real browser on your Mac. Best deal first, sizes compared fairly, every price linked, and a heads-up when it drops.'],
        ['call', 'Talk to it like a person.', 'Start a call and just speak. AMI answers in a natural voice in a couple of seconds, keeps going while you read the chat, and hangs up when you say bye.'],
        ['agents', 'Agents with their own jobs.', 'Ask for a Deal Watcher or a Fitness Coach and AMI makes it, with only the context it needs. Put a few in a group chat and each takes its part.']
      ],
      today: [['Best prices across the big stores', 'Compared per piece when sizes differ'], ['Price-drop alerts', 'Checked a few times a day'], ['Voice calls', 'Hands-free, with captions'], ['Weather and your calendar', 'Read on your iPhone, never guessed'], ['Your own agents and group chats', 'On device'], ['iPhone and Mac, paired directly', 'No account, no server']],
      next: [['Morning briefing', 'Your day, weather and deals at once'], ['Gmail and Google Calendar', 'Connected with your permission'], ['More voices to choose from', 'Pick the one that sounds right']]
    },
    business: {
      label: 'AMI for business',
      title: 'Your company’s AI.\nOn your own servers.',
      intro: 'Plug in the tools your team already uses. AMI builds a company brain from them, learns your team’s jobs from the work they approve, and runs on hardware you control.',
      chat: [
        ['you', 'Get me ready for my next job'],
        ['ami', 'Next: 2:30 PM at 14 Elm St, water heater not heating.\n\nIn March you replaced the thermostat. She prefers texts, and the part is on your truck.'],
        ['you', 'Done. Replaced the element, tested, all good.'],
        ['ami', 'Here’s the job update. Approve it and I’ll save it.', 'progress']
      ],
      features: [
        ['brain', 'A company brain.', 'Import a spreadsheet or tell AMI what to remember. Every fact keeps where it came from and who may see it, and newer facts replace older ones without losing the history.'],
        ['trained', 'It learns your team’s work.', 'Approve a reply as written, or fix it first. Each approval teaches your company’s own model, trained on your Mac, and you can watch the fixes it needs fall week by week.'],
        ['roles', 'Permissions in code, not in a prompt.', 'Owners see everything; the team sees what everyone may. AMI checks before anything reaches the model, so a fact someone can’t see never shapes their answer.']
      ],
      today: [['Company brain', 'From chat and spreadsheets'], ['Roles for each paired phone', 'Owner or team'], ['Approve or fix replies', 'Each one a lesson'], ['Train an agent’s own model', 'On a Mac, from approved work'], ['Dashboards from your data', 'Built from your spreadsheets'], ['Price checks for supplies', 'Every big store, watched for drops']],
      next: [['Team workspace', '@mention people and agents in shared channels'], ['AI support line', 'Answers your customers and takes the details'], ['Owner briefings', 'Your week’s numbers and what needs a decision'], ['Fine-tuning, done for you', 'Tuned to your business, tested before it ships']],
      cta: ['Talk to us about your company', 'mailto:ami@revered.dev?subject=AMI%20for%20Business'],
      note: 'Set up with your team by Revered · Runs on hardware you control · ami@revered.dev',
      privateTitle: 'Your company’s intelligence.\nYour servers.',
      privacy: [
        ['On your hardware', 'AMI runs an open model on a machine your company controls. Nothing goes to a Revered cloud.'],
        ['Permissions in code', 'Every fact carries who may see it, checked before anything reaches the model.'],
        ['Your model is yours', 'The model your team trains belongs to your company. Run it, move it, keep it.']
      ]
    },
    student: {
      label: 'AMI for students',
      title: 'Study smarter.\nKeep it yours.',
      intro: 'AMI knows what’s due, explains things your way, and turns a quick call into a plan. Your notes and questions stay on your devices.',
      chat: [
        ['you', 'What do I have this week?'],
        ['ami', 'Three things: your bio lab report Wednesday, a calc quiz Thursday at 10, and your study group Friday at 3.\n\nWant a study plan around them?'],
        ['you', 'Yes, and quiz me on derivatives']
      ],
      features: [
        ['due', 'Know what’s due.', 'AMI reads your calendar and reminders and tells you what’s coming in plain words, then offers a plan around it.'],
        ['buddy', 'A study buddy that remembers.', 'Make a Study Buddy that explains, quizzes you, and picks up where you left off, including what tripped you up last time.'],
        ['call', 'Talk it through.', 'Call AMI and think out loud. It answers in a couple of seconds and keeps the whole conversation in your chat.']
      ],
      today: [['Calendar and reminders', 'What’s due, at a glance'], ['Study Buddy agents', 'With their own memory'], ['Voice calls', 'Think out loud, hands-free'], ['Research with sources', 'Every answer linked'], ['Private by default', 'No account to sign up for']],
      next: [['Canvas and Google Classroom', 'Assignments and grades, connected'], ['Flashcards from your notes', 'Made for what you’re studying'], ['Goals for the semester', 'A plan that checks in with you']]
    }
  };
  const privacy = [
    ['On your devices', 'AMI runs open models on your iPhone and your Mac. Your chats live there.'],
    ['No account', 'Your phone and Mac pair directly, end to end. There’s no Revered server in the middle.'],
    ['Your choice of model', 'Pick the model each agent uses, from the open models in our library.']
  ];
  const text = value => String(value).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const lines = value => text(value).replace(/\n/g, '<br>');
  // One grid for both lists: each row as tall as its tallest item, so Today and Next always line up.
  const slot = (kind, entry) => entry ? `<div class="slot ${kind}">${icon[kind === 'today' ? 'check' : 'soon']}<span>${text(entry[0])}${entry[1] ? `<small>${text(entry[1])}</small>` : ''}</span></div>` : `<div class="slot ${kind} empty"></div>`;
  function statusGrid(today, next) {
    const rows = Math.max(Math.ceil(today.length / 2), next.length);
    let cells = '<h3 class="head today">Works today</h3><h3 class="head next">Next</h3>';
    for (let row = 0; row < rows; row++) cells += slot('today', today[row * 2]) + slot('today', today[row * 2 + 1]) + slot('next', next[row]);
    return `<div class="status-grid">${cells}</div>`;
  }

  // The live team demo needs Claude's runtime (shared posts, agents); a plain web host shows the rest of the page.
  const liveDemo = !/(github\.io|revered\.dev)$/.test(location.hostname);
  function render(name) {
    const page = pages[name];
    const live = name === 'business' && liveDemo;
    const bubbles = page.chat.map(([who, words, kind], index) =>
      `<p class="bubble ${who}${kind ? ' ' + kind : ''}" style="--delay:${0.4 + index * 1.1}s">${lines(words)}</p>`).join('');
    document.getElementById('ami-page').innerHTML = `
      <section class="ami-hero">
        <div class="ami-copy">
          <p class="label">${text(page.label)}</p>
          <h1>${lines(page.title)}</h1>
          <p class="intro">${text(page.intro)}</p>
          <div class="ami-actions">
            <a class="button primary" href="${page.cta ? page.cta[1] : 'mailto:ami@revered.dev?subject=AMI%20private%20beta'}">${page.cta ? text(page.cta[0]) : 'Join the private beta'}</a>
            <a class="button quiet" href="#${live ? 'team-live' : 'how-it-works'}" data-scroll="${live ? 'team-live' : 'how-it-works'}">${live ? 'Try it live' : 'See how it works'}</a>
          </div>
          <p class="ami-note">${page.note ? text(page.note) : 'For iPhone and Mac · Free on your own devices · Beta invites at <span class="email">ami@revered.dev</span>'}</p>
        </div>
        <div class="phone" role="img" aria-label="A conversation with AMI on iPhone">
          <span class="phone-button action"></span><span class="phone-button volume-up"></span><span class="phone-button volume-down"></span><span class="phone-button power"></span>
          <div class="phone-screen">
            <div class="status-bar" aria-hidden="true"><span class="clock">9:41</span><span class="island"></span><span class="status-icons"><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0z"/><path d="M3.4 6.8a6.6 6.6 0 0 1 9.2 0l-1.4 1.4a4.6 4.6 0 0 0-6.4 0z"/><path d="M1.2 4.6a9.7 9.7 0 0 1 13.6 0l-1.4 1.4a7.7 7.7 0 0 0-10.8 0z"/></svg><span class="battery"><i></i></span></span></div>
            <div class="app-bar" aria-hidden="true"><span class="app-circle"><b></b><b></b></span><span class="app-pill">Devices</span></div>
            <div class="phone-head"><span class="blob">${blob()}</span><span class="phone-name">AMI</span></div>
            <div class="phone-chat">${bubbles}</div>
            <div class="phone-composer"><span class="plus" aria-hidden="true">+</span><span class="field">Message<b aria-hidden="true">↑</b></span></div>
            <span class="home-indicator" aria-hidden="true"></span>
          </div>
        </div>
      </section>
      ${live ? '<section class="team-live" id="team-live"></section>' : ''}
      <section class="ami-features" id="how-it-works">
        ${page.features.map(([visual, title, body]) => `<article class="feature">
          <div class="feature-copy"><h2>${text(title)}</h2><p>${text(body)}</p></div>
          ${visuals[visual]}
        </article>`).join('')}
      </section>
      <section class="ami-status">
        <h2>What AMI does today, and what’s next.</h2>
        ${statusGrid(page.today, page.next)}
      </section>
      <section class="ami-private" id="how-private">
        <div><p class="label">Private by design</p><h2>${lines(page.privateTitle || 'Your intelligence.\nYour machines.')}</h2></div>
        <div class="ami-private-points">${(page.privacy || privacy).map(([title, body]) => `<div><h3>${text(title)}</h3><p>${text(body)}</p></div>`).join('')}</div>
      </section>
      <section class="motto" aria-label="Our motto">
        <blockquote>We must revere humanity's past in order to envision it's future.</blockquote>
        <cite>Revered Labs</cite>
      </section>
      <section class="ami-models">
        <div><h2>Choose the mind behind AMI.</h2><p>Every model AMI runs is open-weight and credited to its creators. Browse them, compare them, and pick one for each agent.</p></div>
        <a class="button quiet" href="#dev">Explore the model library</a>
      </section>`;
    const panel = document.getElementById('team-live');
    if (panel && window.mountTeamLive) window.mountTeamLive(panel);
    document.querySelectorAll('[data-scroll]').forEach(link => link.onclick = event => {
      event.preventDefault();
      document.getElementById(link.dataset.scroll).scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    });
  }

  const tabs = [...document.querySelectorAll('[data-audience]')];
  function show(name) {
    if (!(name in pages) && name !== 'dev') name = 'personal';
    tabs.forEach(tab => { const active = tab.dataset.audience === name; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    document.querySelector('[data-page="dev"]').hidden = name !== 'dev';
    const ami = document.getElementById('ami-page');
    ami.hidden = name === 'dev';
    if (name !== 'dev') render(name);
    document.title = name === 'dev' ? 'Revered Labs — Open model library' : 'AMI by Revered Labs — ' + name[0].toUpperCase() + name.slice(1);
  }
  tabs.forEach((tab, index) => {
    tab.onclick = () => { history.replaceState(null, '', '#' + tab.dataset.audience); show(tab.dataset.audience); scrollTo({top: 0}); };
    tab.onkeydown = event => {
      const next = {ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1}[event.key];
      if (next !== undefined) { event.preventDefault(); tabs[next].focus(); tabs[next].click(); }
    };
  });
  addEventListener('hashchange', () => { const name = location.hash.slice(1); if (name in pages || name === 'dev') { show(name); scrollTo({top: 0}); } });
  // The Dev hero's button takes you down to the library.
  const explore = document.getElementById('phoneExplore');
  if (explore) explore.onclick = () => document.getElementById('catalog').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  show(location.hash.slice(1) || 'personal');
})();
