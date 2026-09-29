// Highway Empire v6 – Chaotic Graph Network & Pseudo-3D
'use strict';

const LW=35, WORLD=3000, HW=WORLD/2;

const state = {
  money:0, tollRevenue:1, carCost:10, tollUpgradeCost:25,
  metroUpgradeCost:1500,
  isMetropolis:false,
  level:1, xp:0, xpToNextLevel:10,
  cars:[], segments:[], activeNodes:[],
  trafficPhase: 0, trafficTimer: 0,
  earnedAccum: 0, epsTimer: 0, eps: 0,
  roads: {
    ew_highway: false,
    slip_n_w: false, slip_s_e: false, slip_e_n: false, slip_w_s: false,
    loop_n_e: false, loop_s_w: false, loop_e_s: false, loop_w_n: false
  }
};
const ROAD_ITEMS = [
  { id: 'ew_highway', name: 'Autovía Este-Oeste', desc: 'Añade ruta perpendicular', cost: 300, icon: '🛣️' },
  { id: 'slip_n_w', name: 'Inc. N → O', desc: 'Carril de incorporación', cost: 600, req: 'ew_highway', icon: '⤴️' },
  { id: 'slip_s_e', name: 'Inc. S → E', desc: 'Carril de incorporación', cost: 600, req: 'ew_highway', icon: '⤴️' },
  { id: 'slip_e_n', name: 'Inc. E → N', desc: 'Carril de incorporación', cost: 600, req: 'ew_highway', icon: '⤴️' },
  { id: 'slip_w_s', name: 'Inc. O → S', desc: 'Carril de incorporación', cost: 600, req: 'ew_highway', icon: '⤴️' },
  { id: 'loop_n_e', name: 'Bucle N → E', desc: 'Lazo de trébol interior', cost: 1500, req: 'ew_highway', icon: '🔄' },
  { id: 'loop_s_w', name: 'Bucle S → O', desc: 'Lazo de trébol interior', cost: 1500, req: 'ew_highway', icon: '🔄' },
  { id: 'loop_e_s', name: 'Bucle E → S', desc: 'Lazo de trébol interior', cost: 1500, req: 'ew_highway', icon: '🔄' },
  { id: 'loop_w_n', name: 'Bucle O → N', desc: 'Lazo de trébol interior', cost: 1500, req: 'ew_highway', icon: '🔄' }
];
const canvas=document.getElementById('gameCanvas'), ctx=canvas.getContext('2d');
const mm=document.getElementById('minimap'), mmCtx=mm.getContext('2d');
const speedFX=document.getElementById('speed-effect');
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
addEventListener('resize',resize); resize();

const cam={x:0,y:0,zoom:0.65};
let speedMul=1;
const mkRng=s=>{let x=s>>>0;return()=>{x=Math.imul(x^x>>>15,x|1)^(x^x>>>7)*(x^x>>>2);return(x>>>0)/4294967296;};};

// ── Graph Network & Bezier Math ──────────────────
function bezier(p0, p1, p2, p3, steps=50) {
  let pts = [];
  for(let i=0; i<=steps; i++){
    let t = i/steps, mt = 1-t;
    let x = mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x;
    let y = mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y;
    pts.push({x, y});
  }
  return pts;
}

class Segment {
  constructor(id, pts, isToll=false, isLoop=false) {
    this.id = id;
    this.pts = pts;
    this.isToll = isToll;
    this.isLoop = isLoop; // Loop around edges to keep cars in world
    this.lanes = state.isMetropolis ? 5 : 3;
    this.next = []; // Next segments
    this._build();
  }
  _build() {
    const N = 200, cum = [0];
    for(let i=1; i<this.pts.length; i++)
      cum.push(cum[i-1]+Math.hypot(this.pts[i].x-this.pts[i-1].x, this.pts[i].y-this.pts[i-1].y));
    this.length = cum.at(-1);
    this._lut = Array.from({length: N+1}, (_, s) => {
      const d = (s/N)*this.length;
      let i = 1; while(i < cum.length-1 && cum[i] < d) i++;
      const t = (d-cum[i-1]) / Math.max(1e-6, cum[i]-cum[i-1]);
      const a = this.pts[i-1], b = this.pts[i];
      return { x: a.x+t*(b.x-a.x), y: a.y+t*(b.y-a.y), a: Math.atan2(b.y-a.y, b.x-a.x) };
    });
  }
  at(d) {
    const N = 200, t = Math.max(0, Math.min(1, d/this.length))*N;
    const i = Math.floor(t), f = t-i;
    if(i >= N) return this._lut[N];
    const p1 = this._lut[i], p2 = this._lut[i+1];
    let da = p2.a - p1.a;
    if(da > Math.PI) da -= Math.PI*2;
    if(da < -Math.PI) da += Math.PI*2;
    return { x: p1.x+f*(p2.x-p1.x), y: p1.y+f*(p2.y-p1.y), a: p1.a+f*da };
  }
  draw(ctx, renderPass = -1) {
    const W = this.lanes * LW;
    const edge = s => this._lut.map(p => ({x: p.x+Math.sin(p.a)*W/2*s, y: p.y-Math.cos(p.a)*W/2*s}));
    const R = edge(1), L = edge(-1);
    const poly = (a, b) => { ctx.beginPath(); a.forEach(({x,y}, i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); [...b].reverse().forEach(({x,y}) => ctx.lineTo(x,y)); ctx.closePath(); };

    // Pass 0: Shadow
    if (renderPass === 0 || renderPass === -1) {
      ctx.globalAlpha = 0.4; ctx.fillStyle = '#000';
      poly(this._lut.map(p => ({x: p.x+Math.sin(p.a)*(W/2+10)+8, y: p.y-Math.cos(p.a)*(W/2+10)+8})),
           this._lut.map(p => ({x: p.x-Math.sin(p.a)*(W/2+10)+8, y: p.y+Math.cos(p.a)*(W/2+10)+8})));
      ctx.fill(); ctx.globalAlpha = 1;
    }

    // Pass 1: Asphalt
    if (renderPass === 1 || renderPass === -1) {
      ctx.fillStyle = '#222'; poly(R, L); ctx.fill();
    }

    // Pass 2: Lines and Details
    if (renderPass === 2 || renderPass === -1) {
      const isEw = state.roads.ew_highway;
      const inInt = (x, y) => isEw && Math.abs(x) < 134 && Math.abs(y) < 134;

      // White edges
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.setLineDash([]);
      [R, L].forEach(e => { 
        ctx.beginPath(); 
        let pi = false;
        e.forEach(({x,y}, i) => {
          const ci = inInt(x, y);
          if (i === 0 || ci || pi) ctx.moveTo(x,y); 
          else ctx.lineTo(x,y);
          pi = ci;
        }); 
        ctx.stroke(); 
      });

      // Lane dashes
      if (this.lanes > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.setLineDash([20, 20]);
        for (let l=1; l<this.lanes; l++) {
          const off = l*LW - W/2;
          ctx.beginPath();
          let pi = false;
          this._lut.forEach(({x,y,a}, i) => { 
            const px=x+Math.sin(a)*off, py=y-Math.cos(a)*off; 
            const ci = inInt(px, py);
            if (i === 0 || ci || pi) ctx.moveTo(px,py); 
            else ctx.lineTo(px,py);
            pi = ci;
          });
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Toll
      if (this.isToll) {
        const ts = this.at(this.length * 0.7);
        const nx = Math.sin(ts.a), ny = -Math.cos(ts.a);
        ctx.save(); ctx.shadowColor = '#f5a623'; ctx.shadowBlur = 20;
        ctx.strokeStyle = '#f5a623'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(ts.x-nx*(W/2+5), ts.y-ny*(W/2+5)); ctx.lineTo(ts.x+nx*(W/2+5), ts.y+ny*(W/2+5)); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = 'rgba(245,166,35,0.6)'; ctx.font = 'bold 20px Orbitron,sans-serif';
        ctx.save(); ctx.translate(ts.x+nx*(W/2+25), ts.y+ny*(W/2+25)); ctx.rotate(ts.a); ctx.fillText('PEAJE', -24, 7); ctx.restore();
      }
    }
  }
}

const N = -1000, S = 1000, W = -1000, E = 1000;
const I = 250; // Inner cross size
const O = 70;  // Offset from center line

// Define points
const p = {
  n_in: {x: -O, y: N}, n_cross: {x: -O, y: -I}, n_cross2: {x: -O, y: I}, n_out: {x: -O, y: S},
  s_in: {x: O, y: S},  s_cross: {x: O, y: I},   s_cross2: {x: O, y: -I}, s_out: {x: O, y: N},
  w_in: {x: W, y: O},  w_cross: {x: -I, y: O},  w_cross2: {x: I, y: O},  w_out: {x: E, y: O},
  e_in: {x: E, y: -O}, e_cross: {x: I, y: -O},  e_cross2: {x: -I, y: -O},e_out: {x: W, y: -O},
};

const segs = {};
function createGraph() {
  const add = (id, pts, toll, loop) => segs[id] = new Segment(id, pts, toll, loop);
  
  // Level 0: N-S Highway
  add('n_in', [p.n_in, p.n_cross], true); add('n_mid', [p.n_cross, p.n_cross2]); add('n_out', [p.n_cross2, p.n_out]);
  add('s_in', [p.s_in, p.s_cross], true); add('s_mid', [p.s_cross, p.s_cross2]); add('s_out', [p.s_cross2, p.s_out]);
  // Loops to keep cars driving
  add('loop_n', bezier(p.n_out, {x: -O, y: S+300}, {x: O, y: S+300}, p.s_in), false, true);
  add('loop_s', bezier(p.s_out, {x: O, y: N-300}, {x: -O, y: N-300}, p.n_in), false, true);
  
  segs.n_in.next = [segs.n_mid]; segs.n_mid.next = [segs.n_out]; segs.n_out.next = [segs.loop_n]; segs.loop_n.next = [segs.s_in];
  segs.s_in.next = [segs.s_mid]; segs.s_mid.next = [segs.s_out]; segs.s_out.next = [segs.loop_s]; segs.loop_s.next = [segs.n_in];

  // Level 1: E-W Highway (Cross)
  add('w_in', [p.w_in, p.w_cross], true); add('w_mid', [p.w_cross, p.w_cross2]); add('w_out', [p.w_cross2, p.w_out]);
  add('e_in', [p.e_in, p.e_cross], true); add('e_mid', [p.e_cross, p.e_cross2]); add('e_out', [p.e_cross2, p.e_out]);
  add('loop_w', bezier(p.w_out, {x: E+300, y: O}, {x: E+300, y: -O}, p.e_in), false, true);
  add('loop_e', bezier(p.e_out, {x: W-300, y: -O}, {x: W-300, y: O}, p.w_in), false, true);
  
  segs.w_in.next = [segs.w_mid]; segs.w_mid.next = [segs.w_out]; segs.w_out.next = [segs.loop_w]; segs.loop_w.next = [segs.e_in];
  segs.e_in.next = [segs.e_mid]; segs.e_mid.next = [segs.e_out]; segs.e_out.next = [segs.loop_e]; segs.loop_e.next = [segs.w_in];

  // Level 2: Slips (Right turns)
  add('slip_n_w', bezier({x:-110, y:-350}, {x:-110, y:-110}, {x:-110, y:-110}, {x:-350, y:-110})); // N -> W
  add('slip_s_e', bezier({x:110, y:350}, {x:110, y:110}, {x:110, y:110}, {x:350, y:110}));     // S -> E
  add('slip_e_n', bezier({x:350, y:-110}, {x:110, y:-110}, {x:110, y:-110}, {x:110, y:-350}));   // E -> N
  add('slip_w_s', bezier({x:-350, y:110}, {x:-110, y:110}, {x:-110, y:110}, {x:-110, y:350}));   // W -> S

  // Level 3: Loops (Left turns)
  add('loop_n_e', bezier({x:-70, y:-350}, {x:-70, y:70}, {x:-70, y:70}, {x:350, y:70}));
  add('loop_s_w', bezier({x:70, y:350}, {x:70, y:-70}, {x:70, y:-70}, {x:-350, y:-70}));
  add('loop_e_s', bezier({x:350, y:-70}, {x:-70, y:-70}, {x:-70, y:-70}, {x:-70, y:350}));
  add('loop_w_n', bezier({x:-350, y:70}, {x:70, y:70}, {x:70, y:70}, {x:70, y:-350}));
}

function syncGraph() {
  state.activeNodes = [];
  const active = (ids) => ids.forEach(id => { state.activeNodes.push(segs[id]); });
  
  // Base N-S
  active(['n_in', 'n_mid', 'n_out', 's_in', 's_mid', 's_out', 'loop_n', 'loop_s']);
  segs.n_in.next = [segs.n_mid]; segs.s_in.next = [segs.s_mid];
  segs.n_mid.next = [segs.n_out]; segs.s_mid.next = [segs.s_out];
  
  if (state.roads.ew_highway) {
    active(['w_in', 'w_mid', 'w_out', 'e_in', 'e_mid', 'e_out', 'loop_w', 'loop_e']);
    segs.w_in.next = [segs.w_mid]; segs.w_mid.next = [segs.w_out];
    segs.e_in.next = [segs.e_mid]; segs.e_mid.next = [segs.e_out];
  }
  
  if (state.roads.slip_n_w) { active(['slip_n_w']); segs.n_in.next.push(segs.slip_n_w); segs.slip_n_w.next = [segs.e_out]; }
  if (state.roads.slip_s_e) { active(['slip_s_e']); segs.s_in.next.push(segs.slip_s_e); segs.slip_s_e.next = [segs.w_out]; }
  if (state.roads.slip_e_n) { active(['slip_e_n']); segs.e_in.next.push(segs.slip_e_n); segs.slip_e_n.next = [segs.s_out]; }
  if (state.roads.slip_w_s) { active(['slip_w_s']); segs.w_in.next.push(segs.slip_w_s); segs.slip_w_s.next = [segs.n_out]; }

  if (state.roads.loop_n_e) { active(['loop_n_e']); segs.n_in.next.push(segs.loop_n_e); segs.loop_n_e.next = [segs.w_out]; }
  if (state.roads.loop_s_w) { active(['loop_s_w']); segs.s_in.next.push(segs.loop_s_w); segs.loop_s_w.next = [segs.e_out]; }
  if (state.roads.loop_e_s) { active(['loop_e_s']); segs.e_in.next.push(segs.loop_e_s); segs.loop_e_s.next = [segs.n_out]; }
  if (state.roads.loop_w_n) { active(['loop_w_n']); segs.w_in.next.push(segs.loop_w_n); segs.loop_w_n.next = [segs.s_out]; }
}

// ── Car (Universal Collision) ─────────────────────
const PALS=[{body:'#dde1e7',roof:'#9ea5b0'},{body:'#ef5350',roof:'#b71c1c'},{body:'#42a5f5',roof:'#1565c0'},{body:'#26a69a',roof:'#00695c'},{body:'#ffa726',roof:'#e65100'},{body:'#ab47bc',roof:'#6a1b9a'},{body:'#26c6da',roof:'#006064'},{body:'#d4e157',roof:'#827717'},{body:'#78909c',roof:'#37474f'},{body:'#ff8a65',roof:'#bf360c'}];

class Car {
  constructor(seg) {
    this.seg = seg;
    this.dist = Math.random() * seg.length * 0.5;
    this.lane = Math.floor(Math.random() * seg.lanes);
    this.spd0 = 60 + Math.random() * 40;
    this.spd = this.spd0;
    this.paid = false;
    this.p = PALS[Math.floor(Math.random()*PALS.length)];
    this.posXY = this.seg.at(this.dist);
  }
  
  update(dt) {
    // 1. Universal Collision Detection (The Chaos Engine)
    const safeSq = 14400; // 120px safe vision
    let minDist = Infinity;
    
    // 1. Same-segment Exact Distance (Fixes blind spots on sharp curves!)
    for (let o of state.cars) {
      if (o === this) continue;
      if (o.seg === this.seg && o.lane === this.lane) {
        const distDiff = o.dist - this.dist;
        if (distDiff > 0 && distDiff < minDist) {
          minDist = distDiff;
        }
      }
    }

    // 2. Cross-segment Euclidean Distance (Intersections & Merges)
    for (let o of state.cars) {
      if (o === this) continue;
      
      const dx = o.posXY.x - this.posXY.x;
      const dy = o.posXY.y - this.posXY.y;
      const dSq = dx*dx + dy*dy;
      
      if (dSq < safeSq) {
        const d = Math.sqrt(dSq);
        
        // Exact overlap tie-breaker universally (pushes apart slightly)
        if (d < 5 && this.id < o.id) {
          this.dist = Math.max(0, this.dist - 2);
          if (minDist > 0) minDist = 0;
        }

        // We already handled same segment perfectly above
        if (o.seg === this.seg) continue;

        const dirX = Math.sin(this.posXY.a);
        const dirY = -Math.cos(this.posXY.a);
        const dot = (dx * dirX + dy * dirY) / d;
        
        // Ignore oncoming traffic (opposite direction)
        const aDiff = Math.abs(this.posXY.a - o.posXY.a);
        const isOpposite = (aDiff > Math.PI*0.75 && aDiff < Math.PI*1.25);
        if (isOpposite) continue;

        // Wider vision cone for crossing traffic
        const isCrossing = (aDiff > Math.PI*0.25 && aDiff < Math.PI*0.75) || (aDiff > Math.PI*1.25 && aDiff < Math.PI*1.75);
        const dotThreshold = isCrossing ? 0.1 : 0.45;

        if (dot > dotThreshold && d < minDist) {
          // Anti-Deadlock mechanism
          if (d < 30 && this.spd < 15 && o.spd < 15) {
            if (this.id < o.id) continue;
          }
          minDist = d;
        }
      }
    }

    // 3. Traffic Lights!
    if (state.roads.ew_highway) {
      let redLightDist = Infinity;
      const isNS = this.seg.id === 'n_in' || this.seg.id === 's_in';
      const isEW = this.seg.id === 'w_in' || this.seg.id === 'e_in';
      
      // Stop on Red or Yellow phases
      const nsStop = state.trafficPhase === 1 || state.trafficPhase === 2 || state.trafficPhase === 3;
      const ewStop = state.trafficPhase === 3 || state.trafficPhase === 0 || state.trafficPhase === 1;

      if (isNS && nsStop) redLightDist = this.seg.length - this.dist;
      if (isEW && ewStop) redLightDist = this.seg.length - this.dist;
      
      // If we are already past the line (-10), don't brake! Keep going to clear the intersection.
      if (redLightDist > -10 && redLightDist < 350) { 
        minDist = Math.min(minDist, Math.max(1, redLightDist - 15));
      }
    }

    const safe = 65;
    const gdt = dt * speedMul;
    
    if (minDist < safe * 0.6) this.spd = Math.max(0, this.spd - 1200*gdt); // Strong emergency brake
    else if (minDist < safe * 1.5) this.spd = Math.max(0, this.spd - 600*gdt); // Normal brake
    else this.spd = Math.min(this.spd0, this.spd + 250*gdt);

    this.dist += this.spd * gdt;
    this.posXY = this.getPosXY();

    // Toll
    if (this.seg.isToll && !this.paid && this.dist >= this.seg.length * 0.7) {
      state.money += state.tollRevenue; state.earnedAccum += state.tollRevenue; 
      gainXP(1); updateUI(); animMoney();
      floats.push(new FloatTxt(`+$${state.tollRevenue}`, this.posXY.x, this.posXY.y));
      this.paid = true;
    }

    // Node Transition
    if (this.dist >= this.seg.length) {
      const nexts = this.seg.next;
      if (nexts && nexts.length > 0) {
        this.seg = nexts[Math.floor(Math.random() * nexts.length)];
        this.dist = 0;
        this.paid = false;
        // Constrain lane to new segment
        if (this.lane >= this.seg.lanes) this.lane = this.seg.lanes - 1;
      } else {
        this.dist = 0; // Fallback loop
      }
    }
  }

  getPosXY() {
    const {x, y, a} = this.seg.at(this.dist);
    const W = this.seg.lanes * LW, off = (this.lane + 0.5) * LW - W/2;
    return { x: x + Math.sin(a)*off, y: y - Math.cos(a)*off, a };
  }

  draw(ctx) {
    const {x, y, a} = this.posXY;
    ctx.save(); ctx.translate(x,y); ctx.rotate(a + Math.PI/2);
    const w = 22, h = 44;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(3,6, w*.5, h*.2, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = this.p.body; ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 5); ctx.fill();
    ctx.fillStyle = this.p.roof; ctx.beginPath(); ctx.roundRect(-w/2+3, -h/2+h*.2, w-6, h*.55, 4); ctx.fill();
    ctx.fillStyle = 'rgba(150,215,255,.35)'; ctx.beginPath(); ctx.roundRect(-w/2+3, -h/2+6, w-6, 10, 2); ctx.fill();
    ctx.fillStyle = 'rgba(120,190,230,.22)'; ctx.beginPath(); ctx.roundRect(-w/2+3, h/2-16, w-6, 9, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,200,.9)'; ctx.fillRect(-w/2+2, -h/2+1, 7, 4); ctx.fillRect(w/2-9, -h/2+1, 7, 4);
    ctx.fillStyle = 'rgba(200,20,20,.9)'; ctx.fillRect(-w/2+2, h/2-5, 7, 4); ctx.fillRect(w/2-9, h/2-5, 7, 4);
    if(speedMul > 1.8 && this.spd > this.spd0*.5) {
      ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1.5;
      for(let i=0; i<3; i++) { const lx = -w/2+(i+.5)*(w/3); ctx.beginPath(); ctx.moveTo(lx, h/2); ctx.lineTo(lx, h/2+55); ctx.stroke(); }
    }
    ctx.restore();
  }
}

// ── Particles & Float Text ─────────────────────────
let floats=[],particles=[];
class FloatTxt{
  constructor(t,x,y){this.t=t;this.x=x;this.y=y;this.life=1.3;this.vy=2.2;for(let i=0;i<6;i++)particles.push(new Ptcl(x,y));}
  update(){this.y-=this.vy*speedMul;this.vy*=.97;this.life-=.022*speedMul;}
  draw(ctx){ctx.globalAlpha=Math.max(0,Math.min(1,this.life));ctx.fillStyle='#00d26a';ctx.shadowColor='#00d26a';ctx.shadowBlur=12;ctx.font='bold 34px Inter,sans-serif';ctx.fillText(this.t,this.x,this.y);ctx.shadowBlur=0;ctx.globalAlpha=1;}
}
class Ptcl{
  constructor(x,y){this.x=x;this.y=y;this.vx=(Math.random()-.5)*9;this.vy=(Math.random()-.5)*9-2;this.life=1;this.r=2+Math.random()*4;this.c=Math.random()<.5?'#00d26a':'#f5a623';}
  update(){this.x+=this.vx*speedMul;this.y+=this.vy*speedMul;this.vy+=.18;this.life-=.03*speedMul;}
  draw(ctx){ctx.globalAlpha=Math.max(0,this.life);ctx.fillStyle=this.c;ctx.beginPath();ctx.arc(this.x,this.y,Math.max(0,this.r*this.life),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}

// ── City 3D ───────────────────────────────────────
let cityData = null;
const PERSPECTIVE = 0.0006; 
function genCity(metro){
  const r=mkRng(metro?777:333), bldgs=[], sidewalks=[], grid=140;
  const roadW = 220; // Half-width of the clear road corridor
  const cityDepth = 500; // How deep each city extends from the road end
  const cityWidth = 600; // How wide each city is (centered on the road)

  // City Norte: above the N endpoint of the N-S highway
  const nY = N - 80; // Start just above the road end
  for(let cx = -cityWidth; cx <= cityWidth; cx += grid){
    for(let cy = nY - cityDepth; cy <= nY; cy += grid){
      if(Math.abs(cx) < roadW && cy > nY - 100) continue; // road gap
      if(r() < 0.18) continue;
      const w=70+r()*60, d=70+r()*60, h=(metro?150:40)+r()*(metro?700:100);
      if(metro && r()<0.12) h += 400+r()*300;
      bldgs.push({cx, cy, x:cx-w/2, y:cy-d/2, w, d, h, hue:metro?(190+r()*120):(210+r()*20), sat:metro?(30+r()*40):(10+r()*10), lit:metro?(10+r()*15):(15+r()*10), hasAntenna:metro&&r()<0.3, hasPad:metro&&r()<0.2});
      sidewalks.push({x:cx-grid/2, y:cy-grid/2, w:grid, d:grid});
    }
  }

  // City Sur: below the S endpoint of the N-S highway
  const sY = S + 80;
  for(let cx = -cityWidth; cx <= cityWidth; cx += grid){
    for(let cy = sY; cy <= sY + cityDepth; cy += grid){
      if(Math.abs(cx) < roadW && cy < sY + 100) continue;
      if(r() < 0.18) continue;
      const w=70+r()*60, d=70+r()*60, h=(metro?150:40)+r()*(metro?700:100);
      if(metro && r()<0.12) h += 400+r()*300;
      bldgs.push({cx, cy, x:cx-w/2, y:cy-d/2, w, d, h, hue:metro?(190+r()*120):(210+r()*20), sat:metro?(30+r()*40):(10+r()*10), lit:metro?(10+r()*15):(15+r()*10), hasAntenna:metro&&r()<0.3, hasPad:metro&&r()<0.2});
      sidewalks.push({x:cx-grid/2, y:cy-grid/2, w:grid, d:grid});
    }
  }

  // City Oeste: left of the W endpoint (only when road unlocked)
  if(state.roads.ew_highway){
    const wX = W - 80;
    for(let cx = wX - cityDepth; cx <= wX; cx += grid){
      for(let cy = -cityWidth; cy <= cityWidth; cy += grid){
        if(Math.abs(cy) < roadW && cx > wX - 100) continue;
        if(r() < 0.18) continue;
        const w=70+r()*60, d=70+r()*60, h=(metro?150:40)+r()*(metro?700:100);
        if(metro && r()<0.12) h += 400+r()*300;
        bldgs.push({cx, cy, x:cx-w/2, y:cy-d/2, w, d, h, hue:metro?(190+r()*120):(210+r()*20), sat:metro?(30+r()*40):(10+r()*10), lit:metro?(10+r()*15):(15+r()*10), hasAntenna:metro&&r()<0.3, hasPad:metro&&r()<0.2});
        sidewalks.push({x:cx-grid/2, y:cy-grid/2, w:grid, d:grid});
      }
    }
  }

  // City Este: right of the E endpoint (only when road unlocked)
  if(state.roads.ew_highway){
    const eX = E + 80;
    for(let cx = eX; cx <= eX + cityDepth; cx += grid){
      for(let cy = -cityWidth; cy <= cityWidth; cy += grid){
        if(Math.abs(cy) < roadW && cx < eX + 100) continue;
        if(r() < 0.18) continue;
        const w=70+r()*60, d=70+r()*60, h=(metro?150:40)+r()*(metro?700:100);
        if(metro && r()<0.12) h += 400+r()*300;
        bldgs.push({cx, cy, x:cx-w/2, y:cy-d/2, w, d, h, hue:metro?(190+r()*120):(210+r()*20), sat:metro?(30+r()*40):(10+r()*10), lit:metro?(10+r()*15):(15+r()*10), hasAntenna:metro&&r()<0.3, hasPad:metro&&r()<0.2});
        sidewalks.push({x:cx-grid/2, y:cy-grid/2, w:grid, d:grid});
      }
    }
  }

  return { bldgs, sidewalks, metro };
}
function drawWindows(ctx, bx, by, px, py, w, dir) {
  ctx.fillStyle = 'rgba(255,240,100,0.4)';
  for(let i=1; i<8; i++) {
    const t = i/8, hx = bx + px*t, hy = by + py*t;
    ctx.beginPath();
    if(dir==='N' || dir==='S') { for(let wx=8; wx<w-8; wx+=12) ctx.rect(hx+wx, hy, 4, 6); }
    else { for(let wy=8; wy<w-8; wy+=12) ctx.rect(hx, hy+wy, 6, 4); }
    ctx.fill();
  }
}
// Pre-generate static terrain features (seeded, stable)
let terrainData = null;
function genTerrain() {
  const r = mkRng(0xBEEF1234);
  const patches = [];
  // Grass patches scattered around the map
  for (let i = 0; i < 80; i++) {
    patches.push({
      type: 'grass',
      x: (r() - 0.5) * WORLD * 0.9,
      y: (r() - 0.5) * WORLD * 0.9,
      w: 80 + r() * 200,
      h: 60 + r() * 150,
      rot: r() * Math.PI,
      shade: 0.6 + r() * 0.4,
    });
  }
  // Parks (larger green blobs with trees)
  const parks = [];
  for (let i = 0; i < 12; i++) {
    parks.push({
      x: (r() - 0.5) * WORLD * 0.8,
      y: (r() - 0.5) * WORLD * 0.8,
      r: 80 + r() * 140,
    });
  }
  // Trees inside parks
  const trees = [];
  for (const pk of parks) {
    const n = 5 + Math.floor(r() * 12);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, rd = r() * pk.r * 0.85;
      trees.push({ x: pk.x + Math.cos(a) * rd, y: pk.y + Math.sin(a) * rd, r: 12 + r() * 14 });
    }
  }
  // Parking lots (grey rectangles)
  const parkings = [];
  for (let i = 0; i < 18; i++) {
    parkings.push({
      x: (r() - 0.5) * WORLD * 0.85,
      y: (r() - 0.5) * WORLD * 0.85,
      w: 60 + r() * 120,
      h: 40 + r() * 80,
    });
  }
  // Dirt patches
  const dirts = [];
  for (let i = 0; i < 30; i++) {
    dirts.push({
      x: (r() - 0.5) * WORLD * 0.9,
      y: (r() - 0.5) * WORLD * 0.9,
      rx: 30 + r() * 80,
      ry: 20 + r() * 50,
      rot: r() * Math.PI,
    });
  }
  return { patches, parks, trees, parkings, dirts };
}

function drawTerrain(ctx) {
  if (!terrainData) terrainData = genTerrain();
  const { patches, parks, trees, parkings, dirts } = terrainData;
  const metro = state.isMetropolis;

  // Base ground color — dark olive/forest green
  ctx.fillStyle = metro ? '#0a0f08' : '#111a0d';
  ctx.fillRect(-HW, -HW, WORLD, WORLD);

  // Subtle grid pattern (urban lot feel)
  ctx.strokeStyle = metro ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  const grid = 160;
  for (let x = -HW; x <= HW; x += grid) { ctx.beginPath(); ctx.moveTo(x, -HW); ctx.lineTo(x, HW); ctx.stroke(); }
  for (let y = -HW; y <= HW; y += grid) { ctx.beginPath(); ctx.moveTo(-HW, y); ctx.lineTo(HW, y); ctx.stroke(); }

  // Grass patches
  for (const p of patches) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.fillStyle = metro
      ? `rgba(15,30,10,${0.4 * p.shade})`
      : `rgba(20,50,12,${0.55 * p.shade})`;
    ctx.beginPath(); ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Parks (brighter green blobs)
  for (const pk of parks) {
    const g = ctx.createRadialGradient(pk.x, pk.y, 0, pk.x, pk.y, pk.r);
    g.addColorStop(0, metro ? 'rgba(20,55,15,0.7)' : 'rgba(28,72,18,0.75)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(pk.x, pk.y, pk.r, 0, Math.PI * 2); ctx.fill();
  }

  // Dirt patches
  for (const d of dirts) {
    ctx.save();
    ctx.translate(d.x, d.y); ctx.rotate(d.rot);
    ctx.fillStyle = 'rgba(60,40,20,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 0, d.rx, d.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Parking lots
  for (const pk of parkings) {
    ctx.fillStyle = 'rgba(40,50,40,0.35)';
    ctx.fillRect(pk.x - pk.w / 2, pk.y - pk.h / 2, pk.w, pk.h);
    // Parking stripes
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const stripeW = 14;
    for (let sx = pk.x - pk.w / 2 + stripeW; sx < pk.x + pk.w / 2; sx += stripeW) {
      ctx.beginPath(); ctx.moveTo(sx, pk.y - pk.h / 2); ctx.lineTo(sx, pk.y + pk.h / 2); ctx.stroke();
    }
  }

  // Trees (dark green canopy circles with shadow)
  for (const t of trees) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(t.x + 5, t.y + 8, t.r * 0.9, t.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    // Canopy
    const tg = ctx.createRadialGradient(t.x - t.r * 0.2, t.y - t.r * 0.2, 0, t.x, t.y, t.r);
    tg.addColorStop(0, metro ? '#1a4020' : '#1e5c18');
    tg.addColorStop(1, metro ? '#0d2510' : '#122e0b');
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.25, t.y - t.r * 0.25, t.r * 0.35, 0, Math.PI * 2); ctx.fill();
  }

  // Central roundabout / junction decorative circle
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 220);
  cg.addColorStop(0, metro ? 'rgba(15,25,10,0.9)' : 'rgba(18,35,10,0.85)');
  cg.addColorStop(0.6, metro ? 'rgba(10,18,8,0.5)' : 'rgba(14,28,8,0.4)');
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(0, 0, 220, 0, Math.PI * 2); ctx.fill();
  // Inner decorative ring
  ctx.strokeStyle = metro ? 'rgba(100,255,80,0.06)' : 'rgba(80,200,60,0.07)';
  ctx.lineWidth = 3;
  ctx.setLineDash([15, 10]);
  ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);

  // Vignette around world edge
  const vg = ctx.createRadialGradient(0, 0, WORLD * 0.35, 0, 0, HW * 1.4);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vg;
  ctx.fillRect(-HW, -HW, WORLD, WORLD);
}

function drawTrafficLights(ctx) {
  if (!state.roads.ew_highway) return;
  
  const dist = I + 20; 
  const corners = [
    { x: -dist, y: -dist, isNS: false, rot: 0 }, 
    { x: dist, y: -dist, isNS: true, rot: Math.PI/2 }, 
    { x: dist, y: dist, isNS: false, rot: 0 }, 
    { x: -dist, y: dist, isNS: true, rot: Math.PI/2 } 
  ];
  
  corners.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(-10, -30, 20, 60, 5); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
    
    let color = 'RED';
    if (c.isNS) {
      if (state.trafficPhase === 0) color = 'GREEN';
      else if (state.trafficPhase === 1) color = 'YELLOW';
    } else {
      if (state.trafficPhase === 2) color = 'GREEN';
      else if (state.trafficPhase === 3) color = 'YELLOW';
    }

    const drawBulb = (y, isActive, hex, glow) => {
      ctx.fillStyle = isActive ? hex : '#111';
      ctx.shadowColor = isActive ? glow : 'transparent';
      ctx.shadowBlur = isActive ? 15 : 0;
      ctx.beginPath(); ctx.arc(0, y, 6, 0, Math.PI*2); ctx.fill();
    };

    drawBulb(-16, color === 'RED', '#ff2a2a', '#ff0000');
    drawBulb(0, color === 'YELLOW', '#ffb800', '#ffaa00');
    drawBulb(16, color === 'GREEN', '#00d26a', '#00ff88');
    
    ctx.restore();
  });
}

function drawCity(ctx){
  if(!cityData) cityData = genCity(state.isMetropolis);
  const {bldgs, sidewalks, metro} = cityData;

  // Draw terrain first (replaces the flat black fill)
  drawTerrain(ctx);

  // Sidewalks on top of terrain
  ctx.fillStyle=metro?'#1a2010':'#1c2414'; sidewalks.forEach(s => ctx.fillRect(s.x+8, s.y+8, s.w-16, s.d-16));
  const vW = canvas.width/cam.zoom, vH = canvas.height/cam.zoom, cX = cam.x, cY = cam.y;
  let vis = [];
  for(let i=0; i<bldgs.length; i++){
    const b = bldgs[i], px = (b.cx - cX)*b.h*PERSPECTIVE, py = (b.cy - cY)*b.h*PERSPECTIVE;
    const minX = Math.min(b.x, b.x+px), maxX = Math.max(b.x+b.w, b.x+b.w+px);
    const minY = Math.min(b.y, b.y+py), maxY = Math.max(b.y+b.d, b.y+b.d+py);
    if(maxX < cX-vW/2-100 || minX > cX+vW/2+100 || maxY < cY-vH/2-100 || minY > cY+vH/2+100) continue;
    vis.push({ b, px, py, dSq: (b.cx-cX)**2 + (b.cy-cY)**2 });
  }
  vis.sort((a,b) => b.dSq - a.dSq);
  for(let i=0; i<vis.length; i++){
    const {b, px, py} = vis[i], bx = b.x, by = b.y, bw = b.w, bd = b.d, rx = bx+px, ry = by+py;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx+bw, by); ctx.lineTo(bx+bw+px*0.5, by+bd+py*0.5); ctx.lineTo(bx+px*0.5, by+bd+py*0.5); ctx.fill();
    const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0],pts[1]); ctx.lineTo(pts[2],pts[3]); ctx.lineTo(pts[4],pts[5]); ctx.lineTo(pts[6],pts[7]); ctx.closePath(); ctx.fill(); };
    if(py > 0) { ctx.fillStyle = `hsl(${b.hue},${b.sat}%,${b.lit}%)`; poly([bx, by, bx+bw, by, rx+bw, ry, rx, ry]); if(metro) drawWindows(ctx, bx, by, px, py, bw, 'N'); }
    else if(py < 0) { ctx.fillStyle = `hsl(${b.hue},${b.sat}%,${b.lit-8}%)`; poly([bx, by+bd, bx+bw, by+bd, rx+bw, ry+bd, rx, ry+bd]); if(metro) drawWindows(ctx, bx, by+bd, px, py, bw, 'S'); }
    if(px > 0) { ctx.fillStyle = `hsl(${b.hue},${b.sat}%,${b.lit-4}%)`; poly([bx, by, bx, by+bd, rx, ry+bd, rx, ry]); if(metro) drawWindows(ctx, bx, by, px, py, bd, 'W'); }
    else if(px < 0) { ctx.fillStyle = `hsl(${b.hue},${b.sat}%,${b.lit-12}%)`; poly([bx+bw, by, bx+bw, by+bd, rx+bw, ry+bd, rx+bw, ry]); if(metro) drawWindows(ctx, bx+bw, by, px, py, bd, 'E'); }
    ctx.fillStyle = `hsl(${b.hue},${b.sat-5}%,${b.lit+10}%)`; ctx.fillRect(rx, ry, bw, bd);
    ctx.strokeStyle = `hsl(${b.hue},${b.sat}%,${b.lit-5}%)`; ctx.lineWidth = 2; ctx.strokeRect(rx+2, ry+2, bw-4, bd-4);
    if(b.hasPad) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(rx+bw/2, ry+bd/2, Math.min(bw,bd)*0.3, 0, Math.PI*2); ctx.fill(); }
    if(b.hasAntenna) {
      ctx.fillStyle = '#111'; ctx.fillRect(rx+bw*0.8, ry+bd*0.2, 4, 4);
      if(Date.now()/1000 % 2 < 1.0) { ctx.fillStyle = '#ff2a2a'; ctx.shadowColor = '#f00'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(rx+bw*0.8+px*0.2+2, ry+bd*0.2+py*0.2+2, 3, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
    }
  }
  ctx.font=`${metro?800:600} ${metro?50:40}px Orbitron,sans-serif`; ctx.fillStyle=metro?'rgba(245,166,35,.55)':'rgba(255,255,255,.2)';
  ctx.fillText(metro?'METRÓPOLIS NORTE':'VILLA NORTE',-260,-1200); ctx.fillText(metro?'METRÓPOLIS SUR':'PUEBLO SUR',-220,1200);
  if(state.roads.ew_highway){ctx.save();ctx.translate(-1200,60);ctx.rotate(-Math.PI/2);ctx.fillText(metro?'METRÓPOLIS OESTE':'CIUDAD OESTE',-180,0);ctx.restore();}
  if(state.roads.ew_highway){ctx.save();ctx.translate(1200,-60);ctx.rotate(Math.PI/2);ctx.fillText(metro?'METRÓPOLIS ESTE':'CIUDAD ESTE',-180,0);ctx.restore();}
}

// ── Minimap ───────────────────────────────────────
function drawMinimap(){
  const W = mm.width, sc = W/WORLD;
  mmCtx.fillStyle = '#0d1a0d'; mmCtx.fillRect(0,0,W,W);
  state.activeNodes.forEach(seg => {
    mmCtx.strokeStyle = '#3a3a3a'; mmCtx.lineWidth = seg.lanes*LW*sc*2; mmCtx.lineCap = 'round';
    mmCtx.beginPath(); seg.pts.forEach(({x,y}, i) => i ? mmCtx.lineTo((x+HW)*sc, (y+HW)*sc) : mmCtx.moveTo((x+HW)*sc, (y+HW)*sc)); mmCtx.stroke();
    if(seg.isToll){ const ts=seg.at(seg.length*0.7); mmCtx.fillStyle='#f5a623'; mmCtx.beginPath(); mmCtx.arc((ts.x+HW)*sc,(ts.y+HW)*sc,3,0,Math.PI*2); mmCtx.fill(); }
  });
  state.cars.forEach(c => { const {x,y} = c.posXY; mmCtx.fillStyle = c.p.body; mmCtx.fillRect((x+HW)*sc-2, (y+HW)*sc-2, 4, 4); });
  const vw = (canvas.width/cam.zoom)*sc, vh = (canvas.height/cam.zoom)*sc;
  mmCtx.strokeStyle = 'rgba(255,255,255,.45)'; mmCtx.lineWidth = 1.2; mmCtx.strokeRect((cam.x-canvas.width/(2*cam.zoom)+HW)*sc, (cam.y-canvas.height/(2*cam.zoom)+HW)*sc, vw, vh);
}

// ── UI & Core ─────────────────────────────────────
const $ = id => document.getElementById(id);
const tolBtn = $('upgrade-toll-btn'), metroBtn = $('expand-metropolis-btn');

function initUI() {
  const c = $('dynamic-roads-container');
  let html = '';
  ROAD_ITEMS.forEach(r => {
    html += `<button class="upgrade-btn locked" data-id="${r.id}">
      <div class="upgrade-icon">${r.icon}</div>
      <div class="upgrade-info">
        <div class="upgrade-name">${r.name}</div>
        <div class="upgrade-desc">${r.desc}</div>
      </div>
      <div class="upgrade-cost">
        <div class="cost-label">Costo</div>
        <div class="cost-value">$<span class="cost-val">${r.cost}</span></div>
      </div>
    </button>`;
  });
  c.innerHTML = html;
  c.addEventListener('click', e => {
    const btn = e.target.closest('.upgrade-btn');
    if(!btn) return;
    const id = btn.dataset.id;
    const item = ROAD_ITEMS.find(r=>r.id===id);
    if(btn.disabled || state.money < item.cost) return;
    state.money -= item.cost;
    state.roads[id] = true;
    syncGraph();
    if(id === 'ew_highway') {
      cityData = genCity(state.isMetropolis);
      // Redistribute existing cars evenly across all new entrances so they don't just stay N-S
      const ins = [segs.n_in, segs.s_in, segs.w_in, segs.e_in].filter(s => state.activeNodes.includes(s));
      state.cars.forEach(c => {
        c.seg = ins[Math.floor(Math.random() * ins.length)];
        c.dist = Math.random() * c.seg.length * 0.5;
        c.lane = Math.floor(Math.random() * c.seg.lanes);
        c.posXY = c.seg.at(c.dist);
      });
    }
    gsap.from(btn, {scale:.92,duration:.3,ease:'back.out(2)'});
    updateUI();
  });
}

function animMoney() { const m = $('money').parentElement; m.classList.remove('pop-anim'); void m.offsetWidth; m.classList.add('pop-anim'); }
function showLvlUp(l) { $('levelup-text').textContent = `Has alcanzado el Nivel ${l}`; const lt = $('levelup-toast'); gsap.fromTo(lt,{opacity:0,scale:.6},{opacity:1,scale:1,duration:.5,ease:'back.out(1.7)'}); gsap.to(lt,{opacity:0,scale:.8,duration:.4,ease:'power2.in',delay:2.3}); gsap.from('#level-display',{scale:2,duration:.5,ease:'back.out(2)'}); }
function gainXP(n) { state.xp+=n; while(state.xp >= state.xpToNextLevel){ state.level++; state.xp-=state.xpToNextLevel; state.xpToNextLevel=Math.floor(state.xpToNextLevel*1.6); showLvlUp(state.level); } }

function fmt(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e4) return (n/1e3).toFixed(1) + 'k';
  return Math.floor(n).toLocaleString();
}

function updateUI() {
  $('money').textContent = fmt(state.money);
  $('car-cost').textContent = fmt(state.carCost);
  $('toll-cost').textContent = fmt(state.tollUpgradeCost);
  $('metro-cost').textContent = fmt(state.metroUpgradeCost);
  $('level-display').textContent = state.level; 
  $('income-rate').textContent = fmt(state.tollRevenue);
  if ($('eps')) $('eps').textContent = fmt(state.eps);
  $('car-count').textContent = state.cars.length; $('road-count').textContent = state.activeNodes.length;
  $('xp-bar-fill').style.width = Math.min(100, (state.xp/state.xpToNextLevel)*100) + '%';
  $('buy-car-btn').disabled = state.money < state.carCost;
  
  if(state.level>=2){ tolBtn.classList.remove('locked'); $('toll-desc').textContent='Más ingresos por coche'; tolBtn.disabled = state.money<state.tollUpgradeCost; } else tolBtn.disabled=true;

  if(state.level>=5){
    metroBtn.classList.remove('locked'); $('metro-desc').textContent=state.isMetropolis?'★ Metrópolis Activa':'Ampliar a Metrópolis de 5 carriles';
    metroBtn.disabled = state.money<state.metroUpgradeCost || state.isMetropolis;
    if(state.isMetropolis){ metroBtn.querySelector('.upgrade-name').textContent='★ Metrópolis'; metroBtn.querySelector('.upgrade-cost').style.display='none'; }
  } else metroBtn.disabled=true;

  ROAD_ITEMS.forEach(r => {
    const btn = document.querySelector(`button[data-id="${r.id}"]`);
    if(!btn) return;
    const unlocked = state.roads[r.id];
    const reqMet = !r.req || state.roads[r.req];
    
    // Only show if requirement met OR it's the base road and level >= 3
    if(!reqMet || (r.id === 'ew_highway' && state.level < 3)) { 
      btn.style.display = 'none'; 
      return; 
    }
    
    btn.style.display = 'flex';
    if (unlocked) {
      btn.classList.remove('locked');
      btn.disabled = true;
      btn.querySelector('.upgrade-name').textContent = r.name + ' ✓';
      btn.querySelector('.upgrade-cost').style.display = 'none';
      btn.style.opacity = 0.5; // Visual hint that it's completed
    } else {
      btn.classList.remove('locked');
      btn.disabled = state.money < r.cost;
      btn.style.opacity = btn.disabled ? 0.6 : 1;
      const cv = btn.querySelector('.cost-val');
      if (cv) cv.textContent = fmt(r.cost);
    }
  });
}

$('admin-toggle-btn').addEventListener('click', e => { e.stopPropagation(); const p = $('admin-panel'); p.classList.toggle('hidden'); gsap.to(e.target,{rotation:p.classList.contains('hidden')?0:90,duration:.3}); });
$('admin-money-btn').addEventListener('click', e => { e.stopPropagation(); state.money+=50000; animMoney(); updateUI(); });
$('admin-xp-btn').addEventListener('click', e => { e.stopPropagation(); gainXP(5000); updateUI(); });
$('admin-reset-btn').addEventListener('click', e => { location.reload(); });

$('buy-car-btn').addEventListener('click', () => {
  if(state.money < state.carCost) return;
  state.money -= state.carCost;
  const ins = [segs.n_in, segs.s_in, segs.w_in, segs.e_in].filter(s => state.activeNodes.includes(s));
  state.cars.push(new Car(ins[Math.floor(Math.random()*ins.length)]));
  state.carCost = Math.ceil(state.carCost*1.5);
  gsap.from($('buy-car-btn'), {scale:.92,duration:.3,ease:'back.out(2)'}); updateUI();
});
tolBtn.addEventListener('click', () => {
  if(state.money < state.tollUpgradeCost) return;
  state.money -= state.tollUpgradeCost; state.tollRevenue++;
  state.tollUpgradeCost = Math.ceil(state.tollUpgradeCost*2);
  gsap.from(tolBtn, {scale:.92,duration:.3,ease:'back.out(2)'}); updateUI();
});
metroBtn.addEventListener('click', () => {
  if(state.money < state.metroUpgradeCost || state.isMetropolis) return;
  state.money -= state.metroUpgradeCost; state.isMetropolis = true;
  Object.values(segs).forEach(s => s.lanes = 5);
  cityData = genCity(true);
  gsap.from(metroBtn, {scale:.92,duration:.3,ease:'back.out(2)'}); updateUI();
});

// ── Camera ────────────────────────────────────────
let isDown=false, isDrag=false, lastP={x:0,y:0}, suT=null;
const pc = e => e.touches ? {x:e.touches[0].clientX, y:e.touches[0].clientY} : {x:e.clientX, y:e.clientY};
function onPD(e){ if(e.target.closest('.ui-panel, .admin-toggle, .admin-panel, .upgrade-btn')) return; isDown=true; isDrag=false; lastP=pc(e); suT=setTimeout(()=>{if(!isDrag){speedMul=3; speedFX.classList.add('active');}},150); }
function onPM(e){ if(!isDown) return; const c=pc(e), dx=c.x-lastP.x, dy=c.y-lastP.y; if(Math.abs(dx)>4 || Math.abs(dy)>4){ isDrag=true; clearTimeout(suT); speedMul=1; speedFX.classList.remove('active'); cam.x=Math.max(-HW,Math.min(HW,cam.x-dx/cam.zoom)); cam.y=Math.max(-HW,Math.min(HW,cam.y-dy/cam.zoom)); } lastP=c; }
function onPU(){ isDown=false; isDrag=false; speedMul=1; speedFX.classList.remove('active'); clearTimeout(suT); }
addEventListener('mousedown',onPD); addEventListener('mousemove',onPM); addEventListener('mouseup',onPU);
addEventListener('touchstart',onPD,{passive:false}); addEventListener('touchmove',onPM,{passive:false}); addEventListener('touchend',onPU);
addEventListener('wheel', e => { if(e.target.closest('#ui-container')) return; e.preventDefault(); cam.zoom=Math.max(.15,Math.min(2.5,cam.zoom-e.deltaY*.0008)); }, {passive:false});

// ── Loop ──────────────────────────────────────────
function init() {
  createGraph();
  syncGraph();
  initUI();
  state.cars.push(new Car(segs.n_in));
  updateUI();
}

let prevT = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - prevT) / 1000); prevT = ts;
  
  if (state.roads.ew_highway) {
    state.trafficTimer += dt * speedMul;
    if (state.trafficPhase === 0 && state.trafficTimer > 4.5) { state.trafficPhase = 1; state.trafficTimer = 0; }
    else if (state.trafficPhase === 1 && state.trafficTimer > 1.5) { state.trafficPhase = 2; state.trafficTimer = 0; }
    else if (state.trafficPhase === 2 && state.trafficTimer > 4.5) { state.trafficPhase = 3; state.trafficTimer = 0; }
    else if (state.trafficPhase === 3 && state.trafficTimer > 1.5) { state.trafficPhase = 0; state.trafficTimer = 0; }
  }

  // EPS Calculation
  state.epsTimer += dt;
  if (state.epsTimer >= 0.5) {
    const currentRate = state.earnedAccum / state.epsTimer;
    state.eps = state.eps === 0 ? currentRate : (state.eps * 0.6 + currentRate * 0.4);
    state.earnedAccum = 0;
    state.epsTimer = 0;
    updateUI();
  }

  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = '#060c08'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
  
  drawCity(ctx);
  
  // Roads (Multi-pass rendering for perfect intersection and overlaps)
  state.activeNodes.forEach(s => s.draw(ctx, 0)); // Pass 0: Shadows
  state.activeNodes.forEach(s => s.draw(ctx, 1)); // Pass 1: Asphalt
  state.activeNodes.forEach(s => s.draw(ctx, 2)); // Pass 2: Lines and Details
  
  if (state.roads.ew_highway) drawTrafficLights(ctx); // Draw lights OVER roads
  
  state.cars.forEach(c => c.update(dt));
  state.cars.forEach(c => c.draw(ctx));
  
  particles = particles.filter(p=>p.life>0); particles.forEach(p=>{p.update(); p.draw(ctx);});
  floats = floats.filter(f=>f.life>0); floats.forEach(f=>{f.update(); f.draw(ctx);});
  
  drawMinimap();
  requestAnimationFrame(loop);
}

init();
requestAnimationFrame(loop);
