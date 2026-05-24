import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {env} from '../config/environment'


export interface User {
  id: number;
  pis: string;
  name: string;
  rank: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private baseUrl = env.apiUrl;

  constructor(private http: HttpClient) { }


 getUsers() {
    return this.http.get<User[]>(`${this.baseUrl}/admin/users`);
  }

  updateUserRole(userId: number, role: string) {
     return this.http.put(`${this.baseUrl}/admin/users/${userId}/role`,{ role });
  }

  addUser(data: {
  pis: string;
  name: string;
  rank: string;
  role: string;
  password: string;
}) {
 return this.http.post<any>(`${this.baseUrl}/admin/users`, data);
}

deleteUser(userId: number) {
  return this.http.delete(`${this.baseUrl}/admin/users/${userId}`
  );
}

}
