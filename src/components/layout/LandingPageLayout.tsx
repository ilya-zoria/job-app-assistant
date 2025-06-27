import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function LandingPageLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[1400px] w-full mx-auto">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
} 