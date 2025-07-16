import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';

interface ResumeCardProps {
  resume: any;
  onOpen: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onOpen, onDownload, onDelete }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div
      className="bg-white rounded-2xl shadow-lg flex flex-col w-full max-w-xs cursor-pointer transition hover:shadow-xl group relative"
      onClick={onOpen}
    >
      <div className="bg-white rounded-t-2xl w-full flex items-center justify-center overflow-hidden aspect-[4/5] border-b">
        <img
          src={resume.preview}
          alt="Resume preview"
          className="object-contain w-full h-full"
        />
      </div>
      <div className="flex-1 flex flex-col justify-end p-6 pb-4">
        <div className="font-serif text-2xl font-medium text-[#232a38] mb-1 truncate">
          {resume.title}
        </div>
        <div className="text-[#8a99b3] text-lg mb-2">{resume.date}</div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              onDownload();
            }}
            aria-label="Download resume"
          >
            <Download size={22} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={e => {
                  e.stopPropagation();
                  setDialogOpen(true);
                }}
                aria-label="Delete resume"
              >
                <Trash2 size={22} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this resume?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this resume? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDialogOpen(false);
                    onDelete();
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ResumeCard; 