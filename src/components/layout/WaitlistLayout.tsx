import { Outlet } from 'react-router-dom';

export default function WaitlistLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <Outlet />
      </div>
    </div>
  );
} 