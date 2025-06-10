import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-4xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
} 