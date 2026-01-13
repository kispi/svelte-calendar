ALTER TABLE `accounts` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `accounts` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `accounts` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `start_time` datetime;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `end_time` datetime;--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `expires` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `verification_tokens` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `verification_tokens` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `verification_tokens` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `verification_tokens` MODIFY COLUMN `expires` datetime NOT NULL;