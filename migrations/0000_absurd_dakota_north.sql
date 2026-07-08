CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" text NOT NULL,
	"email" text NOT NULL,
	"action" text NOT NULL,
	"competition_id" uuid,
	"description" text,
	"start_balance" numeric(12, 2),
	"end_balance" numeric(12, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"delivery_status" varchar DEFAULT 'sent'
);
--> statement-breakpoint
CREATE TABLE "competition_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"prize_name" varchar NOT NULL,
	"prize_value" numeric(10, 2) NOT NULL,
	"total_quantity" integer NOT NULL,
	"remaining_quantity" integer NOT NULL,
	"game_type" varchar(50),
	"game_prize_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competition_ticket_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"win_percentage" integer DEFAULT 30 NOT NULL,
	"ticket_cost" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"type" varchar NOT NULL,
	"ticket_price" numeric(10, 2) NOT NULL,
	"max_tickets" integer,
	"sold_tickets" integer DEFAULT 0,
	"prize_data" jsonb,
	"skill_question" text,
	"is_active" boolean DEFAULT true,
	"ringtone_points" integer DEFAULT 0,
	"display_order" integer DEFAULT 999,
	"end_date" timestamp,
	"wheel_type" varchar DEFAULT 'wheel1',
	"status" text DEFAULT 'active',
	"video_url" text,
	"video_key" text,
	"video_mime_type" text,
	"video_updated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discount_code_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discount_code_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"order_id" uuid,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"type" varchar NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"max_uses" integer DEFAULT 1,
	"uses_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_plinko_config" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"rows" integer DEFAULT 12,
	"free_replay_probability" numeric(5, 2) DEFAULT '5.00',
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_pop_config" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"prizes" jsonb NOT NULL,
	"r_prize_enabled" boolean DEFAULT true,
	"r_prize_probability" numeric(5, 2) DEFAULT '5.00',
	"win_probability" numeric(5, 2) DEFAULT '10.00',
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_royal_config" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"replay_chance" numeric(5, 2) DEFAULT '5.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_scratch_config" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"mode" varchar DEFAULT 'tight',
	"landmark_images" jsonb NOT NULL,
	"cash_prizes" jsonb NOT NULL,
	"ringtune_prizes" jsonb NOT NULL,
	"win_probability" numeric(3, 2) DEFAULT '0.20',
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_slot_config" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"price_per_spin" numeric(10, 2) DEFAULT '0.20',
	"credits_per_spin" integer DEFAULT 20,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_spin_config" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"segments" jsonb NOT NULL,
	"max_spins_per_user" integer,
	"mystery_prize" jsonb,
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_voltz_config" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"prizes" jsonb NOT NULL,
	"win_probability" numeric(5, 2) DEFAULT '10.00',
	"free_replay_probability" numeric(5, 2) DEFAULT '5.00',
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"competition_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"stripe_payment_intent_id" varchar,
	"wallet_amount" numeric(10, 2) DEFAULT '0.00',
	"points_amount" numeric(10, 2) DEFAULT '0.00',
	"cashflows_amount" numeric(10, 2) DEFAULT '0.00',
	"payment_breakdown" text,
	"skill_answer" text,
	"remaining_plays" integer,
	"discount_code_id" uuid,
	"discount_amount" numeric(10, 2),
	"discount_type" varchar,
	"points_discount_amount" numeric(10, 2),
	"percentage_discount" numeric(5, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pending_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_job_reference" text NOT NULL,
	"payment_reference" varchar,
	"user_id" varchar NOT NULL,
	"order_id" uuid,
	"payment_type" varchar DEFAULT 'wallet_topup',
	"amount" numeric(10, 2) NOT NULL,
	"metadata" jsonb,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pending_payments_payment_job_reference_unique" UNIQUE("payment_job_reference")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"signup_bonus_enabled" boolean DEFAULT false,
	"signup_bonus_cash" numeric(10, 2) DEFAULT '0.00',
	"signup_bonus_points" integer DEFAULT 0,
	"commission_rate" numeric(5, 2) DEFAULT '0.00',
	"max_tickets_per_order" integer DEFAULT 250,
	"minimum_top_up" numeric(10, 2) DEFAULT '10.00',
	"maintenance_mode" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plinko_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_index" integer NOT NULL,
	"prize_name" varchar NOT NULL,
	"prize_value" numeric(10, 2) NOT NULL,
	"reward_type" varchar NOT NULL,
	"probability" numeric(6, 3) NOT NULL,
	"color" varchar DEFAULT '#FFD700',
	"max_wins" integer,
	"quantity_won" integer DEFAULT 0,
	"fallback_prize_id" uuid,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plinko_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plinko_wins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"user_id" varchar NOT NULL,
	"prize_id" uuid NOT NULL,
	"slot_index" integer NOT NULL,
	"reward_type" varchar NOT NULL,
	"reward_value" text NOT NULL,
	"is_win" boolean DEFAULT false,
	"won_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pop_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prize_name" varchar NOT NULL,
	"prize_value" numeric(10, 2) NOT NULL,
	"reward_type" varchar NOT NULL,
	"weight" integer DEFAULT 10 NOT NULL,
	"max_wins" integer,
	"quantity_won" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pop_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pop_wins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"user_id" varchar NOT NULL,
	"prize_name" text,
	"prize_id" text NOT NULL,
	"balloon_values" jsonb NOT NULL,
	"reward_type" varchar NOT NULL,
	"reward_value" text NOT NULL,
	"is_win" boolean DEFAULT false,
	"won_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotional_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"offer_type" varchar NOT NULL,
	"discount_code" varchar,
	"discount_percentage" integer,
	"bonus_amount" numeric(10, 2),
	"bonus_points" integer,
	"expiry_date" timestamp,
	"status" varchar DEFAULT 'draft',
	"recipient_count" integer DEFAULT 0,
	"sent_at" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"read_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"type" varchar DEFAULT 'info',
	"target_type" varchar NOT NULL,
	"target_user_ids" jsonb,
	"sent_count" integer DEFAULT 0,
	"read_count" integer DEFAULT 0,
	"status" varchar DEFAULT 'draft',
	"created_by" varchar,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "redeem_code_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"redeem_code_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"redeemed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "redeem_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"usage_limit" integer DEFAULT 1,
	"current_uses" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_system_generated" boolean DEFAULT true,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"notes" text,
	"is_used" boolean DEFAULT false,
	"used_by_user_id" varchar,
	"used_at" timestamp,
	CONSTRAINT "redeem_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "royal_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prize_name" varchar NOT NULL,
	"symbol_key" varchar NOT NULL,
	"prize_value" numeric(10, 2) NOT NULL,
	"reward_type" varchar NOT NULL,
	"weight" integer DEFAULT 10 NOT NULL,
	"max_wins" integer,
	"quantity_won" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "royal_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"is_win" boolean DEFAULT false,
	"is_royal_replay" boolean DEFAULT false,
	"prize_id" text,
	"reward_type" varchar DEFAULT 'no_win',
	"reward_value" text DEFAULT '0',
	"symbols" jsonb,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "royal_wins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"user_id" varchar NOT NULL,
	"prize_id" text NOT NULL,
	"reward_type" varchar NOT NULL,
	"reward_value" text NOT NULL,
	"symbol_key" varchar NOT NULL,
	"is_win" boolean DEFAULT false,
	"won_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"account_name" text NOT NULL,
	"account_number" varchar NOT NULL,
	"sort_code" varchar NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scratch_card_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_name" varchar NOT NULL,
	"image_key" varchar NOT NULL,
	"reward_type" varchar NOT NULL,
	"reward_value" varchar NOT NULL,
	"weight" numeric(10, 2) NOT NULL,
	"max_wins" integer,
	"quantity_won" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "scratch_card_images_image_name_unique" UNIQUE("image_name")
);
--> statement-breakpoint
CREATE TABLE "scratch_card_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scratch_card_wins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"prize_id" text NOT NULL,
	"reward_type" varchar NOT NULL,
	"reward_value" text NOT NULL,
	"won_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slot_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"coins_spent" integer DEFAULT 0,
	"coins_won" integer DEFAULT 0,
	"is_win" boolean DEFAULT false,
	"spin_number" integer DEFAULT 1,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spin_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spin_wheel_2_configs" (
	"id" varchar PRIMARY KEY DEFAULT 'active' NOT NULL,
	"segments" jsonb NOT NULL,
	"max_spins_per_user" integer,
	"mystery_prize" jsonb,
	"is_visible" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spin_wins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"segment_id" text NOT NULL,
	"reward_type" varchar NOT NULL,
	"wheel_type" varchar DEFAULT 'wheel1',
	"reward_value" text NOT NULL,
	"won_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_type" varchar NOT NULL,
	"message" text NOT NULL,
	"image_urls" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" serial NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" varchar DEFAULT 'open',
	"priority" varchar DEFAULT 'medium',
	"image_urls" text[],
	"admin_response" text,
	"admin_image_urls" text[],
	"user_has_unread" boolean DEFAULT false,
	"admin_has_unread" boolean DEFAULT true,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"competition_id" uuid NOT NULL,
	"order_id" uuid,
	"ticket_number" varchar NOT NULL,
	"is_winner" boolean DEFAULT false,
	"prize_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"pending_payment_id" uuid,
	"payment_ref" varchar,
	"description" text,
	"order_id" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "transactions_payment_ref_unique" UNIQUE("payment_ref")
);
--> statement-breakpoint
CREATE TABLE "user_ip_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ip_address" varchar NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"document_type" varchar NOT NULL,
	"document_image_url" text NOT NULL,
	"admin_notes" text,
	"reviewed_by" varchar,
	"admin_has_unread" boolean DEFAULT true,
	"extracted_dob" timestamp,
	"age_verified" boolean DEFAULT false,
	"age_verified_at" timestamp,
	"id_name_match" boolean DEFAULT false,
	"id_dob_match" boolean DEFAULT false,
	"minimum_age_met" boolean DEFAULT false,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"date_of_birth" varchar,
	"profile_image_url" varchar,
	"balance" numeric(10, 2) DEFAULT '0.00',
	"daily_spend_limit" numeric(10, 2),
	"self_suspended" boolean DEFAULT false,
	"self_suspension_ends_at" timestamp,
	"stripe_customer_id" varchar,
	"disabled" boolean DEFAULT false,
	"disabled_at" timestamp,
	"disabled_until" timestamp,
	"stripe_subscription_id" varchar,
	"email_verified" boolean DEFAULT false,
	"verification_sent_at" timestamp,
	"email_verification_otp" varchar,
	"email_verification_otp_expires_at" timestamp,
	"ringtone_points" integer DEFAULT 0,
	"receive_newsletter" boolean DEFAULT false,
	"daily_limit_last_updated_at" timestamp,
	"how_did_you_find_us" varchar,
	"is_admin" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"referral_code" varchar,
	"phone_number" varchar,
	"pending_redeem_code" varchar,
	"pending_redeem_amount" numeric(10, 2),
	"referred_by" varchar,
	"address_street" text,
	"address_city" text,
	"address_postcode" varchar,
	"address_country" varchar,
	"notes" text,
	"is_restricted" boolean DEFAULT false,
	"restricted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "voltz_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prize_name" varchar NOT NULL,
	"prize_value" numeric(10, 2) NOT NULL,
	"reward_type" varchar NOT NULL,
	"weight" integer DEFAULT 10 NOT NULL,
	"max_wins" integer,
	"quantity_won" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "voltz_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" varchar NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "voltz_wins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"user_id" varchar NOT NULL,
	"prize_id" text NOT NULL,
	"switch_chosen" integer NOT NULL,
	"reward_type" varchar NOT NULL,
	"reward_value" text NOT NULL,
	"is_win" boolean DEFAULT false,
	"won_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wellbeing_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"days_requested" integer,
	"processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "winners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"competition_id" uuid,
	"prize_description" text NOT NULL,
	"prize_value" text NOT NULL,
	"image_url" text,
	"is_showcase" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"account_name" text NOT NULL,
	"account_number" varchar NOT NULL,
	"sort_code" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"admin_notes" text,
	"processed_by" varchar,
	"processed_at" timestamp,
	"admin_has_unread" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_emails" ADD CONSTRAINT "campaign_emails_campaign_id_promotional_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promotional_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_emails" ADD CONSTRAINT "campaign_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_prizes" ADD CONSTRAINT "competition_prizes_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_ticket_settings" ADD CONSTRAINT "competition_ticket_settings_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_code_usages" ADD CONSTRAINT "discount_code_usages_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_code_usages" ADD CONSTRAINT "discount_code_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_code_usages" ADD CONSTRAINT "discount_code_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plinko_usage" ADD CONSTRAINT "plinko_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plinko_usage" ADD CONSTRAINT "plinko_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plinko_wins" ADD CONSTRAINT "plinko_wins_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plinko_wins" ADD CONSTRAINT "plinko_wins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plinko_wins" ADD CONSTRAINT "plinko_wins_prize_id_plinko_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."plinko_prizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pop_usage" ADD CONSTRAINT "pop_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pop_usage" ADD CONSTRAINT "pop_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pop_wins" ADD CONSTRAINT "pop_wins_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pop_wins" ADD CONSTRAINT "pop_wins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotional_campaigns" ADD CONSTRAINT "promotional_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_deliveries" ADD CONSTRAINT "push_deliveries_notification_id_push_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."push_notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_deliveries" ADD CONSTRAINT "push_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redeem_code_redemptions" ADD CONSTRAINT "redeem_code_redemptions_redeem_code_id_redeem_codes_id_fk" FOREIGN KEY ("redeem_code_id") REFERENCES "public"."redeem_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redeem_code_redemptions" ADD CONSTRAINT "redeem_code_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redeem_codes" ADD CONSTRAINT "redeem_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redeem_codes" ADD CONSTRAINT "redeem_codes_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "royal_usage" ADD CONSTRAINT "royal_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "royal_usage" ADD CONSTRAINT "royal_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "royal_wins" ADD CONSTRAINT "royal_wins_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "royal_wins" ADD CONSTRAINT "royal_wins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_bank_accounts" ADD CONSTRAINT "saved_bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scratch_card_usage" ADD CONSTRAINT "scratch_card_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scratch_card_usage" ADD CONSTRAINT "scratch_card_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scratch_card_wins" ADD CONSTRAINT "scratch_card_wins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_usage" ADD CONSTRAINT "slot_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_usage" ADD CONSTRAINT "slot_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_usage" ADD CONSTRAINT "spin_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_usage" ADD CONSTRAINT "spin_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_wins" ADD CONSTRAINT "spin_wins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pending_payment_id_pending_payments_id_fk" FOREIGN KEY ("pending_payment_id") REFERENCES "public"."pending_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ip_logs" ADD CONSTRAINT "user_ip_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voltz_usage" ADD CONSTRAINT "voltz_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voltz_usage" ADD CONSTRAINT "voltz_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voltz_wins" ADD CONSTRAINT "voltz_wins_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voltz_wins" ADD CONSTRAINT "voltz_wins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winners" ADD CONSTRAINT "winners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winners" ADD CONSTRAINT "winners_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_ticket_settings_competition_id_idx" ON "competition_ticket_settings" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "competition_ticket_settings_is_active_idx" ON "competition_ticket_settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "saved_bank_accounts_user_id_idx" ON "saved_bank_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_bank_accounts_is_default_idx" ON "saved_bank_accounts" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_payment_ref_idx" ON "transactions" USING btree ("payment_ref") WHERE "transactions"."payment_ref" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_pending_payment_id_idx" ON "transactions" USING btree ("pending_payment_id") WHERE "transactions"."pending_payment_id" IS NOT NULL;