import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Permission } from '../../types';
import BaseLayout, { BaseNavItem } from './BaseLayout';
import { generalNavigationConfig } from './navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { hasPermission } = useAuth();
  const location = useLocation();

  const hasAccess = (permission?: Permission) => {
    return !!(permission && hasPermission(permission));
  };

  const resolvedNavItems = useMemo((): BaseNavItem[] => {
    return generalNavigationConfig
      .map((item): BaseNavItem | null => {
        if (item.children) {
          const accessibleChildren = item.children.filter((child) =>
            hasAccess(child.requiredPermissions?.[0] || item.requiredPermissions?.[0])
          );
          if (accessibleChildren.length > 0 || hasAccess(item.requiredPermissions?.[0])) {
            return {
              id: item.id,
              label: item.label,
              icon: item.icon,
              route: item.route,
              active: item.route ? location.pathname === item.route : false,
              children: accessibleChildren.map(child => ({
                id: child.id,
                label: child.label,
                route: child.route,
                active: location.pathname === child.route
              }))
            };
          }
          return null;
        }

        return hasAccess(item.requiredPermissions?.[0])
          ? {
              id: item.id,
              label: item.label,
              icon: item.icon,
              route: item.route,
              active: item.route ? location.pathname === item.route : false
            }
          : null;
      })
      .filter(Boolean) as BaseNavItem[];
  }, [hasPermission, location.pathname]);

  const showAdminMenu = useMemo(() => {
    return hasAccess(Permission.MANAGE_SETTINGS);
  }, [hasPermission]);

  return (
    <BaseLayout navItems={resolvedNavItems} showAdminMenu={showAdminMenu}>
      {children}
    </BaseLayout>
  );
};

export default Layout;
