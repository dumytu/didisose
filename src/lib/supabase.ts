import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email?: string;
          student_id?: string;
          password_hash: string;
          role: 'student' | 'admin' | 'counselor' | 'librarian';
          name: string;
          date_of_birth?: string;
          class?: string;
          roll_number?: string;
          contact_number?: string;
          address?: string;
          parent_contact?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      notices: {
        Row: {
          id: string;
          title: string;
          content: string;
          category: 'general' | 'urgent' | 'class' | 'exam';
          target_class?: string;
          created_by: string;
          attachment_url?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      homework: {
        Row: {
          id: string;
          title: string;
          description: string;
          subject: string;
          class: string;
          due_date: string;
          created_by: string;
          attachment_url?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};