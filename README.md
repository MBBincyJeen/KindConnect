# KindConnect
KindConnect is a full-stack AI-powered tutoring platform that connects students with qualified teachers through intelligent recommendations, real-time communication, AI-assisted document learning, and live tutoring sessions. The platform streamlines the complete tutoring workflow—from creating learning requests and matching tutors to conducting live sessions, evaluating tutors, and answering questions from uploaded PDF study materials using Retrieval-Augmented Generation (RAG).

---

# Features

## Authentication & User Management

* Secure User Registration and Login
* Session-Based Authentication
* Password Hashing using bcryptjs
* Student and Teacher Roles
* Personalized User Profiles
* Certificate Upload for Teachers
* Location Detection
* Education & Subject Preferences

---

## Tutoring Request Management

* Create Tutoring Requests
* Subject & Grade Selection
* Online or Offline Learning Mode
* Duration Selection
* Detailed Request Description
* File Attachments
* Request Status Tracking
* Mark Sessions as Completed

---

## Teacher Recommendation

* Intelligent Teacher Recommendation
* Matching Based on:

  * Subject Expertise
  * Education Level
  * Preferred Gender
* Personalized Recommendations

---

## Real-Time Communication

* Individual Chat for Every Tutoring Request
* File Sharing
* Message Search
* Sentiment Labels
* Live Message Synchronization

---

## Live Tutoring Sessions

* Browser-Based Video & Audio Calls
* WebRTC Peer-to-Peer Communication
* Socket.IO Signaling
* Live Session Management

---

## AI-Powered PDF Learning

* Upload Study Material PDFs
* Automatic Text Extraction
* Intelligent Text Chunking
* Embedding Generation
* Semantic Search
* Retrieval-Augmented Generation (RAG)
* Context-Aware Question Answering
* Previous Question History

---

## Notifications

* New Teacher Offers
* Request Acceptance Notifications
* Request Rejection Notifications
* Live Session Notifications
* Recommendation Alerts

---

## Tutor Evaluation

* Anonymous Teacher Ratings
* Average Tutor Rating
* Teacher Performance Tracking

---

## Content Safety

* AI-Based Safety Check for Tutoring Requests
* Inappropriate Content Detection
* Safer Learning Environment

---

# Workflow

### Step 1 – User Registration

Students and teachers create accounts and securely log in.

↓

### Step 2 – Profile Completion

Users complete their profile by providing:

* Personal Details
* Education Level
* Subjects
* Location
* Teacher Certificates (Optional)

↓

### Step 3 – Create Tutoring Request

Students create tutoring requests containing:

* Subject
* Grade
* Description
* Session Mode
* Duration
* Study Material Attachments

↓

### Step 4 – Recommendation

The system recommends the most suitable teachers based on profile information and tutoring requirements.

↓

### Step 5 – Teacher Acceptance

Teachers browse requests and offer assistance.

Students can:

* Accept Teacher
* Reject Teacher

↓

### Step 6 – Communication

Students and teachers communicate through:

* Chat
* File Sharing
* Notifications

↓

### Step 7 – Live Tutoring Session

Participants join a live online tutoring session using WebRTC.

↓

### Step 8 – AI Learning Support

Students upload PDF documents and ask questions.

The platform uses Retrieval-Augmented Generation (RAG) to retrieve relevant document sections and generate context-aware answers.

↓

### Step 9 – Session Completion

Students mark the tutoring request as completed and submit tutor ratings.

---

# Complete Tech Stack

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose ODM

## Frontend

* EJS
* HTML
* CSS
* JavaScript

## Real-Time Communication

* Socket.IO
* WebRTC

## Authentication

* Express Session
* bcryptjs

## AI Technologies

* OpenAI API
* OpenAI Embeddings
* Retrieval-Augmented Generation (RAG)
* Semantic Search

## File Processing

* Multer
* pdf-parse

## Utilities

* dotenv
* CORS

---

# Main Project Components

## Authentication Component

* User Registration
* Login
* Logout
* Password Hashing
* Session Management

## User Profile Component

* Profile Management
* Certificate Upload
* Education Information
* Subject Preferences
* Location

## Task Management Component

* Tutoring Request Creation
* Status Management
* File Upload

## Teacher Recommendation Component

* Intelligent Teacher Matching
* Personalized Recommendations

## Dashboard Component

* Active Requests
* Teacher Recommendations
* Task Status
* Average Teacher Rating

## Chat Component

* Messaging
* Attachments
* Message Search
* Sentiment Labels

## Notification Component

* Live Notifications
* Request Updates
* Session Alerts

## Live Session Component

* Video Calling
* Audio Calling
* WebRTC Signaling

## PDF Upload Component

* PDF Upload
* Text Extraction
* Embedding Generation
* Document Indexing

## PDF Question Answering Component

* Semantic Search
* Retrieval-Augmented Generation
* Context-Aware AI Responses

## Document Chunk Component

* Text Chunk Storage
* Vector Embeddings
* Semantic Retrieval

## Question History Component

* Previous Questions
* Generated Answers
* Confidence Scores

## Tutor Evaluation Component

* Anonymous Ratings
* Teacher Performance Tracking

## Content Safety Component

* AI Safety Checking
* Harmful Content Detection

## Location Component

* User Location Storage
* Nearby Tutoring Discovery

## Certificate Upload Component

* Teacher Certificate Management
* Profile Verification Support

---

# Future Enhancements

* AI-Based Learning Progress Tracking
* Automatic Session Summaries
* Calendar Integration
* Email Notifications

---

# Conclusion

KindConnect combines intelligent teacher recommendation, AI-powered document understanding, real-time communication, live tutoring, and secure collaboration into a single learning platform. By integrating Retrieval-Augmented Generation (RAG), semantic search, and modern web technologies, it delivers a personalized, interactive, and scalable learning experience for both students and teachers.
