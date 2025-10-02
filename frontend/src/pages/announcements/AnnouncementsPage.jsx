import { useState } from 'react';
import { MessageSquare, Video, Megaphone } from 'lucide-react';
import AnnouncementsPostsTab from '../../components/common/announcements/AnnouncementsPostsTab';
import AnnouncementsZoomTab from '../../components/common/announcements/AnnouncementsZoomTab';

const AnnouncementsPage = ({ currentUser, theme }) => {
  const [activeTab, setActiveTab] = useState('posts');

  const tabs = [
    { id: 'posts', name: 'Posts', icon: MessageSquare },
    { id: 'zoom', name: 'Zoom Meetings', icon: Video },
  ];

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm sm:text-base text-gray-600">Stay updated with the latest announcements and meetings</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${activeTab === tab.id
                      ? `text-${theme.primary}-600 border-b-2 border-${theme.primary}-600 bg-${theme.primaryLight}`
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-2 sm:p-4 flex-1 overflow-y-auto">
          {activeTab === 'posts' && (
            <AnnouncementsPostsTab currentUser={currentUser} theme={theme} />
          )}
          {activeTab === 'zoom' && (
            <AnnouncementsZoomTab currentUser={currentUser} theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
