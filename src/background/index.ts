/**
 * @module background-index
 * @description Starts the extension background service worker.
 */

import { registerMessageRouter } from './message-router';
import { registerAlarmManager, scheduleCheck } from './alarm-manager';
import { registerNotificationClicks } from './notification-dispatcher';
import '../adapters/elms';
import '../adapters/ucam';
import { info } from '../shared/logger';
import './firefox-sound';

info('UniPortal Monitor service worker started.');
registerMessageRouter();
registerAlarmManager();
registerNotificationClicks();
void scheduleCheck();
