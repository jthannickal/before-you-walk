/** Pure, deterministic policy. No model output can change the clock, source identity, or policy. */
export const TTL = 60;
export const RESPONSE_TIMEOUT = 15;
export const REQUEST_BUDGET = 3;
export type Availability = 'operating' | 'not_operating' | 'unknown';
export type Report = { id:string; pointId:string; source:'caretaker'|'resident'; status:Availability; at:number; queue:number|null; text:string };
export type Point = { id:string; name:string; walk:number; consent:boolean };
export type Request = { id:string; pointId:string; at:number; state:'pending'|'answered'|'timed_out'; text:string };
export type Audit = { at:number; action:string; detail:string };
export type World = { now:number; points:Point[]; reports:Report[]; requests:Request[]; audit:Audit[] };
export type Assessment = { point:Point; status:'verified'|'closed'|'stale'|'conflict'|'unknown'; reason:string; latest:Report|null; eligible:boolean; remaining:number|null };
export function seed():World {
 const names=['Market tap','School borehole','East standpipe','Bus-stop tap','Community tank','North handpump','Garden standpipe','Workshop tap','Hill tank','South handpump'];
 const points=names.map((name,i)=>({id:`p${i+1}`,name,walk:[8,18,12,23,26,35,16,28,31,40][i],consent:i!==9}));
 const data:[number,Availability,number,'caretaker'|'resident',number|null][]=[[1,'operating',-95,'caretaker',5],[2,'operating',-10,'caretaker',12],[3,'operating',-6,'caretaker',3],[3,'not_operating',-3,'resident',null],[4,'not_operating',-8,'caretaker',null],[5,'operating',-48,'caretaker',20],[6,'operating',-120,'caretaker',null],[7,'operating',-5,'resident',4],[8,'not_operating',-100,'resident',null],[9,'operating',-7,'caretaker',8]];
 return {now:0,points,reports:data.map(([i,status,at,source,queue],n)=>({id:`r${n+1}`,pointId:`p${i}`,source,status,at,queue,text:`Fictional ${source} report: ${status.replace('_',' ')}.`})),requests:[],audit:[{at:0,action:'Simulation started',detail:'Ten fictional locations. No external messages, real people, or water-safety claims.'}]};
}
export function assess(w:World,p:Point):Assessment {
 const all=w.reports.filter(r=>r.pointId===p.id&&r.at<=w.now).sort((a,b)=>b.at-a.at);
 const latest=all[0]??null;
 const fresh=all.filter(r=>w.now-r.at<TTL);
 const trusted=fresh.find(r=>r.source==='caretaker');
 const base={point:p,latest,eligible:false,remaining:trusted?TTL-(w.now-trusted.at):null};
 if(!latest)return {...base,status:'unknown',reason:'No report received.'};
 if(!fresh.length)return {...base,status:'stale',reason:'All reports have expired. Ask again.'};
 if(trusted){
  const conflict=fresh.some(r=>r.at>=trusted.at&&r.status!==trusted.status&&r.status!=='unknown');
  if(conflict)return {...base,status:'conflict',reason:'Fresh reports disagree. A newer caretaker confirmation is needed.'};
  if(trusted.status==='not_operating')return {...base,latest:trusted,status:'closed',reason:'Caretaker recently reported not operating.'};
  if(trusted.status==='operating'){
   const eligible=w.now-trusted.at+p.walk<TTL;
   return {...base,latest:trusted,status:'verified',eligible,reason:eligible?'Recent caretaker report; still within freshness window at estimated arrival.':'Report will expire before estimated arrival. Confirm again.'};
  }
 }
 return {...base,status:'unknown',reason:'No fresh, unambiguous caretaker confirmation.'};
}
export function ranked(w:World){return w.points.map(p=>assess(w,p)).sort((a,b)=>a.point.walk-b.point.walk);}
export function recommendation(w:World){return ranked(w).find(a=>a.eligible)??null;}
function clone(w:World):World{return structuredClone(w);}
export function requestConfirmation(w:World,id:string):World {
 const p=w.points.find(p=>p.id===id);if(!p)throw Error('Unknown water point.');
 if(!p.consent)throw Error('No caretaker opt-in. No request created.');
 if(w.requests.some(r=>r.pointId===id&&r.state==='pending'))return w;
 if(w.requests.length>=REQUEST_BUDGET)throw Error('This simulation has reached its three-request budget.');
 if(assess(w,p).eligible)throw Error('Fresh evidence already covers estimated arrival. No request needed.');
 const n=clone(w); const r:Request={id:`q${n.requests.length+1}`,pointId:id,at:w.now,state:'pending',text:`Is ${p.name} operating now? Reply operating / not operating / unknown, and the queue in minutes if known.`};
 n.requests.push(r);n.audit.push({at:w.now,action:'Confirmation requested',detail:`${r.id} → ${p.name}. Simulated opt-in caretaker channel only.`});return n;
}
export function verifyNearby(w:World):World {
 let n=w;const best=recommendation(w);
 for(const a of ranked(w)){
  if(n.requests.length>=REQUEST_BUDGET)break;
  if(!a.eligible&&a.status!=='closed'&&a.point.consent&&(!best||a.point.walk<best.point.walk))n=requestConfirmation(n,a.point.id);
 }
 if(n===w){n=clone(w);n.audit.push({at:w.now,action:'No new request',detail:'Existing evidence, pending requests, consent rules, or the request budget prevented another message.'});}return n;
}
export function receiveReply(w:World,requestId:string,status:Availability,queue:number|null,text:string):World {
 if(!['operating','not_operating','unknown'].includes(status))throw Error('Invalid availability.');
 if(queue!==null&&(!Number.isInteger(queue)||queue<0||queue>240))throw Error('Queue must be 0–240 whole minutes or unknown.');
 if(!text.trim()||text.length>500)throw Error('Reply must contain 1–500 characters.');
 const request=w.requests.find(r=>r.id===requestId&&r.state==='pending');if(!request)throw Error('No pending request matches this reply.');
 if(w.now-request.at>=RESPONSE_TIMEOUT)throw Error('Reply window expired; request a new confirmation.');
 const n=clone(w);n.requests.find(r=>r.id===requestId)!.state='answered';
 // A reply is linked to a request channel by the simulator, never by an LLM assertion.
 n.reports.push({id:`r${n.reports.length+1}`,pointId:request.pointId,source:'caretaker',status,at:w.now,queue:status==='operating'?queue:null,text});
 n.audit.push({at:w.now,action:'Caretaker reply recorded',detail:`${requestId}: ${status.replace('_',' ')}. Evidence timestamp set by simulator.`});return n;
}
export function advance(w:World,minutes:number):World {
 if(!Number.isInteger(minutes)||minutes<1||minutes>120)throw Error('Advance must be 1–120 whole minutes.');
 const n=clone(w);n.now+=minutes;
 for(const r of n.requests)if(r.state==='pending'&&n.now-r.at>=RESPONSE_TIMEOUT){r.state='timed_out';n.audit.push({at:n.now,action:'Request timed out',detail:`${r.id}: no reply. Availability remains unconfirmed.`});}
 n.audit.push({at:n.now,action:'Clock advanced',detail:`${minutes} simulated minutes elapsed. All freshness decisions recalculated.`});return n;
}
export function shortAnswer(w:World):string {
 const best=recommendation(w);
 return best?`${best.point.name}: last reported operating by its caretaker ${w.now-best.latest!.at} minutes ago; estimated walk ${best.point.walk} minutes. Availability may change. Water quality is not assessed.`:'No location has a fresh caretaker report that covers estimated arrival. Wait for confirmation; do not assume availability. Water quality is not assessed.';
}
