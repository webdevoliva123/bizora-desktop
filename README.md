\# Bizora



\<p align="center">

&#x20; \<img src="./public/platform-assets/platform-logo.png" alt="Bizora" width="220" />

\</p>



\> \*\*Your Business, Simplified.\*\*



Bizora is a \*\*local-first business management and billing application\*\* built for small businesses that want to manage their daily operations without depending on cloud hosting, external servers, or expensive infrastructure.



Bizora runs locally on the business owner's computer, keeping business data and core operations available without requiring a separately hosted backend or online database.



The platform is designed to be \*\*country-aware\*\*, allowing businesses to configure their own tax, food-safety, and regulatory information based on their location.



\---



\## 🚀 Overview



Small businesses often need billing, customer management, inventory tracking, and business reports, but maintaining an online application can introduce unnecessary hosting, database, and maintenance costs.



\*\*Bizora is designed to solve that problem.\*\*



The application is packaged as a desktop application that can be installed and used locally with minimal technical setup.



The goal is simple:



\> \*\*Install Bizora → Set up your business → Start managing your business.\*\*



No server configuration.

No database installation.

No terminal commands.

No complicated deployment process.



\---



\## ✨ Features



\### 🌍 Country-Aware Business Setup



Bizora does not hard-code country-specific requirements such as FSSAI or GSTIN.



During setup, the business selects its country and configures the regulatory information relevant to that country.



Business setup can include:



\* Country

\* Business name

\* Business logo

\* Business address

\* City

\* State / Region

\* Postal code

\* Contact information

\* Business type

\* Tax information

\* Food-safety information

\* Other business registrations



This allows Bizora to support businesses in different countries without changing the core application.



\---



\### 🏢 Business Setup



Set up your business during the first launch.



Example:



\`\`\`text

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

\`\`\`



Additional information can be configured based on the selected country and business type.



\---



\### 🧾 Tax Information



Tax information is configurable rather than tied to a single country's terminology.



Example:



\`\`\`text

Tax System

Tax Registration Number

Tax Registered

Tax Rate

\`\`\`



The application can adapt the terminology based on the business's country.



For example:



\`\`\`text

India

GST

GSTIN



New Zealand

GST

GST Number

\`\`\`



The underlying system is designed to support additional tax systems in the future.



\---



\### 🛡️ Regulatory & Food-Safety Information



Businesses operating in regulated industries can configure their relevant authority and registration information.



Instead of hard-coding fields such as:



\`\`\`text

FSSAI Number

\`\`\`



Bizora uses a generic structure:



\`\`\`text

Authority / Department

Registration Type

Registration Number

Issue Date

Expiry Date

\`\`\`



For example, an Indian food business may configure:



\`\`\`text

Authority:

FSSAI



Registration Type:

Food Business Licence



Registration Number:

XXXXXXXXXXXXXX

\`\`\`



A New Zealand business may configure the appropriate authority and registration details applicable to its business.



This approach allows Bizora to support different regulatory systems without tying the product to a specific country.



\---



\### 👥 Customer Management



Manage both individual and business customers.



\#### Individual Customer



\* First name

\* Last name

\* Phone

\* Email

\* Address

\* Location details

\* Customer transaction history



\#### Business Customer



\* Business name

\* Contact person

\* Phone

\* Email

\* Tax registration details

\* Business address

\* Business transaction history



\---



\### 📦 Product Management



Manage products, pricing, units, and inventory.



Bizora initially focuses on common dairy products such as:



\* Milk

\* Curd

\* Tofu

\* Paneer

\* Other dairy products



The product system is intentionally generic so the platform can later support:



\* Grocery businesses

\* Bakeries

\* Cafes

\* Restaurants

\* Small retailers

\* Wholesalers

\* Other small businesses



\---



\### 📋 Daily Entries



Record daily business transactions quickly.



\* Create daily entries

\* Select customers

\* Add multiple products

\* Set quantities

\* Calculate totals

\* Apply discounts

\* Track payment status

\* View previous entries



\---



\### 🧾 Billing



Create bills directly from customer transactions.



\* Generate invoices

\* Invoice numbering

\* Customer information

\* Product details

\* Quantity and pricing

\* Tax calculation

\* Discounts

\* Payment status

\* Print invoices

\* Generate PDF invoices



\---



\### 🛒 Stock Purchases & Inventory Purchasing



Track products and materials purchased from suppliers and understand how stock enters the business.



Businesses can record:



\* Purchase date

\* Supplier

\* Products purchased

\* Quantity

\* Unit price

\* Tax

\* Purchase total

\* Payment status

\* Payment method

\* Payment date

\* Payment reference

\* Notes



A single purchase can contain multiple products.



Example:



\`\`\`text

15 September 2026



Supplier:

ABC Foods



Items:

Milk       50 litres

Paneer     20 kg

Curd       30 kg



Purchase Total:

₹12,000

\`\`\`



Stock purchases are kept separate from general business expenses because they affect inventory.



\---



\### 🏢 Supplier Management



Manage the businesses and people from whom products or materials are purchased.



Supplier information can include:



\* Supplier name

\* Contact person

\* Phone

\* Email

\* Tax registration number

\* Address

\* Notes

\* Active / inactive status



Supplier history can later be used to understand purchasing activity and supplier spending.



\---



\### 💸 Expense Management



Track business expenses that are not directly recorded as stock purchases.



Examples include:



\* Rent

\* Electricity

\* Transport

\* Repairs

\* Maintenance

\* Packaging

\* Equipment

\* Other operating expenses



Each expense can contain:



\* Expense date

\* Expense category

\* Description

\* Amount

\* Payment method

\* Reference

\* Notes



Businesses can maintain their own expense categories.



\---



\### 👷 Worker Management



Bizora includes lightweight worker management designed for small businesses.



It intentionally avoids complex HR functionality because many small businesses have only a few workers.



Worker information can include:



\* Worker name

\* Phone

\* Email

\* Role / job

\* Joining date

\* Payment type

\* Default payment amount

\* Address

\* Notes

\* Active / inactive status



\---



\### 💵 Worker Payments



Track payments made to workers separately from general business expenses.



Each payment can include:



\* Worker

\* Payment date

\* Payment period

\* Amount

\* Payment method

\* Payment reference

\* Notes



This makes it possible to see how much a business paid its workers during a particular week or month.



\---



\### 💰 Payment Details on Bills



Businesses can configure their payment information once and display it directly on invoices.



Supported information can include:



\* Bank name

\* Account name

\* Account number

\* Branch

\* Routing / bank code

\* Payment identifier

\* Payment QR

\* Payment instructions



Bizora does \*\*not\*\* require a payment gateway for this workflow.



The invoice simply shows the business's configured payment details. Customers can scan the QR code and enter the invoice amount in their payment application, or use the displayed bank details.



Payment details are snapshotted on invoices so that changing the business's payment information later does not alter previously generated invoices.



\---



\### 💰 Payment Tracking



Keep track of customer payments and outstanding amounts.



\* Paid

\* Unpaid

\* Partially paid

\* Outstanding balance

\* Customer payment history

\* Mark invoice as paid



\---



\### 📊 Reports



Understand the business through simple reports.



Planned reports include:



\* Daily sales

\* Monthly sales

\* Total revenue

\* Outstanding payments

\* Customer sales

\* Product sales

\* Payment reports

\* Stock purchase reports

\* Supplier purchase reports

\* Expense reports

\* Worker payment reports

\* Business overview

\* Revenue vs expenses

\* Purchase vs sales

\* Profit overview



\---



\### 💾 Local-First Architecture



Bizora is designed to work locally.



Business data is stored on the user's computer rather than requiring a hosted database.



Benefits include:



\* No monthly hosting cost

\* No external database required

\* Core functionality available without internet

\* Fast local data access

\* Greater control over business data

\* Simple deployment



\---



\### 🔐 Backup & Restore



Because the application stores business data locally, backups are an important part of Bizora.



Planned functionality:



\* Manual database backup

\* Automatic backups

\* Backup history

\* Restore from backup

\* Export business data



\---



\## 🖥️ Application Architecture



Bizora is designed as a single application and repository.



\`\`\`text

&#x20;                   ┌─────────────────────┐

&#x20;                   │       Electron      │

&#x20;                   │     Desktop App     │

&#x20;                   └──────────┬──────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌─────────────────────┐

&#x20;                   │      Next.js        │

&#x20;                   │                     │

&#x20;                   │        SSR          │

&#x20;                   │   Server Actions    │

&#x20;                   │   Route Handlers    │

&#x20;                   └──────────┬──────────┘

&#x20;                              │

&#x20;                ┌─────────────┴─────────────┐

&#x20;                │                           │

&#x20;                ▼                           ▼

&#x20;         ┌─────────────┐             ┌─────────────┐

&#x20;         │  shadcn/ui  │             │   Drizzle   │

&#x20;         │  Tailwind   │             │     ORM     │

&#x20;         └─────────────┘             └──────┬──────┘

&#x20;                                            │

&#x20;                                            ▼

&#x20;                                     ┌─────────────┐

&#x20;                                     │   SQLite    │

&#x20;                                     │  Local DB   │

&#x20;                                     └─────────────┘

\`\`\`



\### Architecture Principles



\* Single repository

\* Single desktop application

\* Local-first

\* No separately hosted backend

\* Local SQLite database

\* Type-safe database access

\* Server-side rendering

\* Component-based UI

\* Automated application setup

\* Country-aware configuration

\* Extensible regulatory and tax models



\---



\## 🖼️ Project Images



GitHub supports images directly inside Markdown. Bizora can use repository assets without requiring an external image host.



Example:



\`\`\`md

![Bizora]\(.public/platform-assets/platform-logo.png)

\`\`\`



The repository currently keeps platform branding under:



\`\`\`text

platform-assets/

├── platform-logo.png

├── platform-tp-logo.png

├── platform-app-icon.png

└── platform-tp-app-icon.png

\`\`\`



Using relative paths keeps README images available directly from the repository and avoids depending on external image hosting.



\---



\## 🛠️ Tech Stack



\### Frontend



\* Next.js

\* React

\* TypeScript

\* Tailwind CSS

\* shadcn/ui



\### Desktop



\* Electron



\### Backend / Server



\* Next.js Server Actions

\* Next.js Route Handlers

\* Node.js runtime



\### Database



\* SQLite

\* Drizzle ORM

\* Drizzle Kit



\### Development



\* TypeScript

\* ESLint

\* Git

\* GitHub



\---



\## 📁 Planned Project Structure



\`\`\`text

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

│   ├── stock-purchases/

│   ├── suppliers/

│   ├── expenses/

│   ├── workers/

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

\`\`\`



\> The project structure may evolve as Bizora develops.



\---



\## 🧭 Application Flow



The first launch is designed around a simple setup wizard.



\`\`\`text

Install Bizora

&#x20;     │

&#x20;     ▼

Welcome

&#x20;     │

&#x20;     ▼

Country & Business

&#x20;     │

&#x20;     ├── Country

&#x20;     ├── Business Type

&#x20;     └── Business Information

&#x20;     │

&#x20;     ▼

Tax Information

&#x20;     │

&#x20;     ├── Tax System

&#x20;     └── Tax Registration

&#x20;     │

&#x20;     ▼

Regulatory Information\*

&#x20;     │

&#x20;     ├── Authority / Department

&#x20;     ├── Registration Type

&#x20;     └── Registration Number

&#x20;     │

&#x20;     ▼

Payment Details

&#x20;     │

&#x20;     ├── Bank Details

&#x20;     ├── Payment Identifier

&#x20;     ├── Payment QR

&#x20;     └── Payment Instructions

&#x20;     │

&#x20;     ▼

Customer Setup

&#x20;     │

&#x20;     ├── Person

&#x20;     └── Business

&#x20;     │

&#x20;     ▼

Product Setup

&#x20;     │

&#x20;     ├── Product

&#x20;     ├── Unit

&#x20;     ├── Price

&#x20;     └── Opening Stock

&#x20;     │

&#x20;     ▼

Setup Complete 🎉

&#x20;     │

&#x20;     ▼

Dashboard

\`\`\`



\`\*\` Regulatory information can be shown based on the selected country and business type.



\---



\## 🧩 Setup Finalization Workflow

The setup wizard collects the business configuration and user-defined customers/products. Finalization is handled centrally by the setup persistence layer.

```text
Setup Wizard
     │
     ├── Business Information
     ├── Tax Information
     ├── Regulatory Information
     ├── Payment Details
     ├── User Customers
     └── User Products
     │
     ▼
Transactional Setup Save
     │
     ├── Create Business
     ├── Save Tax / Regulatory Data
     ├── Save Payment Details
     ├── Create User Customers
     ├── Create User Products
     ├── Create Walk-in Customer
     └── Create Quick Sale Product
     │
     ▼
Mark Setup Complete
     │
     ▼
Dashboard
```

Setup finalization is transactional so the database should not be considered successfully initialized until the complete setup operation succeeds.

The setup-created system records are:

* `WALK_IN_CUSTOMER`
* `QUICK_SALE`

They are not added to the setup wizard's customer/product input lists because they are application-owned records rather than user-created business records.

## 🌍 Country-Aware Design



A core principle of Bizora is to avoid hard-coding country-specific concepts into the business model.



For example, instead of creating database fields such as:



\`\`\`text

fssai_number

gst_number

nzbn_number

abn_number

\`\`\`



Bizora uses extensible models such as:



\`\`\`text

business_registrations

\`\`\`



Example structure:



\`\`\`text

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

\`\`\`



Similarly, tax information can be represented through configurable tax registrations rather than country-specific database columns.



This allows the same core application to support businesses in different countries while presenting locally relevant terminology to the user.



\---



\## 📌 Main Navigation



Bizora keeps the main navigation intentionally simple.



\`\`\`text

Dashboard

Daily Entries

Customers

Products

Stock Purchases

Suppliers

Expenses

Workers

Reports

Settings

\`\`\`



The goal is to make the application usable by business owners without requiring technical knowledge.



\---



\## ⚙️ Settings



Settings contains business configuration and management options that do not need to be part of the daily operational navigation.



Planned settings tabs include:



\`\`\`text

Settings

├── Business

├── Tax & Registrations

├── Payment Details

├── Invoice & Billing

├── Expense Categories

├── Product Categories

├── Data & Backup

└── Application

\`\`\`



This keeps the main navigation focused on daily business operations while configuration remains centralized in Settings.



\---



\## 🏠 Dashboard



The dashboard provides a quick overview of the business.



Planned information includes:



\`\`\`text

Today's Sales

Today's Entries

Outstanding Amount

Recent Transactions

Sales Overview

Top Products

Recent Customers

Low Stock Items

Recent Purchases

Recent Expenses

Worker Payments

Revenue vs Expenses

\`\`\`



The dashboard is designed to answer one simple question:



\> \*\*How is my business doing today?\*\*



\---



\## 📋 Daily Entries



Daily Entries is the core operational workflow.



A business can:



\`\`\`text

Select Customer

&#x20;     ↓

Select Products

&#x20;     ↓

Enter Quantities

&#x20;     ↓

Calculate Total

&#x20;     ↓

Set Payment Status

&#x20;     ↓

Save Entry

\`\`\`



Each entry becomes part of the customer's transaction history and can be used to generate a bill.



\---



\## 🔄 Business Workflow



Bizora is designed around the complete day-to-day business cycle:



\`\`\`text

&#x20;                   ┌─────────────────┐

&#x20;                   │     Business    │

&#x20;                   │      Setup      │

&#x20;                   └────────┬────────┘

&#x20;                            │

&#x20;         ┌──────────────────┼──────────────────┐

&#x20;         ▼                  ▼                  ▼

&#x20;    Customers           Products           Suppliers

&#x20;         │                  │                  │

&#x20;         │                  │                  │

&#x20;         ▼                  ▼                  ▼

&#x20;    Daily Sales       Stock / Inventory    Purchases

&#x20;         │                  ▲                  │

&#x20;         ▼                  │                  │

&#x20;      Invoices             │                  │

&#x20;         │                  │                  │

&#x20;         ▼                  │                  │

&#x20;     Payments              │                  │

&#x20;                            │                  │

&#x20;                            └──────────────────┘



&#x20;         ┌─────────────────────────────────────┐

&#x20;         │           Business Expenses        │

&#x20;         └──────────────────┬──────────────────┘

&#x20;                            │

&#x20;                            ▼

&#x20;                   Expense Categories



&#x20;         ┌─────────────────────────────────────┐

&#x20;         │              Workers                │

&#x20;         └──────────────────┬──────────────────┘

&#x20;                            │

&#x20;                            ▼

&#x20;                    Worker Payments



&#x20;                            │

&#x20;                            ▼

&#x20;                       ┌─────────┐

&#x20;                       │ Reports │

&#x20;                       └─────────┘

\`\`\`



The platform therefore tracks the major flows of a small business:



\`\`\`text

Sales

&#x20; ↓

Revenue



Purchases

&#x20; ↓

Inventory



Expenses

&#x20; ↓

Operating Costs



Worker Payments

&#x20; ↓

Labour Costs



Revenue - Business Costs

&#x20; ↓

Business Overview / Profit

\`\`\`



\## 👥 Customer Workflow



\`\`\`text

Customers

&#x20;   │

&#x20;   ├── Customer List

&#x20;   │

&#x20;   └── Customer Details

&#x20;           │

&#x20;           ├── Customer Information

&#x20;           ├── Transaction History

&#x20;           ├── Outstanding Balance

&#x20;           ├── Create Bill

&#x20;           └── Payment History

\`\`\`



\---



\## ⚡ Quick Sale Workflow

Quick Sale is designed for dairy shops, sweet shops, counters, and other small businesses where many customers may be unknown or do not need a customer account.

```text
Counter Sale
     │
     ▼
Enter Amount
     │
     ▼
Select Payment Method
     │
     ▼
Create Transaction
     │
     ├── Walk-in Customer
     │
     ├── Quick Sale Product
     │
     ├── Quantity = 1
     │
     └── Payment = PAID
     │
     ▼
Sales / Reports
```

The workflow deliberately avoids forcing the operator to create a customer or select a product for every small counter transaction.

The database still keeps the required customer and product relationships by using the dedicated system records described in the **System Records** section.

---

## 🧾 Billing Workflow



\`\`\`text

Customer

&#x20;   │

&#x20;   ▼

Daily Entries

&#x20;   │

&#x20;   ▼

Create Bill

&#x20;   │

&#x20;   ├── Invoice Details

&#x20;   ├── Products

&#x20;   ├── Tax

&#x20;   ├── Discount

&#x20;   └── Total

&#x20;   │

&#x20;   ▼

Print / PDF

&#x20;   │

&#x20;   ▼

Mark as Paid

\`\`\`



\---



\---



\## 🛒 Stock Purchase Workflow



\`\`\`text

Supplier

&#x20;  │

&#x20;  ▼

Stock Purchase

&#x20;  │

&#x20;  ├── Select Products

&#x20;  ├── Enter Quantities

&#x20;  ├── Enter Purchase Prices

&#x20;  ├── Apply Tax

&#x20;  └── Record Payment Status

&#x20;  │

&#x20;  ▼

Stock Updated

&#x20;  │

&#x20;  ▼

Supplier Purchase History

\`\`\`



Stock purchases are recorded separately from ordinary expenses because purchased products can increase inventory.



\---



\## 💸 Expense Workflow



\`\`\`text

Expense Category

&#x20;      │

&#x20;      ▼

Create Expense

&#x20;      │

&#x20;      ├── Date

&#x20;      ├── Description

&#x20;      ├── Amount

&#x20;      ├── Payment Method

&#x20;      └── Notes

&#x20;      │

&#x20;      ▼

Expense History

&#x20;      │

&#x20;      ▼

Expense Reports

\`\`\`



\---



\## 👷 Worker Payment Workflow



\`\`\`text

Worker

&#x20;  │

&#x20;  ▼

Worker Payment

&#x20;  │

&#x20;  ├── Payment Date

&#x20;  ├── Payment Period

&#x20;  ├── Amount

&#x20;  ├── Payment Method

&#x20;  └── Reference

&#x20;  │

&#x20;  ▼

Worker Payment History

&#x20;  │

&#x20;  ▼

Worker Reports

\`\`\`



\---



\## 🗄️ Transaction & Data Rules

Bizora keeps operational data relational and explicit.

### Required Transaction Relationships

Normal daily entries keep required references to:

```text
daily_entries
    └── customer_id → customers.id

daily_entry_items
    └── product_id → products.id
```

These relationships are intentionally not nullable for the Quick Sale workflow.

Instead, Quick Sale uses the setup-created system records.

### System Record Visibility

```text
customers
├── Normal customers → visible in customer management
└── System customers → hidden from normal management

products
├── Normal products → visible in product management
└── System products → hidden from normal management
```

System records should be filtered out of:

* Customer lists
* Product lists
* Normal customer selectors
* Normal product selectors
* Customer-facing ledgers where a real customer is expected

System records may still be used by internal transaction creation and reporting.

### Transaction History

Once a sale has been recorded, the transaction is treated as business history. User-interface visibility rules for system records must not remove the underlying transaction from sales reports.

---

## 🗺️ Roadmap



\### Phase 1 — Foundation



\* [ ] Project initialization

\* [ ] Next.js setup

\* [ ] Electron setup

\* [ ] TypeScript configuration

\* [ ] Tailwind CSS

\* [ ] shadcn/ui

\* [ ] SQLite

\* [ ] Drizzle ORM

\* [ ] Database migrations



\### Phase 2 — Business Setup



\* [ ] First-launch detection

\* [ ] Country selection

\* [ ] Business type

\* [ ] Business setup wizard

\* [ ] Business logo upload

\* [ ] Business information

\* [ ] Tax configuration

\* [ ] Regulatory configuration

\* [ ] Business settings



\### Phase 3 — Customers



\* [ ] Customer model

\* [ ] Person customer

\* [ ] Business customer

\* [ ] Customer list

\* [ ] Customer details

\* [ ] Customer transaction history

\* [ ] Customer outstanding balance



\### Phase 4 — Products



\* [ ] Product management

\* [ ] Product categories

\* [ ] Units

\* [ ] Pricing

\* [ ] Opening stock

\* [ ] Stock tracking
* [ ] System product support



\### Phase 5 — Daily Operations



\* [ ] Daily entries

\* [ ] Entry items

\* [ ] Customer transactions

\* [ ] Payment status

\* [ ] Customer ledger
* [ ] Quick Sale workflow
* [ ] Walk-in customer workflow



\### Phase 6 — Billing



\* [ ] Invoice generation

\* [ ] Invoice numbering

\* [ ] Invoice preview

\* [ ] PDF generation

\* [ ] Invoice printing

\* [ ] Mark as paid



\### Phase 7 — Stock Purchases & Suppliers



\* [ ] Supplier management

\* [ ] Stock purchase management

\* [ ] Purchase items

\* [ ] Purchase payment tracking

\* [ ] Stock updates from purchases

\* [ ] Supplier purchase history



\### Phase 8 — Expenses



\* [ ] Expense categories

\* [ ] Business expenses

\* [ ] Expense payment tracking

\* [ ] Expense history

\* [ ] Expense reports



\### Phase 9 — Workers



\* [ ] Worker management

\* [ ] Worker details

\* [ ] Worker payment tracking

\* [ ] Worker payment history

\* [ ] Worker reports



\### Phase 10 — Reports



\* [ ] Daily sales

\* [ ] Monthly sales

\* [ ] Revenue reports

\* [ ] Outstanding payments

\* [ ] Customer reports

\* [ ] Product reports

\* [ ] Stock purchase reports

\* [ ] Supplier reports

\* [ ] Expense reports

\* [ ] Worker payment reports

\* [ ] Revenue vs expenses

\* [ ] Profit overview



\## 🔄 Application Update Workflow

Bizora is a local-first desktop application, so application updates and business-data migrations are separate concerns.

The update workflow is designed around this principle:

> **Updating the application must not destroy or silently replace the business database.**

Expected update flow:

```text
New Bizora Version Released
          │
          ▼
Application Update
          │
          ▼
Start Bizora
          │
          ▼
Check Database Version
          │
          ├── Database Up to Date
          │        │
          │        ▼
          │     Start App
          │
          └── Migration Required
                   │
                   ▼
            Create Safety Backup
                   │
                   ▼
             Run Migrations
                   │
             ┌─────┴─────┐
             │           │
          Success      Failure
             │           │
             ▼           ▼
          Start App   Restore / Stop
```

Application updates should follow these rules:

* The local SQLite database is treated as persistent business data.
* Application binaries may be replaced during an update.
* Database migrations must be versioned through Drizzle migrations.
* A migration should never assume that business data can be discarded.
* Database backup should happen before destructive or structural migrations where appropriate.
* Failed migrations must not leave the application in an unknown state.
* New application features should be backward-aware of existing database versions.
* Setup-created system records are part of the application's data model and must be preserved during future updates.
* Future migrations must not recreate duplicate `WALK_IN_CUSTOMER` or `QUICK_SALE` records for an already initialized business.

### Development Update Workflow

When changing Bizora during development:

```text
Change Schema / Code
        │
        ▼
Update Drizzle Schema
        │
        ▼
Generate Migration
        │
        ▼
Run Migration
        │
        ▼
Verify Database
        │
        ▼
Update Business Logic
        │
        ▼
Update UI
        │
        ▼
Test Existing Workflows
        │
        ▼
Update README / Architecture Docs
```

For schema changes, the database and application code should be updated together so the repository remains internally consistent.

### Phase 11 — Desktop Production



\* [ ] Windows installer

\* [ ] Automatic application setup

\* [ ] Local database initialization

\* [ ] Database migrations

\* [ ] Application updates

\* [ ] Backup and restore

\* [ ] Production logging



\### Future



\* [ ] macOS support

\* [ ] Linux support

\* [ ] Thermal printer support

\* [ ] Automatic backups

\* [ ] Data export

\* [ ] Additional business types

\* [ ] Advanced reporting

\* [ ] Additional country configurations



\---



\## 🔒 Data & Privacy



Bizora follows a local-first approach.



The core business database is stored locally on the user's computer. Bizora does not require a cloud database or hosted backend for its core functionality.



This allows businesses to maintain their operational data locally and use core functionality without an internet connection.



Users are responsible for maintaining backups of their local business data.



\---



\## 🎯 Project Goal



Bizora is being built with a simple objective:



\> \*\*Give small businesses professional business-management tools without forcing them to manage servers, databases, hosting, or complicated software infrastructure.\*\*



The project starts with common workflows for small dairy businesses while keeping the underlying architecture generic enough to support other businesses and countries.



The platform is designed around three principles:



\`\`\`text

Simple

Local

Flexible

\`\`\`



\### Simple



Business owners should be able to install Bizora and start using it without technical knowledge.



\### Local



Core business operations and data should work locally without requiring a hosted backend.



\### Flexible



Country-specific tax, food-safety, and regulatory requirements should be configurable rather than hard-coded into the application.



\---



\## 📄 License



License information will be added as the project progresses.



\---



\## 👨‍💻 Development



Bizora is actively under development.



The architecture, database schema, UI, and feature set may change during development as the project evolves.
