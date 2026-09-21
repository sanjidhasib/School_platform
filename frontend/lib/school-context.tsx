'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { publicAPI } from './api/public';

/**
 * The school's own identity, read once from the public settings endpoint and
 * shared across the shell so the sidebar, topbar and report headers all show
 * the same name without each fetching it.
 *
 * Note: GET /api/public/school currently returns only {_id, logoUrl, address},
 * because the backend selects `schoolName`/`phone`/`email` while the model
 * stores `name`/`contactPhone`/`contactEmail`. That is a pre-existing backend
 * bug, documented in docs/UI_REDESIGN_PLAN.md. Until it is fixed, `name` falls
 * back below; once it is, the real value flows through with no change here.
 */

export interface School {
  name: string;
  logoUrl?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

const FALLBACK_NAME = 'Barishal Zilla School';

const SchoolContext = createContext<School>({ name: FALLBACK_NAME });

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School>({ name: FALLBACK_NAME });

  useEffect(() => {
    let cancelled = false;
    publicAPI
      .getSchool()
      .then((res) => {
        if (cancelled) return;
        const d = res.data?.data ?? {};
        setSchool({
          name: d.schoolName || d.name || FALLBACK_NAME,
          logoUrl: d.logoUrl,
          address: d.address,
          contactPhone: d.contactPhone ?? d.phone,
          contactEmail: d.contactEmail ?? d.email,
        });
      })
      .catch(() => {
        /* Keep the fallback; the shell must render regardless. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SchoolContext.Provider value={school}>{children}</SchoolContext.Provider>;
}

export function useSchool() {
  return useContext(SchoolContext);
}
