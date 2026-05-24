export interface CandidateDocument{
    id: number;
    name: string;
    type: 'pdf' | 'image';
    url: string;
}