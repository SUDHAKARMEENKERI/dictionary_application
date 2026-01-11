# User List Management - Admin Feature

## Overview
A new admin-only page that displays the list of all registered users with their details. The page ensures that only the admin user (mobile: 9611675325) can access and view user information.

## Features

### 1. **Admin Authentication Check**
- Before loading data, verifies the logged-in user is admin (mobile: `9611675325`)
- If not admin, shows error message and redirects to home page
- Uses `readLoginMobile()` utility to check current user

### 2. **User List Display**
- Responsive grid layout showing user cards
- Each card displays:
  - User avatar icon
  - Name and email
  - Mobile number
  - Registration date
  - Last login timestamp
  - User role (with special badge for admin)
  - Activity stats (quizzes taken, questions answered)

### 3. **API Integration**
- Fetches user data from server using `UserService`
- Endpoint: `GET /users`
- Loading indicator while fetching data
- Error handling with modal messages

## File Structure

```
src/app/
├── component/
│   └── user-list/
│       ├── user-list.component.ts        # Component logic
│       ├── user-list.component.html      # Template
│       └── user-list.component.scss      # Styles
├── service/
│   └── user.service.ts                   # API service for users
└── app.routes.ts                         # Updated with new route
```

## Component Details

### UserListComponent (`user-list.component.ts`)

**Key Properties:**
- `users: UserDetail[]` - Array of user details
- `isLoading: boolean` - Loading state
- `adminMobile: string` - Admin mobile number for verification

**Key Methods:**
- `ngOnInit()` - Checks admin status and loads users
- `isAdmin` - Getter that verifies if current user is admin
- `loadUsers()` - Fetches users from API
- `showModal()` - Displays modal messages

### UserService (`user.service.ts`)

**Interface:**
```typescript
export interface UserDetail {
  id?: number | string;
  name?: string;
  email?: string;
  mobile: string;
  role?: string;
  registeredDate?: Date | string;
  lastLogin?: Date | string;
  quizzesTaken?: number;
  questionsAnswered?: number;
  isActive?: boolean;
}
```

**Methods:**
- `getAllUsers()` - Get all users from server
- `getUserById(id)` - Get specific user by ID
- `getUserByMobile(mobile)` - Get specific user by mobile

## API Integration

### Request
```http
GET /users
Authorization: Bearer <token>
```

### Expected Response
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "role": "user",
    "registeredDate": "2026-01-01T00:00:00Z",
    "lastLogin": "2026-01-11T10:30:00Z",
    "quizzesTaken": 15,
    "questionsAnswered": 45,
    "isActive": true
  },
  {
    "id": 2,
    "name": "Admin User",
    "email": "admin@example.com",
    "mobile": "9611675325",
    "role": "admin",
    "registeredDate": "2025-12-01T00:00:00Z",
    "lastLogin": "2026-01-11T12:00:00Z",
    "quizzesTaken": 5,
    "questionsAnswered": 20,
    "isActive": true
  }
]
```

## Routing

**Route:** `/admin/users`
- Protected by `AdminGuard`
- Lazy loaded component
- Title: "CareerPrepBook | User Management"
- Meta: `robots: noindex, nofollow`

## Access Control

### Double Layer Security:
1. **Route Guard** (`AdminGuard`) - Prevents non-admin navigation
2. **Component Check** - Additional verification in `ngOnInit()`

**Admin Verification:**
```typescript
get isAdmin(): boolean {
  const currentMobile = readLoginMobile();
  return currentMobile === '9611675325';
}
```

## Usage

### As Admin:
1. Log in with admin account (mobile: 9611675325)
2. Navigate to `/admin/users`
3. View list of all registered users
4. See user details, stats, and activity

### As Regular User:
- Route is protected by `AdminGuard`
- If somehow accessed, component will show error and redirect

## Styling

### Gradient Background
- Animated gradient background matching app theme
- Glassmorphism effect for modern UI

### User Cards
- Responsive grid layout (auto-fill, min 350px)
- Hover effects with elevation
- Color-coded role badges
- Activity stats with icons

### Mobile Responsive
- Single column on mobile
- Adjusted font sizes
- Touch-friendly elements

## Error Handling

### API Errors:
- Shows modal with error message
- Logs error to console
- Maintains loading state properly

### Access Denied:
- Shows error modal
- Redirects to home after 2 seconds
- Clear messaging about admin-only access

## Example Server Implementation

### Node.js/Express:
```javascript
// GET /users
app.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Verify requester is admin
    if (req.user.mobile !== '9611675325') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'mobile', 'role', 
                   'registeredDate', 'lastLogin', 'isActive'],
      order: [['registeredDate', 'DESC']]
    });

    // Add user stats
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const quizzesTaken = await QuizAttempt.count({ where: { userId: user.id } });
      const questionsAnswered = await Answer.count({ where: { userId: user.id } });
      
      return {
        ...user.toJSON(),
        quizzesTaken,
        questionsAnswered
      };
    }));

    res.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
```

## Security Considerations

1. **Always verify admin status on server-side** - Never trust client-side checks alone
2. **Filter sensitive data** - Don't return passwords or tokens
3. **Log access** - Track who accesses user data
4. **Rate limiting** - Prevent abuse of user listing endpoint
5. **Pagination** - For large user bases, implement pagination

## Future Enhancements

- Search/filter users by name, email, mobile
- Sort by different fields (name, registration date, activity)
- Pagination for large user lists
- Export users to CSV/Excel
- User activity timeline
- User management actions (activate/deactivate, reset password)
- Advanced filters (by role, active status, registration date range)
- User statistics dashboard

## Navigation

Add link in admin menu or header:
```html
<a routerLink="/admin/users" *ngIf="isAdmin">
  <i class="bi bi-people"></i>
  User Management
</a>
```

## Testing

### Manual Testing:
1. Log in as admin (9611675325)
2. Navigate to `/admin/users`
3. Verify users are loaded and displayed
4. Log out and log in as regular user
5. Try accessing `/admin/users` - should be blocked
6. Test responsive design on mobile

### Unit Testing:
```typescript
describe('UserListComponent', () => {
  it('should allow admin access', () => {
    spyOn(loginStorage, 'readLoginMobile').and.returnValue('9611675325');
    component.ngOnInit();
    expect(component.isAdmin).toBe(true);
  });

  it('should deny non-admin access', () => {
    spyOn(loginStorage, 'readLoginMobile').and.returnValue('1234567890');
    component.ngOnInit();
    expect(component.isAdmin).toBe(false);
  });
});
```

## Troubleshooting

**Users not loading:**
- Check API endpoint is correct
- Verify network request in browser DevTools
- Check server logs for errors
- Ensure admin authentication is working

**Access denied for admin:**
- Verify `readLoginMobile()` returns correct value
- Check if mobile is stored correctly in localStorage
- Clear browser cache and re-login

**Styling issues:**
- Check SCSS compilation
- Verify Bootstrap Icons are loaded
- Check for CSS conflicts
