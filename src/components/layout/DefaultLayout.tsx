import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';

export default function DefaultLayout() {
  const location = useLocation();

  let headerVariant: 'default' | 'resume-builder' = 'default';
  if (location.pathname.startsWith('/builder')) {
    headerVariant = 'resume-builder';
  }

  return (
    <div className="min-h-screen">
      <Header variant={headerVariant} />
      <main className="container mx-auto px-4 flex items-center justify-center flex-grow">
        <Outlet />
      </main>
    </div>
  );
} 