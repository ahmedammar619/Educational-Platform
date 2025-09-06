import React from 'react';
import baraemLogo from '../../assets/baraem.svg';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex w-full justify-center px-0 sm:px-16 gap-20 sm:gap-28 flex-wrap">

                        
            {/* Address Section */}
            <div className="transform hover:scale-105 transition-transform duration-300 text-center lg:text-left">
              <h4 className="text-lg font-bold mb-6 text-white border-b-2 border-blue-500 pb-2 inline-block">
                Address
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 group justify-center lg:justify-start">
                  <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                    <svg className="w-full h-full text-blue-400 group-hover:text-blue-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-300 group-hover:text-white transition-colors leading-relaxed">
                      2834 Big Oaks Dr.
                    </p>
                    <p className="text-gray-300 group-hover:text-white transition-colors">
                      Garland TX 75044 USA
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 group justify-center lg:justify-start">
                  <div className="w-5 h-5 flex-shrink-0">
                    <svg className="w-full h-full text-green-400 group-hover:text-green-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <a href="tel:+19722071911" className="text-gray-300 hover:text-white transition-colors">
                    +1 972 207 1911
                  </a>
                </div>
                
                <div className="flex items-center space-x-3 group justify-center lg:justify-start">
                  <div className="w-5 h-5 flex-shrink-0">
                    <svg className="w-full h-full text-red-400 group-hover:text-red-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <a href="mailto:AmericanIslamicDiversity@gmail.com" className="text-gray-300 hover:text-white transition-colors break-all">
                    AmericanIslamicDiversity@gmail.com
                  </a>
                </div>
              </div>
            </div>


            {/* Quick Links */}
            <div className="transform hover:scale-105 transition-transform duration-300 text-center lg:text-left">
              <h4 className="text-lg font-bold mb-6 text-white border-b-2 border-green-500 pb-2 inline-block">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "https://americanislamicdiversity.org/about.html", title: "About Us", text: "About Us" },
                  { href: "https://americanislamicdiversity.org/services.html", title: "Services & Projects", text: "Services & Projects" },
                  { href: "https://americanislamicdiversity.org/family.html", title: "Our Family", text: "Our Family" },
                  { href: "https://americanislamicdiversity.org/envolved.html", title: "Get Envolved", text: "Get Envolved" },
                  { href: "https://americanislamicdiversity.org/contact.html", title: "Contact Us", text: "Contact Us" }
                ].map((link, index) => (
                  <li key={index} className="group flex justify-center lg:justify-start">
                    <a 
                      href={link.href} 
                      title={link.title}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center space-x-2 group-hover:translate-x-2"
                    >
                      <span className="w-1 h-1 bg-green-400 rounded-full group-hover:w-2 transition-all duration-300"></span>
                      <span>{link.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>


            {/* Events and Media */}
            <div className="transform hover:scale-105 transition-transform duration-300 text-center lg:text-left">
              <h4 className="text-lg font-bold mb-6 text-white border-b-2 border-yellow-500 pb-2 inline-block">
                Events and Media
              </h4>
              <ul className="space-y-3 mb-6">
                {[
                  { href: "https://americanislamicdiversity.org/ramadan.html", title: "Ramadan & Eid Specials", text: "Ramadan & Eid Specials" },
                  { href: "https://americanislamicdiversity.org/events.html", title: "Events", text: "Events" },
                  { href: "https://americanislamicdiversity.org/media.html", title: "Media", text: "Media" }
                ].map((link, index) => (
                  <li key={index} className="group flex justify-center lg:justify-start">
                    <a 
                      href={link.href} 
                      title={link.title}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center space-x-2 group-hover:translate-x-2"
                    >
                      <span className="w-1 h-1 bg-yellow-400 rounded-full group-hover:w-2 transition-all duration-300"></span>
                      <span>{link.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
              
              {/* Social Media */}
              <div className="flex space-x-3 justify-center lg:justify-start">
                {[
                  { 
                    href: "https://www.facebook.com/American-Islamic-Diversity-AID-106591931847626/?ref=pages_you_manage", 
                    title: "Facebook",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    ),
                    color: "hover:bg-blue-600"
                  },
                  { 
                    href: "https://www.youtube.com/channel/UCWYAyDdKK_p_jF8yz_UfLHQ", 
                    title: "YouTube",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    ),
                    color: "hover:bg-red-600"
                  },
                  { 
                    href: "https://www.linkedin.com/company/americanislamicdiversity", 
                    title: "LinkedIn",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    ),
                    color: "hover:bg-blue-700"
                  }
                ].map((social, index) => (
                  <a 
                    key={index}
                    href={social.href} 
                    title={social.title}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-white transition-all duration-300 transform hover:scale-110 ${social.color}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>



          </div>
        </div>

        {/* Bottom Section with Baraem Al-Nour Branding */}
        <div className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row justify-center gap-0 sm:gap-28 items-center space-y-6 lg:space-y-0">
              
              {/* Baraem Al-Nour Brand */}
              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img src={baraemLogo} alt="Baraem Al-Nour Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">براعم النور</h3>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Baraem Al-Nour</p>
                </div>
              </div>
              
              {/* Center Links */}
                <a 
                  href="https://americanislamicdiversity.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <span className="mr-2">🌐</span>
                  Visit American Islamic Diversity
                </a>
                <p className="text-gray-400 text-sm">
                  © 2025 Baraem Al-Nour. All rights reserved.
                </p>
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;