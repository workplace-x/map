# 🎯 Sales Goals & Thresholds Management

A comprehensive system for managing annual sales targets, margin thresholds, and approval workflows for teams and individual salespeople.

## 📋 **Features**

### **Member Targets**
- ✅ Set individual sales targets for team members
- ✅ Design and PM allocation tracking
- ✅ Year-based filtering and management
- ✅ Integration with existing team/user management
- ✅ ERP salesperson mapping display

### **Team Targets**
- ✅ Set team-level sales goals
- ✅ Shared allocation management
- ✅ Member count tracking
- ✅ Super team support (placeholder for future)

### **Margin Thresholds**
- ✅ Define approval requirements by margin type
- ✅ Vendor, customer, service, overall, and order minimum thresholds
- ✅ Multi-level approval workflows (Manager/Director/VP)
- ✅ Active/inactive threshold management

### **Integration Points**
- 🔗 **Margin Analysis Tool**: Uses thresholds for approval workflow validation
- 🔗 **Team Management**: Leverages existing team structure and member mappings
- 🔗 **User Management**: Utilizes ERP salesperson ID mappings

## 🏗️ **Architecture**

### **Frontend Structure**
```
goals-management/
├── types.ts                    # TypeScript interfaces
├── services.ts                 # API service layer
├── hooks.ts                    # Custom React hooks
├── components/
│   └── GoalsManagementTable.tsx # Main UI component
├── goals-management.tsx        # Page wrapper
└── README.md                   # Documentation
```

### **Backend API Endpoints**
```
/api/member-targets             # CRUD for individual targets
/api/team-targets              # CRUD for team targets  
/api/margin-thresholds         # CRUD for margin thresholds
```

### **Database Tables**
- `member_targets` - Individual sales targets (existing)
- `team_targets` - Team sales targets (existing) 
- `margin_thresholds` - Margin approval thresholds (new)

## 🚀 **Getting Started**

### **1. Access the Goals Management Page**
Navigate to: `/settings/goals-management`

### **2. Set Member Targets**
1. Click **"Member Targets"** tab
2. Click **"Add Member Target"** button
3. Select member, team, year, and set targets
4. Targets are editable inline in the grid

### **3. Configure Team Targets**
1. Click **"Team Targets"** tab  
2. Click **"Add Team Target"** button
3. Select team, year, and set shared goals
4. Edit targets directly in the grid

### **4. Define Margin Thresholds**
1. Click **"Margin Thresholds"** tab
2. Click **"Add Threshold"** button
3. Set threshold type, percentage, approval level
4. Toggle active/inactive as needed

## 📊 **Margin Analysis Integration**

The Goals Management system directly integrates with the Margin Analysis tool:

### **Threshold Validation**
When a salesperson uses the Margin Analysis tool:

1. **Order Analysis**: System checks order margins against defined thresholds
2. **Threshold Comparison**: Compares vendor, customer, service, and overall margins
3. **Approval Requirements**: Flags orders below thresholds for manager approval
4. **Workflow Routing**: Routes to appropriate approval level (Manager/Director/VP)

### **Target Tracking**
- Individual and team sales targets are referenced during margin analysis
- Progress toward goals can be tracked against actual order performance
- Approval decisions can consider target achievement status

## 🔧 **Technical Implementation**

### **Key Components**

#### **GoalsManagementTable.tsx**
- Main UI component using AG Grid Enterprise
- Tabbed interface for different data types
- Inline editing with real-time API updates
- Year-based filtering

#### **Custom Hooks**
- `useMemberTargets()` - Member target state management
- `useTeamTargets()` - Team target state management  
- `useMarginThresholds()` - Threshold state management
- `useReferenceData()` - Teams and users lookup

#### **Service Layer**
- `GoalsManagementService` - Centralized API communication
- Error handling and toast notifications
- Type-safe request/response handling

### **Database Schema**

#### **margin_thresholds**
```sql
CREATE TABLE margin_thresholds (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('vendor', 'customer', 'service', 'overall', 'order_minimum')),
    threshold_percentage DECIMAL(5,2) NOT NULL,
    threshold_amount DECIMAL(19,4),
    requires_approval BOOLEAN DEFAULT true,
    approval_level TEXT CHECK (approval_level IN ('manager', 'director', 'vp')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎛️ **Configuration**

### **Environment Variables**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_AG_GRID_LICENSE_KEY=your_ag_grid_license
```

### **Default Thresholds**
The system comes with pre-configured thresholds:
- **Vendor Margin**: 15% (Manager approval)
- **Customer Margin**: 20% (Manager approval)  
- **Service Margin**: 25% (Director approval)
- **Overall Order**: 18% (Manager approval)
- **Large Order**: 10% (Director approval)

## 🔮 **Future Enhancements**

### **Phase 2: Super Teams**
- Create combined teams with shared goals
- Multi-team collaboration tracking
- Consolidated reporting

### **Phase 3: Advanced Analytics**
- Goal achievement tracking and reporting
- Trend analysis and forecasting
- Performance dashboards

### **Phase 4: Automated Workflows**
- Real-time approval notifications
- Escalation rules and timeouts
- Integration with CRM systems

## 🤝 **Integration with Margin Analysis**

This Goals Management system sets the foundation for sophisticated margin validation in your quote-to-order process:

1. **Salesperson creates quote in ERP**
2. **Visits Margin Analysis tool to validate margins**  
3. **System applies Goals Management thresholds**
4. **Triggers approval workflow if needed**
5. **Manager/Director reviews and approves/rejects**
6. **Salesperson can proceed with quote**

The system ensures compliance with your margin policies while providing flexibility for exceptional situations through the approval process.

## 📞 **Support**

For questions or issues with the Goals Management system:
1. Check this documentation first
2. Review the existing Team Management and User Management pages for context
3. Test with the Margin Analysis tool integration
4. Contact your system administrator for database/API issues 