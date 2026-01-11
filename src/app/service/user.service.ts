import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserDetail {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile: string;
  admin?: boolean;
  bio?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  registeredDate?: Date | string;
  lastLogin?: Date | string;
  quizzesTaken?: number;
  questionsAnswered?: number;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any; // Allow any additional fields from server
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<UserDetail[]> {
    const url = `${this.apiUrl}/user`;
    return this.http.get<UserDetail[]>(url);
  }

  getUserById(id: string | number): Observable<UserDetail> {
    const url = `${this.apiUrl}/user/${id}`;
    return this.http.get<UserDetail>(url);
  }

  getUserByMobile(mobile: string): Observable<UserDetail> {
    const url = `${this.apiUrl}/user/mobile/${mobile}`;
    return this.http.get<UserDetail>(url);
  }
}
