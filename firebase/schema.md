# Primistine Electric CRM - Firestore Data Model

## Core Collections

### `users`
**Purpose**: System users and authentication profiles.
- `uid` (string): Firebase Auth UID
- `email` (string)
- `display_name` (string)
- `role` (string): 'admin' | 'manager' | 'sales' | 'engineer' | 'inventory' | 'finance'
- `phone` (string)
- `status` (string): 'active' | 'inactive'
- `created_at` (timestamp)

### `leads`
**Purpose**: Potential customers before qualification.
- `id` (string): Auto-ID
- `name` (string): Lead contact name
- `phone` (string)
- `email` (string)
- `source` (string): 'WhatsApp', 'Web Form', 'Referral'
- `status` (string): 'New', 'Contacted', 'Qualified', 'Lost', 'Converted'
- `service_interest` (string): 'Solar', 'Wiring', 'CCTV'
- `assigned_to` (string): UID of sales rep
- `notes` (string)
- `score` (number): 0-100
- `created_at` (timestamp)

### `clients`
**Purpose**: Converted customers (individuals or companies).
- `id` (string)
- `name` (string)
- `type` (string): 'Individual' | 'Corporate'
- `contact_person` (string)
- `email` (string)
- `phone_primary` (string)
- `phone_secondary` (string)
- `address` (map): { market_area, landmark, street, city }
- `tier` (string): 'Silver', 'Gold', 'Platinum'
- `created_at` (timestamp)

### `opportunities`
**Purpose**: Deals in the pipeline.
- `id` (string)
- `lead_id` (reference): Optional links back to lead
- `client_id` (reference): If client exists
- `stage` (string): 'Audit Scheduled', 'Audit Done', 'Quote Sent', 'Negotiation', 'Won', 'Lost'
- `estimated_value` (number)
- `probability` (number): 0-100
- `expected_close_date` (timestamp)
- `assigned_to` (string)
- `created_at` (timestamp)

### `audits`
**Purpose**: Site assessment technical data (PE-SOP-001 Compliant).
- `id` (string)
- `opportunity_id` (reference)
- `client_id` (reference)
- `engineer_id` (reference)
- `scheduled_date` (timestamp)
- `status` (string): 'Scheduled', 'In Progress', 'Completed', 'Report Generated'
- `site_data` (map):
    - `roof_type` (string): 'Concrete Slab', 'Metal Sheet', 'Asbestos', 'Tile'
    - `roof_pitch` (number): degrees
    - `shading_issues` (boolean)
    - `structural_integrity_score` (number): 1-5
    - `battery_location_img` (string): URL
    - `distribution_board_img` (string): URL
- `electrical_readings` (map):
    - `phase_l1_current` (number)
    - `phase_l2_current` (number)
    - `phase_l3_current` (number)
    - `leakage_current` (number)
    - `earth_resistance` (number): Ohms
    - `spd_required` (boolean)
- `risk_assessment` (map):
    - `wiring_health_score` (number): 0-100
    - `safety_risks` (array): List of identified risks
    - `recommendations` (array): List of upgrades needed
- `client_signature` (string): URL
- `created_at` (timestamp)

### `audit_load_items`
**Purpose**: Individual appliances logged during audit (One Audit -> Many Load Items).
- `id` (string)
- `audit_id` (reference): Parent Audit
- `item_name` (string)
- `quantity` (number)
- `wattage` (number)
- `hours_per_day` (number)
- `category` (string): 'Lighting', 'Cooling', 'Kitchen', 'Entertainment', 'Pumps'
- `is_heavy_inductive` (boolean): Flag for motors/pumps
- `total_daily_kwh` (number): Calculated (Qty * Watts * Hours / 1000)

### `quotes`
**Purpose**: Proposals sent to clients.
- `id` (string)
- `opportunity_id` (reference)
- `audit_id` (reference): Linked audit source
- `system_design` (map):
    - `total_load_kwh` (number)
    - `recommended_solar_kw` (number)
    - `recommended_battery_kwh` (number)
    - `inverter_rating_kva` (number)
- `items` (array of objects): [{ sku, desc, qty, rate, total }]
- `total_amount` (number)
- `status` (string): 'Draft', 'Sent', 'Accepted', 'Rejected'
- `valid_until` (timestamp)
- `pdf_url` (string)
- `version` (number)
- `created_at` (timestamp)

### `projects`
**Purpose**: Active jobs traversing the 8-phase lifecycle.
- `id` (string)
- `quote_id` (reference)
- `client_id` (reference)
- `name` (string): e.g., "Solar Install - Lekki Phase 1"
- `status` (string): 'Planning', 'Procurement', 'Site Prep', 'Installation', 'Testing', 'Handover', 'Warranty', 'Closed'
- `start_date` (timestamp)
- `expected_completion` (timestamp)
- `actual_completion` (timestamp)
- `lead_engineer_id` (reference)
- `crew_members` (array of references): IDs of all assigned engineers
- `progress_percent` (number): 0-100
- `phases` (map):
    - `planning_status` (string): 'Pending', 'Done'
    - `procurement_status` (string)
    - `installation_status` (string)
    - `testing_status` (string)
- `created_at` (timestamp)

### `work_orders`
**Purpose**: Detailed tasks for engineers (One Project -> Many Work Orders).
- `id` (string)
- `project_id` (reference)
- `assigned_to` (reference): User ID (Engineer)
- `title` (string): e.g., "Mount Roof Racking"
- `description` (string)
- `due_date` (timestamp)
- `status` (string): 'Open', 'In Progress', 'Blocked', 'Completed'
- `gps_coordinates` (geopoint): Required at completion
- `site_photos` (array of strings): URLs of mandatory photos
- `checklist_items` (array of maps):
    - `item` (string)
    - `is_checked` (boolean)
- `material_scans` (array of strings): Barcodes of installed items
- `created_at` (timestamp)

### `time_logs`
**Purpose**: Engineer clock-in/out tracking for payroll and job costing.
- `id` (string)
- `user_id` (reference): Engineer
- `project_id` (reference)
- `work_order_id` (reference): Optional
- `clock_in_time` (timestamp)
- `clock_out_time` (timestamp)
- `clock_in_location` (geopoint)
- `clock_out_location` (geopoint)
- `duration_hours` (number)
- `notes` (string)

### `material_dispatches`
**Purpose**: Inventory moving from warehouse to site.
- `id` (string)
- `project_id` (reference)
- `dispatched_by` (reference): Store manager
- `received_by` (reference): Driver or Lead Engineer
- `dispatch_date` (timestamp)
- `items` (array of maps):
    - `item_id` (reference): Inventory Item
    - `quantity` (number)
    - `status` (string): 'Dispatched', 'Received', 'Returned'
- `delivery_proof_img` (string): Signature or photo
- `created_at` (timestamp)

### `inventory_items`
**Purpose**: Product catalog and stock levels.
- `id` (string)
- `sku` (string)
- `name` (string)
- `category` (string)
- `unit_price` (number): Selling price
- `average_cost` (number): Moving average cost for valuation
- `stock_level` (number)
- `reorder_point` (number)
- `warehouse_location` (string)
- `preferred_supplier_id` (reference)

### `suppliers`
**Purpose**: Vendor database for procurement.
- `id` (string)
- `name` (string)
- `contact_person` (string)
- `email` (string)
- `phone` (string)
- `address` (string)
- `rating` (number): 1-5 stars
- `payment_terms` (string): 'Net 30', 'CIA', etc.
- `categories` (array): ['Solar Panels', 'Cables']
- `created_at` (timestamp)

### `stock_movements`
**Purpose**: Immutable ledger of inventory changes.
- `id` (string)
- `item_id` (reference)
- `type` (string): 'Receive', 'Issue', 'Return', 'Adjustment'
- `quantity` (number): Positive for add, negative for remove
- `reference_id` (string): PO ID, Work Order ID, or Project ID
- `project_id` (reference): Optional, for job costing
- `user_id` (reference): Who performed the action
- `timestamp` (timestamp)
- `current_balance_after` (number): Snapshot
- `notes` (string)

### `purchase_orders`
**Purpose**: Procurement orders sent to suppliers.
- `id` (string)
- `po_number` (string): Human readable (e.g., PO-2026-001)
- `supplier_id` (reference)
- `status` (string): 'Draft', 'Sent', 'Partial', 'Received', 'Cancelled'
- `items` (array of maps):
    - `item_id` (reference)
    - `quantity` (number)
    - `unit_price` (number)
    - `received_qty` (number)
- `total_amount` (number)
- `expected_delivery` (timestamp)
- `created_by` (reference)
- `created_at` (timestamp)

### `invoices`
**Purpose**: Billing and Revenue tracking.
- `id` (string)
- `invoive_number` (string): e.g., INV-2026-001
- `project_id` (reference)
- `client_id` (reference)
- `amount_total` (number)
- `amount_paid` (number)
- `balance_due` (number)
- `status` (string): 'Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Written Off'
- `due_date` (timestamp)
- `items` (array): Line items
- `pdf_url` (string)
- `created_at` (timestamp)

### `payments`
**Purpose**: Incoming funds (AR).
- `id` (string)
- `invoice_id` (reference)
- `client_id` (reference)
- `amount` (number)
- `method` (string): 'Bank Transfer', 'Cheque', 'Cash', 'Online'
- `transaction_reference` (string)
- `payment_date` (timestamp)
- `recorded_by` (reference)
- `proof_img` (string): Screenshot of transfer/check
- `created_at` (timestamp)

### `expenses`
**Purpose**: Operational costs (AP) & Reimbursements.
- `id` (string)
- `project_id` (reference): Optional (for COGS)
- `user_id` (reference): Who spent the money
- `category` (string): 'Fuel', 'Travel', 'Materials', 'Site Allowance', 'Office'
- `amount` (number)
- `description` (string)
- `receipt_img` (string): URL
- `status` (string): 'Pending Approval', 'Approved', 'Reimbursed', 'Rejected'
- `approved_by` (reference)
- `created_at` (timestamp)

### `daily_summaries`
**Purpose**: Historical KPI snapshots for trending charts.
- `id` (string): YYYY-MM-DD
- `date` (timestamp)
- `metrics` (map):
    - `total_active_projects` (number)
    - `new_leads_today` (number)
    - `new_audits_today` (number)
    - `revenue_collected_today` (number)
    - `open_work_orders` (number)
- `generated_at` (timestamp)

### `conversations`
**Purpose**: Unified Inbox threads (WhatsApp, SMS, Email).
- `id` (string)
- `client_id` (reference)
- `participants` (array of references)
- `platform` (string): 'WhatsApp', 'SMS', 'Email', 'Mixed'
- `last_message_preview` (string)
- `last_message_at` (timestamp)
- `status` (string): 'Open', 'Closed', 'Archived'
- `unread_count` (number)

### `messages`
**Purpose**: Individual messages within a conversation.
- `id` (string)
- `conversation_id` (reference)
- `sender_id` (reference): User or Client
- `content` (string)
- `attachments` (array of strings): URLs
- `timestamp` (timestamp)
- `status` (string): 'Sent', 'Delivered', 'Read'
- `channel` (string): 'WhatsApp', 'Email'

### `certifications`
**Purpose**: Engineer compliance tracking (COREN, Safety).
- `id` (string)
- `user_id` (reference)
- `name` (string): e.g., "COREN License"
- `issuing_body` (string)
- `expiry_date` (timestamp)
- `document_url` (string)
- `status` (string): 'Active', 'Expiring Soon', 'Expired'

### `leave_requests`
**Purpose**: Team availability header.
- `id` (string)
- `user_id` (reference)
- `type` (string): 'Annual', 'Sick', 'Casual'
- `start_date` (timestamp)
- `end_date` (timestamp)
- `reason` (string)
- `status` (string): 'Pending', 'Approved', 'Rejected'

### `change_orders`
**Purpose**: Formal changes to project scope.
- `id` (string)
- `project_id` (reference)
- `description` (string)
- `cost_impact` (number)
- `time_impact_days` (number)
- `reason` (string)
- `client_signature` (string)
- `manager_approval` (boolean)
- `status` (string): 'Draft', 'Client Review', 'Approved', 'Rejected'

### `project_issues`
**Purpose**: Blockers and risks logged by engineers.
- `id` (string)
- `project_id` (reference)
- `reporter_id` (reference)
- `severity` (string): 'Critical', 'High', 'Medium', 'Low'
- `category` (string): 'Material', 'Access', 'Technical', 'Client'
- `description` (string)
- `photos` (array of strings)
- `status` (string): 'Open', 'Investigating', 'Resolved'

### `support_tickets`
**Purpose**: Client-reported issues.
- `id` (string)
- `client_id` (reference)
- `subject` (string)
- `description` (string)
- `priority` (string)
- `assigned_to` (reference)
- `status` (string): 'New', 'In Progress', 'Waiting', 'Closed'
- `created_at` (timestamp)

---
**Note for AppSheet**: 
- Connect each collection as a Table.
- Use `id` as the Key.
- Ensure References (Ref) are configured to point to the correct table (e.g., `client_id` Ref `clients`).
