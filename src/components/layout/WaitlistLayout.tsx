import { Outlet } from 'react-router-dom';

export default function WaitlistLayout() {
  return (
    <div className="w-screen h-screen min-h-screen min-w-full">
      <Outlet />
    </div>
  );
} 