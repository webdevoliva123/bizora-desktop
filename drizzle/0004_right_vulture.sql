CREATE TABLE `monthly_account_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`account_month` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`payment_date` text NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `monthly_account_payments_business_customer_month_idx` ON `monthly_account_payments` (`business_id`,`customer_id`,`account_month`);--> statement-breakpoint
CREATE INDEX `monthly_account_payments_customer_month_idx` ON `monthly_account_payments` (`customer_id`,`account_month`);