/**
 * @module popup-app
 * @description Recent updates, portal status, and quick monitor controls.
 */

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, CalendarClock, Check, Clock3, FileText, GraduationCap, Settings2, Volume2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { browser } from '../shared/browser';
import type { MonitorState, Update } from '../shared/types';

const PORTAL_LOGIN = 'https://ucam.uiu.ac.bd/Security/LogIn.aspx';
const ELMS_LOGIN = 'https://elms.uiu.ac.bd/login/index.php';

/** Renders the full monitor popup. @returns Popup content. */
export default function App(): React.JSX.Element {
  const [state, setState] = useState<MonitorState | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      setState(await browser.runtime.sendMessage({ type: 'GET_STATE' }) as MonitorState);
      setError('');
    } catch { setError('Could not read extension status. Reload the extension and try again.'); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const send = async (message: { type: string; [key: string]: unknown }) => {
    try { await browser.runtime.sendMessage(message); await refresh(); }
    catch { setError('The action could not be completed. Please try again.'); }
  };
  const checkNow = async () => { setChecking(true); try { await send({ type: 'CHECK_NOW' }); } finally { setChecking(false); } };
  const openUpdate = async (update: Update) => {
    await send({ type: 'MARK_READ', id: update.id });
    if (update.url) await browser.tabs.create({ url: update.url });
    window.close();
  };
  if (!state) return <main className="min-h-[500px] w-[360px] bg-slate-50 p-6 text-slate-900"><h1 className="text-xl font-bold">UniPortal Monitor</h1><p className="mt-5" aria-live="polite">Loading monitor status…</p></main>;
  const unread = state.updates.filter((update) => !update.read).length;
  const elmsConnected = state.statuses.elms === 'connected';
  const last = Math.max(state.lastCheck.ucam, state.lastCheck.elms);
  return <main className="min-h-[500px] w-[360px] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="flex items-center justify-between bg-emerald-800 px-5 py-4 text-white"><div className="flex items-center gap-2"><GraduationCap aria-hidden="true" /><h1 className="text-base font-bold">UniPortal Monitor</h1></div><button className="rounded p-1 hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2" aria-label="Open settings" onClick={() => void browser.runtime.openOptionsPage()}><Settings2 /></button></header>
    <section className="mx-4 mt-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" aria-label="Portal status">
      <StatusRow icon={<BookOpen />} label="ELMS" value={elmsConnected ? 'Connected' : 'Log in required'} tone={elmsConnected ? 'green' : 'yellow'} />
      <StatusRow icon={<GraduationCap />} label="UCAM" value={state.statuses.ucam === 'connected' ? 'Connected' : 'Log in required'} tone={state.statuses.ucam === 'connected' ? 'green' : 'yellow'} />
      {!elmsConnected && <button className="mt-2 text-sm font-semibold text-emerald-800 underline dark:text-emerald-300" onClick={() => void browser.tabs.create({ url: ELMS_LOGIN })}>Log in to ELMS</button>}
      {state.statuses.ucam !== 'connected' && <button className="mt-2 text-sm font-semibold text-emerald-800 underline dark:text-emerald-300" onClick={() => void browser.tabs.create({ url: PORTAL_LOGIN })}>Log in to UCAM</button>}
    </section>
    <section className="px-4 pt-4" aria-labelledby="recent-title"><div className="flex items-center justify-between"><h2 id="recent-title" className="font-bold">Recent Updates <span className="text-sm font-normal text-slate-500">({unread} unread)</span></h2>{unread > 0 && <button className="text-xs text-emerald-800 underline dark:text-emerald-300" onClick={() => void send({ type: 'MARK_ALL_READ' })}>Mark all read</button>}</div>
      {error && <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-800" role="alert">{error}</p>}
      <ul className="mt-2 max-h-[220px] space-y-1 overflow-y-auto" aria-live="polite">{state.updates.slice(0, 10).map((update) => <li key={update.id}><button className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-slate-800" onClick={() => void openUpdate(update)}><UpdateIcon kind={update.kind} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{update.title}</span><span className="block text-xs text-slate-500">{update.adapterId.toUpperCase()} · {formatDistanceToNow(update.createdAt, { addSuffix: true })}</span></span>{!update.read && <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600" aria-label="Unread" />}</button></li>)}</ul>
      {state.updates.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No updates yet. We’re watching your portals.</p>}
    </section>
    <footer className="mt-3 border-t border-slate-200 px-4 py-3 dark:border-slate-700"><div className="flex gap-2"><button disabled={checking} className="flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60" onClick={() => void checkNow()}><Check size={16} />{checking ? 'Checking…' : 'Check now'}</button><button className="flex items-center gap-1 rounded-md border border-slate-300 px-3 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800" onClick={() => void send({ type: 'MUTE_30_MIN' })}><Volume2 size={16} />Mute 30 min</button></div><p className="mt-2 text-center text-xs text-slate-500"><Clock3 className="mr-1 inline" size={12} />Last check: {last ? formatDistanceToNow(last, { addSuffix: true }) : 'not yet'} · Next: every {state.settings.intervalMinutes} min</p></footer>
  </main>;
}

function StatusRow(props: { icon: React.ReactNode; label: string; value: string; tone: 'green' | 'yellow' | 'red' }): React.JSX.Element {
  const color = props.tone === 'green' ? 'bg-green-600' : props.tone === 'red' ? 'bg-red-600' : 'bg-amber-500';
  return <div className="flex items-center gap-2 py-1 text-sm"><span className="text-slate-500">{props.icon}</span><span className="font-medium">{props.label}</span><span className={`h-2 w-2 rounded-full ${color}`} /><span className="ml-auto text-slate-600 dark:text-slate-300">{props.value}</span></div>;
}
function UpdateIcon(props: { kind: Update['kind'] }): React.JSX.Element {
  if (props.kind === 'material') return <BookOpen size={18} aria-hidden="true" />;
  if (props.kind === 'assignment') return <CalendarClock size={18} aria-hidden="true" />;
  if (props.kind === 'result') return <GraduationCap size={18} aria-hidden="true" />;
  return <FileText size={18} aria-hidden="true" />;
}
