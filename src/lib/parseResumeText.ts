// Utility to parse OCR resume text into structured fields
export interface ExperienceItem {
  company: string;
  title: string;
  dateRange: string;
  description: string;
}

export interface EducationItem {
  school: string;
  degree: string;
  dateRange: string;
  description: string;
}

export interface ParsedResume {
  fullName: string;
  jobTitle: string;
  location: string;
  email: string;
  portfolio: string;
  linkedin: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  tools: string[];
}

export function parseResumeText(text: string): ParsedResume {
  // Improved regex/heuristics for demo purposes
  const fullName = (text.match(/^(.*)\n/) || [])[1] || '';
  const jobTitle = (text.match(/\n([A-Za-z ]+(Designer|Engineer|Manager|Developer|Lead|Director))\n/i) || [])[1] || '';
  const location = (text.match(/([A-Za-z .'-]+, [A-Za-z .'-]+)/) || [])[1] || '';
  const email = (text.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/) || [])[0] || '';
  const portfolio = (text.match(/\b(https?:\/\/)?[\w.-]+\.[a-z]{2,}\b/) || [])[0] || '';
  const linkedin = (text.match(/linkedin\.com\/[\w\/-]+/i) || [])[0] || '';

  // Extract summary (between SUMMARY and WORK EXPERIENCE)
  let summary = '';
  const summaryMatch = text.match(/SUMMARY\n([\s\S]*?)\nWORK EXPERIENCE/i);
  if (summaryMatch) summary = summaryMatch[1].trim();

  // Extract experience blocks
  const experience: ExperienceItem[] = [];
  const expSection = text.split(/WORK EXPERIENCE/i)[1]?.split(/SKILLS|TOOLS|EDUCATION/i)[0] || '';
  const expBlocks = expSection.split(/\n(?=[A-Z][a-zA-Z .'-]+ — )/g);
  expBlocks.forEach(block => {
    const companyTitle = (block.match(/^([A-Za-z .'-]+) — ([^\n]+)/) || []);
    const dateRange = (block.match(/(\w+ \d{4} ?[–-]? ?\w* ?\d{4}?)/) || [])[1] || '';
    const description = block.replace(/^.*\n/, '').replace(dateRange, '').trim();
    if (companyTitle.length > 2) {
      experience.push({
        company: companyTitle[1].trim(),
        title: companyTitle[2].trim(),
        dateRange,
        description,
      });
    }
  });

  // Extract education blocks
  const education: EducationItem[] = [];
  const eduSection = text.split(/EDUCATION/i)[1]?.split(/SKILLS|TOOLS|EXPERIENCE|PROJECTS|CERTIFICATES|$|\n\n/)[0] || '';
  const eduBlocks = eduSection.split(/\n(?=[A-Z][a-zA-Z .'-]+,? ?[A-Za-z .'-]* ?-? ?[A-Za-z .'-]*\n)/g);
  eduBlocks.forEach(block => {
    const schoolDegree = (block.match(/^([A-Za-z .'-]+)[,\- ]+([A-Za-z .'-]+)?/) || []);
    const dateRange = (block.match(/(\w+ \d{4} ?[–-]? ?\w* ?\d{4}?)/) || [])[1] || '';
    const description = block.replace(/^.*\n/, '').replace(dateRange, '').trim();
    if (schoolDegree.length > 1) {
      education.push({
        school: schoolDegree[1]?.trim() || '',
        degree: schoolDegree[2]?.trim() || '',
        dateRange,
        description,
      });
    }
  });

  // Extract skills and tools
  const skills = (text.match(/SKILLS\n([\s\S]*?)(\n[A-Z ]+\n|$)/i) || [])[1]?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const tools = (text.match(/TOOLS\n([\s\S]*?)(\n[A-Z ]+\n|$)/i) || [])[1]?.split(',').map(s => s.trim()).filter(Boolean) || [];

  return {
    fullName,
    jobTitle,
    location,
    email,
    portfolio,
    linkedin,
    summary,
    experience,
    education,
    skills,
    tools,
  };
} 