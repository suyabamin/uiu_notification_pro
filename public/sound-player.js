chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'PLAY_NOTIFICATION_SOUND') return;
  const audio = document.getElementById('notification-sound');
  if (audio) {
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }
});
