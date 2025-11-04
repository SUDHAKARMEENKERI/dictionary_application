import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggedIn(): boolean {
    const loginData = localStorage.getItem('login');
    return !!loginData && JSON.parse(loginData).isLogIn;
  }

  login(token: string) {
    localStorage.setItem('login', token);
  }

  logout() {
    localStorage.removeItem('login');
  }
}