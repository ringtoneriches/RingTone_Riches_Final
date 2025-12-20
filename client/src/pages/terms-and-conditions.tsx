import React from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-10 text-center text-yellow-400 uppercase">
          Terms & Conditions
        </h1>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">
              Introduction
            </h2>
            <p className="mb-3">
              Ringtone Riches ("Ringtone Riches", "we", "us", "our") is a promoter of
              skill-based prize competitions which allocate prizes in accordance with
              these Terms & Conditions ("Terms") on:
            </p>
            <p className="mb-3">
              <strong>www.ringtoneriches.co.uk</strong>
            </p>
            <p className="mb-3">
              Ringtone Riches operates from:
            </p>
            <p className="mb-3">
              1 West Havelock Street, South Shields, Tyne & Wear, United Kingdom, NE33 5AF
            </p>
            <p className="mb-3">
              Email: support@ringtoneriches.co.uk
            </p>
            <p>
              We may run multiple competitions at any one time, each with a
              predetermined prize. Each competition contains a skill, knowledge, or
              judgement question that must be answered correctly to qualify for entry.
              This ensures participation is based on skill rather than pure chance.
            </p>
            <p className="mt-3">
              By creating an account, entering any competition, using instant-win
              games (wheels or scratch cards), or otherwise using the Website, you
              agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">1. Definitions</h2>
            <div className="space-y-2 ml-4">
              <p>In these Terms:</p>
              <p>• "Promoter" means Ringtone Riches.</p>
              <p>• "Website" means www.ringtoneriches.co.uk.</p>
              <p>• "Competition" means any prize competition, draw, or promotion operated
              by Ringtone Riches (including those with instant-win features).</p>
              <p>• "Entrant" / "Player" means any person who enters a Competition.</p>
              <p>• "Ticket" / "Entry" means a valid paid or free entry into a Competition.</p>
              <p>• "Ringtone Points" means site credit used to enter eligible
              Competitions or instant-win games.</p>
              <p>• "Instant-Win Features" means any instant-win wheel, spin, scratch card
              or similar mechanic offered on the Website.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">2. Competition Type & Legal Status</h2>
            <div className="space-y-4">
              <p>2.1 Ringtone Riches operates as a skill-based prize competition provider
              in accordance with Section 14 of the Gambling Act 2005.</p>
              <p>2.2 Every Competition contains a skill / knowledge / judgement question
              ("Competition Question"). Only Entrants who answer correctly (or who
              enter via the free route, where the answer is correct) are eligible to
              win.</p>
              <p>2.3 A free entry route is available for every Competition (see Section 6).</p>
              <p>2.4 Competitions are open to UK and Republic of Ireland residents aged 18 or over only.</p>
              <p>2.5 Competitions are intended for entertainment purposes. Participation
              must not be treated as a financial investment, alternative to
              employment, or a way to resolve financial difficulty.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">3. Eligibility</h2>
            <div className="space-y-4">
              <p>3.1 Competitions are open to:</p>
              <div className="ml-4 space-y-1">
                <p>• Residents of the United Kingdom and Republic of Ireland;</p>
                <p>• Aged 18 years or over;</p>
                <p>• With full legal capacity to enter into a binding contract.</p>
              </div>
              <p>3.2 Competitions are not open to:</p>
              <div className="ml-4 space-y-1">
                <p>• Anyone under 18;</p>
                <p>• Employees, agents, or suppliers of the Promoter, or anyone
                professionally connected with the Competition;</p>
                <p>• Immediate family members or household members of the above.</p>
              </div>
              <p>3.3 By entering any Competition, you confirm that:</p>
              <div className="ml-4 space-y-1">
                <p>• You meet the eligibility criteria;</p>
                <p>• The information you provide is true, accurate and complete.</p>
              </div>
              <p>3.4 The Promoter may require proof of age, identity and eligibility.
              Failure to provide required proof within a reasonable time may result in
              disqualification without refund.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">4. Accounts & Security</h2>
            <div className="space-y-4">
              <p>4.1 Entrants must create an account on the Website using accurate and
              up-to-date details (name, address, email, phone number, date of birth).</p>
              <p>4.2 You are responsible for:</p>
              <div className="ml-4 space-y-1">
                <p>• Keeping your login details and password secure;</p>
                <p>• Ensuring nobody else uses your account;</p>
                <p>• Not sharing your account for joint play or syndicates.</p>
              </div>
              <p>4.3 Ringtone Riches is not responsible for any loss or misuse arising
              from failure to keep your account secure.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">5. Competition Entry (Paid Route)</h2>
            <div className="space-y-4">
              <p>5.1 To enter via the paid route, an Entrant must:</p>
              <div className="ml-4 space-y-1">
                <p>• View the Competition Question on the Website;</p>
                <p>• Select their answer and choose the desired number of entries;</p>
                <p>• Complete the online checkout and submit the entry form;</p>
                <p>• Pay the advertised entry fee in GBP (UK) or EUR (ROI) via our secure
                payment gateway or wallet system.</p>
              </div>
              <p>5.2 Each valid entry is assigned one or more unique ticket numbers into
              the relevant draw.</p>
              <p>5.3 Payment for entry does not guarantee that you will win a prize.</p>
              <p>5.4 Entries are final. No refunds are given except where:</p>
              <div className="ml-4 space-y-1">
                <p>• A Competition is cancelled by the Promoter; or</p>
                <p>• An entry is received after the Competition has closed and cannot be
                included.</p>
              </div>
              <p>5.5 The Promoter's decision on the eligibility of entries, correctness
              of answers, and interpretation of these Terms is final.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">6. Free Postal Entry Route</h2>
            <div className="space-y-4">
              <p>6.1 Under the Gambling Act 2005, the availability of a free entry route
              ensures the Competition does not fall within the definition of a lottery.</p>
              <p>6.2 To enter any Competition for free, you must send a stamped 1st Class
              or 2nd Class letter by standard post (not recorded/special delivery) to:</p>
              <div className="ml-4 p-4 bg-gray-800 rounded">
                <p>Ringtone Riches</p>
                <p>1 West Havelock Street</p>
                <p>South Shields</p>
                <p>Tyne & Wear</p>
                <p>NE33 5AF</p>
              </div>
              <p>6.3 Your postal entry must clearly state:</p>
              <div className="ml-4 space-y-1">
                <p>• The Competition you wish to enter (as described on the Website);</p>
                <p>• Your answer to the Competition Question (if applicable);</p>
                <p>• Your full name;</p>
                <p>• Your full postal address;</p>
                <p>• Your date of birth;</p>
                <p>• Your contact telephone number;</p>
                <p>• Your email address registered on your Website account.</p>
              </div>
              <p>6.4 Additional free-entry rules:</p>
              <div className="ml-4 space-y-1">
                <p>• Each free entry must be submitted in its own envelope (one Competition
                entry per envelope).</p>
                <p>• Hand-delivered entries are not accepted.</p>
                <p>• Bulk entries, unstamped post, or entries without all required
                information will be void.</p>
                <p>• The details on your postal entry must match an existing online account
                on the Website for the entry to be processed.</p>
                <p>• Postal entries must be received before the Competition closes. Late
                entries will not be entered.</p>
                <p>• Free entries are treated in the same way as paid entries for the
                purposes of the draw and, where applicable, for associated instant-win
                eligibility.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">7. Competition Duration & Closure</h2>
            <div className="space-y-4">
              <p>7.1 Each Competition has an Opening Date and Closing Date as shown on
              the Website. All dates and times are in UK time.</p>
              <p>7.2 A Competition will normally close when either:</p>
              <div className="ml-4 space-y-1">
                <p>• The maximum number of entries has been sold/received; or</p>
                <p>• The Closing Date is reached, whichever occurs first, unless otherwise
                stated on the Competition page.</p>
              </div>
              <p>7.3 The Promoter will not normally extend or shorten a Competition
              simply due to low ticket sales. In exceptional circumstances (for
              example, technical failures, legal or regulatory reasons, force majeure
              events), we may:</p>
              <div className="ml-4 space-y-1">
                <p>• Change the Closing Date; and/or</p>
                <p>• Cancel the Competition and issue refunds to paid entrants.</p>
              </div>
              <p>Any such change will be communicated on the Website and/or social media.</p>
              <p>7.4 If a winner cannot be contacted or fails to claim their prize within
              7 days of being notified, the Promoter reserves the right to select an
              alternative winner from eligible entries.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">8. Selecting Winners – Main Draws</h2>
            <div className="space-y-4">
              <p>8.1 The winning Entrant for each main Competition will be selected at
              random using a random number generator (RNG) or equivalent verifiable
              system. Each valid entry is associated with a unique ticket number.</p>
              <p>8.2 The draw will normally be conducted live on the Ringtone Riches
              Facebook page or another publicly verifiable platform.</p>
              <p>8.3 The draw date, time, and platform will be announced on Facebook
              and/or the Website once the Competition has closed.</p>
              <p>8.4 Unless otherwise stated, there will be one winner per Competition.</p>
              <p>8.5 To comply with UK advertising and competition standards, Ringtone
              Riches may publish or make available the winner's first name and general
              location (e.g. town or city) to confirm that a valid prize award took
              place. If you object to this, you must notify us before the Competition
              closes. Even if you object, we may still be required to provide limited
              winner details to regulatory or advertising bodies upon request.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">9. Prizes</h2>
            <div className="space-y-4">
              <p>9.1 The prize for each Competition is as described on the relevant
              Competition page on the Website ("Prize").</p>
              <p>9.2 Prizes remain the property of the Promoter until successfully handed
              over or transferred to the winner.</p>
              <p>9.3 Unless expressly stated otherwise:</p>
              <div className="ml-4 space-y-1">
                <p>• Prizes are non-transferable, and</p>
                <p>• Do not have a cash alternative.</p>
              </div>
              <p>9.4 The Promoter does not provide any warranty or guarantee as to the
              Prize's future value, performance, or suitability. Entrants should rely
              on their own judgment.</p>
              <p>9.5 Winners are responsible for collecting prizes from the Promoter's
              address, unless otherwise agreed or specified on the Competition page.</p>
              <p>9.6 Winners must provide proof of identity, age and (where applicable)
              account ownership before a Prize is released. Prizes cannot be collected
              on behalf of another person.</p>
              <p>9.7 Where a Prize is supplied by a third-party supplier, the third
              party's terms may also apply.</p>
              <p>9.8 Holiday prizes guarantee a minimum 3-star standard of accommodation
              unless otherwise stated. Travel, insurance, and additional costs may not
              be included unless explicitly specified.</p>
              <p>9.9 Winners are solely responsible for any tax, duty or other charges
              arising from receipt of a Prize.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">10. Instant-Win Wheels & Scratch Cards</h2>
            <div className="space-y-4">
              <p>10.1 Any instant-win wheel, spin, or scratch card game on the Website
              (the "Instant-Win Features") forms part of the overall prize
              competition. They do not operate as standalone games of chance or
              licensed gambling products.</p>
              <p>10.2 Each spin or scratch:</p>
              <div className="ml-4 space-y-1">
                <p>• Is treated as a valid entry into the relevant Competition; and</p>
                <p>• May result in:</p>
                <div className="ml-4">
                  <p>• an instant cash prize;</p>
                  <p>• an award of Ringtone Points (site credit);</p>
                  <p>• a no win / lose result; or</p>
                  <p>• entry into, or ticket(s) for, another Competition (where stated).</p>
                </div>
              </div>
              <p>10.3 One definitive outcome only is generated for each spin or scratch.
              That outcome is determined and recorded by our secure server-side system
              at the point of play. The visual animation or display is a
              representation of that outcome and does not replace or override the
              recorded result.</p>
              <p>10.4 In the event of any technical issue, interruption, display error,
              system malfunction, or other irregularity, the Promoter reserves the
              absolute right, at its sole discretion, to:</p>
              <div className="ml-4 space-y-1">
                <p>• Review any affected result;</p>
                <p>• Void, amend, or re-issue entries or prizes; and/or</p>
                <p>• Take any other action considered necessary to maintain fairness and
                legal compliance.</p>
              </div>
              <p>10.5 The Promoter's decision in all matters relating to instant-win
              features, prize allocations, technical determinations and interpretation
              of these Terms is final and binding.</p>
              <p>10.6 Ringtone Points</p>
              <div className="ml-4 space-y-1">
                <p>• Ringtone Points have a notional value of £0.01 each.</p>
                <p>• They may be used only to enter eligible Competitions or instant-win
                games on the Website.</p>
                <p>• Ringtone Points cannot be withdrawn, exchanged for cash, or
                transferred to other users.</p>
              </div>
              <p>10.7 Bonus / Goodwill / Promotional Ringtone Points</p>
              <div className="ml-4 space-y-1">
                <p>• Any joining bonus, goodwill credit, promotional credit, or free spins
                credited as Ringtone Points carry no cash value and are strictly
                non-withdrawable.</p>
                <p>• Only winnings generated from gameplay using deposited funds may form
                part of a withdrawable cash balance.</p>
              </div>
              <p>10.8 Where instant-win functionality is attached to a Competition with
              both paid and free entry routes, paid and free entries are treated
              equivalently by the system and have the same chance of producing any
              given outcome where eligible.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">11. Player Protections & Account Controls</h2>
            <div className="space-y-4">
              <p>11.1 Age Restriction</p>
              <p className="ml-4">Ringtone Riches is strictly 18+. We may carry out age and identity
              checks. Accounts may be suspended or closed where we cannot verify age
              or identity.</p>
              
              <p>11.2 Spend Limits</p>
              <div className="ml-4 space-y-1">
                <p>• We may set default maximum monthly spend limits across all
                Competitions from time to time.</p>
                <p>• Where available, customers may request a personal spend limit
                (including a limit of £0) by contacting support.</p>
                <p>• Once a limit is reached, we may prevent further paid entries until the
                limit resets.</p>
              </div>
              
              <p>11.3 Payment Methods</p>
              <div className="ml-4 space-y-1">
                <p>• We do not accept cash payments in person.</p>
                <p>• We may, at our discretion, place limits or restrictions on the use of
                particular payment methods (including credit cards) for some or all
                products where we consider it appropriate or are required to do so by
                law or guidance. Any such restrictions will be explained on the Website
                and/or at checkout.</p>
              </div>
              
              <p>11.4 Account Suspension & Self-Exclusion</p>
              <div className="ml-4 space-y-1">
                <p>• You may request a temporary suspension (self-exclusion) or permanent
                closure of your account at any time by contacting
                support@ringtoneriches.co.uk.</p>
                <p>• During a suspension period, you will not be able to enter Competitions
                or use Instant-Win Features and we will not send promotional marketing
                to that account.</p>
                <p>• Requests will be actioned as soon as reasonably possible.</p>
              </div>
              
              <p>11.5 Monitoring for Harm</p>
              <div className="ml-4 space-y-1">
                <p>• We may monitor customer activity for indicators of potential harm,
                such as unusually high or rapid spend, repeated attempts to exceed
                limits, or self-reported distress.</p>
                <p>• Where we reasonably believe a customer may be at risk, we may take
                proportionate steps such as:</p>
                <div className="ml-4">
                  <p>• sending safer-play messages;</p>
                  <p>• encouraging the use of limits or breaks;</p>
                  <p>• temporarily restricting activity; or</p>
                  <p>• suspending or closing the account in serious cases.</p>
                </div>
              </div>
              
              <p>11.6 Support & Signposting</p>
              <p className="ml-4">If you feel your play is becoming problematic or is causing financial
              stress, you should seek help from independent organisations such as:</p>
              <div className="ml-8 space-y-1">
                <p>• Citizens Advice</p>
                <p>• National Debtline / Money Advice Trust</p>
                <p>• StepChange Debt Charity</p>
                <p>• Mind</p>
                <p>• Samaritans</p>
              </div>
              <p className="ml-4">You may also request a temporary or permanent account suspension at any
              time.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">12. Anti-Money Laundering (AML)</h2>
            <div className="space-y-4">
              <p>12.1 Ringtone Riches operates a strict Anti-Money Laundering policy.</p>
              <p>12.2 We may:</p>
              <div className="ml-4 space-y-1">
                <p>• Request identity documents and proof of address;</p>
                <p>• Request proof of payment methods and banking details;</p>
                <p>• Delay or withhold prize payments where we are unable to complete
                checks.</p>
              </div>
              <p>12.3 No cash payments are accepted in person. All winnings are paid via:</p>
              <div className="ml-4 space-y-1">
                <p>• The original payment method, where possible; or</p>
                <p>• Verified bank transfer to an account held in the winner's name.</p>
              </div>
              <p>12.4 We may report suspicious activity to relevant authorities where
              required by law.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">13. Data Protection & Publicity</h2>
            <div className="space-y-4">
              <p>13.1 Personal data is collected and processed in accordance with
              applicable data protection law and our Privacy Policy.</p>
              <p>13.2 By entering a Competition, you consent to your personal information
              being used to:</p>
              <div className="ml-4 space-y-1">
                <p>• Administer Competitions;</p>
                <p>• Process entries and payments;</p>
                <p>• Conduct draws and allocate prizes;</p>
                <p>• Fulfil legal and regulatory obligations (including AML).</p>
              </div>
              <p>13.3 If you are a winner, you agree that we may use:</p>
              <div className="ml-4 space-y-1">
                <p>• Your first name;</p>
                <p>• Your town or city of residence;</p>
                <p>• Photographs, video content or testimonials you provide (with your
                consent),</p>
              </div>
              <p>for the purpose of publicly announcing winners and promoting Ringtone
              Riches on the Website, social media, or other marketing channels.</p>
              <p>13.4 You can object to some or all publicity uses by contacting
              support@ringtoneriches.co.uk before the Competition closes. However, we
              may still need to share limited winner details with regulatory or
              advertising bodies if requested.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">14. Text Message Marketing</h2>
            <div className="space-y-4">
              <p>14.1 By ticking the SMS marketing box at checkout, you consent to
              receive marketing text messages (for example, promotions, entry
              reminders and updates) from Ringtone Riches at the phone number you
              provide.</p>
              <p>14.2 Consent to SMS marketing is not a condition of purchase or entry.</p>
              <p>14.3 Standard message and data rates may apply. Message frequency may
              vary.</p>
              <p>14.4 You may unsubscribe at any time by replying STOP to any message or
              using any unsubscribe link provided.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">15. Bonus Credit & Promotions</h2>
            <div className="space-y-4">
              <p>15.1 Any joining bonus, free credit, goodwill credit, or other
              promotional credit added to an account is non-withdrawable.</p>
              <p>15.2 Bonus credit must be used for gameplay only (Competitions and/or
              Instant-Win Features as specified).</p>
              <p>15.3 Only real-money winnings generated from gameplay using deposited
              funds may form part of a withdrawable cash balance.</p>
              <p>15.4 If a withdrawal request relates to non-withdrawable bonus credit,
              it will be rejected.</p>
              <p>15.5 The Promoter may amend, withdraw or cancel any bonus or promotional
              offer at its discretion, in line with applicable advertising rules.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">16. Liability</h2>
            <div className="space-y-4">
              <p>16.1 Insofar as permitted by law, the Promoter, its agents or
              distributors will not be liable for:</p>
              <div className="ml-4 space-y-1">
                <p>• Any loss, damage, personal injury or death arising from taking up a
                Prize;</p>
                <p>• Any indirect, consequential or special losses arising from
                participation in Competitions,</p>
              </div>
              <p>except where caused by our negligence or fraud.</p>
              <p>16.2 The Promoter is not responsible for:</p>
              <div className="ml-4 space-y-1">
                <p>• Technical failures, system outages, or connectivity problems;</p>
                <p>• Late, lost, incomplete or corrupted entries;</p>
                <p>• Postal delays or failures;</p>
                <p>• Use or misuse of the Website by third parties.</p>
              </div>
              <p>Your statutory rights are not affected.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">17. Fraud, Abuse & Misuse</h2>
            <div className="space-y-4">
              <p>17.1 Entries will be void, or the Promoter may seek recovery of any
              Prize (without refund) if the Entrant or Winner is found to have
              engaged in:</p>
              <div className="ml-4 space-y-1">
                <p>• Any form of fraud or attempted fraud;</p>
                <p>• Fraudulent misrepresentation or concealment;</p>
                <p>• Hacking or interference with the Website;</p>
                <p>• Use of bots, scripts or automated systems;</p>
                <p>• Creating multiple accounts to evade entry or spend limits;</p>
                <p>• Any activity intended to manipulate the outcome or fairness of a
                Competition.</p>
              </div>
              <p>17.2 The Promoter reserves the right to suspend, void, or refuse entries
              without refund where it reasonably suspects any of the above conduct.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">18. Changes to These Terms</h2>
            <div className="space-y-4">
              <p>18.1 The Promoter may amend these Terms from time to time. The latest
              version will always be available on the Website and will apply to all
              future entries from the date of publication.</p>
              <p>18.2 Continued use of the Website or entry into Competitions after any
              changes are made constitutes acceptance of the revised Terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl text-white font-semibold mb-3">19. Governing Law</h2>
            <div className="space-y-4">
              <p>19.1 These Terms and all Competitions are governed by the laws of
              England and Wales.</p>
              <p>19.2 The courts of England and Wales shall have exclusive jurisdiction
              over any dispute arising from or in connection with these Terms or any
              Competition.</p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-sm italic">
              Last updated: December 2025
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}