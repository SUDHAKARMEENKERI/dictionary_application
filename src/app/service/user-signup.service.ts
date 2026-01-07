import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserSignUpService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getAllUsers(): Observable<any> {
        const url = `${this.apiUrl}/user`;
        return this.http.get(url);
    }

    getUserByMobile(mobileNo: string): Observable<any> {
        const url = `${this.apiUrl}/user/${mobileNo}`;
        return this.http.get(url);
    }

    registerUser(userData: any): Observable<any> {
        const url = `${this.apiUrl}/user`;
        return this.http.post(url, userData);
    }

    updateUser(user: any): Observable<any> {
        const url = `${this.apiUrl}/user/${user.id}`;
        return this.http.put(url, user);
    }

    patchUser(user: any): Observable<any> {
        const url = `${this.apiUrl}/user/${user.id}`;
        return this.http.patch(url, user);
    }

    deleteUser(userId: number): Observable<any> {
        const url = `${this.apiUrl}/user/${userId}`;
        return this.http.delete(url);
    }

    userLogin(user: any) {
        const url = `${this.apiUrl}/user/login`;
        return this.http.post(url, user);
    }

    getUserDetailsByMobile(mobileNo: string): Observable<any> {
        const url = `${this.apiUrl}/user/userDetails/${mobileNo}`;
        return this.http.get(url);
    }

    getUserCount(): Observable<any> {
        const url = `${this.apiUrl}/user/totalUserCount`;
        return this.http.get(url);
    }
}