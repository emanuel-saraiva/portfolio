(() => {
  const visual = document.querySelector('.premium-home .hero-visual');
  if (!visual) return;
  const stages = ['stage-sources', 'stage-transform', 'stage-analytics'].map(id => document.getElementById(id));
  if (stages.some(stage => !stage)) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('pipeline-flow-overlay');
  svg.setAttribute('aria-hidden', 'true');
  const routeLayer = document.createElementNS(NS, 'g');
  const portsLayer = document.createElementNS(NS, 'g');
  const particlesLayer = document.createElementNS(NS, 'g');
  svg.append(routeLayer, portsLayer, particlesLayer);
  visual.appendChild(svg);

  const mk = (name, attributes, parent) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key,value]) => node.setAttribute(key,String(value)));
    parent.appendChild(node);
    return node;
  };

  let segments = [], ports = [], totalDuration = 0;
  const particle = mk('circle', {r:5.2,class:'flow-particle'},particlesLayer);
  const trail = Array.from({length:8}, (_,i) =>
    mk('circle',{r:(4-i*.36).toFixed(2),class:'flow-trail-dot',opacity:(.4-i*.045).toFixed(2)},particlesLayer)
  );

  const point = (el, x, y, parentRect) => {
    const r=el.getBoundingClientRect();
    return {x:r.left-parentRect.left+r.width*x,y:r.top-parentRect.top+r.height*y};
  };

  function rebuild() {
    const bounds=visual.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    routeLayer.replaceChildren();
    portsLayer.replaceChildren();
    const [s,t,a]=stages;
    const sTop=point(s,.48,0,bounds),sRight=point(s,1,.5,bounds);
    const tLeft=point(t,0,.5,bounds),tRight=point(t,1,.5,bounds);
    const aLeft=point(a,0,.5,bounds),aTop=point(a,.49,0,bounds);
    const origin={x:sTop.x+43,y:Math.max(35,sTop.y-58)};
    const curveY=Math.max(41,Math.min(origin.y-4,aTop.y-58));

    const definitions=[
      {d:`M ${origin.x} ${origin.y} Q ${origin.x-30} ${origin.y+8} ${sTop.x} ${sTop.y}`,active:0},
      {d:`M ${sRight.x} ${sRight.y} L ${tLeft.x} ${tLeft.y}`,active:1},
      {d:`M ${tRight.x} ${tRight.y} L ${aLeft.x} ${aLeft.y}`,active:2},
      {d:`M ${aTop.x} ${aTop.y} C ${aTop.x+50} ${curveY} ${origin.x+45} ${origin.y-12} ${origin.x} ${origin.y}`,active:-1}
    ];
    // Return tangent matches the curved entrance for a continuous orbit feel.
    // One moving dot; separate routes avoid drawing through the cards.
    const paths=definitions.map(({d})=>mk('path',{d,class:'flow-guide'},routeLayer));
    const lengths=paths.map(path=>path.getTotalLength());
    // Pixels per second. Slower transitions between the boxes.
    const speeds=[85,75,75,150];
    segments=paths.map((path,i)=>({path,length:lengths[i],duration: Math.max(380,lengths[i]/speeds[i]*1000),active:definitions[i].active}));
    // A short dwell at each stage makes each activation readable.
    // Keep every SVG path unchanged: no geometry edits.
    const holds = [700, 700, 800, 0];
    segments.forEach((segment, i) => { segment.hold = holds[i]; });
    totalDuration=segments.reduce((sum,item)=>sum+item.duration+item.hold,0);
    ports=[
      mk('circle',{cx:sTop.x,cy:sTop.y,r:3.3,class:'flow-port'},portsLayer),
      mk('circle',{cx:tLeft.x,cy:tLeft.y,r:3.3,class:'flow-port'},portsLayer),
      mk('circle',{cx:aLeft.x,cy:aLeft.y,r:3.3,class:'flow-port'},portsLayer)
    ];
  }

  let start=0, pausedAt=null, frameId=0;
  function draw(time) {
    if (!totalDuration) {frameId=requestAnimationFrame(draw);return;}
    if (!start) start=time;
    const elapsed=(time-start)%totalDuration;
    let partial=elapsed, index=0;
    for (;index<segments.length-1;index++) {
      const segmentTime = segments[index].duration + segments[index].hold;
      if (partial < segmentTime) break;
      partial -= segmentTime;
    }

    const seg=segments[index];
    const moving=partial < seg.duration;
    const progress=moving ? Math.min(1,partial/seg.duration) : 1;
    const loc=seg.path.getPointAtLength(seg.length*progress);

    // Stay visible on contact; only then fade out while the stage is lit.
    const smoothstep = t => t * t * (3 - 2 * t);
    let handoffFade = 1;
    if (!moving && index < 3) {
      const holdElapsed = partial - seg.duration;
      const visibleOnContactMs = 210;
      const fadeOutMs = 390;
      const fadeProgress = Math.min(1, Math.max(0,
        (holdElapsed - visibleOnContactMs) / fadeOutMs
      ));
      handoffFade = 1 - smoothstep(fadeProgress);
    }
    // Fade in after the transition to the next connector.
    if (moving && index > 0 && index < 3) {
      handoffFade *= smoothstep(Math.min(1, partial / 320));
    }

    // Hide the seam between return and entrance: disappear well before the
    // return finishes, travel the remaining orbit invisibly, then reappear
    // only when approaching the Sources card.
    const clamp01 = value => Math.max(0, Math.min(1, value));
    const entranceFade = index === 0
	? smoothstep(clamp01((progress - .76) / .18))
	: 1;

	const exitFade = index === 3
	? 1 - smoothstep(clamp01((progress - .78) / .20))
	: 1;
    const visibility = Math.max(0, entranceFade * exitFade * handoffFade);
    particle.setAttribute('cx',loc.x);
    particle.setAttribute('cy',loc.y);
    particle.setAttribute('opacity',visibility);

    trail.forEach((dot,i)=>{
      const pos=seg.path.getPointAtLength(Math.max(0,seg.length*progress-(i+1)*4.5));
      dot.setAttribute('cx',pos.x);
      dot.setAttribute('cy',pos.y);
      dot.setAttribute('opacity',Math.max(0,(.39-i*.04)*visibility));
    });

    // Each stage lights up at the moment the comet arrives and stays lit
    // while it is held there; the following stage activates at the next arrival.
    const arrived = !moving || progress >= .995;
    const activeCount=index===3 ? 3 : index+(arrived?1:0);
    stages.forEach((stage,i)=>stage.classList.toggle('is-flow-active',i<activeCount));
    ports.forEach((port,i)=>port.classList.toggle('is-reached',i<activeCount));
    frameId=requestAnimationFrame(draw);
  }

  if (reduced) {
    stages.forEach(stage=>stage.classList.add('is-flow-active'));
    return;
  }
  rebuild();
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(visual);
  else window.addEventListener('resize',rebuild,{passive:true});
  frameId=requestAnimationFrame(draw);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){pausedAt=performance.now();cancelAnimationFrame(frameId)}
    else {if(pausedAt&&start) start+=performance.now()-pausedAt;pausedAt=null;frameId=requestAnimationFrame(draw)}
  });
})();