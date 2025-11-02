/*
  # SOSE Lajpat Nagar Digital Campus - Complete Database Schema

  1. New Tables
    - `users` - Students, admins, counselors, librarians
    - `notices` - School announcements and updates
    - `homework` - Assignments and submissions
    - `results` - Student marks and report cards
    - `fees` - Fee records and payment tracking
    - `scholarships` - Scholarship applications and status
    - `counseling_requests` - Student counseling sessions
    - `complaints` - Student complaint system
    - `books` - Library book catalog
    - `book_issues` - Book borrowing tracking
    - `chat_messages` - Counselor-student communications
    - `personal_detail_requests` - Profile update requests

  2. Security
    - Enable RLS on all tables
    - Role-based access policies for students, admins, counselors
    - Secure data isolation between users

  3. Features
    - Complete user management system
    - Academic tracking and progress monitoring
    - Library management with digital resources
    - Communication and support systems
*/

-- Users table for all user types
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  student_id text UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'admin', 'counselor', 'librarian')),
  name text NOT NULL,
  date_of_birth date,
  class text,
  roll_number text,
  contact_number text,
  address text,
  parent_contact text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notices table
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general', 'urgent', 'class', 'exam')),
  target_class text,
  created_by uuid REFERENCES users(id),
  attachment_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Homework table
CREATE TABLE IF NOT EXISTS homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  subject text NOT NULL,
  class text NOT NULL,
  due_date date NOT NULL,
  created_by uuid REFERENCES users(id),
  attachment_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Homework submissions
CREATE TABLE IF NOT EXISTS homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid REFERENCES homework(id),
  student_id uuid REFERENCES users(id),
  submission_text text,
  attachment_url text,
  submitted_at timestamptz DEFAULT now(),
  marks integer,
  remarks text,
  graded_by uuid REFERENCES users(id),
  graded_at timestamptz
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id),
  exam_type text NOT NULL CHECK (exam_type IN ('class_test', 'midterm', 'final')),
  subject text NOT NULL,
  marks_obtained integer NOT NULL,
  total_marks integer NOT NULL,
  grade text,
  exam_date date,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Fees table
CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id),
  fee_type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  paid_amount decimal(10,2) DEFAULT 0,
  payment_date date,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Scholarships table
CREATE TABLE IF NOT EXISTS scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id),
  scholarship_type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  application_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES users(id),
  approved_date date,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Counseling requests
CREATE TABLE IF NOT EXISTS counseling_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id),
  counselor_id uuid REFERENCES users(id),
  reason text NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  session_notes text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean DEFAULT false,
  attachment_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  admin_notes text,
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Books table for library
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text UNIQUE,
  subject text,
  total_copies integer DEFAULT 1,
  available_copies integer DEFAULT 1,
  description text,
  cover_url text,
  is_digital boolean DEFAULT false,
  digital_url text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Book issues tracking
CREATE TABLE IF NOT EXISTS book_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id),
  student_id uuid REFERENCES users(id),
  issued_date date DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  fine_amount decimal(10,2) DEFAULT 0,
  status text DEFAULT 'issued' CHECK (status IN ('requested', 'issued', 'returned', 'overdue')),
  issued_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages for counseling
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counseling_request_id uuid REFERENCES counseling_requests(id),
  sender_id uuid REFERENCES users(id),
  message text NOT NULL,
  attachment_url text,
  sent_at timestamptz DEFAULT now()
);

-- Personal detail update requests
CREATE TABLE IF NOT EXISTS personal_detail_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id),
  field_name text NOT NULL,
  current_value text,
  requested_value text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES users(id),
  reason text,
  requested_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_detail_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'counselor')
  ));

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for notices
CREATE POLICY "All authenticated users can read notices" ON notices
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for homework
CREATE POLICY "Students can read homework for their class" ON homework
  FOR SELECT TO authenticated
  USING (
    class = (SELECT class FROM users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'counselor'))
  );

CREATE POLICY "Admins can manage homework" ON homework
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for homework submissions
CREATE POLICY "Students can manage own submissions" ON homework_submissions
  FOR ALL TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'counselor'))
  );

-- RLS Policies for results
CREATE POLICY "Students can read own results" ON results
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'counselor'))
  );

CREATE POLICY "Admins can manage results" ON results
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for fees
CREATE POLICY "Students can read own fees" ON fees
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'counselor'))
  );

CREATE POLICY "Admins can manage fees" ON fees
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for scholarships
CREATE POLICY "Students can manage own scholarships" ON scholarships
  FOR ALL TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'counselor'))
  );

-- RLS Policies for counseling requests
CREATE POLICY "Students and counselors can access counseling" ON counseling_requests
  FOR ALL TO authenticated
  USING (
    student_id = auth.uid() OR 
    counselor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for complaints
CREATE POLICY "Students can manage own complaints" ON complaints
  FOR ALL TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'counselor'))
  );

-- RLS Policies for books
CREATE POLICY "All authenticated users can read books" ON books
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and librarians can manage books" ON books
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'librarian')
  ));

-- RLS Policies for book issues
CREATE POLICY "Students can read own book issues" ON book_issues
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'librarian'))
  );

CREATE POLICY "Students can create book requests" ON book_issues
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Librarians can manage book issues" ON book_issues
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'librarian')
  ));

-- RLS Policies for chat messages
CREATE POLICY "Counseling participants can access messages" ON chat_messages
  FOR ALL TO authenticated
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM counseling_requests cr 
      WHERE cr.id = counseling_request_id 
      AND (cr.student_id = auth.uid() OR cr.counselor_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for personal detail requests
CREATE POLICY "Students can manage own detail requests" ON personal_detail_requests
  FOR ALL TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert dummy data
INSERT INTO users (id, email, student_id, password_hash, role, name, date_of_birth, class, roll_number, contact_number, address, parent_contact) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@sose.edu.in', NULL, '$2a$12$dummy.hash.for.admin123', 'admin', 'Aftab Alam', '1990-05-15', NULL, NULL, '9876543210', 'Lajpat Nagar, Delhi', NULL),
('22222222-2222-2222-2222-222222222222', 'counselor@sose.edu.in', NULL, '$2a$12$dummy.hash.for.counselor', 'counselor', 'Dr. Priya Sharma', '1985-08-20', NULL, NULL, '9876543211', 'South Delhi', NULL),
('33333333-3333-3333-3333-333333333333', NULL, 'SOSE2024001', '$2a$12$dummy.hash.for.student', 'student', 'Rahul Kumar', '2010-03-15', '10th', '001', '9876543212', 'Lajpat Nagar, Delhi', '9876543213'),
('44444444-4444-4444-4444-444444444444', NULL, 'SOSE2024002', '$2a$12$dummy.hash.for.student2', 'student', 'Priya Singh', '2009-07-22', '11th', '002', '9876543214', 'CR Park, Delhi', '9876543215'),
('55555555-5555-5555-5555-555555555555', 'librarian@sose.edu.in', NULL, '$2a$12$dummy.hash.for.librarian', 'librarian', 'Mr. Raj Patel', '1980-12-10', NULL, NULL, '9876543216', 'East Delhi', NULL);

-- Insert dummy notices
INSERT INTO notices (id, title, content, category, target_class, created_by, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Welcome to New Academic Session 2024-25', 'We welcome all students to the new academic session. Classes will begin from April 1st, 2024. Please ensure you have all required books and stationery.', 'general', NULL, '11111111-1111-1111-1111-111111111111', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Class 10th Board Exam Schedule Released', 'The CBSE Board examination schedule for Class 10th has been released. Please check the detailed timetable and prepare accordingly.', 'urgent', '10th', '11111111-1111-1111-1111-111111111111', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Library Hours Extended', 'Library hours have been extended till 7 PM on weekdays and 2 PM on Saturdays to facilitate better study environment for students.', 'general', NULL, '11111111-1111-1111-1111-111111111111', true);

-- Insert dummy homework
INSERT INTO homework (id, title, description, subject, class, due_date, created_by, is_active) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Algebra Chapter 2 - Linear Equations', 'Solve all questions from Exercise 2.1 and 2.2. Show complete working for each problem. Use graph paper where required.', 'Mathematics', '10th', '2024-04-15', '11111111-1111-1111-1111-111111111111', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Physics - Light and Reflection', 'Complete the worksheet on ray diagrams and numerical problems on mirror formula. Submit diagrams drawn with proper scale.', 'Physics', '10th', '2024-04-18', '11111111-1111-1111-1111-111111111111', true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'English Literature - Poem Analysis', 'Write a detailed analysis of the poem "Fire and Ice" by Robert Frost. Include literary devices used and personal interpretation.', 'English', '10th', '2024-04-20', '11111111-1111-1111-1111-111111111111', true);

-- Insert dummy results
INSERT INTO results (id, student_id, exam_type, subject, marks_obtained, total_marks, grade, exam_date, created_by) VALUES
('gggggggg-gggg-gggg-gggg-gggggggggggg', '33333333-3333-3333-3333-333333333333', 'midterm', 'Mathematics', 85, 100, 'A', '2024-03-15', '11111111-1111-1111-1111-111111111111'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '33333333-3333-3333-3333-333333333333', 'midterm', 'Physics', 78, 100, 'B+', '2024-03-16', '11111111-1111-1111-1111-111111111111'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', '33333333-3333-3333-3333-333333333333', 'midterm', 'English', 92, 100, 'A+', '2024-03-17', '11111111-1111-1111-1111-111111111111'),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', '44444444-4444-4444-4444-444444444444', 'midterm', 'Chemistry', 88, 100, 'A', '2024-03-15', '11111111-1111-1111-1111-111111111111'),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', '44444444-4444-4444-4444-444444444444', 'midterm', 'Biology', 95, 100, 'A+', '2024-03-16', '11111111-1111-1111-1111-111111111111');

-- Insert dummy fees
INSERT INTO fees (id, student_id, fee_type, amount, due_date, paid_amount, payment_status) VALUES
('llllllll-llll-llll-llll-llllllllllll', '33333333-3333-3333-3333-333333333333', 'Tuition Fee - Q1', 15000.00, '2024-04-30', 15000.00, 'paid'),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', '33333333-3333-3333-3333-333333333333', 'Tuition Fee - Q2', 15000.00, '2024-07-30', 0.00, 'pending'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', '44444444-4444-4444-4444-444444444444', 'Tuition Fee - Q1', 18000.00, '2024-04-30', 18000.00, 'paid'),
('oooooooo-oooo-oooo-oooo-oooooooooooo', '44444444-4444-4444-4444-444444444444', 'Annual Charges', 5000.00, '2024-05-15', 2500.00, 'partial');

-- Insert dummy books
INSERT INTO books (id, title, author, isbn, subject, total_copies, available_copies, description, created_by) VALUES
('pppppppp-pppp-pppp-pppp-pppppppppppp', 'Mathematics Textbook - Class 10', 'NCERT', '978-8174507778', 'Mathematics', 50, 45, 'Official NCERT textbook for Class 10 Mathematics covering all chapters as per CBSE syllabus.', '55555555-5555-5555-5555-555555555555'),
('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'Science Textbook - Physics', 'NCERT', '978-8174507785', 'Physics', 40, 38, 'NCERT Science textbook focusing on Physics concepts for Class 10 students.', '55555555-5555-5555-5555-555555555555'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'English Literature - Flamingo', 'NCERT', '978-8174507792', 'English', 45, 42, 'English Literature textbook with poetry and prose for Class 12 students.', '55555555-5555-5555-5555-555555555555'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'A Brief History of Time', 'Stephen Hawking', '978-0553380163', 'Physics', 10, 8, 'Popular science book explaining complex physics concepts in simple terms.', '55555555-5555-5555-5555-555555555555');

-- Insert dummy book issues
INSERT INTO book_issues (id, book_id, student_id, issued_date, due_date, status, issued_by) VALUES
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'pppppppp-pppp-pppp-pppp-pppppppppppp', '33333333-3333-3333-3333-333333333333', '2024-04-01', '2024-04-15', 'issued', '55555555-5555-5555-5555-555555555555'),
('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 'ssssssss-ssss-ssss-ssss-ssssssssssss', '44444444-4444-4444-4444-444444444444', '2024-04-05', '2024-04-19', 'issued', '55555555-5555-5555-5555-555555555555');

-- Insert dummy counseling request
INSERT INTO counseling_requests (id, student_id, counselor_id, reason, message, status) VALUES
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Academic Stress', 'I am feeling overwhelmed with the upcoming board exams and need guidance on time management and stress handling.', 'accepted');

-- Insert dummy complaint
INSERT INTO complaints (id, student_id, category, title, description, status) VALUES
('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', '33333333-3333-3333-3333-333333333333', 'Facilities', 'Library Air Conditioning Issue', 'The air conditioning in the library is not working properly, making it difficult to study during afternoon hours.', 'in_progress');