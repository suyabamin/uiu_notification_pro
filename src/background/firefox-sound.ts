/** @module firefox-sound @description Plays the notification WAV from Firefox's DOM-backed event page. */

import { browser } from '../shared/browser';
import { warn } from '../shared/logger';

/** Plays the packaged WAV in the Firefox event page. @returns Nothing. */
export async function playFirefoxSound(): Promise<void> {
  if (typeof document === 'undefined') throw new Error('Firefox audio playback requires its DOM-backed event page.');
  let audio = document.getElementById('notify-sound') as HTMLAudioElement | null;
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'notify-sound';
    audio.src = browser.runtime.getURL('sounds/notify.wav');
    audio.preload = 'auto';
    document.body.append(audio);
  }
  audio.currentTime = 0;
  await audio.play();
}

browser.runtime.onMessage.addListener((message: unknown) => {
  if (!isPlaySoundMessage(message)) return undefined;
  return playFirefoxSound().then(() => ({ played: true })).catch((error: unknown) => {
    warn('Firefox custom sound could not play', error);
    return { played: false };
  });
});

function isPlaySoundMessage(message: unknown): message is { type: 'PLAY_SOUND' } {
  return typeof message === 'object' && message !== null && 'type' in message && message.type === 'PLAY_SOUND';
}
