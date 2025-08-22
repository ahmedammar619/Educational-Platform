const ZoomTab = ({ currentUser, theme }) => {
  // Role-based access control functions
  const canManageZoom = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  };

  return (
    <div className="space-y-6">
      {/* Zoom Content */}
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Zoom Meetings</h3>
        <p className="text-gray-600 mb-6">Schedule and manage your virtual class sessions</p>

        {/* Zoom Actions */}
        {canManageZoom() ? (
          <div className="flex gap-3 justify-center">
            <button className={`px-6 py-3 border-2 border-${theme.primary}-600 text-${theme.primary}-600 rounded-lg hover:bg-${theme.primaryLight} transition-colors flex items-center gap-2`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Meeting
            </button>
            <button className={`px-6 py-3 border-2 border-${currentUser?.role === 'admin' ? 'blue' : 'green'}-600 text-${currentUser?.role === 'admin' ? 'blue' : 'green'}-600 rounded-lg hover:bg-${currentUser?.role === 'admin' ? 'blue' : 'green'}-50 transition-colors flex items-center gap-2`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Meeting
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-sm">Contact your teacher or administrator to schedule meetings</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoomTab;
