# Environment Configuration Setup

This document describes the environment-based API URL configuration for the Dictionary Application.

## Files Created

### 1. `src/environments/environment.ts` (Development)
- **API URL**: `http://localhost:8080/api`
- Used when running `ng serve` (local development)

### 2. `src/environments/environment.prod.ts` (Production)
- **API URL**: `https://dictionaryappbackend-production.up.railway.app/api`
- Used when building with `ng build --configuration production`

## Build Configuration (angular.json)
Added `fileReplacements` to the production configuration:
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

## Updated Services

All services now import and use the `environment` configuration:

### 1. **WordListService** (src/app/service/word-list.service.ts)
- Uses base URL: `${environment.apiUrl}/words`
- Supports all word-related API endpoints

### 2. **UserSignUpService** (src/app/service/user-signup.service.ts)
- Uses base URL: `${environment.apiUrl}/user`
- Supports user registration, login, and profile management

### 3. **QuestionAnswerService** (src/app/service/questionAnswer.Service.ts)
- Uses base URL: `${environment.apiUrl}/qa`
- Supports Q&A related endpoints

### 4. **ContactService** (src/app/service/contact.service.ts)
- Uses base URL: `${environment.apiUrl}/contact`
- Supports contact form submissions

## Running the Application

### Local Development (uses localhost API)
```bash
npm start
# or
ng serve
```
- Runs on `http://localhost:4200`
- Uses API at `http://localhost:8080/api`

### Production Build (uses production API)
```bash
ng build --configuration production
# or
npm run build
```
- Optimized build
- Uses API at `https://dictionaryappbackend-production.up.railway.app/api`

## Key Benefits

✅ **Automatic URL Switching**: No manual URL changes needed for different environments
✅ **Cleaner Code**: Removed all commented-out URL alternatives
✅ **Maintainability**: Single source of truth for API URLs
✅ **Flexibility**: Easy to add more environments (staging, testing, etc.)
✅ **Type-Safe**: Environment configuration is typed in TypeScript

## How to Customize

To add a new environment (e.g., staging):

1. Create `src/environments/environment.staging.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://staging-api.example.com/api'
};
```

2. Add configuration to `angular.json` in the `configurations` section:
```json
"staging": {
  "buildTarget": "dictionary_application:build:staging"
}
```

3. Add fileReplacements to the build configuration:
```json
"staging": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.staging.ts"
    }
  ]
}
```
