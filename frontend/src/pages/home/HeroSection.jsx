import React from 'react';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 py-12 ">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl sm:text-4xl font-bold">ب</span>
            </div>
          </div>
          
          {/* Logo Text */}
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-green-600 mb-2">
              براعم النور
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-medium">
              Baraem Al-Noor
            </p>
          </div>
          
          {/* Tagline */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-6 sm:mb-8 leading-tight">
            Nurturing Young Hearts with Islamic Knowledge
          </h2>
          
          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed">
            Welcome to Baraem Al-Noor, where we provide comprehensive Islamic education for children. Our platform offers Quran memorization, Arabic language learning, and Islamic studies in a nurturing, age-appropriate environment that helps young minds grow in faith and knowledge.
          </p>
          
          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <button className="w-full sm:w-auto bg-green-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-lg sm:text-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl">
              Start Learning Journey
            </button>
            <button className="w-full sm:w-auto bg-transparent text-green-600 border-2 border-green-600 px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-lg sm:text-xl font-semibold hover:bg-green-600 hover:text-white transition-colors">
              Learn More About Us
            </button>
          </div>
        </div>
        
        {/* Features grid */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">📚</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Quran Memorization</h3>
            <p className="text-sm sm:text-base text-gray-600">Expert guidance in memorizing the Holy Quran with proper Tajweed</p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🌍</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Arabic Language</h3>
            <p className="text-sm sm:text-base text-gray-600">Comprehensive Arabic learning from basics to advanced levels</p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🕌</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Islamic Studies</h3>
            <p className="text-sm sm:text-base text-gray-600">Deep understanding of Islamic principles, history, and values</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;