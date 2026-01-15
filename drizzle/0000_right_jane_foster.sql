CREATE TABLE `accounts` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`provider` varchar(255) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_unq` UNIQUE(`provider`,`provider_account_id`)
);
--> statement-breakpoint
CREATE TABLE `calendars` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`name` varchar(255) NOT NULL,
	`color` varchar(50) NOT NULL DEFAULT '#3b82f6',
	`user_id` varchar(255),
	`is_primary` tinyint DEFAULT 0,
	CONSTRAINT `calendars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_members` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`calendar_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'owner',
	CONSTRAINT `calendar_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_logs` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`user_id` varchar(255) NOT NULL,
	`request` text,
	`response` text,
	`function_calls` text,
	`model` varchar(50),
	`start_time` datetime,
	`duration` int,
	CONSTRAINT `chat_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`title` varchar(255) NOT NULL,
	`description` text,
	`location` varchar(255),
	`lat` double,
	`lng` double,
	`location_address` varchar(512),
	`place_id` varchar(255),
	`start_time` datetime,
	`end_time` datetime,
	`type` varchar(50) NOT NULL DEFAULT 'schedule',
	`calendar_id` varchar(255),
	`recurrence_rule` text,
	`exdates` text,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_shares` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`event_id` varchar(255) NOT NULL,
	`inviter_id` varchar(255) NOT NULL,
	`invitee_email` varchar(255) NOT NULL,
	`invitee_id` varchar(255),
	`status` varchar(50) DEFAULT 'pending',
	`permissions` varchar(50) DEFAULT 'read',
	CONSTRAINT `event_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`title` varchar(255),
	`content` text,
	`user_id` varchar(255),
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`session_token` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`name` varchar(255),
	`email` varchar(255),
	`email_verified` timestamp,
	`image` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendars` ADD CONSTRAINT `calendars_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_members` ADD CONSTRAINT `calendar_members_calendar_id_calendars_id_fk` FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_members` ADD CONSTRAINT `calendar_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_logs` ADD CONSTRAINT `chat_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_calendar_id_calendars_id_fk` FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_shares` ADD CONSTRAINT `event_shares_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `calendar_members_calendar_id_idx` ON `calendar_members` (`calendar_id`);--> statement-breakpoint
CREATE INDEX `calendar_members_user_id_idx` ON `calendar_members` (`user_id`);