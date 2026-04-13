Sample Credentials:

Admin:
admin@gmail.com
admin123

Teacher:
teacher1@gmail.com
teacher123

Student:
rayudu@gmail.com
rayudu










git commit -m "first commit"
# College Student Portal (MERN Stack)

A beginner-friendly College Student Portal built using the MERN stack (MongoDB, Express.js, React, Node.js). This project implements simple, readable, and easy-to-understand patterns without using advanced abstract concepts.

## Tech Stack
- **Frontend**: React (Vite), Plain CSS (No Tailwind, No Bootstrap)
- **Backend**: Node.js, Express.js
- **Database**: Local MongoDB (Mongoose)
- **Auth**: JWT stored in localStorage

## Three Distinct Roles

### 1. Admin
- Route: `/admin-login`
- Responsibilities: Manage Students, Manage Teachers, View Student Attendance, View Student Marks. Data overview via stats cards.
- Color Scheme: Deep Blue (`#1a237e`)

### 2. Teacher
- Route: `/teacher-login`
- Responsibilities: Mark student attendance, add student marks, view their own authored records and profile.
- Color Scheme: Teal (`#00695c`)

### 3. Student
- Route: `/student-login`
- Responsibilities: View own profile, track attendance percentage, view attendance and marks history.
- Color Scheme: Purple (`#4a148c`)

## Setup Instructions

This project requires Node.js and a local running instance of MongoDB. 

1. **Install Dependencies**
   Navigate to both the `backend` and `frontend` folders and run `npm install`:
   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```

2. **Start MongoDB**
   Start your local MongoDB server (typically on `mongodb://localhost:27017`). Ensure it's running before proceeding.

3. **Seed Database**
   Since roles are predefined in the system, you need an initial set of users. A seed script is included.
   ```bash
   cd backend
   node seed.js
   ```
   *This script generates `Super Admin` (admin123), 2 Teachers (teacher123), and 3 Students (student123).*

4. **Start Backend Server**
   ```bash
   cd backend
   node server.js
   ```
   *The server runs on http://localhost:5000*

5. **Start Frontend App**
   Open a new terminal session.
   ```bash
   cd frontend
   npm run dev
   ```
   *Vite will provide a localhost URL to view the React app.*

## Project Structure Notes

- **Basic API Calls**: All API calls utilize native `fetch()`, keeping dependencies minimal and learning scope focused on core web technologies.
- **State Management**: Only generic `useState` and `useEffect` react hooks are utilized.
- **Routing**: Setup via `react-router-dom` with simple rendering constraints within `<ProtectedRoute>`.
