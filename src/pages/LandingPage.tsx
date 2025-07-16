import React, { useCallback, useState, useEffect, useRef } from 'react';
import ResumeCard from '@/components/ResumeCard';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?worker&url';
import { supabase } from '../lib/supabaseClient';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseResumeText } from '../lib/parseResumeText';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { createResume, fetchResumes } from '@/lib/resumeApi';
import type { ResumeData } from '@/lib/resumeApi';
import Spinner from '@/components/ui/spinner';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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
  const location = useLocation();
  const containerRef = React.useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Add a loading state for user
  const [userLoaded, setUserLoaded] = useState(false);
  const [resumesLoaded, setResumesLoaded] = useState(false);

  // Move pdfToImages above extractOcrTextFromFile so it's defined before use
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

  // Move addResume above onDrop so it's defined before use
  const addResume = (resume: any) => {
    const updated = [...userResumes, resume];
    setUserResumes(updated);
    localStorage.setItem('userResumes', JSON.stringify(updated));
  };

  // onDrop uses addResume
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

        if (user) {
          // Save uploaded resume to Supabase
          const resumeData: ResumeData = { ...parsedResume };
          const { data: userData } = await supabase.auth.getUser();
          if (!userData || !userData.user) {
            toast.error('User not authenticated.');
            setLoading(false);
            return;
          }
          const payload = {
            resume_name: file.name.replace(/\.[^/.]+$/, '') || 'Resume name',
            user_id: userData.user.id,
            resume_data: resumeData,
            ai_suggestions: {},
            custom_questions: [],
            cover_letter: '',
          };
          console.log('user_id in payload:', payload.user_id);
          console.log('auth.uid() in session:', userData.user.id);
          const created = await createResume(payload);
          toast.success('Resume processed!', { id: toastId });
          navigate('/builder', { state: { resumeData: created.resume_data, resumeId: created.id } });
        } else {
          // Fallback to localStorage for guests
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
        }
      } catch (err: any) {
        toast.error('Failed to process file. Please upload a clear image or PDF.', { id: toastId });
        console.error('OCR Error:', err?.message || err, err);
      } finally {
        setLoading(false);
      }
    }
  }, [navigate, user, userResumes]);

  // Move useDropzone hook here so getRootProps etc are always defined
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    } 
  });

  useEffect(() => {
    setLoading(false);
    setProgress(0);
    setError('');
    setHasProcessed(false);
    // Check auth
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data?.user || null);
      setUserLoaded(true);
      if (data?.user) {
        // Fetch resumes from Supabase
        try {
          const resumes = await fetchResumes();
          setUserResumes(resumes || []);
        } catch (e) {
          setError('Failed to load resumes from Supabase');
        } finally {
          setResumesLoaded(true);
        }
      } else {
        // For guests, resumes are already initialized from localStorage
        setResumesLoaded(true);
      }
    });
  }, []);

  // Refetch resumes on page focus or navigation for logged-in users
  useEffect(() => {
    if (!user) return;
    const fetchAndSetResumes = async () => {
      try {
        const resumes = await fetchResumes();
        setUserResumes(resumes || []);
      } catch (e) {
        setError('Failed to load resumes from Supabase');
      } finally {
        setResumesLoaded(true);
      }
    };
    fetchAndSetResumes();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchAndSetResumes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, location]);

  // Debug logging
  useEffect(() => {
    console.log('userLoaded:', userLoaded);
    console.log('user:', user);
    console.log('userResumes:', userResumes);
    console.log('error:', error);
  }, [userLoaded, user, userResumes, error]);

  // Show error if present
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-red-500 font-semibold mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Prevent jumping: don't render until userLoaded
  if (!userLoaded) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={40} />
    </div>
  );

  // If userLoaded and user, but resumes are being fetched, show spinner
  if (userLoaded && user && !resumesLoaded && !error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={40} />
      </div>
    );
  }

  // If userLoaded and user, resumesLoaded, but no resumes, show empty state
  if (userLoaded && user && resumesLoaded && userResumes.length === 0 && !error) {
    return (
      <div className="mx-auto text-center py-24 max-w-3xl">
        <h1>Apply smarter with<br/>AI-tailored resumes</h1>
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
  }

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
      if (user) {
        // Save uploaded resume to Supabase
        const resumeData: ResumeData = {
          ...parsedResume
        };
        const created = await createResume({
          resume_name: file.name.replace(/\.[^/.]+$/, '') || 'Resume name',
          resume_data: resumeData,
          ai_suggestions: {},
          custom_questions: [],
          cover_letter: '',
        });
        toast.success('Resume processed!', { id: toastId });
        navigate('/builder', { state: { resumeData: created.resume_data, resumeId: created.id } });
      } else {
        // Fallback to localStorage for guests
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
      }
    } catch (err) {
      toast.error('Failed to process file. Please upload a clear image or PDF.', { id: toastId });
      console.error('OCR Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add delete handler
  const handleDeleteResume = (id: number) => {
    const updated = userResumes.filter(r => r.id !== id);
    setUserResumes(updated);
    localStorage.setItem('userResumes', JSON.stringify(updated));
  };

  // Prevent jumping: don't render until userLoaded
  if (!userLoaded) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={40} />
    </div>
  );

  // If userLoaded and user, but resumes are not yet loaded, show spinner
  if (userLoaded && user && userResumes.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={40} />
      </div>
    );
  }

  // Only render resumes table if resumesLoaded and userResumes.length > 0
  if (userLoaded && resumesLoaded && userResumes.length > 0) {
    return (
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1>My resumes</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Create new</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className='w-40 mt-2'>
              <DropdownMenuItem onClick={handleUploadClick}>Upload resume</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                if (user) {
                  // Save blank resume to Supabase and redirect
                  const blankResume: ResumeData = {
                    fullName: '',
                    jobTitle: '',
                    location: '',
                    email: '',
                    portfolio: '',
                    linkedin: '',
                    summary: '',
                    experience: [],
                    education: [],
                    skills: '',
                    tools: '',
                    languages: '',
                  };
                  try {
                    const created = await createResume({
                      resume_name: 'Resume name',
                      resume_data: blankResume,
                      ai_suggestions: {},
                      custom_questions: [],
                      cover_letter: '',
                    });
                    navigate('/builder', { state: { resumeData: created.resume_data, resumeId: created.id } });
                  } catch (e) {
                    setError('Failed to create blank resume');
                  }
                } else {
                  // Fallback to localStorage for guests
                  navigate('/builder', { state: { resumeData: {
                    id: Date.now(),
                    title: 'Untitled resume',
                    fullName: '',
                    jobTitle: '',
                    location: '',
                    email: '',
                    portfolio: '',
                    linkedin: '',
                    summary: '',
                    experience: [],
                    education: [],
                    skills: '',
                    tools: '',
                    languages: '',
                    lastModified: new Date().toISOString(),
                  }}});
                }
              }}>Blank resume</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-8 justify-center">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resume name</TableHead>
                <TableHead>Last modified</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userResumes.map(resume => (
                <TableRow
                  key={resume.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate('/builder', { state: { resumeData: resume.data } })}
                >
                  <TableCell className="text-base text-bold">{resume.title}</TableCell>
                  <TableCell className="text-base">
                    {resume.lastModified
                      ? new Date(resume.lastModified).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                      : resume.date}
                  </TableCell>
                  <TableCell className="w-32 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = resume.preview;
                        link.download = `${resume.title || 'resume'}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      aria-label="Download resume"
                    >
                      <Download size={20} />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={e => {
                            e.stopPropagation();
                          }}
                          aria-label="Delete resume"
                        >
                          <Trash2 size={20} />
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
                            <Button
                              variant="outline"
                              onClick={e => e.stopPropagation()} // Prevent row click
                            >
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={e => {
                              e.stopPropagation(); // Prevent row click
                              handleDeleteResume(resume.id);
                            }}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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