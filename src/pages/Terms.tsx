import { LegalShell, LegalSection } from "@/components/site/LegalShell";
import { config } from "@/lib/config";

export default function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="June 14, 2026">
      <p className="text-sm leading-relaxed text-muted-foreground">
        These Terms govern your use of {config.brand.name}'s {config.brand.product} (the
        "Service"). By using the Service you agree to them. If you're using it on behalf of an
        organization, you accept on its behalf.
      </p>

      <LegalSection heading="1. Use of the Service">
        <p>
          The Service lets you generate parametric cutting-tool models and export them as STEP and
          DXF. You may use it for any lawful design, prototyping, or manufacturing purpose. You are
          responsible for verifying that generated geometry meets your engineering and safety
          requirements before manufacturing.
        </p>
      </LegalSection>

      <LegalSection heading="2. Accounts">
        <p>
          Some features may require an account. You're responsible for the accuracy of your account
          information and for keeping your credentials secure. You must be able to form a binding
          contract to use the Service.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your content and output">
        <p>
          You own the parameters you enter and the model files you export. We claim no ownership over
          your designs. You grant us only the limited rights needed to operate the Service (for
          example, processing your inputs to generate geometry).
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>
          Don't misuse the Service: no reverse engineering of the kernel, no attempts to disrupt or
          overload the infrastructure, and no use that infringes others' rights or violates law.
        </p>
      </LegalSection>

      <LegalSection heading="5. No warranty">
        <p>
          The Service and all generated geometry are provided "as is" without warranties of any kind.
          Engineering output is a starting point, not a certified design — always validate before
          machining. We do not warrant that the Service will be uninterrupted or error-free.
        </p>
      </LegalSection>

      <LegalSection heading="6. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {config.brand.name} is not liable for indirect,
          incidental, or consequential damages, or for any loss arising from manufactured parts based
          on generated geometry.
        </p>
      </LegalSection>

      <LegalSection heading="7. Changes">
        <p>
          We may update these Terms. Material changes will be reflected by the "last updated" date.
          Continued use after changes means you accept them.
        </p>
      </LegalSection>

      <LegalSection heading="8. Contact">
        <p>
          Questions? Reach us at <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
