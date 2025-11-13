import { neon } from "@neondatabase/serverless";

// This script seeds the production database with data from development
// Run this with: DATABASE_URL=<your-production-db-url> tsx scripts/seed-production.ts

const sql = neon(process.env.DATABASE_URL!);

async function seedProduction() {
  console.log("🌱 Starting production database seeding...\n");

  try {
    // Seed Competitions
    console.log("📝 Seeding competitions...");
    const competitions = [
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761399799/Copy_of_Untitled_Design_-_1_d9fuc7.png",
        type: "instant",
        ticket_price: "0.99",
        max_tickets: 1300,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Voucher emailed or posted to winner",
          mainPrize: "£1,000 TUI Holiday Voucher",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£950 Cash"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 0
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221647/WIN_%C3%BA1000_TAX_FREE_CASH_c2t7rm.png",
        type: "instant",
        ticket_price: "0.99",
        max_tickets: 1300,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Paid directly to winner's bank account",
          mainPrize: "£1,000 Tax-Free Cash",
          drawMethod: "Once all tickets are sold"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 999
      },
      {
        id: "717e819f-6e70-41bd-93ba-2c9a727113b8",
        title: "Scratch & Win",
        description: "Scratch your way to big prizes — cash or points await!",
        image_url: "/attached_assets/competitions/1762777721595-fZAMr1KI.jpg",
        type: "scratch",
        ticket_price: "2.00",
        max_tickets: 1000,
        sold_tickets: 0,
        prize_data: null,
        is_active: true,
        ringtone_points: 0,
        display_order: 999
      },
      {
        id: "5daa774d-a8d7-4404-a3d4-382609be0c25",
        title: "Spin the Wheel",
        description: "Spin the wheel and win amazing rewards instantly!",
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761305603/25639_zg9gbn.jpg",
        type: "spin",
        ticket_price: "2.00",
        max_tickets: null,
        sold_tickets: 0,
        prize_data: null,
        is_active: true,
        ringtone_points: 0,
        display_order: 999
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221633/Win_a_Lux_Excite_Sink_dz6paf.png",
        type: "instant",
        ticket_price: "0.40",
        max_tickets: 1000,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Free tracked delivery to winner",
          mainPrize: "Lux Excite Sink (brand new and boxed)",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "N/A"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 999
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221629/WIN_%C3%BA500_Smyth%CE%93%C3%87%C3%96s_Toys_Gift_Card_h7apug.png",
        type: "instant",
        ticket_price: "0.50",
        max_tickets: 1600,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Free tracked delivery to winner",
          mainPrize: "£500 Smyths Toys Gift Card",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£500 Cash"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 999
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221627/Win_a_%C3%BA500_Amazon_Gift_Card_ufkwfx.png",
        type: "instant",
        ticket_price: "0.50",
        max_tickets: 1600,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Free tracked delivery to winner",
          mainPrize: "£500 Amazon Gift Card",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£500 Cash"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 999
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221644/Win_a_PS5_Pro_xh08uw.png",
        type: "instant",
        ticket_price: "0.50",
        max_tickets: 2000,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Free tracked delivery to winner",
          mainPrize: "PlayStation 5 Pro Digital Edition",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£850 Cash"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 999
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221636/Win_%C3%BA500_JD_Sports_Gift_Card_iqjrqb.png",
        type: "instant",
        ticket_price: "0.50",
        max_tickets: 1600,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Free tracked delivery to winner",
          mainPrize: "£500 JD Sports Gift Card",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£500 Cash"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 999
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761221954/%C3%BA500_FREE_GIVEAWAY-min_fysee5.png",
        type: "instant",
        ticket_price: "0.00",
        max_tickets: 1000,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Paid directly to the winner",
          mainPrize: "£500 Tax-Free Cash",
          drawMethod: "Once all free entries are filled",
          cashAlternative: "N/A"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 1000
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
        image_url: "https://res.cloudinary.com/dziy5sjas/image/upload/v1761399783/Copy_of_TUI_HOLIDAY_VOUCHER_nbuzxa.png",
        type: "instant",
        ticket_price: "0.75",
        max_tickets: 2000,
        sold_tickets: 0,
        prize_data: JSON.stringify({
          delivery: "Free tracked delivery to winner",
          mainPrize: "Orange iPhone 17 Pro Max (Unlocked)",
          drawMethod: "Once all tickets are sold",
          cashAlternative: "£1,000 Cash"
        }),
        is_active: true,
        ringtone_points: 0,
        display_order: 1000
      }
    ];

    for (const comp of competitions) {
      await sql`
        INSERT INTO competitions (
          id, title, description, image_url, type, ticket_price, 
          max_tickets, sold_tickets, prize_data, is_active, 
          ringtone_points, display_order
        ) VALUES (
          ${comp.id}, ${comp.title}, ${comp.description}, ${comp.image_url}, 
          ${comp.type}, ${comp.ticket_price}, ${comp.max_tickets}, ${comp.sold_tickets}, 
          ${comp.prize_data}, ${comp.is_active}, ${comp.ringtone_points}, ${comp.display_order}
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          is_active = EXCLUDED.is_active,
          display_order = EXCLUDED.display_order
      `;
    }
    console.log(`✅ Seeded ${competitions.length} competitions\n`);

    // Seed Scratch Card Images
    console.log("🎴 Seeding scratch card images...");
    const scratchImages = [
      { id: "fea992a0-e447-434c-bc03-3b1540ba1209", image_name: "Barrier Reef", image_key: "barrier_reef", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 0 },
      { id: "6d2d0c70-8534-4f78-8fa1-f71c4641a218", image_name: "Angel of the North", image_key: "angel_of_north", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 1 },
      { id: "6aa74dfe-129a-479c-bde9-65e7785d6fb7", image_name: "Big Ben", image_key: "big_ben", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 2 },
      { id: "e885d0b7-bec5-477c-9bbc-1648209aae57", image_name: "Buckingham Palace", image_key: "buckingham_palace", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 3 },
      { id: "1243e9e3-911c-4fc2-bf43-abd884a177b0", image_name: "Burj Khalifa", image_key: "burj_khalifa", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 4 },
      { id: "5f0fbfd9-a6f4-4d9e-913a-6346a8a9f46c", image_name: "Colosseum", image_key: "colosseum", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 5 },
      { id: "526e56a0-1887-4345-bbe6-5f70bbd40cec", image_name: "Eiffel Tower", image_key: "eiffel_tower", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 6 },
      { id: "36bf8b59-b5ab-40e8-9021-f7ccc5d78e1a", image_name: "Empire State", image_key: "empire_state", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 7 },
      { id: "a311e671-a018-4bd9-942d-e26e942c3a2e", image_name: "Golden Gate Bridge", image_key: "golden_gate", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 8 },
      { id: "b879bcde-3565-4ec0-b210-6396c9eccdff", image_name: "Grand Canyon", image_key: "grand_canyon", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 9 },
      { id: "abd5b0e0-9585-4fa6-94b9-303ef2ed6559", image_name: "Great Wall of China", image_key: "great_wall", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 10 },
      { id: "1ef78cee-7557-4b06-800e-9b20f98cc9a9", image_name: "Mount Everest", image_key: "mount_everest", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 11 },
      { id: "75f1d77f-dfb3-43c3-b820-7060ad93f4e2", image_name: "Notre Dame", image_key: "notre_dame", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 12 },
      { id: "8f86a858-bb69-4683-ba98-110fd7b603e3", image_name: "Pyramids of Pisa", image_key: "pyramids_pisa", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 13 },
      { id: "f0d5b4ed-ef8c-41a2-9a30-789452165a7e", image_name: "Statue of Liberty", image_key: "statue_liberty", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 14 },
      { id: "c88e02c3-caca-4491-981b-311d95cfbd35", image_name: "Stonehenge", image_key: "stonehenge", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 15 },
      { id: "9f8c5896-8771-43ab-8b30-f2aea6a9ea7c", image_name: "Taj Mahal", image_key: "taj_mahal", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 16 },
      { id: "6bd4a870-c5d6-4ba2-b5e0-555f1a5ff05b", image_name: "Times Square", image_key: "times_square", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 17 },
      { id: "dabc28c6-0a34-4439-adb4-8527529171bd", image_name: "Tower Bridge", image_key: "tower_bridge", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 18 },
      { id: "8d295045-574c-47d5-8eac-786e30f3373f", image_name: "Tower of Pisa", image_key: "tower_pisa", reward_type: "try_again", reward_value: 0, weight: 50, max_wins: null, display_order: 19 }
    ];

    for (const img of scratchImages) {
      await sql`
        INSERT INTO scratch_card_images (
          id, image_name, image_key, reward_type, reward_value, 
          weight, max_wins, quantity_won, is_active, display_order
        ) VALUES (
          ${img.id}, ${img.image_name}, ${img.image_key}, ${img.reward_type}, 
          ${img.reward_value}, ${img.weight}, ${img.max_wins}, 
          0, true, ${img.display_order}
        ) ON CONFLICT (id) DO UPDATE SET
          image_name = EXCLUDED.image_name,
          reward_type = EXCLUDED.reward_type,
          reward_value = EXCLUDED.reward_value,
          weight = EXCLUDED.weight,
          display_order = EXCLUDED.display_order
      `;
    }
    console.log(`✅ Seeded ${scratchImages.length} scratch card images\n`);

    console.log("✨ Production database seeding completed successfully!");
    console.log("\n📝 Summary:");
    console.log(`   - ${competitions.length} competitions created`);
    console.log(`   - ${scratchImages.length} scratch card images created`);
    console.log("\n💡 Note: You'll still need to create an admin user via the registration page.");
    
  } catch (error) {
    console.error("❌ Error seeding production database:", error);
    throw error;
  }
}

seedProduction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
