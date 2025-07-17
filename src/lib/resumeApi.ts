import { supabase } from './supabaseClient';

// Define types for resume fields
export interface ResumeData {
  fullName: string;
  jobTitle: string;
  location: string;
  email: string;
  portfolio: string;
  linkedin: string;
  summary: string;
  experience: any[];
  education: any[];
  skills: string;
  tools: string;
  languages: string;
  [key: string]: any;
}

export interface CreateResumeParams {
  resume_name: string;
  resume_data: ResumeData;
  ai_suggestions?: any;
  custom_questions?: any;
  cover_letter?: string;
  user_id?: string;
}

// CREATE
export async function createResume({ resume_name, resume_data, ai_suggestions, custom_questions, cover_letter, user_id }: CreateResumeParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const insertPayload = {
    resume_name,
    resume_data,
    ai_suggestions,
    custom_questions,
    cover_letter,
    user_id: user_id || user.id,
  };
  console.log('Insert payload:', insertPayload);
  console.log('Authenticated user_id:', user.id);
  const { data, error } = await supabase
    .from('resumes')
    .insert([insertPayload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// READ (all for user)
export async function fetchResumes() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

// UPDATE
export async function updateResume(id: string, updates: Partial<CreateResumeParams>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { data, error } = await supabase
    .from('resumes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// DELETE
export async function deleteResume(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id);
  if (error) throw error;
} 