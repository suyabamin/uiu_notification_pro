/**
 * @module ucam-login-detector
 * @description Placeholder content script for UCAM login state detection.
 */

import { browser } from '../shared/browser';

const loggedIn = !document.querySelector('#ctl00_ContentPlaceHolder1_txtUserName');
void browser.runtime.sendMessage({ type: 'LOGIN_STATE_CHANGED', loggedIn });
