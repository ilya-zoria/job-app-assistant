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
    // PDF export style: full-width border under the text
    return (
      <div className={`font-bold uppercase text-sm border-b border-gray-300 pb-3 mb-2 tracking-wider text-left ${className}`}>
        {children}
      </div>
    );
  }
  // Preview style: title left, border to the right
  return (
    <div className={`font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2 tracking-wider text-left ${className}`}>
      {children}
    </div>
  );
};

export default SectionHeading; 