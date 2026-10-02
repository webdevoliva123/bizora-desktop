CREATE TABLE `business_payment_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`bank_name` text,
	`account_name` text,
	`account_number` text,
	`branch_name` text,
	`routing_code` text,
	`payment_identifier` text,
	`qr_image_path` text,
	`show_bank_details` integer DEFAULT true NOT NULL,
	`show_qr` integer DEFAULT true NOT NULL,
	`payment_instructions` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `business_payment_details_business_id_idx` ON `business_payment_details` (`business_id`);--> statement-breakpoint
CREATE TABLE `business_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`country` text NOT NULL,
	`authority_name` text NOT NULL,
	`registration_type` text NOT NULL,
	`registration_number` text,
	`issue_date` text,
	`expiry_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `business_registrations_business_id_idx` ON `business_registrations` (`business_id`);--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo_path` text,
	`business_type` text NOT NULL,
	`country` text NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`address` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`phone` text,
	`email` text,
	`setup_completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `businesses_country_idx` ON `businesses` (`country`);--> statement-breakpoint
CREATE TABLE `customer_business_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`business_name` text NOT NULL,
	`contact_person` text,
	`tax_registration_number` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customer_business_details_customer_id_idx` ON `customer_business_details` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customer_person_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customer_person_details_customer_id_idx` ON `customer_person_details` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`type` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customers_business_id_idx` ON `customers` (`business_id`);--> statement-breakpoint
CREATE INDEX `customers_phone_idx` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `customers_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `daily_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`entry_date` text NOT NULL,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`tax` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'UNPAID' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `daily_entries_business_id_idx` ON `daily_entries` (`business_id`);--> statement-breakpoint
CREATE INDEX `daily_entries_customer_id_idx` ON `daily_entries` (`customer_id`);--> statement-breakpoint
CREATE INDEX `daily_entries_entry_date_idx` ON `daily_entries` (`entry_date`);--> statement-breakpoint
CREATE TABLE `daily_entry_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate` real DEFAULT 0,
	`total` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `daily_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `daily_entry_items_entry_id_idx` ON `daily_entry_items` (`entry_id`);--> statement-breakpoint
CREATE INDEX `daily_entry_items_product_id_idx` ON `daily_entry_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `expense_categories_business_id_idx` ON `expense_categories` (`business_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`category_id` integer,
	`expense_date` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `expenses_business_id_idx` ON `expenses` (`business_id`);--> statement-breakpoint
CREATE INDEX `expenses_category_id_idx` ON `expenses` (`category_id`);--> statement-breakpoint
CREATE INDEX `expenses_expense_date_idx` ON `expenses` (`expense_date`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate` real DEFAULT 0,
	`total` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `invoice_items_invoice_id_idx` ON `invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_items_product_id_idx` ON `invoice_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`entry_id` integer NOT NULL,
	`invoice_number` text NOT NULL,
	`invoice_date` text NOT NULL,
	`subtotal` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`tax` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'UNPAID' NOT NULL,
	`payment_bank_name` text,
	`payment_account_name` text,
	`payment_account_number` text,
	`payment_branch_name` text,
	`payment_routing_code` text,
	`payment_identifier` text,
	`payment_qr_image_path` text,
	`payment_instructions` text,
	`show_payment_bank_details` integer DEFAULT true NOT NULL,
	`show_payment_qr` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`entry_id`) REFERENCES `daily_entries`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `invoices_business_id_idx` ON `invoices` (`business_id`);--> statement-breakpoint
CREATE INDEX `invoices_customer_id_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_entry_id_idx` ON `invoices` (`entry_id`);--> statement-breakpoint
CREATE INDEX `invoices_invoice_date_idx` ON `invoices` (`invoice_date`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`invoice_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`payment_date` text NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `payments_business_id_idx` ON `payments` (`business_id`);--> statement-breakpoint
CREATE INDEX `payments_invoice_id_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `payments_payment_date_idx` ON `payments` (`payment_date`);--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_categories_business_id_idx` ON `product_categories` (`business_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`category_id` integer,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`selling_price` integer NOT NULL,
	`purchase_price` integer,
	`current_stock` real DEFAULT 0 NOT NULL,
	`low_stock_threshold` real,
	`tax_rate` real DEFAULT 0,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `products_business_id_idx` ON `products` (`business_id`);--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE TABLE `stock_purchase_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate` real DEFAULT 0,
	`total` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `stock_purchases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `stock_purchase_items_purchase_id_idx` ON `stock_purchase_items` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `stock_purchase_items_product_id_idx` ON `stock_purchase_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `stock_purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`supplier_id` integer,
	`purchase_date` text NOT NULL,
	`purchase_number` text,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`tax` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'UNPAID' NOT NULL,
	`payment_method` text,
	`payment_date` text,
	`payment_reference` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `stock_purchases_business_id_idx` ON `stock_purchases` (`business_id`);--> statement-breakpoint
CREATE INDEX `stock_purchases_supplier_id_idx` ON `stock_purchases` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `stock_purchases_purchase_date_idx` ON `stock_purchases` (`purchase_date`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`phone` text,
	`email` text,
	`tax_registration_number` text,
	`address` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `suppliers_business_id_idx` ON `suppliers` (`business_id`);--> statement-breakpoint
CREATE INDEX `suppliers_phone_idx` ON `suppliers` (`phone`);--> statement-breakpoint
CREATE TABLE `tax_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`country` text NOT NULL,
	`tax_system` text NOT NULL,
	`registration_number` text,
	`is_registered` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tax_registrations_business_id_idx` ON `tax_registrations` (`business_id`);--> statement-breakpoint
CREATE TABLE `worker_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`worker_id` integer NOT NULL,
	`payment_date` text NOT NULL,
	`payment_period` text,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `worker_payments_business_id_idx` ON `worker_payments` (`business_id`);--> statement-breakpoint
CREATE INDEX `worker_payments_worker_id_idx` ON `worker_payments` (`worker_id`);--> statement-breakpoint
CREATE INDEX `worker_payments_payment_date_idx` ON `worker_payments` (`payment_date`);--> statement-breakpoint
CREATE TABLE `workers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`role` text,
	`joining_date` text,
	`payment_type` text,
	`default_payment_amount` integer,
	`address` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workers_business_id_idx` ON `workers` (`business_id`);--> statement-breakpoint
CREATE INDEX `workers_phone_idx` ON `workers` (`phone`);