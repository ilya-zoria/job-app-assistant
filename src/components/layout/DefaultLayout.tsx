import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function DefaultLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 flex items-center justify-center flex-grow">
        <Outlet />
      </main>
    </div>
  );
} 