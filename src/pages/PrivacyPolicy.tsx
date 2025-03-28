import Layout from '../components/Layout';

const PrivacyPolicy = () => {
  return (
    <Layout backgroundClass="sound-wave-background">
      <div className="container mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>

          <div className="space-y-6 text-gray-700">
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Introduction</h2>
              <p>
                Music Pals ("we", "our", or "us") is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Information We Collect</h2>
              <p>We may collect information about you in a variety of ways, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  Personal Data: Name, email address, and other contact information you voluntarily
                  provide.
                </li>
                <li>
                  Usage Data: How you interact with our application, including performance data and
                  preferences.
                </li>
                <li>
                  Device Information: Information about the device you use to access our
                  application.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                How We Use Your Information
              </h2>
              <p>We may use your information for:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Providing and maintaining our application.</li>
                <li>Personalizing your experience.</li>
                <li>Improving our application and services.</li>
                <li>Communicating with you about updates and features.</li>
                <li>Analyzing usage patterns to enhance user experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Disclosure of Your Information
              </h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Service providers who help us operate our application.</li>
                <li>Legal entities when required by law or to protect our rights.</li>
                <li>Business partners with your consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Security of Your Information
              </h2>
              <p>
                We use administrative, technical, and physical security measures to protect your
                personal information. However, no data transmission over the Internet or storage
                system can be guaranteed to be 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Your Rights</h2>
              <p>
                Depending on your location, you may have rights regarding your personal information,
                including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>The right to access your personal information.</li>
                <li>The right to correct inaccurate information.</li>
                <li>The right to request deletion of your information.</li>
                <li>The right to restrict or object to processing.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Changes to This Privacy Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the "Last
                updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> privacy@musicpals.com
                <br />
                <strong>Address:</strong> 123 Music Lane, Suite 100, Harmony City, CA 94000
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
