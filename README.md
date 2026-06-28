# KindConnect

## Overview

KindConnect is a community-driven platform that connects people who need assistance with volunteers or helpers willing to offer support. Users can post tasks, browse available requests, communicate through an integrated chat system, and track task progress until completion.

The platform aims to encourage collaboration, social responsibility, and community engagement by making it easier for individuals to seek and provide help.

---

## Features

### User Authentication

* User Registration
* Secure Login System
* Session-Based Authentication
* Personalized User Dashboard

### Task Management

* Create and Post Tasks
* Categorize Tasks
* Specify Task Type

  * In-Person
  * Online
  * Education
* Optional Reward System
* Upload Multiple Attachments
* Delete Tasks
* Mark Tasks as Completed

### Community Interaction

* Browse Community Tasks
* Offer Help for Available Tasks
* View Task Status
* Track Assigned Helpers

### Real-Time Communication

* Dedicated Task-Based Chat Rooms
* Send Text Messages
* Share File Attachments
* Automatic Message Synchronization
* Live Chat Updates

### Dashboard Management

* View Personal Tasks
* Monitor Task Status
* Track Ongoing Tasks
* View Community Activity
* Manage Posted Requests

---

## Workflow

### 1. User Registration

Users create an account and log in to the platform.

### 2. Task Creation

A user posts a task by providing:

* Title
* Description
* Category
* Task Type
* Reward (Optional)
* Attachments (Optional)

### 3. Task Discovery

Community members browse available tasks and choose to help.

### 4. Task Acceptance

A helper accepts a task, changing its status from:

```
Not Taken → In Progress
```

### 5. Communication

The task creator and helper communicate through the integrated chat system to coordinate task completion.

### 6. Task Completion

Once the work is finished, the task is marked as:

```
Completed
```

---

## System Architecture

### Frontend

* HTML5
* CSS3
* EJS Templates
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose ODM

### File Handling

* Multer

### Authentication

* Express Sessions
* Password-Based Authentication

---

## Task Status Flow

```text
Not Taken
    │
    ▼
In Progress
    │
    ▼
Completed
```

---

## Key Functionalities

### Task Posting

Users can create requests for assistance and provide all relevant information.

### Task Tracking

Each task maintains a status that allows users to monitor progress.

### Chat System

Dedicated conversations are created for each accepted task, allowing both parties to communicate and exchange files.

### Attachment Support

Users can upload documents, images, or other supporting files during task creation and communication.

### Community Engagement

The platform promotes collaboration by enabling users to help others within their community.

---

## Future Enhancements

* Real-Time Communication using Socket.IO
* Push Notifications
* Task Recommendation System
* Volunteer Reputation Scores
* Ratings and Reviews
* Location-Based Task Discovery
* AI-Powered Task Matching
* Mobile Application Support
* Admin Dashboard and Analytics

---

## Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* EJS

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Middleware & Libraries

* Multer
* Express Session
* Body Parser
* Method Override

### Development Tools

* Git
* GitHub
* VS Code

---


## Conclusion

KindConnect provides a simple yet effective solution for connecting people who need assistance with individuals willing to help. By combining task management, communication, and community participation, the platform fosters collaboration and strengthens local support networks.

