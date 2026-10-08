const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roleTasks = {
  conversation: ['Conversation','Reasoning','Coding','Tool use'],
  listening: ['Speech recognition'],
  speaking: ['Speech synthesis'],
  vision: ['Vision'],
  speechConversation: ['Speech conversation']
};
export function buildBlueprint(catalog, selections) {
  if (selections.length !== 2) throw new Error('Choose exactly two agents.');
  const agents = selections.map((selection,index)=>{
    if (!['modular','speech'].includes(selection.mode)) throw new Error('Choose an audio mode.');
    if (!['phone','computer'].includes(selection.device)) throw new Error('Choose a device.');
    const name=String(selection.name||'').trim();
    if (!name || name.length>60) throw new Error('Each agent needs a name of 1–60 characters.');
    const roles=selection.mode==='speech'?['speechConversation','vision']:['listening','conversation','speaking','vision'];
    const selected={};
    for(const role of roles) {
      const id=selection[role];
      if(!id && role==='vision')continue;
      const model=catalog.find(m=>m.id===id);
      if(!model || !model.tasks.some(t=>roleTasks[role].includes(t)))throw new Error('Choose a compatible model for '+role+'.');
      selected[role]={id:model.id,repository:model.repository,revision:model.revision,format:model.format,license:model.license,licenseURL:model.licenseURL,amiStatus:model.status,listedWeightBytes:model.totalBytes,files:model.files.map(({filename,sha256,bytes,downloadURL,role})=>({filename,sha256,bytes,downloadURL,role}))};
    }
    return {id:'agent-'+(index+1),name,deviceIntent:selection.device,audioMode:selection.mode,models:selected,deviceValidated:false,executionEnabled:false};
  });
  return {
    schemaVersion:1,kind:'revered.agent-pair-blueprint',status:'design-only',
    notice:'This is a setup blueprint, not a running room or an AMI-importable configuration. Model runtimes, device tests, room transport, and permissions are not implemented by this export.',
    agents,
    proposedRoomPolicy:{humanParticipants:true,agentTransport:'structured-events',humanTransport:'audio-and-text',contextScope:'explicitly-shared-room-context',privateMemoryShared:false,turnControl:'human-priority',maxConsecutiveAgentTurns:2,cloudFallback:'off',recording:'off'},
    validation:{combinedMemoryTested:false,latencyTested:false,modelCompatibilityTested:false}
  };
}
export function openBuilder(catalog,show) {
  const $=id=>document.getElementById(id);
  const options=(role,selected)=> (role==='vision'?'<option value="">None</option>':'')+catalog.filter(m=>m.tasks.some(t=>roleTasks[role].includes(t))).map(m=>`<option value="${escapeHTML(m.id)}" ${m.id===selected?'selected':''}>${escapeHTML(m.name)} · ${escapeHTML(m.format)}</option>`).join('');
  const field=(i,role,label,selected)=>`<label for="agent-${i}-${role}">${label}</label><select id="agent-${i}-${role}">${options(role,selected)}</select>`;
  show(`<p class="eyebrow">EXPERT SETUP · DESIGN ONLY</p><h2>Two agents. Their own models.</h2><p class="detail-description">Plan the pieces for two devices and export a version-pinned setup. This does not start a call, install models, or connect devices.</p><div class="agent-fields">${[0,1].map(i=>`<fieldset><legend>Agent ${i+1}</legend><label for="agent-${i}-name">Name</label><input id="agent-${i}-name" maxlength="60" value="AMI ${i+1}"><label for="agent-${i}-device">Intended device</label><select id="agent-${i}-device"><option value="phone">Phone</option><option value="computer">Computer</option></select><label for="agent-${i}-mode">Voice approach</label><select id="agent-${i}-mode"><option value="modular">Separate listening, thinking, speaking</option><option value="speech">End-to-end speech model</option></select><div id="agent-${i}-modular">${field(i,'listening','Listen','whisper-tiny')}${field(i,'conversation','Think',i===0?'qwen3-1.7b':'lfm2.5-1.2b')}${field(i,'speaking','Speak','kokoro-82m')}</div><div id="agent-${i}-speech" hidden>${field(i,'speechConversation','Spoken conversation','lfm2.5-audio-1.5b')}</div>${field(i,'vision','See (optional)','')}</fieldset>`).join('')}</div><div id="stackSummary" class="stack-summary" aria-live="polite"></div><p class="collection-note">Model file sizes are not RAM requirements. Combined memory, latency, iPhone support, and interoperability have not been tested. Choosing a model here is not a compatibility certification.</p><div class="actions"><button class="primary" id="exportStack">Export setup JSON ↓</button><button id="copyStack">Copy setup</button></div><details><summary>Preview setup</summary><pre id="stackPreview" class="stack-output"></pre></details><p id="stackError" role="alert"></p>`);
  const collect=()=>[0,1].map(i=>Object.fromEntries(['name','device','mode',...Object.keys(roleTasks)].map(key=>[key,$(`agent-${i}-${key}`).value])));
  const update=()=>{
    for(const i of [0,1]){
      const speech=$(`agent-${i}-mode`).value==='speech';
      $(`agent-${i}-modular`).hidden=speech;
      $(`agent-${i}-speech`).hidden=!speech;
    }
    try{
      const plan=buildBlueprint(catalog,collect());
      $('stackPreview').textContent=JSON.stringify(plan,null,2);
      $('stackSummary').innerHTML=plan.agents.map(a=>{
        const bytes=Object.values(a.models).reduce((sum,m)=>sum+m.listedWeightBytes,0);
        const macOnly=Object.values(a.models).some(m=>m.id==='moshi-mlx-q4')&&a.deviceIntent==='phone';
        return `<p><strong>${escapeHTML(a.name)}</strong> · ${Object.keys(a.models).length} components · ${(bytes/1e9).toFixed(2)} GB listed weights.${macOnly?' Moshi’s listed runtime targets Mac; a phone runtime is not provided.':''}</p>`;
      }).join('')+'<p>Proposed room: human-controlled turns, explicit shared context, private memory stays separate. These rules describe the future room implementation.</p>';
      $('stackError').textContent='';$('exportStack').disabled=false;$('copyStack').disabled=false;
    }catch(error){$('stackError').textContent=error.message;$('exportStack').disabled=true;$('copyStack').disabled=true;$('stackPreview').textContent='';}
  };
  document.querySelectorAll('.agent-fields input,.agent-fields select').forEach(el=>el.addEventListener('input',update));
  $('exportStack').onclick=()=>{
    const plan=buildBlueprint(catalog,collect());
    const url=URL.createObjectURL(new Blob([JSON.stringify(plan,null,2)+'\n'],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='revered-agent-pair.json';document.body.append(link);link.click();link.remove();$('stackError').textContent='If your browser does not save the file, use Copy setup or the preview below.';
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('copyStack').onclick=async()=>{
    const text=JSON.stringify(buildBlueprint(catalog,collect()),null,2);
    try{await navigator.clipboard.writeText(text);$('copyStack').textContent='Copied';}
    catch{$('stackError').textContent='Copy from Preview setup below; clipboard access is unavailable.';}
  };
  update();
}
