import { motion } from 'framer-motion';
import { ScrollText, Shield, Users, AlertTriangle, Gavel } from 'lucide-react';
import Layout from '../components/Layout';

const TermsOfService = () => {
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
            📜 Our Musical Rules & Fun Guidelines! 🎭
          </h1>
          <div className="musical-icon">🎩</div>
          <p className="kid-subtitle text-xl" style={{ position: 'relative', zIndex: 2 }}>
            Let's make sure everyone has the most amazing and safe musical adventure together!
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
              className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-2xl border-4 border-pink-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <ScrollText className="text-pink-500" size={28} />
                🤝 Welcome to Our Musical Family!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                By using Music Pals, you're joining our amazing musical adventure! These friendly rules help make sure everyone has the best time learning and playing music together. If you don't agree with these super important guidelines, that's okay - but you won't be able to use our magical music app.
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-blue-100 to-cyan-100 p-6 rounded-2xl border-4 border-blue-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Users className="text-blue-500" size={28} />
                🎵 How You Can Use Our Musical Magic!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed mb-4">
                You can use Music Pals for your own personal musical learning and fun! But to keep everything fair and magical for everyone, please don't:
              </p>
              <ul className="space-y-3">
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🚫</span>
                  <span>Copy or change our musical materials without permission</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">💰</span>
                  <span>Use our app to make money (it's for learning and fun only!)</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🔍</span>
                  <span>Try to peek inside our secret musical code</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">©️</span>
                  <span>Remove our special Music Pals name or labels</span>
                </li>
                <li className="kid-subtitle text-base flex items-start gap-3">
                  <span className="text-2xl">🔄</span>
                  <span>Share our app materials with others in ways we haven't said okay to</span>
                </li>
              </ul>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-2xl border-4 border-yellow-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <AlertTriangle className="text-yellow-500" size={28} />
                🌟 Important Things to Know!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                We work super hard to make Music Pals amazing, but sometimes things might not work perfectly (like when instruments need tuning!). We give you our app exactly as it is right now, and while we always try our best, we can't promise it will always be 100% perfect. That's just how technology works - but we're always working to make it better for you!
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-2xl border-4 border-green-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Shield className="text-green-500" size={28} />
                🛡️ Keeping Things Fair and Safe!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                If something goes wrong while you're using Music Pals (like losing your practice progress), we feel really sorry about that! But just like how a music teacher isn't responsible if your piano breaks at home, we can't be responsible for problems that might happen. We always do our best to help, though!
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl border-4 border-purple-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Users className="text-purple-500" size={28} />
                🔐 Your Special Musical Account!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                When you create your Music Pals account, it's like getting your very own musical locker! You need to keep your password secret and safe (don't share it with anyone except your parents). If someone uses your account without permission, please tell us right away so we can help protect your musical progress!
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-indigo-100 to-blue-100 p-6 rounded-2xl border-4 border-indigo-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Gavel className="text-indigo-500" size={28} />
                🔄 Making Music Pals Even Better!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                Just like how musicians practice and improve their songs, we sometimes need to update and improve Music Pals! We might add cool new features, fix things that aren't working, or occasionally need to take a break for maintenance. We'll try to let you know when big changes are coming!
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-red-100 to-pink-100 p-6 rounded-2xl border-4 border-red-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <Gavel className="text-red-500" size={28} />
                🇺🇸 The Rules We Follow!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                Music Pals follows the laws of the United States, just like how every school follows their country's education rules! If there are ever any big problems that need grown-ups to help solve, they would be handled by courts in the United States.
              </p>
            </motion.section>

            <motion.section 
              className="bg-gradient-to-r from-teal-100 to-green-100 p-6 rounded-2xl border-4 border-teal-300" 
              variants={itemVariants}
            >
              <h2 className="activity-title text-2xl mb-4 flex items-center gap-3">
                <ScrollText className="text-teal-500" size={28} />
                📝 Updates to Our Musical Agreement!
              </h2>
              <p className="kid-subtitle text-lg leading-relaxed">
                Sometimes we might need to update these rules to make them even better or clearer - just like how music teachers sometimes update their lesson plans! When we do make changes, we'll let you know. By continuing to use Music Pals after we update the rules, you're saying "I agree to these new awesome guidelines!"
              </p>
            </motion.section>

            {/* Fun closing section */}
            <motion.div 
              className="text-center p-8 bg-gradient-to-r from-pink-200 to-purple-200 rounded-2xl border-4 border-pink-400"
              variants={itemVariants}
            >
              <h3 className="activity-title text-2xl mb-4">
                🎵 Thanks for Being Part of Our Musical Family! 🎵
              </h3>
              <p className="kid-subtitle text-lg leading-relaxed">
                These rules help us create the most amazing, safe, and fun musical learning experience for everyone. Now let's make some beautiful music together! 🎺🎸🎹
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.main>
    </Layout>
  );
};

export default TermsOfService;
