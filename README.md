# CloudJudge LMS

Hệ thống Quản lý Học tập và Chấm bài Lập trình Tự động trên Cloud

![CloudJudge LMS](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)

## Giới thiệu

CloudJudge LMS là một hệ thống quản lý học tập (LMS) hiện đại, được thiết kế với kiến trúc cloud-native, hỗ trợ:

- **Quản lý khóa học** - Tạo, chỉnh sửa, xuất bản khóa học
- **Quiz** - Tạo và làm bài kiểm tra trắc nghiệm
- **Bài tập lập trình** - Nộp và chấm bài tự động với test cases
- **Theo dõi tiến độ** - Thống kê và báo cáo chi tiết
- **Cloud-native** - Triển khai dễ dàng trên Google Cloud Platform

## Tính năng

### Vai trò người dùng

| Vai trò | Chức năng |
|---------|-----------|
| **Admin** | Quản lý toàn bộ hệ thống, người dùng, thống kê |
| **Giảng viên** | Tạo khóa học, bài quiz, bài tập lập trình |
| **Sinh viên** | Đăng ký khóa học, làm quiz, nộp bài lập trình |

### Công nghệ sử dụng

**Frontend:**
- React 18 + Vite 5
- TypeScript 5
- TailwindCSS 3
- Zustand (State Management)
- React Router v6
- React Hook Form + Zod
- Lucide React (Icons)

**Backend:**
- FastAPI 0.109
- Python 3.11+
- SQLAlchemy 2.0 (async)
- MySQL 8.0
- JWT Authentication
- Pydantic v2

**Cloud (GCP):**
- Cloud Run
- Cloud SQL
- Cloud Storage
- Cloud Build
- Docker

## Cấu trúc Project

```
CloudJudge-LMS/
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── api/          # API clients
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── stores/       # Zustand stores
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utilities
│   └── ...
│
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Config, DB, Security
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── repositories/ # Data access
│   └── ...
│
├── docker/              # Docker configurations
├── cloud/               # GCP configurations
├── docs/                # Documentation
└── .github/             # GitHub Actions workflows
```

## Bắt đầu

### Yêu cầu

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- MySQL 8.0 (hoặc dùng Docker)

### Cài đặt Local

1. **Clone repository:**
```bash
git clone https://github.com/yourusername/CloudJudge-LMS.git
cd CloudJudge-LMS
```

2. **Cài đặt Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

3. **Cài đặt Frontend:**
```bash
cd frontend
npm install
```

4. **Cấu hình Environment:**
```bash
cp .env.example .env
# Chỉnh sửa .env với các giá trị của bạn
```

5. **Chạy ứng dụng:**
```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Frontend (terminal khác)
cd frontend
npm run dev
```

### Sử dụng Docker

```bash
# Build và chạy tất cả services
docker-compose -f docker/docker-compose.yml up -d

# Xem logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

## Triển khai Cloud

### Google Cloud Platform

Xem [cloud/README.md](cloud/README.md) để biết chi tiết:

1. **Cloud SQL Setup** - Thiết lập MySQL
2. **Cloud Run** - Triển khai services
3. **Cloud Build** - CI/CD tự động
4. **Terraform** - Infrastructure as Code

### GitHub Actions

Workflow CI/CD đã được cấu hình sẵn tại `.github/workflows/ci-cd.yml`. Chỉ cần:

1. Thêm GitHub Secrets:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY`
   - `DATABASE_URL`
   - `SECRET_KEY`

2. Push lên branch `main` để trigger deploy

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

### Courses
- `GET /api/v1/courses` - Danh sách khóa học
- `POST /api/v1/courses` - Tạo khóa học
- `GET /api/v1/courses/{id}` - Chi tiết khóa học
- `POST /api/v1/courses/{id}/enroll` - Đăng ký khóa học

### Quizzes
- `POST /api/v1/quizzes` - Tạo quiz
- `POST /api/v1/quizzes/{id}/attempt` - Bắt đầu làm quiz
- `POST /api/v1/quizzes/{id}/submit` - Nộp quiz

### Problems
- `POST /api/v1/problems` - Tạo bài tập
- `POST /api/v1/problems/{id}/submit` - Nộp bài

## Phát triển

### Chạy Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

### Code Quality

```bash
# Backend
cd backend
black .
isort .
mypy app

# Frontend
cd frontend
npm run lint
```

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## License

Dự án này được phân phối dưới giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## Liên hệ

- Website: https://cloudjudge-lms.com
- Email: support@cloudjudge-lms.com

---

Made with ❤️ for education
