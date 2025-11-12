# NeoLoad Performance Dashboard

A comprehensive set of React dashboards for monitoring and analyzing NeoLoad test performance across your organization.

## 📊 Dashboard Overview

This project consists of two specialized dashboards designed for different use cases:

### 1. **Big Screen Dashboard** (`/dashboard`)
A real-time performance monitoring display optimized for large screens and TV displays.

**Purpose:** Continuous monitoring in team areas, war rooms, or office displays

**Key Features:**
- Large, easy-to-read KPI cards
- Real-time data updates (every 5 minutes)
- Gradient visualizations with modern design
- No scrolling required - everything visible at once
- Live status indicator with last update timestamp
- Configurable time range via URL parameter

**Best For:**
- Team monitoring displays
- Performance dashboards in common areas
- Real-time status at a glance

### 2. **Management Dashboard** (`/management`)
A detailed analysis and reporting tool for management and stakeholders.

**Purpose:** In-depth analysis, reporting, and decision-making

**Key Features:**
- Comprehensive status categorization (Excellent, Good, Needs Attention, Critical)
- Workspace health overview with visual indicators
- Status distribution pie chart
- Detailed performance tables
- CSV export functionality
- Date range filtering
- Workspace exclusion filters
- Complete test breakdowns

**Best For:**
- Management reviews
- Performance reports
- Detailed analysis
- Data export for presentations

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- React 17+
- Access to NeoLoad test statistics API

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm start
```

## 🔧 Configuration

### API Endpoint

Update the API base URL in each dashboard component:

```javascript
const API_BASE_URL = "https://your-neoload-api-endpoint/test-statistics";
```

### Time Range Configuration

**Big Screen Dashboard:**
Set the time range using URL parameters:

```
/dashboard?days=7   # Show last 7 days
/dashboard?days=30  # Show last 30 days (default)
/dashboard?days=90  # Show last 90 days
```

**Management Dashboard:**
Use the date picker controls in the UI to set custom start and end dates.

## 📈 Understanding the Metrics

### Status Categories

| Status | Pass Rate | Indicator | Action Required |
|--------|-----------|-----------|-----------------|
| **Excellent** | ≥90% | ✓ Green | Continue current practices |
| **Good** | 70-89% | ◐ Blue | Monitor for improvement |
| **Needs Attention** | 50-69% | ⚠ Yellow | Investigate issues |
| **Critical** | <50% | ✗ Red | Immediate action needed |

### Key Performance Indicators (KPIs)

- **Total Runs**: Total number of test executions
- **Passed**: Number of successful test runs
- **Failed**: Number of failed test runs
- **Pass Rate**: Percentage of successful tests (Passed / Total Runs × 100)

## 🎨 Features in Detail

### Big Screen Dashboard

#### Visual Design
- Modern gradient background
- Professional color scheme
- Hover animations and transitions
- Status-based color coding
- Clean typography optimized for distance viewing

#### Auto-Refresh
- Data refreshes automatically every 5 minutes
- Live pulse indicator shows active monitoring
- Last update timestamp displayed

#### Responsive Layout
- Optimized for 1920×1080 displays
- Scales to fit various screen sizes
- No scrolling required

### Management Dashboard

#### Filtering & Exclusion
```javascript
// Exclude specific workspaces from analysis
1. Select workspaces from the multi-select dropdown
2. Click "Apply Filter"
3. Data recalculates without excluded workspaces
```

#### Data Export
- Click "Export CSV" to download workspace performance data
- Includes: Workspace name, total runs, passed, failed, pass rate, status
- Ready for Excel or reporting tools

#### Date Range Filtering
- Select custom start and end dates
- Click "Apply" to fetch data for specific time period
- Useful for sprint reviews or monthly reports

## 🛠️ Customization

### Colors

Update status colors in the component:

```javascript
const getStatusColor = (status) => {
  switch(status) {
    case 'excellent': return '#10b981'; // Green
    case 'good': return '#3b82f6';      // Blue
    case 'attention': return '#f59e0b'; // Yellow
    case 'critical': return '#ef4444';  // Red
  }
};
```

### Thresholds

Modify status thresholds:

```javascript
let status = 'critical';
if (parseFloat(passRate) >= 90) status = 'excellent';
else if (parseFloat(passRate) >= 70) status = 'good';
else if (parseFloat(passRate) >= 50) status = 'attention';
```

### Refresh Interval

Change auto-refresh timing:

```javascript
// Default: 5 minutes (300000ms)
const interval = setInterval(fetchData, 5 * 60 * 1000);

// Change to 10 minutes:
const interval = setInterval(fetchData, 10 * 60 * 1000);
```

### For Big Screen Display
1. Use a dedicated device/browser for 24/7 display
2. Disable browser sleep/screensaver
3. Set to full-screen mode (F11)
4. Use 30-day view for long-term trends
5. Position in high-visibility area

### For Management Dashboard
1. Export data regularly for historical records
2. Review status trends weekly
3. Set up alerts for critical workspaces
4. Use date ranges for sprint/release analysis
5. Filter out inactive workspaces for cleaner reports
