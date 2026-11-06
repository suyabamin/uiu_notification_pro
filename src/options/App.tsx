/**
 * @module options-app
 * @description Settings sections for portals, notifications, and privacy.
 */

import { useEffect, useState } from 'react';
import { Bell, BookOpen, Clock3, GraduationCap, Info, Save, Settings, Trash2 } from 'lucide-react';
import { browser } from '../shared/browser';
import { DEFAULT_SETTINGS, type MonitorState, type Settings as MonitorSettings, type SettingsPatch, type UcamSection, type UpdateKind } from '../shared/types';
import ElmsSettings from './sections/ElmsSettings';

type Section = 'General' | 'UCAM' | 'ELMS' | 'Notifications' | 'About';
const SECTIONS: Array<{ label: Section; icon: React.ReactNode }> = [
  { label: 'General', icon: <Settings size={18} /> }, { label: 'UCAM', icon: <GraduationCap size={18} /> },
  { label: 'ELMS', icon: <BookOpen size={18} /> }, { label: 'Notifications', icon: <Bell size={18} /> }, { label: 'About', icon: <Info size={18} /> },
];
const UCAM_SECTIONS: Array<{ id: UcamSection; label: string }> = [
  { id: 'notices', label: 'Notices' }, { id: 'routine', label: 'Class routine' }, { id: 'results', label: 'Results' },
  { id: 'attendance', label: 'Attendance' }, { id: 'materials', label: 'Course materials' },
];
const TYPES: UpdateKind[] = ['material', 'notice', 'assignment', 'result', 'attendance', 'forum'];

/** Renders extension settings and status. @returns Options page content. */
export default function App(): React.JSX.Element {
  const [section, setSection] = useState<Section>('General');
  const [settings, setSettings] = useState<MonitorSettings>(DEFAULT_SETTINGS);
  const [elmsStatus, setElmsStatus] = useState<MonitorState['statuses']['elms']>('unknown');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const state = await browser.runtime.sendMessage({ type: 'GET_STATE' }) as MonitorState;
      setSettings(state.settings);
      setElmsStatus(state.statuses.elms);
    } catch { setMessage('Unable to read settings. Reload the extension and try again.'); }
  };
  useEffect(() => { void load(); }, []);
  const save = async (patch: SettingsPatch) => {
    setBusy(true);
    try {
      const saved = await browser.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: patch }) as MonitorSettings;
      setSettings(saved);
      setMessage('Settings saved.');
    } catch { setMessage('Settings could not be saved.'); }
    finally { setBusy(false); }
  };
  const update = <K extends keyof MonitorSettings>(key: K, value: MonitorSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const testNotificationSound = async () => {
    try {
      const audio = new Audio(browser.runtime.getURL('sounds/notify.wav'));
      await audio.play();
      setMessage('Notification sound played.');
    } catch { setMessage('The browser blocked audio. Use a click on this button to try again.'); }
  };

  return <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="bg-emerald-800 px-8 py-5 text-white"><div className="mx-auto flex max-w-6xl items-center gap-3"><GraduationCap /><div><h1 className="text-xl font-bold">UniPortal Monitor</h1><p className="text-sm text-emerald-100">Settings</p></div></div></header>
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 py-8 md:grid-cols-[240px_1fr]">
      <nav aria-label="Settings sections" className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><ul className="space-y-1">{SECTIONS.map((item) => <li key={item.label}><button aria-current={section === item.label ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${section === item.label ? 'bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`} onClick={() => setSection(item.label)}>{item.icon}{item.label}</button></li>)}</ul></nav>
      <main className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{section}</h2>{message && <p role="status" aria-live="polite" className="text-sm text-emerald-800 dark:text-emerald-300">{message}</p>}</div>
        {section === 'General' && <div className="space-y-5">
          <label className="block font-medium">Check interval<select className="mt-1 block w-full max-w-xs rounded border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-800" value={settings.intervalMinutes} onChange={(event) => update('intervalMinutes', Number(event.target.value))}>{[15, 30, 60, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
          <CheckRow label="Run a check when the browser starts" checked={settings.runOnStartup} onChange={(checked) => update('runOnStartup', checked)} />
          <button className="flex items-center gap-2 rounded border border-red-300 px-3 py-2 text-red-700 hover:bg-red-50" onClick={() => void browser.runtime.sendMessage({ type: 'CLEAR_HISTORY' }).then(() => setMessage('Update history cleared.'))}><Trash2 size={17} />Clear update history</button>
          <button className="rounded border border-slate-300 px-3 py-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800" onClick={() => { if (window.confirm('Reset all settings to defaults?')) void save(DEFAULT_SETTINGS); }}>Clear all settings</button>
          <button disabled={busy} className="flex items-center gap-2 rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-50" onClick={() => void save({ intervalMinutes: settings.intervalMinutes, runOnStartup: settings.runOnStartup })}><Save size={17} />Save changes</button>
        </div>}
        {section === 'UCAM' && <div className="space-y-5"><p>Connection status: <span className="font-semibold text-amber-700">{settings.ucam.enabled ? 'Check your browser login' : 'Monitoring paused'}</span></p><fieldset className="space-y-3"><legend className="mb-2 font-medium">Monitor sections</legend>{UCAM_SECTIONS.map((item) => <CheckRow key={item.id} label={item.label} checked={settings.ucam.sections.includes(item.id)} onChange={(checked) => update('ucam', { ...settings.ucam, sections: checked ? [...settings.ucam.sections, item.id] : settings.ucam.sections.filter((value) => value !== item.id) })} />)}</fieldset><CheckRow label="Enable UCAM monitoring" checked={settings.ucam.enabled} onChange={(enabled) => update('ucam', { ...settings.ucam, enabled })} /><button className="rounded border border-slate-300 px-3 py-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800" onClick={() => void browser.tabs.create({ url: 'https://ucam.uiu.ac.bd/Security/LogIn.aspx' })}>Open UCAM to log in</button><button disabled={busy} className="ml-2 rounded bg-emerald-800 px-4 py-2 text-white" onClick={() => void save({ ucam: settings.ucam })}>Save UCAM settings</button></div>}
        {section === 'ELMS' && <div className="space-y-5"><ElmsSettings status={elmsStatus} enabled={settings.elms.enabled} onEnabledChange={(enabled) => { update('elms', { enabled }); void save({ elms: { enabled } }); }} /><button disabled={busy} className="rounded bg-emerald-800 px-4 py-2 text-white" onClick={() => void save({ elms: { enabled: settings.elms.enabled } })}>Save ELMS settings</button></div>}
        {section === 'Notifications' && <div className="space-y-4"><CheckRow label="Enable desktop notifications" checked={settings.notificationsEnabled} onChange={(value) => update('notificationsEnabled', value)} /><CheckRow label="Play notification sound" checked={settings.soundEnabled} onChange={(value) => update('soundEnabled', value)} /><button className="rounded border border-slate-300 px-3 py-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800" onClick={() => void testNotificationSound()}>Test notification sound</button><CheckRow label="Enable quiet hours" checked={settings.quietHours?.enabled ?? false} onChange={(enabled) => update('quietHours', { enabled, start: settings.quietHours?.start ?? 23, end: settings.quietHours?.end ?? 7 })} /><div className="flex gap-4"><label>From<input type="time" value={`${String(settings.quietHours?.start ?? 23).padStart(2, '0')}:00`} onChange={(event) => update('quietHours', { enabled: settings.quietHours?.enabled ?? false, start: Number(event.target.value.split(':')[0]), end: settings.quietHours?.end ?? 7 })} className="ml-2 rounded border p-1 dark:bg-slate-800" /></label><label>To<input type="time" value={`${String(settings.quietHours?.end ?? 7).padStart(2, '0')}:00`} onChange={(event) => update('quietHours', { enabled: settings.quietHours?.enabled ?? false, start: settings.quietHours?.start ?? 23, end: Number(event.target.value.split(':')[0]) })} className="ml-2 rounded border p-1 dark:bg-slate-800" /></label></div><fieldset className="space-y-3"><legend className="font-medium">Notification types</legend>{TYPES.map((kind) => <CheckRow key={kind} label={kind[0]?.toUpperCase() + kind.slice(1)} checked={settings.notificationTypes.includes(kind)} onChange={(checked) => update('notificationTypes', checked ? [...settings.notificationTypes, kind] : settings.notificationTypes.filter((value) => value !== kind))} />)}</fieldset><button className="flex items-center gap-2 rounded bg-emerald-800 px-4 py-2 text-white" onClick={() => void save({ notificationsEnabled: settings.notificationsEnabled, soundEnabled: settings.soundEnabled, quietHours: settings.quietHours, notificationTypes: settings.notificationTypes })}><Save size={17} />Save notifications</button></div>}
        {section === 'About' && <div className="space-y-4 leading-7"><p><strong>UniPortal Monitor</strong> · Version 1.0.0</p><h3 className="font-semibold">Privacy</h3><p>This extension monitors your UIU portals for study materials, notices, results, and attendance updates.</p><p>This extension never stores your password. UCAM and ELMS use your browser session cookies.</p><p>No analytics, telemetry, or remote code is used.</p><p className="flex items-center gap-2 text-sm text-slate-500"><Clock3 size={16} />Cross-browser Manifest V3 extension</p></div>}
      </main>
    </div>
  </div>;
}

function CheckRow(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }): React.JSX.Element {
  return <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} className="h-4 w-4 accent-emerald-700" />{props.label}</label>;
}
