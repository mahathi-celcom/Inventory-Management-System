# Asset Management System - Angular Frontend

This is the Angular 20 frontend for the IT Asset Inventory Management System. It provides a modern, responsive dashboard for managing and monitoring organizational assets.

## Features

- **Asset Summary Dashboard**: Overview of total, active, broken, and assigned assets
- **Asset Management**: View, search, filter, and manage assets
- **Responsive Design**: Built with Tailwind CSS for mobile-first responsive design
- **Real-time Filtering**: Search and filter assets by name, serial number, status, and ownership
- **Bulk Operations**: Select multiple assets for bulk operations
- **Pagination**: Efficient pagination for large asset lists

## Technology Stack

- **Angular 20**: Latest Angular framework with standalone components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **TypeScript**: Type-safe development
- **RxJS**: Reactive programming for handling async operations

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:4200`

## Configuration

The frontend is configured to connect to the Spring Boot backend at `http://localhost:8080`. The application includes mock data for testing when the backend is not available.

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode
- `npm test` - Run unit tests 