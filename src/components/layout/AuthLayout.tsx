import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="max-w-[1400px] w-full h-screen mx-auto flex items-center justify-center p-4">
      <div className="max-w-md">
        <Outlet />
      </div>
    </div>
  );
} 