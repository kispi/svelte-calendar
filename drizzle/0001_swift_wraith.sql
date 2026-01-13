ALTER TABLE `accounts` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` MODIFY COLUMN `created_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` MODIFY COLUMN `updated_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` MODIFY COLUMN `deleted_at` varchar(255);--> statement-breakpoint
ALTER TABLE `accounts` MODIFY COLUMN `user_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `created_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `updated_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `deleted_at` varchar(255);--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `user_id` varchar(255);--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `created_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `updated_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `deleted_at` varchar(255);--> statement-breakpoint
ALTER TABLE `notes` MODIFY COLUMN `user_id` varchar(255);--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `created_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `updated_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `deleted_at` varchar(255);--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `user_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `deleted_at` varchar(255);--> statement-breakpoint
ALTER TABLE `verification_tokens` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification_tokens` MODIFY COLUMN `created_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification_tokens` MODIFY COLUMN `updated_at` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification_tokens` MODIFY COLUMN `deleted_at` varchar(255);