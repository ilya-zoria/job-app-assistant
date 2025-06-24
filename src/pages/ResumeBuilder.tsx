import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { parseResumeText } from '../lib/parseResumeText';
import type { ParsedResume, ExperienceItem } from '../lib/parseResumeText';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
  skills: [],
  tools: [],
};

const ResumeBuilder = () => {
  const location = useLocation();
  const ocrText = location.state?.ocrText || '';
  const [resume, setResume] = useState<ParsedResume>(emptyResume);

  useEffect(() => {
    if (ocrText) {
      setResume(parseResumeText(ocrText));
    }
  }, [ocrText]);

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
  const handleAddExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: '', title: '', dateRange: '', description: '' },
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
  const handleAddEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { school: '', degree: '', dateRange: '', description: '' },
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
  const handleListChange = (field: 'skills' | 'tools', value: string) => {
    setResume(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()).filter(Boolean) }));
  };

  return (
    <div className="container mx-auto py-12 flex flex-col md:flex-row gap-8">
      {/* Left: Editable fields */}
      <div className="flex-1 bg-white rounded-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">Full name</label>
            <Input value={resume.fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('fullName', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Job title</label>
            <Input value={resume.jobTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('jobTitle', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Location</label>
            <Input value={resume.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('location', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input value={resume.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Portfolio</label>
            <Input value={resume.portfolio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('portfolio', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">LinkedIn</label>
            <Input value={resume.linkedin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('linkedin', e.target.value)} />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Summary</label>
          <Textarea value={resume.summary} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('summary', e.target.value)} rows={3} />
          <div className="text-xs text-muted-foreground mt-1">Leave empty if you don't want to include it in the resume</div>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Experience</label>
          {resume.experience.map((exp, idx) => (
            <div key={idx} className="mb-3 p-3 rounded-md border border-border">
              <div className="flex gap-2 mb-2">
                <Input className="flex-1" placeholder="Company" value={exp.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleExperienceChange(idx, 'company', e.target.value)} />
                <Input className="flex-1" placeholder="Title" value={exp.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleExperienceChange(idx, 'title', e.target.value)} />
                <Input className="w-40" placeholder="Date range" value={exp.dateRange} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleExperienceChange(idx, 'dateRange', e.target.value)} />
                <Button variant="ghost" onClick={() => handleRemoveExperience(idx)}>-</Button>
              </div>
              <Textarea placeholder="Description" value={exp.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleExperienceChange(idx, 'description', e.target.value)} rows={2} />
            </div>
          ))}
          <Button variant="outline" onClick={handleAddExperience} className="mt-2">Add experience</Button>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Education</label>
          {resume.education.map((edu, idx) => (
            <div key={idx} className="mb-3 p-3 rounded-md border border-border">
              <div className="flex gap-2 mb-2">
                <Input className="flex-1" placeholder="School" value={edu.school} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEducationChange(idx, 'school', e.target.value)} />
                <Input className="flex-1" placeholder="Degree" value={edu.degree} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEducationChange(idx, 'degree', e.target.value)} />
                <Input className="w-40" placeholder="Date range" value={edu.dateRange} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEducationChange(idx, 'dateRange', e.target.value)} />
                <Button variant="ghost" onClick={() => handleRemoveEducation(idx)}>-</Button>
              </div>
              <Textarea placeholder="Description" value={edu.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleEducationChange(idx, 'description', e.target.value)} rows={2} />
            </div>
          ))}
          <Button variant="outline" onClick={handleAddEducation} className="mt-2">Add education</Button>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Skills</label>
          <Input value={resume.skills.join(', ')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleListChange('skills', e.target.value)} placeholder="Comma separated" />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Tools</label>
          <Input value={resume.tools.join(', ')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleListChange('tools', e.target.value)} placeholder="Comma separated" />
        </div>
      </div>
      {/* Right: Resume preview */}
      <div className="flex-1 bg-white rounded-xl p-8 shadow-md border border-border">
        <div className="mb-6">
          <div className="text-3xl font-serif font-bold">{resume.fullName || 'Full Name'}</div>
          <div className="text-lg font-serif mb-2">{resume.jobTitle || 'Job Title'}</div>
          <div className="text-sm text-muted-foreground mb-2">
            {resume.location && <span>{resume.location} | </span>}
            {resume.email && <span>{resume.email} | </span>}
            {resume.portfolio && <span>{resume.portfolio} | </span>}
            {resume.linkedin && <span>{resume.linkedin}</span>}
          </div>
        </div>
        <div className="border-t border-border my-4" />
        {/* Summary section, only if summary exists */}
        {resume.summary && (
          <div className="mb-4">
            <div className="font-bold mb-1">SUMMARY</div>
            <div className="text-sm whitespace-pre-line">{resume.summary}</div>
          </div>
        )}
        {/* Work Experience section, only if experience exists */}
        {resume.experience.length > 0 && (
          <div className="mb-4">
            <div className="font-bold mb-1">WORK EXPERIENCE</div>
            {resume.experience.map((exp, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-semibold">
                  {exp.company} — {exp.title}
                  {exp.dateRange && <span className="ml-2 text-xs text-muted-foreground">{exp.dateRange}</span>}
                </div>
                <div className="text-sm whitespace-pre-line">{exp.description}</div>
              </div>
            ))}
          </div>
        )}
        {/* Education section, only if education exists */}
        {resume.education.length > 0 && (
          <div className="mb-4">
            <div className="font-bold mb-1">EDUCATION</div>
            {resume.education.map((edu, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-semibold">
                  {edu.school} — {edu.degree}
                  {edu.dateRange && <span className="ml-2 text-xs text-muted-foreground">{edu.dateRange}</span>}
                </div>
                <div className="text-sm whitespace-pre-line">{edu.description}</div>
              </div>
            ))}
          </div>
        )}
        {/* Skills section, only if skills exist */}
        {resume.skills.length > 0 && (
          <div className="mb-4">
            <div className="font-bold mb-1">SKILLS</div>
            <div className="text-sm">{resume.skills.join(', ')}</div>
          </div>
        )}
        {/* Tools section, only if tools exist */}
        {resume.tools.length > 0 && (
          <div className="mb-4">
            <div className="font-bold mb-1">TOOLS</div>
            <div className="text-sm">{resume.tools.join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder; 