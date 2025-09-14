import { useState, useCallback } from 'react';

const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonVariant: 'primary',
    onConfirm: null,
    isLoading: false
  });

  const showConfirmation = useCallback(({
    title,
    message,
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonVariant = 'primary',
    onConfirm
  }) => {
    setConfirmationState({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      confirmButtonVariant,
      onConfirm,
      isLoading: false
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false
    }));
  }, []);

  const setLoading = useCallback((loading) => {
    setConfirmationState(prev => ({
      ...prev,
      isLoading: loading
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (confirmationState.onConfirm) {
      setLoading(true);
      try {
        await confirmationState.onConfirm();
        hideConfirmation();
      } catch (error) {
        console.error('Confirmation action failed:', error);
        setLoading(false);
      }
    }
  }, [confirmationState.onConfirm, hideConfirmation, setLoading]);

  return {
    confirmationState,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    setLoading
  };
};

export default useConfirmation;
