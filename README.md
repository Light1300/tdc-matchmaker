Overview

The Matchmaker Portal enables matchmakers to:

View and manage customer profiles
Evaluate compatibility between two members
Generate AI-powered match explanations
Generate personalized introduction emails
Send curated match recommendations
Track compatibility scores with detailed breakdowns
Manage member data through a centralized dashboard

The system combines rule-based compatibility scoring with LLM-powered reasoning to assist human matchmakers in making better recommendations.

Features
Authentication
Secure login system
User management through MongoDB
Session persistence using local storage
Role-based matchmaker accounts
Profile Management
Browse all customer profiles
View detailed profile information
Update profile attributes
Manage relationship preferences
Compatibility Engine

Multi-factor scoring system evaluating:

Relationship intent
Desire for children
Family values
Religion compatibility
Age compatibility
Location compatibility
Relocation willingness
Lifestyle compatibility
Shared interests

Produces:

Numerical compatibility score
Compatibility label
Detailed score breakdown
AI Match Reasoning

Using Groq LLM:

Generates human-readable explanations
Explains strongest compatibility factors
Assists matchmakers in understanding recommendations
AI Introduction Generation

Automatically creates:

Personalized introductions
Context-aware matchmaking messages
Relationship-focused communication
Email Delivery

Using Resend:

Sends curated introductions
Professional HTML email templates
Compatibility score summaries
Match profile previews
Dashboard
Matchmaker-friendly UI
Match evaluation workflow
Compatibility visualization
Match recommendation process
Architecture
Frontend
React
Vite
React Router
Axios
Backend
Node.js
Express
Database
MongoDB
Mongoose
AI
Groq API
Llama 3.3 70B Versatile
Email
Resend
Matchmaking Flow
Matchmaker logs in
Customer profiles are loaded
Matchmaker selects potential match
Compatibility engine calculates score
AI generates reasoning
AI drafts personalized introductions
Email is sent through Resend
Match recommendation is delivered
Compatibility Factors
Factor	Weight
Wants Kids	20%
Relationship Intent	15%
Family Values	15%
Religion	15%
Age	10%
Location	10%
Lifestyle	10%
Interests	5%
Example Output
Compatibility Score
84/100 — High Potential
AI Reason
Both individuals share strong family values, similar relationship goals,
and complementary lifestyle preferences.
API Endpoints
Authentication
POST /api/auth/login
Profiles
GET /api/profiles
GET /api/profiles/:id
PATCH /api/profiles/:id
AI Matching
POST /api/score-match
POST /api/generate-intro
POST /api/send-match
Environment Variables
PORT=3001

MONGO_URI=

GROQ_API_KEY=

RESEND_API_KEY=

DEMO_EMAIL=
