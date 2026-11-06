/** @module elms-settings @description Session status and login controls for ELMS. */

import { browser } from '../../shared/browser';

/** Renders the ELMS session status and login action. @param props Current connection state and callbacks. @returns ELMS settings content. */
export default function ElmsSettings(props: {
  status: 'unknown' | 'connected' | 'logged-out';
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}): React.JSX.Element {
  const label = props.status === 'connected' ? 'Connected' : props.status === 'unknown' ? 'Checking…' : 'Not logged in';
  const badgeClass = props.status === 'connected' ? 'text-emerald-700' : 'text-amber-700';
  return <div className="space-y-5">
    <p>Status: <span className={`font-semibold ${badgeClass}`}>{label}</span></p>
    <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={props.enabled} onChange={(event) => props.onEnabledChange(event.target.checked)} className="h-4 w-4 accent-emerald-700" />Enable ELMS monitoring</label>
    <button className="rounded bg-emerald-800 px-4 py-2 text-white" onClick={() => void browser.tabs.create({ url: 'https://elms.uiu.ac.bd/login/index.php' })}>Log in to ELMS</button>
  </div>;
}
