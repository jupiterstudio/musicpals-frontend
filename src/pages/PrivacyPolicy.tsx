import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Users, Mail, Settings, Heart, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const PrivacyPolicy = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Layout backgroundClass="">
      {/* Floating musical notes background */}
      <div className="floating-notes">
        <div className="note">🎵</div>
        <div className="note">🎶</div>
        <div className="note">🎼</div>
        <div className="note">🎹</div>
        <div className="note">🎺</div>
        <div className="note">🎸</div>
        <div className="note">🥁</div>
        <div className="note">🎤</div>
      </div>

      <motion.main
        className="py-8 px-4"
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div className="kid-welcome-section" variants={itemVariants}>
          <h1
            className="kid-title text-4xl md:text-5xl mb-4"
            style={{ position: 'relative', zIndex: 2 }}
          >
            🔐 How We Keep Your Musical Info Safe! 🌍
          </h1>
          <div className="musical-icon">🛡️</div>
          <p className="kid-subtitle text-xl" style={{ position: 'relative', zIndex: 2 }}>
            Your privacy is super important to us! Let's learn about how we protect your musical journey.
          </p>
        </motion.div>

        {/* Content */}
        <motion.div className="kid-welcome-section" variants={itemVariants}>
          <div className="space-y-8" style={{ position: 'relative', zIndex: 2 }}>
            <div className="text-center">
              <p className="kid-subtitle text-lg font-bold text-purple-600">
                📅 Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            <motion.section 
              className="bg-gradient-to-r from-blue-100 to-cyan-100 p-6 rounded-2xl border-4 border-blue-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Heart className="text-blue-500" size={28} />
                🌟 We Care About You!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                Hi there, musical friend! Music Pals (that's us!) really, really cares about keeping your personal information safe and secure. This special guide explains how we collect, use, and protect your information when you're having fun with our musical app. We promise to always be honest and clear with you!
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-2xl border-4 border-pink-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Eye className="text-pink-500" size={28} />
                📝 What Information Do We Learn About You?
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed mb-4">
                To help you have the best musical adventure, we might learn a few things about you:
              </p>
              <ul className="space-y-3">
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">👤</span>
                  <span><strong>Your Name & Email:</strong> The information you choose to share with us when you create your account</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🎵</span>
                  <span><strong>How You Play:</strong> Which songs you practice, your progress, and what you like to do in the app</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">📱</span>
                  <span><strong>Your Device:</strong> What kind of phone, tablet, or computer you use (so we can make sure everything works great!)</span>
                </li>
              </ul>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-2xl border-4 border-green-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Settings className="text-green-500" size={28} />
                🎆 How We Use Your Musical Info!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed mb-4">
                We use your information to make your musical journey amazing:
              </p>
              <ul className="space-y-3">
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🎹</span>
                  <span>Making sure Music Pals works perfectly for you</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <span>Creating special lessons just for your skill level</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🚀</span>
                  <span>Making the app even better and more fun</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">📨</span>
                  <span>Telling you about cool new features and updates</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">📈</span>
                  <span>Learning how to make Music Pals even more awesome for everyone</span>
                </li>
              </ul>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-2xl border-4 border-yellow-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Users className="text-yellow-500" size={28} />
                🤝 Who Might We Share Your Info With?
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed mb-4">
                We're very careful about sharing your information! We might only share it with:
              </p>
              <ul className="space-y-3">
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🔧</span>
                  <span>Special helpers who help us keep Music Pals running smoothly (like tech support friends)</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">⚖️</span>
                  <span>Grown-ups in charge of laws, but only when they really need it to keep everyone safe</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🤝</span>
                  <span>Other friendly companies, but only if you say it's okay first!</span>
                </li>
              </ul>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl border-4 border-purple-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Lock className="text-purple-500" size={28} />
                🛡️ How We Keep Your Info Super Safe!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                We use lots of special security measures to protect your information - like having super strong digital locks, security guards for our computers, and safe storage places! But just like how even the strongest castle might have a tiny weak spot, we can't promise that internet security is 100% perfect. That's why we work extra hard to keep everything as safe as possible!
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-indigo-100 to-blue-100 p-6 rounded-2xl border-4 border-indigo-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Shield className="text-indigo-500" size={28} />
                ✨ Your Special Privacy Powers!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed mb-4">
                You have some really cool rights when it comes to your information:
              </p>
              <ul className="space-y-3">
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">👀</span>
                  <span>You can ask to see what information we have about you</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">✏️</span>
                  <span>You can ask us to fix anything that's wrong</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🗑️</span>
                  <span>You can ask us to delete your information</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🚫</span>
                  <span>You can ask us to stop using your information in certain ways</span>
                </li>
              </ul>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-teal-100 to-green-100 p-6 rounded-2xl border-4 border-teal-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <FileText className="text-teal-500" size={28} />
                📝 Updates to Our Privacy Promise!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                Sometimes we might need to update this privacy guide to make it even better or add new cool features! When we do, we'll put the new version right here on this page and update the date at the top. We'll try our best to let you know about any big changes!
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-red-100 to-pink-100 p-6 rounded-2xl border-4 border-red-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Mail className="text-red-500" size={28} />
                📧 Questions? Let's Chat!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed mb-6">
                Got questions about privacy or want to talk about your information? We'd love to help!
              </p>
              <div className="text-center">
                <Link to="/contact">
                  <motion.button
                    className="kid-button text-lg py-3 px-6 flex items-center justify-center gap-3 mx-auto"
                    style={{
                      background: 'linear-gradient(45deg, #EF4444, #F87171)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail size={24} />
                    Contact Us About Privacy
                    <ArrowRight size={20} />
                  </motion.button>
                </Link>
              </div>
            </motion.section>

            {/* Fun closing section */}
            <motion.div 
              className="text-center p-8 bg-gradient-to-r from-pink-200 to-purple-200 rounded-2xl border-4 border-pink-400"
              variants={itemVariants}
            >
              <h3 className="activity-title text-2xl mb-4">
                🌈 Thanks for Trusting Us with Your Musical Journey! 🌈
              </h3>
              <p className="kid-subtitle text-lg leading-relaxed">
                Your privacy and safety are our top priorities. Now let's get back to making beautiful music together! 🎵✨🎶
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.main>
    </Layout>
  );
};

export default PrivacyPolicy;
