import React from "react";
import LegalDocument, { LegalSection, LegalList, LegalLink } from "./legal/LegalDocument";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_OPERATOR_NAME,
  LEGAL_SERVICE_NAME,
  LEGAL_WEBSITE_URL,
  legalContactDisplay,
} from "../constants/legal";

const TermsOfService = () => (
  <LegalDocument title="Terms of Service">
    <p>
      These Terms of Service (&quot;Terms&quot;) govern access to and use of {LEGAL_SERVICE_NAME} (the
      &quot;Service&quot;) provided by {LEGAL_OPERATOR_NAME} at{" "}
      <a href={LEGAL_WEBSITE_URL} className="underline">
        {LEGAL_WEBSITE_URL}
      </a>
      . By creating an account or using the Service, you agree to these Terms.
    </p>

    <LegalSection title="1. The Service">
      <p>
        {LEGAL_SERVICE_NAME} is a web-based fleet management application. Features may include vehicle and driver
        management, GPS tracking from supported browsers, fuel logging, route history, geofences, reports, and related
        tools. Features depend on your role (fleet administrator or driver) and on third-party infrastructure (Firebase,
        hosting, and map services).
      </p>
      <p>
        The Service is provided on a best-effort basis. We do not guarantee uninterrupted availability, real-time
        accuracy of GPS data, or suitability for every regulatory or safety-critical use case.
      </p>
    </LegalSection>

    <LegalSection title="2. Eligibility and accounts">
      <LegalList
        items={[
          "You must be at least 16 years old and able to enter a binding agreement, or use the Service only with permission from your employer or organization.",
          "You must provide accurate registration information and keep your credentials secure.",
          "Administrators create fleet organizations. Drivers join using an invite code from their administrator and may require administrator approval before full access.",
          "You are responsible for all activity under your account.",
        ]}
      />
    </LegalSection>

    <LegalSection title="3. Fleet administrators and drivers">
      <p>
        If you register as a <strong>fleet administrator</strong>, you represent that you have authority to manage the
        fleet data you enter and to invite drivers. You are responsible for:
      </p>
      <LegalList
        items={[
          "Informing drivers that location and fleet activity data may be collected when they use tracking features.",
          "Complying with applicable employment, privacy, and vehicle-tracking laws in your country or region before monitoring drivers.",
          "Maintaining accurate roster and vehicle records.",
          "Using invite codes appropriately and removing access when employment ends.",
        ]}
      />
      <p>
        If you register as a <strong>driver</strong>, you understand that your fleet administrator can view data linked
        to your account, including assigned vehicles and location information when you enable GPS tracking in the Service.
      </p>
    </LegalSection>

    <LegalSection title="4. Location tracking">
      <p>
        GPS tracking uses your browser&apos;s geolocation API when you grant permission. Tracking generally requires an
        assigned vehicle and may stop or become inaccurate if the browser tab is closed, permissions are revoked, or
        network or device limits apply. Location data is not intended as a certified safety or emergency system.
      </p>
    </LegalSection>

    <LegalSection title="5. Acceptable use">
      <p>You agree not to:</p>
      <LegalList
        items={[
          "Use the Service for unlawful purposes or in violation of others' rights.",
          "Attempt to bypass security, access another user's account, or scrape the Service in a way that harms availability.",
          "Upload malicious code or false location data intended to mislead.",
          "Resell or sublicense the Service without our written permission.",
        ]}
      />
      <p>We may suspend or terminate access for conduct that risks the Service, other users, or legal compliance.</p>
    </LegalSection>

    <LegalSection title="6. Third-party services">
      <p>
        The Service relies on third parties including Google Firebase, Vercel, and map data providers. Their terms and
        privacy policies also apply to your use of those components. Usage limits (such as Firebase free-tier quotas)
        may affect saves, sync, or tracking until limits reset or plans are upgraded.
      </p>
    </LegalSection>

    <LegalSection title="7. Your content and data">
      <p>
        You retain ownership of information you submit. You grant us a limited license to host, process, and display that
        information solely to operate the Service for your organization. Administrators control most fleet records;
        deletion of an administrator account does not automatically delete all fleet data stored in Firebase.
      </p>
    </LegalSection>

    <LegalSection title="8. Disclaimer of warranties">
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER
        EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT. WE DO NOT WARRANT THAT GPS LOCATIONS, REPORTS, OR ANALYTICS ARE ERROR-FREE OR COMPLETE.
      </p>
    </LegalSection>

    <LegalSection title="9. Limitation of liability">
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {LEGAL_OPERATOR_NAME.toUpperCase()} AND ITS OPERATORS WILL NOT
        BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS,
        DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY
        CLAIM RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US FOR THE SERVICE IN THE
        TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED US DOLLARS (USD $100), IF YOU PAID NOTHING FOR THE SERVICE.
      </p>
      <p>
        Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest
        extent permitted by law.
      </p>
    </LegalSection>

    <LegalSection title="10. Indemnity">
      <p>
        Fleet administrators agree to indemnify and hold harmless {LEGAL_OPERATOR_NAME} from claims arising out of their
        fleet&apos;s use of the Service, including failure to obtain required consents for employee location monitoring or
        misuse of driver data.
      </p>
    </LegalSection>

    <LegalSection title="11. Termination">
      <p>
        You may stop using the Service at any time. We may suspend or terminate access if you breach these Terms or if
        continued operation becomes impractical. Provisions that by nature should survive (including disclaimers,
        limitations of liability, and indemnity) will survive termination.
      </p>
    </LegalSection>

    <LegalSection title="12. Changes">
      <p>
        We may modify these Terms by posting an updated version on this page. Material changes will be indicated by an
        updated effective date. Continued use after changes constitutes acceptance.
      </p>
    </LegalSection>

    <LegalSection title="13. Contact">
      <p>
        Questions about these Terms:{" "}
        {LEGAL_CONTACT_EMAIL ? (
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
        ) : (
          legalContactDisplay()
        )}
        .
      </p>
    </LegalSection>

    <LegalSection title="14. Privacy">
      <p>
        Our <LegalLink to="/privacy">Privacy Policy</LegalLink> explains how we collect and use personal information.
      </p>
    </LegalSection>
  </LegalDocument>
);

export default TermsOfService;
