import { Button } from '@/components/ui/button';

export default function ResumeBuilderHeader() {
  return (
    <header className="w-full py-4 px-4 md:px-8 bg-background border-b border-border mb-8">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-2xl font-serif font-bold">Resume builder</div>
        <div className="flex gap-2">
          <Button variant="outline">Tailor for job</Button>
          <Button>Download</Button>
        </div>
      </div>
    </header>
  );
} 