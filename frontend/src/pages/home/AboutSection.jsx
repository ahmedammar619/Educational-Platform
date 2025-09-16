import React from 'react';
import { CheckCircle, Users, Award, Shield, Heart, Star } from 'lucide-react';

const AboutSection = () => {
  const values = [
    {
      icon: Shield,
      title: "Quality Islamic Education",
      description: "Providing authentic Islamic knowledge based on Quran and Sunnah"
    },
    {
      icon: Users,
      title: "Experienced Teachers",
      description: "Qualified instructors with deep knowledge and passion for teaching"
    },
    {
      icon: Heart,
      title: "Nurturing Environment",
      description: "Safe, supportive atmosphere that encourages learning and growth"
    },
    {
      icon: Award,
      title: "Modern Technology",
      description: "Interactive online platform with engaging educational tools"
    }
  ];

  const stats = [
    { number: "1000+", label: "Students Enrolled", color: "text-green-600" },
    { number: "50+", label: "Qualified Teachers", color: "text-blue-600" },
    { number: "95%", label: "Success Rate", color: "text-purple-600" },
    { number: "5+", label: "Years Experience", color: "text-yellow-600" }
  ];

  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            About Baraem Al-Nour
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Nurturing young minds with authentic Islamic knowledge and modern educational excellence
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
          {/* Content */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Our Mission
              </h3>
              <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                Baraem Al-Nour (براعم النور) means "Buds of Light" - representing our mission to nurture 
                young minds as they grow in Islamic knowledge and character. We believe that every child 
                is a precious gift from Allah, and it is our responsibility to provide them with the 
                best Islamic education possible.
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Our platform combines traditional Islamic teaching methods with modern educational 
                technology to create an engaging and effective learning experience. We are committed 
                to helping children develop a strong foundation in their faith while fostering a 
                love for learning that will benefit them throughout their lives.
              </p>
            </div>
          </div>
          
          {/* Vision Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                To be the leading platform for Islamic education, empowering children with 
                knowledge, wisdom, and strong moral character that will guide them throughout 
                their lives and help them become righteous members of the Muslim community.
              </p>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {values.map((value, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <value.icon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Our Impact</h3>
            <p className="text-sm sm:text-base text-gray-600">Numbers that reflect our commitment to excellence</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-2`}>
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;