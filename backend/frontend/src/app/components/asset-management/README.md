# Asset Management Component

A production-grade Angular 20 component for managing IT assets with full CRUD operations, built with Tailwind CSS and TypeScript.

## 🚀 Features

### Core Functionality
- **Full CRUD Operations**: Create, Read, Update, Delete assets
- **Advanced Filtering**: Search by name, serial number, IT code, status, ownership, asset type
- **Responsive Design**: Desktop table view and mobile card layout
- **Bulk Operations**: Select and delete multiple assets
- **Real-time Validation**: Form validation with error messages
- **Performance Optimized**: Virtual scrolling, lazy loading, change detection strategies

### Smart Form Features
- **Auto-fill Logic**: 
  - Selecting Asset Model auto-fills Make and Type
  - Selecting PO Number auto-fills acquisition details
  - Selecting OS Version auto-fills OS Type
- **Dynamic Dropdowns**: Dependent dropdowns for models based on make, OS versions based on OS
- **Form Validation**: Required fields, format validation, number ranges

### UI/UX Features
- **Loading States**: Spinners and loading indicators
- **Error Handling**: Graceful error handling with user feedback
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Responsive**: Mobile-first design with breakpoint optimizations
- **Animations**: Smooth transitions and hover effects

## 📦 Tech Stack

- **Angular 20** with Signals and new control flow
- **RxJS** for reactive programming
- **Tailwind CSS** for styling
- **Angular Material** for UI components
- **TypeScript** for type safety
- **CDK Virtual Scrolling** for performance

## 🏗️ Architecture

### Component Structure
```
asset-management/
├── asset.component.ts      # Main component logic
├── asset.component.html    # Template with responsive design
├── asset.component.css     # Tailwind CSS styles
└── README.md              # This documentation
```

### Key Services
- `AssetService`: API communication and state management
- `ApiConfigService`: Centralized API configuration
- Related services: `UserService`, `VendorService`, etc.

### State Management
- **Signals**: Reactive state with Angular Signals
- **BehaviorSubjects**: For complex state management
- **Caching**: Dropdown data caching for performance

## 🎯 Usage

### Basic Usage
```typescript
// In your route configuration
{
  path: 'assets',
  loadComponent: () => import('./components/asset-management/asset.component').then(m => m.AssetComponent)
}
```

### Navigation
```html
<a routerLink="/assets">Asset Management</a>
```

## 🔧 Configuration

### Environment Setup
Ensure your backend API endpoints are configured in `ApiConfigService`:

```typescript
assets: {
  getAll: '/api/assets',
  getById: '/api/assets',
  create: '/api/assets',
  update: '/api/assets',
  delete: '/api/assets'
}
```

### Required Dependencies
```json
{
  "@angular/material": "^17.0.0",
  "@angular/cdk": "^17.0.0",
  "tailwindcss": "^3.0.0"
}
```

## 📊 Asset Table Fields

The component displays and manages the following asset fields:

### Basic Information
- **Name**: Asset name (required)
- **Serial Number**: Unique identifier (required)
- **IT Asset Code**: Internal tracking code
- **Asset Type**: Category of asset (required)
- **Make**: Manufacturer (required)
- **Model**: Specific model (required)

### Status & Ownership
- **Status**: Active, Inactive, Maintenance, Retired
- **Owner Type**: Celcom, Vendor
- **Acquisition Type**: Bought, Leased, Rented
- **Current User**: Assigned user

### Technical Details
- **MAC Address**: Network identifier
- **IP Address**: Network address
- **Operating System**: OS type
- **OS Version**: Specific OS version

### Financial Information
- **PO Number**: Purchase order reference
- **Acquisition Price**: Purchase cost
- **Current Price**: Current value
- **Depreciation %**: Depreciation percentage
- **Rental Amount**: Monthly rental cost

## 🎨 Styling & Theming

### Tailwind CSS Classes
The component uses utility-first CSS with Tailwind:

```css
/* Status badges */
.status-active { @apply bg-green-100 text-green-800; }
.status-inactive { @apply bg-red-100 text-red-800; }
.status-maintenance { @apply bg-yellow-100 text-yellow-800; }

/* Responsive design */
.desktop-table { @apply hidden lg:block; }
.mobile-view { @apply lg:hidden; }
```

### Customization
Override styles by modifying `asset.component.css` or extending Tailwind configuration.

## 🚀 Performance Optimizations

### Change Detection
- **OnPush Strategy**: Optimized change detection
- **Signals**: Reactive state management
- **TrackBy Functions**: Efficient list rendering

### Virtual Scrolling
```typescript
// Implemented for large datasets
readonly itemSize = 80; // Height of each row
```

### Caching
- Dropdown data caching
- API response caching
- Debounced search (300ms)

### Lazy Loading
- Component lazy loading
- Image lazy loading
- Progressive data loading

## 🔒 Security & Validation

### Form Validation
```typescript
// Required fields
name: ['', [Validators.required, Validators.minLength(2)]],
serialNumber: ['', [Validators.required, Validators.minLength(2)]],

// Format validation
ipv4Address: ['', Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$/)],

// Range validation
depreciationPct: [0, [Validators.min(0), Validators.max(100)]]
```

### Error Handling
- Network error handling
- Server error handling
- Validation error display
- Graceful degradation

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (Card layout)
- **Tablet**: 768px - 1024px (Responsive table)
- **Desktop**: > 1024px (Full table)

### Mobile Features
- Touch-friendly buttons
- Swipe gestures
- Optimized form layout
- Collapsible sections

## 🧪 Testing

### Unit Tests
```bash
ng test asset.component
```

### E2E Tests
```bash
ng e2e
```

### Test Coverage
- Component logic testing
- Service integration testing
- UI interaction testing
- Accessibility testing

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
ng serve

# Navigate to assets
http://localhost:4200/assets
```

### Building
```bash
# Production build
ng build --prod

# Analyze bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

## 🐛 Troubleshooting

### Common Issues

1. **Loading Issues**
   - Check backend API connectivity
   - Verify CORS configuration
   - Check network requests in DevTools

2. **Form Validation**
   - Ensure all required fields are filled
   - Check field format requirements
   - Verify dropdown dependencies

3. **Performance Issues**
   - Enable virtual scrolling for large datasets
   - Check for memory leaks
   - Optimize change detection

### Debug Mode
Enable debug logging:
```typescript
// In environment.ts
export const environment = {
  production: false,
  debug: true
};
```

## 📈 Future Enhancements

### Planned Features
- [ ] Export functionality (CSV, Excel)
- [ ] Advanced filtering with date ranges
- [ ] Asset history tracking
- [ ] Bulk import functionality
- [ ] Asset QR code generation
- [ ] Mobile app integration
- [ ] Real-time notifications
- [ ] Asset lifecycle management

### Performance Improvements
- [ ] Service Worker implementation
- [ ] Progressive Web App features
- [ ] Offline functionality
- [ ] Advanced caching strategies

## 🤝 Contributing

### Code Style
- Follow Angular style guide
- Use TypeScript strict mode
- Implement proper error handling
- Add comprehensive tests

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

## 📄 License

This component is part of the IT Asset Management System and follows the project's licensing terms.

## 📞 Support

For technical support or questions:
- Create an issue in the project repository
- Contact the development team
- Check the project documentation

---

**Built with ❤️ using Angular 20, Tailwind CSS, and TypeScript** 