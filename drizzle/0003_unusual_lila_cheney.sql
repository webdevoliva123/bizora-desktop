ALTER TABLE `daily_entries` ADD `payment_type` text DEFAULT 'IMMEDIATE' NOT NULL;--> statement-breakpoint
CREATE INDEX `daily_entries_payment_type_idx` ON `daily_entries` (`payment_type`);