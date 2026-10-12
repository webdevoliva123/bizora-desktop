CREATE TABLE `stock_purchase_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`purchase_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text NOT NULL,
	`payment_date` text NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_id`) REFERENCES `stock_purchases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stock_purchase_payments_business_id_idx` ON `stock_purchase_payments` (`business_id`);--> statement-breakpoint
CREATE INDEX `stock_purchase_payments_purchase_id_idx` ON `stock_purchase_payments` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `stock_purchase_payments_payment_date_idx` ON `stock_purchase_payments` (`payment_date`);