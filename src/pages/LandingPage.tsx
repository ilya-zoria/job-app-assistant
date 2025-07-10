import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?worker&url';
import { supabase } from '../lib/supabaseClient';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseResumeText } from '../lib/parseResumeText';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function ResumeCard({ resume, onClick, onDelete }: { resume: any, onClick: () => void, onDelete: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col items-center w-full max-w-xs cursor-pointer transition hover:shadow-lg" onClick={onClick}>
      <div className="bg-white rounded-xl w-full flex items-center justify-center overflow-hidden mb-4">
        <img src={resume.preview} alt="Resume preview" className="object-contain w-full h-full" />
      </div>
      <div className="w-full flex flex-col gap-1">
        <div className="font-serif text-lg font-medium">{resume.title}</div>
        <div className="text-muted-foreground text-sm">{resume.date}</div>
      </div>
      <div className="flex gap-2 mt-2 self-end">
        <Button variant="ghost" size="icon"><Download size={18} /></Button>
        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onDelete(); }}><Trash2 size={18} /></Button>
      </div>
    </div>
  );
}

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [hasProcessed, setHasProcessed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userResumes, setUserResumes] = useState<any[]>(() => {
    const stored = localStorage.getItem('userResumes');
    return stored ? JSON.parse(stored) : [];
  });
  const navigate = useNavigate();
  const containerRef = React.useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Add a loading state for user
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    setLoading(false);
    setProgress(0);
    setError('');
    setHasProcessed(false);
    // Check auth
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setUserLoaded(true);
    });
    // No need to setUserResumes here, already initialized synchronously
  }, []);

  const pdfToImages = async (file: File): Promise<string[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const images: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      images.push(canvas.toDataURL('image/png'));
    }
    return images;
  };

  const addResume = (resume: any) => {
    const updated = [...userResumes, resume];
    setUserResumes(updated);
    localStorage.setItem('userResumes', JSON.stringify(updated));
  };

  // Shared OCR extraction function
  const extractOcrTextFromFile = async (file: File, setProgressCb?: (progress: number) => void): Promise<string> => {
    let ocrText = '';
    if (file.type === 'application/pdf') {
      const images = await pdfToImages(file);
      let allText = '';
      for (let i = 0; i < images.length; i++) {
        const { data: { text } } = await Tesseract.recognize(
          images[i],
          'eng',
          {
            logger: (m: { status: string; progress: number }) => {
              if (m.status === 'recognizing text' && setProgressCb) {
                setProgressCb(Math.round(((i + m.progress) / images.length) * 100));
              }
            },
          }
        );
        allText += text + '\n';
      }
      ocrText = allText;
    } else {
      const { data: { text } } = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text' && setProgressCb) {
              setProgressCb(Math.round(m.progress * 100));
            }
          },
        }
      );
      ocrText = text;
    }
    return ocrText;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');
    if (acceptedFiles.length > 0) {
      const toastId = toast.loading('Processing your resume...');
      setLoading(true);
      setProgress(0);
      setHasProcessed(true);
      const file = acceptedFiles[0];
      try {
        const ocrText = await extractOcrTextFromFile(file, setProgress);
        const parsedResume = parseResumeText(ocrText);
        const newResume = {
          id: Date.now(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
          preview: '/assets/resume-preview.png',
          data: parsedResume,
        };
        addResume(newResume);
        toast.success('Resume processed!', { id: toastId });
        navigate('/builder', { state: { ocrText } });
      } catch (err) {
        toast.error('Failed to process file. Please upload a clear image or PDF.', { id: toastId });
        console.error('OCR Error:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [navigate, userResumes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    } 
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Processing your resume...');
    setLoading(true);
    setProgress(0);
    setHasProcessed(true);
    try {
      const ocrText = await extractOcrTextFromFile(file, setProgress);
      const parsedResume = parseResumeText(ocrText);
      const newResume = {
        id: Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        preview: '/assets/resume-preview.png',
        data: parsedResume,
      };
      addResume(newResume);
      toast.success('Resume processed!', { id: toastId });
      navigate('/builder', { state: { ocrText } });
    } catch (err) {
      toast.error('Failed to process file. Please upload a clear image or PDF.', { id: toastId });
      console.error('OCR Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add delete handler
  const handleDeleteResume = (id: number) => {
    if (window.confirm('Do you want to remove it?')) {
      const updated = userResumes.filter(r => r.id !== id);
      setUserResumes(updated);
      localStorage.setItem('userResumes', JSON.stringify(updated));
    }
  };

  // Prevent jumping: don't render until userLoaded
  if (!userLoaded) return null;

  if (user && userResumes.length > 0) {
    return (
      <div className="min-h-screen px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1>My resumes</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Create new</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleUploadClick}>Upload resume</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/builder')}>Blank resume</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-8 justify-center">
          {userResumes.map(resume => (
            <ResumeCard key={resume.id} resume={resume} onClick={() => navigate('/builder', { state: { resumeData: resume.data } })} onDelete={() => handleDeleteResume(resume.id)} />
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto text-center py-24 max-w-3xl">
      <h1>Apply smarter with<br/>AI-tailored resumes</h1>
      {/* <div
        ref={containerRef}
        style={{position: 'relative'}}
        >
        <VariableProximity
          label={'Apply smarter with AI-tailored resumes'}
          className="text-5xl md:text-7xl italic leading-tight text-gray-900"
          fromFontVariationSettings="'wght' 400, 'opsz' 9"
          toFontVariationSettings="'wght' 900, 'opsz' 40"
          containerRef={containerRef}
          radius={100}
          falloff="exponential"
          style={{ fontFamily: "'Savate', sans-serif" }}
        />
      </div> */}
      <p className="text-muted-foreground text-xl mb-12 mt-6">Upload your resume, job description and get tailored resume</p>
      
      <div
        {...getRootProps()}
        className={`mx-auto max-w-lg border-2 border-dashed rounded-xl p-12 cursor-pointer bg-white
          ${isDragActive ? 'border-primary bg-muted' : 'border-border'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <img src="/assets/icon-upload_resume.png" alt="Upload resume" className="w-48 h-48 text-muted-foreground" />
          <p className="font-semibold">Drag & drop resume here</p>
          <p className="text-sm text-muted-foreground">
            We never share your data with third parties or use them to train our models of the
          </p>
          <Button variant="outline" type="button">Browse files</Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 