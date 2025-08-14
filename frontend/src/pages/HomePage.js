import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';
import AboutSection from '../components/AboutSection';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Baraem Al-Noor - Islamic Educational Platform</title>
        <meta name="description" content="Baraem Al-Noor offers comprehensive Islamic education including Quran memorization, Arabic language learning, and Islamic studies for children of all ages." />
        <meta name="keywords" content="Islamic education, Quran memorization, Arabic learning, Islamic studies, children education" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <HeroSection />
          <ServicesSection />
          <AboutSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default HomePage;