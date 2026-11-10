CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"color" text NOT NULL,
	"position" double precision NOT NULL,
	CONSTRAINT "list_kind" CHECK ("lists"."kind" in ('inbox','list'))
);
--> statement-breakpoint
CREATE TABLE "mutation_receipts" (
	"actor_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"operation" text NOT NULL,
	"request_id" text NOT NULL,
	"input_hash" text NOT NULL,
	"response" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mutation_receipts_actor_id_workspace_id_operation_request_id_pk" PRIMARY KEY("actor_id","workspace_id","operation","request_id")
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"list_id" text NOT NULL,
	"name" text NOT NULL,
	"position" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "auth_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_schedules" (
	"task_id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"start_date" date,
	"end_date_exclusive" date,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"zone_id" text,
	CONSTRAINT "schedule_shape" CHECK (("task_schedules"."kind" = 'allDay' and "task_schedules"."start_date" is not null and "task_schedules"."end_date_exclusive" > "task_schedules"."start_date" and "task_schedules"."start_at" is null and "task_schedules"."end_at" is null and "task_schedules"."zone_id" is null) or ("task_schedules"."kind" = 'timed' and "task_schedules"."start_date" is null and "task_schedules"."end_date_exclusive" is null and "task_schedules"."start_at" is not null and "task_schedules"."zone_id" is not null and ("task_schedules"."end_at" is null or "task_schedules"."end_at" > "task_schedules"."start_at")))
);
--> statement-breakpoint
CREATE TABLE "task_tags" (
	"task_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	CONSTRAINT "task_tags_task_id_tag_id_pk" PRIMARY KEY("task_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"list_id" text NOT NULL,
	"section_id" text,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"position" double precision NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"completed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "task_status" CHECK ("tasks"."status" in ('open','done')),
	CONSTRAINT "completed_task_timestamp" CHECK (("tasks"."status" = 'done') = ("tasks"."completed_at" is not null)),
	CONSTRAINT "task_priority" CHECK ("tasks"."priority" between 0 and 3),
	CONSTRAINT "task_version" CHECK ("tasks"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"time_zone" text DEFAULT 'Asia/Seoul' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "list_workspace_identity" ON "lists" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "section_workspace_list_identity" ON "sections" USING btree ("id","workspace_id","list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_workspace_identity" ON "tags" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_workspace_identity" ON "tasks" USING btree ("id","workspace_id");--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutation_receipts" ADD CONSTRAINT "mutation_receipts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_list_id_workspace_id_lists_id_workspace_id_fk" FOREIGN KEY ("list_id","workspace_id") REFERENCES "public"."lists"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_schedules" ADD CONSTRAINT "task_schedules_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_task_id_workspace_id_tasks_id_workspace_id_fk" FOREIGN KEY ("task_id","workspace_id") REFERENCES "public"."tasks"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_tag_id_workspace_id_tags_id_workspace_id_fk" FOREIGN KEY ("tag_id","workspace_id") REFERENCES "public"."tags"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_list_id_workspace_id_lists_id_workspace_id_fk" FOREIGN KEY ("list_id","workspace_id") REFERENCES "public"."lists"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_section_id_workspace_id_list_id_sections_id_workspace_id_list_id_fk" FOREIGN KEY ("section_id","workspace_id","list_id") REFERENCES "public"."sections"("id","workspace_id","list_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_auth_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_unique" ON "auth_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_inbox_per_workspace" ON "lists" USING btree ("workspace_id") WHERE "lists"."kind" = 'inbox';--> statement-breakpoint
CREATE INDEX "receipt_expiry" ON "mutation_receipts" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_workspace_name" ON "tags" USING btree ("workspace_id","normalized_name");--> statement-breakpoint
CREATE INDEX "schedule_dates" ON "task_schedules" USING btree ("start_date","end_date_exclusive");--> statement-breakpoint
CREATE INDEX "schedule_instants" ON "task_schedules" USING btree ("start_at","end_at");--> statement-breakpoint
CREATE INDEX "task_workspace_status_completed" ON "tasks" USING btree ("workspace_id","status","completed_at");--> statement-breakpoint
CREATE INDEX "task_list_section_position" ON "tasks" USING btree ("list_id","section_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "personal_workspace_owner" ON "workspaces" USING btree ("owner_id");