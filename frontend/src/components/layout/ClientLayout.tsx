import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import BaseLayout, { BaseNavItem } from './BaseLayout';
import { clientNavigationConfig } from './navigation';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const location = useLocation();

  const resolvedNavItems = useMemo((): BaseNavItem[] => {
    return clientNavigationConfig.map(item => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      route: item.route,
      active: location.pathname === item.route,
    }));
  }, [location.pathname]);

  return (
    <BaseLayout navItems={resolvedNavItems} showAdminMenu={false}>
      {children}
    </BaseLayout>
  );
};

export default ClientLayout;
