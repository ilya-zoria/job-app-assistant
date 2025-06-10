# Job Application Assistant

A waitlist system for collecting early user emails and sending welcome notifications.

## Features

- Email collection form with validation
- Rate limiting to prevent spam
- Supabase database integration
- SendGrid email notifications
- Success page after signup
- Responsive design with Tailwind CSS

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   VITE_SENDGRID_API_KEY=your_sendgrid_api_key
   VITE_SENDGRID_FROM_EMAIL=your_verified_sender_email
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. In a separate terminal, start the backend server:
   ```bash
   NODE_ENV=development node server.js
   ```

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Create a new project and import your repository
4. Add the following environment variables in Vercel:
   - `VITE_SENDGRID_API_KEY`
   - `VITE_SENDGRID_FROM_EMAIL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY`
5. Deploy!

## Project Structure

```
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/        # Page components
│   ├── lib/          # Utility functions and clients
│   └── App.tsx       # Main application component
├── server.js         # Backend server
├── vercel.json       # Vercel configuration
└── package.json      # Project dependencies
```

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
- Backend:
  - Node.js
  - Express
  - SendGrid
  - Supabase
- Deployment:
  - Vercel
