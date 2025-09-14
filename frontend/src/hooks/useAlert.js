import { useState, useCallback } from 'react';

const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    buttonText: 'OK'
  });

  const showAlert = useCallback(({
    title,
    message,
    type = 'info',
    buttonText = 'OK'
  }) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      buttonText
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  return {
    alertState,
    showAlert,
    hideAlert
  };
};

export default useAlert;
