import React from 'react';

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'preview' | 'pdf';
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  children,
  className = '',
  variant = 'preview',
}) => {
  if (variant === 'pdf') {
    // PDF export style
    return (
      <div className={`text-left ${className}`}>
        <div className="font-bold uppercase text-sm mb-6 tracking-wider">{children}</div>
        <div className="w-full h-px bg-gray-300 mb-2" />
      </div>
    );
  }
  // Preview style
  return (
    <div className={`text-left ${className}`}>
      <div className="font-bold uppercase text-sm mb-2 tracking-wider">{children}</div>
      <div className="w-full h-px bg-gray-300 mb-2" />
    </div>
  );
};

export default SectionHeading; 