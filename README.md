🧠 Cybernauts Development Assignment
Project: Interactive User Relationship & Hobby Network
A full-stack web app that manages users, their hobbies, and friendships — visualized as an interactive React Flow graph.

🚀 Tech Stack
Backend: Node.js (Express + TypeScript) • PostgreSQL • Swagger
Frontend: React + TypeScript • React Flow • TailwindCSS
Extras: Toast notifications (Sonner) • Validation (Zod) • Forms (React Hook Form)

🧩 Features
🔹 Backend
• CRUD operations for Users
• Create/Remove friendships
• Auto-calculated popularity score
• Prevent circular friendships
• Prevent deletion if user is still linked
• Swagger documentation at /api-docs
• Proper error codes: 400, 404, 409, 500
🔹 Frontend
• Interactive user graph using React Flow
• Custom Node Types:
o 🟦 HighScoreNode: popularityScore > 5
o 🟨 LowScoreNode: popularityScore ≤ 5
• User Management Panel: Create, Edit, Delete with validation
• Sidebar: Draggable hobbies with live search
• Dynamic Updates: Graph refreshes after changes
• Undo/Redo Node Position (Bonus)
• Toast notifications for success/errors
• Error Boundary & Loading states

⚙️ Setup Instructions
1️⃣ Backend
cd backend
cp .env.example .env   # Edit DATABASE_URL if needed
pnpm install
pnpm dev
• Server: http://localhost:3001
• Swagger Docs: http://localhost:3001/api-docs

2️⃣ Frontend
cd frontend
cp .env.example .env
pnpm install
pnpm dev
• App: http://localhost:5173

🧪 Tests
cd backend
pnpm test
Includes:
• Validation logic tests
• Friendship creation/deletion tests
• Popularity score logic tests

🌍 Deployment
Backend (Render/Railway)
Set the following environment variables:
DATABASE_URL=your_production_db_url
PORT=3001
FRONTEND_ORIGIN=https://your-frontend.vercel.app
BACKEND_PUBLIC_URL=https://your-backend.onrender.com
Frontend (Vercel/Netlify)
Set this environment variable:
VITE_API_URL=https://your-backend.onrender.com

📸 Submission Requirements
✅ Complete source code (frontend + backend)
✅ .env.example files (done)
✅ API documentation (Swagger/Postman)
✅ Screen recording of app functionality
✅ Deployed demo on Render / Vercel

🧠 Author
Raghav
B.Tech CSE (IoT) | React.js Developer Intern @ Acetechnoid LLP
“Turning ideas into interactive experiences.”

