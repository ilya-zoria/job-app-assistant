import React from 'react';
import SectionHeading from './SectionHeading';

export function getResumeBlocks(resume: any, isExportingPDF = false) {
  const blocks = [];
  // Header
  blocks.push({
    type: 'header',
    key: 'header',
    jsx: (
      <div className="text-center mb-2">
        <div className="text-3xl font-serif font-bold leading-tight">{resume.fullName || 'Full Name'}</div>
        <div className="text-lg font-semibold mt-2 mb-2">{resume.jobTitle || 'Job Title'}</div>
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
            {experienceArr.map((exp: any, idx: any) => (
              <div key={idx} className="flex flex-row gap-4">
                {/* Left column: Company, Title, Description */}
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${(exp.company || exp.title) ? '' : 'text-gray-500'}`}>{(exp.company || exp.title) ? `${exp.company || 'Company'} — ${exp.title || 'Job title'}` : 'Company — Job title'}</div>
                  {exp.description && exp.description.split(/\n|•/).filter(Boolean).map((line: any, i: any) => (
                    <div key={i} className="break-words text-sm">{line.trim()}</div>
                  ))}
                </div>
                {/* Right column: Period, Location */}
                <div className="flex flex-col items-end min-w-[120px] flex-shrink-0">
                  <div className={`italic text-sm text-right whitespace-nowrap ${exp.period ? '' : 'text-gray-500'}`}>{exp.period || 'Period'}</div>
                  <div className={`italic text-sm text-right ${exp.location ? '' : 'text-gray-500'}`}>{exp.location || 'Location'}</div>
                </div>
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
            {educationArr.map((edu: any, idx: any) => (
              <div key={idx} className="flex flex-row gap-4">
                {/* Left column: School, Degree, Description */}
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${(edu.school || edu.degree) ? '' : 'text-gray-500'}`}>{(edu.school || edu.degree) ? `${edu.school || 'School'} — ${edu.degree || 'Degree'}` : 'School — Degree'}</div>
                  {edu.description && edu.description.split(/\n|•/).filter(Boolean).map((line: any, i: any) => (
                    <div key={i} className="break-words text-sm">{line.trim()}</div>
                  ))}
                </div>
                {/* Right column: Period, Location */}
                <div className="flex flex-col items-end min-w-[120px] flex-shrink-0">
                  <div className={`italic text-sm text-right whitespace-nowrap ${edu.period ? '' : 'text-gray-500'}`}>{edu.period || 'Period'}</div>
                  <div className={`italic text-sm text-right ${edu.location ? '' : 'text-gray-500'}`}>{edu.location || 'Location'}</div>
                </div>
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