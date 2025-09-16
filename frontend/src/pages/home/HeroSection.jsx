import React from 'react';
import { BookOpen, Users, Calendar, Award } from 'lucide-react';
import baraemLogo from '../../assets/baraem.svg';

const HeroSection = ({onLoginClick}) => {
  return (
    <section className="bg-gray-50 py-10 sm:py-14 lg:py-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Content */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-lg p-4">
              <img src={baraemLogo} alt="Baraem Al-Nour Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          
          {/* Logo Text */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-green-600 mb-3">
              براعم النور
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-medium">
              Baraem Al-Nour
            </p>
          </div>
          
          {/* Tagline */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-6 sm:mb-8 leading-tight">
            Nurturing Young Hearts with Islamic Knowledge
          </h2>
          
          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed">
            Welcome to Baraem Al-Nour, where we provide comprehensive Islamic education for children. Our platform offers Quran memorization, Arabic language learning, and Islamic studies in a nurturing, age-appropriate environment that helps young minds grow in faith and knowledge.
          </p>
          
          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <button 
            onClick={() => {
              onLoginClick();
            }}
            className="w-full sm:w-auto bg-green-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-lg sm:text-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl">
              Start Learning Journey
            </button>
            <button 
            onClick={() => {
              window.location.href = '#about';
            }}
            className="w-full sm:w-auto bg-transparent text-green-600 border-2 border-green-600 px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-lg sm:text-xl font-semibold hover:bg-green-600 hover:text-white transition-colors">
              Learn More About Us
            </button>
          </div>
        </div>
        
        {/* Features grid */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Quran Memorization</h3>
            <p className="text-sm sm:text-base text-gray-600">Expert guidance in memorizing the Holy Quran with proper Tajweed</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Arabic Language</h3>
            <p className="text-sm sm:text-base text-gray-600">Comprehensive Arabic learning from basics to advanced levels</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Islamic Studies</h3>
            <p className="text-sm sm:text-base text-gray-600">Deep understanding of Islamic principles, history, and values</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Personal Development</h3>
            <p className="text-sm sm:text-base text-gray-600">Character building and life skills based on Islamic values</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;