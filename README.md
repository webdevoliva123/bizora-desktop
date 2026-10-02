# Bizora

> **Your Business, Simplified.**

Bizora is a **local-first business management and billing application** built for small businesses that want to manage their daily operations without depending on cloud hosting, external servers, or expensive infrastructure.

Bizora runs locally on the business owner's computer, keeping business data and core operations available without requiring a separately hosted backend or online database.

The platform is designed to be **country-aware**, allowing businesses to configure their own tax, food-safety, and regulatory information based on their location.

---

## 🚀 Overview

Small businesses often need billing, customer management, inventory tracking, and business reports, but maintaining an online application can introduce unnecessary hosting, database, and maintenance costs.

**Bizora is designed to solve that problem.**

The application is packaged as a desktop application that can be installed and used locally with minimal technical setup.

The goal is simple:

> **Install Bizora → Set up your business → Start managing your business.**

No server configuration.
No database installation.
No terminal commands.
No complicated deployment process.

---

## ✨ Features

### 🌍 Country-Aware Business Setup

Bizora does not hard-code country-specific requirements such as FSSAI or GSTIN.

During setup, the business selects its country and configures the regulatory information relevant to that country.

Business setup can include:

* Country
* Business name
* Business logo
* Business address
* City
* State / Region
* Postal code
* Contact information
* Business type
* Tax information
* Food-safety information
* Other business registrations

This allows Bizora to support businesses in different countries without changing the core application.

---

### 🏢 Business Setup

Set up your business during the first launch.

Example:

```text
Business Name
Business Logo
Country
Business Type
Address
City
State / Region
Postal Code
Phone
Email
```

Additional information can be configured based on the selected country and business type.

---

### 🧾 Tax Information

Tax information is configurable rather than tied to a single country's terminology.

Example:

```text
Tax System
Tax Registration Number
Tax Registered
Tax Rate
```

The application can adapt the terminology based on the business's country.

For example:

```text
India
GST
GSTIN

New Zealand
GST
GST Number
```

The underlying system is designed to support additional tax systems in the future.

---

### 🛡️ Regulatory & Food-Safety Information

Businesses operating in regulated industries can configure their relevant authority and registration information.

Instead of hard-coding fields such as:

```text
FSSAI Number
```

Bizora uses a generic structure:

```text
Authority / Department
Registration Type
Registration Number
Issue Date
Expiry Date
```

For example, an Indian food business may configure:

```text
Authority:
FSSAI

Registration Type:
Food Business Licence

Registration Number:
XXXXXXXXXXXXXX
```

A New Zealand business may configure the appropriate authority and registration details applicable to its business.

This approach allows Bizora to support different regulatory systems without tying the product to a specific country.

---

### 👥 Customer Management

Manage both individual and business customers.

#### Individual Customer

* First name
* Last name
* Phone
* Email
* Address
* Location details
* Customer transaction history

#### Business Customer

* Business name
* Contact person
* Phone
* Email
* Tax registration details
* Business address
* Business transaction history

---

### 📦 Product Management

Manage products, pricing, units, and inventory.

Bizora initially focuses on common dairy products such as:

* Milk
* Curd
* Tofu
* Paneer
* Other dairy products

The product system is intentionally generic so the platform can later support:

* Grocery businesses
* Bakeries
* Cafes
* Restaurants
* Small retailers
* Wholesalers
* Other small businesses

---

### 📋 Daily Entries

Record daily business transactions quickly.

* Create daily entries
* Select customers
* Add multiple products
* Set quantities
* Calculate totals
* Apply discounts
* Track payment status
* View previous entries

---

### 🧾 Billing

Create bills directly from customer transactions.

* Generate invoices
* Invoice numbering
* Customer information
* Product details
* Quantity and pricing
* Tax calculation
* Discounts
* Payment status
* Print invoices
* Generate PDF invoices

---

### 💰 Payment Tracking

Keep track of customer payments and outstanding amounts.

* Paid
* Unpaid
* Partially paid
* Outstanding balance
* Customer payment history
* Mark invoice as paid

---

### 📊 Reports

Understand the business through simple reports.

Planned reports include:

* Daily sales
* Monthly sales
* Total revenue
* Outstanding payments
* Customer sales
* Product sales
* Payment reports
* Business overview

---

### 💾 Local-First Architecture

Bizora is designed to work locally.

Business data is stored on the user's computer rather than requiring a hosted database.

Benefits include:

* No monthly hosting cost
* No external database required
* Core functionality available without internet
* Fast local data access
* Greater control over business data
* Simple deployment

---

### 🔐 Backup & Restore

Because the application stores business data locally, backups are an important part of Bizora.

Planned functionality:

* Manual database backup
* Automatic backups
* Backup history
* Restore from backup
* Export business data

---

## 🖥️ Application Architecture

Bizora is designed as a single application and repository.

```text
                    ┌─────────────────────┐
                    │       Electron      │
                    │     Desktop App     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Next.js        │
                    │                     │
                    │        SSR          │
                    │   Server Actions    │
                    │   Route Handlers    │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
          ┌─────────────┐             ┌─────────────┐
          │  shadcn/ui  │             │   Drizzle   │
          │  Tailwind   │             │     ORM     │
          └─────────────┘             └──────┬──────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │   SQLite    │
                                      │  Local DB   │
                                      └─────────────┘
```

### Architecture Principles

* Single repository
* Single desktop application
* Local-first
* No separately hosted backend
* Local SQLite database
* Type-safe database access
* Server-side rendering
* Component-based UI
* Automated application setup
* Country-aware configuration
* Extensible regulatory and tax models

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### Desktop

* Electron

### Backend / Server

* Next.js Server Actions
* Next.js Route Handlers
* Node.js runtime

### Database

* SQLite
* Drizzle ORM
* Drizzle Kit

### Development

* TypeScript
* ESLint
* Git
* GitHub

---

## 📁 Planned Project Structure

```text
bizora/
│
├── app/
│   ├── login/
│   ├── setup/
│   │   ├── business/
│   │   ├── tax/
│   │   ├── regulatory/
│   │   ├── customers/
│   │   └── products/
│   │
│   ├── dashboard/
│   ├── daily-entries/
│   ├── customers/
│   ├── products/
│   └── reports/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── customers/
│   ├── products/
│   ├── billing/
│   └── reports/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── validations/
│   └── utilities/
│
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   └── updater.ts
│
├── drizzle/
│   └── migrations/
│
├── scripts/
│   ├── setup.ts
│   ├── migrate.ts
│   └── backup.ts
│
├── public/
│
├── package.json
├── next.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── README.md
```

> The project structure may evolve as Bizora develops.

---

## 🧭 Application Flow

The first launch is designed around a simple setup wizard.

```text
Install Bizora
      │
      ▼
Welcome
      │
      ▼
Country & Business
      │
      ├── Country
      ├── Business Type
      └── Business Information
      │
      ▼
Tax Information
      │
      ├── Tax System
      └── Tax Registration
      │
      ▼
Regulatory Information*
      │
      ├── Authority / Department
      ├── Registration Type
      └── Registration Number
      │
      ▼
Customer Setup
      │
      ├── Person
      └── Business
      │
      ▼
Product Setup
      │
      ├── Product
      ├── Unit
      ├── Price
      └── Opening Stock
      │
      ▼
Setup Complete 🎉
      │
      ▼
Dashboard
```

`*` Regulatory information can be shown based on the selected country and business type.

---

## 🌍 Country-Aware Design

A core principle of Bizora is to avoid hard-coding country-specific concepts into the business model.

For example, instead of creating database fields such as:

```text
fssai_number
gst_number
nzbn_number
abn_number
```

Bizora uses extensible models such as:

```text
business_registrations
```

Example structure:

```text
business_registrations
────────────────────────────
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

Similarly, tax information can be represented through configurable tax registrations rather than country-specific database columns.

This allows the same core application to support businesses in different countries while presenting locally relevant terminology to the user.

---

## 📌 Main Navigation

Bizora keeps the main navigation intentionally simple.

```text
Dashboard
Daily Entries
Customers
Products
Reports
Settings
```

The goal is to make the application usable by business owners without requiring technical knowledge.

---

## 🏠 Dashboard

The dashboard provides a quick overview of the business.

Planned information includes:

```text
Today's Sales
Today's Entries
Outstanding Amount
Recent Transactions
Sales Overview
Top Products
Recent Customers
```

The dashboard is designed to answer one simple question:

> **How is my business doing today?**

---

## 📋 Daily Entries

Daily Entries is the core operational workflow.

A business can:

```text
Select Customer
      ↓
Select Products
      ↓
Enter Quantities
      ↓
Calculate Total
      ↓
Set Payment Status
      ↓
Save Entry
```

Each entry becomes part of the customer's transaction history and can be used to generate a bill.

---

## 👥 Customer Workflow

```text
Customers
    │
    ├── Customer List
    │
    └── Customer Details
            │
            ├── Customer Information
            ├── Transaction History
            ├── Outstanding Balance
            ├── Create Bill
            └── Payment History
```

---

## 🧾 Billing Workflow

```text
Customer
    │
    ▼
Daily Entries
    │
    ▼
Create Bill
    │
    ├── Invoice Details
    ├── Products
    ├── Tax
    ├── Discount
    └── Total
    │
    ▼
Print / PDF
    │
    ▼
Mark as Paid
```

---

## 🗺️ Roadmap

### Phase 1 — Foundation

* [ ] Project initialization
* [ ] Next.js setup
* [ ] Electron setup
* [ ] TypeScript configuration
* [ ] Tailwind CSS
* [ ] shadcn/ui
* [ ] SQLite
* [ ] Drizzle ORM
* [ ] Database migrations

### Phase 2 — Business Setup

* [ ] First-launch detection
* [ ] Country selection
* [ ] Business type
* [ ] Business setup wizard
* [ ] Business logo upload
* [ ] Business information
* [ ] Tax configuration
* [ ] Regulatory configuration
* [ ] Business settings

### Phase 3 — Customers

* [ ] Customer model
* [ ] Person customer
* [ ] Business customer
* [ ] Customer list
* [ ] Customer details
* [ ] Customer transaction history
* [ ] Customer outstanding balance

### Phase 4 — Products

* [ ] Product management
* [ ] Product categories
* [ ] Units
* [ ] Pricing
* [ ] Opening stock
* [ ] Stock tracking

### Phase 5 — Daily Operations

* [ ] Daily entries
* [ ] Entry items
* [ ] Customer transactions
* [ ] Payment status
* [ ] Customer ledger

### Phase 6 — Billing

* [ ] Invoice generation
* [ ] Invoice numbering
* [ ] Invoice preview
* [ ] PDF generation
* [ ] Invoice printing
* [ ] Mark as paid

### Phase 7 — Reports

* [ ] Daily sales
* [ ] Monthly sales
* [ ] Revenue reports
* [ ] Outstanding payments
* [ ] Customer reports
* [ ] Product reports

### Phase 8 — Desktop Production

* [ ] Windows installer
* [ ] Automatic application setup
* [ ] Local database initialization
* [ ] Database migrations
* [ ] Application updates
* [ ] Backup and restore
* [ ] Production logging

### Future

* [ ] macOS support
* [ ] Linux support
* [ ] Thermal printer support
* [ ] Automatic backups
* [ ] Data export
* [ ] Additional business types
* [ ] Advanced reporting
* [ ] Additional country configurations

---

## 🔒 Data & Privacy

Bizora follows a local-first approach.

The core business database is stored locally on the user's computer. Bizora does not require a cloud database or hosted backend for its core functionality.

This allows businesses to maintain their operational data locally and use core functionality without an internet connection.

Users are responsible for maintaining backups of their local business data.

---

## 🎯 Project Goal

Bizora is being built with a simple objective:

> **Give small businesses professional business-management tools without forcing them to manage servers, databases, hosting, or complicated software infrastructure.**

The project starts with common workflows for small dairy businesses while keeping the underlying architecture generic enough to support other businesses and countries.

The platform is designed around three principles:

```text
Simple
Local
Flexible
```

### Simple

Business owners should be able to install Bizora and start using it without technical knowledge.

### Local

Core business operations and data should work locally without requiring a hosted backend.

### Flexible

Country-specific tax, food-safety, and regulatory requirements should be configurable rather than hard-coded into the application.

---

## 📄 License

License information will be added as the project progresses.

---

## 👨‍💻 Development

Bizora is actively under development.

The architecture, database schema, UI, and feature set may change during development as the project evolves.
