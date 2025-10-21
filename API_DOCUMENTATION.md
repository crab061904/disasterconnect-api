# DisasterConnect API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Authentication Routes](#authentication-routes)
  - [Disaster Routes](#disaster-routes)
  - [Help Request Routes](#help-request-routes)
- [Response Format](#response-format)
- [Error Codes](#error-codes)

---

## Overview

DisasterConnect API is a RESTful API for managing disaster reports, help requests, and user authentication during emergency situations.

## Base URL

**Local Development:**
```
http://localhost:5000
```

**Production:**
```
https://your-api-name.vercel.app
```

## Authentication

Most endpoints require authentication using JWT (JSON Web Token). Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### Authentication Routes

Base path: `/api/auth`

#### 1. Register User
Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "citizen"
}
```

**Required Fields:**
- `email` (string) - Valid email address
- `password` (string) - User password

**Optional Fields:**
- `name` (string) - User's full name
- `role` (string) - User role: `"citizen"`, `"volunteer"`, `"organization"`, `"admin"` (default: `"citizen"`)

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "citizen"
    }
  }
}
```

---

#### 2. Login
Authenticate a user and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Required Fields:**
- `email` (string) - User's email
- `password` (string) - User's password

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "citizen"
    }
  }
}
```

---

#### 3. Get Profile
Retrieve the authenticated user's profile.

**Endpoint:** `GET /api/auth/profile`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "role": "citizen"
    }
  }
}
```

---

### Disaster Routes

Base path: `/api/disasters`

#### 1. Create Disaster Report
Report a new disaster.

**Endpoint:** `POST /api/disasters`

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Earthquake in Metro Manila",
  "description": "Magnitude 6.5 earthquake struck at 3:00 PM",
  "type": "earthquake",
  "severity": "high",
  "location": {
    "lat": 14.5995,
    "lng": 120.9842,
    "address": "Quezon City, Metro Manila"
  },
  "images": ["https://example.com/image1.jpg"],
  "casualties": {
    "injured": 50,
    "deceased": 5,
    "missing": 10
  },
  "needsHelp": ["medical", "rescue", "shelter"]
}
```

**Required Fields:**
- `title` (string) - Disaster title
- `description` (string) - Detailed description
- `type` (string) - Disaster type: `"earthquake"`, `"flood"`, `"typhoon"`, `"fire"`, `"landslide"`, etc.
- `severity` (string) - Severity level: `"low"`, `"medium"`, `"high"`, `"critical"`
- `location` (object) - Location details
  - `lat` (number) - Latitude
  - `lng` (number) - Longitude
  - `address` (string) - Human-readable address

**Optional Fields:**
- `images` (array) - Array of image URLs
- `casualties` (object) - Casualty information
  - `injured` (number)
  - `deceased` (number)
  - `missing` (number)
- `needsHelp` (array) - Types of help needed

**Success Response (201):**
```json
{
  "success": true,
  "message": "Disaster reported successfully",
  "data": {
    "id": "disaster123",
    "title": "Earthquake in Metro Manila",
    "status": "active",
    "reportedBy": "user123",
    "createdAt": "2025-10-21T09:43:00.000Z",
    ...
  }
}
```

---

#### 2. Get Active Disasters
Retrieve all active disasters.

**Endpoint:** `GET /api/disasters/active`

**Authentication:** Not required

**Query Parameters:**
- `limit` (number, optional) - Maximum number of results (default: 50)

**Example:**
```
GET /api/disasters/active?limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": "disaster123",
      "title": "Earthquake in Metro Manila",
      "type": "earthquake",
      "severity": "high",
      "status": "active",
      ...
    }
  ]
}
```

---

#### 3. Get Disaster by ID
Retrieve a specific disaster by its ID.

**Endpoint:** `GET /api/disasters/:id`

**Authentication:** Not required

**Example:**
```
GET /api/disasters/disaster123
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "disaster123",
    "title": "Earthquake in Metro Manila",
    "description": "Magnitude 6.5 earthquake struck at 3:00 PM",
    "type": "earthquake",
    "severity": "high",
    "status": "active",
    ...
  }
}
```

---

#### 4. Get Disasters by Type
Retrieve disasters filtered by type.

**Endpoint:** `GET /api/disasters/type/:type`

**Authentication:** Not required

**Query Parameters:**
- `limit` (number, optional) - Maximum number of results (default: 20)

**Example:**
```
GET /api/disasters/type/earthquake?limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

---

#### 5. Get Nearby Disasters
Retrieve disasters near a specific location.

**Endpoint:** `GET /api/disasters/nearby`

**Authentication:** Not required

**Query Parameters:**
- `lat` (number, required) - Latitude
- `lng` (number, required) - Longitude
- `radius` (number, optional) - Search radius in kilometers (default: 50)

**Example:**
```
GET /api/disasters/nearby?lat=14.5995&lng=120.9842&radius=25
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 8,
  "data": [...]
}
```

---

#### 6. Update Disaster
Update an existing disaster report.

**Endpoint:** `PUT /api/disasters/:id`

**Authentication:** Required (Owner or Admin only)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "severity": "critical"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Disaster updated successfully",
  "data": {...}
}
```

---

#### 7. Update Disaster Status
Update the status of a disaster.

**Endpoint:** `PATCH /api/disasters/:id/status`

**Authentication:** Required

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Required Fields:**
- `status` (string) - Status: `"active"`, `"resolved"`, `"monitoring"`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Disaster status updated",
  "data": {...}
}
```

---

#### 8. Verify Disaster
Verify a disaster report (Admin only).

**Endpoint:** `PATCH /api/disasters/:id/verify`

**Authentication:** Required (Admin only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Disaster verified successfully",
  "data": {...}
}
```

---

#### 9. Delete Disaster
Delete a disaster report.

**Endpoint:** `DELETE /api/disasters/:id`

**Authentication:** Required (Owner or Admin only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Disaster deleted successfully"
}
```

---

### Help Request Routes

Base path: `/api/help-requests`

#### 1. Create Help Request
Submit a new help request.

**Endpoint:** `POST /api/help-requests`

**Authentication:** Required

**Request Body:**
```json
{
  "disasterId": "disaster123",
  "title": "Need medical supplies",
  "description": "Urgent need for first aid kits and medicines",
  "urgency": "high",
  "type": "medical",
  "location": {
    "lat": 14.5995,
    "lng": 120.9842,
    "address": "123 Main St, Quezon City"
  },
  "contactInfo": {
    "phone": "+639123456789",
    "alternateContact": "+639987654321"
  },
  "numberOfPeople": 15,
  "images": ["https://example.com/image1.jpg"]
}
```

**Required Fields:**
- `disasterId` (string) - ID of the related disaster
- `title` (string) - Brief title of the request
- `description` (string) - Detailed description
- `urgency` (string) - Urgency level: `"low"`, `"medium"`, `"high"`, `"critical"`
- `type` (string) - Type of help: `"rescue"`, `"medical"`, `"food"`, `"water"`, `"shelter"`, etc.
- `location` (object) - Location details
  - `lat` (number) - Latitude
  - `lng` (number) - Longitude
  - `address` (string) - Address

**Optional Fields:**
- `contactInfo` (object) - Contact information
  - `phone` (string)
  - `alternateContact` (string)
- `numberOfPeople` (number) - Number of people affected (default: 1)
- `images` (array) - Array of image URLs

**Success Response (201):**
```json
{
  "success": true,
  "message": "Help request created successfully",
  "data": {
    "id": "request123",
    "disasterId": "disaster123",
    "requestedBy": "user123",
    "status": "pending",
    "createdAt": "2025-10-21T09:43:00.000Z",
    ...
  }
}
```

---

#### 2. Get Help Request by ID
Retrieve a specific help request.

**Endpoint:** `GET /api/help-requests/:id`

**Authentication:** Not required

**Example:**
```
GET /api/help-requests/request123
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "request123",
    "title": "Need medical supplies",
    "status": "pending",
    "urgency": "high",
    ...
  }
}
```

---

#### 3. Get Help Requests by Disaster
Retrieve all help requests for a specific disaster.

**Endpoint:** `GET /api/help-requests/disaster/:disasterId`

**Authentication:** Not required

**Query Parameters:**
- `limit` (number, optional) - Maximum number of results (default: 50)

**Example:**
```
GET /api/help-requests/disaster/disaster123?limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 12,
  "data": [...]
}
```

---

#### 4. Get Pending Help Requests
Retrieve all pending help requests.

**Endpoint:** `GET /api/help-requests/pending`

**Authentication:** Not required

**Query Parameters:**
- `limit` (number, optional) - Maximum number of results (default: 50)

**Example:**
```
GET /api/help-requests/pending?limit=30
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 25,
  "data": [...]
}
```

---

#### 5. Update Help Request
Update an existing help request.

**Endpoint:** `PUT /api/help-requests/:id`

**Authentication:** Required (Owner or Admin only)

**Request Body:**
```json
{
  "title": "Updated title",
  "urgency": "critical",
  "numberOfPeople": 20
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Help request updated successfully",
  "data": {...}
}
```

---

#### 6. Assign Help Request
Assign a help request to a volunteer or organization.

**Endpoint:** `PATCH /api/help-requests/:id/assign`

**Authentication:** Required

**Request Body:**
```json
{
  "assigneeUid": "volunteer123"
}
```

**Required Fields:**
- `assigneeUid` (string) - User ID of the volunteer/organization

**Success Response (200):**
```json
{
  "success": true,
  "message": "Help request assigned successfully",
  "data": {
    "id": "request123",
    "assignedTo": "volunteer123",
    "status": "in_progress",
    ...
  }
}
```

---

#### 7. Mark Help Request as Fulfilled
Mark a help request as completed.

**Endpoint:** `PATCH /api/help-requests/:id/fulfill`

**Authentication:** Required (Assigned person, Owner, or Admin)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Help request marked as fulfilled",
  "data": {
    "id": "request123",
    "status": "fulfilled",
    "fulfilledAt": "2025-10-21T10:30:00.000Z",
    ...
  }
}
```

---

#### 8. Update Help Request Status
Update the status of a help request.

**Endpoint:** `PATCH /api/help-requests/:id/status`

**Authentication:** Required

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Required Fields:**
- `status` (string) - Status: `"pending"`, `"in_progress"`, `"fulfilled"`, `"cancelled"`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Help request status updated",
  "data": {...}
}
```

---

#### 9. Delete Help Request
Delete a help request.

**Endpoint:** `DELETE /api/help-requests/:id`

**Authentication:** Required (Owner or Admin only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Help request deleted successfully"
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...},
  "count": 10  // Only for list endpoints
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or missing required fields |
| 401 | Unauthorized - Authentication required or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists (e.g., email already registered) |
| 500 | Internal Server Error - Server-side error |

---

## Common Data Types

### Location Object
```json
{
  "lat": 14.5995,
  "lng": 120.9842,
  "address": "Quezon City, Metro Manila"
}
```

### Casualties Object
```json
{
  "injured": 50,
  "deceased": 5,
  "missing": 10
}
```

### Contact Info Object
```json
{
  "phone": "+639123456789",
  "alternateContact": "+639987654321"
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Coordinates use decimal degrees format
- File uploads should be handled separately and URLs provided in requests
- Rate limiting may apply to prevent abuse
- All endpoints support CORS for web applications

---

## Support

For issues or questions, please contact the development team or create an issue on GitHub.
