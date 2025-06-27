import React from 'react';

interface ResumeBuilderLayoutProps {
  children: React.ReactNode;
}

const ResumeBuilderLayout: React.FC<ResumeBuilderLayoutProps> = ({ children }) => {
  return (
    <div className="w-screen min-h-screen">
      {children}
    </div>
  );
};

export default ResumeBuilderLayout; 