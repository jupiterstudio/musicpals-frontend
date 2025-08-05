import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, User, MessageSquare, Heart } from 'lucide-react';
import Layout from '../components/Layout';
import emailjs from '@emailjs/browser';

const ContactUs = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitMessage(null);

    // Use environment variables for EmailJS credentials
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Check if environment variables are set
    if (!serviceId || !templateId || !publicKey) {
      setIsSubmitting(false);
      setSubmitMessage(
        'Our contact form is taking a little music break right now. Please email us directly and we\'ll get back to you with musical excitement!'
      );
      setSubmitError(true);
      return;
    }

    emailjs
      .sendForm(serviceId, templateId, formRef.current!, publicKey)
      .then((result: any) => {
        setIsSubmitting(false);
        setSubmitMessage("Thank you for your amazing message! We'll get back to you super soon with musical magic!");
        setSubmitError(false);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      })
      .catch((error: any) => {
        console.error('Failed to send email:', error.text);
        setIsSubmitting(false);
        setSubmitMessage(
          'Oops! Something went wonky with sending your message. Please try your musical magic again later!'
        );
        setSubmitError(true);
      });
  };

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
            💌 Let's Chat, Music Friend! 🎪
          </h1>
          <div className="musical-icon">💬</div>
          <p className="kid-subtitle text-xl" style={{ position: 'relative', zIndex: 2 }}>
            Got questions, ideas, or just want to say hi? We'd love to hear all about your musical adventures!
          </p>
        </motion.div>

        {/* Contact Form */}
        <motion.div className="kid-welcome-section" variants={itemVariants}>
          <div style={{ position: 'relative', zIndex: 2 }}>

            {submitMessage && (
              <motion.div
                className={`p-6 mb-6 rounded-2xl border-4 text-center font-bold text-lg ${
                  submitError 
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-green-100 text-green-700 border-green-300'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {submitError ? '😅 ' : '🎉 '}{submitMessage}
              </motion.div>
            )}

            <form ref={formRef} onSubmit={handleSubmit}>
              <div className="space-y-6 text-start">
                <motion.div variants={itemVariants}>
                  <label htmlFor="name" className="kid-subtitle font-bold text-lg mb-3 flex items-center gap-2">
                    <User className="text-pink-500" size={20} />
                    What's your awesome name?
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Tell us your magical music name!"
                    className="w-full px-4 py-3 border-4 border-pink-200 rounded-2xl focus:ring-4 focus:ring-pink-300 focus:border-pink-400 transition-all duration-300 text-lg font-medium bg-white"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="email" className="kid-subtitle font-bold text-lg mb-3 flex items-center gap-2">
                    <Mail className="text-blue-500" size={20} />
                    Where can we send our reply?
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@musicpal.com"
                    className="w-full px-4 py-3 border-4 border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 text-lg font-medium bg-white"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="subject" className="kid-subtitle font-bold text-lg mb-3 flex items-center gap-2">
                    <Heart className="text-purple-500" size={20} />
                    What's this about?
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-4 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all duration-300 text-lg font-medium bg-white"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    <option value="">Pick what fits best!</option>
                    <option value="General Inquiry">🤔 General Question</option>
                    <option value="Technical Support">🔧 Need Technical Help</option>
                    <option value="Feedback">⭐ Share Feedback</option>
                    <option value="Partnership">🤝 Partnership Ideas</option>
                    <option value="Other">🌟 Something Else Cool</option>
                  </select>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="message" className="kid-subtitle font-bold text-lg mb-3 flex items-center gap-2">
                    <MessageSquare className="text-green-500" size={20} />
                    Tell us all about it!
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Share your thoughts, questions, or musical stories with us! We love hearing from our music pals! 🎵"
                    className="w-full px-4 py-3 border-4 border-green-200 rounded-2xl focus:ring-4 focus:ring-green-300 focus:border-green-400 transition-all duration-300 text-lg font-medium bg-white resize-none"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  ></textarea>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-4">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className={`kid-button w-full text-xl py-4 px-6 flex items-center justify-center gap-3 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                        Sending your magical message...
                      </>
                    ) : (
                      <>
                        <Send size={24} />
                        Send My Message! 🚀
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.main>
    </Layout>
  );
};

export default ContactUs;
