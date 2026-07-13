import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BaseLayout, { BaseNavItem } from './BaseLayout';
import { seoManagerNavigationConfig, seoExecutiveNavigationConfig } from './navigation';

interface SEOLayoutProps {
  children: React.ReactNode;
}

const SEOLayout: React.FC<SEOLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role_name || user?.role || "";
  const isManager = role === "SUPER_ADMIN" || role === "ADMIN" || role === "SEO_MANAGER";

  const resolvedNavItems = useMemo(() => {
    const rawConfig = isManager ? seoManagerNavigationConfig : seoExecutiveNavigationConfig;
    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get("tab");

    return rawConfig.map((item): BaseNavItem => {
      let isActive = false;
      
      if (item.route) {
        const itemUrl = new URL(item.route, window.location.origin);
        const itemTab = itemUrl.searchParams.get("tab");
        const isSeoPath = location.pathname === "/seo";
        
        if (isSeoPath) {
          if (activeTab) {
            isActive = itemTab === activeTab;
          } else {
            // Default active items if tab query is empty
            if (isManager) {
              isActive = itemTab === "dashboard";
            } else {
              isActive = itemTab === "performance";
            }
          }
        } else {
          isActive = location.pathname === item.route;
        }
      }

      return {
        id: item.id,
        label: item.label,
        icon: item.icon,
        route: item.route,
        isActionButton: item.isActionButton,
        active: isActive,
        children: item.children?.map(child => ({
          id: child.id,
          label: child.label,
          route: child.route,
          active: location.pathname === child.route
        }))
      };
    });
  }, [isManager, location.pathname, location.search]);

  return (
    <BaseLayout navItems={resolvedNavItems} showAdminMenu={isManager}>
      {children}
    </BaseLayout>
  );
};

export default SEOLayout;
