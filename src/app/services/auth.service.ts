import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {env} from '../config/environment'
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = env.apiUrl;

  constructor(private http: HttpClient) { }

 login(username: string, password: string) {
  const payload = new FormData();
  payload.append('username', username);
  payload.append('password', password);
  return this.http.post<any>(`${this.baseUrl}/auth/login`, payload);
}

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }


  decodeToken(): any | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }

  getTokenExpiry(): number | null {
    const decoded = this.decodeToken();
    return decoded?.exp ? decoded.exp * 1000 : null; 
  }

  getRole():any | null {
    const decoded = this.decodeToken();
    return decoded.role;
  }

  logout() {
    localStorage.clear();
    location.href = '/login';
  }
}
