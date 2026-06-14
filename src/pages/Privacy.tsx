import { LegalShell, LegalSection } from "@/components/site/LegalShell";
import { config } from "@/lib/config";

export default function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="June 14, 2026">
      <p className="text-sm leading-relaxed text-muted-foreground">
        This policy explains what {config.brand.name} collects when you use {config.brand.product},
        and how we use it. We aim to collect as little as possible.
      </p>

      <LegalSection heading="1. What we collect">
        <p>
          <strong className="text-foreground">Design inputs.</strong> The parameters you enter to
          generate a model. Geometry is built in your browser; we don't need your designs on a server
          to make the tool work.
        </p>
        <p>
          <strong className="text-foreground">Account data.</strong> If accounts are enabled and you
          create one, we store your name and email to authenticate you.
        </p>
        <p>
          <strong className="text-foreground">Usage data.</strong> Basic, aggregated analytics (pages
          visited, errors) to keep the Service reliable. No selling of personal data, ever.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use it">
        <p>
          To operate and improve the Service, secure your account, and respond to support requests.
          We do not use your design inputs to train models or share them with third parties.
        </p>
      </LegalSection>

      <LegalSection heading="3. Cookies">
        <p>
          We use essential cookies for sessions and preferences (such as your theme). We don't run
          third-party advertising trackers.
        </p>
      </LegalSection>

      <LegalSection heading="4. Data retention">
        <p>
          Account data is kept while your account is active. You can request deletion at any time and
          we'll remove your personal data, subject to legal retention requirements.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your rights">
        <p>
          Depending on your location, you may have rights to access, correct, export, or delete your
          data. To exercise them, contact us.
        </p>
      </LegalSection>

      <LegalSection heading="6. Contact">
        <p>
          Privacy questions? Email <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
