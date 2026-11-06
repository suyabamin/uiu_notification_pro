/** @module elms-test @description Verifies session-based ELMS HTML parsing from a sanitized fixture. */

import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { parseElmsActivities } from '../../src/adapters/elms/parser';

class FixtureAnchor {
  readonly parentElement = null;
  constructor(private readonly href: string, readonly textContent: string) {}
  getAttribute(name: string): string | null { return name === 'href' ? this.href : null; }
  closest(): null { return null; }
}

class FixtureDOMParser {
  parseFromString(html: string): { querySelectorAll: (selector: string) => FixtureAnchor[] } {
    const anchors = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map((match) => new FixtureAnchor(match[1] ?? '', (match[2] ?? '').replace(/<[^>]+>/g, '').trim()));
    return {
      querySelectorAll: (selector) => {
        const targets = [...selector.matchAll(/href\*="([^"]+)"/g)].map((match) => match[1] ?? '');
        return anchors.filter((anchor) => targets.some((target) => anchor.getAttribute('href')?.includes(target)));
      },
    };
  }
}

describe('ELMS dashboard HTML parser', () => {
  it('extracts materials, assignments, and forum links and ignores external URLs', async () => {
    vi.stubGlobal('DOMParser', FixtureDOMParser);
    const html = readFileSync('tests/fixtures/elms-dashboard.html', 'utf8');
    const items = await parseElmsActivities(html);
    expect(items.map(({ kind, title }) => [kind, title])).toEqual([
      ['material', 'Week 4 lecture slides'],
      ['material', 'Lecture notes PDF'],
      ['assignment', 'Lab report'],
      ['forum', 'Course discussion forum'],
    ]);
    expect(items[2]?.url).toBe('https://elms.uiu.ac.bd/mod/assign/view.php?id=654');
    vi.unstubAllGlobals();
  });

  it('generates stable IDs from the activity kind and URL', async () => {
    vi.stubGlobal('DOMParser', FixtureDOMParser);
    const html = readFileSync('tests/fixtures/elms-dashboard.html', 'utf8');
    const first = await parseElmsActivities(html);
    const second = await parseElmsActivities(html);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(new Set(first.map((item) => item.id)).size).toBe(first.length);
    vi.unstubAllGlobals();
  });
});
