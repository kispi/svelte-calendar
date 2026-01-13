CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`created_at` varchar(36) NOT NULL,
	`updated_at` varchar(36) NOT NULL,
	`deleted_at` varchar(36),
	`user_id` varchar(36) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_provider_provider_account_id_unique` UNIQUE(`provider`,`provider_account_id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(36) NOT NULL,
	`created_at` varchar(36) NOT NULL,
	`updated_at` varchar(36) NOT NULL,
	`deleted_at` varchar(36),
	`title` varchar(255) NOT NULL,
	`description` text,
	`location` varchar(255),
	`lat` double,
	`lng` double,
	`location_address` varchar(512),
	`place_id` varchar(255),
	`start_time` varchar(255),
	`end_time` varchar(255),
	`type` varchar(50) NOT NULL DEFAULT 'schedule',
	`user_id` varchar(36),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` varchar(36) NOT NULL,
	`created_at` varchar(36) NOT NULL,
	`updated_at` varchar(36) NOT NULL,
	`deleted_at` varchar(36),
	`title` varchar(255),
	`content` text,
	`user_id` varchar(36),
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`created_at` varchar(36) NOT NULL,
	`updated_at` varchar(36) NOT NULL,
	`deleted_at` varchar(36),
	`session_token` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires` varchar(255) NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`created_at` varchar(36) NOT NULL,
	`updated_at` varchar(36) NOT NULL,
	`deleted_at` varchar(36),
	`name` varchar(255),
	`email` varchar(255),
	`email_verified` varchar(255),
	`image` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`id` varchar(36) NOT NULL,
	`created_at` varchar(36) NOT NULL,
	`updated_at` varchar(36) NOT NULL,
	`deleted_at` varchar(36),
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` varchar(255) NOT NULL,
	CONSTRAINT `verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_tokens_identifier_token_unique` UNIQUE(`identifier`,`token`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;