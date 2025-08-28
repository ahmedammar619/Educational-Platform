// Loading state management utility
import { useState, useEffect } from 'react';

export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

export const createLoadingState = (initialState = LoadingStates.IDLE) => ({
  state: initialState,
  error: null,
  data: null
});

export const setLoading = (loadingState) => ({
  ...loadingState,
  state: LoadingStates.LOADING,
  error: null
});

export const setSuccess = (loadingState, data = null) => ({
  ...loadingState,
  state: LoadingStates.SUCCESS,
  error: null,
  data
});

export const setError = (loadingState, error) => ({
  ...loadingState,
  state: LoadingStates.ERROR,
  error,
  data: null
});

export const isLoading = (loadingState) => loadingState.state === LoadingStates.LOADING;
export const isSuccess = (loadingState) => loadingState.state === LoadingStates.SUCCESS;
export const isError = (loadingState) => loadingState.state === LoadingStates.ERROR;
export const isIdle = (loadingState) => loadingState.state === LoadingStates.IDLE;

// Hook for managing loading states
export const useLoadingState = (initialState = LoadingStates.IDLE) => {
  const [loadingState, setLoadingState] = useState(createLoadingState(initialState));

  const setLoading = () => setLoadingState(prev => setLoading(prev));
  const setSuccess = (data) => setLoadingState(prev => setSuccess(prev, data));
  const setError = (error) => setLoadingState(prev => setError(prev, error));
  const reset = () => setLoadingState(createLoadingState(initialState));

  return {
    ...loadingState,
    setLoading,
    setSuccess,
    setError,
    reset,
    isLoading: isLoading(loadingState),
    isSuccess: isSuccess(loadingState),
    isError: isError(loadingState),
    isIdle: isIdle(loadingState)
  };
};

// Async operation wrapper with loading states
export const withLoadingState = async (operation, loadingStateSetter) => {
  try {
    loadingStateSetter.setLoading();
    const result = await operation();
    loadingStateSetter.setSuccess(result);
    return result;
  } catch (error) {
    loadingStateSetter.setError(error);
    throw error;
  }
};

// Retry mechanism for failed operations
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Debounced loading state for search operations
export const useDebouncedLoading = (delay = 300) => {
  const [loadingState, setLoadingState] = useState(createLoadingState());
  const [debounceTimer, setDebounceTimer] = useState(null);

  const setDebouncedLoading = (operation) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingState(prev => setLoading(prev));
        const result = await operation();
        setLoadingState(prev => setSuccess(prev, result));
        return result;
      } catch (error) {
        setLoadingState(prev => setError(prev, error));
        throw error;
      }
    }, delay);

    setDebounceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    ...loadingState,
    setDebouncedLoading,
    isLoading: isLoading(loadingState),
    isSuccess: isSuccess(loadingState),
    isError: isError(loadingState),
    isIdle: isIdle(loadingState)
  };
};
