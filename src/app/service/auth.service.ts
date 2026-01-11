import { Injectable } from '@angular/core';
import { isUserLoggedIn, isUserAdmin, saveLoginStorage, clearLoginStorage, readLoginStorage } from '../util/loginStorage';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggedIn(): boolean {
    return isUserLoggedIn();
  }

  isAdmin(): boolean {
    return isUserAdmin();
  }

  login(token: string) {
    try {
      // If token is a JSON string, parse and save it
      const data = JSON.parse(token);
      saveLoginStorage(data);
    } catch {
      // If token is not JSON, save as is (backward compatibility)
      saveLoginStorage({ isLogIn: true, mobile: token });
    }
  }

  logout() {
    clearLoginStorage();
  }

  getLoginData() {
    return readLoginStorage();
  }
}