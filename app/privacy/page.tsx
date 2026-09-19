import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — MamaFresh",
  description: "How MamaFresh Technologies Ltd collects, uses, and protects your information.",
};

const LAST_UPDATED = "September 19, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F6] pb-28 animate-fade-in">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 lg:py-16">
        <Link href="/account" className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#16A34A]">
          <ChevronLeft size={15} /> Back
        </Link>

        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#16A34A]">Legal</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073729] sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-xs text-gray-400">Last updated: {LAST_UPDATED}</p>

        <div className="prose-mamafresh mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <p>
              MamaFresh Technologies Ltd (&ldquo;MamaFresh&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the MamaFresh mobile app and
              website (together, the &ldquo;Service&rdquo;), connecting shoppers with neighborhood mama mboga sellers across East Africa. This
              policy explains what information we collect, why we collect it, and the choices you have. By using MamaFresh, you agree to
              the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">1. Information we collect</h2>

            <h3 className="mt-4 text-sm font-black text-[#073729]">Account information</h3>
            <p className="mt-1">
              When you register, we collect your name, email address, phone number, and password (stored securely, hashed, via our
              authentication provider — we never see or store your password in plain text). If you sign up as a seller, we additionally
              collect your shop name, shop banner image, business location, and product listings.
            </p>

            <h3 className="mt-4 text-sm font-black text-[#073729]">Location information</h3>
            <p className="mt-1">
              To deliver groceries to the right place, we collect delivery addresses and, if you grant permission, precise GPS location
              from your device (used to detect your neighborhood and to share your live location with a delivery courier for a specific
              order). You can decline GPS access and pick a neighborhood manually instead.
            </p>

            <h3 className="mt-4 text-sm font-black text-[#073729]">Order and payment information</h3>
            <p className="mt-1">
              We collect the items you order, order totals, delivery status, and reviews or ratings you leave. Payments are processed via
              M-Pesa STK Push (through Safaricom&apos;s Daraja API) or cash on delivery. We do not collect or store your M-Pesa PIN, and we do
              not process or store card numbers — MamaFresh has no card payment option.
            </p>

            <h3 className="mt-4 text-sm font-black text-[#073729]">Communications</h3>
            <p className="mt-1">
              Messages you send through in-app chat (to sellers, couriers, or customer support) and conversations with the MamaFresh AI
              shopping assistant are stored so threads persist across sessions and so we can investigate disputes or improve the
              assistant.
            </p>

            <h3 className="mt-4 text-sm font-black text-[#073729]">Device and usage information</h3>
            <p className="mt-1">
              We collect basic technical information — device type, operating system, app version, and general usage patterns (e.g. pages
              viewed, features used) — to keep the Service reliable and to fix bugs. If you enable push notifications, we store a device
              token to deliver order updates.
            </p>

            <h3 className="mt-4 text-sm font-black text-[#073729]">Cookies and local storage</h3>
            <p className="mt-1">
              We use essential cookies/local storage to keep you signed in — these are required and can&apos;t be turned off without
              breaking login. We use optional local storage to remember conveniences like your last delivery location, so the app loads
              faster. You control the optional kind through the cookie banner shown on first visit, or your browser/device settings at any
              time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">2. How we use your information</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Create and manage your account, and verify who you are when you sign in.</li>
              <li>Match you with nearby sellers, calculate delivery routes, and fulfill and track orders.</li>
              <li>Process payments and send order/payment confirmations.</li>
              <li>Operate in-app messaging between shoppers, sellers, and support.</li>
              <li>Power the MamaFresh AI assistant&apos;s product recommendations and shopping help.</li>
              <li>Send order-status and account notifications (push, SMS, or email).</li>
              <li>Investigate complaints, disputes, fraud, or abuse, and enforce our terms.</li>
              <li>Understand how the Service is used so we can fix problems and build better features.</li>
            </ul>
            <p className="mt-2">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">3. Who we share information with</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-bold">Sellers and couriers</span>, so they can prepare and deliver your order (name, phone number, delivery address/location, order contents).</li>
              <li><span className="font-bold">Supabase</span>, our database, authentication, and file-storage provider, which hosts the data described in this policy on our behalf.</li>
              <li><span className="font-bold">Safaricom</span>, to process M-Pesa payments you initiate.</li>
              <li><span className="font-bold">Service providers</span> who help us operate the Service (e.g. hosting, error monitoring, push-notification delivery), bound to use data only to provide that service to us.</li>
              <li><span className="font-bold">Legal and safety</span> — if required by law, to protect the rights or safety of MamaFresh, our users, or the public, or in connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">4. Data security</h2>
            <p className="mt-1">
              We use industry-standard safeguards — encrypted connections (HTTPS), access controls, and row-level security on our
              database — to protect your information. No system is perfectly secure, so we can&apos;t guarantee absolute security, but we
              work to protect your data and to respond quickly if something goes wrong.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">5. Data retention</h2>
            <p className="mt-1">
              We keep account and order data for as long as your account is active, and for a reasonable period afterward to meet legal,
              accounting, or dispute-resolution needs. You can request deletion of your account and associated personal data at any time
              (see Section 7); some order records may be retained where we&apos;re legally required to keep them (e.g. for tax purposes).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">6. Children&apos;s privacy</h2>
            <p className="mt-1">
              MamaFresh is not directed at children under 16, and we do not knowingly collect personal information from them. If you
              believe a child has provided us with personal information, contact us and we&apos;ll remove it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">7. Your rights and choices</h2>
            <p className="mt-1">You can, at any time:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Access, update, or correct your profile information from the Account tab in the app.</li>
              <li>Withdraw location permission through your device settings and choose a neighborhood manually instead.</li>
              <li>Turn off optional cookies/local storage via the cookie banner or your browser settings.</li>
              <li>Turn off push notifications in your device settings.</li>
              <li>Request a copy of your data, or request that we delete your account and personal data, by contacting us below.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">8. International data</h2>
            <p className="mt-1">
              MamaFresh operates across East Africa, and the infrastructure we use to run the Service may process and store data outside
              your home country. We take steps to keep your information protected wherever it&apos;s processed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">9. Changes to this policy</h2>
            <p className="mt-1">
              We may update this policy from time to time. If we make material changes, we&apos;ll update the &ldquo;Last updated&rdquo; date
              above and, where appropriate, notify you in the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-[#073729]">10. Contact us</h2>
            <p className="mt-1">Questions about this policy or your data? Reach us at:</p>
            <ul className="mt-2 space-y-1">
              <li>MamaFresh Technologies Ltd</li>
              <li>Kasarani Center, Off Thika Road, Nairobi, Kenya</li>
              <li>Email: <a href="mailto:support@mamafresh.ke" className="font-bold text-[#16A34A]">support@mamafresh.ke</a></li>
              <li>Phone: <a href="tel:+254793046776" className="font-bold text-[#16A34A]">+254 793 046 776</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
