# AI Translation App

A modern web application that leverages AI to provide powerful text translation capabilities with customization options, user authentication, and translation history tracking with pagination.

## Features

### User Authentication
- Secure signup and login functionality
- JWT-based authentication
- Token refresh mechanism
- Persistent sessions

### AI-Powered Translation
- Translate text between multiple languages
- Support for languages including English, Spanish, French, German, Chinese, and more
- Integration with OpenAI's GPT models

### Translation Customization
- Adjustable tone (formal, informal, casual, professional)
- Style options (standard, simplified, detailed)
- Format preservation toggle

### History and Favorites
- Save translation history automatically
- Browse and reuse previous translations

### Modern UI/UX
- Clean, responsive interface
- Light/dark mode toggle
- Real-time translation feedback
- Copy to clipboard functionality
- Text-to-speech capability

## Tech Stack

### Backend
- **Node.js/Express**: RESTful API structure
- **Prisma ORM**: Database operations and schema management
- **JWT Authentication**: Secure user sessions
- **OpenAI Integration**: AI translation capabilities
- **Winston**: Logging middleware

### Frontend
- **React**: Component-based UI
- **TypeScript**: Type-safe code
- **TanStack Query**: Data fetching and caching
- **Shadcn/UI**: Component library
- **Context API**: State management
- **React Router**: Navigation

## Project Structure

### Backend
```
server/
├── src/
│   ├── controllers/     # Request handling logic
│   ├── middlewares/     # Authentication and error handling
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
```

### Frontend
```
client/
├── src/
│   ├── components/      # UI components
│   ├── context/         # React contexts for state
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client functions
│   ├── utils/           # Helper utilities
│   └── pages/           # Page components
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- PostgreSQL database
- OpenAI API key

### Environment Setup
1. Clone the repository
2. Create `.env` file in server directory with the following variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/ai_translation
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   PORT=5000
   ```
3. Create `.env` file in client directory:
   ```
   VITE_API_URL=http://localhost:5000/api/v1
   ```

### Installation

#### Backend
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup`: Create new user account
- `POST /api/v1/auth/login`: Log in existing user
- `GET /api/v1/auth/me`: Get current user
- `POST /api/v1/auth/refresh-token`: Refresh authentication token

### Translations
- `POST /api/v1/translations`: Create new translation
- `GET /api/v1/translations`: Get all translations for user
- `GET /api/v1/translations/favorites`: Get favorite translations
- `PATCH /api/v1/translations/:id/favorite`: Toggle favorite status
- `DELETE /api/v1/translations/:id`: Delete translation

