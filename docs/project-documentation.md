# Sahyog Project Documentation



\pagebreak

# API_DOCUMENTATION_v2.md

# Sahyog API Documentation v2.0
## Backend Changes - Business Logic Fixes

**Base URL:** `http://localhost:3000/api/v1` (development)  
**Authentication:** Bearer Token (Clerk JWT)  
**Last Updated:** February 26, 2026

---

## Table of Contents

1. [Breaking Changes Summary](#breaking-changes-summary)
2. [SOS Endpoints](#sos-endpoints)
3. [Task Endpoints](#task-endpoints)
4. [Need Endpoints](#need-endpoints)
5. [Disaster Endpoints](#disaster-endpoints)
6. [Shelter Endpoints](#shelter-endpoints)
7. [Zone Endpoints](#zone-endpoints)
8. [Error Handling](#error-handling)
9. [Socket Events](#socket-events)

---

## Breaking Changes Summary

### 🔴 CRITICAL - Will Break Existing Frontend

| Endpoint | Change | Impact |
|----------|--------|--------|
| `PATCH /sos/:id/status` | Requires `resolution_proof` for volunteers | Volunteers cannot resolve SOS without photos |
| `PATCH /needs/:id/resolve` | Requires `resolution_proof` for volunteers | Volunteers cannot resolve needs without photos |
| `PATCH /tasks/:id/status` | New validations (skills, distance, workload) | Task acceptance restricted |
| `POST /tasks/:id/vote-completion` | Cannot vote on own tasks | Self-voting blocked |
| `POST /disasters/:id/resolve` | Role restriction + active items check | Only coordinators/admins, no active tasks/SOS |
| `POST /shelters/:id/checkin` | Capacity validation | Cannot exceed shelter capacity |
| `DELETE /disasters/:id/relief-zones/:zoneId` | Active assignment check | Cannot delete zones with active items |

---

## SOS Endpoints

### 1. Update SOS Status

**Endpoint:** `PATCH /sos/:id/status`

**Authentication:** Required

**Request Body:**
```json
{
  "status": "resolved",
  "resolution_proof": ["https://storage.com/image1.jpg", "https://storage.com/image2.jpg"],
  "resolution_notes": "Provided first aid and transported to hospital"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | One of: `triggered`, `acknowledged`, `resolved`, `cancelled` |
| `resolution_proof` | array | Conditional | Required for volunteers resolving SOS. Optional for coordinators/admins. Array of image URLs. |
| `resolution_notes` | string | No | Text description of resolution |

**Authorization Rules:**

| Action | Who Can Perform | Requirements |
|--------|-----------------|--------------|
| `acknowledged` | Any authenticated user | Only if not already acknowledged by someone else |
| `resolved` | Coordinator/Admin | No proof required (can override) |
| `resolved` | Volunteer who acknowledged | **Must provide `resolution_proof`** |
| `cancelled` | Reporter or Admin | Only the person who created the SOS |

**Success Response (200):**
```json
{
  "id": "uuid",
  "status": "resolved",
  "resolution_proof": ["url1.jpg", "url2.jpg"],
  "resolution_notes": "Provided first aid...",
  "resolved_at": "2026-02-26T10:30:00Z",
  "acknowledged_by": "uuid",
  "acknowledged_at": "2026-02-26T10:00:00Z"
}
```

**Error Responses:**

```json
// 403 - Volunteer without proof
{
  "message": "Resolution requires photo/video proof. Upload proof and try again."
}

// 403 - Not authorized
{
  "message": "Only coordinators, admins, or the assigned responder can resolve an SOS"
}

// 403 - Already being handled
{
  "message": "SOS is already being handled by another responder"
}

// 403 - Reporter restrictions
{
  "message": "You can only cancel your own SOS reports"
}
```

**Frontend Implementation:**
```javascript
// React/Vue Example
async function resolveSOS(sosId, proofImages, notes) {
  const response = await fetch(`/api/v1/sos/${sosId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'resolved',
      resolution_proof: proofImages,  // REQUIRED for volunteers
      resolution_notes: notes
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 403 && error.message.includes('proof')) {
      // Show image upload requirement
      alert('Please upload at least one photo as proof of resolution');
    }
  }
}
```

---

## Task Endpoints

### 1. Create Task

**Endpoint:** `POST /tasks`

**Authentication:** Required (Volunteer, Coordinator, Admin)

**Request Body:**
```json
{
  "type": "medical",
  "title": "Provide first aid at evacuation center",
  "description": "Multiple people need basic medical attention",
  "need_id": "uuid",
  "disaster_id": "uuid",
  "zone_id": "uuid",
  "volunteer_id": "uuid",
  "sosId": "uuid",
  "meeting_point": {
    "lat": 19.0760,
    "lng": 72.8777
  }
}
```

**Validation:** All foreign keys (`need_id`, `disaster_id`, `zone_id`, `volunteer_id`, `sosId`) are validated to exist.

**Error Response:**
```json
{
  "message": "Referenced need not found"
}
```

---

### 2. Update Task Status

**Endpoint:** `PATCH /tasks/:id/status`

**Authentication:** Required

**Request Body:**
```json
{
  "status": "accepted",
  "persons_helped": 5,
  "proof_images": ["url1.jpg", "url2.jpg"]
}
```

**Status Values:**
- `pending` → `accepted` (volunteer accepts task)
- `accepted` → `in_progress` (volunteer starts work)
- `in_progress` → `completed` (volunteer finishes work)

**Volunteer Acceptance Validation:**

When a volunteer accepts a task (`status: "accepted"`), the backend validates:

1. **Skills Check:**
   - Critical task types: `medical`, `rescue`, `fire`, `evacuation`
   - Volunteer must have matching skill in their profile

2. **Proximity Check:**
   - Volunteer must be within 50km of task location
   - Calculated from volunteer's `current_location`

3. **Workload Check:**
   - Maximum 3 active tasks per volunteer
   - Active = `pending`, `accepted`, or `in_progress`

**Error Responses:**

```json
// 403 - Skills mismatch
{
  "message": "This medical task requires specific training. Please contact a coordinator.",
  "required_training": "medical",
  "your_skills": ["general", "transport"]
}

// 403 - Too far away
{
  "message": "You are too far from this task location (75km away). Maximum distance is 50km.",
  "distance_km": 75,
  "max_distance_km": 50
}

// 403 - Too many tasks
{
  "message": "You have reached the maximum of 3 active tasks. Complete existing tasks before accepting new ones.",
  "active_tasks": 3,
  "max_tasks": 3
}
```

**Frontend Implementation:**
```javascript
// Show validation warnings before accepting
async function acceptTask(taskId) {
  // Check if task requires special skills
  if (['medical', 'rescue', 'fire', 'evacuation'].includes(task.type)) {
    showWarning(`This task requires ${task.type} training`);
  }
  
  // Check distance
  const distance = calculateDistance(userLocation, task.location);
  if (distance > 50) {
    showError(`You are ${distance}km away. Maximum allowed: 50km`);
    return;
  }
  
  // Check active task count
  if (user.activeTasks >= 3) {
    showError(`You have ${user.activeTasks}/3 active tasks. Complete one first.`);
    return;
  }
  
  // Proceed with acceptance
  const response = await fetch(`/api/v1/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status: 'accepted' })
  });
}
```

---

### 3. Vote on Task Completion

**Endpoint:** `POST /tasks/:id/vote-completion`

**Authentication:** Required (Volunteer, Coordinator, Admin)

**Request Body:**
```json
{
  "vote": "completed",
  "note": "Verified the work was done properly"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vote` | string | Yes | `completed` or `rejected` |
| `note` | string | No | Optional explanation |

**Restrictions:**
- ❌ Cannot vote on your own task
- ✅ Can only vote `completed` on tasks already marked `completed` by the volunteer
- ✅ Can vote `rejected` on any task

**Error Responses:**

```json
// 403 - Self-voting
{
  "message": "You cannot vote on completion of your own task. Other volunteers or coordinators must verify your work."
}

// 400 - Wrong status
{
  "message": "Can only vote to confirm completion on tasks marked as completed by the volunteer",
  "current_status": "in_progress"
}
```

**Frontend Implementation:**
```javascript
// Hide vote buttons for own tasks
function TaskVoting({ task, currentUser }) {
  if (task.volunteer_id === currentUser.id) {
    return (
      <Alert>
        Other volunteers or coordinators must verify your work
      </Alert>
    );
  }
  
  if (task.status !== 'completed') {
    return (
      <Tooltip title="Task must be marked complete by volunteer first">
        <Button disabled>Vote Complete</Button>
      </Tooltip>
    );
  }
  
  return (
    <>
      <Button onClick={() => vote('completed')}>Confirm Complete</Button>
      <Button onClick={() => vote('rejected')}>Reject</Button>
    </>
  );
}
```

---

## Need Endpoints

### 1. Resolve Need

**Endpoint:** `PATCH /needs/:id/resolve`

**Authentication:** Required

**Request Body:**
```json
{
  "resolution_proof": ["https://storage.com/proof1.jpg"],
  "resolution_notes": "Delivered food and water supplies"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resolution_proof` | array | Conditional | Required for volunteers. Optional for coordinators/admins. |
| `resolution_notes` | string | No | Resolution description |

**Authorization:**
- Assigned volunteer can resolve (with proof)
- Coordinator/Admin can resolve (proof optional)
- Others cannot resolve

**Error Response:**
```json
// 403 - Not assigned
{
  "message": "Only the assigned volunteer, coordinator, or admin can resolve this need"
}

// 403 - Missing proof
{
  "message": "Resolution requires photo/video proof of fulfillment. Please upload proof and try again."
}
```

---

## Disaster Endpoints

### 1. Resolve Disaster

**Endpoint:** `POST /disasters/:id/resolve`

**Authentication:** Required (Coordinator, Admin only)

**Authorization:**
- Only users with `coordinator` or `admin` role
- Cannot resolve if active tasks or SOS alerts exist

**Error Responses:**

```json
// 403 - Not authorized
{
  "message": "Only administrators or coordinators can resolve disasters"
}

// 400 - Active items exist
{
  "message": "Cannot resolve disaster with active tasks or SOS alerts",
  "active_tasks": 5,
  "active_sos": 2
}
```

**Frontend Implementation:**
```javascript
function DisasterResolution({ disaster, userRole }) {
  const canResolve = ['coordinator', 'admin'].includes(userRole);
  const hasActiveItems = disaster.active_tasks > 0 || disaster.active_sos > 0;
  
  return (
    <>
      {canResolve && hasActiveItems && (
        <Alert severity="warning">
          Cannot resolve: {disaster.active_tasks} active tasks, {disaster.active_sos} active SOS
        </Alert>
      )}
      <Button disabled={!canResolve || hasActiveItems}>
        Resolve Disaster
      </Button>
    </>
  );
}
```

---

## Shelter Endpoints

### 1. Check In to Shelter

**Endpoint:** `POST /shelters/:id/checkin`

**Authentication:** Required

**Request Body:**
```json
{
  "count": 5
}
```

**Validation:**
- Cannot exceed shelter capacity
- Returns detailed capacity information on error

**Error Response:**
```json
// 400 - Over capacity
{
  "message": "Check-in would exceed shelter capacity",
  "shelter_name": "Relief Center A",
  "capacity": 100,
  "current_occupancy": 95,
  "available_space": 5,
  "requested_checkin": 10
}
```

**Frontend Implementation:**
```javascript
function ShelterCheckIn({ shelter }) {
  const percentage = (shelter.current_occupancy / shelter.capacity) * 100;
  
  return (
    <>
      <CapacityBar 
        current={shelter.current_occupancy} 
        capacity={shelter.capacity}
        percentage={percentage}
      />
      
      {percentage >= 90 && (
        <Alert severity="warning">
          Warning: Shelter at {percentage}% capacity
        </Alert>
      )}
      
      <CheckInForm 
        maxAllowed={shelter.capacity - shelter.current_occupancy}
      />
    </>
  );
}
```

---

## Zone Endpoints

### 1. Delete Zone

**Endpoint:** `DELETE /disasters/:id/relief-zones/:zoneId`

**Authentication:** Required (Admin)

**Validation:**
- Cannot delete zone with active tasks, volunteers, coordinators, or resources

**Error Response:**
```json
// 400 - Active assignments
{
  "message": "Cannot delete zone with active assignments. Reassign or complete all activities first.",
  "active_tasks": 5,
  "active_volunteers": 12,
  "active_coordinators": 2,
  "deployed_resources": 8
}
```

**Frontend Implementation:**
```javascript
function ZoneManagement({ zone }) {
  const totalActive = zone.active_tasks + zone.active_volunteers + 
                     zone.active_coordinators + zone.deployed_resources;
  
  return (
    <>
      <AssignmentStats zone={zone} />
      
      {totalActive > 0 && (
        <Alert severity="warning">
          Cannot delete: {totalActive} active assignments
        </Alert>
      )}
      
      <Button 
        onClick={deleteZone}
        disabled={totalActive > 0}
      >
        Delete Zone
      </Button>
    </>
  );
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "message": "Human-readable error message",
  "details": {} // Additional context (optional)
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Validation failed - check request body |
| 403 | Forbidden | Authorization failed - check permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Backend error - retry or contact support |

### Common Error Patterns

```javascript
// Frontend error handler
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 403:
          if (error.message.includes('proof')) {
            // Show image upload dialog
            showImageUploadRequired();
          } else if (error.message.includes('distance')) {
            // Show distance warning
            showDistanceWarning(error.distance_km, error.max_distance_km);
          } else if (error.message.includes('maximum')) {
            // Show workload warning
            showWorkloadWarning(error.active_tasks, error.max_tasks);
          }
          break;
          
        case 400:
          if (error.active_tasks !== undefined) {
            // Disaster has active items
            showActiveItemsWarning(error);
          } else if (error.available_space !== undefined) {
            // Shelter over capacity
            showCapacityWarning(error);
          }
          break;
      }
      
      throw new Error(error.message);
    }
    
    return response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}
```

---

## Socket Events

### New Events

#### `task_completed_sos_pending`
Emitted when a task is completed but linked SOS requires manual resolution.

```javascript
socket.on('task_completed_sos_pending', (data) => {
  console.log(data);
  // {
  //   task_id: "uuid",
  //   sos_id: "uuid",
  //   message: "Task completed. SOS requires coordinator review for resolution."
  // }
  
  showNotification(data.message);
  // Update UI to show SOS still needs resolution
});
```

### Existing Events (Unchanged)

- `new_sos_alert` - New SOS created
- `sos_resolved` - SOS resolved
- `volunteer_location_update` - Volunteer location changed

---

## Migration Checklist

### Volunteer App
- [ ] Add image upload for SOS resolution
- [ ] Add image upload for need resolution
- [ ] Add skill badges to task display
- [ ] Add distance calculator to task list
- [ ] Add active task counter
- [ ] Hide self-voting buttons
- [ ] Add shelter capacity indicators

### Coordinator Dashboard
- [ ] Add SOS proof viewer
- [ ] Add disaster resolution restrictions
- [ ] Add zone deletion protection
- [ ] Add task validation displays

### Admin Panel
- [ ] Add active items check for disaster resolution
- [ ] Add zone assignment breakdown

---

## Support

For questions or issues:
1. Check this documentation
2. Review the FRONTEND_IMPACT_ASSESSMENT.md
3. Contact backend team


\pagebreak

# FIREBASE_AUTH_IMPLEMENTATION.md

# Firebase Auth + Node.js (PostgreSQL) + Flutter Implementation Guide

This guide provides a complete, production-ready implementation for a disaster response application using Flutter, Firebase Authentication, Node.js, and PostgreSQL.

## Prerequisites
1.  **Firebase Project**: Created in Firebase Console with Authentication enabled (Email/Password or Phone).
2.  **Service Account**: Generated from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key. Save as `serviceAccountKey.json`.
3.  **PostgreSQL Database**: Running and accessible.

---

## SECTION 1 – FLUTTER SIDE

### 1. Dependencies (`pubspec.yaml`)
```yaml
dependencies:
  firebase_core: latest_version
  firebase_auth: latest_version
  http: latest_version
  # Provider or GetX for state management
```

### 2. Initialization (`main.dart`)
Initialize Firebase before running the app.

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}
```

### 3. Authentication Service (`services/auth_service.dart`)
Handles login and token retrieval.

```dart
import 'package:firebase_auth/firebase_auth.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Login with Email/Password
  Future<User?> signIn(String email, String password) async {
    try {
      UserCredential result = await _auth.signInWithEmailAndPassword(
        email: email, 
        password: password
      );
      return result.user;
    } catch (e) {
      print(e.toString());
      return null;
    }
  }

  // Get ID Token (Force refresh if needed)
  Future<String?> getIdToken() async {
    User? user = _auth.currentUser;
    if (user != null) {
      // true forces a refresh of the token
      return await user.getIdToken(true);
    }
    return null;
  }

  // Logout
  Future<void> signOut() async {
    await _auth.signOut();
  }
}
```

### 4. HTTP Interceptor / API Client (`services/api_service.dart`)
Attaches the token to every request to the backend.

```dart
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ApiService {
  final String baseUrl = 'http://your-backend-api.com/api';
  final AuthService _authService = AuthService();

  Future<http.Response> getProtectedData(String endpoint) async {
    String? token = await _authService.getIdToken();
    
    if (token == null) {
      throw Exception('User not authenticated');
    }

    return await http.get(
      Uri.parse('$baseUrl/$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token', // Attach Token Here
      },
    );
  }
}
```

---

## SECTION 2 – BACKEND SETUP (NODE.JS)

### 1. Dependencies
```bash
npm install firebase-admin pg express cors
```

### 2. Firebase Admin Initialization (`config/firebase.js`)
Place your `serviceAccountKey.json` in the root (add to `.gitignore`).

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
```

### 3. Authentication Middleware (`middleware/authMiddleware.js`)
Verifies the ID token sent from Flutter.

```javascript
const admin = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify ID token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach UID to request object
    req.user = decodedToken;
    req.uid = decodedToken.uid;
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = verifyToken;
```

---

## SECTION 3 & 4 – DATABASE connection & RBAC

### 1. PostgreSQL Schema
```sql
CREATE TABLE users (
    uid VARCHAR(255) PRIMARY KEY, -- Matches Firebase UID
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'volunteer', 'authority'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);
```

### 2. User Sync & Role Verification (`middleware/roleMiddleware.js` & `controllers`)
We verify the user in Postgres *after* Firebase verification.

```javascript
const { Pool } = require('pg');
const pool = new Pool({ /* config */ });

// Middleware to sync user and check role
const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    const { uid, email } = req.user; // From verifyToken middleware

    try {
      // 1. SELECT user from Postgres
      let result = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
      let user = result.rows[0];

      // 2. Sync: Create user if they don't exist (First Login)
      if (!user) {
        result = await pool.query(
          'INSERT INTO users (uid, email, role, last_login_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
          [uid, email, 'user'] // Default role
        );
        user = result.rows[0];
      } else {
        // Update last login
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE uid = $1', [uid]);
      }

      // 3. Attach DB user to request (contains role)
      req.dbUser = user;

      // 4. Role Check
      if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
         return res.status(403).json({ message: `Access denied. Requires ${requiredRole} role.` });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    }
  };
};

module.exports = checkRole;
```

### 3. Usage in Routes (`routes/taskRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// Route: Get All Tasks (Public to valid users)
router.get('/', verifyToken, checkRole(), (req, res) => {
    res.json({ message: "Tasks list" });
});

// Route: Assign Task (Authority Only)
router.post('/assign', verifyToken, checkRole('authority'), (req, res) => {
    res.json({ message: "Task assigned successfully" });
});

// Route: Accept Task (Volunteer Only)
router.post('/accept', verifyToken, checkRole('volunteer'), (req, res) => {
    res.json({ message: "Task accepted" });
});

module.exports = router;
```

---

## SECTION 5 – SECURITY BEST PRACTICES

1.  **Never Trust the Client**:
    *   Do **NOT** send the role from the Flutter app (e.g., in the body or a custom header). A malicious user can easily modify the app code to send `role: "admin"`.
    *   **Always** fetch the role from your secure PostgreSQL database using the verified Firebase UID.

2.  **Why Backend Verification?**:
    *   The Firebase ID Token is signed by Google. Verifying it on the backend ensures the request is coming from a legitimate, currently logged-in user.
    *   If you just check `if (user)` in Flutter, someone could call your API directly using Postman without logging in.

3.  **Blocking Users**:
    *   Firebase can disable accounts, but the ID token remains valid for 1 hour.
    *   **Solution**: Since you check the PostgreSQL database on every request (or cache it), you can add an `is_active` column in Postgres. If `false`, deny the request in the `checkRole` middleware immediately.

4.  **Token Refresh**:
    *   Firebase ID tokens expire after 1 hour.
    *   The Firebase SDK in Flutter automatically refreshes this token in the background.
    *   Calling `user.getIdToken()` in Flutter automatically handles getting a fresh token if the current one is expired.

---

## SECTION 6 – COMPLETE FLOW DIAGRAM

**Scenario**: A Volunteer accepts a task.

1.  **User Action**: Volunteer clicks "Accept Task" in Flutter.
2.  **Flutter**: Checks `FirebaseAuth`. User is logged in.
3.  **Flutter**: Calls `user.getIdToken()`. Gets JWT string `eyJ...`.
4.  **Network**: Sends `POST /api/tasks/accept` with header `Authorization: Bearer eyJ...`.
5.  **Backend (Node.js)**:
    *   `verifyToken` middleware intercepts request.
    *   Validates JWT signature using Firebase Admin SDK. **(Security Check 1)**
    *   Extracts `uid` (e.g., `user_abc123`).
6.  **Backend (Postgres)**:
    *   `checkRole('volunteer')` middleware runs.
    *   Queries `SELECT role FROM users WHERE uid = 'user_abc123'`.
    *   DB returns `role: 'volunteer'`.
7.  **Backend (Logic)**:
    *   Compares DB role ('volunteer') with required role ('volunteer'). **(Security Check 2)**.
    *   Match found. Proceed to controller.
8.  **Controller**: Updates task status in DB to "Accepted".
9.  **Response**: Returns `200 OK` to Flutter.



\pagebreak

# FRONTEND_IMPACT_ASSESSMENT.md

# Sahyog Platform - Frontend Impact Assessment
## Backend Changes: Critical Business Logic Fixes

**Backend Commit:** `c5e99f8` - "fix: critical business logic flaws and security vulnerabilities"
**Date:** February 26, 2026

---

## Executive Summary

The backend has implemented strict validation and authorization rules that **WILL BREAK** existing frontend functionality if not updated. All frontend components (Web App, Mobile App, Admin Dashboard) require updates to comply with new API requirements.

---

## Critical Breaking Changes

### 1. SOS Resolution Now Requires Proof
**Affected Roles:** Volunteer, Coordinator, Admin

#### API Change
```http
PATCH /api/v1/sos/:id/status
```

#### New Required Parameters
| Parameter | Type | Required For | Description |
|-----------|------|--------------|-------------|
| `status` | string | Always | 'resolved' to close SOS |
| `resolution_proof` | array | Volunteers (required), Coordinators (optional) | Array of image/video URLs |
| `resolution_notes` | string | Optional | Text description of resolution |

#### Frontend Changes Required

**Volunteer App:**
- Add photo/video upload component before SOS resolution
- Show warning: "Photo proof required to resolve SOS"
- Implement multi-image picker with preview
- Disable "Resolve" button until at least 1 image uploaded

**Coordinator Dashboard:**
- Add optional proof upload (can override without proof)
- Add resolution notes text area
- Show proof viewer for SOS resolution review

**Error Handling:**
```javascript
// New error response
{
  "message": "Resolution requires photo/video proof. Upload proof and try again."
}
```

---

### 2. Need Resolution Now Requires Proof
**Affected Roles:** Volunteer, Coordinator, Admin

#### API Change
```http
PATCH /api/v1/needs/:id/resolve
```

#### New Required Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resolution_proof` | array | Yes (volunteers), No (coordinators/admins) | Array of image URLs |
| `resolution_notes` | string | Optional | Resolution description |

#### Frontend Changes Required

**Volunteer App:**
- Add proof upload step before marking need as resolved
- Show requirement message for assigned volunteers
- Coordinator override option visible only to coordinators

**Error Handling:**
```javascript
{
  "message": "Resolution requires photo/video proof of fulfillment. Please upload proof and try again."
}
```

---

### 3. Task Acceptance Validations
**Affected Roles:** Volunteer

#### API Change
```http
PATCH /api/v1/tasks/:id/status
Body: { "status": "accepted" }
```

#### New Validation Rules
1. **Skills Check:** Critical tasks (medical, rescue, fire, evacuation) require matching skills
2. **Proximity Check:** Volunteer must be within 50km of task location
3. **Workload Check:** Maximum 3 active tasks per volunteer

#### Frontend Changes Required

**Volunteer App - Task Detail Screen:**
```javascript
// Show skill requirements
if (['medical', 'rescue', 'fire', 'evacuation'].includes(task.type)) {
  showBadge(`Requires ${task.type} training`, 'warning');
}

// Show distance warning
if (volunteerDistance > 50) {
  showAlert(`You are ${distance}km away. Maximum allowed: 50km`);
  disableAcceptButton();
}

// Show active task count
showBadge(`${activeTasks}/3 active tasks`, activeTasks >= 3 ? 'danger' : 'info');
```

**Error Responses to Handle:**
```javascript
// Skills mismatch
{
  "message": "This medical task requires specific training. Please contact a coordinator.",
  "required_training": "medical",
  "your_skills": ["general", "transport"]
}

// Too far away
{
  "message": "You are too far from this task location (75km away). Maximum distance is 50km.",
  "distance_km": 75,
  "max_distance_km": 50
}

// Too many tasks
{
  "message": "You have reached the maximum of 3 active tasks. Complete existing tasks before accepting new ones.",
  "active_tasks": 3,
  "max_tasks": 3
}
```

---

### 4. Task Voting Restrictions
**Affected Roles:** Volunteer

#### API Change
```http
POST /api/v1/tasks/:id/vote-completion
```

#### New Restrictions
- Volunteers **CANNOT** vote on their own tasks
- Can only vote "completed" on tasks already marked "completed" by volunteer

#### Frontend Changes Required

**Volunteer App:**
```javascript
// Hide vote buttons on own tasks
if (task.volunteer_id === currentUser.id) {
  hideVoteButtons();
  showMessage("Other volunteers or coordinators must verify your work");
}

// Only show vote options when task.status === 'completed'
if (task.status !== 'completed') {
  disableVoteButton();
  showTooltip("Task must be marked complete by volunteer first");
}
```

**Error Response:**
```javascript
{
  "message": "You cannot vote on completion of your own task. Other volunteers or coordinators must verify your work."
}
```

---

### 5. Disaster Resolution Restrictions
**Affected Roles:** Coordinator, Admin

#### API Change
```http
POST /api/v1/disasters/:id/resolve
```

#### New Restrictions
- Only coordinators and admins can resolve disasters
- Cannot resolve if active tasks or SOS alerts exist

#### Frontend Changes Required

**Admin/Coordinator Dashboard:**
```javascript
// Show resolve button only for coordinators/admins
if (['coordinator', 'admin'].includes(user.role)) {
  showResolveButton();
}

// Check for active items before allowing resolve
if (disaster.active_tasks > 0 || disaster.active_sos > 0) {
  showWarning(`Cannot resolve: ${active_tasks} active tasks, ${active_sos} active SOS`);
  disableResolveButton();
}
```

**Error Response:**
```javascript
{
  "message": "Cannot resolve disaster with active tasks or SOS alerts",
  "active_tasks": 5,
  "active_sos": 2
}
```

---

### 6. Shelter Capacity Validation
**Affected Roles:** Volunteer, Coordinator, Admin

#### API Change
```http
POST /api/v1/shelters/:id/checkin
```

#### New Validation
- Cannot exceed shelter capacity
- Returns detailed capacity information

#### Frontend Changes Required

**All Apps:**
```javascript
// Show capacity bar
showCapacityBar(current, capacity, percentage);

// Warning at 90%
if (percentage >= 90) {
  showAlert(`Warning: Shelter at ${percentage}% capacity`);
}

// Block check-in if over capacity
if (requestedCount > availableSpace) {
  showError(`Only ${availableSpace} spots available`);
}
```

**Error Response:**
```javascript
{
  "message": "Check-in would exceed shelter capacity",
  "shelter_name": "Relief Center A",
  "capacity": 100,
  "current_occupancy": 95,
  "available_space": 5,
  "requested_checkin": 10
}
```

---

### 7. Zone Deletion Protection
**Affected Roles:** Admin

#### API Change
```http
DELETE /api/v1/disasters/:id/relief-zones/:zoneId
```

#### New Validation
- Cannot delete zone with active tasks, volunteers, coordinators, or resources

#### Frontend Changes Required

**Admin Dashboard:**
```javascript
// Show active assignments count
showZoneStats({
  active_tasks: 5,
  active_volunteers: 12,
  active_coordinators: 2,
  deployed_resources: 8
});

// Disable delete if any active assignments
if (totalActive > 0) {
  disableDeleteButton();
  showMessage("Reassign or complete all activities before deleting zone");
}
```

**Error Response:**
```javascript
{
  "message": "Cannot delete zone with active assignments. Reassign or complete all activities first.",
  "active_tasks": 5,
  "active_volunteers": 12,
  "active_coordinators": 2,
  "deployed_resources": 8
}
```

---

### 8. Task Creation Foreign Key Validation
**Affected Roles:** Coordinator, Admin

#### API Change
```http
POST /api/v1/tasks
```

#### New Validation
- Validates `need_id`, `disaster_id`, `zone_id`, `volunteer_id`, `sosId` exist

#### Frontend Changes Required

**Coordinator Dashboard:**
```javascript
// Validate references before submission
// Show 404 errors if referenced items don't exist

// Error responses:
{ "message": "Referenced need not found" }
{ "message": "Referenced disaster not found" }
{ "message": "Referenced zone not found" }
{ "message": "Referenced volunteer not found" }
{ "message": "Referenced SOS alert not found" }
```

---

### 9. SOS Auto-Resolution Removed
**Affected Roles:** All

#### Behavior Change
- Completing a task NO LONGER auto-resolves linked SOS
- SOS stays in "acknowledged" status
- Coordinator must manually resolve with proof

#### Frontend Changes Required

**All Apps:**
```javascript
// Listen for new socket event
socket.on('task_completed_sos_pending', (data) => {
  showNotification(data.message);
  // SOS still needs resolution
});

// Don't show "SOS Resolved" when task completes
// Show "Task Complete - SOS Pending Review" instead
```

---

## Component-by-Component Breakdown

### 1. User/Citizen Side (Public Reporting)

**No Breaking Changes** - Can still:
- Report SOS without authentication
- Report needs
- Report missing persons

**Recommended Enhancements:**
- Add photo upload to SOS reporting
- Add location picker with map

---

### 2. Volunteer Mobile App

**CRITICAL UPDATES REQUIRED:**

| Screen | Changes |
|--------|---------|
| Task List | Show distance to task, skill requirements, active task count |
| Task Detail | Add "Accept" validation with distance/skill checks |
| Task Complete | Add proof photo upload before marking complete |
| SOS Resolution | Add mandatory photo upload for SOS resolution |
| Need Resolution | Add proof upload for assigned needs |
| Shelter Check-in | Show capacity warning, block over-capacity |
| My Tasks | Show 3-task limit indicator |

**New UI Components Needed:**
- Image picker with multi-select
- Distance calculator display
- Skill badge display
- Capacity progress bar

---

### 3. Coordinator Web Dashboard

**CRITICAL UPDATES REQUIRED:**

| Screen | Changes |
|--------|---------|
| Disaster Management | Add active task/SOS check before resolve |
| Zone Management | Show active assignments, block delete if active |
| Task Oversight | Show volunteer distance, skills mismatch warnings |
| SOS Review | Add proof viewer, resolution notes field |
| Need Review | Add proof requirement for resolution |
| Task Voting | Hide vote for task owner, show status-based voting |

**New UI Components Needed:**
- Proof image gallery viewer
- Active assignments counter
- Distance validation display
- Override controls for coordinators

---

### 4. NGO/Organization Portal

**MODERATE UPDATES REQUIRED:**

| Screen | Changes |
|--------|---------|
| Resource Management | No changes (but zone deletion affects resources) |
| Volunteer Assignment | Consider task limits when assigning |
| Task Creation | FK validation errors to handle |

---

### 5. Admin Panel

**CRITICAL UPDATES REQUIRED:**

| Screen | Changes |
|--------|---------|
| Disaster Resolution | Add role check, active items validation |
| Zone Management | Show all active assignments before delete |
| User Management | No changes |
| System Overview | Add capacity warnings, task limit indicators |

---

## Commit Strategy for Frontend

### Recommended Commit Structure

```
feat(frontend): align with backend business logic fixes

BREAKING CHANGE: Frontend must be deployed with backend commit c5e99f8

Changes:
- Add proof upload for SOS resolution (volunteer required, coordinator optional)
- Add proof upload for need resolution
- Add task acceptance validation (skills, 50km proximity, 3-task limit)
- Prevent self-voting on task completion
- Add disaster resolution restrictions (coordinator/admin only)
- Add shelter capacity validation and warnings
- Add zone deletion protection display
- Handle new foreign key validation errors
- Update SOS status flow (no auto-resolution)

Components Updated:
- VolunteerMobile: TaskAcceptance, SOSResolution, NeedResolution, ShelterCheckIn
- CoordinatorDashboard: DisasterMgmt, ZoneMgmt, SOSReview, TaskOversight
- AdminPanel: DisasterResolution, ZoneDeletion
- Shared: ImageUploader, CapacityIndicator, DistanceCalculator

Closes: #[issue-number]
```

### Suggested Frontend Commits (Incremental)

1. **feat(volunteer): add proof upload for SOS and need resolution**
2. **feat(volunteer): add task acceptance validation (skills, distance, workload)**
3. **feat(volunteer): prevent self-voting on task completion**
4. **feat(coordinator): add SOS review with proof viewer**
5. **feat(coordinator): add disaster resolution restrictions**
6. **feat(coordinator): add zone deletion protection UI**
7. **feat(shared): add shelter capacity indicators**
8. **feat(shared): add image upload component**
9. **fix(shared): handle new API validation errors**
10. **feat(shared): update socket event handlers for task completion flow**

---

## Testing Checklist

### Volunteer App
- [ ] Cannot resolve SOS without photo proof
- [ ] Cannot accept medical task without medical skill
- [ ] Cannot accept task >50km away
- [ ] Cannot accept 4th active task
- [ ] Cannot vote on own task completion
- [ ] Shelter shows capacity warning at 90%
- [ ] Shelter blocks check-in over capacity

### Coordinator Dashboard
- [ ] Can resolve SOS without proof (override)
- [ ] Can resolve disaster only with no active items
- [ ] Can delete zone only with no active assignments
- [ ] Can view proof images for SOS resolution
- [ ] Cannot vote on tasks not marked complete

### Admin Panel
- [ ] Can resolve any disaster (if no active items)
- [ ] Can delete zones (if no active assignments)
- [ ] All validation errors display correctly

---

## Migration Timeline

| Phase | Duration | Actions |
|-------|----------|---------|
| **Phase 1** | 1-2 days | Update API service layer, add new parameters |
| **Phase 2** | 2-3 days | Build new UI components (image upload, capacity indicators) |
| **Phase 3** | 2-3 days | Update screens with validation logic |
| **Phase 4** | 1-2 days | Error handling, edge cases |
| **Phase 5** | 1-2 days | Testing, bug fixes |

**Total Estimated Time: 7-12 days for full frontend update**

---

## Questions?

Contact the backend team regarding:
- Image upload endpoint specifications
- Maximum image sizes and formats
- Socket event documentation
- Rate limiting policies


\pagebreak

# ROUTES.md

# Sahyog – All addresses and routes

Base URLs (local dev):
- **Backend API:** `http://localhost:3000`
- **Admin panel:** `http://localhost:5174`

---

## Backend API (port 3000)

### No auth required

| Method | URL | Description |
|--------|-----|-------------|
| GET | `http://localhost:3000/` | Welcome message |
| GET | `http://localhost:3000/api/health` | Health check (backend reachable) |

### Auth (Clerk) – `Authorization: Bearer <token>` required unless noted

#### Auth
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/auth/me` | Current user from Clerk (protected) |

#### Users
| Method | URL | Description | Min role |
|--------|-----|-------------|----------|
| GET | `/api/users/me` | Current user profile (id, email, role) | any |
| PUT | `/api/users/:uid/role` | Update user role | org:admin |
| GET | `/api/users/authority-only` | Example: member-only message | org:member |
| GET | `/api/users/volunteer-only` | Example: volunteer-only message | org:volunteer |

#### SOS reports (`/api/v1/sos`)
| Method | URL | Description | Min role |
|--------|-----|-------------|----------|
| POST | `/api/v1/sos` | Create SOS report | any |
| GET | `/api/v1/sos` | List reports (filtered by role) | any |
| GET | `/api/v1/sos/nearby?lat=&lng=&radiusMeters=` | Nearby SOS | any |
| GET | `/api/v1/sos/:id` | Get one report | any |
| PATCH | `/api/v1/sos/:id/status` | Update status | reporter/volunteer/admin |

#### Disasters (`/api/v1/disasters`)
| Method | URL | Description | Min role |
|--------|-----|-------------|----------|
| POST | `/api/v1/disasters` | Create disaster | org:admin |
| PATCH | `/api/v1/disasters/:id` | Update disaster | org:admin |
| POST | `/api/v1/disasters/:id/activate` | Activate | org:admin |
| POST | `/api/v1/disasters/:id/resolve` | Resolve | org:admin |
| GET | `/api/v1/disasters` | List disasters | any |
| GET | `/api/v1/disasters/:id` | Get one | any |
| GET | `/api/v1/disasters/:id/stats` | Stats | org:admin |

#### Volunteers (`/api/v1/volunteers`)
| Method | URL | Description | Min role |
|--------|-----|-------------|----------|
| POST | `/api/v1/volunteers/register` | Register as volunteer | any |
| GET | `/api/v1/volunteers` | List volunteers | org:admin |
| GET | `/api/v1/volunteers/:id` | Get one | org:admin |
| PATCH | `/api/v1/volunteers/:id/verify` | Verify volunteer | org:admin |
| PATCH | `/api/v1/volunteers/availability` | Toggle availability | org:volunteer |
| POST | `/api/v1/volunteers/location` | Update location | org:volunteer |
| GET | `/api/v1/volunteers/tasks` | My tasks | org:volunteer |

#### Tasks (`/api/v1/tasks`)
| Method | URL | Description | Min role |
|--------|-----|-------------|----------|
| POST | `/api/v1/tasks` | Create task | org:volunteer_head |
| GET | `/api/v1/tasks/pending` | List pending tasks | any |
| GET | `/api/v1/tasks/:id` | Get one | any |
| PATCH | `/api/v1/tasks/:id/accept` | Accept task | org:volunteer |
| PATCH | `/api/v1/tasks/:id/start` | Start task | org:volunteer |
| PATCH | `/api/v1/tasks/:id/complete` | Complete task | org:volunteer |

#### Shelters (`/api/v1/shelters`)
| Method | URL | Description | Min role |
|--------|-----|-------------|----------|
| POST | `/api/v1/shelters` | Create shelter | org:admin |
| PATCH | `/api/v1/shelters/:id` | Update shelter | org:admin |
| GET | `/api/v1/shelters` | List shelters | any |
| GET | `/api/v1/shelters/:id` | Get one | any |
| POST | `/api/v1/shelters/:id/checkin` | Check in to shelter | org:volunteer |

#### Missing persons (`/api/v1/missing`)
| Method | URL | Description | Min role |
|--------|-----|-------------|----------|
| POST | `/api/v1/missing` | Report missing person | any |
| GET | `/api/v1/missing` | Search/filter reports | any |
| PATCH | `/api/v1/missing/:id/found` | Mark as found | org:volunteer |

---

## Admin panel (port 5174)

All under `http://localhost:5174`; protected routes require Clerk sign-in.

| Path | Description |
|------|-------------|
| `/sign-in` | Clerk sign-in page |
| `/sign-up` | Clerk sign-up page |
| `/` | Dashboard (profile + quick links) |
| `/sos` | SOS reports list + status update |
| `/disasters` | Disasters list |
| `/volunteers` | Volunteers list |
| `/shelters` | Shelters list |
| `/missing` | Missing persons list |

Any other path redirects to `/`.


\pagebreak

# START_HERE.md

# Start backend + admin (two terminals)

**"Backend: unreachable"** means the API server is not running or not on port 3000. Use two terminals.

---

## Terminal 1 – Backend (required first)

```bash
cd /Users/nirajrajendranaphade/Programming/sahyog
npm run dev
```

Wait until you see:
```text
Server running in development mode on port 3000
✅ Clerk Auth Initialized
```

Leave this terminal open.

---

## Terminal 2 – Admin panel

```bash
cd /Users/nirajrajendranaphade/Programming/sahyog/admin-panel
npm run dev
```

Open **http://localhost:5174** in your browser.

---

## Quick check

With the backend running (Terminal 1), in a **third** terminal or in the browser:

```bash
curl http://localhost:3000/api/health
```

You should see: `{"ok":true,"message":"Backend reachable"}`

If that fails, the backend is not running or not on port 3000.
