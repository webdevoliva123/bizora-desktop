ALTER TABLE `customers` ADD `is_system` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `system_key` text;--> statement-breakpoint
CREATE INDEX `customers_business_system_key_idx` ON `customers` (`business_id`,`system_key`);--> statement-breakpoint
ALTER TABLE `daily_entries` ADD `entry_type` text DEFAULT 'CUSTOMER_SALE' NOT NULL;--> statement-breakpoint
CREATE INDEX `daily_entries_entry_type_idx` ON `daily_entries` (`entry_type`);--> statement-breakpoint
ALTER TABLE `products` ADD `is_system` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `system_key` text;--> statement-breakpoint
CREATE INDEX `products_business_system_key_idx` ON `products` (`business_id`,`system_key`);