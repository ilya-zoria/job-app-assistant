import React, { useEffect, useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseResumeText } from '../lib/parseResumeText';
import type { ParsedResume, ExperienceItem } from '../lib/parseResumeText';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import Header from '@/components/layout/Header';
import SectionHeading from '@/components/SectionHeading';
import { supabase } from '../lib/supabaseClient';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Check, X, MoreVertical, Copy, Sparkles } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import AISuggestionField from '@/components/ui/AISuggestionField';
import type { AISuggestionFieldMode } from '@/components/ui/AISuggestionField';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { generateTailoredResumeWithGemini } from '@/lib/geminiClient';
import { toast } from 'sonner';
import { TextShimmer } from '@/components/ui/text-shimmer';
import {MagneticButton} from '@/components/ui/magnetic-button';

const emptyResume: ParsedResume = {
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

const ResumeBuilder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ocrText = location.state?.ocrText || '';
  const resumeData = location.state?.resumeData;
  const getInitialResume = () => {
    if (resumeData) return resumeData;
    if (location.state?.ocrText) return parseResumeText(location.state.ocrText);
    const saved = localStorage.getItem('resumeData');
    if (saved) return JSON.parse(saved);
    return emptyResume;
  };
  const [resume, setResume] = useState<ParsedResume>(getInitialResume());

  // Granular page splitting state
  const [pages, setPages] = useState<JSX.Element[][]>([]);
  const [blockHeights, setBlockHeights] = useState<number[]>([]);
  const [measuring, setMeasuring] = useState(true);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [measuringBlocks, setMeasuringBlocks] = useState<JSX.Element[]>([]);

  const [showProcessing, setShowProcessing] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>({});
  const getInitialAISuggestions = () => {
    const saved = localStorage.getItem('aiSuggestions');
    if (saved) return JSON.parse(saved);
    return {};
  };
  const [aiSuggestions, setAISuggestions] = useState<any>(getInitialAISuggestions());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalQuestions, setModalQuestions] = useState<string[]>(jobDetails.customQuestions || ['']);

  // 1. Add state for job URL and loading
  const [jobUrl, setJobUrl] = useState('');
  const [jobUrlLoading, setJobUrlLoading] = useState(false);

  // 2. Placeholder function to extract job info from URL (replace with real AI/scraper later)
  async function extractJobDetailsFromUrl(url: string) {
    // Simulate async extraction
    await new Promise(res => setTimeout(res, 1200));
    // Return mock extracted data for now
    return {
      company: 'Example Corp',
      jobTitle: 'Product Designer',
      jobDescription: 'This is a sample job description extracted from the job posting.',
      customQuestions: ['Why do you want this job?', 'Describe your experience with Figma.'],
    };
  }

  // 3. Handler for Add job button
  async function handleExtractJobFromUrl() {
    if (!jobUrl) return;
    setJobUrlLoading(true);
    try {
      const extracted = await extractJobDetailsFromUrl(jobUrl);
      setJobDetails((prev: any) => ({
        ...prev,
        ...extracted,
      }));
      setModalQuestions(extracted.customQuestions || ['']);
    } catch (e) {
      alert('Failed to extract job details from URL.');
    } finally {
      setJobUrlLoading(false);
    }
  }

  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  function getResumeBlocks(resume: ParsedResume) {
    const blocks: { type: string, key: string, jsx: JSX.Element }[] = [];
    // Header
    blocks.push({
      type: 'header',
      key: 'header',
      jsx: (
        <div className="text-center mb-2">
          <div className="text-3xl font-serif font-bold leading-tight">{resume.fullName || 'Full Name'}</div>
          <div className="text-md font-semibold mt-2 mb-2">{resume.jobTitle || 'Job Title'}</div>
          <div className="text-sm mt-2">
            {resume.location && <span>{resume.location} | </span>}
            {resume.email && <span>{resume.email} | </span>}
            {resume.portfolio && <span>{resume.portfolio} | </span>}
            {resume.linkedin && <span>{resume.linkedin}</span>}
          </div>
        </div>
      )
    });
    // Summary
    if (resume.summary) {
      blocks.push({
        type: 'summary',
        key: 'summary-section',
        jsx: (
          <div>
            <SectionHeading variant={isExportingPDF ? 'pdf' : 'preview'}>Summary</SectionHeading>
            <div className="text-sm whitespace-pre-line">{resume.summary}</div>
          </div>
        )
      });
    }
    // Work Experience
    const experienceArr = Array.isArray(resume.experience) ? resume.experience : [];
    if (experienceArr.length > 0) {
      blocks.push({
        type: 'work-experience',
        key: 'workexp-section',
        jsx: (
          <div>
            <SectionHeading variant={isExportingPDF ? 'pdf' : 'preview'}>Work Experience</SectionHeading>
            <div className="flex flex-col gap-3">
              {experienceArr.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-bold text-sm">{exp.company} — {exp.title}</div>
                    <div className="flex flex-col items-end min-w-[120px]">
                      {exp.period && <div className="italic text-sm text-right whitespace-nowrap">{exp.period}</div>}
                      {exp.location && <div className="text-sm text-right text-gray-700">{exp.location}</div>}
                    </div>
                  </div>
                  {exp.description && exp.description.split(/\n|•/).filter(Boolean).map((line, i) => (
                    <div key={i} className="break-words text-sm">{line.trim()}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      });
    }
    // Education
    const educationArr = Array.isArray(resume.education) ? resume.education : [];
    if (educationArr.length > 0) {
      blocks.push({
        type: 'education',
        key: 'edu-section',
        jsx: (
          <div>
            <SectionHeading variant={isExportingPDF ? 'pdf' : 'preview'}>Education</SectionHeading>
            <div className="flex flex-col gap-3">
              {educationArr.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-bold text-base">{edu.school} — {edu.degree}</div>
                    <div className="flex flex-col items-end min-w-[120px]">
                      {edu.period && <div className="italic text-sm text-right whitespace-nowrap">{edu.period}</div>}
                      {edu.location && <div className="text-sm text-right text-gray-700">{edu.location}</div>}
                    </div>
                  </div>
                  {edu.description && edu.description.split(/\n|•/).filter(Boolean).map((line, i) => (
                    <div key={i} className="break-words text-sm">{line.trim()}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      });
    }
    // Skills
    if (resume.skills) {
      blocks.push({
        type: 'skills',
        key: 'skills-section',
        jsx: (
          <div>
            <SectionHeading variant={isExportingPDF ? 'pdf' : 'preview'}>Skills</SectionHeading>
            <div className="text-sm">{resume.skills}</div>
          </div>
        )
      });
    }
    // Tools
    if (resume.tools) {
      blocks.push({
        type: 'tools',
        key: 'tools-section',
        jsx: (
          <div>
            <SectionHeading variant={isExportingPDF ? 'pdf' : 'preview'}>Tools</SectionHeading>
            <div className="text-sm">{resume.tools}</div>
          </div>
        )
      });
    }
    // Languages
    if (resume.languages) {
      blocks.push({
        type: 'languages',
        key: 'languages-section',
        jsx: (
          <div>
            <SectionHeading variant={isExportingPDF ? 'pdf' : 'preview'}>Languages</SectionHeading>
            <div className="text-sm">{resume.languages}</div>
          </div>
        )
      });
    }
    return blocks;
  }

  // Step 1: After resume changes, flatten to blocks and reset refs
  const blocks = useMemo(() => getResumeBlocks(resume), [resume, isExportingPDF]);
  blockRefs.current = blocks.map(() => null);

  // Step 2: After blocks render, measure their heights (grouping <li> into <ul> as in render)
  useLayoutEffect(() => {
    if (!measuring) return;
    // Group consecutive <li> blocks into <ul> for measuring
    const groupedBlocks: { jsx: JSX.Element, isList: boolean, count: number }[] = [];
    let bulletBuffer: JSX.Element[] = [];
    blocks.forEach((block, i) => {
      if (block.jsx && (block.jsx as any).type === 'li') {
        bulletBuffer.push(block.jsx);
      } else {
        if (bulletBuffer.length > 0) {
          groupedBlocks.push({ jsx: <ul className="list-none list-outside text-sm break-words mb-2">{bulletBuffer}</ul>, isList: true, count: bulletBuffer.length });
          bulletBuffer = [];
        }
        groupedBlocks.push({ jsx: block.jsx, isList: false, count: 1 });
      }
    });
    if (bulletBuffer.length > 0) {
      groupedBlocks.push({ jsx: <ul className="list-none list-outside pl text-sm break-words mb-2">{bulletBuffer}</ul>, isList: true, count: bulletBuffer.length });
    }
    // Render each group in the measuring container and measure its height
    const tempRefs: (HTMLDivElement | null)[] = [];
    setMeasuringBlocks(
      groupedBlocks.map((group, i) => (
        <div key={i} ref={el => (tempRefs[i] = el)}>
          {group.jsx}
        </div>
      ))
    );
    setTimeout(() => {
      const heights = tempRefs.map(ref => ref?.offsetHeight || 0);
      setBlockHeights(heights);
      setMeasuring(false);
    }, 0);
    // Save groupedBlocks for splitting
    (window as any).__groupedBlocks = groupedBlocks;
  }, [measuring, blocks]);

  // Step 3: When blockHeights are available and not measuring, split into pages (splitting <ul> if needed)
  useEffect(() => {
    if (measuring) return;
    if (!blockHeights.length) return;
    // Use groupedBlocks from measuring phase
    const groupedBlocks = (window as any).__groupedBlocks as { jsx: JSX.Element, isList: boolean, count: number }[];
    const tempPages: JSX.Element[][] = [[]];
    let currentPage = 0;
    let currentHeight = 0;
    for (let i = 0; i < groupedBlocks.length; i++) {
      const h = blockHeights[i];
      const group = groupedBlocks[i];
      if (currentHeight + h > 1056 && tempPages[currentPage].length > 0) {
        // If group is a list and too big, split it at <li> level
        if (group.isList && group.count > 1) {
          // Split the <ul> into <li>s and measure each individually
          const liBlocks = (group.jsx.props.children as JSX.Element[]);
          let liBuffer: JSX.Element[] = [];
          let liHeight = 0;
          liBlocks.forEach((li, idx) => {
            // For simplicity, estimate each <li> as h / count
            const singleLiHeight = h / group.count;
            if (currentHeight + liHeight + singleLiHeight > 1056 && liBuffer.length > 0) {
              tempPages[currentPage].push(<ul className="list-none list-outside text-sm break-words mb-2" key={`ul-split-${i}-${idx}`}>{liBuffer}</ul>);
              currentPage++;
              tempPages.push([]);
              liBuffer = [];
              liHeight = 0;
              currentHeight = 0;
            }
            liBuffer.push(li);
            liHeight += singleLiHeight;
          });
          if (liBuffer.length > 0) {
            tempPages[currentPage].push(<ul className="list-none list-outside text-sm break-words mb-2" key={`ul-split-last-${i}`}>{liBuffer}</ul>);
            currentHeight += liHeight;
          }
        } else {
          currentPage++;
          tempPages.push([]);
          currentHeight = 0;
          tempPages[currentPage].push(group.jsx);
          currentHeight += h;
        }
      } else {
        tempPages[currentPage].push(group.jsx);
        currentHeight += h;
      }
    }
    setPages(tempPages);
  }, [blockHeights, measuring]);

  // Step 4: When resume changes, trigger measuring
  useEffect(() => {
    setMeasuring(true);
  }, [resume]);

  // Double-trigger measuring on mount to ensure DOM is ready
  useLayoutEffect(() => {
    setMeasuring(true);
    const timeout = setTimeout(() => setMeasuring(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    console.log('blockHeights', blockHeights);
  }, [blockHeights]);

  // Handlers for updating fields
  const handleChange = (field: keyof ParsedResume, value: string) => {
    setResume(prev => ({ ...prev, [field]: value }));
  };

  // Experience handlers
  const handleExperienceChange = (idx: number, field: keyof ExperienceItem, value: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => i === idx ? { ...exp, [field]: value } : exp),
    }));
  };
  // 1. Update experience and education entry structure to include 'location' field when adding new entries
  const handleAddExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: '', title: '', period: '', location: '', description: '' },
      ],
    }));
  };
  const handleRemoveExperience = (idx: number) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  // Education handlers
  const handleEducationChange = (idx: number, field: keyof ParsedResume['education'][0], value: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => i === idx ? { ...edu, [field]: value } : edu),
    }));
  };
  // 2. Update Editor layout for Experience
  const handleAddEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { school: '', degree: '', period: '', location: '', description: '' },
      ],
    }));
  };
  const handleRemoveEducation = (idx: number) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  };

  // Skills/tools handlers
  const handleListChange = (field: 'skills' | 'tools' | 'languages', value: string) => {
    setResume(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadPDF = async () => {
    if (previewRef.current) {
      setIsExportingPDF(true);
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 50));
      await html2pdf()
        .set({
          margin: 0,
          filename: 'resume.pdf',
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        })
        .from(previewRef.current)
        .save();
      setIsExportingPDF(false);
    }
  };

  // Download handler with auth check
  const handleDownload = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      console.log('Saving resume to localStorage', resume);
      localStorage.setItem('resumeData', JSON.stringify(resume));
      setTimeout(() => {
        navigate('/signup?redirect=/builder');
      }, 100); // Delay to ensure localStorage write completes
      return;
    }
    // Logged in: proceed with download
    handleDownloadPDF();
  };

  // Debug: log resume and pages after each render
  useEffect(() => {
    console.log('resume', resume);
    console.log('pages', pages);
  });

  // Add hidden measuring container for block height measurement
  const measuringContainer = (
    <div
      ref={measureContainerRef}
      style={{ visibility: 'hidden', position: 'absolute', left: -9999, top: 0, width: '800px', pointerEvents: 'none' }}
    >
      {measuringBlocks}
    </div>
  );

  useEffect(() => {
    if (resumeData) {
      setResume(resumeData);
      localStorage.removeItem('aiSuggestions');
    } else if (ocrText) {
      setResume(parseResumeText(ocrText));
      localStorage.removeItem('aiSuggestions');
    }
  }, [resumeData, ocrText]);

  // Sync modalQuestions with jobDetails when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setModalQuestions(jobDetails.customQuestions && jobDetails.customQuestions.length > 0 ? jobDetails.customQuestions : ['']);
    }
    // eslint-disable-next-line
  }, [dialogOpen]);

  const handleQuestionChange = (idx: number, value: string) => {
    setModalQuestions(qs => qs.map((q, i) => i === idx ? value : q));
  };
  const handleAddQuestion = () => {
    setModalQuestions(qs => [...qs, '']);
  };
  const handleRemoveQuestion = (idx: number) => {
    setModalQuestions(qs => qs.length === 1 ? [''] : qs.filter((_, i) => i !== idx));
  };

  // Handler for dialog submit
  const handleTailorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newJobDetails = {
      company: formData.get('company') as string,
      jobTitle: formData.get('jobTitle') as string,
      jobDescription: formData.get('jobDescription') as string,
      customQuestions: modalQuestions.filter(q => q.trim() !== ''),
      generateCoverLetter: !!formData.get('coverLetter'),
    };
    setJobDetails(newJobDetails);
    setShowProcessing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Missing Gemini API key');
      const geminiResult = await generateTailoredResumeWithGemini({
        resume,
        jobDetails: newJobDetails,
        apiKey,
      });
      setAISuggestions(geminiResult);
      setShowAISuggestions(true);
    } catch (err) {
      // Optionally show error to user
      console.error('Gemini error', err);
      alert('Failed to generate tailored suggestions. Please try again.');
    } finally {
      setShowProcessing(false);
      setDialogOpen(false);
    }
  };

  const handleEditJob = () => {
    setDialogOpen(true);
    setJobDetails((prev: any) => ({ ...prev, generateCoverLetter: false }));
  };

  useEffect(() => {
    localStorage.setItem('aiSuggestions', JSON.stringify(aiSuggestions));
  }, [aiSuggestions]);

  return (
    <>
      {measuringContainer}
      <Header variant="resume-builder" onDownload={handleDownload} />
      <div className="h-auto flex flex-col md:flex-row gap-8 overflow-x-hidden px-4 md:px-8">
        {/* Left: Tabs and Editor/Tailor content */}
        <div className="flex-1 min-w-[350px] max-w-[700px] bg-white rounded-xl p-8 h-full max-h-screen overflow-y-auto mb-8">
          <Tabs defaultValue="editor" className="w-auto">
            <TabsList className="w-auto flex mb-6">
              <TabsTrigger value="editor" className="flex-1">Editor</TabsTrigger>
              <TabsTrigger value="tailor" className="flex-1">Tailor for job</TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="personal-info">
                  <AccordionTrigger>Personal Info</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">Full name</label>
                        <Input value={resume.fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('fullName', e.target.value)} placeholder="Tom Smith" />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Job title</label>
                        <Input value={resume.jobTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('jobTitle', e.target.value)} placeholder="Senior Product Designer" />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Location</label>
                        <Input value={resume.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('location', e.target.value)} placeholder="San Francisco, United States" />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Email</label>
                        <Input value={resume.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)} placeholder="tom_smith@gmail.com" />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Personal website</label>
                        <Input value={resume.portfolio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('portfolio', e.target.value)} placeholder="tomsmith.com" />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">LinkedIn</label>
                        <Input value={resume.linkedin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('linkedin', e.target.value)} placeholder="linkedin.com/in/tom-smith" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="summary">
                  <AccordionTrigger>Summary</AccordionTrigger>
                  <AccordionContent>
                    <div>
                      <Textarea value={resume.summary} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('summary', e.target.value)} rows={3} />
                      <div className="text-xs text-muted-foreground mt-1">Leave empty if you don't want to include it in the resume</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="experience">
                  <AccordionTrigger>Experience</AccordionTrigger>
                  <AccordionContent>
                    <div>
                      {(Array.isArray(resume.experience) ? resume.experience : []).map((exp, idx) => (
                        <div key={idx} className="mb-3 p-3 rounded-lg border border-border relative">
                          {/* Remove button in top-right */}
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="absolute top-[-12px] right-[-12px] w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-100 transition shadow-sm"
                            aria-label="Remove experience"
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" className="text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 6L12 12M12 6L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <div className="flex gap-2 mb-2">
                            <Input className="flex-1" placeholder="Company" value={exp.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleExperienceChange(idx, 'company', e.target.value)} />
                            <Input className="flex-1" placeholder="Job title" value={exp.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleExperienceChange(idx, 'title', e.target.value)} />
                          </div>
                          <div className="flex gap-2 mb-2">
                            <Input className="flex-1" placeholder="Period" value={exp.period} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleExperienceChange(idx, 'period', e.target.value)} />
                            <Input className="flex-1" placeholder="Location" value={exp.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleExperienceChange(idx, 'location', e.target.value)} />
                          </div>
                          <Textarea
                            placeholder={`• Designed a marketing campaign that increased client engagement by 50%\n• Created over 100 graphic designs for various clients, maintaining a 95% client satisfaction rate\n• Revamped a major brand's visual identity, leading to a 30% increase in their social media following`}
                            value={exp.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleExperienceChange(idx, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>
                      ))}
                      <Button variant="outline" onClick={handleAddExperience}>Add experience</Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="education">
                  <AccordionTrigger>Education</AccordionTrigger>
                  <AccordionContent>
                    <div>
                      {(Array.isArray(resume.education) ? resume.education : []).map((edu, idx) => (
                        <div key={idx} className="mb-3 p-3 rounded-lg border border-border relative">
                          {/* Remove button in top-right */}
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(idx)}
                            className="absolute top-[-12px] right-[-12px] w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-100 transition shadow-sm"
                            aria-label="Remove education"
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" className="text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 6L12 12M12 6L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <div className="flex gap-2 mb-2">
                            <Input className="flex-1" placeholder="School" value={edu.school} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEducationChange(idx, 'school', e.target.value)} />
                            <Input className="flex-1" placeholder="Degree" value={edu.degree} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEducationChange(idx, 'degree', e.target.value)} />
                          </div>
                          <div className="flex gap-2 mb-2">
                            <Input className="flex-1" placeholder="Period" value={edu.period} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEducationChange(idx, 'period', e.target.value)} />
                            <Input className="flex-1" placeholder="Location" value={edu.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEducationChange(idx, 'location', e.target.value)} />
                          </div>
                          <Textarea placeholder="Description" value={edu.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleEducationChange(idx, 'description', e.target.value)} rows={2} />
                        </div>
                      ))}
                      <Button variant="outline" onClick={handleAddEducation}>Add education</Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="skills">
                  <AccordionTrigger>Skills</AccordionTrigger>
                  <AccordionContent>
                    <div>
                      <Input value={resume.skills} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleListChange('skills', e.target.value)} placeholder="Product design, HTML, CSS, User research" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tools">
                  <AccordionTrigger>Tools</AccordionTrigger>
                  <AccordionContent>
                    <div>
                      <Input value={resume.tools} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleListChange('tools', e.target.value)} placeholder="Figma, Cursor, Framer, Notion" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="languages">
                  <AccordionTrigger>Languages</AccordionTrigger>
                  <AccordionContent>
                    <div>
                      <Input value={resume.languages} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleListChange('languages', e.target.value)} placeholder="English, Ukrainian, Spanish" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="tailor">
              {showAISuggestions ? (
                <TailoredAISuggestions jobDetails={jobDetails} aiSuggestions={aiSuggestions} onEditJob={handleEditJob} hoveredSection={hoveredSection} setHoveredSection={setHoveredSection} resume={resume} setResume={setResume} setAISuggestions={setAISuggestions} />
              ) : (
                <div className="flex flex-col items-center mx-auto text-center justify-center h-full w-full max-w-[380px] my-16">
                  <img src="/assets/no-tailor-job.png" alt="Upload resume" className="w-40 h-40 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">Tailor your resume to any job</h2>
                  <p className="text-muted-foreground mb-8">Add company name, job description, custom questions and AI will generate tailored resume for it.</p>
                  <MagneticButton onClick={() => setDialogOpen(true)}>
                    Add job details
                  </MagneticButton>
                </div>
              )}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add job details</DialogTitle>
                    <DialogDescription>
                      Add company details, job description and custom questions. AI will tailor your resume and answer to questions based on your experience.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-8" onSubmit={handleTailorSubmit}>
                    {/*
                    <div className="flex gap-2 items-end mb-2">
                      <Input
                        className="flex-1"
                        placeholder="Paste job URL (e.g. https://jobs.example.com/123)"
                        value={jobUrl}
                        onChange={e => setJobUrl(e.target.value)}
                        disabled={jobUrlLoading}
                      />
                      <Button type="button" variant="outline" onClick={handleExtractJobFromUrl} disabled={jobUrlLoading || !jobUrl}>
                        {jobUrlLoading ? (
                          <span className="flex items-center gap-2">
                            <svg aria-hidden="true" className="w-4 h-4 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#2563EB"/>
                            </svg>
                            Extracting...
                          </span>
                        ) : 'Add job'}
                      </Button>
                    </div>
                    */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Company</label>
                        <Input name="company" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Apple" defaultValue={jobDetails.company} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Job title</label>
                        <Input name="jobTitle" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Product Designer" defaultValue={jobDetails.jobTitle} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Job description</label>
                      <Textarea name="jobDescription" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[120px]" placeholder="Paste the job description here..." defaultValue={jobDetails.jobDescription} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Custom questions</label>
                      {modalQuestions.map((q, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          <Input
                            className="w-full"
                            placeholder="Why you are great fit for that role?"
                            value={q}
                            onChange={e => handleQuestionChange(idx, e.target.value)}
                            name={`customQuestion${idx}`}
                          />
                          {modalQuestions.length > 1 && (
                            <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveQuestion(idx)} aria-label="Remove question">
                              <svg width="18" height="18" viewBox="0 0 18 18" className="text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L12 12M12 6L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" type="button" className="mt-1" onClick={handleAddQuestion}>Add question</Button>
                    </div>
                    <div className="flex items-start gap-3 mt-2">
                      <label className="w-full cursor-pointer hover:bg-slate-50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-slate-900 dark:has-[[aria-checked=true]]:border-slate-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                        <Checkbox
                          id="cover-letter"
                          name="coverLetter"
                          defaultChecked={false}
                          className="data-[state=checked]:border-slate-900 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white dark:data-[state=checked]:border-bl-slate-700 dark:data-[state=checked]:bg-bl-slate-700 transition-colors duration-150"
                        />
                        <div className="grid gap-1.5 font-normal">
                          <p className="text-sm leading-none font-medium">
                            Generate cover letter
                          </p>
                          <p className="text-muted-foreground text-sm">
                            AI will generate a tailored cover letter for this job.
                          </p>
                        </div>
                      </label>
                    </div>
                    <DialogFooter className="mt-6">
                      <Button variant="outline" type="button" onClick={() => setDialogOpen(false)} disabled={showProcessing}>Cancel</Button>
                      <Button type="submit" className="bg-primary text-white" disabled={showProcessing}>
                        {showProcessing ? (
                          <span className="flex items-center gap-2">
                            <svg aria-hidden="true" className="w-5 h-5 text-gray-200 animate-spin fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                            Tailoring
                          </span>
                        ) : (
                          'Tailor my resume'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
        {/* Right: Resume preview */}
        <div className="flex flex-col items-center flex-1 w-full h-full">
          <div
            ref={previewRef}
            className={`bg-white rounded-xl w-[816px] mx-auto mb-8 p-10 overflow-y-auto max-w-full${!isExportingPDF ? ' h-[1056px]' : ''}`}
          >
            {pages.map((page, index) => (
              <div key={index} className="mb-8">
                <div className="flex flex-col gap-5">
                  {page.map((block, blockIndex) => (
                    <div key={`${index}-${blockIndex}`}> 
                      {block}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

function TailoredAISuggestions({ jobDetails, aiSuggestions, onEditJob, hoveredSection, setHoveredSection, resume, setResume, setAISuggestions }: any) {
  const [regenerating, setRegenerating] = React.useState<string | null>(null);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };
  // Accept handler
  const handleAccept = (sectionKey: string, idx?: number) => {
    if (sectionKey === 'summary') {
      setResume((prev: any) => ({ ...prev, summary: aiSuggestions.summary }));
      setAISuggestions((prev: any) => ({ ...prev, summary: undefined }));
    } else if (sectionKey.startsWith('work-')) {
      const i = idx ?? parseInt(sectionKey.split('-')[1], 10);
      setResume((prev: any) => ({
        ...prev,
        experience: prev.experience.map((exp: any, j: number) =>
          j === i
            ? {
                ...exp,
                company: aiSuggestions.workExperience[i].company,
                title: aiSuggestions.workExperience[i].title,
                period: aiSuggestions.workExperience[i].date,
                description: aiSuggestions.workExperience[i].bullets.join('\n'),
              }
            : exp
        ),
      }));
      setAISuggestions((prev: any) => ({
        ...prev,
        workExperience: prev.workExperience.filter((_: any, j: number) => j !== i),
      }));
    } else if (sectionKey === 'skills') {
      setResume((prev: any) => ({ ...prev, skills: aiSuggestions.skills }));
      setAISuggestions((prev: any) => ({ ...prev, skills: undefined }));
    } else if (sectionKey === 'tools') {
      setResume((prev: any) => ({ ...prev, tools: aiSuggestions.tools }));
      setAISuggestions((prev: any) => ({ ...prev, tools: undefined }));
    } else if (sectionKey === 'education') {
      setResume((prev: any) => ({ ...prev, education: aiSuggestions.education }));
      setAISuggestions((prev: any) => ({ ...prev, education: undefined }));
    } else if (sectionKey.startsWith('custom-question-')) {
      const i = idx ?? parseInt(sectionKey.split('-')[2], 10);
      // Accept: copy to clipboard and remove suggestion
      handleCopy(aiSuggestions.customQuestionAnswers[i]);
      setAISuggestions((prev: any) => ({
        ...prev,
        customQuestionAnswers: prev.customQuestionAnswers.map((a: string, j: number) => (j === i ? undefined : a)),
      }));
    } else if (sectionKey === 'cover-letter') {
      handleCopy(aiSuggestions.coverLetter);
      setAISuggestions((prev: any) => ({ ...prev, coverLetter: undefined }));
    }
  };
  const handleDecline = (sectionKey: string, idx?: number) => {
    if (sectionKey === 'summary') {
      setAISuggestions((prev: any) => ({ ...prev, summary: undefined }));
    } else if (sectionKey.startsWith('work-')) {
      const i = idx ?? parseInt(sectionKey.split('-')[1], 10);
      setAISuggestions((prev: any) => ({
        ...prev,
        workExperience: prev.workExperience.filter((_: any, j: number) => j !== i),
      }));
    } else if (sectionKey === 'skills') {
      setAISuggestions((prev: any) => ({ ...prev, skills: undefined }));
    } else if (sectionKey === 'tools') {
      setAISuggestions((prev: any) => ({ ...prev, tools: undefined }));
    } else if (sectionKey === 'education') {
      setAISuggestions((prev: any) => ({ ...prev, education: undefined }));
    } else if (sectionKey.startsWith('custom-question-')) {
      const i = idx ?? parseInt(sectionKey.split('-')[2], 10);
      setAISuggestions((prev: any) => ({
        ...prev,
        customQuestionAnswers: prev.customQuestionAnswers.map((a: string, j: number) => (j === i ? undefined : a)),
      }));
    } else if (sectionKey === 'cover-letter') {
      setAISuggestions((prev: any) => ({ ...prev, coverLetter: undefined }));
    }
  };
  const handleRegenerate = async (sectionKey: string, idx?: number) => {
    setRegenerating(sectionKey);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    try {
      const newSuggestions = await generateTailoredResumeWithGemini({ resume, jobDetails, apiKey });
      console.log('New AI suggestions:', newSuggestions);
      if (sectionKey === 'summary') {
        setAISuggestions((prev: any) => ({ ...prev, summary: newSuggestions.summary }));
      } else if (sectionKey.startsWith('work-')) {
        const i = idx ?? parseInt(sectionKey.split('-')[1], 10);
        setAISuggestions((prev: any) => ({
          ...prev,
          workExperience: prev.workExperience.map((w: any, j: number) => (j === i ? newSuggestions.workExperience[i] : w)),
        }));
      } else if (sectionKey === 'skills') {
        setAISuggestions((prev: any) => ({ ...prev, skills: newSuggestions.skills }));
      } else if (sectionKey === 'tools') {
        setAISuggestions((prev: any) => ({ ...prev, tools: newSuggestions.tools }));
      } else if (sectionKey === 'education') {
        setAISuggestions((prev: any) => ({ ...prev, education: newSuggestions.education }));
      } else if (sectionKey.startsWith('custom-question-')) {
        const i = idx ?? parseInt(sectionKey.split('-')[2], 10);
        if (newSuggestions.customQuestionAnswers && newSuggestions.customQuestionAnswers[i]) {
          setAISuggestions((prev: any) => ({
            ...prev,
            customQuestionAnswers: prev.customQuestionAnswers.map((a: string, j: number) => (j === i ? newSuggestions.customQuestionAnswers[i] : a)),
          }));
        } else {
          console.warn('No customQuestionAnswers returned for regenerate:', newSuggestions);
        }
      } else if (sectionKey === 'cover-letter') {
        if (newSuggestions.coverLetter) {
          setAISuggestions((prev: any) => ({ ...prev, coverLetter: newSuggestions.coverLetter }));
        } else {
          console.warn('No coverLetter returned for regenerate:', newSuggestions);
        }
      }
    } catch (e) {
      alert('Failed to regenerate suggestion.');
    } finally {
      setRegenerating(null);
    }
  };
  const hasAISuggestions = Boolean(
    (aiSuggestions.summary && aiSuggestions.summary.trim()) ||
    (aiSuggestions.workExperience && aiSuggestions.workExperience.length > 0) ||
    (aiSuggestions.skills && aiSuggestions.skills.trim()) ||
    (aiSuggestions.tools && aiSuggestions.tools.trim()) ||
    (aiSuggestions.education && aiSuggestions.education.trim())
  );
  return (
    <div className="w-full mx-auto rounded-xl">
      <div className="flex items-center justify-between mb-4 border rounded-lg border-slate-200 p-2">
        <div className="flex items-center pl-2">
          <Sparkles size={18} />
          <span className="text-base pl-2 font-medium">Tailored to {jobDetails.company}</span>
        </div>
        <Button variant="ghost" onClick={onEditJob}>Edit job details</Button>
      </div>
      <Accordion type="multiple" className="w-full">
        {/* AI Suggestions Section */}
        {hasAISuggestions && (
          <AccordionItem value="ai-suggestions">
            <AccordionTrigger>AI suggestions</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4">
              {/* Summary */}
              {aiSuggestions.summary && (
                <div>
                  <div className="font-semibold mb-2">Summary</div>
                  <AISuggestionField
                    sectionKey="summary"
                    hoveredSection={hoveredSection}
                    setHoveredSection={setHoveredSection}
                    mode="ai"
                    onAccept={() => handleAccept('summary')}
                    onDecline={() => handleDecline('summary')}
                    onRegenerate={() => handleRegenerate('summary')}
                  >
                    {regenerating === 'summary' ? <TextShimmer>Regenerating...</TextShimmer> : aiSuggestions.summary}
                  </AISuggestionField>
                </div>
              )}
              {/* Work Experience */}
              {aiSuggestions.workExperience && aiSuggestions.workExperience.length > 0 && (
                <div>
                  <div className="font-semibold mb-2">Work experience</div>
                  {aiSuggestions.workExperience.map((exp: any, i: number) => (
                    <div key={i} className="mb-3">
                      <AISuggestionField
                        sectionKey={`work-${i}`}
                        hoveredSection={hoveredSection}
                        setHoveredSection={setHoveredSection}
                        mode="ai"
                        onAccept={() => handleAccept(`work-${i}`, i)}
                        onDecline={() => handleDecline(`work-${i}`, i)}
                        onRegenerate={() => handleRegenerate(`work-${i}`, i)}
                      >
                        {regenerating === `work-${i}` ? <TextShimmer>Regenerating...</TextShimmer> : (
                          <div className="w-full">
                            <div className="font-medium">{exp.company} — {exp.title}</div>
                            {/* Date removed as requested */}
                            <ul className="list-disc pl-5">
                              {exp.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                            </ul>
                          </div>
                        )}
                      </AISuggestionField>
                    </div>
                  ))}
                </div>
              )}
              {/* Education */}
              {aiSuggestions.education && (
                <div>
                  <div className="font-semibold mb-2">Education</div>
                  <AISuggestionField
                    sectionKey="education"
                    hoveredSection={hoveredSection}
                    setHoveredSection={setHoveredSection}
                    mode="ai"
                    onAccept={() => handleAccept('education')}
                    onDecline={() => handleDecline('education')}
                    onRegenerate={() => handleRegenerate('education')}
                  >
                    {regenerating === 'education' ? <TextShimmer>Regenerating...</TextShimmer> : aiSuggestions.education}
                  </AISuggestionField>
                </div>
              )}
              {/* Skills */}
              {aiSuggestions.skills && (
                <div>
                  <div className="font-semibold mb-2">Skills</div>
                  <AISuggestionField
                    sectionKey="skills"
                    hoveredSection={hoveredSection}
                    setHoveredSection={setHoveredSection}
                    mode="ai"
                    onAccept={() => handleAccept('skills')}
                    onDecline={() => handleDecline('skills')}
                    onRegenerate={() => handleRegenerate('skills')}
                  >
                    {regenerating === 'skills' ? <TextShimmer>Regenerating...</TextShimmer> : aiSuggestions.skills}
                  </AISuggestionField>
                </div>
              )}
              {/* Tools */}
              {aiSuggestions.tools && (
                <div>
                  <div className="font-semibold mb-2">Tools</div>
                  <AISuggestionField
                    sectionKey="tools"
                    hoveredSection={hoveredSection}
                    setHoveredSection={setHoveredSection}
                    mode="ai"
                    onAccept={() => handleAccept('tools')}
                    onDecline={() => handleDecline('tools')}
                    onRegenerate={() => handleRegenerate('tools')}
                  >
                    {regenerating === 'tools' ? <TextShimmer>Regenerating...</TextShimmer> : aiSuggestions.tools}
                  </AISuggestionField>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
        {/* Custom Questions Section */}
        {jobDetails.customQuestions && jobDetails.customQuestions.length > 0 && aiSuggestions.customQuestionAnswers && aiSuggestions.customQuestionAnswers.length > 0 && (
          <AccordionItem value="custom-questions">
            <AccordionTrigger>Custom questions</AccordionTrigger>
            <AccordionContent>
              {jobDetails.customQuestions.map((q: string, idx: number) => (
                <div key={idx} className="mb-4">
                  <div className="font-semibold mb-2">{q}</div>
                  <AISuggestionField
                    sectionKey={`custom-question-${idx}`}
                    hoveredSection={hoveredSection}
                    setHoveredSection={setHoveredSection}
                    mode="copy"
                    onCopy={() => handleCopy(aiSuggestions.customQuestionAnswers[idx])}
                    onRegenerate={() => handleRegenerate(`custom-question-${idx}`, idx)}
                  >
                    {regenerating === `custom-question-${idx}` ? <TextShimmer>Regenerating...</TextShimmer> : aiSuggestions.customQuestionAnswers[idx]}
                  </AISuggestionField>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
        {/* Cover Letter Section */}
        {jobDetails.generateCoverLetter && aiSuggestions.coverLetter && (
          <AccordionItem value="cover-letter">
            <AccordionTrigger>Cover letter</AccordionTrigger>
            <AccordionContent>
              <AISuggestionField
                sectionKey="cover-letter"
                hoveredSection={hoveredSection}
                setHoveredSection={setHoveredSection}
                mode="copy"
                onCopy={() => handleCopy(aiSuggestions.coverLetter)}
                onRegenerate={() => handleRegenerate('cover-letter')}
              >
                {regenerating === 'cover-letter' ? <TextShimmer>Regenerating...</TextShimmer> : <div className="whitespace-pre-line">{aiSuggestions.coverLetter}</div>}
              </AISuggestionField>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

export default ResumeBuilder;