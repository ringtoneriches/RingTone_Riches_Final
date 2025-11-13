import React from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const BeAware = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text">
            Play Responsibly: Keeping It Fun and In Your Control
          </h1>

          <p className="text-lg leading-relaxed mb-6">
            At <span className="font-semibold">Ringtone Riches</span>, we want every part of your experience to be exciting, enjoyable, and within your comfort zone.
            Competitions should always add a bit of fun to your day — never stress or financial strain.
            We encourage all participants to take part responsibly and to treat competitions as entertainment, not a way to make money.
            By staying mindful of your spending and keeping things balanced, you can make sure your experience with Ringtone Riches always stays positive and enjoyable.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">Be Aware of Your Spending</h2>
            <p className="mb-4">
              The first step to responsible participation is understanding how much you are spending and making sure it fits within your overall budget.
              Take a moment to think about:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Am I setting clear limits on how much I spend each week or month?</li>
              <li>Am I tracking my entries and the total cost over time?</li>
              <li>Are competition entries taking priority over essential expenses or commitments?</li>
              <li>Am I using borrowed money or funds meant for other purposes to enter competitions?</li>
            </ul>
            <p className="mt-4">
              If any of these questions make you pause, it may be a suitable time to step back and review your spending habits.
              Setting clear limits early on helps you stay in control and enjoy the fun responsibly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">Tips for Staying in Control</h2>
            <p className="mb-4">
              To help you keep your participation healthy and enjoyable, try these simple tips:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Set a Spending Limit:</strong> Decide how much you can comfortably afford to spend and stick to that amount — whether it is weekly or monthly.</li>
              <li><strong>Take Breaks:</strong> Do not spend too long browsing or entering competitions in one sitting. Taking breaks helps keep your perspective fresh.</li>
              <li><strong>Avoid Chasing Wins or Losses:</strong> Each draw is independent — entering more to make up for earlier results often leads to overspending.</li>
              <li><strong>Play for Fun:</strong> Focus on the excitement and entertainment of taking part, not just the outcome.</li>
              <li><strong>Review Regularly:</strong> Check in on your activity every so often to make sure you are still within your limits.</li>
              <li><strong>Talk About It:</strong> If you are worried about how much time or money you are spending, talk to someone you trust — a friend, family member, or our support team.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">Recognising When It Might Be a Problem</h2>
            <p className="mb-4">
              It is important to know the signs that participation could be becoming unhealthy. You might notice:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Spending more than you can comfortably afford.</li>
              <li>Thinking about competitions constantly or feeling pressure to enter.</li>
              <li>Hiding how much you are spending from others.</li>
              <li>Feeling anxious, guilty, or frustrated after entering.</li>
              <li>Neglecting other priorities or relationships.</li>
              <li>Trying to win back losses by entering more competitions.</li>
            </ul>
            <p className="mt-4">
              If any of this sounds familiar, please take a step back and consider seeking help or taking a short break.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">Taking a Break or Getting Support</h2>
            <p className="mb-4">
              We understand that sometimes you may want to pause your participation for a while.
              Ringtone Riches provides options to help you do that:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Temporary Account Pause:</strong> You can contact our support team to request a temporary block on your account for a set period. During that time, you will not be able to enter any competitions.</li>
              <li><strong>Account Closure:</strong> If you feel a longer break is needed, you can ask for your account to be permanently closed.</li>
            </ul>
            <p className="mt-4">
              Your well-being always comes first at <span className="font-semibold">Ringtone Riches</span>.
              If you ever feel your participation is getting out of hand, please reach out — we are here to help you stay in control and keep things fun.
              Remember, competitions should always be an enjoyable form of entertainment, not a source of stress.
              Play smart, stay aware, and enjoy the thrill of Ringtone Riches responsibly.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BeAware;
