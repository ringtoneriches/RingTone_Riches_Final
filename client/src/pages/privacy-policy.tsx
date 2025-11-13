import React from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 gradient-text">
          Privacy Policy (Including UK-GDPR)
        </h1>

        <div className="space-y-6 leading-relaxed text-muted-foreground">
          <p>
            We protect your data. This Privacy Policy sets out how Ringtone
            Riches (“we”, “us”, or “our”), registered at 1 West Havelock Street, South Shields, Tyne and Wear, NE33 5AF, collects,
            processes, stores, and discloses your personal information.
          </p>

          <p>
            We are committed to handling your information in compliance with the
            EU General Data Protection Regulation (GDPR), the UK Data Protection
            Act 2018, and other relevant data protection laws. Before using our
            website, please read this policy to understand how and why we
            process your data.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-10">
            This Document Explains
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>What personal data we may collect about you</li>
            <li>How we collect, store, and protect your data</li>
            <li>The purposes for which your data is processed</li>
            <li>Your legal rights under data protection laws</li>
          </ul>

          <p>
            If you have any questions or concerns about this policy, please
            contact us at{" "}
            <a
              href="mailto:support@ringtoneriches.co.uk"
              className="text-primary underline"
            >
              support@ringtoneriches.co.uk
            </a>
            .
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-10">
            The Personal Data We Process
          </h2>
          <p>
            We collect personal data when you interact with our website, enter
            competitions, subscribe to updates, or contact us. This may include:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Your full name, address, country, and contact details</li>
            <li>Information submitted when entering prize draws or surveys</li>
            <li>
              Technical information obtained via cookies when using the website
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-10">
            The Purposes for Which We Process Your Data
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Confirming entries and sending competition updates</li>
            <li>Processing entry payments and notifying winners</li>
            <li>Personalising your experience and providing support</li>
            <li>Sending promotional materials (if you have opted in)</li>
            <li>Administering events and services you subscribe to</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-10">
            Lawful Basis for Processing
          </h2>
          <p>
            By accepting this Privacy Policy, you give us your express consent
            to process your personal data as outlined. You may withdraw your
            consent at any time by contacting us at{" "}
            <a
              href="mailto:support@ringtoneriches.co.uk"
              className="text-primary underline"
            >
              support@ringtoneriches.co.uk
            </a>
            . Withdrawal will not affect the lawfulness of prior processing.
          </p>

          <p>
            We protect your data. This Privacy Policy sets out how Ringtone
            Riches (“we”, “us”, or “our”), registered at Unit 13, Pennywell
            Business Centre, Portsmouth Rd, Sunderland SR4 9AR, collects,
            processes, stores, and discloses your personal information.
          </p>

          <p>
            We are committed to handling your information in compliance with the
            EU General Data Protection Regulation (GDPR), the UK Data Protection
            Act 2018, and other relevant data protection laws. Before using our
            website, please read this policy to understand how and why we
            process your data.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-10">
            This Document Explains
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>What personal data we may collect about you</li>
            <li>How we collect, store, and protect your data</li>
            <li>The purposes for which your data is processed</li>
            <li>Your legal rights under data protection laws</li>
          </ul>

          <p>
            If you have any questions or concerns about this policy, please
            contact us at{" "}
            <a
              href="mailto:support@ringtoneriches.co.uk"
              className="text-primary underline"
            >
              support@ringtoneriches.co.uk
            </a>
            .
          </p>

          {/* --- Personal Data Section --- */}
          <h2 className="text-2xl font-semibold text-foreground mt-10">
            The Personal Data We Process
          </h2>
          <p>
            We collect personal data when you interact with our website, enter
            competitions, subscribe to updates, or contact us. This may include:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Your full name, address, country, and contact details</li>
            <li>Information submitted when entering prize draws or surveys</li>
            <li>
              Technical information obtained via cookies when using the website
            </li>
          </ul>

          {/* --- Purpose Section --- */}
          <h2 className="text-2xl font-semibold text-foreground mt-10">
            The Purposes for Which We Process Your Data
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Confirming entries and sending competition updates</li>
            <li>Processing entry payments and notifying winners</li>
            <li>Personalising your experience and providing support</li>
            <li>Sending promotional materials (if you have opted in)</li>
            <li>Administering events and services you subscribe to</li>
          </ul>

          {/* --- Lawful Basis Section --- */}
          <h2 className="text-2xl font-semibold text-foreground mt-10">
            Lawful Basis for Processing
          </h2>
          <p>
            By accepting this Privacy Policy, you give us your express consent
            to process your personal data as outlined. You may withdraw your
            consent at any time by contacting us at{" "}
            <a
              href="mailto:support@ringtoneriches.co.uk"
              className="text-primary underline"
            >
              support@ringtoneriches.co.uk
            </a>
            . Withdrawal will not affect the lawfulness of prior processing.
          </p>

          {/* --- New Section: Other Lawful Grounds --- */}
          <h2 className="text-2xl font-semibold text-foreground mt-10">
            Other Lawful Grounds
          </h2>
          <p>We may also process your data when it is necessary to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Perform an agreement between us (e.g. fulfilling a prize for a
              winner)
            </li>
            <li>Comply with applicable laws or regulations</li>
            <li>
              Pursue our legitimate business interests or those of third
              parties, such as administrative operations and service
              improvements
            </li>
          </ul>

          <h3 className="text-xl text-white font-semibold mt-6">
            If You Refuse to Provide Personal Data
          </h3>
          <p>
            Where we must collect personal data by law or under the terms of an
            agreement with you, and you fail to provide that data when
            requested, we may be unable to perform our obligations (for example,
            to deliver your prize). In such cases, we may have to cancel the
            prize and select another winner, though we will notify you first.
          </p>
          <p>
            We may also lawfully obtain personal data from third parties or
            public sources where it is essential to fulfil the prize or
            competition service we provide.
          </p>

          {/* --- New Section: Sharing Information --- */}
          <h2 className="text-2xl font-semibold text-foreground mt-10">
            Sharing Information with Affiliates and Third Parties
          </h2>
          <p>
            We do not share your personal data with third parties except as
            described in this policy, or where you have otherwise agreed. We may
            share data with our group companies or trusted partners
            (“Affiliates”) to provide services and perform legitimate business
            operations.
          </p>

          <p>
            From time to time, we may also share data with carefully selected
            third-party service providers who help us operate our business,
            including:
          </p>

          <ul className="list-disc list-inside space-y-2">
            <li>Email and communication service providers</li>
            <li>Web analytics tools such as Google Analytics</li>
            <li>Marketing and advertising agencies</li>
            <li>Website and data hosting providers</li>
            <li>Logistics and delivery companies</li>
            <li>Address verification and payment processors</li>
            <li>Integration and technical platform providers</li>
            <li>
              Social media platforms or third-party competition administrators
              (when relevant)
            </li>
          </ul>

          <p>
            We ensure all third parties processing your data follow strict data
            protection procedures in compliance with applicable law. Unless
            otherwise stated, we remain the data controller for your information
            even where third parties act as processors.
          </p>

          <p>
            We may also share your data if required by law, regulation, or legal
            proceedings (including investigations of fraud or other unlawful
            activity), or where necessary to protect the rights, property, or
            safety of our users or others.
          </p>

          {/* === Your Rights as a Data Subject === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Your Rights as a Data Subject
          </h2>
          <p className="mb-4">
            Subject to any conditions or requirements set out in the relevant
            Data Protection Legislation, you may have some or all of the
            following rights concerning the personal data we hold about you:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-6">
            <li>The right to request a copy of your data held by us.</li>
            <li>
              The right to correct any inaccurate or incomplete personal data
              held by us. You can update and amend your data by emailing us at{" "}
              <a
                href="mailto:support@ringtoneriches.co.uk"
                className="text-blue-500 underline"
              >
                support@ringtoneriches.co.uk
              </a>
              .
            </li>
            <li>
              The right to request that we erase the personal data we hold about
              you.
            </li>
            <li>
              The right to request that we restrict the processing of your data.
            </li>
            <li>
              The right to object to certain types of processing of your data by
              us.
            </li>
            <li>The right to complain.</li>
          </ul>

          {/* === Storage and Retention of Your Data === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Storage and Retention of Your Data
          </h2>
          <p className="mb-4">
            We will store your data for as long as necessary to provide our
            services and up to twelve months after the promotional period of the
            relevant competition or contest. If you request account deletion, we
            will erase your data once it is no longer required to fulfil
            obligations or comply with legal requirements.
          </p>
          <p className="mb-4">
            As a minimum, we will store your data for as long as is reasonably
            necessary to provide you with the prize and, as a maximum, for
            twelve months from the end of the promotional period of the relevant
            prize draw, competition, or contest in which you are a winner.
          </p>
          <p className="mb-4">
            If you tell us that you would like to delete your account, we will
            take steps to delete all the personal data we hold about you once it
            is no longer necessary for us to hold it (e.g. to fulfil any prize,
            resolve disputes, or as is permitted by applicable law or
            regulation).
          </p>
          <p className="mb-4">
            For as long as we do store your data, we will follow generally
            accepted industry standards and maintain reasonable safeguards to
            attempt to ensure the security, integrity, and privacy of the
            information you have provided. We have security measures in place
            designed to protect against the loss, misuse, and alteration of the
            information under our control. Personal data collected by us is
            stored in secure operating environments that are not available to
            the public. Despite our efforts to keep your data secure, no system
            can be 100% reliable. We cannot be held liable for any loss you may
            suffer if a third party procures unauthorised access to any data you
            provide through the Channels. We will notify you as soon as possible
            if we have reason to believe that there has been a personal data
            breach by us (or your data held by us).
          </p>

          {/* === Links to Third-Parties === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Links to Third-Parties
          </h2>
          <p className="mb-4">
            Our website may link or redirect to other websites that are beyond
            our control. Such links or redirections are not endorsements of such
            websites or representation of our affiliation with them in any way
            and such third-party websites are outside the scope of this Privacy
            Policy
          </p>
          <p>
            If you access such third-party websites, please ensure that you are
            satisfied with their respective privacy policies before you provide
            them with any personal data. We cannot be held responsible for the
            activities, privacy policies, or levels of privacy compliance of any
            website operated by any third party.
          </p>

          {/* === Cookies === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">Cookies</h2>
          <p className="mb-4">
            A cookie is a small file of letters and numbers stored on your
            browser or the hard drive of your computer. Cookies contain
            information that is transferred to your computer’s hard drive.
          </p>
          <p className="mb-4">
            Our website uses cookies to distinguish you from other users of our
            website. This helps us to provide you with a better experience when
            you browse and allows us to improve our website.
          </p>
          <p className="mb-4">
            Some data collected by cookies is collected on an anonymous and/or
            aggregated basis. Where we use cookies that contain personal data,
            we will only process that personal data as set out in this policy.
          </p>
          <p className="mb-4">
            Your browser may give you the ability to block all or some cookies
            by activating a setting in your browser’s options. However, if you
            use your browser settings to block all cookies (including essential
            cookies) you may not be able to access all or parts of our website.
            Except for essential cookies, all cookies will remain unless the
            cookie cache is cleared (unless otherwise indicated in the table
            above).
          </p>
          <p className="mb-4">
            To find out more about cookies including how to see what cookies
            have been set and how to manage and delete them, visit{" "}
            <a
              href="https://www.allaboutcookies.org/manage-cookies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              www.allaboutcookies.org/manage-cookies
            </a>
            .
          </p>
          <p className="mb-4">
            Ringtone Riches may change this policy from time to time by updating
            this page. You should check this page from time to time to ensure
            that you are happy with any changes.
          </p>

          {/* === Ringtone Riches (GDPR) Statement === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Ringtone Riches (GDPR) Statement
          </h2>
          <p className="mb-4">
            In conjunction with GDPR compliance, Ringtone Riches have reviewed
            all activities across the business and how data is processed. The
            companies activities fall within three key areas:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-6">
            <li>A data controller of its own employee data.</li>
            <li>
              A data controller or processor of third-party data such as
              activity relating to direct marketing.
            </li>
            <li>A data processor or controller of customer personal data.</li>
          </ul>
          <p className="mb-4">
            Ringtone Riches is registered as a Data Controller with the ICO (
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              ico.org.uk
            </a>
            ), registration reference: <strong>245603</strong>.
          </p>

          <h3 className="text-xl text-white font-semibold mt-6 mb-2">Activity</h3>
          <ul className="list-disc list-inside space-y-1 mb-6">
            <li>
              Following the review of GDPR, Ringtone Riches has designed it’s
              company policies and procedures to ensure compliance with
              regulations.
            </li>
            <li>
              Ringtone Riches has reviewed its policy and you can see in this
              section Ringtone Riches activity in respect of GDPR.
            </li>
          </ul>

          <h3 className="text-xl text-white font-semibold mt-6 mb-2">What We Need</h3>
          <p className="mb-4">
            Ringtone Riches only collect personal data which may include
            information about you personally for the purposes of verifying
            eligibility to use our services, and to enable us to deliver Prizes
            to Winners of our Competitions. This includes name, age, address,
            phone number, email address etc.
          </p>

          <h3 className="text-xl text-white font-semibold mt-6 mb-2">Why We Need It</h3>
          <p className="mb-4">
            We need to know your basic personal data in order to check your
            eligibility to use our services and also to ensure that we can
            deliver any Prizes to you that you Win in any of our Competitions.
            We will not collect any personal data from you that we do not need
            in order to provide our services to you.
          </p>

          <section className="space-y-6">
            <h2 className="text-2xl text-white font-bold">What We Do With It</h2>
            <p>
              All data is processed in the UK and all servers we use online are
              based in the UK also, for the purposes of hosting and maintenance,
              this information is located on our servers and no other parties
              have access to your personal data unless the law allows them to do
              so. From time to time we may need to share your data with other
              third-party service providers such as:
            </p>

            <ul className="list-disc list-inside space-y-1">
              <li>Email service providers such as Mailchimp and WordPress;</li>
              <li>Website/Online analytics such as Google Analytics;</li>
              <li>Delivery and/or logistics companies;</li>
              <li>
                Social Media websites such as Facebook and Instagram in order to
                share content.
              </li>
            </ul>

            <p>
              We reasonably endeavour to ensure any third parties that we use
              have their own compliant policies and procedures in place for
              dealing with personal data.
            </p>

            <h3 className="text-xl text-white font-semibold mt-6">
              Frequently Asked Questions
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">
                  What personal data do you process?
                </h4>
                <p>
                  Any data which relates to an identifiable person (Customer).
                  Name, age, address, phone number, email, etc.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">
                  For what purpose do you process this personal data?
                </h4>
                <p>
                  Data is collected for specific, legitimate and explicit
                  purposes of providing skill, judgement or knowledge-based
                  competition services in order to allow our customers to enter
                  competitions on our website whilst ensuring their eligibility
                  to do so.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">
                  What are the risks to data subjects’ rights and freedoms if
                  the personal data is destroyed, lost, altered, disclosed
                  without authority, or accessed without authority?
                </h4>
                <p>
                  Following the review of our policies/procedures and also a
                  full review of GDPR guidelines, we believe the risks are
                  minimal as the information we obtain is contained solely in
                  our database. It is not shared with any outside third parties,
                  except for email service providers, website analytic services,
                  delivery/logistics services, competition draw services and
                  social media website, all of which have their own complaint
                  policies and procedures for processing personal data. In the
                  event data is lost, altered or disclosed without authority etc
                  the customer could report us to ICO which could mean fines of
                  up 4% of our turnover. There could also be potential
                  compensation claims that can be made by the data subject.
                  Non-financial risks include reputational damage as the ICO
                  will name non-compliant organisations which would effect our
                  reputation in the industry with our customers. The risks are
                  high in relation to penalties, but this is the same for all UK
                  companies and we believe the risks are low. The worst case
                  scenario is that the ICO could stop us processing personal
                  data
                </p>
              </div>

              <div>
                <h4 className="font-semibold">
                  What provisions do you have in place to either delete or
                  return the personal data once the service comes to an end?
                </h4>
                <p>
                  When a data subject requests this, we will contact the data
                  subject, discuss the deletion or return of records, and then
                  remove accordingly. Otherwise, it is our intention to keep the
                  customer’s details on our system for 12 months from the last
                  time they either replied to an email, accessed our
                  website/app, or commented on our social media, as this
                  coincides with our “legitimate business interests”.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">
                  Do you understand the GDPR requirements in detail and are you
                  satisfied that you are aware of the impact these will have on
                  your business?
                </h4>
                <p>
                  Yes, we are happy that we have a good understanding of GDPR
                  requirements and the impact they have on our customers and
                  business.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Access to Your Information</h4>
                <p>
                  You may request details of personal information which we hold
                  about you under the Data Protection Act 1998. A small fee of
                  £10 will be payable. If you would like a copy of the
                  information held on you please contact us by emailing from
                  your contact email at{" "}
                  <a
                    href="mailto:support@ringtoneriches.co.uk"
                    className="text-blue-600 underline"
                  >
                    support@ringtoneriches.co.uk
                  </a>
                  .
                </p>
                <p>
                  If you believe that any information we are holding on you is
                  incorrect or incomplete, please contact us. We will promptly
                  correct any information found to be incorrect.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
