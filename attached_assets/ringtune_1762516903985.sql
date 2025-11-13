--
-- PostgreSQL database dump
--

\restrict I8Tmaj4fzAh6bpO5rCj5SBfVyju1e47bO3pEfXd7P3SMK6XfyIc0iDFFzQOwp1p

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-11-07 17:01:05

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 106522)
-- Name: competitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    type character varying NOT NULL,
    ticket_price numeric(10,2) NOT NULL,
    max_tickets integer,
    sold_tickets integer DEFAULT 0,
    prize_data jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ringtone_points integer DEFAULT 0
);


ALTER TABLE public.competitions OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 106534)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    competition_id uuid NOT NULL,
    quantity integer NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    payment_method character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    stripe_payment_intent_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    wallet_amount numeric(10,2) DEFAULT 0.00,
    points_amount numeric(10,2) DEFAULT 0.00,
    cashflows_amount numeric(10,2) DEFAULT 0.00,
    payment_breakdown text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 147481)
-- Name: scratch_card_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scratch_card_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    user_id character varying NOT NULL,
    used_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.scratch_card_usage OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 106545)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 139289)
-- Name: spin_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spin_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    user_id character varying NOT NULL,
    used_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.spin_usage OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 106552)
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    competition_id uuid NOT NULL,
    ticket_number character varying NOT NULL,
    is_winner boolean DEFAULT false,
    prize_amount numeric(10,2),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 106562)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    order_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 106571)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    password character varying,
    first_name character varying,
    last_name character varying,
    date_of_birth character varying,
    profile_image_url character varying,
    balance numeric(10,2) DEFAULT 0.00,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    email_verified boolean DEFAULT false,
    receive_newsletter boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ringtone_points integer DEFAULT 0,
    is_admin boolean DEFAULT false,
    is_active boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 106586)
-- Name: winners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.winners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    competition_id uuid,
    prize_description text NOT NULL,
    prize_value text NOT NULL,
    image_url text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.winners OWNER TO postgres;

--
-- TOC entry 4883 (class 0 OID 106522)
-- Dependencies: 217
-- Data for Name: competitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.competitions (id, title, description, image_url, type, ticket_price, max_tickets, sold_tickets, prize_data, is_active, created_at, updated_at, ringtone_points) FROM stdin;
f451a094-96cb-44dc-bd54-e1ce17bba39d	💷 WIN A £500 JD SPORTS GIFT CARD – JUST 50p PER ENTRY! 🏆	Step up your style with a £500 JD Sports Gift Card — your ticket to fresh trainers, streetwear, and all the biggest brands including Nike, On Cloud, The North Face, and Lacoste 👟🔥\n\nFor just 50p per ticket, you could treat yourself to a full wardrobe upgrade or the latest kicks — all for less than £1!\nPrefer cash instead? No problem — you can take £500 in cash if you would rather! 💷\n\n🪙 50p per entry\n🎟 1,600 total tickets\n📅 Draw Date: Once all tickets are sold\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n🎁 £500 JD Sports Gift Card\n💷 Or £500 cash alternative\n\nDo not miss your chance to win a £500 shopping spree or £500 cash — all for just 50p per entry!\nEnter today with Ringtone Riches 🎵 — where real players win real prizes 💷\n\n🎟 Grab your tickets now — only 1,600 available!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761221636/Win_%C3%BA500_JD_Sports_Gift_Card_iqjrqb.png	instant	0.50	1600	0	{"delivery": "Free tracked delivery to winner", "mainPrize": "£500 JD Sports Gift Card", "drawMethod": "Once all tickets are sold", "cashAlternative": "£500 Cash"}	t	2025-10-23 17:39:00.574235	2025-10-23 17:39:00.574235	0
e4496d60-1b53-4b39-a4ff-2ef3559738a6	🎮 WIN A PLAYSTATION 5 PRO (DIGITAL EDITION) – JUST 50p PER ENTRY! ⚡️	Get ready to experience the next level of gaming with the all-new PlayStation 5 Pro Digital Edition — lightning-fast, ultra-smooth, and built for players who live for performance.\n\nFor just 50p per ticket, you could be taking home the newest and most powerful digital console from Sony. With only 2,000 tickets available, this competition will not last long — once they are gone, the draw goes LIVE!\n\nOr if consoles are not your thing, take the £850 cash alternative instead! 💷\n\n🪙 50p per entry\n🎟 2,000 total tickets\n📅 Draw Date: Once all tickets are sold\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n🎮 Brand new PlayStation 5 Pro Digital Edition (latest model)\n💷 Or £850 cash alternative\n🚚 Free tracked delivery straight to the winner\n\nTake your gaming to the next level — no discs, no waiting, just pure digital power.\nEnter today with Ringtone Riches 🎵 and you could be unboxing your brand-new PS5 Pro or pocketing £850 cash for just 50p!\n\n🎟 Grab your tickets now — only 2,000 available!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761221644/Win_a_PS5_Pro_xh08uw.png	instant	0.50	2000	0	{"delivery": "Free tracked delivery to winner", "mainPrize": "PlayStation 5 Pro Digital Edition", "drawMethod": "Once all tickets are sold", "cashAlternative": "£850 Cash"}	t	2025-10-23 17:39:00.580165	2025-10-23 17:39:00.580165	0
92121471-11a1-49f7-984a-8cd9cf323156	⚡️ WIN A £500 AMAZON GIFT CARD – JUST 50p PER ENTRY! 💥	Shop anything, anytime, with a £500 Amazon Gift Card — from tech and homeware to fashion and entertainment!\n\nFor just 50p per ticket, you could get your hands on a £500 Amazon gift card, giving you endless ways to spend.\nOr, if you would prefer, take the £500 cash alternative instead — the choice is yours! 💷\n\n🪙 50p per entry\n🎟 1,600 total tickets\n📅 Draw Date: Once all tickets are sold\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n🎁 £500 Amazon Gift Card\n💷 Or £500 cash alternative\n\nWhether it is the latest gadgets, home essentials, or fashion favourites — spend it your way!\nEnter today for just 50p and you could be our next big winner!\n\n🎟 Grab your tickets now — only 1,600 available!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761221627/Win_a_%C3%BA500_Amazon_Gift_Card_ufkwfx.png	instant	0.50	1600	0	{"delivery": "Free tracked delivery to winner", "mainPrize": "£500 Amazon Gift Card", "drawMethod": "Once all tickets are sold", "cashAlternative": "£500 Cash"}	t	2025-10-23 17:39:00.582013	2025-10-23 17:39:00.582013	0
3a7841d0-7e1c-4cb4-8e4c-1d7fc33ed907	📱 WIN AN ORANGE iPHONE 17 PRO MAX – JUST 75p PER ENTRY! 🔥	Stand out from the crowd with the stunning Orange iPhone 17 Pro Max — Apple's newest and most powerful smartphone, and it could be yours for just 75p!\n\nWith only 2,000 tickets available, this is your chance to grab the latest iPhone in a bold new colour for less than £1!\nOr, if you prefer, take £1,000 cash instead — the choice is yours! 💷\n\n🪙 75p per entry\n🎟 2,000 total tickets\n📅 Draw Date: Once all tickets are sold.\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n📱 Brand new Orange iPhone 17 Pro Max (unlocked)\n💷 Or £1,000 cash alternative\n🚚 Free tracked delivery straight to the winner\n\n🔥 Do not miss this one — limited tickets mean this exclusive orange edition will not last long!\nEnter today for just 75p and you could be unboxing your brand-new iPhone 17 Pro Max or pocketing £1,000 cash!\n\n🎟 Grab your tickets now — only 2,000 available!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761399783/Copy_of_TUI_HOLIDAY_VOUCHER_nbuzxa.png	instant	0.75	2000	0	{"delivery": "Free tracked delivery to winner", "mainPrize": "Orange iPhone 17 Pro Max (Unlocked)", "drawMethod": "Once all tickets are sold", "cashAlternative": "£1,000 Cash"}	t	2025-10-23 17:04:07.295088	2025-10-23 17:04:07.295088	0
46b0a15b-293d-4ae1-957b-463eb9fe96d1	🎁 WIN A £500 SMYTHS TOYS GIFT CARD – JUST 50p PER ENTRY! 💥	Treat the kids (or yourself!) with a £500 Smyths Toys Gift Card — perfect for games, gadgets, and toys for all ages!\n\nFor just 50p per ticket, you could win £500 to spend at Smyths Toys, giving you access to the latest consoles, LEGO sets, bikes, and more.\nPrefer cash instead? No problem — you can take the £500 cash alternative instead! 💷\n\n🪙 50p per entry\n🎟 1,600 total tickets\n📅 Draw Date: Once all tickets are sold\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n🎁 £500 Smyths Toys Gift Card\n💷 Or £500 cash alternative\n\nFrom PlayStation to Pokémon and everything in between — spend your winnings your way!\nEnter today for just 50p and you could be our next big winner!\n\n🎟 Grab your tickets now — only 1,600 available!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761221629/WIN_%C3%BA500_Smyth%CE%93%C3%87%C3%96s_Toys_Gift_Card_h7apug.png	instant	0.50	1600	2	{"delivery": "Free tracked delivery to winner", "mainPrize": "£500 Smyths Toys Gift Card", "drawMethod": "Once all tickets are sold", "cashAlternative": "£500 Cash"}	t	2025-10-23 17:39:00.582777	2025-10-28 13:14:52.937	0
a3c74369-bcaa-4ac0-8a45-610b9e831039	💷 £500 FREE GIVEAWAY! 🎉	To celebrate all our amazing supporters, we are giving YOU the chance to win £500 cash — completely free! 💥\n\nThat is right — no entry fee, no catches, just a genuine giveaway from Ringtone Riches to say thank you for being part of our growing community.\n\n🎟 Free entry\n💷 £500 tax-free cash prize\n📅 Draw Date: Once all free entries are filled\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n\nIt is quick, simple, and 100% free to enter. 🙌\nDo not miss your chance to pocket £500 cash — it could be you taking home the win for free!\n\n🎟 Enter now — it costs nothing to play!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761221954/%C3%BA500_FREE_GIVEAWAY-min_fysee5.png	instant	0.00	1000	4	{"delivery": "Paid directly to the winner", "mainPrize": "£500 Tax-Free Cash", "drawMethod": "Once all free entries are filled", "cashAlternative": "N/A"}	t	2025-10-23 17:39:00.581187	2025-10-30 12:15:06.687	0
5daa774d-a8d7-4404-a3d4-382609be0c25	Spin the Wheel	Spin the wheel and win amazing rewards instantly!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761305603/25639_zg9gbn.jpg	spin	2.00	\N	0	\N	t	2025-10-24 18:27:16.212507	2025-10-24 18:27:16.212507	0
717e819f-6e70-41bd-93ba-2c9a727113b8	Scratch & Win 	Scratch your way to big prizes — cash or points await!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761305603/7788308_dfqqom.jpg	scratch	2.00	\N	0	\N	t	2025-10-24 18:27:16.218092	2025-10-24 18:27:16.218092	0
64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	🚰 WIN A LUX EXCITE SINK – JUST 40p PER ENTRY! 💥	Transform your kitchen with the stunning Lux Excite Sink — a modern, high-end feature designed to bring both style and practicality to your home.\n\nFor just 40p per ticket, you could take home this luxury sink setup, complete with smart design, sleek finish, and built-in functionality that makes it more than just a sink — it is a statement piece.\n\n🪙 40p per entry\n🎟 1,000 total tickets\n📅 Draw Date: Once all tickets are sold\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n🚰 Lux Excite Sink (brand new and boxed)\n🚚 Free tracked delivery to the winner\n\nAdd a touch of luxury to your kitchen for less than 50p!\nEnter today for your chance to win the Lux Excite Sink — and upgrade your home in style.\n\n🎟 Grab your tickets now — only 1,000 available!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761221633/Win_a_Lux_Excite_Sink_dz6paf.png	instant	0.40	1000	9	{"delivery": "Free tracked delivery to winner", "mainPrize": "Lux Excite Sink (brand new and boxed)", "drawMethod": "Once all tickets are sold", "cashAlternative": "N/A"}	t	2025-10-23 17:39:00.586949	2025-10-28 13:15:22.852	0
78cc196f-ecb2-4fe3-a641-b9b1ccae89df	WIN A £1,000 TUI HOLIDAY VOUCHER – JUST 99p PER ENTRY!	✈️ WIN A £1,000 TUI HOLIDAY VOUCHER – JUST 99p PER ENTRY! 🌴\n\nDreaming of your next getaway? This is your chance to make it happen with a £1,000 TUI Holiday Voucher — the perfect ticket to sunshine, sea, and unforgettable memories. ☀️\n\nFor just 99p per ticket, you could be jetting off to your dream destination — or, if you would prefer, take £950 cash instead! 💷\n\n😮 99p per entry\n🎟 1,300 total tickets\n📅 Draw Date: Once all tickets are sold\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n🌍 £1,000 TUI Holiday Voucher\n💷 Or £950 cash alternative\n\nWhether it is a luxury escape, a family trip, or a last-minute city break — you choose the destination! ✈️\n\nEnter today for just 99p and turn your holiday dreams into reality.\n\n🎟 Grab your tickets now — only 1,300 available!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761399799/Copy_of_Untitled_Design_-_1_d9fuc7.png	instant	0.99	1300	0	{"delivery": "Voucher emailed or posted to winner", "mainPrize": "£1,000 TUI Holiday Voucher", "drawMethod": "Once all tickets are sold", "cashAlternative": "£950 Cash"}	t	2025-11-06 19:40:22.29172	2025-11-06 19:40:22.29172	0
906d21f7-ef97-47f1-8a8b-2d95695ba21e	WIN £1,000 TAX-FREE CASH – JUST 99p PER ENTRY! 🎄	💷 WIN £1,000 TAX-FREE CASH – JUST 99p PER ENTRY! 🎄\n\nChristmas is just around the corner — and this £1,000 tax-free cash prize could help pay for it! 💷\nFor just 99p per ticket, you could be our next lucky winner, taking home £1,000 straight to your bank account — just in time for the festive season.\n\nWhether it is presents, food, travel, or just a stress-free Christmas, this cash could make it happen for under £1!\n\n😮 99p per entry\n🎟 1,300 total tickets\n📅 Draw Date: Once all tickets are sold\n🏆 Winner drawn LIVE on Facebook via Ringtone Riches\n💷 £1,000 tax-free cash prize\n💳 Paid directly to the winner\n\nQuick, simple, and tax-free — you win, you keep it all!\nEnter now for just 99p, and you could have your Christmas fully paid for! 🎅💷\n\n🎟 Grab your tickets now — only 1,300 available!	https://res.cloudinary.com/dziy5sjas/image/upload/v1761221647/WIN_%C3%BA1000_TAX_FREE_CASH_c2t7rm.png	instant	0.99	1300	0	{"delivery": "Paid directly to winner’s bank account", "mainPrize": "£1,000 Tax-Free Cash", "drawMethod": "Once all tickets are sold"}	t	2025-11-06 19:42:37.086621	2025-11-06 19:42:37.086621	0
\.


--
-- TOC entry 4884 (class 0 OID 106534)
-- Dependencies: 218
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, competition_id, quantity, total_amount, payment_method, status, stripe_payment_intent_id, created_at, updated_at, wallet_amount, points_amount, cashflows_amount, payment_breakdown) FROM stdin;
4b2087a4-5da7-4b25-b37f-015666991a98	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	3	6.00	wallet	completed	\N	2025-10-24 19:09:30.976394	2025-10-24 14:09:30.991	0.00	0.00	0.00	\N
ce6abd7d-b182-40cd-a529-f9d694320e38	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet	completed	\N	2025-10-24 19:21:39.580242	2025-10-24 14:21:39.591	0.00	0.00	0.00	\N
dc534fa0-c9e6-41e0-94de-7d81b2b7fd72	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet	completed	\N	2025-10-24 19:28:31.334131	2025-10-24 14:28:31.332	0.00	0.00	0.00	\N
452a03af-344d-4d2d-a277-25be318a9da1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet	completed	\N	2025-10-25 16:14:51.407525	2025-10-25 11:14:51.44	0.00	0.00	0.00	\N
7050cd95-517c-46c0-8f63-cf63c418befc	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet	completed	\N	2025-10-25 16:15:09.207462	2025-10-25 11:15:09.218	0.00	0.00	0.00	\N
b942010e-64df-4825-a9e6-fbe1b943681f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	5	10.00	wallet_points_only	completed	\N	2025-10-28 15:14:06.124956	2025-10-28 10:16:25.258	10.00	0.00	0.00	[{"method":"wallet","amount":10,"description":"Site Credit: £10.00"}]
2e991300-10b5-4a80-b7a7-438130d4962b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	6	12.00	mixed	pending	\N	2025-10-28 15:19:31.380493	2025-10-28 10:20:12.067	0.00	0.00	12.00	[]
2803606a-c23d-4e7c-8ffe-fba2307c52cb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet	completed	\N	2025-10-28 15:40:35.58247	2025-10-28 10:40:35.593	0.00	0.00	0.00	\N
96cbb544-bf79-4715-94b0-9f798a12fa7c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet	completed	\N	2025-10-28 15:40:57.954948	2025-10-28 10:40:57.962	0.00	0.00	0.00	\N
f57f4f77-b5d8-4c80-a9d4-6f81501bbc53	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet	completed	\N	2025-10-28 16:59:22.061414	2025-10-28 11:59:22.08	0.00	0.00	0.00	\N
4c2228af-bc87-4995-9693-da3dfbb8d865	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet	completed	\N	2025-10-24 18:37:07.685206	2025-10-24 13:37:07.703	0.00	0.00	0.00	\N
cfdc5f4f-920f-4a03-a7d3-4dc7bde183ce	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	18	36.00	cashflows	pending	\N	2025-10-24 18:37:16.145497	2025-10-24 18:37:16.145497	0.00	0.00	0.00	\N
0d53a9b2-b957-4c95-9990-36cf7b0b5c5e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	1	0.40	wallet	completed	\N	2025-10-28 17:25:37.505334	2025-10-28 12:25:37.519	0.00	0.00	0.00	\N
e43e089b-f2d6-4b27-8d87-bbdd46ffab1b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet	completed	\N	2025-10-28 17:25:48.027293	2025-10-28 12:25:48.039	0.00	0.00	0.00	\N
55874828-068f-4c47-871e-707d9a477c92	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	1	0.40	wallet	completed	\N	2025-10-28 17:34:10.043163	2025-10-28 12:34:10.055	0.00	0.00	0.00	\N
560624e1-dc4d-4830-a466-0f44942ee93a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet	completed	\N	2025-10-28 17:36:40.169728	2025-10-28 12:36:40.18	0.00	0.00	0.00	\N
a9af0cdc-279d-4502-9bc2-a1216a2a7979	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	46b0a15b-293d-4ae1-957b-463eb9fe96d1	1	0.50	wallet	completed	\N	2025-10-28 18:14:52.925196	2025-10-28 13:14:52.939	0.00	0.00	0.00	\N
4c5e2834-8d9e-48c2-ad9b-3596ad785a88	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	7	2.80	wallet	completed	\N	2025-10-28 18:15:22.839262	2025-10-28 13:15:22.854	0.00	0.00	0.00	\N
cd22b066-f8f1-47c2-b30f-5b097f3e0f08	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	5	10.00	wallet_points_only	completed	\N	2025-10-29 13:17:45.25383	2025-10-29 08:21:07.412	10.00	0.00	0.00	[{"method":"wallet","amount":10,"description":"Wallet: £10.00"}]
e42250ad-1a84-4981-959a-279ccc3200e7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	a3c74369-bcaa-4ac0-8a45-610b9e831039	2	0.00	wallet	completed	\N	2025-10-30 17:15:00.438476	2025-10-30 12:15:00.471	0.00	0.00	0.00	\N
bcd92095-6e66-4d26-b324-d2efff095b6a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	a3c74369-bcaa-4ac0-8a45-610b9e831039	2	0.00	wallet	completed	\N	2025-10-30 17:15:06.673382	2025-10-30 12:15:06.689	0.00	0.00	0.00	\N
d830b745-e3f9-414f-b337-ded52807a07a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet	completed	\N	2025-10-31 15:01:47.782013	2025-10-31 10:01:47.792	0.00	0.00	0.00	\N
d086dd51-9f57-4c3d-b1e7-48d335086c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-10-31 14:11:20.583068	2025-10-31 09:26:05.288	0.00	200.00	0.00	[{"method":"ringtone_points","amount":2,"pointsUsed":200,"description":"Wolf Points: £2.00 (200 points)"}]
6e44d0f0-6104-44dd-8896-9d57cb285f2b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 15:20:01.329024	2025-10-31 10:20:05.964	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
1be0ab53-ddba-489a-9956-69340b015add	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	44	88.00	wallet_points_only	completed	\N	2025-10-31 14:27:18.285702	2025-10-31 09:27:25.328	0.00	8800.00	0.00	[{"method":"ringtone_points","amount":88,"pointsUsed":8800,"description":"Wolf Points: £88.00 (8800 points)"}]
22e51667-249b-48a5-8a0f-0916ee0e7c06	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 15:09:05.401451	2025-10-31 10:10:37.452	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
5a2654b5-babe-4567-90e0-271b5da226d4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-10-31 14:37:15.207163	2025-10-31 09:46:20.062	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Site Credit: £2.00"}]
ec797b35-5aaa-41b2-9f36-e80d138da98f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	pending	pending	\N	2025-10-31 14:57:24.882701	2025-10-31 14:57:24.882701	0.00	0.00	0.00	\N
266a3533-502e-4e4e-a487-ca18a98f0d8b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	mixed	pending	\N	2025-10-31 14:57:50.149868	2025-10-31 09:58:38.66	0.00	0.00	2.00	[]
6af596dd-595b-49fe-96c4-2b06f7b7ec3a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet	completed	\N	2025-10-31 15:01:34.397041	2025-10-31 10:01:34.408	0.00	0.00	0.00	\N
2470d854-e190-4e64-810b-2dfd60d6c6cb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 15:15:52.486175	2025-10-31 10:15:56.535	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
9d0a840a-43d9-4a91-805a-2e8239351bad	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	21	42.00	pending	pending	\N	2025-10-31 15:32:55.18512	2025-10-31 15:32:55.18512	0.00	0.00	0.00	\N
6bc8815b-7f64-4dc6-9754-e35dbf8e08db	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 15:23:00.392916	2025-10-31 10:23:04.636	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
848f1b6b-6b6e-47df-8f75-e8d51011efd1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 15:21:51.755615	2025-10-31 10:21:56.758	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
c9f979af-d8f5-49ca-9add-037434bf32c7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 15:24:56.426801	2025-10-31 10:24:59.412	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
8491b835-5f87-4d09-ac41-db7812203318	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	13	26.00	pending	pending	\N	2025-10-31 15:31:37.725431	2025-10-31 15:31:37.725431	0.00	0.00	0.00	\N
2276b551-2c15-41d4-9e05-ede624363cf7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 16:15:24.987818	2025-10-31 11:15:29.112	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
a2cab791-7cc0-4560-a02d-3560f4e9803c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 16:17:28.729056	2025-10-31 11:17:32.415	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
f82864c4-927e-4cf9-90c4-dbd9b03626c1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 16:52:28.792307	2025-10-31 11:52:35.769	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
5df387ad-a24f-4d62-a4c2-b1591c3b8086	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	7	14.00	wallet_points_only	completed	\N	2025-11-04 19:03:36.536713	2025-11-04 14:03:40.189	14.00	0.00	0.00	[{"method":"wallet","amount":14,"description":"Wallet: £14.00"}]
cddf2794-e70d-48c9-9073-c0956e3c84f3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	227	454.00	wallet_points_only	completed	\N	2025-10-31 16:54:42.342269	2025-10-31 11:54:46.069	454.00	0.00	0.00	[{"method":"wallet","amount":454,"description":"Wallet: £454.00"}]
84731f42-fb0a-42d6-b271-db8276ba2b54	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-10-31 16:56:34.56683	2025-10-31 11:56:39.182	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
0666d116-3815-47bc-8c11-d5b6fdc23e92	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-11-04 13:29:09.573903	2025-11-04 08:29:29.462	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Site Credit: £2.00"}]
b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	93	186.00	wallet_points_only	completed	\N	2025-11-04 19:15:35.682655	2025-11-04 14:15:39.467	186.00	0.00	0.00	[{"method":"wallet","amount":186,"description":"Wallet: £186.00"}]
65f24ae1-df60-4c46-836c-c9ac21640f50	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-11-04 13:32:13.399564	2025-11-04 08:32:19.875	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
e8461e70-648c-48cb-9776-ac9a8253fd90	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-11-04 14:04:14.175035	2025-11-04 09:04:17.91	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
b6d2dfb3-cbfa-40d9-8276-0090f0766f17	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	4	8.00	wallet_points_only	completed	\N	2025-11-04 20:13:15.244951	2025-11-04 15:13:20.921	0.00	800.00	0.00	[{"method":"ringtone_points","amount":8,"pointsUsed":800,"description":"Wolf Points: £8.00 (800 points)"}]
5978533c-0e82-4d82-91e2-615ec9606988	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-11-04 14:38:55.130197	2025-11-04 09:38:59.229	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
164c765a-d945-440b-8c26-1c874bf7835b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	5	10.00	wallet_points_only	completed	\N	2025-11-04 19:41:49.965608	2025-11-04 14:41:54.014	10.00	0.00	0.00	[{"method":"wallet","amount":10,"description":"Wallet: £10.00"}]
fe603709-ff80-4aa4-8ef6-b4f031ffddad	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-11-04 14:48:35.180546	2025-11-04 09:48:51.125	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
d79809bd-7738-4e89-9878-42a62f6f9f5b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-11-04 14:58:53.435712	2025-11-04 09:58:57.086	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
f2089ac9-c87c-4974-87d4-daa3f85e929a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	7	14.00	wallet_points_only	completed	\N	2025-11-04 16:44:22.031277	2025-11-04 11:44:25.525	14.00	0.00	0.00	[{"method":"wallet","amount":14,"description":"Wallet: £14.00"}]
d23b4811-0687-4153-b8f8-cd3e3b1b82f7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	5	10.00	wallet_points_only	completed	\N	2025-11-04 19:44:28.798476	2025-11-04 14:44:31.694	10.00	0.00	0.00	[{"method":"wallet","amount":10,"description":"Wallet: £10.00"}]
291828fa-3d11-4ce0-95f6-714ce5711350	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-11-04 17:29:29.83833	2025-11-04 12:29:33.427	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Wallet: £2.00"}]
fd5c5289-4472-42a4-beb6-fabcef1a6c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	11	22.00	wallet_points_only	completed	\N	2025-11-04 17:54:57.851804	2025-11-04 12:55:01.914	22.00	0.00	0.00	[{"method":"wallet","amount":22,"description":"Wallet: £22.00"}]
2fa52ef8-98a1-4e1b-b57b-2f64ab8b16aa	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	5	10.00	wallet_points_only	completed	\N	2025-11-04 19:45:47.074637	2025-11-04 14:45:49.839	10.00	0.00	0.00	[{"method":"wallet","amount":10,"description":"Wallet: £10.00"}]
624d0b6e-20ef-4391-93fd-214067c5f72b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	7	14.00	wallet_points_only	completed	\N	2025-11-04 20:30:58.771333	2025-11-04 15:31:04.742	0.00	1400.00	0.00	[{"method":"ringtone_points","amount":14,"pointsUsed":1400,"description":"Wolf Points: £14.00 (1400 points)"}]
9723d821-cb39-4c07-a2b6-6d1f83d2a587	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	8	16.00	wallet_points_only	completed	\N	2025-11-04 19:47:00.406867	2025-11-04 14:47:04.958	0.00	1600.00	0.00	[{"method":"ringtone_points","amount":16,"pointsUsed":1600,"description":"Wolf Points: £16.00 (1600 points)"}]
2a39030c-5e50-48f3-adc6-15a163ad75dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	7	14.00	wallet_points_only	completed	\N	2025-11-04 19:52:22.574013	2025-11-04 14:52:25.346	0.00	1400.00	0.00	[{"method":"ringtone_points","amount":14,"pointsUsed":1400,"description":"Wolf Points: £14.00 (1400 points)"}]
a597569f-5364-4bf6-b2bb-1d4f3eda4f84	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	2	4.00	wallet_points_only	completed	\N	2025-11-05 16:54:34.726264	2025-11-05 11:54:41.285	4.00	0.00	0.00	[{"method":"wallet","amount":4,"description":"Site Credit: £4.00"}]
5b440d1c-0621-4855-8f31-3efab119904f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	3	6.00	wallet_points_only	completed	\N	2025-11-05 16:52:49.860444	2025-11-05 11:52:53.332	6.00	0.00	0.00	[{"method":"wallet","amount":6,"description":"Site Credit: £6.00"}]
baca1cce-1556-4c4f-a82a-979a4f26c9ae	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	3	6.00	wallet_points_only	completed	\N	2025-11-05 16:53:33.206138	2025-11-05 11:53:39.77	0.00	600.00	0.00	[{"method":"ringtone_points","amount":6,"pointsUsed":600,"description":"Wolf Points: £6.00 (600 points)"}]
a73aff3d-29ce-41a3-a64c-cb619f5a49ca	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	2	4.00	wallet_points_only	completed	\N	2025-11-05 16:57:55.550875	2025-11-05 11:57:59.214	4.00	0.00	0.00	[{"method":"wallet","amount":4,"description":"Site Credit: £4.00"}]
4a58982b-efa3-43f0-aba2-806f02959bf0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	2	4.00	wallet_points_only	completed	\N	2025-11-05 17:00:13.717097	2025-11-05 12:00:18.599	0.00	400.00	0.00	[{"method":"ringtone_points","amount":4,"pointsUsed":400,"description":"Wolf Points: £4.00 (400 points)"}]
fa233352-32e0-4545-b38a-68027f1661b6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-11-05 17:02:30.925151	2025-11-05 12:02:34.654	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Site Credit: £2.00"}]
4c30d89d-76d2-4f30-acc4-7457891194d1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-11-05 17:03:03.401053	2025-11-05 12:03:06.589	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Site Credit: £2.00"}]
a78075da-a168-4b85-88e6-c541e8989c7e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-11-05 17:06:10.923266	2025-11-05 12:06:13.743	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Site Credit: £2.00"}]
85f6cdef-b0b1-4a8f-9db4-1aa7bd169652	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-11-05 17:09:34.883745	2025-11-05 12:09:37.99	2.00	0.00	0.00	[{"method":"wallet","amount":2,"description":"Site Credit: £2.00"}]
bd617b74-0a69-44ed-89cd-17331866a016	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	3	6.00	wallet_points_only	completed	\N	2025-11-05 17:35:54.602244	2025-11-05 12:35:57.398	6.00	0.00	0.00	[{"method":"wallet","amount":6,"description":"Site Credit: £6.00"}]
15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	10	20.00	wallet_points_only	completed	\N	2025-11-05 17:40:35.843139	2025-11-05 12:40:39.699	0.00	2000.00	0.00	[{"method":"ringtone_points","amount":20,"pointsUsed":2000,"description":"Wolf Points: £20.00 (2000 points)"}]
ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	8	16.00	wallet_points_only	completed	\N	2025-11-05 18:30:14.149433	2025-11-05 13:30:18.608	16.00	0.00	0.00	[{"method":"wallet","amount":16,"description":"Site Credit: £16.00"}]
40b13009-c7c0-467b-925e-de9b23711e10	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	pending	pending	\N	2025-11-05 18:36:35.048742	2025-11-05 18:36:35.048742	0.00	0.00	0.00	\N
dc81e7f5-093c-4e63-b700-fa772265e579	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	208	416.00	wallet_points_only	completed	\N	2025-11-06 17:51:02.097341	2025-11-06 12:51:10.138	416.00	0.00	0.00	[{"method":"wallet","amount":416,"description":"Site Credit: £416.00"}]
89d9d240-73c2-4d51-825f-282c7db88764	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	3	6.00	wallet_points_only	completed	\N	2025-11-05 18:43:07.739275	2025-11-05 13:43:17.508	6.00	0.00	0.00	[{"method":"wallet","amount":6,"description":"Site Credit: £6.00"}]
ff8ff709-0eed-4cb8-a4c2-46cb8f13e0a0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-11-05 18:44:14.183034	2025-11-05 13:44:19.285	0.00	200.00	0.00	[{"method":"ringtone_points","amount":2,"pointsUsed":200,"description":"Wolf Points: £2.00 (200 points)"}]
dd87f6a6-535c-46e8-8811-816769bf0803	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	1	2.00	wallet_points_only	completed	\N	2025-11-05 19:40:33.510569	2025-11-05 14:40:39.148	0.00	200.00	0.00	[{"method":"ringtone_points","amount":2,"pointsUsed":200,"description":"Wolf Points: £2.00 (200 points)"}]
73b33ae3-98fd-44f3-be65-2c96b2e70e96	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	2	4.00	wallet_points_only	completed	\N	2025-11-07 15:56:42.87007	2025-11-07 10:56:53.236	4.00	0.00	0.00	[{"method":"wallet","amount":4,"description":"Wallet: £4.00"}]
1fecfafc-394d-40f6-9940-cee68f7fcb25	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	2	4.00	wallet_points_only	completed	\N	2025-11-05 20:07:48.836285	2025-11-05 15:07:52.921	0.00	400.00	0.00	[{"method":"ringtone_points","amount":4,"pointsUsed":400,"description":"Wolf Points: £4.00 (400 points)"}]
57c54973-a6d5-4353-9dd3-56dbc9147f2f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	mixed	pending	\N	2025-11-05 20:12:50.179555	2025-11-05 15:12:55.369	0.00	0.00	2.00	[]
3f73e453-d7d4-4bf0-9fac-2299204c8c88	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	9	18.00	wallet_points_only	completed	\N	2025-11-06 15:30:57.79901	2025-11-06 10:31:01.192	18.00	0.00	0.00	[{"method":"wallet","amount":18,"description":"Site Credit: £18.00"}]
a8fa5f9b-ab56-494e-bead-e80189921f3d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	1	2.00	wallet_points_only	completed	\N	2025-11-06 15:35:18.729174	2025-11-06 10:35:21.899	0.00	200.00	0.00	[{"method":"ringtone_points","amount":2,"pointsUsed":200,"description":"Wolf Points: £2.00 (200 points)"}]
46e878de-2bcc-4340-b2ce-6abe631515ab	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	2	4.00	wallet_points_only	completed	\N	2025-11-07 16:21:53.77544	2025-11-07 11:22:48.99	0.00	400.00	0.00	[{"method":"ringtone_points","amount":4,"pointsUsed":400,"description":"Wolf Points: £4.00 (400 points)"}]
98a88517-ec1c-4a39-aae8-e4bcf40094f9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	2	4.00	wallet_points_only	completed	\N	2025-11-06 15:48:10.806977	2025-11-06 10:48:14.618	4.00	0.00	0.00	[{"method":"wallet","amount":4,"description":"Site Credit: £4.00"}]
cd156200-41b3-4aae-b130-42bbdc416d4f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	3	6.00	wallet_points_only	completed	\N	2025-11-06 16:21:19.878475	2025-11-06 11:21:24.287	0.00	600.00	0.00	[{"method":"ringtone_points","amount":6,"pointsUsed":600,"description":"Wolf Points: £6.00 (600 points)"}]
12eb82db-7485-4b1b-a4b4-cc4c297ffede	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	5	10.00	wallet_points_only	completed	\N	2025-11-06 17:09:12.135954	2025-11-06 12:09:36.199	10.00	0.00	0.00	[{"method":"wallet","amount":10,"description":"Site Credit: £10.00"}]
\.


--
-- TOC entry 4891 (class 0 OID 147481)
-- Dependencies: 225
-- Data for Name: scratch_card_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scratch_card_usage (id, order_id, user_id, used_at) FROM stdin;
7828646e-57ae-4168-bee8-5231b0c126dd	f82864c4-927e-4cf9-90c4-dbd9b03626c1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-10-31 11:53:15.939
d6e3dc6c-a40b-4dc8-9d67-721b63afc928	e8461e70-648c-48cb-9776-ac9a8253fd90	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 09:04:35.934
c166c2ea-0ce0-4ef9-b11d-99871ce40263	5978533c-0e82-4d82-91e2-615ec9606988	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 09:39:58.747
038032b3-10c4-4108-927c-cdf1241f4494	fe603709-ff80-4aa4-8ef6-b4f031ffddad	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 09:49:08.007
aa1696ec-b756-4c37-a95d-d5adbc9a4e0a	d79809bd-7738-4e89-9878-42a62f6f9f5b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 10:01:48.67
baf55d5b-69ee-4797-8763-9f28d5f25659	f2089ac9-c87c-4974-87d4-daa3f85e929a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 11:44:48.482
41d0e8b2-0d0a-4d27-ba49-47f87c436df6	f2089ac9-c87c-4974-87d4-daa3f85e929a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 11:44:59.781
a66c4aa8-b613-4905-8483-8e6ffe64ecbd	f2089ac9-c87c-4974-87d4-daa3f85e929a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 11:45:11.046
5a27e456-47a6-45b5-ae3d-efb890e327c6	f2089ac9-c87c-4974-87d4-daa3f85e929a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 11:45:36.789
25a0d41e-eb41-4b82-a6a7-68aa7e0b3759	f2089ac9-c87c-4974-87d4-daa3f85e929a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 11:46:00.794
8a2f2e29-fb13-4d37-96a4-2a5a11e891d5	291828fa-3d11-4ce0-95f6-714ce5711350	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 12:54:33.284
be710e3d-c72c-416d-8591-51387b15c611	fd5c5289-4472-42a4-beb6-fabcef1a6c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 12:55:41.725
fd53ac14-dfa3-4367-8d99-9d629a932736	fd5c5289-4472-42a4-beb6-fabcef1a6c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 12:59:27.665
12cbcb5e-6d05-4056-9074-75c493f633bc	fd5c5289-4472-42a4-beb6-fabcef1a6c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 12:59:43.446
50d796a5-e615-467d-9442-32447dd34e89	fd5c5289-4472-42a4-beb6-fabcef1a6c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 13:02:16.172
ad44e3af-b106-442d-9eaf-a225cdc5e41c	fd5c5289-4472-42a4-beb6-fabcef1a6c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 13:02:28.549
d89c29cd-579a-4bc1-bede-8d766ec8cfb1	fd5c5289-4472-42a4-beb6-fabcef1a6c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 13:35:50.224
900e5ba7-8d63-40af-a96a-9747bfef3f29	fd5c5289-4472-42a4-beb6-fabcef1a6c67	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 13:35:58.189
3b79f2da-35fd-43f7-998a-46a49888c1a1	5df387ad-a24f-4d62-a4c2-b1591c3b8086	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:06:03.284
15a4d704-1cf4-44ac-ab83-18c5baa270c5	5df387ad-a24f-4d62-a4c2-b1591c3b8086	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:06:42.317
7c4a066f-0727-4f27-a6f6-17695bc95ee2	5df387ad-a24f-4d62-a4c2-b1591c3b8086	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:07:07.41
45d1445f-680e-4ba6-bbbe-7fc6493584a7	5df387ad-a24f-4d62-a4c2-b1591c3b8086	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:11:19.888
8a391a31-29f2-437f-8913-7c1a7c014393	5df387ad-a24f-4d62-a4c2-b1591c3b8086	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:11:58.291
7df2a6ff-9e77-483a-9d51-9735a636fd4a	5df387ad-a24f-4d62-a4c2-b1591c3b8086	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:15:08.069
f3500c01-b8f4-480c-9c36-df955ae9b5a7	5df387ad-a24f-4d62-a4c2-b1591c3b8086	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:15:16.78
e21acadd-186f-4e31-a097-2675948ff420	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:15:53.672
47726a49-f807-4b5d-bc7f-2938e4a655ab	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:20:49.624
46d924aa-22ca-4161-af55-6399c199b948	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:25:12.087
57264f1c-9a36-41c4-85f0-c7c5c17c8be3	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:25:40.22
5a502bf4-7bd7-4de0-93ae-d321fb5ea422	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:25:49.855
eb314d50-b438-4cad-92ba-f6b09e374a9f	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:27:31.906
21eee124-f8f7-4414-a11a-3755fd3b9652	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:27:44.454
cca9d64b-0523-488e-8a37-36b39a229729	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:27:49.681
37e6d5fa-c507-4027-8879-0fe83c1125a5	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:32:37.379
02188eac-52de-4d7a-8706-6d548cdf4129	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:40:01.406
0cbc477b-e2b4-44ab-86d1-adec82e326ce	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:40:07.054
43e9546e-eb59-4825-9d50-3c3004b22dcf	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:40:56.543
4ab26496-e512-46fa-86af-0f6621bd432c	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:41:26.184
2879ec8b-fd67-464c-8f19-d5ac7b6a05c6	164c765a-d945-440b-8c26-1c874bf7835b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:42:59.31
139fca0a-7bd7-4f23-94e4-4587907c253c	164c765a-d945-440b-8c26-1c874bf7835b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:43:34.351
da4d7bc0-5be7-43ae-b57d-567c0c8bb2ee	164c765a-d945-440b-8c26-1c874bf7835b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:43:39.26
13c4ba8d-6fac-4b1f-aa98-33a88e819a48	164c765a-d945-440b-8c26-1c874bf7835b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:43:56.486
0a60e884-1046-43b0-917e-efab9a779c0c	164c765a-d945-440b-8c26-1c874bf7835b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:44:04.216
980f88c7-7380-4400-b1d6-2a8118fca2f0	d23b4811-0687-4153-b8f8-cd3e3b1b82f7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:44:43.66
f56f068c-9adb-45ac-bd5f-3d1d82c3b92e	d23b4811-0687-4153-b8f8-cd3e3b1b82f7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:45:15.415
933581e4-fbb0-4306-8039-4d6e4ebf4c3e	d23b4811-0687-4153-b8f8-cd3e3b1b82f7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:45:26.565
79efff2f-11d1-4681-95c1-044b564c95b6	2fa52ef8-98a1-4e1b-b57b-2f64ab8b16aa	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:45:57.848
b2c184e3-2f75-4eb7-bf92-a4c705d11e90	2fa52ef8-98a1-4e1b-b57b-2f64ab8b16aa	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:46:27.285
5690cd39-8777-4a65-8ef3-5b488a3eb899	9723d821-cb39-4c07-a2b6-6d1f83d2a587	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:47:16.995
11f0a679-d6e7-4687-800e-b85546a037b9	9723d821-cb39-4c07-a2b6-6d1f83d2a587	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:47:22.379
52061ff7-8577-46e2-8a92-3c4f2fc1d785	9723d821-cb39-4c07-a2b6-6d1f83d2a587	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:47:26.116
09e4229e-97f4-4b89-867f-9a47b802c452	9723d821-cb39-4c07-a2b6-6d1f83d2a587	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:47:31.121
94be31e8-0dec-4b4e-a115-7a277d71d034	9723d821-cb39-4c07-a2b6-6d1f83d2a587	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:47:35.019
d3ae0f29-28c4-441c-81aa-eec6fedf2246	9723d821-cb39-4c07-a2b6-6d1f83d2a587	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:47:40.138
8df95921-51b9-4a7b-a08d-86cc329726aa	9723d821-cb39-4c07-a2b6-6d1f83d2a587	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:47:48.908
d7faf25b-3961-4d4b-a0a4-b58810ae493e	2a39030c-5e50-48f3-adc6-15a163ad75dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:52:35.967
03bfb98a-4022-449e-89f9-cb5b5ece3ed7	2a39030c-5e50-48f3-adc6-15a163ad75dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:53:05.136
19fbd9a6-dcb9-4065-bddd-cec01f032521	2a39030c-5e50-48f3-adc6-15a163ad75dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:57:14.304
da93abfd-9881-43d2-9f6a-cb407c18fa90	2a39030c-5e50-48f3-adc6-15a163ad75dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:57:22.315
93945942-b7f6-41b7-b971-ac5db9e2a73d	2a39030c-5e50-48f3-adc6-15a163ad75dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:57:26.666
d64cac87-7325-41c8-9bcc-13891c9e9328	2a39030c-5e50-48f3-adc6-15a163ad75dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:57:31.926
4b0be207-5599-49f3-b87f-a7226ab0fb8f	2a39030c-5e50-48f3-adc6-15a163ad75dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 14:57:36.824
fc17d140-2504-4910-b60f-c54178eb84f8	b6d2dfb3-cbfa-40d9-8276-0090f0766f17	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:13:41.268
44548ba1-efe7-47f0-8e0e-9064912d77f9	b6d2dfb3-cbfa-40d9-8276-0090f0766f17	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:14:16.253
7f4382ed-ad2a-4764-8704-98fd500e3b99	b6d2dfb3-cbfa-40d9-8276-0090f0766f17	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:22:13.626
2e5c456b-c441-4e28-9fe4-7547e3ae4209	b6d2dfb3-cbfa-40d9-8276-0090f0766f17	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:22:24.619
34cd0c28-d57f-4133-baa7-b94373b9d0de	624d0b6e-20ef-4391-93fd-214067c5f72b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:31:26.592
89b39adc-274e-4b41-856c-13af06aef559	624d0b6e-20ef-4391-93fd-214067c5f72b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:31:36.09
5dcfbd26-df87-486e-87a3-9979b7cf4743	624d0b6e-20ef-4391-93fd-214067c5f72b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:31:47.051
03c05df0-a00a-49f2-a115-7d323cff9bc1	624d0b6e-20ef-4391-93fd-214067c5f72b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:31:53.048
8ed6b275-ec1d-40f7-86ff-de5f71376ca6	624d0b6e-20ef-4391-93fd-214067c5f72b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:32:01.777
31cb8936-3a42-4a50-9135-2a5b8cd912c7	624d0b6e-20ef-4391-93fd-214067c5f72b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:32:09.747
ac271a85-1065-49b8-8660-a5d53ea7ffbf	624d0b6e-20ef-4391-93fd-214067c5f72b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-04 15:32:53.407
569de38d-9fc2-401b-a78e-feb4a63a0938	dd87f6a6-535c-46e8-8811-816769bf0803	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 14:40:45.122
cb15208e-2945-4046-9f73-04c15a52012b	73b33ae3-98fd-44f3-be65-2c96b2e70e96	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-07 10:57:01.916
3dbf0ce6-c51f-4f27-a40f-314169848d8c	73b33ae3-98fd-44f3-be65-2c96b2e70e96	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-07 10:57:07.206
\.


--
-- TOC entry 4885 (class 0 OID 106545)
-- Dependencies: 219
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
UWWihgSR6Iq_HQx7MKB5udQ_YhzIEk31	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-13T10:35:10.739Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "userId": "4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b"}	2025-11-13 16:13:17
WaV99HIBlLPd_gx0Pxvmp4nwfmmqbHEE	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-13T14:51:24.266Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "userId": "b4f9c13a-a371-442d-b93a-dfab300fc632"}	2025-11-13 19:53:52
3LPbw1G6HkQd7OlLpj00FcAh37xf1T79	{"cookie": {"path": "/", "secure": false, "expires": "2025-11-13T11:21:03.132Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "userId": "4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b"}	2025-11-14 16:58:52
\.


--
-- TOC entry 4890 (class 0 OID 139289)
-- Dependencies: 224
-- Data for Name: spin_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spin_usage (id, order_id, user_id, used_at) FROM stdin;
75438761-3bb4-418b-ab33-7d66c6876f5c	85f6cdef-b0b1-4a8f-9db4-1aa7bd169652	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 12:32:15.831
bb291583-aa7f-4bfe-b1e2-bdf8937bd5cb	bd617b74-0a69-44ed-89cd-17331866a016	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 12:36:20.314
4a46458d-709b-4aa3-bea7-86f934f9940d	bd617b74-0a69-44ed-89cd-17331866a016	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 12:40:01.313
a699d1ed-3233-4725-9307-bb9851e722d0	bd617b74-0a69-44ed-89cd-17331866a016	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 12:40:18.479
87e0e672-473c-4245-b3c2-0244d241c556	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 12:42:42.693
51bafe04-60af-492b-8c88-533d3b5cb3f1	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 12:45:34.078
342f8514-9dd4-4afe-a015-63a421f44ff2	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 12:45:47.541
4325ebc3-323e-4b21-9063-e43e7a9def4e	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 12:56:38.592
8831f953-3b80-4fc2-80a9-325ad744948f	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:01:15.387
798bb86a-7107-4d98-9bbf-8ebaa4798a16	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:23:57.36
5509841c-ece3-4a63-aceb-eae6acf0c0a2	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:24:08.863
311ec13a-f52b-4075-a798-05e7a1e68aaa	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:24:26.881
ac0d86db-8e58-4b63-a4d7-dcfd9561fbe7	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:24:36.908
d978159e-4892-45a0-a3f8-871d1e18ef7f	15114143-b8de-4a08-ade2-63930d711177	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:24:48.757
3877c848-64f2-4aae-888d-0ecd7223d5f9	ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:30:31.352
cf8b02ee-168d-4d64-9b60-0ace3a7a9031	ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:30:43.907
fa063e39-cb75-4a49-ba4c-3955c2ca0224	ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:30:55.4
bb4527c2-83b5-4346-832a-d38bbde97285	ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:31:13.384
c7db806e-6bae-4341-b8c8-9c670ccbed9d	ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:31:22.219
63226c90-fd34-45af-8a59-c4141d2944f2	ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:31:33.96
9f13621c-c71b-4bdb-a0b4-aca983d90478	ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:31:41.219
f403a0b8-613e-45c4-b2ea-0e2c96f2e261	ff741e39-174b-4286-88b5-bbd9c8eafd9c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:31:56.265
7665decc-c4ba-4bc6-8bd9-7670a5e171d0	89d9d240-73c2-4d51-825f-282c7db88764	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:43:40.131
d028120f-7272-496b-bf7d-67c1ef95e512	89d9d240-73c2-4d51-825f-282c7db88764	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:43:49.707
26940ea3-7b2b-4814-b807-a88b02e98af4	89d9d240-73c2-4d51-825f-282c7db88764	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-05 13:43:58.727
0f52ae2a-04e3-4b58-907b-15fd2b3e2d36	98a88517-ec1c-4a39-aae8-e4bcf40094f9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 10:48:55.093
7d53c652-b0b7-4e7c-99f7-3e4a1f12861a	98a88517-ec1c-4a39-aae8-e4bcf40094f9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 11:02:02.742
80c297bd-178c-4407-8ad8-ac8449954c13	cd156200-41b3-4aae-b130-42bbdc416d4f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 12:08:37.846
e9c9a3de-e1da-468a-af01-a59857ef7f02	cd156200-41b3-4aae-b130-42bbdc416d4f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 12:08:45.146
03761dc9-2fe9-4f47-9b63-9e0c67d9549b	cd156200-41b3-4aae-b130-42bbdc416d4f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 12:08:50.828
a4a8bfa4-029c-4152-b4c7-246fc6d95c28	12eb82db-7485-4b1b-a4b4-cc4c297ffede	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 12:50:15.424
19d6d65c-8901-46f4-b554-52aef6f37ec7	12eb82db-7485-4b1b-a4b4-cc4c297ffede	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 12:50:25.774
3677cbc1-8fbb-4630-8486-4219c0e15b9d	12eb82db-7485-4b1b-a4b4-cc4c297ffede	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 12:50:32.95
258817e3-b2e1-47bf-8c75-3c1b63e39237	12eb82db-7485-4b1b-a4b4-cc4c297ffede	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 12:50:39.982
09b99d72-1e46-4aba-8a17-ec35b43b0a12	12eb82db-7485-4b1b-a4b4-cc4c297ffede	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 12:50:48.167
4489e16a-3826-462b-89e9-9054e4007b05	dc81e7f5-093c-4e63-b700-fa772265e579	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 13:06:53.61
600c4faf-c1f1-44fd-bc65-dc8ceb417cef	dc81e7f5-093c-4e63-b700-fa772265e579	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 13:29:29.57
9071fcae-c6b4-485e-b9a8-b7d65b4e3dff	dc81e7f5-093c-4e63-b700-fa772265e579	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 13:46:52.65
61c95d27-e590-4dac-998b-3c1181f3f686	dc81e7f5-093c-4e63-b700-fa772265e579	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 13:48:07.271
4e4af2b9-ee82-45ed-a159-fdd3d10dcc22	dc81e7f5-093c-4e63-b700-fa772265e579	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 13:54:41.268
a9cbbcd0-67c6-4a8d-8bc0-98b90f6403ef	dc81e7f5-093c-4e63-b700-fa772265e579	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-06 13:54:47.171
71abb263-1062-4c44-b81f-f5f4875acfad	46e878de-2bcc-4340-b2ce-6abe631515ab	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	2025-11-07 11:23:01.199
\.


--
-- TOC entry 4886 (class 0 OID 106552)
-- Dependencies: 220
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, user_id, competition_id, ticket_number, is_winner, prize_amount, created_at) FROM stdin;
41869e48-5040-4907-9e6b-616908f12c0e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	EYXLUKJ5	f	\N	2025-10-24 18:37:07.701139
a129c1bd-4e44-4653-8f6b-f9267e96a494	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	TTBP_B-0	f	\N	2025-10-24 19:09:30.997867
1f6b3de6-7b55-4da7-a7e6-62278321d8be	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	QJ6REDK9	f	\N	2025-10-24 19:09:31.000928
8072a7b7-6219-4931-a117-5c74fe3c6dea	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	QZZI3FXT	f	\N	2025-10-24 19:09:31.0019
10750677-d526-424f-b470-71815417f65f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	TVBDHNAA	f	\N	2025-10-24 19:21:39.590156
76bbaf80-c490-422b-a305-2c2f4d748343	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	LX0NQS5V	f	\N	2025-10-24 19:28:31.34193
1d037501-8f80-4c71-8408-d76f9e83fd43	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	NBJEXL2Q	f	\N	2025-10-25 16:14:51.437571
2c499c37-5aff-45da-b4b6-58f184000df1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	NRI-QDZE	f	\N	2025-10-28 15:40:35.591315
19653c88-cbb2-428a-b0ec-ce0679803aa2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	5A9LM5RG	f	\N	2025-10-28 15:40:57.961675
91c79337-e638-46c8-ab9b-8b1e0606600b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	5daa774d-a8d7-4404-a3d4-382609be0c25	640D9UJ3	f	\N	2025-10-28 16:59:22.077941
fbc78aae-a10b-41c5-a753-80a1d3f7e1a1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	4C_V4OOD	f	\N	2025-10-28 17:25:37.515771
53f446db-2f92-46fc-a664-4d4de1b1ad65	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	62V6GNQH	f	\N	2025-10-28 17:34:10.052887
76c2c231-05bb-4ca0-bf04-26847b90c159	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	46b0a15b-293d-4ae1-957b-463eb9fe96d1	H7VGXYVO	f	\N	2025-10-28 18:14:52.935994
1c0916ba-f978-4f6e-9fe4-3996d3db4ddb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	0J7XXSVT	f	\N	2025-10-28 18:15:22.844688
e2ca7917-a4f5-43a4-8da8-9f4eed77caf2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	IA3M5FQP	f	\N	2025-10-28 18:15:22.845596
0198e8f8-7b91-4fde-ac72-898e01903450	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	OMTA5TKQ	f	\N	2025-10-28 18:15:22.846458
b73a1798-a388-42ae-b969-b9cf4a310232	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	OJOTET_I	f	\N	2025-10-28 18:15:22.847423
11a005e0-e0aa-4ca6-a7d8-d23a5b1b601a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	O2NZDWYV	f	\N	2025-10-28 18:15:22.848451
2fbb871d-5665-4bb1-ac99-b641f95d850b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	JLAARSQP	f	\N	2025-10-28 18:15:22.849713
4260bcb4-315f-419c-b6af-8e5ab7d8edc1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	64e3bfc8-56bf-4d39-9d4b-5849740ae9b8	P1TN7GT7	f	\N	2025-10-28 18:15:22.851394
86c443cd-2ccc-430e-ac86-860224ef4bda	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	a3c74369-bcaa-4ac0-8a45-610b9e831039	C34QYTZR	f	\N	2025-10-30 17:15:00.463563
1611d9d1-aad7-4ef5-a9fe-9f082e9f4984	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	a3c74369-bcaa-4ac0-8a45-610b9e831039	ML8Q_VRB	f	\N	2025-10-30 17:15:00.467459
9c61f6f5-7a74-4991-96d7-7bae30c42297	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	a3c74369-bcaa-4ac0-8a45-610b9e831039	AEHZCXJI	f	\N	2025-10-30 17:15:06.684199
75e2d7f2-d7f4-475c-b600-58cd3e385f81	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	a3c74369-bcaa-4ac0-8a45-610b9e831039	7F3YASP2	f	\N	2025-10-30 17:15:06.687134
64722c3f-2286-4be7-99da-f6fb7f69a9d4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	ELEYBEHZ	f	\N	2025-10-31 15:01:34.405639
535a791f-3f4c-43c6-b5c9-4c34821a7e4d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	717e819f-6e70-41bd-93ba-2c9a727113b8	H9F_6JLD	f	\N	2025-10-31 15:01:47.791392
\.


--
-- TOC entry 4887 (class 0 OID 106562)
-- Dependencies: 221
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, type, amount, description, order_id, created_at) FROM stdin;
511dc5f0-a1ce-4bee-a62c-b92f4e1f34a5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Spin the Wheel	4c2228af-bc87-4995-9693-da3dfbb8d865	2025-10-24 18:37:07.697357
3a5691ef-d78d-42a9-b593-082dbeb37229	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-6.00	Ticket purchase for Spin the Wheel	4b2087a4-5da7-4b25-b37f-015666991a98	2025-10-24 19:09:30.992886
0c10885c-cad9-473b-ad13-ef292a5109bf	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-24 19:10:21.503204
217b6fbc-eac3-44cc-b387-96f9cccb4184	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.60	Spin wheel prize: Mercedes-Benz - €0.6	\N	2025-10-24 19:10:21.506124
3886e2de-4f22-45d7-af25-1355434452bb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Scratch & Win 	ce6abd7d-b182-40cd-a529-f9d694320e38	2025-10-24 19:21:39.586842
e9632d00-cdec-460f-a1b4-451f7d8440ab	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-24 19:25:15.641577
23fbb12e-e61a-4ad9-9563-7eab08aad488	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	850.00	Spin wheel prize: Lexus - 850 Ringtones	\N	2025-10-24 19:25:15.644513
4051f114-3269-4aa7-a678-21c28c99707b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Scratch & Win 	dc534fa0-c9e6-41e0-94de-7d81b2b7fd72	2025-10-24 19:28:31.339359
f169d089-40d4-4677-9702-ae2466cc7668	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Scratch & Win 	452a03af-344d-4d2d-a277-25be318a9da1	2025-10-25 16:14:51.429459
e6c13f90-820c-4741-bdc0-d8ba69d46114	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Spin the Wheel	7050cd95-517c-46c0-8f63-cf63c418befc	2025-10-25 16:15:09.213316
957456ed-5b42-4f73-97cc-ce27347ce03d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 14:12:59.317309
7c6d87c6-5921-49f0-a043-f5d6e41bcce7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 14:13:01.309591
d7e5a414-a41b-4752-b5b7-58c90c223b13	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 14:13:03.318808
c5af58d3-1a44-4f2a-b5d6-d8656598d027	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 14:13:05.340504
3af016f6-01e7-45af-8421-bc9fe6fd0138	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 14:13:07.355168
64f3cc56-67bc-480e-9523-3d23fab6960a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	850.00	Spin wheel prize: Lexus - 850 Ringtone Points	\N	2025-10-28 14:20:11.90115
f1ba7666-d6fe-4370-a983-8297d893aae3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-10.00	Wallet payment for 5 spin(s) - Spin the Wheel	b942010e-64df-4825-a9e6-fbe1b943681f	2025-10-28 15:16:25.254357
b0989aee-07f4-4953-b8a0-fdf90df1d8b7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Spin the Wheel	2803606a-c23d-4e7c-8ffe-fba2307c52cb	2025-10-28 15:40:35.588649
b4551c35-7083-446d-ac51-1fb523ba447f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Spin the Wheel	96cbb544-bf79-4715-94b0-9f798a12fa7c	2025-10-28 15:40:57.959099
a8695859-ee98-4af0-8e44-4bc10d33f0fd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 16:23:30.449617
4e986c11-023d-48fa-945c-a670c8d8bb35	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 16:23:49.724363
9b4c3846-33ca-4e52-a3c9-b9c8ea470e42	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:38:08.979214
4ab884ba-b6b7-49a3-b465-36ed508ad6a5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Spin wheel prize: Ferrari - €0.5	\N	2025-10-28 16:38:08.986505
ad1635d7-ff69-4a2b-9cb0-00278ff8e21f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:38:21.743591
8e5ed63b-8f3e-4491-a739-92420de32fc8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Spin wheel prize: Ferrari - €0.5	\N	2025-10-28 16:38:21.746806
0846f938-4257-4aa6-b9a1-4fa4b6015ef2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:38:31.923565
d8b5a82c-8369-44ce-a9d6-bb21dcb802be	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:38:40.455669
8e739e8f-c980-41c7-b21d-349c5113b0a8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Spin wheel prize: Jaguar - 1000 Ringtones	\N	2025-10-28 16:38:40.459141
03d6efd7-a63f-40e2-80e6-462f158f3522	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:38:49.754242
7f5dc863-ff7a-4b19-bcb7-8da8cf15b0ff	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Spin wheel prize: Jaguar - 1000 Ringtones	\N	2025-10-28 16:38:49.75647
dbd95ba8-3784-4c57-aabf-f32d3a8ede2a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:41:08.796327
5e425165-5d8e-424e-8b0a-14465d25da0b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	50.00	Spin wheel prize: Nissan - 50 Ringtones	\N	2025-10-28 16:41:08.798846
17435443-898d-45a7-92cb-fc06eeba3cc0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:41:17.537112
4db3bf93-663a-4037-8f0d-82f611c1601a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: Ford - 100 Ringtones	\N	2025-10-28 16:41:17.545322
fe030a41-b9bc-4704-bbe8-b48ae0a005ec	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:41:25.712242
b2b59eaa-0699-4d65-92f0-2cd8d8a9c346	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:41:36.221133
7eb7a6d9-c97e-47b1-b835-d37ae03f5346	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:41:45.384376
f2bf7984-6d26-4735-87d6-7f2dd70ea3b7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	450.00	Spin wheel prize: Volkswagen - 450 Ringtones	\N	2025-10-28 16:41:45.388813
75fe728c-1889-4160-a9c5-a6ea1a88a7e9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:41:54.475779
5d1277f8-ea86-4071-b6af-005f14a65a05	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Spin wheel prize: Ferrari - €0.5	\N	2025-10-28 16:41:54.480379
67d0fc1d-bcb8-4b6d-ac93-b1eeb98e50d6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:43:17.434815
6ceb0562-128c-44de-bc20-6bc755a10d31	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: Ford - 100 Ringtones	\N	2025-10-28 16:43:17.437226
344b7e04-837c-4a3a-bd98-fbc207ece4cf	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:43:37.748851
05d64983-f55d-4ad2-977b-1f35ab866da0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: Ford - 100 Ringtones	\N	2025-10-28 16:43:37.756113
0c227428-6800-4251-b107-f946d468b08b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:44:17.651428
96080d4e-e094-4913-a295-1dc22458ec7a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	3000.00	Spin wheel prize: Audi - 3000 Ringtones	\N	2025-10-28 16:44:17.657485
4e15cd2c-bb69-470b-95ae-358467e195b3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:46:40.317655
5b955cd9-638f-481a-9a0f-185face108b9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	150.00	Spin wheel prize: Honda - 150 Ringtones	\N	2025-10-28 16:46:40.321276
165ab8cc-d8d4-4a31-8a81-4ff66a556185	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 16:47:01.061473
d5d8da30-0693-448b-84d8-d390c383203a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Spin wheel prize: BMW - €0.5	\N	2025-10-28 16:47:01.065546
5ad3341a-5756-409c-8848-37410278f743	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Spin the Wheel	f57f4f77-b5d8-4c80-a9d4-6f81501bbc53	2025-10-28 16:59:22.07294
2e1c789b-db23-4aa7-bfb2-fc422242d15f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	-3000.00	Converted 3000 ringtone points	\N	2025-10-28 16:59:46.841613
f8de54c6-5e95-4abd-9402-34f3731a25f7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	300000.00	Received €300000 from ringtone points conversion	\N	2025-10-28 16:59:46.843645
07d05197-2910-42c0-87c0-a21d00a807ba	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	-100.00	Converted 100 ringtone points	\N	2025-10-28 17:08:36.371414
99c046a9-5a12-492c-b349-3d648466497e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	10000.00	Received €10000 from ringtone points conversion	\N	2025-10-28 17:08:36.374996
47bcd11f-5a40-48d4-b4ef-b4d9d745cd20	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	-100.00	Converted 100 ringtone points	\N	2025-10-28 17:11:54.605856
929ed8c3-4762-4451-ab84-e6abe2714be0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1.00	Received €1.00 from ringtone points conversion	\N	2025-10-28 17:11:54.610698
50615bca-a59d-489a-bdac-c91f8bb289e7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-0.40	Ticket purchase for 🚰 WIN A LUX EXCITE SINK – JUST 40p PER ENTRY! 💥	0d53a9b2-b957-4c95-9990-36cf7b0b5c5e	2025-10-28 17:25:37.512734
e113937f-3a58-4b02-8981-ab56d82829a2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Spin the Wheel	e43e089b-f2d6-4b27-8d87-bbdd46ffab1b	2025-10-28 17:25:48.034526
65bf78f5-da14-4682-8a3f-b02d5f744cff	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-0.40	Ticket purchase for 🚰 WIN A LUX EXCITE SINK – JUST 40p PER ENTRY! 💥	55874828-068f-4c47-871e-707d9a477c92	2025-10-28 17:34:10.049819
f9fa91c5-0173-42b0-9f61-a3dd7e55bac8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Spin the Wheel	560624e1-dc4d-4830-a466-0f44942ee93a	2025-10-28 17:36:40.17673
a2c452aa-4284-4b41-9b17-282a5353190a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-0.50	Ticket purchase for 🎁 WIN A £500 SMYTHS TOYS GIFT CARD – JUST 50p PER ENTRY! 💥	a9af0cdc-279d-4502-9bc2-a1216a2a7979	2025-10-28 18:14:52.932604
cc2c3d43-33fa-46c3-ae74-985a2764d309	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.80	Ticket purchase for 🚰 WIN A LUX EXCITE SINK – JUST 40p PER ENTRY! 💥	4c5e2834-8d9e-48c2-ad9b-3596ad785a88	2025-10-28 18:15:22.843558
a2bed057-1057-476d-8266-29e3725a53c8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 18:32:27.3312
b8317959-2e4e-46ac-9c86-adc588be113e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.60	Spin wheel prize: Mercedes-Benz - €0.6	\N	2025-10-28 18:32:27.334703
c7ff97f7-cdf6-44be-8640-80cf78f2d677	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 18:32:33.093338
ce150cd6-da3a-41e2-8f11-d6c722792bd9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	3000.00	Spin wheel prize: Audi - 3000 Ringtones	\N	2025-10-28 18:32:33.095687
1c122213-e783-4f73-a412-3cc4e40c5c2a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 18:32:39.127682
6d370496-d0f2-4701-9750-cd11eb0ea874	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: Ford - 100 Ringtones	\N	2025-10-28 18:32:39.133103
99caf6ba-e09b-4605-bd39-b5e06bc96812	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 18:32:45.126906
757b266d-dbb8-45d3-a43f-dbb0c9beaf9a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	150.00	Spin wheel prize: Honda - 150 Ringtones	\N	2025-10-28 18:32:45.131692
74c5bc1b-cc8a-4411-b483-998e063c2cf0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 18:32:59.006277
104f468a-a276-455e-a98f-a6d2d55a9841	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Spin wheel prize: Bentley - €0.25	\N	2025-10-28 18:32:59.009995
33a5037b-e8b5-4897-97f2-5662135b7f23	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 18:33:06.553157
ea902f65-e881-44c1-8566-068ad1d99410	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Spin wheel prize: BMW - €0.5	\N	2025-10-28 18:33:06.556245
ac271a76-c32d-49ad-a315-2bf2739e0eb9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:00:09.516732
76225bec-bcc0-4540-b653-62f07209a2af	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: R - €100	\N	2025-10-28 19:00:09.540616
005093d8-63f4-48c4-b7c9-83905e896e42	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:00:20.910655
1c556608-4715-42fb-a881-b13a8610fe15	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: Ford - 100 Ringtones	\N	2025-10-28 19:00:20.914785
ee92eca0-d7b5-49e0-9115-fd1f113c36c1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:00:29.375028
491fbfb4-db2c-4d20-aea8-2a64d11c60f5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	450.00	Spin wheel prize: Volkswagen - 450 Ringtones	\N	2025-10-28 19:00:29.379501
f7af9a97-14ab-4d06-b77e-892a0eee4aef	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:08:49.167604
ea0f5e62-b54d-42b7-9ffa-a0b6d26c9854	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:10:12.726774
40ff8b87-0495-4141-a929-b9756fd7118e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:13:27.294363
e392136d-46b4-4165-a2b7-bb07697b55b3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.10	Spin wheel prize: Rolls-Royce - €0.1	\N	2025-10-28 19:13:27.297148
789eb206-0683-4ee2-8e12-28d911220184	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:15:07.445325
6a208c4a-a9ca-49f9-a5cd-19a76670a091	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:15:14.978033
9b1e131c-2d1a-4234-b1b8-71b44d3f8d07	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: R - €100	\N	2025-10-28 19:15:14.980087
a7fbb35d-db6e-4e94-8566-fbb3d687f988	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:16:33.615664
39700f4e-cd10-432a-9be8-5561fb6b3d18	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.70	Spin wheel prize: McLaren - €0.7	\N	2025-10-28 19:16:33.618595
47866d0e-2001-4f31-b736-c980f4ae0686	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:18:04.716834
4c382e73-f779-4a02-85dc-ad8fcd06d25e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.90	Spin wheel prize: Lamborghini - €0.9	\N	2025-10-28 19:18:04.721966
a4e214ee-78cf-4e73-a54f-fb5b591994fb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:18:33.980598
e6b609e5-6b5c-408f-b247-cc016ec06edf	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.15	Spin wheel prize: Aston Martin - €0.15	\N	2025-10-28 19:18:33.984544
58371f54-ebbf-47a4-aba0-b0bd40ea3b27	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:18:40.475235
a6594439-b895-4285-bf17-39956cdd21ca	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:18:47.143745
a401b41d-f159-43ef-badc-1354ca78fd0a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.80	Spin wheel prize: Porsche - €0.8	\N	2025-10-28 19:18:47.152776
35a2e441-31de-4f3f-867d-4114b7f7c1b1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:20:48.936473
b118f3d0-52f3-4bc5-ab89-1ba4a0155206	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Spin wheel prize: Toyota - 250 Ringtones	\N	2025-10-28 19:20:48.940328
33d3d936-bf81-4fcb-88c9-03c929bde951	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:20:58.75533
312287cd-e3db-4bcd-9a45-ef4f09c0a799	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: R - €100	\N	2025-10-28 19:20:58.759111
4b2b660c-f8e2-44d6-9bb5-fdf120405fc1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:21:07.366962
e38e2c11-1212-4c8a-8977-13c19416301d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.90	Spin wheel prize: Lamborghini - €0.9	\N	2025-10-28 19:21:07.37048
06dcb0aa-5f0c-4783-b0fb-ab2c659b93f0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 19:22:23.925941
2a8deba2-e9cf-4abe-943d-0ed55d52e961	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 19:22:40.285567
03d42336-e74a-4c5a-ad44-76c3eda296f3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 19:22:48.818974
634836bd-be97-4986-b89c-f7022bdb0311	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Scratch card prize: 1000 Ringtones	\N	2025-10-28 19:22:48.821362
58641c9b-cc4b-495d-a9bc-925c1f907b5f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:24:54.093731
1ed79657-d195-4e93-8263-26e8fa1078d5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	450.00	Spin wheel prize: Volkswagen - 450 Ringtones	\N	2025-10-28 19:24:54.097784
b12ab46b-6f3d-40ed-a66e-c6bac4ab85f2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:25:02.874246
bec0801f-684c-4c62-ad87-073eec4a6b6c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	3000.00	Spin wheel prize: Audi - 3000 Ringtones	\N	2025-10-28 19:25:02.879233
e7caac81-a769-4eb9-9bd3-8b0f40c30805	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:36:08.432558
8910e4e5-9cfd-49e3-ae06-db84a7741c07	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.90	Spin wheel prize: Lamborghini - €0.9	\N	2025-10-28 19:36:08.435562
05e3a7cb-d466-4de8-b225-a3ca04064989	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:36:17.203463
143d7c0e-93ec-4513-bca2-3618bf872add	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.15	Spin wheel prize: Aston Martin - €0.15	\N	2025-10-28 19:36:17.20746
b16aaff2-600c-4871-881d-99bb32d899c0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:36:25.512341
d4323a94-7cc7-463c-b328-76e3a5b5abf8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	450.00	Spin wheel prize: Volkswagen - 450 Ringtones	\N	2025-10-28 19:36:25.515655
253b193e-f258-44ff-94cd-6c082dd23922	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:38:30.584971
9618940c-cdad-4a46-9786-d72d1d2436b5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.10	Spin wheel prize: Rolls-Royce - €0.1	\N	2025-10-28 19:38:30.589878
c1655a71-3671-4e28-b4ab-8594ce2d1ba4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:38:39.344205
c76a39f1-f671-40f5-985c-81454cd2af61	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.70	Spin wheel prize: McLaren - €0.7	\N	2025-10-28 19:38:39.349317
a970b7ac-3012-4685-a66d-eef9d7f03b21	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:38:48.694825
ed2715f5-6de6-498c-b982-42de8ae2dd6d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.10	Spin wheel prize: Rolls-Royce - €0.1	\N	2025-10-28 19:38:48.697857
f99cce53-f015-4290-96b8-d3d5fb9cf811	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:39:09.412828
eb1b3762-fec4-4471-880f-51bf649db93e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: R - €100	\N	2025-10-28 19:39:09.422372
37700a78-0c56-4324-bf3b-de46096fe1b8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:39:20.860084
8aca6fd5-998f-4357-a40c-636ad93177bb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	850.00	Spin wheel prize: Lexus - 850 Ringtones	\N	2025-10-28 19:39:20.862776
5b9c6514-3704-4153-8705-f295174f0938	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:39:27.64514
1aa39326-0e64-484e-8a05-6f2c8ed5fb31	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:39:35.761427
174363f9-8c30-498b-a34c-852f88abcbf3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.10	Spin wheel prize: Rolls-Royce - €0.1	\N	2025-10-28 19:39:35.764601
0bbc3bc6-a1e5-4a4a-924b-4bfb162e8e8f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:39:43.366346
b65afa39-5e19-45ab-98e6-26dccc20f683	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.15	Spin wheel prize: Aston Martin - €0.15	\N	2025-10-28 19:39:43.372452
dd2e3243-cd82-4d35-a204-6bd4d6aff155	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:39:50.667902
0ff5846c-fa02-47ec-a8eb-159aac9cc82a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: R - €100	\N	2025-10-28 19:39:50.671888
6460a076-db71-48bd-a2ba-574bc3506f60	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-28 19:39:58.22956
3dcfb30d-38cc-4685-bda3-394eef003bf3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	450.00	Spin wheel prize: Volkswagen - 450 Ringtones	\N	2025-10-28 19:39:58.232945
7431b345-7671-4070-8918-9c1c460b17f0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 19:58:18.282959
2e8f5c37-460a-45a2-9a50-cb8f0217c515	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 19:58:29.217734
df1727a8-3654-4037-b718-e687fbc61169	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 19:58:36.776583
fb79d334-08d4-4ce4-91f5-8d9c92685c7a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 19:58:44.15166
b5a96a2a-50c1-407a-9292-1a328e83bd55	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 19:59:16.025307
eb915907-8a4d-4d7c-a0e0-30ecf673e1e8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 20:06:31.479376
22f744c1-476a-4c75-8c4a-81e6bac28612	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Scratch Card - Play cost	\N	2025-10-28 20:06:58.057021
8804a929-178d-4fb1-abe6-230d4a1fc52e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	50.00	Scratch card prize: 50 Ringtones	\N	2025-10-28 20:06:58.06032
a109f737-6d31-417f-a609-50449367abe7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-10.00	Wallet payment for 5 scratch card(s) - Scratch & Win 	cd22b066-f8f1-47c2-b30f-5b097f3e0f08	2025-10-29 13:21:07.408802
6abc3da3-91cd-44b7-857f-64f705830da7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-29 13:42:24.66126
c397e9bf-8375-4aad-bc57-26aaa823e2ae	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.55	Spin wheel prize: Mini - €0.55	\N	2025-10-29 13:42:24.670194
aeae45ed-a4f3-49aa-9053-e9cc591cc000	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-29 16:41:02.1155
d3532483-a7e1-4ce1-9c59-e4eb433f8d72	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-10-30 14:50:54.309631
464ba931-d041-4cae-a801-8fe039639a04	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	850.00	Spin wheel prize: Prize - 850 Ringtones	\N	2025-10-30 14:50:54.327951
64edc556-c66d-4684-b797-94b602777b42	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	0.00	Ticket purchase for 💷 £500 FREE GIVEAWAY! 🎉	e42250ad-1a84-4981-959a-279ccc3200e7	2025-10-30 17:15:00.459087
983fefb7-ab33-4830-b297-17a5a274eb7f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	0.00	Ticket purchase for 💷 £500 FREE GIVEAWAY! 🎉	bcd92095-6e66-4d26-b324-d2efff095b6a	2025-10-30 17:15:06.6794
1c51cdbe-bb01-4af4-bd6c-9a588ccdc73f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-200.00	Ringtone points payment for 1 spin(s) - Spin the Wheel	d086dd51-9f57-4c3d-b1e7-48d335086c67	2025-10-31 14:26:05.286227
4f6658c9-a0ef-4a65-af42-9571483ee38c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-8800.00	Ringtone points payment for 44 spin(s) - Spin the Wheel	1be0ab53-ddba-489a-9956-69340b015add	2025-10-31 14:27:25.324793
3abf6870-de58-4abf-a831-adc3d0fd2099	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 spin(s) - Spin the Wheel	5a2654b5-babe-4567-90e0-271b5da226d4	2025-10-31 14:46:20.058146
993bfe36-02b5-4f8a-8c5b-c55a8632abbf	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Scratch & Win 	6af596dd-595b-49fe-96c4-2b06f7b7ec3a	2025-10-31 15:01:34.402731
12982277-83b6-4449-af19-02e83c5d175f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Ticket purchase for Scratch & Win 	d830b745-e3f9-414f-b337-ded52807a07a	2025-10-31 15:01:47.787867
25201b30-3452-43b8-8bd6-50f226c47537	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	22e51667-249b-48a5-8a0f-0916ee0e7c06	2025-10-31 15:10:37.450485
8d5b9e84-677d-4e22-a88d-91d60cdbc502	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	2470d854-e190-4e64-810b-2dfd60d6c6cb	2025-10-31 15:15:56.532592
ac8e56b7-f9fd-44c6-b60a-8df6f52af9d9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	6e44d0f0-6104-44dd-8896-9d57cb285f2b	2025-10-31 15:20:05.962524
348942ae-fa46-4b83-aea4-6e48820ff591	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	848f1b6b-6b6e-47df-8f75-e8d51011efd1	2025-10-31 15:21:56.75645
aa938399-1e33-4a41-ae56-940b8e15257d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	6bc8815b-7f64-4dc6-9754-e35dbf8e08db	2025-10-31 15:23:04.634494
f41edba9-6d27-4578-b16a-b6a95b4496f9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	c9f979af-d8f5-49ca-9add-037434bf32c7	2025-10-31 15:24:59.408035
aa1de194-9876-493c-abb3-4341852ee7e0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	2276b551-2c15-41d4-9e05-ede624363cf7	2025-10-31 16:15:29.11897
d2c062d6-7f5f-437f-a99b-e2b8c116f9a4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	a2cab791-7cc0-4560-a02d-3560f4e9803c	2025-10-31 16:17:32.418897
fb50dc9d-2548-4dbb-b6c6-12cfb8a3724e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	f82864c4-927e-4cf9-90c4-dbd9b03626c1	2025-10-31 16:52:35.764881
b1945437-1857-4b5b-bd84-ed18bcc3059c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-454.00	Wallet payment for 227 scratch card(s) - Scratch & Win 	cddf2794-e70d-48c9-9073-c0956e3c84f3	2025-10-31 16:54:46.066115
7e0d703a-834f-4dd8-90fb-85ad799a61d6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	84731f42-fb0a-42d6-b271-db8276ba2b54	2025-10-31 16:56:39.189335
379e7c3e-99d0-4fca-bb89-6ee87eacd994	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 spin(s) - Spin the Wheel	0666d116-3815-47bc-8c11-d5b6fdc23e92	2025-11-04 13:29:29.457109
856dc9a7-9c59-42b3-aa4a-70385944991c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	65f24ae1-df60-4c46-836c-c9ac21640f50	2025-11-04 13:32:19.872693
336d12fb-f57a-49bc-afd8-fe8537461f2e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	e8461e70-648c-48cb-9776-ac9a8253fd90	2025-11-04 14:04:17.905849
5d056ae3-cc00-4024-859b-01cee3e93bbc	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	50.00	Scratch Card Prize - 50 Ringtones	\N	2025-11-04 14:04:35.941269
2253a603-a59a-4fbb-a178-37494b790e4e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	5978533c-0e82-4d82-91e2-615ec9606988	2025-11-04 14:38:59.221796
53793833-01eb-454d-9d8d-6a138e8d9362	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Scratch Card Prize - 250 Ringtones	\N	2025-11-04 14:39:58.753647
9bb07da8-7e71-42dd-abb2-bedc306349e8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	fe603709-ff80-4aa4-8ef6-b4f031ffddad	2025-11-04 14:48:51.122798
a9e3b8a4-4b63-4ec2-b4c3-46b6ed093864	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	50.00	Scratch Card Prize - 50 Ringtones	\N	2025-11-04 14:49:08.01298
1765fbb3-ad27-48cc-9a7c-e860feedd04f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	d79809bd-7738-4e89-9878-42a62f6f9f5b	2025-11-04 14:58:57.081622
5609f8b7-4035-4d5e-9861-b009aa66f1f1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-14.00	Wallet payment for 7 scratch card(s) - Scratch & Win 	f2089ac9-c87c-4974-87d4-daa3f85e929a	2025-11-04 16:44:25.520935
5a32c841-6fec-4717-8751-8ca0742ba30c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 16:44:48.487375
19c7cc53-55e6-44c2-9d04-23f60f53d842	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	500.00	Scratch Card Prize - 500 Ringtones	\N	2025-11-04 16:45:11.052286
45a8ecec-6a8a-4bac-824b-c180b2c0fc0a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1.00	Scratch Card Prize - £1	\N	2025-11-04 16:45:36.796689
ba6134a7-c76d-46f9-9939-511f8a271fb5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Scratch Card Prize - 1000 Ringtones	\N	2025-11-04 16:46:00.800613
206888b8-dbad-410b-9398-b6e03a59300c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 scratch card(s) - Scratch & Win 	291828fa-3d11-4ce0-95f6-714ce5711350	2025-11-04 17:29:33.420733
f8e1154c-3385-44cf-8531-1aad2b3b512f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 17:54:33.312384
1ae8eb90-146d-4aa5-9e82-fe81ff046229	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-22.00	Wallet payment for 11 scratch card(s) - Scratch & Win 	fd5c5289-4472-42a4-beb6-fabcef1a6c67	2025-11-04 17:55:01.910999
45a9730c-3b42-4f9c-b930-bc9cb1d38f3c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Scratch Card Prize - 250 Ringtones	\N	2025-11-04 17:55:41.735424
85746b3b-4d64-48f3-894d-f556557b7823	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1.00	Scratch Card Prize - £1	\N	2025-11-04 17:59:43.457821
2911e9da-aaeb-4305-9aad-0e95d93ac4dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 18:02:28.556269
eb93be64-cf78-422b-b485-630790c33640	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 18:35:58.211089
627ce3e3-14af-41db-ba3c-f497c8382d95	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-14.00	Wallet payment for 7 scratch card(s) - Scratch & Win 	5df387ad-a24f-4d62-a4c2-b1591c3b8086	2025-11-04 19:03:40.183521
acac6085-116c-4eef-b974-a3747feaebf9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Scratch Card Prize - £0.5	\N	2025-11-04 19:06:42.327295
b0a04de4-dc9a-455c-8c1a-6e6081f4ad53	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:07:07.430228
9f2f4eca-76b5-4416-8bb0-a6048db8fd2b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Scratch Card Prize - 100 Ringtones	\N	2025-11-04 19:11:58.311373
e9e925de-65e5-4784-8a8f-4cdb4b88bc76	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	500.00	Scratch Card Prize - 500 Ringtones	\N	2025-11-04 19:15:08.075663
c45b9d78-54c3-425a-8e0c-7140b5c7ab1d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Scratch Card Prize - 100 Ringtones	\N	2025-11-04 19:15:16.785602
049c9743-1c96-475f-a41f-aff61076ada6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-186.00	Wallet payment for 93 scratch card(s) - Scratch & Win 	b25f8a6a-58fa-48e2-b3cb-619ca06e0ac4	2025-11-04 19:15:39.464567
af109313-bace-417d-abb7-1b5b2367a5f3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	500.00	Scratch Card Prize - 500 Ringtones	\N	2025-11-04 19:15:53.679726
e1ac3696-c7c6-46eb-905d-41b781fb77af	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:20:49.629664
dd2f9dc6-2313-411a-be54-c5abbfce8e2c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Scratch Card Prize - 1000 Ringtones	\N	2025-11-04 19:25:12.0932
95a69b03-7d00-4fdb-9d84-dac42dab0777	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Scratch Card Prize - 250 Ringtones	\N	2025-11-04 19:25:49.87099
a899e678-36bf-4e3b-88ab-ad5cf8531302	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:27:31.921668
aeba66e2-e3fe-4cd3-af6d-eaa66b5e33d4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:27:44.458722
f4b6f143-0d95-4f1b-ba5e-6d93e7e11493	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Scratch Card Prize - £0.5	\N	2025-11-04 19:40:01.424247
a28d8d82-6507-4bed-beb0-ad2ba47ce6ac	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	50.00	Scratch Card Prize - 50 Ringtones	\N	2025-11-04 19:40:56.552189
b3bc4f22-e0ec-4bbb-b385-2c97032dfef2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Scratch Card Prize - 1000 Ringtones	\N	2025-11-04 19:41:26.193794
0f305141-0457-4cf7-a469-b636b4ff1993	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-10.00	Wallet payment for 5 scratch card(s) - Scratch & Win 	164c765a-d945-440b-8c26-1c874bf7835b	2025-11-04 19:41:54.011513
388f060a-1b39-4dda-bebb-810db54ed948	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:42:59.317072
0f03ad2e-6ae3-4598-9cb2-95159876b47f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:43:39.268051
cfdb6a1b-41ee-4b9a-9ffe-617620b0a9c9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1.00	Scratch Card Prize - £1	\N	2025-11-04 19:44:04.22552
43057f3c-d016-4441-8e84-f55619554b76	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-10.00	Wallet payment for 5 scratch card(s) - Scratch & Win 	d23b4811-0687-4153-b8f8-cd3e3b1b82f7	2025-11-04 19:44:31.690832
50dcc843-d4a4-4b29-8a51-ed5c7381db49	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1.00	Scratch Card Prize - £1	\N	2025-11-04 19:45:15.420867
c9082e92-45ba-47c2-a43e-0cfcb8806da1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1.00	Scratch Card Prize - £1	\N	2025-11-04 19:45:26.570806
1f345bcf-ed42-4013-bd91-57382d7b8d3f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-10.00	Wallet payment for 5 scratch card(s) - Scratch & Win 	2fa52ef8-98a1-4e1b-b57b-2f64ab8b16aa	2025-11-04 19:45:49.836607
5359c14c-728b-4bd1-aa5d-b80e8914eac2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Scratch Card Prize - 1000 Ringtones	\N	2025-11-04 19:45:57.857973
5ed698e8-9f57-4013-988c-3e8b01cf52d8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:46:27.29109
21f85ea1-f786-4dfd-b0fb-8f6ad395af30	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-1600.00	Ringtone points payment for 8 scratch card(s) - Scratch & Win 	9723d821-cb39-4c07-a2b6-6d1f83d2a587	2025-11-04 19:47:04.955747
343a451a-b8e7-49ae-a00d-5475b4330549	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:47:17.000234
9bffc666-ccbc-4a7a-842e-be275ab574d6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Scratch Card Prize - 250 Ringtones	\N	2025-11-04 19:47:22.386492
bd33cb1f-f90d-4a3c-9e9c-92e2728de24a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Scratch Card Prize - 100 Ringtones	\N	2025-11-04 19:47:40.151125
4abf0176-f733-4eeb-a148-ec5914b6c5a9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	50.00	Scratch Card Prize - 50 Ringtones	\N	2025-11-04 19:47:48.917039
e421f503-77c8-4037-b4a6-23222d492e55	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-1400.00	Ringtone points payment for 7 scratch card(s) - Scratch & Win 	2a39030c-5e50-48f3-adc6-15a163ad75dd	2025-11-04 19:52:25.346398
e46c0b2a-3402-4c65-9dda-57e7f414f1b6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1.00	Scratch Card Prize - £1	\N	2025-11-04 19:52:35.978555
5e8b0a0c-8255-46d2-8765-8375971cf1fa	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Scratch Card Prize - 250 Ringtones	\N	2025-11-04 19:57:22.324667
d7fc2a9c-e512-452a-abc0-57d670901d8d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Scratch Card Prize - 1000 Ringtones	\N	2025-11-04 19:57:31.941108
47a10725-59a5-4d63-8894-45df464bafc5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.25	Scratch Card Prize - £0.25	\N	2025-11-04 19:57:36.834119
b3c31f20-6c0c-400e-b5a8-037b0417ee50	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-800.00	Ringtone points payment for 4 scratch card(s) - Scratch & Win 	b6d2dfb3-cbfa-40d9-8276-0090f0766f17	2025-11-04 20:13:20.9179
12a11055-74e1-474e-935c-b9decdfdb043	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Scratch Card Prize - 1000 Ringtones	\N	2025-11-04 20:13:41.273188
881059b8-8f58-49c3-8b8d-a9fb72d64ccd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Scratch Card Prize - 250 Ringtones	\N	2025-11-04 20:14:16.259033
5a4cdcaa-b207-4434-aab3-15745cc17535	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1.00	Scratch Card Prize - £1	\N	2025-11-04 20:22:13.633926
9179b841-7a40-4acd-9085-5aa1030d6fd1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	1000.00	Scratch Card Prize - 1000 Ringtones	\N	2025-11-04 20:22:24.632421
2b321661-a498-4578-8aaa-d6d7420113ae	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-1400.00	Ringtone points payment for 7 scratch card(s) - Scratch & Win 	624d0b6e-20ef-4391-93fd-214067c5f72b	2025-11-04 20:31:04.736745
36665ca3-2b03-4510-8e9d-17012fab8c8e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Scratch Card Prize - 100 Ringtones	\N	2025-11-04 20:31:36.099567
e9ac9341-ca9a-44ba-8dce-19b067f1ce20	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-11-05 14:54:13.580263
cc584996-11e5-4e56-8811-238b2acd9076	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin wheel prize: Ford - 100 Ringtones	\N	2025-11-05 14:54:13.592041
35cbf301-704c-497f-b99e-c7542dc0b9aa	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	withdrawal	2.00	Spin Wheel - Spin cost	\N	2025-11-05 15:06:54.268489
993e614d-ec01-499e-bcd4-62416a849ed6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Spin wheel prize: BMW - £0.5	\N	2025-11-05 15:06:54.272861
b3171fe1-ac4a-46c6-b34d-2e3443888d5d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-6.00	Wallet payment for 3 spin(s) - Spin the Wheel	5b440d1c-0621-4855-8f31-3efab119904f	2025-11-05 16:52:53.325885
915abb00-8290-4473-964d-2e086da5a49a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-600.00	Ringtone points payment for 3 spin(s) - Spin the Wheel	baca1cce-1556-4c4f-a82a-979a4f26c9ae	2025-11-05 16:53:39.768084
28fb4fb8-e2af-41ed-8579-1075fe0e4b11	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-4.00	Wallet payment for 2 spin(s) - Spin the Wheel	a597569f-5364-4bf6-b2bb-1d4f3eda4f84	2025-11-05 16:54:41.282852
6bbcf312-bc95-40a6-bf53-d33fbf08128b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-4.00	Wallet payment for 2 spin(s) - Spin the Wheel	a73aff3d-29ce-41a3-a64c-cb619f5a49ca	2025-11-05 16:57:59.211483
d9ae1e78-51a1-4a87-a38a-98746a9a43a3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-400.00	Ringtone points payment for 2 spin(s) - Spin the Wheel	4a58982b-efa3-43f0-aba2-806f02959bf0	2025-11-05 17:00:18.594487
bae87d34-2e99-4d28-88f5-427d505d09c1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 spin(s) - Spin the Wheel	fa233352-32e0-4545-b38a-68027f1661b6	2025-11-05 17:02:34.664788
a5ba9932-0606-48aa-8a36-53e438d227be	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 spin(s) - Spin the Wheel	4c30d89d-76d2-4f30-acc4-7457891194d1	2025-11-05 17:03:06.598832
7f293efe-c1d0-47c3-9ee5-c814ca8b1696	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 spin(s) - Spin the Wheel	a78075da-a168-4b85-88e6-c541e8989c7e	2025-11-05 17:06:13.74929
319b517f-b202-49d8-9ccf-eb389944055c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2.00	Wallet payment for 1 spin(s) - Spin the Wheel	85f6cdef-b0b1-4a8f-9db4-1aa7bd169652	2025-11-05 17:09:37.994661
5e8f2d5c-276c-48a3-b808-d8a4270f5a2d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-6.00	Wallet payment for 3 spin(s) - Spin the Wheel	bd617b74-0a69-44ed-89cd-17331866a016	2025-11-05 17:35:57.394375
8ea98b92-b5d4-438b-a7df-15210a7289c1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-2000.00	Ringtone points payment for 10 spin(s) - Spin the Wheel	15114143-b8de-4a08-ade2-63930d711177	2025-11-05 17:40:39.695158
f53d6818-d997-4cec-a66e-d8722288b396	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.80	Spin Wheel Prize - £0.8	\N	2025-11-05 18:01:15.403864
6f0cef4b-2a1a-47cd-9207-514fc6d553d1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin Wheel Prize - 100 Ringtones	\N	2025-11-05 18:23:57.388531
eedb3856-5ad2-4017-84a1-f0da0ea915bd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.60	Spin Wheel Prize - £0.6	\N	2025-11-05 18:24:08.882014
eed81d07-c5a2-484b-941d-5a6e41586be7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	2000.00	Spin Wheel Prize - 2000 Ringtones	\N	2025-11-05 18:24:26.886266
254adc01-3a94-4f46-a15e-c5265a1a9b63	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	3000.00	Spin Wheel Prize - 3000 Ringtones	\N	2025-11-05 18:24:48.763394
531cc813-91b6-4904-b8c2-2a62449eaebd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-16.00	Wallet payment for 8 spin(s) - Spin the Wheel	ff741e39-174b-4286-88b5-bbd9c8eafd9c	2025-11-05 18:30:18.605233
979347d1-c5e0-427c-8364-617875bd9211	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.15	Spin Wheel Prize - £0.15	\N	2025-11-05 18:30:31.358906
47f12dcc-2d9a-49b4-b32d-7c1be026e202	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.50	Spin Wheel Prize - £0.5	\N	2025-11-05 18:30:43.913599
b1bc54aa-d2f9-4074-8357-5a644bff7e10	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.90	Spin Wheel Prize - £0.9	\N	2025-11-05 18:31:13.392068
1d3be7cf-04ad-4a57-9efc-70d9ae5ba420	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	0.70	Spin Wheel Prize - £0.7	\N	2025-11-05 18:31:22.224506
96ebd2d5-da6b-4af8-b277-035c17762b95	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	2000.00	Spin Wheel Prize - 2000 Ringtones	\N	2025-11-05 18:31:41.223531
696c8ae0-cb09-4dfb-8634-099d4948608e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Spin Wheel Prize - 250 Ringtones	\N	2025-11-05 18:31:56.269722
2784ee14-d15c-4450-b258-73455c3d0c0b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-6.00	Wallet payment for 3 spin(s) - Spin the Wheel	89d9d240-73c2-4d51-825f-282c7db88764	2025-11-05 18:43:17.509747
9fdd68f0-fd9c-4c39-953f-a4116af2bcd5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	5.00	Spin Wheel Prize - £5	\N	2025-11-05 18:43:40.136783
828a0847-465e-4efc-b2c3-760c84ea51f0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin Wheel Prize - 100 Ringtones	\N	2025-11-05 18:43:49.712687
41575251-feee-4b5f-9f58-0b37dce301f4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	50.00	Spin Wheel Prize - 50 Ringtones	\N	2025-11-05 18:43:58.742709
72912272-fec2-4886-baa3-7dbb18840762	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-200.00	Ringtone points payment for 1 spin(s) - Spin the Wheel	ff8ff709-0eed-4cb8-a4c2-46cb8f13e0a0	2025-11-05 18:44:19.282873
607ccc33-1989-499d-8497-7ad135d7185d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-200.00	Ringtone points payment for 1 scratch card(s) - Scratch & Win 	dd87f6a6-535c-46e8-8811-816769bf0803	2025-11-05 19:40:39.144157
70fa8e9a-0687-4311-a597-beeba7e22ebb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-400.00	Ringtone points payment for 2 spin(s) - Spin the Wheel	1fecfafc-394d-40f6-9940-cee68f7fcb25	2025-11-05 20:07:52.918702
ee7b6ac7-e91d-4a09-a4d3-b7a4db757a3b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-18.00	Wallet payment for 9 spin(s) - Spin the Wheel	3f73e453-d7d4-4bf0-9fac-2299204c8c88	2025-11-06 15:31:01.186809
96fc32ba-118f-4b3f-9558-48469ab4e575	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-200.00	Ringtone points payment for 1 spin(s) - Spin the Wheel	a8fa5f9b-ab56-494e-bead-e80189921f3d	2025-11-06 15:35:21.896622
43ee1ab5-4dfd-4724-b30d-02d7b5604da7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-4.00	Wallet payment for 2 spin(s) - Spin the Wheel	98a88517-ec1c-4a39-aae8-e4bcf40094f9	2025-11-06 15:48:14.610777
01034e25-1b4f-45ee-bbba-423382ecd6a1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	250.00	Spin Wheel Prize - 250 Ringtones	\N	2025-11-06 15:48:55.113291
af77ff90-9b5f-44ef-8564-df222ce51dcb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-600.00	Ringtone points payment for 3 spin(s) - Spin the Wheel	cd156200-41b3-4aae-b130-42bbdc416d4f	2025-11-06 16:21:24.282858
fc2d9669-785c-422f-8700-abe4faca0354	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin Wheel Prize - 100 Ringtones	\N	2025-11-06 17:08:37.877205
b083091d-db9c-4567-bdba-3c3483365535	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin Wheel Prize - 100 Ringtones	\N	2025-11-06 17:08:45.162771
90f6926e-97e3-434b-9f8d-4199f327826e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	500.00	Spin Wheel Prize - 500 Ringtones	\N	2025-11-06 17:08:50.850864
1c38723f-f1f2-4464-bd0c-c95f1973d830	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-10.00	Wallet payment for 5 spin(s) - Spin the Wheel	12eb82db-7485-4b1b-a4b4-cc4c297ffede	2025-11-06 17:09:36.195157
84b88846-b82f-462a-b07b-444bec4cab7b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	400.00	Spin Wheel Prize - 400 Ringtones	\N	2025-11-06 17:50:15.435923
1ee5fb20-887f-4342-ae7e-85cd2f3699dc	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	500.00	Spin Wheel Prize - 500 Ringtones	\N	2025-11-06 17:50:48.174503
9fec7e9b-b453-4664-b25e-b30ed4e10c9d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-416.00	Wallet payment for 208 spin(s) - Spin the Wheel	dc81e7f5-093c-4e63-b700-fa772265e579	2025-11-06 17:51:10.134792
b36b3f8d-5b4f-4bcf-b79c-e1f31a1948f0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	75.00	Spin Wheel Prize - 75 Ringtones	\N	2025-11-06 18:29:29.589377
52798e16-defc-4d44-9124-e02934c65bae	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	400.00	Spin Wheel Prize - 400 Ringtones	\N	2025-11-06 18:46:52.670847
5fbdecfe-e880-4a1f-9ab7-a33facebeaf5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	100.00	Spin Wheel Prize - 100 Ringtones	\N	2025-11-06 18:48:07.278
59725a62-a731-4df4-977e-cdd7a6adce84	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-4.00	Wallet payment for 2 scratch card(s) - Scratch & Win 	73b33ae3-98fd-44f3-be65-2c96b2e70e96	2025-11-07 15:56:53.234472
53b15187-a73f-4557-bd09-e912f2230585	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	purchase	-400.00	Ringtone points payment for 2 spin(s) - Spin the Wheel	46e878de-2bcc-4340-b2ce-6abe631515ab	2025-11-07 16:22:48.990179
a951c8f0-8a1f-4d90-9394-a2a0f8a55b73	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	prize	2000.00	Spin Wheel Prize - 2000 Ringtones	\N	2025-11-07 16:23:01.209842
\.


--
-- TOC entry 4888 (class 0 OID 106571)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, first_name, last_name, date_of_birth, profile_image_url, balance, stripe_customer_id, stripe_subscription_id, email_verified, receive_newsletter, created_at, updated_at, ringtone_points, is_admin, is_active) FROM stdin;
4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	ahsanishfaq123@gmail.com	$2b$10$UDQueif9OcvldZAVeIvZuuK91xOF82uIUI.1wQuA0TehewIWZbY2m	Ahsan 	Ishfaq	2002-02-01	\N	309180.99	\N	\N	f	f	2025-09-30 18:29:07.487245	2025-11-07 10:56:53.227	19025	f	t
5442570f-6a7e-4c7f-b673-bc6424e32e76	admin@ringtoneRiches.com	$2b$10$T84iG3QCq8GItsZCGDw8lOOA7I66O5REqaFsietEIOXA4hP0Lu7hC	Admin	User	\N	\N	0.00	\N	\N	t	f	2025-11-05 19:03:02.84891	2025-11-05 19:03:02.84891	0	t	t
\.


--
-- TOC entry 4889 (class 0 OID 106586)
-- Dependencies: 223
-- Data for Name: winners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.winners (id, user_id, competition_id, prize_description, prize_value, image_url, created_at) FROM stdin;
958e78c7-b2ff-47f3-a8d4-31042d0fa29d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Mercedes-Benz	€0.6	\N	2025-10-24 14:10:21.506
e7aca7ea-09b4-421a-ae66-f79f948d31e2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Lexus	850 Ringtones	\N	2025-10-24 14:25:15.638
bd81f968-5a99-40cb-8de9-6747f629d261	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ferrari	€0.5	\N	2025-10-28 11:38:08.974
3f921b8f-627f-42d4-94b5-c47f47451ba3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ferrari	€0.5	\N	2025-10-28 11:38:21.734
1fdac787-55f3-4604-a53a-5727770c551e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Jaguar	1000 Ringtones	\N	2025-10-28 11:38:40.46
0741c1aa-1a75-45b8-8083-409670d7ddef	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Jaguar	1000 Ringtones	\N	2025-10-28 11:38:49.756
bf6cd647-9a3d-43ab-9e6b-c80f0911ce39	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Nissan	50 Ringtones	\N	2025-10-28 11:41:08.783
6f66c01c-2149-4046-a82b-66dc2af1b15c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ford	100 Ringtones	\N	2025-10-28 11:41:17.532
79e8f066-51fd-4827-a108-dd78d99daa93	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Volkswagen	450 Ringtones	\N	2025-10-28 11:41:45.374
1e6200b4-ab63-4e3a-9ab4-a38b91ca8aff	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ferrari	€0.5	\N	2025-10-28 11:41:54.465
305c475f-2dd9-4692-a90f-b2eb7ef546f8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ford	100 Ringtones	\N	2025-10-28 11:43:17.437
3f5a11c8-ab33-4f3f-9698-82aba3fb12be	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ford	100 Ringtones	\N	2025-10-28 11:43:37.757
bc111ef7-5793-4715-8285-a87c9679c987	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Audi	3000 Ringtones	\N	2025-10-28 11:44:17.658
79f52bd4-325e-40c5-800f-5fc62daa507c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Honda	150 Ringtones	\N	2025-10-28 11:46:40.321
ca8b4e46-5ad1-4c20-bf64-5ca59ddbe28e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	BMW	€0.5	\N	2025-10-28 11:47:01.065
f58914d5-805f-4f48-ac3b-46280e98f34f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Mercedes-Benz	€0.6	\N	2025-10-28 13:32:27.329
4f780821-9f6a-429a-9df7-e1f26c77fdcd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Audi	3000 Ringtones	\N	2025-10-28 13:32:33.09
c53458bf-3df2-49d1-b8cb-7753531242f4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ford	100 Ringtones	\N	2025-10-28 13:32:39.128
89374293-8c6b-4159-9526-e70d3dfb95e3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Honda	150 Ringtones	\N	2025-10-28 13:32:45.127
d54884a7-f29a-499b-ba92-a66c2ef4b627	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Bentley	€0.25	\N	2025-10-28 13:32:59.004
23aaa49a-72e4-48eb-b027-4be4756ec6ed	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	BMW	€0.5	\N	2025-10-28 13:33:06.551
c23da4b0-6c61-4559-a385-bcb119c91a96	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	R	€100	\N	2025-10-28 14:00:09.542
1218d81e-0727-4928-a693-63b827ea51d2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ford	100 Ringtones	\N	2025-10-28 14:00:20.915
cee40ebf-0c40-4cf2-b88a-ecb67669e661	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Volkswagen	450 Ringtones	\N	2025-10-28 14:00:29.38
45a8618c-d7a2-476d-98d6-046803ba8e27	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Rolls-Royce	€0.1	\N	2025-10-28 14:13:27.296
1a71c4e3-073b-4ee7-888d-16b316428cf3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	R	€100	\N	2025-10-28 14:15:14.98
f9a4df8f-3c24-4624-9f39-60709ae59fdb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	McLaren	€0.7	\N	2025-10-28 14:16:33.603
fc09d630-3f33-4a74-9897-9d7763f29e33	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Lamborghini	€0.9	\N	2025-10-28 14:18:04.722
4bbdc9e7-27de-44ef-b841-cf4e86f083c2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Aston Martin	€0.15	\N	2025-10-28 14:18:33.984
0fff4f9b-4ccc-454c-a8b9-1e8bd8714ad9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Porsche	€0.8	\N	2025-10-28 14:18:47.154
f9251ad8-fba6-49b9-9bbd-9377d9e4c6f0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Toyota	250 Ringtones	\N	2025-10-28 14:20:48.927
d2bd2406-b068-4ab2-8a2b-2f4f66291f14	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	R	€100	\N	2025-10-28 14:20:58.746
84789974-6d57-4cef-80f0-0ab4e080dbcc	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Lamborghini	€0.9	\N	2025-10-28 14:21:07.358
4d457afb-4e66-4bd7-9ea9-ff494b49e8f0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	1000 Ringtones	\N	2025-10-28 14:22:48.821
7d7a98b0-543d-495e-b100-aa76b4b7a828	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Volkswagen	450 Ringtones	\N	2025-10-28 14:24:54.09
e01518ed-0380-43f4-866a-b619aa861190	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Audi	3000 Ringtones	\N	2025-10-28 14:25:02.873
c08d68e1-67a8-43e7-9e67-ddc0670e8e6c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Lamborghini	€0.9	\N	2025-10-28 14:36:08.435
829e0b9a-f3f0-4c0d-8e48-96a5337056b1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Aston Martin	€0.15	\N	2025-10-28 14:36:17.209
48420f17-723f-4220-8af3-3d96f1d7e610	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Volkswagen	450 Ringtones	\N	2025-10-28 14:36:25.516
d4333dcb-1f55-4936-baa7-d351fa9e862f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Rolls-Royce	€0.1	\N	2025-10-28 14:38:30.59
88aa7561-36c4-4b7f-917d-8bc6b805ebbd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	McLaren	€0.7	\N	2025-10-28 14:38:39.35
8ce9cd06-908a-49e8-8789-1a61829d9301	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Rolls-Royce	€0.1	\N	2025-10-28 14:38:48.697
72c0d88e-b235-4e5d-a2c2-bf95edc97287	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	R	€100	\N	2025-10-28 14:39:09.422
8b9dbd5a-acd0-4979-938d-a504c604fd6e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Lexus	850 Ringtones	\N	2025-10-28 14:39:20.862
25140b38-de3c-46e3-90b9-fa367874248a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Rolls-Royce	€0.1	\N	2025-10-28 14:39:35.764
e251e7e3-4aa3-4661-a8c7-2b638bd7b054	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Aston Martin	€0.15	\N	2025-10-28 14:39:43.373
30665ab7-1890-49ef-b410-55aab3eb6cf4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	R	€100	\N	2025-10-28 14:39:50.671
3f2d0fee-7366-4e42-8b3b-3eea150b7b19	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Volkswagen	450 Ringtones	\N	2025-10-28 14:39:58.232
847f0bfc-4219-405b-884f-8dc4604cdc84	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	50 Ringtones	\N	2025-10-28 15:06:58.061
080c2035-647a-4183-a460-9bc018a7b3dc	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Mini	€0.55	\N	2025-10-29 08:42:24.67
ec715656-d3d1-4147-b41c-f661ce86f3f8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	850 Ringtones	\N	2025-10-30 09:50:54.328
fc85a3a7-e4cc-427d-9ae1-9b71062c509f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	50 Ringtones	\N	2025-11-04 09:04:35.943
684093ce-235c-42b4-b4de-f13b4335ccb7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	250 Ringtones	\N	2025-11-04 09:39:58.755
eca6e886-e9d7-4bfc-b5f1-93e8a27a11c2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	50 Ringtones	\N	2025-11-04 09:49:08.013
11f78fc2-9a21-4b8a-9cad-394ca4502a80	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 11:44:48.489
48692f9f-2a71-47b7-bf3d-eb2eaa0aed4a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	500 Ringtones	\N	2025-11-04 11:45:11.053
faf1398d-6dbb-4375-831a-aaf0c5d883ea	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£1	\N	2025-11-04 11:45:36.797
6124999d-b49f-4bb9-a194-02b556cac8f1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	1000 Ringtones	\N	2025-11-04 11:46:00.801
2376dcf4-88e5-4523-9dfd-b1ae3f40f56f	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 12:54:33.313
18e00eeb-1c4b-4a3f-ab5b-559614937930	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	250 Ringtones	\N	2025-11-04 12:55:41.733
e7b19485-378c-49d7-9e37-58e9ff63be8e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£1	\N	2025-11-04 12:59:43.454
9c3522fe-cb09-48b6-87b6-28776aacc755	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 13:02:28.557
a8667aa0-84e1-4575-8a56-07ed9e59cc97	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 13:35:58.213
2bbc6983-4833-4789-8469-f8a4a6ec1488	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.5	\N	2025-11-04 14:06:42.322
630b4b29-b2b7-453f-a549-544b99414850	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:07:07.418
86c49352-9844-4fcb-b23d-1bacfac31d78	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	100 Ringtones	\N	2025-11-04 14:11:58.298
66286e88-8760-41fa-9494-c50c0df635dc	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	500 Ringtones	\N	2025-11-04 14:15:08.078
d3680b10-4985-4f47-8269-bc01769847a2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	100 Ringtones	\N	2025-11-04 14:15:16.786
45951b52-f015-4b57-bb73-4a4139d641a2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	500 Ringtones	\N	2025-11-04 14:15:53.682
51629c53-2d21-40a7-9845-ff67d10618c4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:20:49.632
0b523a93-6123-4684-a919-cba9f409d316	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	1000 Ringtones	\N	2025-11-04 14:25:12.095
c827beb6-1f22-48d5-ac04-0722306be293	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	250 Ringtones	\N	2025-11-04 14:25:49.867
43595631-b506-4703-b1d2-33163be3e8b7	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:27:31.926
1cd80b65-7d64-4478-a396-5c015d09015b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:27:44.459
499065d8-bd06-4d66-ac34-e754ed1d3785	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.5	\N	2025-11-04 14:40:01.414
05691347-0839-4ed5-bbe8-2307c043d988	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	50 Ringtones	\N	2025-11-04 14:40:56.55
5b404997-9ba9-4cde-8d44-50f1290d1bf1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	1000 Ringtones	\N	2025-11-04 14:41:26.192
c2d0d3a9-f367-4b55-92c9-0547737ab98d	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:42:59.319
fda69dae-d56e-40e8-8feb-229f306973bd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:43:39.269
d483effe-a619-44d6-84ed-c5b1a1b7eba4	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£1	\N	2025-11-04 14:44:04.228
4142188d-bca2-40e8-9a70-0137abb944eb	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£1	\N	2025-11-04 14:45:15.422
f86c7c2c-d5db-4454-aa8d-a70adb01f95a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£1	\N	2025-11-04 14:45:26.573
ab9a6415-c66d-4dbe-b088-7eee9ece7f80	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	1000 Ringtones	\N	2025-11-04 14:45:57.858
bf72c4e1-5b18-4b7d-bf3f-ef2c921135e8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:46:27.294
1ff1656d-5e42-412d-a39a-1c9ac1a1ad17	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:47:17.001
bc93c2d2-baeb-483e-beb6-1022507ff594	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	250 Ringtones	\N	2025-11-04 14:47:22.388
13e9bdfc-7987-416e-915c-2be9653f7a1a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	100 Ringtones	\N	2025-11-04 14:47:40.153
a0807c60-6fd6-49b9-a5c1-0c17f168de19	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	50 Ringtones	\N	2025-11-04 14:47:48.917
609518bc-5b71-4fdc-b769-75aa9af7ade3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£1	\N	2025-11-04 14:52:35.976
149254e6-8585-4207-84ca-549112252f30	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	250 Ringtones	\N	2025-11-04 14:57:22.326
e23ea2c4-970c-49ee-96b7-c22ac60ca7c8	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	1000 Ringtones	\N	2025-11-04 14:57:31.94
f08e8218-153a-4faf-a389-978e305a10b3	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£0.25	\N	2025-11-04 14:57:36.835
a0008cf6-9ee4-4432-aeef-129f49d865ce	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	1000 Ringtones	\N	2025-11-04 15:13:41.275
67abe48f-c663-428d-8777-1eaa875a9781	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	250 Ringtones	\N	2025-11-04 15:14:16.261
c0ecacbc-c6e9-4d2f-bf03-28ca39058abd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	£1	\N	2025-11-04 15:22:13.634
78763132-c1a0-4840-85ba-80232ad58ed0	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	1000 Ringtones	\N	2025-11-04 15:22:24.632
0fcb4d4e-0387-4a91-bfa8-d52c5d0a3496	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Scratch Card Prize	100 Ringtones	\N	2025-11-04 15:31:36.102
941191b1-11f5-4bc3-bea0-78c075c8061a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Ford	100 Ringtones	\N	2025-11-05 09:54:13.584
675cde06-8737-4743-a6dd-ed09eae30e3c	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	BMW	£0.5	\N	2025-11-05 10:06:54.273
c9e214db-e785-4598-8dc0-e0638b1aa61a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	£0.8	\N	2025-11-05 13:01:15.396
8377bd41-25f8-4b00-b55d-05a3bb19f5dd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	100 Ringtones	\N	2025-11-05 13:23:57.38
4bebd506-132b-4e6b-8bc4-e56436086503	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	£0.6	\N	2025-11-05 13:24:08.871
1f68facc-69f0-4cf5-b1ef-9b475db68fcd	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	2000 Ringtones	\N	2025-11-05 13:24:26.888
350148a4-85a6-4cba-9995-b8a88b025778	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	3000 Ringtones	\N	2025-11-05 13:24:48.764
a13236c3-4eb3-4e3c-8291-eee271bb722a	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	£0.15	\N	2025-11-05 13:30:31.359
edad0518-6c19-4907-bdeb-32246df79aab	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	£0.5	\N	2025-11-05 13:30:43.915
946bd036-fa5c-47c7-8afb-87c4461205e5	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	£0.9	\N	2025-11-05 13:31:13.393
5aaff683-c854-4e0c-af13-55f238edc07e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	£0.7	\N	2025-11-05 13:31:22.225
7e6eb80e-afbc-411f-bd04-7a0133cdabce	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	2000 Ringtones	\N	2025-11-05 13:31:41.225
33583903-cc11-43f2-b24a-62be169128c6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	250 Ringtones	\N	2025-11-05 13:31:56.271
a8cca6fe-b29e-4716-9550-856e2c4e8db1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	£5	\N	2025-11-05 13:43:40.137
29864ea0-2d51-43c9-84ae-9e1d73470508	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	100 Ringtones	\N	2025-11-05 13:43:49.713
b41d554a-870b-46c9-a0e5-12ca31f7e241	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	50 Ringtones	\N	2025-11-05 13:43:58.745
f476d606-552b-436e-9fcc-1141970c8c08	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	250 Ringtones	\N	2025-11-06 10:48:55.115
58c87258-f0db-4efe-b862-cc79b98225a2	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	100 Ringtones	\N	2025-11-06 12:08:37.874
f5ba57d5-da7c-4c16-b21d-427a95f906b6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	100 Ringtones	\N	2025-11-06 12:08:45.152
d45a554b-0071-48aa-851d-b7e3ff3bed3e	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	500 Ringtones	\N	2025-11-06 12:08:50.841
fbe6c112-60e4-470b-a723-d722344e31a1	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	400 Ringtones	\N	2025-11-06 12:50:15.438
7b2837d2-81f3-47e1-9136-126fa763a9a6	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	500 Ringtones	\N	2025-11-06 12:50:48.176
605903fe-d859-47b8-b9a8-232a32227fd9	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	75 Ringtones	\N	2025-11-06 13:29:29.593
b42cba1d-d637-49d0-b852-59b89f1aac76	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	400 Ringtones	\N	2025-11-06 13:46:52.673
812f5bfa-0388-42fc-bbda-3659b13dae2b	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	100 Ringtones	\N	2025-11-06 13:48:07.279
e5d19926-8687-4636-80aa-72972e80a724	4a3b4cb3-0e13-42c6-840a-9d8ea22ea45b	\N	Spin Wheel Prize	2000 Ringtones	\N	2025-11-07 11:23:01.209
\.


--
-- TOC entry 4706 (class 2606 OID 106533)
-- Name: competitions competitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_pkey PRIMARY KEY (id);


--
-- TOC entry 4708 (class 2606 OID 106544)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4725 (class 2606 OID 147489)
-- Name: scratch_card_usage scratch_card_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scratch_card_usage
    ADD CONSTRAINT scratch_card_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 4711 (class 2606 OID 106551)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 4723 (class 2606 OID 139297)
-- Name: spin_usage spin_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spin_usage
    ADD CONSTRAINT spin_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 4713 (class 2606 OID 106561)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 4715 (class 2606 OID 106570)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4717 (class 2606 OID 106585)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 4719 (class 2606 OID 106583)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4721 (class 2606 OID 106594)
-- Name: winners winners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winners
    ADD CONSTRAINT winners_pkey PRIMARY KEY (id);


--
-- TOC entry 4709 (class 1259 OID 106635)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- TOC entry 4726 (class 2606 OID 106600)
-- Name: orders orders_competition_id_competitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_competition_id_competitions_id_fk FOREIGN KEY (competition_id) REFERENCES public.competitions(id);


--
-- TOC entry 4727 (class 2606 OID 106595)
-- Name: orders orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4736 (class 2606 OID 147490)
-- Name: scratch_card_usage scratch_card_usage_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scratch_card_usage
    ADD CONSTRAINT scratch_card_usage_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 4737 (class 2606 OID 147495)
-- Name: scratch_card_usage scratch_card_usage_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scratch_card_usage
    ADD CONSTRAINT scratch_card_usage_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4734 (class 2606 OID 139298)
-- Name: spin_usage spin_usage_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spin_usage
    ADD CONSTRAINT spin_usage_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 4735 (class 2606 OID 139303)
-- Name: spin_usage spin_usage_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spin_usage
    ADD CONSTRAINT spin_usage_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4728 (class 2606 OID 106610)
-- Name: tickets tickets_competition_id_competitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_competition_id_competitions_id_fk FOREIGN KEY (competition_id) REFERENCES public.competitions(id);


--
-- TOC entry 4729 (class 2606 OID 106605)
-- Name: tickets tickets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4730 (class 2606 OID 106620)
-- Name: transactions transactions_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 4731 (class 2606 OID 106615)
-- Name: transactions transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4732 (class 2606 OID 106630)
-- Name: winners winners_competition_id_competitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winners
    ADD CONSTRAINT winners_competition_id_competitions_id_fk FOREIGN KEY (competition_id) REFERENCES public.competitions(id);


--
-- TOC entry 4733 (class 2606 OID 106625)
-- Name: winners winners_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winners
    ADD CONSTRAINT winners_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2025-11-07 17:01:05

--
-- PostgreSQL database dump complete
--

\unrestrict I8Tmaj4fzAh6bpO5rCj5SBfVyju1e47bO3pEfXd7P3SMK6XfyIc0iDFFzQOwp1p

