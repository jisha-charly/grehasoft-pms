import React from 'react';
import Layout from './Layout';
import SEOLayout from './SEOLayout';
import ClientLayout from './ClientLayout';
import { UserRole } from '../../types';

export type PortalType = 'general' | 'seo' | 'client';

export interface PortalConfig {
  layout: React.FC<{ children: React.ReactNode }>;
  roles: UserRole[];
}

export const portalRegistry: Record<PortalType, PortalConfig> = {
  general: {
    layout: Layout,
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.PROJECT_MANAGER,
      UserRole.TEAM_MEMBER,
      UserRole.SALES_MANAGER,
      UserRole.SALES_EXECUTIVE
    ]
  },
  seo: {
    layout: SEOLayout,
    roles: [
      UserRole.SEO_MANAGER,
      UserRole.SEO_EXECUTIVE
    ]
  },
  client: {
    layout: ClientLayout,
    roles: [
      UserRole.CLIENT
    ]
  }
};

export const resolvePortalType = (role: string): PortalType => {
  for (const [type, config] of Object.entries(portalRegistry)) {
    if (config.roles.includes(role as UserRole)) {
      return type as PortalType;
    }
  }
  return 'general'; // Default fallback
};
