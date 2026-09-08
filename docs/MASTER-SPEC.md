# On A Roll Catering
## Claude Code Master Build Specification
### Premium B2B Website + Internal CRM / Operations Platform

**Core principle:** The dashboard is the CRM and business operating system. Do **not** integrate or depend on an external CRM platform. The objective is for On A Roll Catering to manage the full commercial lifecycle inside this application.

---

## 1. Product Overview

Build a production-quality web platform for **On A Roll Catering**, a British B2B commercial catering and kitchen-solutions company.

The product has two connected parts:

1. A premium, conversion-focused public website at `onarollcatering.com`
2. A secure internal CRM and operations platform at `onarollcatering.com/dashboard`

There will later also be a simplified workforce portal at:

`onarollcatering.com/staff`

The public website must generate qualified commercial leads.

The dashboard must become the company's internal CRM and operational system for clients, leads, projects, quotations, invoices, staffing, rota management, timesheets, payroll preparation, suppliers, costs, documents and reporting.

Do **not** treat this as a brochure site with an admin panel bolted onto it.

Do **not** use HubSpot, Salesforce, Zoho, Pipedrive or any other external CRM. The CRM functionality must be native to this application.

Architect the system properly from day one.

---

## 2. Core Business Positioning

On A Roll Catering is not simply a food caterer.

It provides integrated commercial catering and kitchen solutions for businesses, construction projects, corporate environments and large-scale organisations.

Services include or may include:

- commercial contract catering
- workforce catering
- construction-site catering
- temporary catering facilities
- modular kitchens
- Portacabin kitchen conversions
- commercial kitchen design
- kitchen fit-out
- equipment specification
- installation
- commissioning
- commercial catering staffing
- project mobilisation
- ongoing kitchen operations
- bespoke catering and kitchen projects

The business has worked with substantial companies, including organisations such as Pfizer.

Do not imply endorsement by or display client logos until explicitly approved by the business owner.

The website should immediately make the company look capable of managing **large commercial contracts**, not like a sandwich shop, café, restaurant or event-catering template.

---

## 3. Technical Stack

Use:

- Next.js latest stable App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui where useful
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel
- Resend
- React Hook Form
- Zod
- Recharts
- Lucide icons
- date-fns

Use current stable compatible package versions.

Do not introduce dependencies without a good reason.

Use server components by default.

Use client components only where interactivity genuinely requires them.

Use Next.js server actions or secure route handlers for mutations where appropriate.

Do not expose service-role credentials to the browser.

---

## 4. Repository Philosophy

This is one application and one repository.

Architecture should support:

- `/` — public marketing site
- `/dashboard` — management application
- `/staff` — future employee portal

Use route groups where sensible.

Example:

```text
app/
  (marketing)/
  (auth)/
  dashboard/
  staff/
  api/
```

Do not create separate apps unnecessarily.

---

## 5. Multi-Tenancy Architecture

Although On A Roll Catering is initially the only customer, design the database with a proper tenant boundary from day one.

Nearly every business record must have:

`organisation_id`

Create:

- `organisations`
- `organisation_members`

This allows the platform architecture to potentially be reused later.

Never rely on a hard-coded single organisation.

---

## 6. Visual Direction

The design must feel:

- Premium
- Industrial
- Architectural
- Hospitality-led
- Corporate
- Modern

It must not feel:

- Wix
- generic WordPress
- Bootstrap template
- basic HTML
- cheap SaaS
- restaurant template
- bakery website

The public site should look closer to a premium architecture studio, commercial interiors company or high-end construction consultancy than a traditional catering site.

---

## 7. Brand Palette

Primary palette:

```text
Obsidian        #0A0A0A
Graphite        #171717
Warm Ivory      #F3EFE8
Soft Stone      #D8D0C5
Copper          #C96A32
Copper Dark     #A95427
Muted Dark      #9B978F
Muted Light     #66615A
```

The current logo contains orange/copper tones.

Preserve that identity but elevate it.

Copper must be an accent, not the entire visual system.

Avoid excessive orange.

Avoid pure-white sterile SaaS styling.

Avoid random gradients.

---

## 8. Typography

Use a premium editorial combination.

### Display / headings

Potential direction:

- Cormorant Garamond
- DM Serif Display
- Bodoni Moda
- Instrument Serif

Prefer something modern and highly readable.

### UI / body

Use:

- Inter
- Manrope
- Geist

or another high-quality neutral sans-serif.

The visual contrast should be:

**Editorial serif + functional sans serif**

Do not make body copy overly decorative.

---

## 9. Layout Principles

The public site should **not** consist of repeated rectangular cards stacked vertically.

Cards are allowed when they genuinely improve usability.

They are not the core layout system.

Prefer:

- editorial layouts
- asymmetric composition
- overlapping media
- large imagery
- generous negative space
- large typography
- sectional rhythm
- full-bleed areas
- split-layout storytelling
- scrolling showcases
- layered project imagery
- subtle dividers
- intelligent animation
- sticky visual sections
- alternating dark and light environments

Use strong visual hierarchy.

Do not put every element inside a border.

---

## 10. Motion and Interaction

Create subtle premium motion.

Use motion only when it improves the experience.

Examples:

- fade and translate content reveals
- image scale on hover
- subtle parallax
- navigation transition
- button micro-interactions
- project image transitions
- number count-up
- horizontal scroll interaction
- menu reveal
- section wipe/reveal

Do not use excessive animation.

Do not create motion that blocks interaction.

Respect `prefers-reduced-motion`.

Mobile animations should be lighter than desktop.

---

## 11. Mobile-First Requirement

This is critical.

The mobile version must **not** be the desktop site collapsed into one column.

Design mobile intentionally.

Requirements include:

- large touch targets
- clean off-canvas navigation
- thumb-friendly controls
- responsive typography
- mobile-specific spacing
- swipeable galleries
- horizontal scrolling chips where appropriate
- native-feeling interactions
- sticky CTA where useful
- responsive image crops
- simplified animation
- no tiny tables
- no horizontal overflow

Dashboard data tables must have appropriate mobile transformations.

Possible mobile dashboard patterns:

- summary row → tap → detail drawer
- table → stacked record cards
- horizontal scrolling only where unavoidable
- bottom sheets
- full-screen mobile editors

The dashboard should feel usable as a real mobile application.

---

## 12. Public Website Navigation

Desktop:

- Logo
- Services
- Projects
- About
- Contact
- Request a Quote

Services may use a premium dropdown or mega-menu.

Mobile:

- Logo
- Menu trigger

Opening menu should reveal a properly designed full-height navigation panel.

Do not use a tiny default hamburger dropdown.

---

## 13. Homepage

The homepage must immediately establish scale and capability.

### Hero

Potential headline:

**Complete Commercial Catering Solutions**

Supporting copy:

**From commercial kitchen design and fit-out to staffing, food service and ongoing operations, On A Roll delivers complete catering solutions for complex commercial environments.**

Primary CTA:

**Discuss Your Project**

Secondary CTA:

**Explore Our Services**

The hero should use strong visual imagery or video when real assets become available.

Build the hero so placeholder media can later be replaced without redesign.

Possible credibility line:

- Commercial Kitchens
- Contract Catering
- Modular Facilities
- Staffing
- Project Delivery

---

## 14. Homepage Capability Statement

Use an editorial split layout.

Example heading:

**More Than Catering**

Explain that On A Roll handles both physical catering infrastructure and ongoing operations.

Potential copy concept:

> From an empty site to a fully operational catering facility, we design, build, equip, staff and manage commercial kitchens for demanding working environments.

Avoid generic marketing filler.

---

## 15. Homepage Services Showcase

Show core services with strong imagery.

Suggested categories:

- Commercial Catering
- Commercial Kitchen Design
- Modular Kitchens
- Kitchen Fit-Out
- Catering Staffing
- Bespoke Projects

Do not simply create six identical cards.

Use a dynamic service showcase.

Possible desktop behaviour:
large image changes as service is selected.

Possible mobile behaviour:
vertical editorial stack or swipe experience.

---

## 16. Homepage Process

Communicate:

- 01 Discover
- 02 Design
- 03 Deliver
- 04 Operate

or:

- Consult
- Design
- Build
- Staff
- Operate

This should explain the integrated nature of the company.

---

## 17. Projects Preview

Featured case studies.

Each should support:

- Client
- Location
- Project category
- Scope
- Project value optional
- Contract length optional
- Key outcomes
- Photography

Use large, premium project photography.

Do not use tiny thumbnail cards.

---

## 18. Homepage Statistics

Support animated stats when real figures are supplied.

Do not invent figures.

Potential metrics:

- Years operating
- Meals served
- Commercial kitchens delivered
- Long-term contracts
- UK locations supported

Use structured editable content.

---

## 19. Homepage CTA

Strong commercial close:

**Planning a commercial catering project?**

Supporting message:

> Tell us what you need and we'll help scope the right solution.

CTA:

**Start a Project**

---

## 20. Services Architecture

Create SEO-friendly pages:

- `/services/commercial-catering`
- `/services/commercial-kitchen-design`
- `/services/modular-kitchens`
- `/services/kitchen-fit-out`
- `/services/catering-staffing`
- `/services/bespoke-projects`

Each page should be genuinely useful and not thin SEO content.

---

## 21. Commercial Catering Page

Cover:

- contract catering
- workforce catering
- construction catering
- corporate catering
- industrial catering
- temporary site catering
- long-term catering contracts

Possible sections:

- Overview
- Who we serve
- How we mobilise
- Kitchen infrastructure
- People and staffing
- Food service
- Compliance
- Case studies
- CTA

---

## 22. Commercial Kitchen Design Page

Explain full lifecycle:

- Brief
- Site survey
- Workflow analysis
- Layout
- Equipment specification
- Utilities coordination
- Costing
- Procurement
- Installation
- Commissioning
- Handover

Highlight:

- workflow
- food safety
- throughput
- storage
- equipment
- ventilation
- extraction
- ergonomics
- durability
- maintainability

---

## 23. Modular Kitchens Page

This should be a major commercial landing page.

Cover:

- Portacabin kitchens
- modular kitchens
- container kitchen conversions
- temporary kitchens
- site kitchens
- temporary canteens
- dining facilities

Explain benefits:

- rapid deployment
- bespoke configuration
- scalable capacity
- temporary or long-term
- fully equipped
- turnkey delivery

---

## 24. Kitchen Fit-Out Page

Cover:

- new installations
- refurbishments
- replacement equipment
- fabrication
- electrical coordination
- plumbing coordination
- refrigeration
- extraction
- commissioning

---

## 25. Staffing Page

Cover roles such as:

- Head Chefs
- Chefs
- Kitchen Assistants
- Kitchen Porters
- Catering Supervisors
- Catering Managers
- Drivers
- Support Staff

Do not imply recruitment services unless confirmed.

Frame this primarily around delivery of catering contracts.

---

## 26. Projects

Routes:

- `/projects`
- `/projects/[slug]`

Allow filters eventually:

- Commercial Catering
- Modular Kitchen
- Kitchen Fit-Out
- Corporate
- Construction
- Industrial

Case study pages should include:

- Client
- Project
- Location
- Challenge
- Scope
- Solution
- Delivery
- Outcome
- Gallery
- Services
- Related Projects
- CTA

Do not invent client facts.

---

## 27. About Page

Present:

- company story
- experience
- approach
- capabilities
- values
- leadership if supplied
- geographic coverage

Avoid cliché statements.

Tone:

- confident
- experienced
- practical

---

## 28. Contact Page

Include:

- phone
- email
- business address if supplied
- contact form
- map only if appropriate

Also make **Start a Project** the stronger commercial pathway.

---

## 29. Request-a-Quote System

Route:

`/quote`

This must be a sophisticated commercial enquiry form.

Step-based flow is preferred.

### Step 1 — Contact

- Company name
- Contact name
- Job title
- Email
- Phone

### Step 2 — Project

- Project name
- Location
- Required start date
- Expected duration
- Project description

### Step 3 — Services

Multi-select:

- Commercial Catering
- Commercial Kitchen Design
- Modular Kitchen
- Kitchen Fit-Out
- Staffing
- Equipment
- Consultancy
- Other

### Conditional catering questions

- Estimated workforce / diners
- Meals required per day
- Breakfast required
- Lunch required
- Dinner required
- 7-day service?
- Operating hours
- Contract duration
- Existing kitchen?
- Temporary facility required?

### Conditional kitchen questions

- New installation
- Refurbishment
- Temporary
- Modular
- Portacabin
- Container
- Approximate kitchen size
- Required throughput
- Required completion date
- Existing drawings?
- Existing equipment?

### Uploads

Allow secure upload of:

- PDF
- DOCX
- XLSX
- JPG
- PNG

Examples:

- drawings
- tender documents
- photos
- specifications
- site plans
- equipment schedules

Set reasonable size limits.

Validate MIME type server-side.

Store securely.

### Submission behaviour

Submitting the form should create:

- lead
- client/company record where appropriate
- contact
- opportunity
- uploaded documents
- activity log

Do not automatically create duplicate companies.

Use sensible deduplication checks based on company/email.

Send:

- internal new project enquiry notification
- customer confirmation email

Use Resend.

---

# 30. CRM Principle

The dashboard itself is the CRM.

Do **not** integrate an external CRM platform.

Native CRM functionality must include:

- leads
- companies
- contacts
- opportunities
- pipeline
- project conversion
- client activity
- notes
- files
- quote history
- invoice history
- contact history
- assigned users
- tasks
- reminders
- lead source tracking
- reporting

The complete commercial lifecycle should live inside the application.

---

## 31. Dashboard Authentication

Route:

`/dashboard/login`

Use Supabase Auth.

Support:

- email/password
- password reset
- secure session handling

Plan architecture so magic links or MFA can be added later.

No public dashboard registration page.

Accounts should be invited/created by authorised users.

---

## 32. Dashboard Design

The dashboard should visually belong to the same brand but prioritise usability.

Desktop:

- sidebar
- top utility bar
- main workspace
- contextual drawers

Use:

- warm light surfaces
- charcoal typography
- copper action states
- subtle borders
- premium spacing

Avoid excessive shadowed cards.

---

## 33. Dashboard Sidebar

Structure:

```text
Overview

Sales
  Leads
  Clients
  Quotes

Projects
  Projects
  Sites
  Tasks
  Documents

Workforce
  Employees
  Rota
  Timesheets
  Leave

Finance
  Invoices
  Payments
  Expenses
  Payroll

Operations
  Suppliers
  Equipment

Reports

Settings
```

Use permission-aware navigation.

---

## 34. Global Dashboard Search

Add global search architecture.

Keyboard shortcut:

- `⌘ K`
- `Ctrl K`

Search:

- clients
- contacts
- projects
- quotes
- invoices
- employees
- suppliers

Results should be grouped by entity.

---

## 35. Dashboard Overview

Prioritise operational awareness.

Top KPIs:

- Active Projects
- Open Quotes
- Outstanding Invoices
- Staff Working Today

### Needs Attention

Examples:

- Quotes expiring soon
- Invoices overdue
- Timesheets awaiting approval
- Staffing gaps
- Documents expiring
- Projects exceeding cost estimate

### Business Snapshot

Potential metrics:

- quoted this month
- won this month
- invoiced this month
- outstanding debt
- estimated payroll
- gross project margin

Do not calculate financial metrics incorrectly.

---

## 36. Leads and Sales Pipeline

Statuses:

- New
- Contacted
- Qualified
- Site Survey
- Quote Required
- Quote Sent
- Negotiation
- Won
- Lost

Fields:

- organisation_id
- company
- contact
- source
- service type
- estimated value
- project location
- expected start date
- status
- assigned user
- notes
- created date
- updated date

Pipeline should support useful filtering and stage movement without requiring an external CRM.

---

## 37. Client Records

Each client page:

- Overview
- Contacts
- Sites
- Projects
- Quotes
- Invoices
- Documents
- Activity

Fields:

- Company name
- Legal name
- Company number
- VAT number
- Billing address
- Trading address
- Email
- Phone
- Website
- Payment terms
- Notes

---

## 38. Contacts

Fields:

- First name
- Last name
- Job title
- Email
- Mobile
- Phone
- Client
- Primary contact status
- Finance contact
- Project contact
- Notes

---

## 39. Projects

Statuses:

- Lead
- Quoted
- Approved
- Planning
- Mobilisation
- Procurement
- Installation
- Operational
- On Hold
- Completed
- Cancelled

Project fields:

- Project ID
- Client
- Site
- Project Manager
- Project Name
- Description
- Start Date
- End Date
- Contract Value
- Estimated Cost
- Actual Cost
- Gross Profit
- Margin
- Status

Never manually store calculated values if they can safely be derived.

Project workspace tabs:

- Overview
- Tasks
- Staff
- Timesheets
- Costs
- Quotes
- Invoices
- Documents
- Activity

---

## 40. Project Costing

Cost categories:

- Labour
- Food
- Equipment
- Materials
- Transport
- Accommodation
- Subcontractors
- Hire
- Utilities
- Other

Track:

- estimated
- committed
- actual

Display:

- Revenue
- Estimated Cost
- Actual Cost
- Committed Cost
- Gross Profit
- Gross Margin

---

## 41. Project Sites

Separate sites from projects.

A client may have many sites.

Fields:

- Site name
- Client
- Address
- Postcode
- Site contact
- Access details
- Notes
- Latitude/longitude optional

---

## 42. Tasks

Support:

- Task
- Project
- Assignee
- Due date
- Priority
- Status
- Description

Statuses:

- To Do
- In Progress
- Blocked
- Complete

Do not try to replicate a full project-management suite initially.

---

# 43. Quotations

Create professional quote builder.

Quote numbering:

`OAR-Q-YYYY-####`

Example:

`OAR-Q-2026-0041`

Never reuse numbers.

Quote fields:

- Quote Number
- Client
- Contact
- Project
- Created Date
- Expiry Date
- Status
- Currency
- Subtotal
- Discount
- VAT
- Total
- Internal Cost
- Expected Profit
- Margin
- Notes
- Terms

Statuses:

- Draft
- Sent
- Viewed
- Accepted
- Rejected
- Expired
- Superseded

Quote items:

- Description
- Category
- Quantity
- Unit
- Cost Price
- Sell Price
- Discount
- VAT Rate
- Line Total
- Internal Notes

Cost price must never appear in customer-facing PDFs.

Reusable quote catalogue categories:

- Equipment
- Labour
- Installation
- Catering
- Transport
- Materials
- Professional Services
- Other

Allow catalogue price to be overridden per quote.

Quote actions:

- Save Draft
- Preview
- Generate PDF
- Send Email
- Duplicate
- Create Revision
- Mark Accepted
- Mark Rejected
- Convert to Project
- Convert to Invoice

Prevent dangerous duplicate conversion.

Customer quote page:

`/q/[secureToken]`

Customer can:

- view quote
- download PDF
- accept
- decline

Do not expose sequential database IDs.

---

## 44. Quote PDF

Professional branded PDF.

Include:

- logo
- quote number
- client
- project
- issue date
- expiry
- line items
- subtotal
- VAT
- total
- scope notes
- terms
- company information

Must look like a professional commercial proposal.

Not a browser screenshot.

---

# 45. Invoices

Invoice numbering:

`OAR-INV-YYYY-####`

Statuses:

- Draft
- Issued
- Part Paid
- Paid
- Overdue
- Cancelled
- Credit

Support:

- quote-to-invoice
- standalone invoice
- deposit invoice
- milestone invoices
- partial payments
- manual payment recording
- credit note architecture

Do not implement complex accounting ledgers.

Payment fields:

- Invoice
- Date
- Amount
- Method
- Reference
- Notes
- Recorded by

Methods:

- Bank Transfer
- Card
- Cash
- Cheque
- Other

Stripe can be added later.

Do not make Stripe mandatory.

---

# 46. Employees

Fields:

- Employee Number
- First Name
- Last Name
- Email
- Phone
- Address
- Emergency Contact
- Role
- Employment Type
- Start Date
- End Date
- Hourly Rate
- Salary
- Status
- Notes

Statuses:

- Active
- Inactive
- On Leave
- Former

Employment types:

- Full Time
- Part Time
- Casual
- Contractor
- Agency

Employee roles initial examples:

- Head Chef
- Chef
- Kitchen Assistant
- Kitchen Porter
- Catering Supervisor
- Catering Manager
- Driver
- Administrator
- Project Manager

Allow custom roles.

---

## 47. Employee Compliance Documents

Types:

- Right to Work
- Passport
- Food Hygiene
- Health & Safety
- Driving Licence
- Training Certificate
- DBS
- Other

Fields:

- document type
- file
- issue date
- expiry date
- verification status
- verified by
- notes

Support future notifications at:

- 90 days
- 60 days
- 30 days
- 14 days
- 7 days
- expired

---

# 48. Rota

Views:

- Day
- Week
- Month
- By Employee
- By Project

Shift fields:

- employee
- project
- site
- date
- start time
- end time
- break
- role
- status
- notes

Statuses:

- Draft
- Published
- Completed
- Cancelled

Warn if:

- employee already scheduled
- overlapping shifts
- employee unavailable
- required document expired

Do not silently block unless business rules explicitly require it.

---

# 49. Timesheets

Fields:

- Employee
- Project
- Site
- Date
- Start
- Finish
- Break
- Calculated Hours
- Overtime Hours
- Notes
- Status
- Approver

Statuses:

- Draft
- Submitted
- Approved
- Rejected
- Paid

Workflow:

Employee submits → Manager approves → Approved timesheets become eligible for payroll preparation.

Maintain audit history.

---

# 50. Payroll Preparation

Do **not** build statutory UK payroll calculation initially.

This platform should prepare payroll inputs.

Payroll period:

- Start Date
- End Date
- Status

Entries:

- Employee
- Standard Hours
- Overtime Hours
- Hourly Rate
- Gross Calculated Pay
- Expenses
- Adjustments
- Notes

Allow CSV export.

Architecture should allow future integration with accounting/payroll systems.

---

# 51. Leave

Types:

- Holiday
- Sick
- Unpaid
- Other

Statuses:

- Requested
- Approved
- Rejected
- Cancelled

Tie approved leave into scheduling availability.

---

# 52. Suppliers

Fields:

- Company
- Contact
- Category
- Email
- Phone
- Address
- VAT Number
- Payment Terms
- Website
- Notes

Categories:

- Food
- Equipment
- Fabrication
- Extraction
- Refrigeration
- Electrical
- Plumbing
- Transport
- Agency Staff
- Cleaning
- Other

---

# 53. Equipment Catalogue

Fields:

- Name
- Category
- Supplier
- Supplier SKU
- Description
- Specification
- Cost Price
- Standard Sell Price
- VAT Rate
- Image
- Datasheet
- Active status

This catalogue should be usable from quotation creation.

---

# 54. Expenses and Costs

Track business/project costs.

Fields:

- Project
- Supplier
- Category
- Date
- Description
- Net
- VAT
- Gross
- Reference
- Receipt/File
- Status

---

# 55. Document Management

Entity-linked documents should work across:

- Clients
- Projects
- Employees
- Quotes
- Invoices
- Suppliers

Store file metadata in PostgreSQL.

Store binaries in Supabase Storage.

Fields:

- name
- type
- entity
- entity_id
- storage path
- uploaded by
- uploaded date
- expiry date optional
- version optional

Project document categories:

- Contracts
- Drawings
- Site Surveys
- Risk Assessments
- Method Statements
- Specifications
- Certificates
- Equipment Data
- Photos
- Correspondence
- Other

---

# 56. Activity Logs

Every important mutation should create an audit record.

Examples:

- Quote created
- Quote sent
- Quote amount changed
- Invoice marked paid
- Timesheet approved
- Project status changed
- Employee document uploaded
- Client updated

Record:

- organisation_id
- user_id
- entity_type
- entity_id
- action
- metadata
- timestamp

Do not store unnecessary sensitive information.

---

# 57. Notifications

Create notification architecture.

Types might include:

- invoice overdue
- quote expiring
- timesheet pending
- document expiring
- staffing conflict
- task overdue
- project deadline

Initially dashboard notifications are sufficient.

Later add email.

---

# 58. Reports

Initial reports:

- Revenue by month
- Quotes by status
- Quote conversion rate
- Project profitability
- Outstanding invoices
- Revenue by client
- Labour cost by project
- Employee hours
- Project cost breakdown

Use sensible charts.

Do not create chart clutter.

---

# 59. Permissions

Roles:

- Owner
- Administrator
- Finance
- Project Manager
- Staff
- Read Only

Implement architecture around permissions.

Do not simply hide buttons in the frontend.

Enforce permissions server-side and through Supabase RLS.

### Owner
Full access.

### Administrator
Most operational access.

### Finance
Access to:

- clients
- quotes
- invoices
- payments
- expenses
- reports
- payroll preparation

### Project Manager
Access primarily to:

- assigned projects
- project staff
- project timesheets
- project tasks
- project documents
- project costs as permission allows

### Staff
Future staff portal.

Access only to their own:

- profile
- shifts
- timesheets
- leave
- documents

### Read Only
View access where permitted.

No mutations.

---

# 60. Row-Level Security

Supabase RLS is mandatory.

Every tenant-owned table must be protected by:

- organisation membership
- role
- entity-specific permissions where required

Never rely only on application code for tenant isolation.

Test cross-tenant access.

---

# 61. Database Schema Standards

Use:

- UUID primary keys
- created_at
- updated_at
- organisation_id
- foreign keys
- indexes
- constraints

Use enums carefully.

Prefer lookup tables where future configurability is likely.

Avoid:

- giant JSON columns
- comma-separated values
- duplicate data
- client-controlled financial totals

Use decimal/numeric types for financial values.

Never use floating-point arithmetic for money.

---

# 62. Soft Deletion

For important commercial records, prefer archival/soft deletion where appropriate.

Examples:

- clients
- projects
- employees
- quotes
- invoices
- suppliers

Financial documents should not simply disappear.

---

# 63. Currency and VAT

Start with GBP.

Design quote/invoice models with a currency field.

VAT rates must be configurable.

Initial defaults can support:

- 20%
- 5%
- 0%
- Exempt

Do not hardcode 20% throughout the application.

---

# 64. Dates and Timezone

Store timestamps appropriately.

Business-facing dates should display in UK format:

`DD/MM/YYYY`

Do not hardcode database semantics to a single timezone.

---

# 65. Search

Use PostgreSQL search initially.

Do not introduce Elasticsearch or Algolia prematurely.

Search across:

- company names
- contact names
- project names
- quote numbers
- invoice numbers
- employee names
- supplier names

---

# 66. Security

Mandatory:

- server-side validation
- Zod validation
- RLS
- authorisation checks
- rate limiting where necessary
- secure uploads
- signed URLs for private files
- safe error handling
- environment variable isolation
- CSRF-safe mutation patterns
- XSS-safe rendering

Never expose:

- service role keys
- raw storage paths unnecessarily
- internal cost information
- employee private information

---

# 67. File Security

Separate public marketing media from private business documents.

Suggested storage buckets:

- public-assets
- project-documents
- employee-documents
- quote-documents
- invoice-documents

Private buckets must not be publicly enumerable.

---

# 68. Accessibility

Target WCAG AA.

Requirements:

- keyboard navigation
- semantic HTML
- visible focus state
- sensible colour contrast
- form labels
- alt text support
- reduced-motion support
- screen-reader friendly components

Premium design must not sacrifice usability.

---

# 69. Performance

Public website should target excellent Core Web Vitals.

Use:

- next/image
- responsive image sizes
- modern formats
- lazy loading
- server rendering
- font optimisation
- code splitting

Avoid massive client-side JS bundles.

Do not ship dashboard libraries to marketing pages unnecessarily.

---

# 70. SEO

Implement:

- metadata
- canonical URLs
- Open Graph
- Twitter metadata
- structured data
- XML sitemap
- robots.txt
- breadcrumbs where appropriate
- semantic headings

Potential schema:

- Organization
- LocalBusiness where valid
- Service
- BreadcrumbList
- Article/CaseStudy where appropriate

Do not fabricate reviews or ratings.

---

# 71. Content Management

Do not add a full external CMS yet.

Build editable content architecture so selected marketing content can eventually be managed internally.

Phase 1 can use structured local content/data files for:

- services
- projects
- testimonials
- FAQs

Do not hardcode content deeply inside presentational components.

---

# 72. Forms UX

Forms must have:

- inline validation
- clear error states
- loading states
- success feedback
- autosave where valuable
- accessible fields
- responsive layout

Never discard a long commercial enquiry because of a single validation error.

Consider draft persistence for the quote enquiry.

---

# 73. Empty, Loading and Error States

Every dashboard module must have useful empty states.

Use:

- skeletons
- optimistic updates where safe
- progress indicators

Avoid full-page spinners.

Do not expose raw Supabase/Postgres exceptions.

---

# 74. Confirmation Patterns

Require confirmation before destructive operations such as:

- cancel invoice
- archive project
- remove employee
- delete document

Avoid annoying confirmations for ordinary edits.

---

# 75. Autosave

Use autosave selectively.

Good candidates:

- internal notes
- quote draft
- project notes

Make state clear.

---

# 76. Responsive Dashboard Navigation

Desktop:
left sidebar.

Tablet:
collapsible sidebar.

Mobile:
native-feeling bottom navigation or menu/drawer system.

Do not simply shrink the desktop sidebar.

Priority mobile dashboard items might be:

- Home
- Projects
- Staff
- Sales
- More

---

# 77. Staff Portal Architecture

Do not fully build in Phase 1.

Prepare routes:

- `/staff`
- `/staff/shifts`
- `/staff/timesheets`
- `/staff/leave`
- `/staff/documents`

Mobile-first.

A staff member should eventually be able to:

- open phone
- see next shift
- view location
- submit hours
- request leave
- view required documents

within seconds.

---

# 78. Email Architecture

Use Resend.

Create reusable templates for:

- new enquiry internal alert
- enquiry received confirmation
- quote email
- invoice email
- password reset support
- document expiry warning
- timesheet notification

Centralise branding.

---

# 79. Environment Variables

Provide `.env.example`.

Expected variables:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
EMAIL_FROM
INTERNAL_NOTIFICATION_EMAIL
```

Never commit secrets.

---

# 80. Logging

Implement practical server logging.

Log:

- critical mutations
- email failures
- PDF failures
- file upload failures
- authentication failures where appropriate

Do not log passwords or sensitive tokens.

---

# 81. Testing

At minimum cover:

- financial calculations
- quote totals
- VAT calculations
- invoice totals
- permissions
- RLS assumptions
- quote conversion
- invoice conversion
- timesheet hour calculation
- cross-tenant access

Use unit tests for pure financial functions.

Use integration tests for critical workflows.

---

# 82. Seed Data

Create development seed data for:

- organisation
- admin user mapping
- sample client
- sample contact
- sample lead
- sample project
- sample quote
- sample invoice
- sample employees
- sample shifts
- sample supplier

Clearly mark all sample data.

Do not expose seed data in production.

---

# 83. Supabase Migrations

All schema changes must be through migrations.

Do not manually mutate production schema without migrations.

Keep migrations deterministic.

---

# 84. Code Standards

Use:

- strict TypeScript
- small composable components
- domain separation
- typed database models
- centralised validation schemas
- centralised permission utilities
- centralised financial utilities

Avoid:

- 1000-line components
- `any`
- duplicated API logic
- business rules inside UI components
- magic strings
- hardcoded IDs

---

# 85. Suggested Domain Structure

Example:

```text
lib/
  supabase/
  auth/
  permissions/
  money/
  email/
  pdf/
  storage/
  validation/

features/
  clients/
  leads/
  projects/
  quotes/
  invoices/
  employees/
  timesheets/
```

Do not force this exact architecture if a cleaner modern Next.js pattern is justified, but maintain domain separation.

---

# 86. Public Design Components

Create reusable premium components such as:

- MarketingHeader
- MobileNavigation
- Hero
- EditorialSplit
- SectionIntro
- ServiceShowcase
- ProjectFeature
- ProjectGallery
- StatStrip
- ProcessTimeline
- QuoteCTA
- Footer
- ImageReveal
- LogoStrip

Avoid building a generic `<Card>` for every section.

---

# 87. Dashboard Components

Create reusable patterns:

- DataTable
- ResponsiveRecordList
- Metric
- StatusBadge
- FilterBar
- SearchInput
- EntityHeader
- ActivityTimeline
- FileUploader
- MoneyInput
- DatePicker
- EntityDrawer
- ConfirmationDialog
- EmptyState

---

# 88. Status Design

Use status colour sparingly and semantically.

Examples:

- Green = successful / paid / complete
- Amber = attention / pending
- Red = overdue / rejected / expired
- Blue = active/info if required
- Grey = draft/inactive
- Copper = brand/action

Do not turn every status into brightly coloured pills.

---

# 89. Financial Calculation Rules

Implement trusted server-side calculation helpers.

Never trust client-submitted totals.

For quote:

- line net
- discount
- VAT
- subtotal
- total
- cost total
- gross profit
- margin

Recalculate server-side before saving.

---

# 90. Revision History

Quotations should support revisions.

Architecture should allow:

- OAR-Q-2026-0041
- Revision 1
- Revision 2

Do not overwrite accepted historic quotations without traceability.

---

# 91. Invoice Immutability

Once formally issued, important invoice details should not be casually mutable.

Use appropriate corrections/revisions.

Prepare architecture for:

- credit notes
- void/cancel
- reissued documents

---

# 92. Customer-Facing Documents

Quote and invoice URLs must use secure random tokens where public access is required.

Never expose internal sequential IDs.

---

# 93. Backup and Export

The company must never become trapped in the platform.

Support CSV export architecture for:

- clients
- projects
- quotes
- invoices
- employees
- timesheets
- payroll

No need to build every export in Phase 1, but structure data cleanly enough to support them.

---

# 94. Analytics

Public website analytics should be privacy-conscious.

Track useful conversion events such as:

- quote_started
- quote_submitted
- contact_clicked
- phone_clicked
- service_viewed
- case_study_viewed

Do not add invasive tracking without approval.

---

# 95. Public Site Conversion Principles

Every important service page should have a clear commercial CTA.

Preferred wording:

- Discuss Your Project
- Request a Quote
- Talk to Our Team
- Start a Project

Avoid consumer-style:

- Buy Now
- Order Now
- Book a Table

---

# 96. Content Tone

Writing should be:

- confident
- specific
- professional
- commercial
- direct
- experienced

Avoid:

- “passionate about food”
- “culinary journey”
- “mouthwatering”
- “delicious experiences”
- generic “your trusted partner”

This is primarily a **B2B project delivery company**.

---

# 97. Photography Direction

Use imagery featuring:

- industrial kitchens
- commercial catering operations
- modular kitchens
- site compounds
- equipment installation
- professional catering teams
- construction environments
- serving areas
- commercial dining facilities
- finished kitchen projects

Do not fill the site with:

- cupcakes
- coffee cups
- restaurant tables
- wedding buffets
- generic stock chefs smiling at camera

---

# 98. Image Treatment

Use:

- large crops
- editorial framing
- full bleed
- layering
- selective rounded corners
- subtle image zoom
- dark overlays where necessary

Avoid making every image a rounded rectangle inside a card.

---

# 99. Logo Usage

Preserve original brand identity.

Support:

- full logo
- compact logo
- wordmark if later provided

Do not recreate or distort the logo automatically.

Build the header so logo asset can easily be replaced with supplied SVG/PNG.

---

# 100. Accessibility and Brand Contrast

Copper text directly on ivory may fail contrast depending on size.

Use copper mainly for:

- decorative elements
- large display accents
- buttons with appropriate foreground contrast
- borders
- icons
- highlight states

Body copy should remain high contrast.

---

# 101. Vercel Deployment

Prepare for:

- Preview deployments
- Production deployment
- environment separation

Ensure Supabase redirect URLs work for preview/production appropriately.

Do not accidentally make development admin accounts available publicly.

---

# 102. Database Environments

Use separate Supabase environments/projects where practical for:

- development
- production

At minimum avoid destructive development operations against production data.

---

# 103. PHASED IMPLEMENTATION

Do **not** attempt to implement every feature in one pass.

Complete one phase, test it and report status before continuing.

---

## PHASE 0 — Repository and Architecture

Build:

- Next.js foundation
- TypeScript strict mode
- Tailwind
- component system
- fonts
- brand tokens
- Supabase integration
- auth utilities
- route groups
- environment handling
- basic migration setup

Create high-level architecture documentation.

Then stop and report:

- files created
- architecture
- commands
- environment variables required
- anything that needs user input

---

## PHASE 1 — Premium Public Website

Build:

- header
- mobile navigation
- footer
- homepage
- services index
- individual service pages
- projects index
- project page architecture
- about
- contact
- quote enquiry UI
- responsive design
- animations
- SEO

Use placeholder content only where facts have not been supplied.

Clearly label placeholders in data/config rather than fake facts.

The site must already feel premium before dashboard development begins.

---

## PHASE 2 — Supabase Core CRM Model

Create migrations for:

- organisations
- organisation_members
- profiles
- leads
- clients
- client_contacts
- sites
- projects
- documents
- activity_logs
- notifications

Implement RLS.

Seed development records.

Test tenant separation.

---

## PHASE 3 — Authentication and Dashboard Shell

Build:

- login
- password reset
- protected routes
- sidebar
- mobile dashboard navigation
- overview
- global search shell
- permissions framework

Do not build empty fake modules.

Navigation can indicate unavailable future sections appropriately.

---

## PHASE 4 — Native CRM and Project Management

Build:

- leads
- pipeline
- clients
- contacts
- sites
- projects
- tasks
- project documents
- activity timeline
- notes
- assigned users
- filters
- lead source tracking
- enquiry-to-lead workflow
- lead-to-project progression

This phase is the core internal CRM. Do not rely on external CRM software.

---

## PHASE 5 — Quotations

Build fully:

- quote schema
- quote items
- catalogue
- VAT
- financial calculations
- quote builder
- draft saving
- quote PDFs
- email sending
- customer quote view
- accept/reject
- revision architecture
- quote-to-project

Test heavily.

---

## PHASE 6 — Invoicing

Build:

- invoice schema
- invoice builder
- quote-to-invoice
- milestones
- payments
- PDF invoice
- email
- overdue status
- manual payment recording

Do not implement a general ledger.

---

## PHASE 7 — Project Costing

Build:

- cost categories
- expenses
- project costs
- estimated vs actual
- profit
- gross margin
- project financial dashboard

---

## PHASE 8 — Workforce

Build:

- employees
- roles
- documents
- compliance
- rota
- shift conflicts
- leave
- timesheets
- approvals

Mobile UX is critical.

---

## PHASE 9 — Payroll Preparation

Build:

- pay periods
- approved timesheet aggregation
- payroll entries
- adjustments
- CSV export

No statutory payroll engine.

---

## PHASE 10 — Suppliers and Equipment

Build:

- suppliers
- supplier contacts
- equipment catalogue
- equipment documents
- quote catalogue integration

---

## PHASE 11 — Reports and Automation

Build:

- quote conversion
- revenue
- project margins
- outstanding debt
- labour
- hours
- notifications
- expiry alerts
- quote reminders
- invoice reminders

---

## PHASE 12 — Staff Portal

Build mobile-first:

- dashboard
- next shifts
- all shifts
- timesheets
- leave
- documents
- profile

---

# 104. Important Implementation Rule

Before beginning each phase:

1. Inspect the current repository.
2. Understand existing architecture.
3. Check migrations.
4. Check current tests.
5. Do not replace working architecture unnecessarily.
6. Explain the implementation plan briefly.
7. Implement the phase.
8. Run lint.
9. Run typecheck.
10. Run tests.
11. Build locally.
12. Fix all issues introduced.
13. Commit logical changes if Git is available.
14. Provide a concise completion report.

---

# 105. Do Not Fake Functionality

If a feature is not implemented:

- hide it
- disable it clearly
- or mark it as coming later

No fake dashboard statistics.

No fake notifications.

No fake client names in production.

---

# 106. Design Quality Gate

Before considering each public page complete, inspect it visually at approximately:

- 390px mobile
- 430px mobile
- 768px tablet
- 1024px small desktop
- 1440px desktop
- 1920px large desktop

Check:

- spacing
- typography
- image crop
- overflow
- navigation
- CTA prominence
- animation
- visual rhythm
- line lengths

A page passing TypeScript is not sufficient.

---

# 107. Anti-Wix Rule

If the page looks like:

- hero
- 3 cards
- text block
- 3 cards
- testimonial cards
- CTA card
- footer

redesign it.

The visual hierarchy should have intentional variation.

---

# 108. Premium Design Test

Ask while designing:

> Would this website look credible if the company were pitching a £500,000 commercial contract?

If not, improve it.

---

# 109. Dashboard Design Test

Ask:

> Would someone actually choose to run their business from this every day?

If not, improve workflow before decoration.

---

# 110. Initial Deliverable

Start now with only:

- Phase 0
- Phase 1

Do not begin the operational dashboard modules yet beyond foundational architecture.

At the end of Phase 1, provide:

- what is complete
- routes created
- components created
- database work completed
- environment variables required
- placeholder content requiring real data
- known issues
- recommended next phase

Then stop for review.

---

# 111. Initial Brand Assets

Use the supplied On A Roll Catering logo.

The visual interpretation should preserve its warm copper-on-black identity while expanding it into:

- Obsidian
- Graphite
- Warm Ivory
- Stone
- Copper

Do not force the entire website to remain black.

The best rhythm should alternate between dark dramatic areas and sophisticated warm-light editorial sections.

---

# 112. Final Product Objective

The finished platform should connect the complete commercial lifecycle:

```text
Website visitor
↓
Qualified enquiry
↓
Lead
↓
Client
↓
Site
↓
Opportunity
↓
Quotation
↓
Accepted contract
↓
Project
↓
Staff
↓
Shifts
↓
Timesheets
↓
Costs
↓
Invoices
↓
Payments
↓
Project margin
↓
Reporting
```

Data should flow between modules.

Users should not repeatedly enter the same information.

The CRM, sales pipeline, project management, quoting, invoicing, workforce management and reporting must be native to this platform.

The system should save administrative time while giving management much better visibility into sales, labour, costs, invoicing and profitability.
