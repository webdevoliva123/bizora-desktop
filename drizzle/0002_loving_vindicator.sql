CREATE TABLE `daily_entry_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`entry_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`payment_date` text NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entry_id`) REFERENCES `daily_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_entry_payments_business_id_idx` ON `daily_entry_payments` (`business_id`);--> statement-breakpoint
CREATE INDEX `daily_entry_payments_entry_id_idx` ON `daily_entry_payments` (`entry_id`);--> statement-breakpoint
CREATE INDEX `daily_entry_payments_payment_date_idx` ON `daily_entry_payments` (`payment_date`);