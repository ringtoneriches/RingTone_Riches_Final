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
            At Ringtone Riches, we want every part of your experience to be
            exciting, enjoyable and within your comfort zone. Competitions
            should always add a bit of fun to your day – never stress or
            financial pressure.
          </p>

          <p className="text-lg leading-relaxed mb-6">
            We encourage all players to take part responsibly and to treat our
            games as entertainment, not a way to make money. By staying mindful
            of your spending and using the tools in your account, you can keep
            your Ringtone Riches experience positive.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">
              Your Well-Being Tools
            </h2>
            <p className="mb-4">
              You'll find a dedicated Well-Being section in My Account with
              controls to help you stay in charge:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Daily Spending Limit:</strong> Set a maximum amount
                you're happy to spend in any 24-hour period.
              </li>
              <li>
                <strong>Real-Time Spend View:</strong> See at a glance how much
                you've spent today and how much remains within your limit.
              </li>
              <li>
                <strong>Temporary Suspension ("Take a Break"):</strong> Choose a
                suspension period (from 1 day up to 365 days). During this time
                you won't be able to log in, top up, or enter any competitions.
              </li>
              <li>
                <strong>Permanent Account Closure:</strong> Permanently close
                your account yourself if you feel you need to step away for
                good. This will remove access to your account, wallet balance,
                Ringtone Points, referral rewards and order history.
              </li>
            </ul>
            <p className="mt-4">
              You can access all of these by logging in and going to:
              <br />
              <strong>My Account → Well-Being</strong>
            </p>
            <p className="mt-2">
              If you ever need help using these tools, our support team is
              available at{" "}
              <a
                href="mailto:support@ringtoneriches.co.uk"
                className="text-blue-500 hover:underline"
              >
                support@ringtoneriches.co.uk
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">
              Be Aware of Your Spending
            </h2>
            <p className="mb-4">
              It's important that any money you spend here fits comfortably
              within your overall budget. Ask yourself:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Have I set a clear weekly or monthly limit for myself?</li>
              <li>Am I tracking roughly how much I've spent over time?</li>
              <li>
                Are competition entries ever taking priority over essential
                bills or commitments?
              </li>
              <li>Am I ever tempted to use money meant for something else?</li>
            </ul>
            <p className="mt-4">
              If any of these make you pause, it might be a good time to use the
              Daily Spending Limit or take a short break using the Temporary
              Suspension option.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">
              Tips for Staying in Control
            </h2>
            <p className="mb-4">
              To help you keep your participation healthy and enjoyable, try
              these simple tips:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Set a Spending Limit:</strong> Decide how much you can
                comfortably afford to spend and stick to that amount — whether
                it is weekly or monthly.
              </li>
              <li>
                <strong>Take Breaks:</strong> Do not spend too long browsing or
                entering competitions in one sitting. Taking breaks helps keep
                your perspective fresh.
              </li>
              <li>
                <strong>Avoid Chasing Wins or Losses:</strong> Each draw is
                independent — entering more to make up for earlier results often
                leads to overspending.
              </li>
              <li>
                <strong>Play for Fun:</strong> Focus on the excitement and
                entertainment of taking part, not just the outcome.
              </li>
              <li>
                <strong>Review Regularly:</strong> Check in on your activity
                every so often to make sure you are still within your limits.
              </li>
              <li>
                <strong>Talk About It:</strong> If you are worried about how
                much time or money you are spending, talk to someone you trust —
                a friend, family member, or our support team.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">
              Recognising When It Might Be a Problem
            </h2>
            <p className="mb-4">
              It's important to know the signs that participation could be
              becoming unhealthy. You might notice:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Spending more than you can comfortably afford.</li>
              <li>
                Thinking about competitions constantly or feeling pressure to
                enter.
              </li>
              <li>Hiding how much you are spending from others.</li>
              <li>Feeling anxious, guilty, or frustrated after entering.</li>
              <li>Neglecting other priorities or relationships.</li>
              <li>Trying to win back losses by entering more competitions.</li>
            </ul>
            <p className="mt-4">
              If any of this sounds familiar, please take a step back and
              consider using our Well-Being tools or seeking help. You can set a
              low spend limit, use Temporary Suspension, or close your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">
              Taking a Break or Getting Support
            </h2>
            <p className="mb-4">
              We understand that sometimes you may want to pause your
              participation for a while. Ringtone Riches provides options to
              help you do that:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Temporary Suspension:</strong> You can suspend your
                account for 1-365 days directly from the Well-Being page. During
                that time, you will not be able to log in, top up, or enter any
                competitions.
              </li>
              <li>
                <strong>Account Closure:</strong> If you feel a longer break is
                needed, you can permanently close your account yourself from the
                Well-Being page.
              </li>
            </ul>
            <p className="mt-4">
              Your well-being always comes first at Ringtone Riches. If you ever
              feel your participation is getting out of hand, please reach out —
              we are here to help you stay in control and keep things fun.
              Remember, competitions should always be an enjoyable form of
              entertainment, not a source of stress.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-primary">
              Need Extra Support?
            </h2>
            <p className="mb-4">
              If you ever feel your play is no longer fun, we strongly encourage
              you to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Use the tools in the Well-Being section of your account; and
              </li>
              <li>
                Reach out for independent advice or support with money worries
                or emotional well-being (for example through free UK advice
                services or helplines).
              </li>
            </ul>
            <p className="mt-4 ">
              Your well-being always comes first at Ringtone Riches. Our
              competitions are designed for entertainment only — please only
              ever play with money you can afford to lose.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BeAware;
