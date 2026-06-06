# CloudJudge LMS - Specification Document

## 1. Project Overview

### Project Name
CloudJudge LMS (Learning Management System)

### Project Type
Full-stack Cloud-Native Application

### Core Functionality
Một hệ thống quản lý học tập và chấm bài lập trình tự động trên cloud, hỗ trợ quản lý khóa học, quiz, và bài tập lập trình với auto-grading.

### Target Users
- **Admin**: Quản trị viên hệ thống
- **Instructor (Giảng viên)**: Người tạo và quản lý khóa học, bài tập
- **Student (Sinh viên)**: Người học và nộp bài

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 + Vite 5
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 3
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI 0.109+
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0 (async)
- **Authentication**: JWT (python-jose)
- **Database**: MySQL 8.0
- **Validation**: Pydantic v2
- **Migrations**: Alembic
- **Password Hashing**: bcrypt

### Cloud Infrastructure (GCP)
- **Compute**: Cloud Run
- **Database**: Cloud SQL (MySQL)
- **Storage**: Cloud Storage (GCS)
- **Container**: Docker
- **CI/CD**: Cloud Build / GitHub Actions

---

## 3. Architecture Design

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  Pages  │  │Components│  │  Hooks  │  │ Stores  │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                    REST API (HTTPS)
                            │
┌─────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  API Layer (Routers)              │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │                Service Layer                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │  Auth   │ │  User   │ │ Course  │ │Problem │  │    │
│  │  │ Service │ │ Service │ │ Service │ │ Service│  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Repository Layer                     │    │
│  │  ┌──────────────────────────────────────────┐    │    │
│  │  │         Database Abstraction             │    │    │
│  │  └──────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                    MySQL / Cloud SQL
```

### Project Structure

```
CloudJudge-LMS/
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── api/                # Axios API clients
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Shared components
│   │   │   └── layout/         # Layout components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Page components
│   │   │   ├── admin/          # Admin pages
│   │   │   ├── instructor/     # Instructor pages
│   │   │   └── student/        # Student pages
│   │   ├── stores/             # Zustand stores
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/                # API Routers
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/  # Endpoint routes
│   │   │   │   └── router.py
│   │   ├── core/               # Core configurations
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/             # SQLAlchemy Models
│   │   ├── schemas/            # Pydantic Schemas
│   │   ├── services/           # Business Logic
│   │   ├── repositories/       # Data Access
│   │   ├── utils/              # Utilities
│   │   └── main.py
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Unit tests
│   └── requirements.txt
│
├── docker/                     # Docker configurations
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── cloud/                      # GCP configurations
│   ├── cloudbuild.yaml
│   └── terraform/
│
├── docs/                       # Documentation
├── SPEC.md
├── README.md
└── .env.example
```

---

## 4. Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email |
| password_hash | VARCHAR(255) | Bcrypt hash |
| full_name | VARCHAR(100) | Display name |
| role | ENUM | admin, instructor, student |
| avatar_url | VARCHAR(500) | Profile image |
| is_active | BOOLEAN | Account status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Update timestamp |

### Courses Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(255) | Course title |
| description | TEXT | Course description |
| thumbnail_url | VARCHAR(500) | Course image |
| instructor_id | UUID | FK to users |
| is_published | BOOLEAN | Publication status |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Update timestamp |

### Enrollments Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| course_id | UUID | FK to courses |
| enrolled_at | DATETIME | Enrollment date |
| status | ENUM | active, completed, dropped |

### Lessons Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| course_id | UUID | FK to courses |
| title | VARCHAR(255) | Lesson title |
| content | TEXT | Lesson content |
| order | INTEGER | Display order |
| lesson_type | ENUM | video, document, quiz, programming |
| created_at | DATETIME | Creation timestamp |

### Quizzes Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| lesson_id | UUID | FK to lessons |
| title | VARCHAR(255) | Quiz title |
| time_limit | INTEGER | Time limit (minutes) |
| max_attempts | INTEGER | Max attempts allowed |
| passing_score | INTEGER | Passing percentage |

### Quiz Questions Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| quiz_id | UUID | FK to quizzes |
| question | TEXT | Question text |
| question_type | ENUM | multiple_choice, true_false |
| options | JSON | Answer options |
| correct_answer | VARCHAR(255) | Correct answer |
| points | INTEGER | Point value |
| order | INTEGER | Display order |

### Quiz Attempts Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| quiz_id | UUID | FK to quizzes |
| user_id | UUID | FK to users |
| score | INTEGER | Achieved score |
| total_points | INTEGER | Total possible points |
| started_at | DATETIME | Start timestamp |
| submitted_at | DATETIME | Submit timestamp |

### Programming Problems Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| lesson_id | UUID | FK to lessons |
| title | VARCHAR(255) | Problem title |
| description | TEXT | Problem statement |
| starter_code | TEXT | Code template |
| language | VARCHAR(50) | Supported languages |
| time_limit | INTEGER | Execution time limit (ms) |
| memory_limit | INTEGER | Memory limit (MB) |

### Test Cases Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| problem_id | UUID | FK to problems |
| input | TEXT | Test input |
| expected_output | TEXT | Expected output |
| is_sample | BOOLEAN | Sample test case |
| points | INTEGER | Point value |

### Submissions Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| problem_id | UUID | FK to problems |
| user_id | UUID | FK to users |
| code | TEXT | Submitted code |
| language | VARCHAR(50) | Programming language |
| status | ENUM | pending, running, accepted, wrong_answer, time_limit, error |
| score | INTEGER | Achieved score |
| execution_time | INTEGER | Execution time (ms) |
| memory_used | INTEGER | Memory used (KB) |
| submitted_at | DATETIME | Submission timestamp |
| graded_at | DATETIME | Grading timestamp |

### Documents Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| lesson_id | UUID | FK to lessons |
| title | VARCHAR(255) | Document title |
| file_url | VARCHAR(500) | File URL |
| file_type | VARCHAR(50) | File type |
| created_at | DATETIME | Creation timestamp |

---

## 5. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | User registration |
| POST | /api/v1/auth/login | User login |
| POST | /api/v1/auth/refresh | Refresh token |
| POST | /api/v1/auth/logout | User logout |
| GET | /api/v1/auth/me | Get current user |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/users | List all users |
| GET | /api/v1/users/{id} | Get user details |
| PUT | /api/v1/users/{id} | Update user |
| DELETE | /api/v1/users/{id} | Delete user |
| POST | /api/v1/users/{id}/toggle-active | Toggle user status |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/courses | List courses |
| POST | /api/v1/courses | Create course |
| GET | /api/v1/courses/{id} | Get course details |
| PUT | /api/v1/courses/{id} | Update course |
| DELETE | /api/v1/courses/{id} | Delete course |
| POST | /api/v1/courses/{id}/enroll | Enroll in course |
| GET | /api/v1/courses/{id}/lessons | Get course lessons |
| GET | /api/v1/courses/my | Get enrolled courses |

### Lessons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/lessons | Create lesson |
| GET | /api/v1/lessons/{id} | Get lesson details |
| PUT | /api/v1/lessons/{id} | Update lesson |
| DELETE | /api/v1/lessons/{id} | Delete lesson |

### Quizzes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/quizzes/{id} | Get quiz with questions |
| POST | /api/v1/quizzes/{id}/attempt | Start quiz attempt |
| POST | /api/v1/quizzes/{id}/submit | Submit quiz answers |
| GET | /api/v1/quizzes/{id}/attempts | Get user's attempts |

### Programming Problems
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/problems | Create problem |
| GET | /api/v1/problems/{id} | Get problem details |
| PUT | /api/v1/problems/{id} | Update problem |
| DELETE | /api/v1/problems/{id} | Delete problem |
| POST | /api/v1/problems/{id}/testcases | Add test case |
| POST | /api/v1/problems/{id}/submit | Submit solution |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/submissions | List user submissions |
| GET | /api/v1/submissions/{id} | Get submission details |
| GET | /api/v1/problems/{id}/submissions | Get problem submissions |

### Statistics (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/stats/overview | System overview stats |
| GET | /api/v1/stats/users | User statistics |
| GET | /api/v1/stats/courses | Course statistics |
| GET | /api/v1/stats/submissions | Submission statistics |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/documents/upload | Upload document |
| GET | /api/v1/documents/{id} | Get document |
| DELETE | /api/v1/documents/{id} | Delete document |

---

## 6. Security Requirements

### Authentication
- JWT Access Token (15 min expiry)
- JWT Refresh Token (7 days expiry)
- Tokens stored in httpOnly cookies
- CSRF protection

### Authorization
- Role-based access control (RBAC)
- Permission checks on all endpoints
- Resource ownership validation

### Input Validation
- All inputs validated with Pydantic
- SQL injection prevention (ORM)
- XSS prevention (React escaping)
- Rate limiting on auth endpoints

### Data Protection
- Passwords hashed with bcrypt
- Sensitive data encrypted
- HTTPS only
- CORS configuration

---

## 7. Cloud Deployment

### Cloud Run Configuration
- Auto-scaling: 0 to 100 instances
- Memory: 512Mi
- CPU: 1
- Port: 8080
- Health check endpoint

### Cloud SQL Configuration
- Machine type: db-n1-standard-2
- Storage: 20GB
- Automatic backups
- High availability

### Cloud Storage
- Bucket for user uploads
- Signed URLs for secure access
- CORS configuration

### Docker Images
- Multi-stage builds for optimization
- Alpine base images
- Non-root user in containers

---

## 8. UI/UX Design

### Color Palette
```
Primary:     #3B82F6 (Blue)
Secondary:   #8B5CF6 (Purple)
Accent:      #10B981 (Emerald)
Background:  #F9FAFB (Light Gray)
Surface:     #FFFFFF (White)
Text:        #111827 (Gray 900)
Text Muted:  #6B7280 (Gray 500)
Error:       #EF4444 (Red)
Warning:     #F59E0B (Amber)
Success:     #10B981 (Green)
```

### Typography
- Font Family: Inter
- Headings: Bold, tracking-tight
- Body: Regular, leading-relaxed

### Layout
- Responsive grid system
- Sidebar navigation
- Card-based content
- Consistent spacing (4px base)

### Components
- Button: Primary, Secondary, Outline, Ghost
- Input: Text, Email, Password with validation
- Card: Elevated surface with shadow
- Modal: Centered overlay with backdrop
- Toast: Bottom-right notifications

---

## 9. Implementation Phases

### Phase 1: Project Setup
- Initialize frontend with Vite
- Initialize backend with FastAPI
- Configure Docker
- Setup database

### Phase 2: Core Backend
- Database models
- Authentication system
- User management
- Course management

### Phase 3: Learning Features
- Lessons CRUD
- Quiz system
- Programming problems
- Test cases

### Phase 4: Frontend Core
- Auth pages
- Dashboard layouts
- Navigation

### Phase 5: Feature Pages
- Admin dashboard
- Instructor dashboard
- Student dashboard

### Phase 6: Integration
- API integration
- State management
- Error handling

### Phase 7: Cloud Deployment
- Dockerfile optimization
- Cloud Build setup
- Cloud Run deployment

---

## 10. Code Quality Standards

### Backend
- Async/await everywhere
- Type hints on all functions
- Docstrings for complex logic
- Repository pattern for data access
- Service layer for business logic
- Proper error handling

### Frontend
- Functional components only
- Custom hooks for logic
- TypeScript strict mode
- Lazy loading for routes
- Memoization where needed
- Proper error boundaries
