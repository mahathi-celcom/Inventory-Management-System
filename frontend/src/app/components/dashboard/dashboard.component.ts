import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Chart.js imports
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Shared Layout Components
import { LayoutComponent, NavigationItem } from '../shared/layout/layout.component';
import { LayoutService } from '../../services/layout.service';

// Services
import { AnalyticsService, AssetStatusSummary, OSTypeSummary, DepartmentTypeSummary, 
         WarrantySummary, AssetAgingSummary, AssetDetail, AnalyticsFilters } from '../../services/analytics.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BaseChartDirective,
    LayoutComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Services
  private router = inject(Router);
  private layoutService = inject(LayoutService);
  private analyticsService = inject(AnalyticsService);
  private sanitizer = inject(DomSanitizer);

  // Navigation
  navigationItems: NavigationItem[] = [];

  // Loading states
  isLoading = signal(true);
  isExporting = signal(false);
  
  // 🔧 Issue 2 Fix: Prevent multiple API calls
  private dataLoaded = false;

  // Data signals
  assetStatusData = signal<AssetStatusSummary[]>([]);
  osTypeData = signal<OSTypeSummary[]>([]);
  departmentTypeData = signal<DepartmentTypeSummary[]>([]);
  warrantyData = signal<WarrantySummary[]>([]);
  agingData = signal<AssetAgingSummary[]>([]);
  detailedAssets = signal<AssetDetail[]>([]);

  // Filter states
  selectedDepartment = signal<string>('');
  selectedAssetType = signal<string>('');
  selectedAgeRange = signal<string>('');

  // Available filter options
  departments = signal<string[]>([]);
  assetTypes = signal<string[]>([]);
  ageRanges = signal<string[]>([]);

  // Error handling
  errorMessage = signal<string>('');

  // 🔧 Issue 1 Fix: Safe HTML handling
  trustedHtmlContent = signal<SafeHtml | null>(null);

  // HTML sanitization for backend HTML content
  trustedHtml = signal<SafeHtml | null>(null);

  // Chart configurations
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = ((value / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Compact chart options for optimized layout
  compactPieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = ((value / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  compactDoughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 8,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Categories'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Count'
        },
        beginAtZero: true
      }
    }
  };

  // Chart data computed properties
  statusChartData = computed<ChartData<'pie'>>(() => {
    const rawData = this.assetStatusData();
    
    // 🚫 Fix: Deduplicate status entries to prevent duplicate labels
    const statusMap = new Map<string, number>();
    rawData.forEach(item => {
      const existingCount = statusMap.get(item.status) || 0;
      statusMap.set(item.status, existingCount + item.count);
    });
    
    const labels = Array.from(statusMap.keys());
    const data = Array.from(statusMap.values());
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#f093fb',
          '#f5576c',
          '#4facfe',
          '#00f2fe'
        ]
      }]
    };
  });

  osChartData = computed<ChartData<'doughnut'>>(() => {
    const data = this.osTypeData();
    return {
      labels: data.map(item => item.osType),
      datasets: [{
        data: data.map(item => item.count),
        backgroundColor: [
          '#667eea',
          '#764ba2',
          '#f093fb',
          '#f5576c',
          '#4facfe',
          '#00f2fe',
          '#43e97b',
          '#38f9d7'
        ]
      }]
    };
  });

  warrantyChartData = computed<ChartData<'bar'>>(() => {
    const data = this.warrantyData();
    return {
      labels: data.map(item => item.assetType),
      datasets: [
        {
          label: 'In Warranty',
          data: data.map(item => item.inWarranty),
          backgroundColor: '#4ade80'
        },
        {
          label: 'Out of Warranty',
          data: data.map(item => item.outOfWarranty),
          backgroundColor: '#f87171'
        }
      ]
    };
  });

  agingChartData = computed<ChartData<'bar'>>(() => {
    const data = this.agingData();
    return {
      labels: data.map(item => item.ageRange),
      datasets: [{
        label: 'Asset Count',
        data: data.map(item => item.count),
        backgroundColor: '#667eea'
      }]
    };
  });

  // Department-type matrix computed property
  departmentTypeMatrix = computed(() => {
    const data = this.departmentTypeData();
    const departments = [...new Set(data.map(item => item.department))];
    const assetTypes = [...new Set(data.map(item => item.assetType))];
    
    const matrix = departments.map(dept => {
      const row: any = { department: dept };
      assetTypes.forEach(type => {
        const item = data.find(d => d.department === dept && d.assetType === type);
        row[type] = item ? item.count : 0;
      });
      return row;
    });

    return { matrix, assetTypes, departments };
  });

  // Current filters computed property
  currentFilters = computed<AnalyticsFilters>(() => ({
    department: this.selectedDepartment() || undefined,
    assetType: this.selectedAssetType() || undefined,
    ageRange: this.selectedAgeRange() || undefined
  }));

  ngOnInit(): void {
    // 🔧 Issue 2 Fix: Only load data once on component initialization
    if (!this.dataLoaded) {
    this.loadDashboardData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    // 🔧 Issue 2 Fix: Prevent duplicate API calls
    if (this.dataLoaded && !this.isLoading()) {
      console.log('📊 Dashboard data already loaded, skipping API calls');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    console.log('📡 Loading dashboard data via forkJoin...');

    // 🔧 Issue 2 Fix: Use forkJoin to call all analytics APIs together (single batch)
    forkJoin({
      statusSummary: this.analyticsService.getAssetStatusSummary().pipe(
        catchError(err => {
          console.error('Error loading status summary:', err);
          return of([]);
        })
      ),
      osSummary: this.analyticsService.getOSTypeSummary().pipe(
        catchError(err => {
          console.error('Error loading OS summary:', err);
          return of([]);
        })
      ),
      departmentTypeSummary: this.analyticsService.getDepartmentTypeSummary().pipe(
        catchError(err => {
          console.error('Error loading department-type summary:', err);
          return of([]);
        })
      ),
      warrantySummary: this.analyticsService.getWarrantySummary().pipe(
        catchError(err => {
          console.error('Error loading warranty summary:', err);
          return of([]);
        })
      ),
      agingSummary: this.analyticsService.getAssetAgingSummary().pipe(
        catchError(err => {
          console.error('Error loading aging summary:', err);
          return of([]);
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        console.log('📊 Analytics API Response received:', data);
        
        // Handle different backend response formats
        this.processAnalyticsData(data);
        
        // Extract filter options safely
        this.extractFilterOptions(data);
        
        this.isLoading.set(false);
        this.dataLoaded = true; // Mark as loaded to prevent future duplicate calls
        console.log('✅ Dashboard data loaded successfully');
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
        this.errorMessage.set('Failed to load dashboard data. Please check your backend connection and try again.');
        this.isLoading.set(false);
      }
    });
  }

  private processAnalyticsData(data: any): void {
    // 🔧 Issue 3 Fix: Handle both arrays and objects from backend
    
    // Status Summary - convert object to array if needed
    if (Array.isArray(data.statusSummary)) {
      this.assetStatusData.set(data.statusSummary);
    } else if (data.statusSummary && typeof data.statusSummary === 'object') {
      // Convert object like {active: 10, retired: 5} to array format
      const statusArray = Object.entries(data.statusSummary).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: count as number,
        percentage: 0 // Will be calculated if needed
      }));
      this.assetStatusData.set(statusArray);
    } else {
      this.assetStatusData.set([]);
    }

    // OS Summary - convert object to array if needed
    if (Array.isArray(data.osSummary)) {
      this.osTypeData.set(data.osSummary);
    } else if (data.osSummary && typeof data.osSummary === 'object') {
      const osArray = Object.entries(data.osSummary).map(([osType, count]) => ({
        osType,
        count: count as number,
        percentage: 0
      }));
      this.osTypeData.set(osArray);
    } else {
      this.osTypeData.set([]);
    }

    // Department Type Summary - handle nested objects
    if (Array.isArray(data.departmentTypeSummary)) {
      this.departmentTypeData.set(data.departmentTypeSummary);
    } else if (data.departmentTypeSummary && typeof data.departmentTypeSummary === 'object') {
      // Convert nested object to flat array
      const deptArray: any[] = [];
      Object.entries(data.departmentTypeSummary).forEach(([department, types]) => {
        if (types && typeof types === 'object') {
          Object.entries(types as any).forEach(([assetType, count]) => {
            deptArray.push({
              department,
              assetType,
              count: count as number
            });
          });
        }
      });
      this.departmentTypeData.set(deptArray);
    } else {
      this.departmentTypeData.set([]);
    }

    // Warranty Summary - convert object to array if needed
    if (Array.isArray(data.warrantySummary)) {
      this.warrantyData.set(data.warrantySummary);
    } else if (data.warrantySummary && typeof data.warrantySummary === 'object') {
      const warrantyArray = Object.entries(data.warrantySummary).map(([assetType, summary]) => {
        const summaryObj = summary as any;
        return {
          assetType,
          inWarranty: summaryObj.inWarranty || 0,
          outOfWarranty: summaryObj.outOfWarranty || 0,
          totalAssets: (summaryObj.inWarranty || 0) + (summaryObj.outOfWarranty || 0),
          warrantyPercentage: 0
        };
      });
      this.warrantyData.set(warrantyArray);
    } else {
      this.warrantyData.set([]);
    }

    // Aging Summary - convert object to array if needed
    if (Array.isArray(data.agingSummary)) {
      this.agingData.set(data.agingSummary);
    } else if (data.agingSummary && typeof data.agingSummary === 'object') {
      const agingArray = Object.entries(data.agingSummary).map(([ageRange, count]) => ({
        ageRange,
        count: count as number,
        percentage: 0
      }));
      this.agingData.set(agingArray);
    } else {
      this.agingData.set([]);
    }
  }

  private extractFilterOptions(data: any): void {
    try {
      // Safely extract unique departments
      const departmentTypeSummary = Array.isArray(data.departmentTypeSummary) 
        ? data.departmentTypeSummary 
        : [];
      const departments = [...new Set(departmentTypeSummary.map((item: DepartmentTypeSummary) => item.department))];
      this.departments.set(departments as string[]);

      // Safely extract unique asset types
      const warrantySummary = Array.isArray(data.warrantySummary) 
        ? data.warrantySummary 
        : [];
      const assetTypes = [...new Set([
        ...departmentTypeSummary.map((item: DepartmentTypeSummary) => item.assetType),
        ...warrantySummary.map((item: WarrantySummary) => item.assetType)
      ])];
      this.assetTypes.set(assetTypes as string[]);

      // Safely extract age ranges
      const agingSummary = Array.isArray(data.agingSummary) 
        ? data.agingSummary 
        : [];
      const ageRanges = agingSummary.map((item: AssetAgingSummary) => item.ageRange);
      this.ageRanges.set(ageRanges as string[]);
    } catch (error) {
      console.error('Error extracting filter options:', error);
      // Set empty arrays as fallback
      this.departments.set([]);
      this.assetTypes.set([]);
      this.ageRanges.set([]);
    }
  }

  // 🔧 Issue 1 Fix: Safely handle HTML content from backend
  private sanitizeHtmlContent(htmlContent: string): SafeHtml {
    // Only use this for trusted backend HTML content
    return this.sanitizer.bypassSecurityTrustHtml(htmlContent);
  }

  // Method to process backend HTML snippets safely
  processBackendHtml(apiResponse: any): void {
    if (apiResponse.htmlSnippet && typeof apiResponse.htmlSnippet === 'string') {
      const trustedHtml = this.sanitizeHtmlContent(apiResponse.htmlSnippet);
      this.trustedHtmlContent.set(trustedHtml);
    }
  }

  onFiltersChange(): void {
    // Reload aging data with filters
    this.loadAgingData();
  }

  onAgeRangeClick(ageRange: string): void {
    this.selectedAgeRange.set(ageRange);
    this.loadDetailedAssets(ageRange);
  }

  private loadAgingData(): void {
    const filters = this.currentFilters();
    this.analyticsService.getAssetAgingSummary(filters).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Error loading filtered aging data:', err);
        return of([]);
      })
    ).subscribe(data => {
      this.agingData.set(data);
    });
  }

  private loadDetailedAssets(ageRange: string): void {
    const filters = this.currentFilters();
    this.analyticsService.getAssetsByAgeRange(ageRange, filters).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Error loading detailed assets:', err);
        return of([]);
      })
    ).subscribe(data => {
      this.detailedAssets.set(data);
    });
  }

  exportFilteredCSV(): void {
    this.isExporting.set(true);
    const filters = this.currentFilters();
    const filename = this.analyticsService.generateCSVFilename('filtered_assets');

    this.analyticsService.exportToCSV(filters).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Error exporting CSV:', err);
        this.errorMessage.set('Failed to export CSV. Please try again.');
        return of(new Blob());
      })
    ).subscribe(blob => {
      if (blob.size > 0) {
        this.analyticsService.downloadCSV(blob, filename);
      }
      this.isExporting.set(false);
    });
  }

  exportFullCSV(): void {
    this.isExporting.set(true);
    const filename = this.analyticsService.generateCSVFilename('all_assets');

    this.analyticsService.exportFullCSV().pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Error exporting full CSV:', err);
        this.errorMessage.set('Failed to export CSV. Please try again.');
        return of(new Blob());
      })
    ).subscribe(blob => {
      if (blob.size > 0) {
        this.analyticsService.downloadCSV(blob, filename);
      }
      this.isExporting.set(false);
    });
  }

  clearFilters(): void {
    this.selectedDepartment.set('');
    this.selectedAssetType.set('');
    this.selectedAgeRange.set('');
    this.detailedAssets.set([]);
    this.loadAgingData();
  }

  refreshData(): void {
    // 🔧 Issue 2 Fix: Allow manual refresh by resetting the loaded flag
    this.dataLoaded = false;
    this.loadDashboardData();
  }

  onNavigationClick(item: NavigationItem): void {
    this.router.navigate([item.route]);
  }

  navigateToAssets(): void {
    this.router.navigate(['/assets']);
  }

  navigateToAssetModels(): void {
    this.router.navigate(['/asset-models']);
  }

  navigateToAssetPOs(): void {
    this.router.navigate(['/asset-pos']);
  }

  navigateToVendors(): void {
    this.router.navigate(['/vendors']);
  }

  navigateToOSVersions(): void {
    this.router.navigate(['/os-versions']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/users']);
  }

  // 🛡️ Warranty Report Methods
  downloadWarrantyReport(): void {
    this.isExporting.set(true);
    const filename = this.analyticsService.generateCSVFilename('warranty_report');

    this.analyticsService.exportToCSV().pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Error downloading warranty report:', err);
        this.errorMessage.set('Failed to download warranty report. Please try again.');
        return of(new Blob());
      })
    ).subscribe(blob => {
      if (blob.size > 0) {
        this.analyticsService.downloadCSV(blob, filename);
      }
      this.isExporting.set(false);
    });
  }

  viewDetailedWarrantyReport(): void {
    // Navigate to detailed warranty report or open modal
    this.router.navigate(['/warranty-report']);
  }

  // 🏢 Department Filter Methods
  onDepartmentFilterChange(): void {
    console.log('Department filter changed:', this.selectedDepartment());
    // Reload data with department filter
    this.loadDepartmentFilteredData();
  }

  private loadDepartmentFilteredData(): void {
    const department = this.selectedDepartment();
    if (department) {
      // Call backend API with department filter
      // GET /department/{department}
      console.log(`Loading data for department: ${department}`);
      // TODO: Implement API call when backend is ready
    } else {
      // Load all departments data
      this.loadDashboardData();
    }
  }

  // 🎨 UI Helper Methods for Asset Distribution Table
  getCellColorClass(count: number): string {
    if (count === 0) {
      return 'bg-red-100 text-red-800'; // Red for 0 (like your sample)
    } else if (count <= 10) {
      return 'bg-celcom-success-light text-celcom-success';
    } else if (count <= 30) {
      return 'bg-celcom-warning-light text-celcom-warning';
    } else {
      return 'bg-celcom-primary-light text-celcom-primary';
    }
  }

  getRowTotal(row: any, assetTypes: string[]): number {
    return assetTypes.reduce((total, type) => total + (row[type] || 0), 0);
  }

  getColumnTotal(assetType: string): number {
    const matrix = this.departmentTypeMatrix().matrix;
    return matrix.reduce((total, row) => total + (row[assetType] || 0), 0);
  }

  getGrandTotal(): number {
    const matrix = this.departmentTypeMatrix().matrix;
    const assetTypes = this.departmentTypeMatrix().assetTypes;
    return matrix.reduce((grandTotal, row) => {
      const rowTotal = assetTypes.reduce((total, type) => total + (row[type] || 0), 0);
      return grandTotal + rowTotal;
    }, 0);
  }
} 