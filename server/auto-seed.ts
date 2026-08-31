import { db } from "./db";
import { competitions, scratchCardImages } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function autoSeedProduction() {
  // Only run in production
  // if (process.env.NODE_ENV !== "production") {
  //   return;
  // }

  try {
    console.log("🔍 Checking if production database needs seeding...");

    // Check if competitions already exist
    const existingCompetitions = await db.select().from(competitions).limit(1);
    
    if (existingCompetitions.length > 0) {
      console.log("✅ Database already has data, skipping auto-seed");
      return;
    }

    console.log("🌱 Database is empty, starting auto-seed...");

    // Seed Competitions
    const competitionsData = [
      {
        id: "78cc196f-ecb2-4fe3-a641-b9b1ccae89df",
        title: "WIN A £1,000 TUI HOLIDAY VOUCHER – JUST 99p PER ENTRY!",
        description: `✈️ WIN A £1,000 TUI HOLIDAY VOUCHER – JUST 99p PER ENTRY! 🌴

Dreaming of your next getaway? This is your chance to make it happen with a £1,000 TUI Holiday Voucher — the perfect ticket to sunshine, sea, and unforgettable memories. ☀️

For just 99p per ticket, you could be jetting off to your dream destination — or, if you would prefer, take £950 cash instead! 💷

😮 99p per entry
🎟 1,300 total tickets
📅 Draw Date: Once all tickets are sold
🏆 Winner drawn LIVE on Facebook via Ringtone Riches
🌍 £1,000 TUI Holiday Voucher
💷 Or £950 cash alternative

Whether it is a luxury escape, a family trip, or a last-minute city break — you choose the destination! ✈️

Enter today for just 99p and turn your holiday dreams into reality.

🎟 Grab your tickets now — only 1,300 available!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761399799/Copy_of_Untitled_Design_-_1_d9fuc7.png",
        type: "instant" as const,
        ticketPrice: "0.99",
        maxTickets: 1300,
        soldTickets: 0,
        prizeData: {
          delivery: "Voucher emailed or posted to winner",
          mainPrize: "£1,000 TUI Holiday Voucher",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£950 Cash"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 0
      },
      {
        id: "906d21f7-ef97-47f1-8a8b-2d95695ba21e",
        title: "WIN £1,000 TAX-FREE CASH – JUST 99p PER ENTRY! 🎄",
        description: `💷 WIN £1,000 TAX-FREE CASH – JUST 99p PER ENTRY! 🎄

Christmas is just around the corner — and this £1,000 tax-free cash prize could help pay for it! 💷
For just 99p per ticket, you could be our next lucky winner, taking home £1,000 straight to your bank account — just in time for the festive season.

Whether it is presents, food, travel, or just a stress-free Christmas, this cash could make it happen for under £1!

😮 99p per entry
🎟 1,300 total tickets
📅 Draw Date: Once all tickets are sold
🏆 Winner drawn LIVE on Facebook via Ringtone Riches
💷 £1,000 tax-free cash prize
💳 Paid directly to the winner

Quick, simple, and tax-free — you win, you keep it all!
Enter now for just 99p, and you could have your Christmas fully paid for! 🎅💷

🎟 Grab your tickets now — only 1,300 available!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221647/WIN_%C3%BA1000_TAX_FREE_CASH_c2t7rm.png",
        type: "instant" as const,
        ticketPrice: "0.99",
        maxTickets: 1300,
        soldTickets: 0,
        prizeData: {
          delivery: "Paid directly to winner's bank account",
          mainPrize: "£1,000 Tax-Free Cash",
          drawMethod: "Once all tickets are sold"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 999
      },
      {
        id: "717e819f-6e70-41bd-93ba-2c9a727113b8",
        title: "🌎 SCRATCH NATIONS — MATCH THE FLAGS, REVEAL THE RITCHES! 💰 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        description: "The flags are flying and the prizes are ready! Scratch the card, reveal your symbols and match 3 identical flags to win instantly. With prizes up to £2,000 plus Ringtone Points, every scratch could reveal something big.",
        imageUrl: "https://pub-8ee6681709ff46c18f6e8ff4543d7d3b.r2.dev/competitions/1787439731464-q9mw9i4w.jpeg",
        type: "scratch" as const,
        ticketPrice: "0.75",
        maxTickets: 55000,
        soldTickets: 0,
        prizeAmount: "2000.00",
        prizeData: null,
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 999
      },
      {
        id: "5daa774d-a8d7-4404-a3d4-382609be0c25",
        title: "Spin the Wheel",
        description: "Spin the wheel and win amazing rewards instantly!",
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761305603/25639_zg9gbn.jpg",
        type: "spin" as const,
        ticketPrice: "2.00",
        maxTickets: null,
        soldTickets: 0,
        prizeData: null,
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 999
      },
      {
        id: "64e3bfc8-56bf-4d39-9d4b-5849740ae9b8",
        title: "🚰 WIN A LUX EXCITE SINK – JUST 40p PER ENTRY! 💥",
        description: `Transform your kitchen with the stunning Lux Excite Sink — a modern, high-end feature designed to bring both style and practicality to your home.

For just 40p per ticket, you could take home this luxury sink setup, complete with smart design, sleek finish, and built-in functionality that makes it more than just a sink — it is a statement piece.

🪙 40p per entry
🎟 1,000 total tickets
📅 Draw Date: Once all tickets are sold
🏆 Winner drawn LIVE on Facebook via Ringtone Riches
🚰 Lux Excite Sink (brand new and boxed)
🚚 Free tracked delivery to the winner

Add a touch of luxury to your kitchen for less than 50p!
Enter today for your chance to win the Lux Excite Sink — and upgrade your home in style.

🎟 Grab your tickets now — only 1,000 available!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221633/Win_a_Lux_Excite_Sink_dz6paf.png",
        type: "instant" as const,
        ticketPrice: "0.40",
        maxTickets: 1000,
        soldTickets: 0,
        prizeData: {
          delivery: "Free tracked delivery to winner",
          mainPrize: "Lux Excite Sink (brand new and boxed)",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "N/A"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 999
      },
      {
        id: "46b0a15b-293d-4ae1-957b-463eb9fe96d1",
        title: "🎁 WIN A £500 SMYTHS TOYS GIFT CARD – JUST 50p PER ENTRY! 💥",
        description: `Treat the kids (or yourself!) with a £500 Smyths Toys Gift Card — perfect for games, gadgets, and toys for all ages!

For just 50p per ticket, you could win £500 to spend at Smyths Toys, giving you access to the latest consoles, LEGO sets, bikes, and more.
Prefer cash instead? No problem — you can take the £500 cash alternative instead! 💷

🪙 50p per entry
🎟 1,600 total tickets
📅 Draw Date: Once all tickets are sold
🏆 Winner drawn LIVE on Facebook via Ringtone Riches
🎁 £500 Smyths Toys Gift Card
💷 Or £500 cash alternative

From PlayStation to Pokémon and everything in between — spend your winnings your way!
Enter today for just 50p and you could be our next big winner!

🎟 Grab your tickets now — only 1,600 available!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221629/WIN_%C3%BA500_Smyth%CE%93%C3%87%C3%96s_Toys_Gift_Card_h7apug.png",
        type: "instant" as const,
        ticketPrice: "0.50",
        maxTickets: 1600,
        soldTickets: 0,
        prizeData: {
          delivery: "Free tracked delivery to winner",
          mainPrize: "£500 Smyths Toys Gift Card",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£500 Cash"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 999
      },
      {
        id: "92121471-11a1-49f7-984a-8cd9cf323156",
        title: "⚡️ WIN A £500 AMAZON GIFT CARD – JUST 50p PER ENTRY! 💥",
        description: `Shop anything, anytime, with a £500 Amazon Gift Card — from tech and homeware to fashion and entertainment!

For just 50p per ticket, you could get your hands on a £500 Amazon gift card, giving you endless ways to spend.
Or, if you would prefer, take the £500 cash alternative instead — the choice is yours! 💷

🪙 50p per entry
🎟 1,600 total tickets
📅 Draw Date: Once all tickets are sold
🏆 Winner drawn LIVE on Facebook via Ringtone Riches
🎁 £500 Amazon Gift Card
💷 Or £500 cash alternative

Whether it is the latest gadgets, home essentials, or fashion favourites — spend it your way!
Enter today for just 50p and you could be our next big winner!

🎟 Grab your tickets now — only 1,600 available!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221627/Win_a_%C3%BA500_Amazon_Gift_Card_ufkwfx.png",
        type: "instant" as const,
        ticketPrice: "0.50",
        maxTickets: 1600,
        soldTickets: 0,
        prizeData: {
          delivery: "Free tracked delivery to winner",
          mainPrize: "£500 Amazon Gift Card",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£500 Cash"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 999
      },
      {
        id: "e4496d60-1b53-4b39-a4ff-2ef3559738a6",
        title: "🎮 WIN A PLAYSTATION 5 PRO (DIGITAL EDITION) – JUST 50p PER ENTRY! ⚡️",
        description: `Get ready to experience the next level of gaming with the all-new PlayStation 5 Pro Digital Edition — lightning-fast, ultra-smooth, and built for players who live for performance.

For just 50p per ticket, you could be taking home the newest and most powerful digital console from Sony. With only 2,000 tickets available, this competition will not last long — once they are gone, the draw goes LIVE!

Or if consoles are not your thing, take the £850 cash alternative instead! 💷

🪙 50p per entry
🎟 2,000 total tickets
📅 Draw Date: Once all tickets are sold
🏆 Winner drawn LIVE on Facebook via Ringtone Riches
🎮 Brand new PlayStation 5 Pro Digital Edition (latest model)
💷 Or £850 cash alternative
🚚 Free tracked delivery straight to the winner

Take your gaming to the next level — no discs, no waiting, just pure digital power.
Enter today with Ringtone Riches 🎵 and you could be unboxing your brand-new PS5 Pro or pocketing £850 cash for just 50p!

🎟 Grab your tickets now — only 2,000 available!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221644/Win_a_PS5_Pro_xh08uw.png",
        type: "instant" as const,
        ticketPrice: "0.50",
        maxTickets: 2000,
        soldTickets: 0,
        prizeData: {
          delivery: "Free tracked delivery to winner",
          mainPrize: "PlayStation 5 Pro Digital Edition",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£850 Cash"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 999
      },
      {
        id: "f451a094-96cb-44dc-bd54-e1ce17bba39d",
        title: "💷 WIN A £500 JD SPORTS GIFT CARD – JUST 50p PER ENTRY! 🏆",
        description: `Step up your style with a £500 JD Sports Gift Card — your ticket to fresh trainers, streetwear, and all the biggest brands including Nike, On Cloud, The North Face, and Lacoste 👟🔥

For just 50p per ticket, you could treat yourself to a full wardrobe upgrade or the latest kicks — all for less than £1!
Prefer cash instead? No problem — you can take £500 in cash if you would rather! 💷

🪙 50p per entry
🎟 1,600 total tickets
📅 Draw Date: Once all tickets are sold
🏆 Winner drawn LIVE on Facebook via Ringtone Riches
🎁 £500 JD Sports Gift Card
💷 Or £500 cash alternative

Do not miss your chance to win a £500 shopping spree or £500 cash — all for just 50p per entry!
Enter today with Ringtone Riches 🎵 — where real players win real prizes 💷

🎟 Grab your tickets now — only 1,600 available!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221636/Win_%C3%BA500_JD_Sports_Gift_Card_iqjrqb.png",
        type: "instant" as const,
        ticketPrice: "0.50",
        maxTickets: 1600,
        soldTickets: 0,
        prizeData: {
          delivery: "Free tracked delivery to winner",
          mainPrize: "£500 JD Sports Gift Card",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£500 Cash"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 999
      },
      {
        id: "a3c74369-bcaa-4ac0-8a45-610b9e831039",
        title: "💷 £500 FREE GIVEAWAY! 🎉",
        description: `To celebrate all our amazing supporters, we are giving YOU the chance to win £500 cash — completely free! 💥

That is right — no entry fee, no catches, just a genuine giveaway from Ringtone Riches to say thank you for being part of our growing community.

🎟 Free entry
💷 £500 tax-free cash prize
📅 Draw Date: Once all free entries are filled
🏆 Winner drawn LIVE on Facebook via Ringtone Riches

It is quick, simple, and 100% free to enter. 🙌
Do not miss your chance to pocket £500 cash — it could be you taking home the win for free!

🎟 Enter now — it costs nothing to play!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221954/%C3%BA500_FREE_GIVEAWAY-min_fysee5.png",
        type: "instant" as const,
        ticketPrice: "0.00",
        maxTickets: 1000,
        soldTickets: 0,
        prizeData: {
          delivery: "Paid directly to the winner",
          mainPrize: "£500 Tax-Free Cash",
          drawMethod: "Once all free entries are filled",
          cashAlternative: "N/A"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 1000
      },
      {
        id: "3a7841d0-7e1c-4cb4-8e4c-1d7fc33ed907",
        title: "📱 WIN AN ORANGE iPHONE 17 PRO MAX – JUST 75p PER ENTRY! 🔥",
        description: `Stand out from the crowd with the stunning Orange iPhone 17 Pro Max — Apple's newest and most powerful smartphone, and it could be yours for just 75p!

With only 2,000 tickets available, this is your chance to grab the latest iPhone in a bold new colour for less than £1!
Or, if you prefer, take £1,000 cash instead — the choice is yours! 💷

🪙 75p per entry
🎟 2,000 total tickets
📅 Draw Date: Once all tickets are sold.
🏆 Winner drawn LIVE on Facebook via Ringtone Riches
📱 Brand new Orange iPhone 17 Pro Max (unlocked)
💷 Or £1,000 cash alternative
🚚 Free tracked delivery straight to the winner

🔥 Do not miss this one — limited tickets mean this exclusive orange edition will not last long!
Enter today for just 75p and you could be unboxing your brand-new iPhone 17 Pro Max or pocketing £1,000 cash!

🎟 Grab your tickets now — only 2,000 available!`,
        imageUrl: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761399783/Copy_of_TUI_HOLIDAY_VOUCHER_nbuzxa.png",
        type: "instant" as const,
        ticketPrice: "0.75",
        maxTickets: 2000,
        soldTickets: 0,
        prizeData: {
          delivery: "Free tracked delivery to winner",
          mainPrize: "Orange iPhone 17 Pro Max (Unlocked)",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£1,000 Cash"
        },
        isActive: true,
        ringtonePoints: 0,
        displayOrder: 1000
      }
    ];

    await db.insert(competitions).values(competitionsData).onConflictDoNothing();
    console.log(`✅ Seeded ${competitionsData.length} competitions`);

    // Seed Scratch Card Images
    const scratchImagesData = [
      { id: "a11e0001-0000-4000-8000-000000000001", imageName: "England", imageKey: "gb-eng", rewardType: "cash" as const, rewardValue: "2000", weight: 1, maxWins: 2, quantityWon: 0, isActive: true, displayOrder: 0 },
      { id: "a11e0001-0000-4000-8000-000000000002", imageName: "Argentina", imageKey: "ar", rewardType: "cash" as const, rewardValue: "1000", weight: 1, maxWins: 3, quantityWon: 0, isActive: true, displayOrder: 1 },
      { id: "a11e0001-0000-4000-8000-000000000003", imageName: "Spain", imageKey: "es", rewardType: "cash" as const, rewardValue: "500", weight: 2, maxWins: 5, quantityWon: 0, isActive: true, displayOrder: 2 },
      { id: "a11e0001-0000-4000-8000-000000000004", imageName: "France", imageKey: "fr", rewardType: "cash" as const, rewardValue: "250", weight: 3, maxWins: 10, quantityWon: 0, isActive: true, displayOrder: 3 },
      { id: "a11e0001-0000-4000-8000-000000000005", imageName: "Brazil", imageKey: "br", rewardType: "cash" as const, rewardValue: "100", weight: 4, maxWins: 40, quantityWon: 0, isActive: true, displayOrder: 4 },
      { id: "a11e0001-0000-4000-8000-000000000006", imageName: "Germany", imageKey: "de", rewardType: "cash" as const, rewardValue: "50", weight: 5, maxWins: 11, quantityWon: 0, isActive: true, displayOrder: 5 },
      { id: "a11e0001-0000-4000-8000-000000000007", imageName: "Portugal", imageKey: "pt", rewardType: "points" as const, rewardValue: "1000", weight: 3, maxWins: 10, quantityWon: 0, isActive: true, displayOrder: 6 },
      { id: "a11e0001-0000-4000-8000-000000000008", imageName: "Japan", imageKey: "jp", rewardType: "points" as const, rewardValue: "500", weight: 6, maxWins: 2020, quantityWon: 0, isActive: true, displayOrder: 7 },
      { id: "a11e0001-0000-4000-8000-000000000009", imageName: "Croatia", imageKey: "hr", rewardType: "points" as const, rewardValue: "200", weight: 7, maxWins: 400, quantityWon: 0, isActive: true, displayOrder: 8 },
      { id: "a11e0001-0000-4000-8000-00000000000a", imageName: "No Win", imageKey: "No_Win", rewardType: "try_again" as const, rewardValue: "0", weight: 68, maxWins: 9160, quantityWon: 0, isActive: true, displayOrder: 9 },
    ];

    await db.insert(scratchCardImages).values(scratchImagesData).onConflictDoNothing();
    console.log(`✅ Seeded ${scratchImagesData.length} scratch card images`);

    console.log("✨ Production auto-seed completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during auto-seed:", error);
    // Don't throw - let the server start anyway
  }
}
