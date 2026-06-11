# Backend scripts

## Local MySQL cloud fields migration

The `Lesson` and `Document` SQLAlchemy models include storage metadata and publish workflow fields for local and future cloud-backed files. Existing local MySQL databases created before those fields were added may not have the matching `lessons` or `documents` columns, so SQLAlchemy can fail at runtime with errors such as `Unknown column 'lessons.file_url'` or `Unknown column 'documents.file_name'`.

Run this idempotent migration against your local MySQL database when backend startup or lesson/document queries fail with missing storage or publish columns. It checks table and column existence first, only adds missing columns on `lessons` and `documents`, and is safe to rerun. It never drops, truncates, deletes, or reseeds data.

```bash
python backend/app/scripts/migrate_cloud_fields.py
```

Then restart the backend:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The local `.env` should continue to point at MySQL until the separate Supabase migration is ready.
