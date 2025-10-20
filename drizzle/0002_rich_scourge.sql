ALTER TABLE `assignments` ADD `session_id` text NOT NULL REFERENCES sessions(id);--> statement-breakpoint
CREATE INDEX `session_id_idx` ON `assignments` (`session_id`);