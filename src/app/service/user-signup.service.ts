import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class UserSignUpService {
    constructor(private http: HttpClient) { }

    getAllUsers(): Observable<any> {
        // const apiUrl = 'http://localhost:8080/api/user'; 
        const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/user';
        return this.http.get(apiUrl);
    }

    getUserByMobile(mobileNo: string): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/user/${mobileNo}`;
        const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/user/${mobileNo}`;
        return this.http.get(apiUrl);
    }

    registerUser(userData: any): Observable<any> {
        // const apiUrl = 'http://localhost:8080/api/user';
        const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/user';
        return this.http.post(apiUrl, userData);
    }

    updateUser(user: any): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/user/${user.id}`;
        const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/user/${user.id}`;
        return this.http.put(apiUrl, user);
    }

    deleteUser(userId: number): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/user/${userId}`;
        const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/user/${userId}`;
        return this.http.delete(apiUrl);
    }

    userLogin(user: any) {
        // const apiUrl = 'http://localhost:8080/api/user/login';
        const apiUrl = 'https://dictionary-app-backend-9wm9.onrender.com/api/user/login';
        return this.http.post(apiUrl, user);
    }

    getUserDetailsByMobile(mobileNo: string): Observable<any> {
        // const apiUrl = `http://localhost:8080/api/user/userDetails/${mobileNo}`;
        const apiUrl = `https://dictionary-app-backend-9wm9.onrender.com/api/user/userDetails/${mobileNo}`;
        return this.http.get(apiUrl);
    }
}