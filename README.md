<div align="center">

<img src="./public/platform-assets/platform-logo.png" alt="Bizora" width="200" />

# Bizora

**Your Business, Simplified.**

A local-first business management and billing desktop app for small businesses.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Local-first](https://img.shields.io/badge/local--first-yes-brightgreen)
![Electron](https://img.shields.io/badge/Electron-desktop-47848F?logo=electron&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-React-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Drizzle%20ORM-003B57?logo=sqlite&logoColor=white)

[Overview](#-overview) ·
[Features](#-features) ·
[Architecture](#-architecture) ·
[Tech Stack](#-tech-stack) ·
[Workflows](#-workflows) ·
[Roadmap](#-roadmap)

</div>

---

## 🚀 Overview

Small businesses need billing, customer management, inventory tracking and reports, but running an online application brings hosting, database and maintenance costs they don't need.

Bizora runs **locally on the business owner's computer**. Business data and core operations stay available without a separately hosted backend or online database. The platform is also **country-aware**: each business configures its own tax, food-safety and regulatory information for its location.

> **Install Bizora → Set up your business → Start managing your business.**

| | |
|---|---|
| ✅ No server configuration | ✅ No database installation |
| ✅ No terminal commands | ✅ No complicated deployment |

Bizora is packaged as a desktop application that can be installed and used with minimal technical setup.

---

## ✨ Features

| Area | What you can do |
|---|---|
| 🌍 [Country-aware setup](#-country-aware-business-setup) | Configure country, tax and regulatory details |
| 👥 [Customers](#-customer-management) | Person and business customers with history |
| 📦 [Products](#-product-management) | Products, units, pricing and inventory |
| 📋 [Daily entries](#-daily-entries) | Record daily transactions quickly |
| 🧾 [Billing](#-billing) | Invoices, monthly statements, print and PDF |
| 🛒 [Stock purchases](#-stock-purchases) | Track purchases and how stock enters the business |
| 🏢 [Suppliers](#-supplier-management) | Manage who you buy from |
| 💸 [Expenses](#-expense-management) | Track operating costs by category |
| 👷 [Workers](#-worker-management-and-payments) | Lightweight worker records and payments |
| 💰 [Payments](#-payment-tracking) | Paid, unpaid, partial and outstanding balances |
| 📊 [Reports](#-reports) | Sales, purchases, expenses and profit overview |
| 🔐 [Backup](#-local-first-and-backup) | Local data with backup and restore |

### 🌍 Country-Aware Business Setup

Bizora does not hard-code country-specific requirements such as FSSAI or GSTIN. During setup, the business selects its country and configures the regulatory information relevant to it. This lets Bizora support businesses in different countries without changing the core application.

Setup can include: country, business name, logo, address, city, state / region, postal code, contact information, business type, tax information, food-safety information and other business registrations.

#### 🧾 Tax information

Tax information is configurable rather than tied to one country's terminology.

```text
Tax System · Tax Registration Number · Tax Registered · Tax Rate
```

| Country | Tax system | Registration label |
|---|---|---|
| India | GST | GSTIN |
| New Zealand | GST | GST Number |

The underlying system can support additional tax systems in the future.

#### 🛡️ Regulatory and food-safety information

Instead of hard-coding fields such as `FSSAI Number`, Bizora uses a generic structure:

```text
Authority / Department · Registration Type · Registration Number · Issue Date · Expiry Date
```

| Field | Example (Indian food business) |
|---|---|
| Authority | FSSAI |
| Registration type | Food Business Licence |
| Registration number | `XXXXXXXXXXXXXX` |

A New Zealand business can configure the authority and registration details that apply to it. No product change is needed to support a new regulatory system.

### 👥 Customer Management

| Individual customer | Business customer |
|---|---|
| First and last name | Business name |
| Phone, email | Contact person |
| Address and location details | Phone, email |
| Transaction history | Tax registration details |
| | Business address |
| | Business transaction history |

### 📦 Product Management

Manage products, pricing, units and inventory. Bizora starts with common dairy products (milk, curd, tofu, paneer and others), but the product system is intentionally generic so it can later support groceries, bakeries, cafes, restaurants, small retailers, wholesalers and other small businesses.

### 📋 Daily Entries

Create entries, select customers, add multiple products, set quantities, calculate totals, apply discounts, track payment status and view previous entries.

### 🧾 Billing

Generate invoices with numbering, customer information, product details, quantities and pricing, tax calculation, discounts and payment status. Invoices can be printed or exported as PDF.

**Payment details on bills.** Businesses configure their payment information once and show it on invoices: bank name, account name, account number, branch, routing / bank code, payment identifier, payment QR and payment instructions.

- No payment gateway is required. The invoice shows the configured details, and customers scan the QR code or use the bank details.
- Payment details are snapshotted on invoices, so changing them later does not alter invoices already generated.

### 🛒 Stock Purchases

Record what the business buys from suppliers: date, supplier, products, quantity, unit price, tax, total, payment status, method, date, reference and notes. One purchase can contain multiple products.

```text
15 September 2026
Supplier: ABC Foods

Items:
  Milk     50 litres
  Paneer   20 kg
  Curd     30 kg

Purchase Total: ₹12,000
```

Stock purchases are kept separate from general expenses because they affect inventory.

### 🏢 Supplier Management

Supplier name, contact person, phone, email, tax registration number, address, notes and active / inactive status. Supplier history can later be used to understand purchasing activity and spending.

### 💸 Expense Management

Track business costs that are not stock purchases: rent, electricity, transport, repairs, maintenance, packaging, equipment and other operating expenses.

Each expense has a date, category, description, amount, payment method, reference and notes. Businesses maintain their own expense categories.

### 👷 Worker Management and Payments

Bizora includes lightweight worker management. It intentionally avoids complex HR features, because many small businesses have only a few workers.

| Worker information | Worker payments |
|---|---|
| Name, phone, email | Worker and payment date |
| Role / job, joining date | Payment period |
| Payment type, default amount | Amount, method, reference |
| Address, notes | Notes |
| Active / inactive status | |

Worker payments are tracked separately from general expenses, so you can see how much was paid to workers in a given week or month.

### 💰 Payment Tracking

Paid, unpaid and partially paid status; outstanding balance; customer payment history; mark an invoice as paid.

### 📊 Reports

Planned reports: daily and monthly sales, total revenue, outstanding payments, customer and product sales, payment reports, stock purchase and supplier reports, expense reports, worker payment reports, business overview, revenue vs expenses, purchase vs sales and profit overview.

### 💾 Local-First and Backup

Business data is stored on the user's computer instead of a hosted database.

- No monthly hosting cost and no external database
- Core functionality works without internet
- Fast local data access and greater control over business data
- Simple deployment

Because data is stored locally, backups matter. Planned: manual backup, automatic backups, backup history, restore from backup and data export.

---

## 🖥️ Architecture

Bizora is a single application in a single repository.

```text
              ┌───────────────────────┐
              │        Electron       │
              │      Desktop App      │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │        Next.js        │
              │  SSR · Server Actions │
              │    Route Handlers     │
              └───────────┬───────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
     ┌─────────────┐             ┌─────────────┐
     │  shadcn/ui  │             │ Drizzle ORM │
     │  Tailwind   │             └──────┬──────┘
     └─────────────┘                    ▼
                                 ┌─────────────┐
                                 │   SQLite    │
                                 │  Local DB   │
                                 └─────────────┘
```

**Principles:** single repository · single desktop application · local-first · no separately hosted backend · local SQLite database · type-safe database access · server-side rendering · component-based UI · automated application setup · country-aware configuration · extensible regulatory and tax models.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Desktop | Electron |
| Backend / server | Next.js Server Actions, Next.js Route Handlers, Node.js runtime |
| Database | SQLite, Drizzle ORM, Drizzle Kit |
| Development | TypeScript, ESLint, Git, GitHub |

---

## 📁 Project Structure

```text
bizora/
├── app/
│   ├── login/
│   ├── setup/            # business, tax, regulatory, customers, products
│   ├── dashboard/
│   ├── daily-entries/
│   ├── customers/
│   ├── products/
│   ├── stock-purchases/
│   ├── suppliers/
│   ├── expenses/
│   ├── workers/
│   └── reports/
├── components/           # ui, layout, dashboard, customers, products, billing, reports
├── lib/                  # db, auth, validations, utilities
├── electron/             # main.ts, preload.ts, updater.ts
├── drizzle/
│   └── migrations/
├── scripts/              # setup.ts, migrate.ts, backup.ts
├── public/
│   └── platform-assets/  # logos and app icons
├── package.json
├── next.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── README.md
```

> The structure may evolve as Bizora develops.

Platform branding lives in `public/platform-assets/`:

```text
platform-logo.png · platform-tp-logo.png · platform-app-icon.png · platform-tp-app-icon.png
```

Images use relative paths, so they load directly from the repository with no external image host:

```md
![Bizora](./public/platform-assets/platform-logo.png)
```

---

## 🧭 First-Launch Setup

The first launch is a setup wizard.

```text
Install Bizora
      │
      ▼
Welcome
      │
      ▼
Country & Business ──── country · business type · business information
      │
      ▼
Tax Information ─────── tax system · tax registration
      │
      ▼
Regulatory Info* ────── authority · registration type · registration number
      │
      ▼
Payment Details ─────── bank details · identifier · QR · instructions
      │
      ▼
Customer Setup ──────── person · business
      │
      ▼
Product Setup ───────── product · unit · price · opening stock
      │
      ▼
Setup Complete 🎉
      │
      ▼
Dashboard
```

<sub>\* Regulatory information is shown based on the selected country and business type.</sub>

### Setup finalization

The wizard collects the business configuration and user-defined customers and products. Finalization is handled by one setup persistence layer and is **transactional**: the database is not considered initialized until the whole operation succeeds.

```text
Setup Wizard
     │
     ▼
Transactional Setup Save
     ├── Create Business
     ├── Save Tax / Regulatory Data
     ├── Save Payment Details
     ├── Create User Customers
     ├── Create User Products
     ├── Create Walk-in Customer      ← system record
     └── Create Quick Sale Product    ← system record
     │
     ▼
Mark Setup Complete  →  Dashboard
```

### System records

Setup creates two application-owned records:

| Record | Type | Purpose |
|---|---|---|
| `WALK_IN_CUSTOMER` | Customer | Used for counter sales to unknown customers |
| `QUICK_SALE` | Product | Used for quick counter sales (quantity 1) |

They are not part of the wizard's customer or product input lists, because they are not user-created business records.

---

## 🧱 Design Principles

### Country-aware design

Bizora avoids hard-coding country-specific concepts into the business model. Instead of columns such as `fssai_number`, `gst_number`, `nzbn_number` or `abn_number`, it uses extensible models:

```text
business_registrations
──────────────────────
id
business_id
country
authority_name
registration_type
registration_number
issue_date
expiry_date
metadata
```

Tax information is likewise stored as configurable tax registrations rather than country-specific columns. The same core application serves businesses in different countries and shows locally relevant terminology.

### Transaction and data rules

Operational data is relational and explicit. Normal entries keep required references:

```text
daily_entries
  └── customer_id → customers.id

daily_entry_items
  └── product_id → products.id
```

These relationships are intentionally **not nullable**. Quick Sale uses the setup-created system records instead of skipping them.

**System record visibility**

| | Normal records | System records |
|---|---|---|
| Customers | Visible in customer management | Hidden from normal management |
| Products | Visible in product management | Hidden from normal management |

System records should be filtered out of customer and product lists, normal selectors, and customer-facing ledgers where a real customer is expected. Internal transaction creation and reporting may still use them.

**Transaction history.** Once a sale is recorded, it is business history. UI visibility rules for system records must never remove the underlying transaction from sales reports.

---

## 📌 App Layout

### Main navigation

```text
Dashboard · Daily Entries · Customers · Products · Stock Purchases
Suppliers · Expenses · Workers · Reports · Settings
```

The goal is an app a business owner can use without technical knowledge.

### Settings

Configuration lives in Settings so daily navigation stays focused on operations.

```text
Settings
├── Business
├── Tax & Registrations
├── Payment Details
├── Invoice & Billing
├── Expense Categories
├── Product Categories
├── Data & Backup
└── Application
```

### Dashboard

A quick overview built to answer one question: **How is my business doing today?**

Planned: today's sales and entries, outstanding amount, recent transactions, sales overview, top products, recent customers, low stock items, recent purchases and expenses, worker payments, and revenue vs expenses.

---

## 🔄 Workflows

### Business cycle

Bizora follows the full day-to-day cycle of a small business.

```text
                     Business Setup
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
     Customers          Products         Suppliers
         │                 ▲                 │
         ▼                 │                 ▼
    Daily Sales ──► Stock / Inventory ◄── Purchases
         │
         ▼
     Invoices
         │
         ▼
     Payments

  Business Expenses ──► Expense Categories
  Workers ────────────► Worker Payments

                           │
                           ▼
                        Reports
```

```text
Sales → Revenue
Purchases → Inventory
Expenses → Operating costs
Worker payments → Labour costs
Revenue − business costs → Business overview / profit
```

### Daily entry

```text
Select Customer → Select Products → Enter Quantities
      → Calculate Total → Set Payment Status → Save Entry
```

Each entry becomes part of the customer's transaction history and can be used to generate a bill.

### Customers

```text
Customers
├── Customer List
└── Customer Details
    ├── Customer Information
    ├── Transaction History
    ├── Outstanding Balance
    ├── Create Bill
    └── Payment History
```

### Quick Sale

Built for dairy shops, sweet shops, counters and other businesses where many customers are unknown or don't need an account.

```text
Counter Sale → Enter Amount → Select Payment Method
      │
      ▼
Create Transaction
      ├── Walk-in Customer
      ├── Quick Sale Product
      ├── Quantity = 1
      └── Payment = PAID
      │
      ▼
Sales / Reports
```

The operator never has to create a customer or pick a product for a small counter sale, yet the database keeps its required relationships through the [system records](#system-records).

### Billing

```text
Customer → Daily Entries → Create Bill
      ├── Invoice Details
      ├── Products
      ├── Tax
      ├── Discount
      └── Total
      │
      ▼
Print / PDF → Mark as Paid
```

### Stock purchase

```text
Supplier → Stock Purchase
      ├── Select Products
      ├── Enter Quantities
      ├── Enter Purchase Prices
      ├── Apply Tax
      └── Record Payment Status
      │
      ▼
Stock Updated → Supplier Purchase History
```

Purchases are recorded separately from ordinary expenses because they can increase inventory.

### Expenses

```text
Expense Category → Create Expense (date · description · amount · method · notes)
      → Expense History → Expense Reports
```

### Worker payments

```text
Worker → Worker Payment (date · period · amount · method · reference)
      → Worker Payment History → Worker Reports
```

---

## 🔄 Application Updates

Application updates and business-data migrations are separate concerns.

> **Updating the application must never destroy or silently replace the business database.**

```text
New Bizora Version Released
          │
          ▼
Application Update → Start Bizora → Check Database Version
          │
          ├── Up to date ──────────────► Start App
          │
          └── Migration required
                     │
                     ▼
              Create Safety Backup
                     │
                     ▼
               Run Migrations
                     │
               ┌─────┴─────┐
            Success      Failure
               │            │
               ▼            ▼
           Start App   Restore / Stop
```

**Rules**

- The local SQLite database is persistent business data.
- Application binaries may be replaced during an update.
- Migrations are versioned through Drizzle and never assume data can be discarded.
- Back up before destructive or structural migrations where appropriate.
- A failed migration must not leave the app in an unknown state.
- New features must be backward-aware of existing database versions.
- System records are part of the data model and must be preserved. Migrations must not create duplicate `WALK_IN_CUSTOMER` or `QUICK_SALE` records for an already initialized business.

### Development workflow

```text
Change schema/code → Update Drizzle schema → Generate migration
   → Run migration → Verify database → Update business logic
   → Update UI → Test existing workflows → Update README / docs
```

Schema changes and application code should be updated together so the repository stays consistent.

---

## 🗺️ Roadmap

<details>
<summary><b>Phase 1 — Foundation</b></summary>

- [ ] Project initialization
- [ ] Next.js setup
- [ ] Electron setup
- [ ] TypeScript configuration
- [ ] Tailwind CSS
- [ ] shadcn/ui
- [ ] SQLite
- [ ] Drizzle ORM
- [ ] Database migrations

</details>

<details>
<summary><b>Phase 2 — Business Setup</b></summary>

- [ ] First-launch detection
- [ ] Country selection
- [ ] Business type
- [ ] Business setup wizard
- [ ] Business logo upload
- [ ] Business information
- [ ] Tax configuration
- [ ] Regulatory configuration
- [ ] Business settings

</details>

<details>
<summary><b>Phase 3 — Customers</b></summary>

- [ ] Customer model
- [ ] Person customer
- [ ] Business customer
- [ ] Customer list
- [ ] Customer details
- [ ] Customer transaction history
- [ ] Customer outstanding balance

</details>

<details>
<summary><b>Phase 4 — Products</b></summary>

- [ ] Product management
- [ ] Product categories
- [ ] Units
- [ ] Pricing
- [ ] Opening stock
- [ ] Stock tracking
- [ ] System product support

</details>

<details>
<summary><b>Phase 5 — Daily Operations</b></summary>

- [ ] Daily entries
- [ ] Entry items
- [ ] Customer transactions
- [ ] Payment status
- [ ] Customer ledger
- [ ] Quick Sale workflow
- [ ] Walk-in customer workflow

</details>

<details>
<summary><b>Phase 6 — Billing</b></summary>

- [ ] Invoice generation
- [ ] Invoice numbering
- [ ] Invoice preview
- [ ] PDF generation
- [ ] Invoice printing
- [ ] Mark as paid

</details>

<details>
<summary><b>Phase 7 — Stock Purchases & Suppliers</b></summary>

- [ ] Supplier management
- [ ] Stock purchase management
- [ ] Purchase items
- [ ] Purchase payment tracking
- [ ] Stock updates from purchases
- [ ] Supplier purchase history

</details>

<details>
<summary><b>Phase 8 — Expenses</b></summary>

- [ ] Expense categories
- [ ] Business expenses
- [ ] Expense payment tracking
- [ ] Expense history
- [ ] Expense reports

</details>

<details>
<summary><b>Phase 9 — Workers</b></summary>

- [ ] Worker management
- [ ] Worker details
- [ ] Worker payment tracking
- [ ] Worker payment history
- [ ] Worker reports

</details>

<details>
<summary><b>Phase 10 — Reports</b></summary>

- [ ] Daily sales
- [ ] Monthly sales
- [ ] Revenue reports
- [ ] Outstanding payments
- [ ] Customer reports
- [ ] Product reports
- [ ] Stock purchase reports
- [ ] Supplier reports
- [ ] Expense reports
- [ ] Worker payment reports
- [ ] Revenue vs expenses
- [ ] Profit overview

</details>

<details>
<summary><b>Phase 11 — Desktop Production</b></summary>

- [ ] Windows installer
- [ ] Automatic application setup
- [ ] Local database initialization
- [ ] Database migrations
- [ ] Application updates
- [ ] Backup and restore
- [ ] Production logging

</details>

<details>
<summary><b>Future</b></summary>

- [ ] macOS support
- [ ] Linux support
- [ ] Thermal printer support
- [ ] Automatic backups
- [ ] Data export
- [ ] Additional business types
- [ ] Advanced reporting
- [ ] Additional country configurations

</details>

---

## 🔒 Data & Privacy

Bizora is local-first. The core business database is stored on the user's computer, and no cloud database or hosted backend is needed for core functionality. Businesses keep their operational data locally and can use core features without an internet connection.

> Users are responsible for maintaining backups of their local business data.

---

## 🎯 Project Goal

> **Give small businesses professional business-management tools without forcing them to manage servers, databases, hosting or complicated software infrastructure.**

The project starts with workflows for small dairy businesses while keeping the architecture generic enough for other businesses and countries.

| Simple | Local | Flexible |
|---|---|---|
| Owners can install Bizora and start without technical knowledge. | Core operations and data work locally with no hosted backend. | Tax, food-safety and regulatory requirements are configurable, not hard-coded. |

---

## 👨‍💻 Development

Bizora is under active development. The architecture, database schema, UI and feature set may change as the project evolves.

## 📄 License

License information will be added as the project progresses.
