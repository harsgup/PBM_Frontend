export interface Cycle {
    id: number;
    name: string;
}

export interface Post {
    id: number;
    name: string;
}

export interface CandidateDetail {
    id: number;
    applicationNo: string;
    Post: string;
    name: string;
    Date_of_Birth: string;
    EQR: string;
    Additional_Qualification:string
}

// Candidate details list response
export interface TotalDuration {
  years: number;
  months: number;
  days: number;
}

export interface ExperienceDetail {
  name: string;
  type: string;
  employment_type: string;
  designation: string;
  from_date: string;
  to_date: string;
  duration: string;
  experience: string;
  totalDuration: TotalDuration;
}

export interface EducationDetails {
  qualification: string;
  subject: string;
  passing_status: string;
  passing_date: string;
  board_name: string;
  marking_scheme: string;
  obtained_marks_CGPA: number;
  total_marks_CGPA: number;
  class_division: string;
}

export interface PersonalDetails {
  id: number;
  application_no: string;
  candidate_name: string;
  father_name: string;
  mother_name: string;
  date_of_birth: string;
  age: string;
  gender: string;
  category: string;
  category_certificate_no: string;
  category_certificate_issue_date: string;
  category_certificate_issue_state: string;
  disability: string;
  type_of_disability: string;
  percentage_of_disability: string;
  disability_certificate_no: string;
  disability_certificate_issue_date: string;
  Ex_serviceman: string;
  date_of_joining: string;
  date_of_discharge: string;
  minority: string;
  minority_type: string;
  marital_status: string;
  identity_type: string;
  identity_no: string;
}

export interface CandidateDetails {
  personal_details: PersonalDetails;
  education_details: EducationDetails;
  experience_details: ExperienceDetail[];
}