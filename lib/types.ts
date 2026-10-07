export type Role = "student" | "teacher";

export interface Profile {
  id: string;
  name: string;
  baptismal_name: string;
  age: number;
  role: Role;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  attend_date: string; // YYYY-MM-DD
  photo_path: string;
  created_at: string;
}
