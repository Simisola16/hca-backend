# HCA Admin Dashboard - Backend

Node.js backend API for Halal Certification Authority Nigeria Admin Dashboard.

## Features

- **Authentication**: JWT-based login system
- **News Management**: Full CRUD operations for news articles
- **Statistics**: Dashboard statistics (total articles, published, drafts, views)
- **MongoDB**: Data stored in MongoDB Atlas

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcryptjs

## Prerequisites

- Node.js installed
- MongoDB Atlas account (already configured)

## Installation

```bash
npm install
```

## Running the Server

```
bash
npm start
```

The server will start on port 3000 and connect to MongoDB.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/seed` - Create default admin

### News
- `GET /api/news` - Get all news (paginated)
- `GET /api/news/stats` - Get statistics
- `GET /api/news/:id` - Get single news
- `POST /api/news` - Create news
- `PUT /api/news/:id` - Update news
- `DELETE /api/news/:id` - Delete news
- `POST /api/news/seed` - Seed default news data

## Default Credentials

- **Username**: admin
- **Password**: admin123

## Frontend

The `admin-dashboard.html` file is the updated frontend that connects to this backend API. Open it in a browser to use the admin dashboard.

## Project Structure

```
backend-hca/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # JWT authentication
├── models/
│   ├── Admin.js           # Admin user model
│   └── News.js            # News article model
├── routes/
│   ├── auth.js            # Auth routes
│   └── news.js            # News routes
├── .env                   # Environment variables
├── package.json
├── server.js              # Main server file
├── admin-dashboard.html   # Frontend (connects to API)
└── README.md
