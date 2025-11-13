import React from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PlayResponsibly() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 gradient-text">
          Play Responsibly: Keeping Your Participation Enjoyable
        </h1>

        <div className="space-y-6 leading-relaxed text-muted-foreground">
          <p>
            At <span className="font-semibold text-foreground">Ringtone Riches</span>, we want your experience to be fun, exciting, and within your comfort zone. 
            Participating in our competitions should always be positive and enjoyable. However, it’s important to be mindful 
            of your spending and ensure that your participation remains something you control and enjoy.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-10">Understanding Your Spending</h2>
          <p>
            The first step towards responsible participation is being aware of your spending habits. Take a moment to consider 
            how much you are spending on competitions and whether it aligns with your overall budget and priorities.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Am I setting clear limits on how much I spend?</li>
            <li>Am I keeping track of my entries and associated costs?</li>
            <li>Are my competition entries taking priority over essential expenses?</li>
            <li>Am I borrowing money or using funds intended for other purposes to enter competitions?</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-10">Tips for Mindful Participation</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Set a Budget — Decide in advance how much you’re comfortable spending and stick to it.</li>
            <li>Time Limits — Be mindful of your time; take breaks and maintain perspective.</li>
            <li>Don’t Chase Losses — Each competition is independent; avoid spending to recover losses.</li>
            <li>Participate for Enjoyment — Focus on the fun, not just winning.</li>
            <li>Be Honest with Yourself — Regularly review your spending and habits.</li>
            <li>Talk About It — Discuss concerns with trusted friends or family for perspective.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-10">Recognising Potential Difficulties</h2>
          <p>Be aware of signs that participation might be becoming problematic:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Spending more money than you can comfortably afford</li>
            <li>Feeling preoccupied with competitions</li>
            <li>Lying about your participation or spending</li>
            <li>Experiencing guilt or anxiety about entries</li>
            <li>Neglecting responsibilities or relationships</li>
            <li>Trying to win back losses by entering more competitions</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-10">Taking a Break or Seeking Support</h2>
          <p>
            If you feel you need time away from competitions, we offer options to help you manage your access:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <span className="font-semibold">Temporary Account Blocking:</span> Contact our support team to temporarily block your account for a chosen period.
            </li>
            <li>
              <span className="font-semibold">Account Termination:</span> Request permanent closure of your account if you prefer a longer break.
            </li>
          </ul>

          <p>
            Your well-being matters to us at <span className="font-semibold text-foreground">Ringtone Riches</span>. 
            Participate responsibly and reach out to our support team if you have concerns or would like to discuss taking a break. 
            Remember — the goal is to have fun and enjoy the thrill of competition responsibly.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
