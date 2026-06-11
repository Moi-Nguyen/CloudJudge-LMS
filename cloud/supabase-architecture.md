# Cloud Migration Architecture

## Components
- **React Frontend**: Vite/TypeScript app hosted on Vercel or another static frontend host.
- **FastAPI Backend**: API service hosted on Render, Railway, Fly.io, or a container platform.
- **Supabase PostgreSQL**: Target managed PostgreSQL database using `postgresql+asyncpg://`.
- **Supabase Storage**: Target object storage for lesson documents and videos.

## Data Flow
User Browser ? React Frontend ? FastAPI Backend ? Supabase PostgreSQL

FastAPI Backend ? Supabase Storage

The frontend should call the backend through `VITE_API_URL`. The backend should read all deployment-specific settings from environment variables, especially `DATABASE_URL`, `CORS_ORIGINS`, and secrets.

## Authentication Flow
1. User submits credentials from the React app.
2. FastAPI validates credentials against the database.
3. FastAPI returns access and refresh tokens.
4. React stores and sends the access token on protected API calls.
5. Backend role checks continue to authorize Student and Instructor actions.

## Course Flow
1. Instructor creates or updates course data through the frontend.
2. Backend validates ownership and role permissions.
3. Course, enrollment, and lesson metadata are persisted in Supabase PostgreSQL.
4. Students read published course and lesson data through backend APIs.

## Quiz Flow
1. Instructor manages quiz metadata and questions through backend APIs.
2. Student submits quiz answers through the frontend.
3. Backend grades attempts and stores attempts/results in PostgreSQL.
4. Frontend displays grades from backend responses.

## Lesson File Flow
1. Lesson records store file/link metadata only: `file_url`, `external_url`, `file_name`, `file_type`, `file_size`, and `storage_provider`.
2. Real document/video files will later live in Supabase Storage, not directly in the database.
3. `file_url` should later point to a Supabase Storage public or signed URL after upload integration exists.
4. `external_url` is for Google Drive, YouTube, or other third-party learning resources.
5. `storage_provider` identifies the source: `local`, `external`, or future `supabase`.

## Programming Problem Recommendation
Do not implement judge execution in the LMS migration phase. Keep the data model separate from lesson/course migration concerns.

Recommended entities:
- **Problem**: `title`, `statement`, `sample_input`, `sample_output`, `constraints`.
- **Submission**: `user_id`, `problem_id`, `code`, `language`, `status`.
- **TestCase**: `problem_id`, `input`, `expected_output`, plus visibility/order metadata if needed.

Judge phases:
- **Phase 1**: Run submissions in a controlled service and compare normalized stdout to expected output.
- **Phase 2**: Move execution to isolated containers with time, memory, filesystem, and network limits.