# Cloud SQL (MySQL) Configuration
# Follow these steps to set up Cloud SQL on GCP:

## 1. Create Cloud SQL Instance
```bash
gcloud sql instances create cloudjudge-db \
    --database-version=MYSQL_8_0 \
    --region=asia-southeast1 \
    --tier=db-n1-standard-2 \
    --storage-size=20GB \
    --storage-auto-increase
```

## 2. Create Database
```bash
gcloud sql databases create cloudjudge --instance=cloudjudge-db
```

## 3. Create User
```bash
gcloud sql users create cloudjudge \
    --instance=cloudjudge-db \
    --password=your-secure-password
```

## 4. Get Connection Name
```bash
gcloud sql instances describe cloudjudge-db --format="value(connectionName)"
```

## 5. Configure Private IP (Recommended)
```bash
gcloud sql instances patch cloudjudge-db \
    --network=projects/my-project/global/networks/default \
    --no-assign-ip
```

## Environment Variables for Cloud Run
```
DATABASE_URL=mysql+aiomysql://cloudjudge:password@/cloudjudge?unix_socket=/cloudsql/project:region:cloudjudge-db
```
