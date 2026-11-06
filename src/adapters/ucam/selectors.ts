/**
 * @module ucam-selectors
 * @description Central selectors and provisional paths for UCAM portal pages.
 */

import type { UcamSection } from '../../shared/types';

// TODO: Confirm these illustrative routes and selectors against sanitized live portal HTML.
export const SECTION_CONFIG: Record<UcamSection, { path: string; row: string; title: string; date: string }> = {
  notices: { path: '/Student/Notice.aspx', row: 'table tr', title: 'a, td:nth-child(2)', date: 'td:first-child' },
  routine: { path: '/Student/ClassRoutine.aspx', row: 'table tr', title: 'a, td:nth-child(1)', date: 'td:first-child' },
  results: { path: '/Student/Result.aspx', row: 'table tr', title: 'a, td:nth-child(2)', date: 'td:first-child' },
  attendance: { path: '/Student/StudentCourseHistory.aspx', row: 'table tr', title: 'a, td:nth-child(1)', date: 'td:first-child' },
  materials: { path: '/Student/CourseMaterial.aspx', row: 'table tr', title: 'a, td:nth-child(2)', date: 'td:first-child' },
};
