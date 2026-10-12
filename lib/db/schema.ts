import {
    index,
    integer,
    real,
    sqliteTable,
    text,
  } from "drizzle-orm/sqlite-core";
  
  /* -------------------------------------------------------------------------- */
  /* Businesses                                                                 */
  /* -------------------------------------------------------------------------- */
  
  export const businesses = sqliteTable(
    "businesses",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      name: text("name").notNull(),
      logoPath: text("logo_path"),
  
      businessType: text("business_type").notNull(),

      businessCategory: text("business_category"),
  
      country: text("country").notNull(),
      currency: text("currency").notNull().default("INR"),
  
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
    },
    (table) => [
      index("businesses_country_idx").on(table.country),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Tax Registrations                                                          */
  /* -------------------------------------------------------------------------- */
  
  export const taxRegistrations = sqliteTable(
    "tax_registrations",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
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
    },
    (table) => [
      index("tax_registrations_business_id_idx").on(table.businessId),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Business / Regulatory Registrations                                        */
  /* -------------------------------------------------------------------------- */
  
  export const businessRegistrations = sqliteTable(
    "business_registrations",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      country: text("country").notNull(),
  
      authorityName: text("authority_name").notNull(),
  
      registrationType: text("registration_type").notNull(),
  
      registrationNumber: text("registration_number"),
  
      issueDate: text("issue_date"),
      expiryDate: text("expiry_date"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("business_registrations_business_id_idx").on(
        table.businessId,
      ),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Business Payment Details                                                   */
  /* -------------------------------------------------------------------------- */
  
  export const businessPaymentDetails = sqliteTable(
    "business_payment_details",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      bankName: text("bank_name"),
      accountName: text("account_name"),
      accountNumber: text("account_number"),
      branchName: text("branch_name"),
      routingCode: text("routing_code"),
  
      /*
       * Country-neutral payment identifier.
       *
       * Examples:
       * UPI ID
       * PayID
       * Other local payment identifiers
       */
      paymentIdentifier: text("payment_identifier"),
  
      qrImagePath: text("qr_image_path"),
  
      showBankDetails: integer("show_bank_details", {
        mode: "boolean",
      })
        .notNull()
        .default(true),
  
      showQr: integer("show_qr", {
        mode: "boolean",
      })
        .notNull()
        .default(true),
  
      paymentInstructions: text("payment_instructions"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("business_payment_details_business_id_idx").on(
        table.businessId,
      ),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Customers                                                                  */
  /* -------------------------------------------------------------------------- */
  
  export const customers = sqliteTable(
    "customers",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      /*
       * PERSON | BUSINESS
       */
      type: text("type").notNull(),
  
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
      
      isSystem: integer("is_system", {
        mode: "boolean",
      })
        .notNull()
        .default(false),
      
      systemKey: text("system_key"),
      
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("customers_business_id_idx").on(table.businessId),
      index("customers_phone_idx").on(table.phone),
      index("customers_email_idx").on(table.email),
      index("customers_business_system_key_idx").on(
        table.businessId,
        table.systemKey,
      ),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Customer - Person Details                                                  */
  /* -------------------------------------------------------------------------- */
  
  export const customerPersonDetails = sqliteTable(
    "customer_person_details",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      customerId: integer("customer_id")
        .notNull()
        .references(() => customers.id, {
          onDelete: "cascade",
        }),
  
      firstName: text("first_name").notNull(),
      lastName: text("last_name"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("customer_person_details_customer_id_idx").on(
        table.customerId,
      ),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Customer - Business Details                                                */
  /* -------------------------------------------------------------------------- */
  
  export const customerBusinessDetails = sqliteTable(
    "customer_business_details",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      customerId: integer("customer_id")
        .notNull()
        .references(() => customers.id, {
          onDelete: "cascade",
        }),
  
      businessName: text("business_name").notNull(),
  
      contactPerson: text("contact_person"),
  
      taxRegistrationNumber: text("tax_registration_number"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("customer_business_details_customer_id_idx").on(
        table.customerId,
      ),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Product Categories                                                         */
  /* -------------------------------------------------------------------------- */
  
  export const productCategories = sqliteTable(
    "product_categories",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      name: text("name").notNull(),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("product_categories_business_id_idx").on(
        table.businessId,
      ),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Products                                                                   */
  /* -------------------------------------------------------------------------- */
  
  export const products = sqliteTable(
    "products",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      categoryId: integer("category_id").references(
        () => productCategories.id,
        {
          onDelete: "set null",
        },
      ),
  
      name: text("name").notNull(),
  
      /*
       * Examples:
       * kg
       * litre
       * piece
       * box
       * packet
       */
      unit: text("unit").notNull(),
  
      /*
       * Money is stored in minor currency units.
       *
       * Example:
       * ₹125.50 -> 12550
       */
      sellingPrice: integer("selling_price").notNull(),
  
      purchasePrice: integer("purchase_price"),
  
      /*
       * Quantity / stock can contain decimals.
       *
       * Examples:
       * 0.5 kg
       * 1.5 litre
       */
      currentStock: real("current_stock").notNull().default(0),
  
      lowStockThreshold: real("low_stock_threshold"),
  
      /*
       * Stored as a percentage.
       *
       * Example:
       * 5 = 5%
       * 18 = 18%
       */
      taxRate: real("tax_rate").default(0),
  
      active: integer("active", {
        mode: "boolean",
      })
        .notNull()
        .default(true),
      
      isSystem: integer("is_system", {
        mode: "boolean",
      })
        .notNull()
        .default(false),
      
      systemKey: text("system_key"),
      
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("products_business_id_idx").on(table.businessId),
      index("products_category_id_idx").on(table.categoryId),
      index("products_business_system_key_idx").on(
        table.businessId,
        table.systemKey,
      ),
    ],
  );
  
  export const dailyEntries = sqliteTable(
    "daily_entries",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      customerId: integer("customer_id")
        .notNull()
        .references(() => customers.id, {
          onDelete: "restrict",
        }),
  
      /**
       * CUSTOMER_SALE | QUICK_SALE
       *
       * CUSTOMER_SALE:
       * Normal sale against a known customer.
       *
       * QUICK_SALE:
       * Fast counter sale without creating/selecting a customer.
       * Uses the system Walk-in Customer and Quick Sale product.
       */
      entryType: text("entry_type")
        .notNull()
        .default("CUSTOMER_SALE"),
  
      entryDate: text("entry_date").notNull(),
  
      /**
       * Money stored in minor currency units.
       */
      subtotal: integer("subtotal").notNull().default(0),
      discount: integer("discount").notNull().default(0),
      tax: integer("tax").notNull().default(0),
      total: integer("total").notNull().default(0),
  
      /**
       * IMMEDIATE | MONTHLY
       */
      paymentType: text("payment_type")
        .notNull()
        .default("IMMEDIATE"),
  
      /**
       * UNPAID | PARTIAL | PAID
       */
      paymentStatus: text("payment_status")
        .notNull()
        .default("UNPAID"),
  
      notes: text("notes"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("daily_entries_business_id_idx").on(table.businessId),
  
      index("daily_entries_customer_id_idx").on(table.customerId),
  
      index("daily_entries_entry_type_idx").on(table.entryType),
  
      index("daily_entries_entry_date_idx").on(table.entryDate),
  
      index("daily_entries_payment_type_idx").on(table.paymentType),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Daily Entry Items                                                          */
  /* -------------------------------------------------------------------------- */
  
  export const dailyEntryItems = sqliteTable(
    "daily_entry_items",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      entryId: integer("entry_id")
        .notNull()
        .references(() => dailyEntries.id, {
          onDelete: "cascade",
        }),
  
      productId: integer("product_id")
        .notNull()
        .references(() => products.id, {
          onDelete: "restrict",
        }),
  
      quantity: real("quantity").notNull(),
  
      unitPrice: integer("unit_price").notNull(),
  
      taxRate: real("tax_rate").default(0),
  
      total: integer("total").notNull(),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("daily_entry_items_entry_id_idx").on(table.entryId),
      index("daily_entry_items_product_id_idx").on(table.productId),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
/* Daily Entry Payments                                                       */
/* -------------------------------------------------------------------------- */

export const dailyEntryPayments = sqliteTable(
    "daily_entry_payments",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      entryId: integer("entry_id")
        .notNull()
        .references(() => dailyEntries.id, {
          onDelete: "cascade",
        }),
  
      amount: integer("amount").notNull(),
  
      /*
       * CASH
       * BANK_TRANSFER
       * CARD
       * OTHER
       */
      paymentMethod: text("payment_method").notNull(),
  
      paymentDate: text("payment_date").notNull(),
  
      reference: text("reference"),
  
      notes: text("notes"),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("daily_entry_payments_business_id_idx").on(
        table.businessId,
      ),
  
      index("daily_entry_payments_entry_id_idx").on(
        table.entryId,
      ),
  
      index("daily_entry_payments_payment_date_idx").on(
        table.paymentDate,
      ),
    ],
  );


  /* -------------------------------------------------------------------------- */
  /* Invoices                                                                   */
  /* -------------------------------------------------------------------------- */
  
  export const invoices = sqliteTable(
    "invoices",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      customerId: integer("customer_id")
        .notNull()
        .references(() => customers.id, {
          onDelete: "restrict",
        }),
  
      entryId: integer("entry_id")
        .notNull()
        .references(() => dailyEntries.id, {
          onDelete: "restrict",
        }),
  
      invoiceNumber: text("invoice_number").notNull(),
  
      invoiceDate: text("invoice_date").notNull(),
  
      subtotal: integer("subtotal").notNull(),
      discount: integer("discount").notNull().default(0),
      tax: integer("tax").notNull().default(0),
      total: integer("total").notNull(),
  
      /*
       * UNPAID | PARTIAL | PAID
       */
      status: text("status").notNull().default("UNPAID"),
  
      /*
       * Payment information snapshot.
       *
       * If the business changes its bank/QR details later,
       * existing invoices remain unchanged.
       */
      paymentBankName: text("payment_bank_name"),
      paymentAccountName: text("payment_account_name"),
      paymentAccountNumber: text("payment_account_number"),
      paymentBranchName: text("payment_branch_name"),
      paymentRoutingCode: text("payment_routing_code"),
      paymentIdentifier: text("payment_identifier"),
      paymentQrImagePath: text("payment_qr_image_path"),
      paymentInstructions: text("payment_instructions"),
  
      showPaymentBankDetails: integer(
        "show_payment_bank_details",
        {
          mode: "boolean",
        },
      )
        .notNull()
        .default(true),
  
      showPaymentQr: integer("show_payment_qr", {
        mode: "boolean",
      })
        .notNull()
        .default(true),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("invoices_business_id_idx").on(table.businessId),
      index("invoices_customer_id_idx").on(table.customerId),
      index("invoices_entry_id_idx").on(table.entryId),
      index("invoices_invoice_date_idx").on(table.invoiceDate),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Invoice Items                                                              */
  /* -------------------------------------------------------------------------- */
  
  export const invoiceItems = sqliteTable(
    "invoice_items",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      invoiceId: integer("invoice_id")
        .notNull()
        .references(() => invoices.id, {
          onDelete: "cascade",
        }),
  
      productId: integer("product_id")
        .notNull()
        .references(() => products.id, {
          onDelete: "restrict",
        }),
  
      /*
       * Product snapshot.
       *
       * Existing invoices remain correct even if the
       * product name or price changes later.
       */
      productName: text("product_name").notNull(),
  
      unit: text("unit").notNull(),
  
      quantity: real("quantity").notNull(),
  
      unitPrice: integer("unit_price").notNull(),
  
      taxRate: real("tax_rate").default(0),
  
      total: integer("total").notNull(),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("invoice_items_invoice_id_idx").on(table.invoiceId),
      index("invoice_items_product_id_idx").on(table.productId),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Payments                                                                   */
  /* -------------------------------------------------------------------------- */
  
  export const payments = sqliteTable(
    "payments",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      invoiceId: integer("invoice_id")
        .notNull()
        .references(() => invoices.id, {
          onDelete: "restrict",
        }),
  
      amount: integer("amount").notNull(),
  
      /*
       * CASH
       * BANK_TRANSFER
       * CARD
       * OTHER
       */
      paymentMethod: text("payment_method").notNull(),
  
      paymentDate: text("payment_date").notNull(),
  
      reference: text("reference"),
  
      notes: text("notes"),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("payments_business_id_idx").on(table.businessId),
      index("payments_invoice_id_idx").on(table.invoiceId),
      index("payments_payment_date_idx").on(table.paymentDate),
    ],
  );

  export const monthlyAccountPayments = sqliteTable(
    "monthly_account_payments",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      customerId: integer("customer_id")
        .notNull()
        .references(() => customers.id, {
          onDelete: "cascade",
        }),
  
      /**
       * Account month in YYYY-MM format.
       *
       * Example:
       * 2026-09
       */
      accountMonth: text("account_month").notNull(),
  
      amount: integer("amount").notNull(),
  
      paymentMethod: text("payment_method").notNull(),
  
      paymentDate: text("payment_date").notNull(),
  
      reference: text("reference"),
  
      notes: text("notes"),
  
      createdAt: text("created_at")
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
  
      updatedAt: text("updated_at")
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
      businessCustomerMonthIdx: index(
        "monthly_account_payments_business_customer_month_idx",
      ).on(
        table.businessId,
        table.customerId,
        table.accountMonth,
      ),
  
      customerMonthIdx: index(
        "monthly_account_payments_customer_month_idx",
      ).on(
        table.customerId,
        table.accountMonth,
      ),
    }),
  );
  
  /* -------------------------------------------------------------------------- */
  /* Suppliers                                                                  */
  /* -------------------------------------------------------------------------- */
  
  export const suppliers = sqliteTable(
    "suppliers",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      name: text("name").notNull(),
  
      contactPerson: text("contact_person"),
  
      phone: text("phone"),
      email: text("email"),
  
      taxRegistrationNumber: text(
        "tax_registration_number",
      ),
  
      address: text("address"),
      city: text("city"),
      state: text("state"),
      postalCode: text("postal_code"),
  
      notes: text("notes"),
  
      active: integer("active", {
        mode: "boolean",
      })
        .notNull()
        .default(true),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("suppliers_business_id_idx").on(table.businessId),
      index("suppliers_phone_idx").on(table.phone),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Expense Categories                                                         */
  /* -------------------------------------------------------------------------- */
  
  export const expenseCategories = sqliteTable(
    "expense_categories",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      name: text("name").notNull(),
  
      active: integer("active", {
        mode: "boolean",
      })
        .notNull()
        .default(true),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("expense_categories_business_id_idx").on(
        table.businessId,
      ),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Expenses                                                                   */
  /* -------------------------------------------------------------------------- */
  
  export const expenses = sqliteTable(
    "expenses",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      categoryId: integer("category_id").references(
        () => expenseCategories.id,
        {
          onDelete: "set null",
        },
      ),
  
      expenseDate: text("expense_date").notNull(),
  
      description: text("description").notNull(),
  
      amount: integer("amount").notNull(),
  
      /*
       * CASH
       * BANK_TRANSFER
       * CARD
       * OTHER
       */
      paymentMethod: text("payment_method").notNull(),
  
      reference: text("reference"),
  
      notes: text("notes"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("expenses_business_id_idx").on(table.businessId),
      index("expenses_category_id_idx").on(table.categoryId),
      index("expenses_expense_date_idx").on(table.expenseDate),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Stock Purchases                                                            */
  /* -------------------------------------------------------------------------- */
  
  export const stockPurchases = sqliteTable(
    "stock_purchases",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      supplierId: integer("supplier_id").references(
        () => suppliers.id,
        {
          onDelete: "set null",
        },
      ),
  
      purchaseDate: text("purchase_date").notNull(),
  
      purchaseNumber: text("purchase_number"),
  
      subtotal: integer("subtotal").notNull().default(0),
  
      tax: integer("tax").notNull().default(0),
  
      total: integer("total").notNull().default(0),
  
      /*
       * UNPAID | PARTIAL | PAID
       */
      paymentStatus: text("payment_status")
        .notNull()
        .default("UNPAID"),
  
      paymentMethod: text("payment_method"),
  
      paymentDate: text("payment_date"),
  
      paymentReference: text("payment_reference"),
  
      notes: text("notes"),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("stock_purchases_business_id_idx").on(
        table.businessId,
      ),
      index("stock_purchases_supplier_id_idx").on(
        table.supplierId,
      ),
      index("stock_purchases_purchase_date_idx").on(
        table.purchaseDate,
      ),
    ],
  );

  export const stockPurchasePayments = sqliteTable(
    "stock_purchase_payments",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, { onDelete: "cascade" }),
  
      purchaseId: integer("purchase_id")
        .notNull()
        .references(() => stockPurchases.id, { onDelete: "cascade" }),
  
      amount: integer("amount").notNull(), // paise
  
      paymentMethod: text("payment_method").notNull(),
      paymentDate: text("payment_date").notNull(),
      reference: text("reference"),
      notes: text("notes"),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("stock_purchase_payments_business_id_idx").on(table.businessId),
      index("stock_purchase_payments_purchase_id_idx").on(table.purchaseId),
      index("stock_purchase_payments_payment_date_idx").on(table.paymentDate),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Stock Purchase Items                                                       */
  /* -------------------------------------------------------------------------- */
  
  export const stockPurchaseItems = sqliteTable(
    "stock_purchase_items",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      purchaseId: integer("purchase_id")
        .notNull()
        .references(() => stockPurchases.id, {
          onDelete: "cascade",
        }),
  
      productId: integer("product_id")
        .notNull()
        .references(() => products.id, {
          onDelete: "restrict",
        }),
  
      /*
       * Product snapshot.
       */
      productName: text("product_name").notNull(),
  
      unit: text("unit").notNull(),
  
      quantity: real("quantity").notNull(),
  
      unitPrice: integer("unit_price").notNull(),
  
      taxRate: real("tax_rate").default(0),
  
      total: integer("total").notNull(),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("stock_purchase_items_purchase_id_idx").on(
        table.purchaseId,
      ),
      index("stock_purchase_items_product_id_idx").on(
        table.productId,
      ),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Workers                                                                    */
  /* -------------------------------------------------------------------------- */
  
  export const workers = sqliteTable(
    "workers",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      name: text("name").notNull(),
  
      phone: text("phone"),
  
      email: text("email"),
  
      role: text("role"),
  
      joiningDate: text("joining_date"),
  
      /*
       * MONTHLY
       * WEEKLY
       * DAILY
       * HOURLY
       * OTHER
       */
      paymentType: text("payment_type"),
  
      defaultPaymentAmount: integer(
        "default_payment_amount",
      ),
  
      address: text("address"),
  
      notes: text("notes"),
  
      active: integer("active", {
        mode: "boolean",
      })
        .notNull()
        .default(true),
  
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [
      index("workers_business_id_idx").on(table.businessId),
      index("workers_phone_idx").on(table.phone),
    ],
  );
  
  /* -------------------------------------------------------------------------- */
  /* Worker Payments                                                            */
  /* -------------------------------------------------------------------------- */
  
  export const workerPayments = sqliteTable(
    "worker_payments",
    {
      id: integer("id").primaryKey({ autoIncrement: true }),
  
      businessId: integer("business_id")
        .notNull()
        .references(() => businesses.id, {
          onDelete: "cascade",
        }),
  
      workerId: integer("worker_id")
        .notNull()
        .references(() => workers.id, {
          onDelete: "restrict",
        }),
  
      paymentDate: text("payment_date").notNull(),
  
      /*
       * Useful for monthly / weekly payment tracking.
       *
       * Example:
       * 2026-09
       */
      paymentPeriod: text("payment_period"),
  
      amount: integer("amount").notNull(),
  
      /*
       * CASH
       * BANK_TRANSFER
       * CARD
       * OTHER
       */
      paymentMethod: text("payment_method").notNull(),
  
      reference: text("reference"),
  
      notes: text("notes"),
  
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      index("worker_payments_business_id_idx").on(
        table.businessId,
      ),
      index("worker_payments_worker_id_idx").on(
        table.workerId,
      ),
      index("worker_payments_payment_date_idx").on(
        table.paymentDate,
      ),
    ],
  );