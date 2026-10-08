export type Role = "student" | "teacher";

export interface Profile {
  id: string;
  name: string;
  baptismal_name: string;
  age: number;
  role: Role;
  created_at: string;
}

export type AttendanceMethod = "photo" | "rosary";

export interface Attendance {
  id: string;
  student_id: string;
  attend_date: string; // YYYY-MM-DD
  method: AttendanceMethod;
  photo_path: string | null; // 묵주기도 출석은 사진 없음
  created_at: string;
}
