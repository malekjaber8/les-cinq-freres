/* ================================================================
   PRESENCE — Suivi des visiteurs en ligne (temps réel, lecture admin)
   ================================================================ */
(function () {
  function heartbeat() {
    if (typeof db === 'undefined') return;
    if (document.visibilityState === 'hidden') return;

    let sessionId = sessionStorage.getItem('5f_visitor_id');
    if (!sessionId) {
      sessionId = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem('5f_visitor_id', sessionId);
    }

    db.collection('presence').doc(sessionId).set({
      lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      page: location.pathname
    }).catch(() => {});
  }

  heartbeat();
  setInterval(heartbeat, 20000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') heartbeat();
  });
})();
