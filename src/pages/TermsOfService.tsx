import Layout from '../components/Layout';

const TermsOfService = () => {
  return (
    <Layout backgroundClass="sound-wave-background">
      <div className="container mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms of Service</h1>

          <div className="space-y-6 text-gray-700">
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Agreement to Terms</h2>
              <p>
                By accessing or using Music Pals, you agree to be bound by these Terms of Service.
                If you disagree with any part of the terms, you may not access the application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Use License</h2>
              <p>
                Permission is granted to temporarily use the application for personal,
                non-commercial use only. This is the grant of a license, not a transfer of title,
                and under this license you may not:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Modify or copy the materials;</li>
                <li>Use the materials for any commercial purpose;</li>
                <li>
                  Attempt to decompile or reverse engineer any software contained in the
                  application;
                </li>
                <li>Remove any copyright or other proprietary notations from the materials; or</li>
                <li>
                  Transfer the materials to another person or "mirror" the materials on any other
                  server.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Disclaimer</h2>
              <p>
                The materials on Music Pals are provided on an 'as is' basis. Music Pals makes no
                warranties, expressed or implied, and hereby disclaims and negates all other
                warranties including, without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or non-infringement of
                intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Limitations</h2>
              <p>
                In no event shall Music Pals or its suppliers be liable for any damages (including,
                without limitation, damages for loss of data or profit, or due to business
                interruption) arising out of the use or inability to use the materials on Music
                Pals's application, even if Music Pals or a Music Pals authorized representative has
                been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">User Accounts</h2>
              <p>
                If you create an account with Music Pals, you are responsible for maintaining the
                security of your account and for all activities that occur under the account. You
                agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Modifications to the Service
              </h2>
              <p>
                Music Pals reserves the right to modify or discontinue, temporarily or permanently,
                the application or any service to which it connects, with or without notice and
                without liability to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws
                of the United States and you irrevocably submit to the exclusive jurisdiction of the
                courts in that State.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Changes to Terms</h2>
              <p>
                Music Pals reserves the right, at its sole discretion, to modify or replace these
                Terms at any time. By continuing to access or use our application after those
                revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService;
