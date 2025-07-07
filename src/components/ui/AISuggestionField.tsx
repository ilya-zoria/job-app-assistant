import React from 'react';
import { Button } from './button';
import { Check, X, Sparkles } from 'lucide-react';

interface AISuggestionFieldProps {
  sectionKey: string;
  hoveredSection: string | null;
  setHoveredSection: (k: string | null) => void;
  children: React.ReactNode;
}

const AISuggestionField: React.FC<AISuggestionFieldProps> = ({ sectionKey, hoveredSection, setHoveredSection, children }) => {
  return (
    <div
      className={`relative group border rounded p-3 text-sm flex items-center justify-between ${hoveredSection === sectionKey ? ' bg-slate-100' : ''}`}
      onMouseEnter={() => setHoveredSection(sectionKey)}
      onMouseLeave={() => setHoveredSection(null)}
    >
      <span className="w-full">{children}</span>
      {hoveredSection === sectionKey && (
        <div className="absolute top-2 right-2 flex gap-2 z-50">
          <Button variant="outline" size="icon" className="size-8 border-slate-900"><Check size={18} /></Button>
          <Button variant="outline" size="icon" className="size-8"><X size={18} /></Button>
          <Button variant="outline" size="icon" className="size-8"><Sparkles size={18} /></Button>
        </div>
      )}
    </div>
  );
};

export default AISuggestionField; 