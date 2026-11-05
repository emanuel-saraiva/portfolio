
(() => {
  const wireOnePacket = document.querySelector('.wire-one .packet');
  const wireTwoPacket = document.querySelector('.wire-two .packet');
  const stageTransform = document.getElementById('stage-transform');
  const stageAnalytics = document.getElementById('stage-analytics');
  if (!wireOnePacket || !wireTwoPacket || !stageTransform || !stageAnalytics) return;

  const moveDuration = 1350;
  const transformPause = 250;
  const analyticsPause = 420;
  const restartPause = 650;

  function pulse(el){
    el.classList.remove('stage-glow');
    void el.offsetWidth;
    el.classList.add('stage-glow');
  }

  function startPacket(packet){
    packet.classList.remove('is-moving');
    void packet.offsetWidth;
    packet.classList.add('is-moving');
  }

  function cycle(){
    startPacket(wireOnePacket);
    setTimeout(() => {
      pulse(stageTransform);
      startPacket(wireTwoPacket);
      setTimeout(() => {
        pulse(stageAnalytics);
        setTimeout(cycle, restartPause);
      }, moveDuration + analyticsPause);
    }, moveDuration + transformPause);
  }

  // Stagger first run slightly so the page can settle.
  setTimeout(cycle, 800);
})();
