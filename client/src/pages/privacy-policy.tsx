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
            We protect your data. This Privacy Policy sets out how Ringtone Riches (“we”, “us”, or “our”), registered at 1 West Havelock Street, South Shields, Tyne and Wear, NE33 5AF, collects, processes, stores, and discloses your personal information. 
          </p>

          <p>
            We are committed to handling your information in compliance with the
            EU General Data Protection Regulation (GDPR), the UK Data Protection
            Act 2018, and other relevant data protection laws. Before using our
            website, please read this policy to understand how and why we
            process your data.
          </p>
          <p>
            Last Updated: October 2025
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
           We collect personal data when you interact with our website, enter competitions, subscribe to updates, or contact us. This may include your full name, address, country, contact details, competition entries, and technical information obtained via cookies.

          </p>
         

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
            We process your personal data under the following lawful bases:
          </p>
           <ul className="list-disc list-inside space-y-2">
            <li>Consent – when you opt in to receive marketing or create an account.</li>
            <li>Contract – when processing is necessary to fulfil a competition entry or deliver a prize.</li>
            <li>Legal obligation – when required by law or regulation.</li>
            <li>Legitimate interests – to operate and improve our services, prevent fraud, and ensure fair participation.</li>
          </ul>


         

         

          <h3 className="text-xl text-white font-semibold mt-6">
            If You Refuse to Provide Personal Data
          </h3>
          <p>
           Where we must collect personal data by law or under the terms of an agreement with you, and you fail to provide that data when requested, we may be unable to perform our obligations (for example, to deliver your prize). In such cases, we may have to cancel the prize and select another winner, though we will notify you first.
          </p>
         
        
          {/* --- New Section: Sharing Information --- */}
          <h2 className="text-2xl font-semibold text-foreground mt-10">
            Sharing Information with Affiliates and Third Parties
          </h2>
          <p>
            We do not share your personal data with third parties except as described in this policy, or where you have otherwise agreed. We may share data with our trusted partners (“Affiliates”) to provide services and perform legitimate business operations. This includes providers for email delivery, payment processing, analytics, hosting, marketing, logistics, and technical integration.
          </p>

          <p>
           All third parties processing your data follow strict data protection procedures in compliance with applicable law. Unless otherwise stated, we remain the data controller for your information even where third parties act as processors.
          </p>


          {/* === Your Rights as a Data Subject === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Your Rights as a Data Subject
          </h2>
      
          <ul className="list-disc list-inside space-y-1 mb-6">
            <li>The right to request a copy of your data held by us (free of charge).</li>
            <li>
            The right to correct any inaccurate or incomplete personal data held by us.
            </li>
            <li>
             The right to request that we erase the personal data we hold about you.
            </li>
            <li>
             The right to request that we restrict the processing of your data.
            </li>
            <li>
              The right to object to certain types of processing of your data by us.
            </li>
            <li>The right to lodge a complaint with the Information Commissioner’s Office (ICO).</li>
          </ul>

          {/* Data security */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Data Security
          </h2>
          <p>
            We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. While no online system is completely secure, we maintain strong safeguards to ensure the confidentiality and integrity of your data.
          </p>

          {/* === Storage and Retention of Your Data === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Storage and Retention of Your Data
          </h2>
          <p className="mb-4">
           We store your data for as long as necessary to provide our services and up to twelve months after the promotional period of the relevant competition or contest. If you request account deletion, we will erase your data once it is no longer required to fulfil obligations or comply with legal requirements.
          </p>

          {/* === Links to Third-Parties === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Links to Third-Parties
          </h2>
          <p className="mb-4">
            Our website may contain links to third-party websites beyond our control. Please review their respective privacy policies before providing any personal data. We cannot be held responsible for the practices of third-party websites.
          </p>

          {/* === Cookies === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">Cookies</h2>
          <p className="mb-4">
           Our website uses cookies to distinguish you from other users, improving your experience and allowing us to enhance website performance. You can manage or block cookies via your browser settings, though blocking essential cookies may affect site functionality.
          </p>
         

          {/* === Ringtone Riches (GDPR) Statement === */}
          <h2 className="text-2xl text-white font-semibold mt-10 mb-3">
            Ringtone Riches (GDPR) Statement
          </h2>
          <p className="mb-4">
            Ringtone Riches is registered as a Data Controller with the Information Commissioner’s Office (ICO), registration reference: 245603. We have implemented internal policies and controls to ensure full compliance with GDPR and UK data protection regulations.

          </p>

          <h2 className="text-2xl text-white font-semi-bold mt-10 mb-3">
            GDPR Activity Overview
          </h2>
          <p>
            Ringtone Riches’ activities fall within three key areas:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-6">
            <li>A data controller of its own employee data.</li>
            <li>
              A data controller or processor of third-party data such as
              activity relating to direct marketing.
            </li>
            <li>A data processor or controller of customer personal data.</li>
          </ul>
          <p>
            We have designed our company policies and procedures to ensure full GDPR compliance, including reviews of all data handling and security protocols.
          </p>


          <h3 className="text-xl text-white font-semibold mt-6 mb-2">What We Need and Why</h3>
          <p className="mb-4">
           We collect personal data such as name, age, address, phone number, and email address to verify eligibility, process competition entries, and deliver prizes to winners. We will not collect any data that we do not need to provide our services.
          </p>

          <h3 className="text-xl text-white font-semibold mt-6 mb-2">What We Do With It</h3>
          <p className="mb-4">
            All data is processed within the UK, and all servers we use are based in the UK. We may share data with trusted third-party service providers such as email delivery, website analytics, logistics, and social media platforms, all of which maintain GDPR-compliant policies and procedures.
          </p>

          <section className="space-y-6">

            <h3 className="text-xl text-white font-semibold mt-6">
              Frequently Asked Questions
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">
                 What personal data do you process?
                </h4>
                <p>
                  We process any data relating to an identifiable person, such as name, age, address, phone number, and email.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">
                  For what purpose do you process this data?
                </h4>
                <p>
                 Data is collected for legitimate purposes, including running skill, judgment, or knowledge-based competitions and verifying eligibility.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">
                What are the risks to data subjects’ rights?
                </h4>
                <p>
                  We believe risks are minimal due to secure storage and limited data sharing. Potential risks include loss, alteration, or unauthorised access, which we mitigate through strict internal security controls.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">
                 What provisions do you have for deletion?
                </h4>
                <p>
                  When requested, we delete or return data after verifying the request. Otherwise, we retain data for 12 months from last contact for legitimate business purposes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">
                 Do you understand GDPR requirements?
                </h4>
                <p>
                 Yes. Ringtone Riches fully understands and complies with GDPR requirements and their impact on our customers and business operations.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-white text-xl">Access to Your Information</h2>
                <p>
                  You have the right to access the personal data we hold about you. Requests can be made free of charge by emailing support@ringtoneriches.co.uk. If any information we hold about you is incorrect, please contact us so we can promptly update or correct it.
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
