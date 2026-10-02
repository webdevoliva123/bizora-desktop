import {
    integer,
    real,
    sqliteTable,
    text,
  } from "drizzle-orm/sqlite-core";
  
  // ─────────────────────────────────────────────
  // Business
  // ─────────────────────────────────────────────
  
  export const businesses = sqliteTable("businesses", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    name: text("name").notNull(),
    logoPath: text("logo_path"),
  
    businessType: text("business_type").notNull(),
  
    country: text("country").notNull(),
  
    address: text("address"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
  
    phone: text("phone"),
    email: text("email"),
  
    setupCompleted: integer("setup_completed", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
  
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  });
  
  // ─────────────────────────────────────────────
  // Tax Registrations
  // ─────────────────────────────────────────────
  
  export const taxRegistrations = sqliteTable("tax_registrations", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    businessId: integer("business_id").notNull(),
  
    country: text("country").notNull(),
  
    taxSystem: text("tax_system").notNull(),
  
    registrationNumber: text("registration_number"),
  
    isRegistered: integer("is_registered", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
  
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  });
  
  // ─────────────────────────────────────────────
  // Business / Regulatory Registrations
  // ─────────────────────────────────────────────
  
  export const businessRegistrations = sqliteTable(
    "business_registrations",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id").notNull(),
  
      country: text("country").notNull(),
  
      authorityName: text("authority_name").notNull(),
  
      registrationType: text("registration_type").notNull(),
  
      registrationNumber: text("registration_number"),
  
      issueDate: text("issue_date"),
  
      expiryDate: text("expiry_date"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
  );
  
  // ─────────────────────────────────────────────
  // Customers
  // ─────────────────────────────────────────────
  
  export const customers = sqliteTable("customers", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    businessId: integer("business_id").notNull(),
  
    type: text("type").notNull(), // PERSON | BUSINESS
  
    phone: text("phone"),
    email: text("email"),
  
    address: text("address"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
  
    active: integer("active", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
  
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  });
  
  // ─────────────────────────────────────────────
  // Person Customer Details
  // ─────────────────────────────────────────────
  
  export const customerPersonDetails = sqliteTable(
    "customer_person_details",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      customerId: integer("customer_id").notNull(),
  
      firstName: text("first_name").notNull(),
  
      lastName: text("last_name"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
  );
  
  // ─────────────────────────────────────────────
  // Business Customer Details
  // ─────────────────────────────────────────────
  
  export const customerBusinessDetails = sqliteTable(
    "customer_business_details",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      customerId: integer("customer_id").notNull(),
  
      businessName: text("business_name").notNull(),
  
      contactPerson: text("contact_person"),
  
      taxRegistrationNumber: text("tax_registration_number"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
  );
  
  // ─────────────────────────────────────────────
  // Product Categories
  // ─────────────────────────────────────────────
  
  export const productCategories = sqliteTable("product_categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    businessId: integer("business_id").notNull(),
  
    name: text("name").notNull(),
  
    createdAt: text("created_at").notNull(),
  });
  
  // ─────────────────────────────────────────────
  // Products
  // ─────────────────────────────────────────────
  
  export const products = sqliteTable("products", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    businessId: integer("business_id").notNull(),
  
    categoryId: integer("category_id"),
  
    name: text("name").notNull(),
  
    unit: text("unit").notNull(),
  
    sellingPrice: real("selling_price").notNull(),
  
    purchasePrice: real("purchase_price"),
  
    currentStock: real("current_stock").notNull().default(0),
  
    lowStockThreshold: real("low_stock_threshold"),
  
    taxRate: real("tax_rate").default(0),
  
    active: integer("active", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
  
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  });
  
  // ─────────────────────────────────────────────
  // Daily Entries
  // ─────────────────────────────────────────────
  
  export const dailyEntries = sqliteTable("daily_entries", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    businessId: integer("business_id").notNull(),
  
    customerId: integer("customer_id").notNull(),
  
    entryDate: text("entry_date").notNull(),
  
    subtotal: real("subtotal").notNull().default(0),
  
    discount: real("discount").notNull().default(0),
  
    tax: real("tax").notNull().default(0),
  
    total: real("total").notNull().default(0),
  
    paymentStatus: text("payment_status")
      .notNull()
      .default("UNPAID"),
  
    notes: text("notes"),
  
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  });
  
  // ─────────────────────────────────────────────
  // Daily Entry Items
  // ─────────────────────────────────────────────
  
  export const dailyEntryItems = sqliteTable("daily_entry_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    entryId: integer("entry_id").notNull(),
  
    productId: integer("product_id").notNull(),
  
    quantity: real("quantity").notNull(),
  
    unitPrice: real("unit_price").notNull(),
  
    taxRate: real("tax_rate").default(0),
  
    total: real("total").notNull(),
  
    createdAt: text("created_at").notNull(),
  });
  
  // ─────────────────────────────────────────────
  // Invoices
  // ─────────────────────────────────────────────
  
  export const invoices = sqliteTable("invoices", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    businessId: integer("business_id").notNull(),
  
    customerId: integer("customer_id").notNull(),
  
    entryId: integer("entry_id").notNull(),
  
    invoiceNumber: text("invoice_number").notNull(),
  
    invoiceDate: text("invoice_date").notNull(),
  
    subtotal: real("subtotal").notNull(),
  
    discount: real("discount").notNull().default(0),
  
    tax: real("tax").notNull().default(0),
  
    total: real("total").notNull(),
  
    status: text("status").notNull().default("UNPAID"),
  
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  });
  
  // ─────────────────────────────────────────────
  // Payments
  // ─────────────────────────────────────────────
  
  export const payments = sqliteTable("payments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
  
    businessId: integer("business_id").notNull(),
  
    invoiceId: integer("invoice_id").notNull(),
  
    amount: real("amount").notNull(),
  
    paymentMethod: text("payment_method").notNull(),
  
    paymentDate: text("payment_date").notNull(),
  
    reference: text("reference"),
  
    notes: text("notes"),
  
    createdAt: text("created_at").notNull(),
  });