import React from 'react';
import { BookOpen, Users, Calendar, Award, CheckCircle, Star, Clock, User } from 'lucide-react';

const ServicesSection = () => {
  const services = [
    {
      icon: BookOpen,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      title: "Quran Memorization",
      description: "Structured programs for memorizing the Holy Quran with proper Tajweed and understanding.",
      features: ["Individual attention", "Progress tracking", "Regular assessments", "Certification"]
    },
    {
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      title: "Arabic Language",
      description: "Comprehensive Arabic learning from basic reading and writing to advanced grammar and literature.",
      features: ["Interactive lessons", "Native speakers", "Cultural context", "Practical exercises"]
    },
    {
      icon: Calendar,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      title: "Islamic Studies",
      description: "Deep understanding of Islamic principles, history, values, and contemporary applications.",
      features: ["Age-appropriate content", "Interactive discussions", "Real-world examples", "Family involvement"]
    },
    {
      icon: Award,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
      title: "Personal Development",
      description: "Character building and life skills development based on Islamic values and principles.",
      features: ["Moral education", "Leadership skills", "Community service", "Self-discipline"]
    }
  ];

  return (
    <section id="services" className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Our Educational Services
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            We offer a comprehensive range of Islamic educational services designed to nurture young minds 
            and strengthen their connection with Islamic values and knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden">
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${service.bgColor} rounded-xl flex items-center justify-center`}>
                    <service.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${service.iconColor}`} />
                  </div>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                  {service.description}
                </p>
              </div>
              
              {/* Features */}
              <div className="p-6 sm:p-8">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Key Features
                </h4>
                <div className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        {/* <div className="text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 sm:p-8 rounded-2xl border border-green-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Ready to Start Your Child's Islamic Education Journey?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Join thousands of families who trust Baraem Al-Nour for their children's Islamic education.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button className="w-full sm:w-auto bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg">
                Enroll Now
              </button>
              <button className="w-full sm:w-auto bg-transparent text-green-600 border-2 border-green-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors">
                Schedule a Consultation
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default ServicesSection;