
# API Documentation

## Authentication Endpoints

### Login
**Endpoint:** `/auth/login`  
**Method:** `POST`  
**Description:** Authenticates a user and returns a JWT token note: only employees with HR group can access the rest of api endpoints and you must include auth headers and use Bearer auth in rest of api endpoints.  
**Request Body:**  
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**  
- **200 OK:**  
  ```json
  {
    "access_token": "string"
  }
  ```
- **401 Unauthorized:** Invalid credentials.

---

### Register
**Endpoint:** `/auth/register`  
**Method:** `POST`  
**Description:** Registers a new user.  
**Request Body:**  
```json
{
  "name": "string",
  "password": "string",
  "email": "string",
  "group": "string",
}
```
**Response:**  
- **201 Created:**  
  ```json
  {
    "message": "User registered successfully"
  }
  ```
- **400 Bad Request:** Validation errors.

---

## Employee Endpoints

### Create Employee
**Endpoint:** `/employees`  
**Method:** `POST`  
**Description:** Adds a new employee to the system .  
**Request Body:**  
```json
{
  "name": "string",
  "email": "string",
  "group": "string"
}
```
**Response:**  
- **201 Created:**  
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
  ```
- **400 Bad Request:** Validation errors.

---

### Get All Employees
**Endpoint:** `/employees`  
**Method:** `GET`  
**Description:** Retrieves a list of all employees.  
**Response:**  
- **200 OK:**  
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "group": "string"
    }
  ]
  ```

---

### Get Employee by ID
**Endpoint:** `/employees/:id`  
**Method:** `GET`  
**Description:** Retrieves details of a specific employee by ID.  
**Response:**  
- **200 OK:**  
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "group": "string"
  }
  ```
- **404 Not Found:** Employee not found.

---

### Update Employee
**Endpoint:** `/employees/:id`  
**Method:** `PUT`  
**Description:** Updates an employee's details.  
**Request Body:**  
```json
{
  "name": "string",
  "email": "string",
  "group": "string"
}
```
**Response:**  
- **200 OK:**  
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "group": "string"
  }
  ```
- **404 Not Found:** Employee not found.

---

### Delete Employee
**Endpoint:** `/employees/:id`  
**Method:** `DELETE`  
**Description:** Deletes an employee by ID.  
**Response:**  
- **200 OK:**  
  ```json
  {
    "message": "Employee deleted successfully"
  }
  ```
- **404 Not Found:** Employee not found.

---

## Attendance Endpoints

### Record Attendance
**Endpoint:** `/attendance`  
**Method:** `POST`  
**Description:** Records attendance for an employee.  
**Request Body:**  
```json
{
  "employeeId": "string",
  "date": "YYYY-MM-DD",
  "status": "Present/Absent" // ignore this
}
```
**Response:**  
- **201 Created:**  
  ```json
  {
    "id": "string",
    "employeeId": "string",
    "date": "YYYY-MM-DD",
    "status": "Present/Absent" // planned so ignore it 
  }
  ```
- **400 Bad Request:** Validation errors.

---

### Get All Attendance Records
**Endpoint:** `/attendance`  
**Method:** `GET`  
**Description:** Retrieves all attendance records.  
**Response:**  
- **200 OK:**  
  ```json
  [
    {
      "id": "string",
      "employeeId": "string",
      "date": "YYYY-MM-DD",
      "status": "Present/Absent"  // planned
    }
  ]
  ```

---

### Get Attendance by Employee ID
**Endpoint:** `/attendance/employee/:id`  
**Method:** `GET`  
**Description:** Retrieves attendance records for a specific employee.  
**Response:**  
- **200 OK:**  
  ```json
  [
    {
      "id": "string",
      "employeeId": "string",
      "date": "YYYY-MM-DD",
      "status": "Present/Absent" // planned
    }
  ]
  ```
- **404 Not Found:** Employee not found.

---

## Server Information
**Base URL:** `http://localhost:3006`  
**Status:** Running