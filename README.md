# File Management Microservice

A NestJS-based microservice for handling file uploads, downloads, and data processing with audit logging and access control.

## Features

- File upload and download for CSV and Excel files
- Data processing and validation
- Audit logging for all operations
- JWT-based authentication and authorization
- Environment-based access control
- MongoDB for data storage
- MinIO for file storage

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- MongoDB
- MinIO

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd file-management-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=development
MONGODB_URI=mongodb://mongodb:27017/file-management
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=files
JWT_SECRET=your-secret-key
```

4. Start the services using Docker Compose:
```bash
docker-compose up -d
```

5. The application will be available at `http://localhost:3000`
- API documentation: `http://localhost:3000/api`
- MinIO console: `http://localhost:9001`

## API Endpoints

### File Upload
- **POST** `/files/upload`
  - Upload a CSV or Excel file with metadata
  - Requires JWT token in production

### File Download
- **GET** `/files/:fileId/download`
  - Download a file by ID
  - Requires JWT token in production

### File Processing
- **POST** `/files/:fileId/process`
  - Process an uploaded file
  - Requires JWT token in production

### Get Processed Data
- **GET** `/files/:fileId/data`
  - Get processed data with pagination
  - Requires JWT token in production

### Update Field
- **PATCH** `/files/:fileId/record/:recordId/field/:fieldName`
  - Update a specific field in a record
  - Requires JWT token in production

## Development

1. Start the development server:
```bash
npm run start:dev
```

2. Run tests:
```bash
npm test
```

3. Lint the code:
```bash
npm run lint
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start:prod
```

## Security

- JWT-based authentication is required in production
- Access control based on user and client context
- Audit logging for all operations
- Environment-based security rules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.