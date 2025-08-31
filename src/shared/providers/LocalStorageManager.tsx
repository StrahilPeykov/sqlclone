import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocalStorageContextType {
  initialized: boolean;
  localStorage: Record<string, any>;
  setLocalStorage: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const LocalStorageContext = createContext<LocalStorageContextType>({
  initialized: false,
  localStorage: {},
  setLocalStorage: () => {},
});

export function useLocalStorageContext() {
  return useContext(LocalStorageContext);
}

interface LocalStorageManagerProps {
  children: ReactNode;
}

export function LocalStorageManager({ children }: LocalStorageManagerProps) {
  const [localStorage, setLocalStorage] = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);

  // Load localStorage on mount
  useEffect(() => {
    if (!initialized) {
      try {
        const storageData: Record<string, any> = {};
        
        // Load all localStorage items
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            try {
              const value = window.localStorage.getItem(key);
              if (value) {
                storageData[key] = JSON.parse(value);
              }
            } catch (error) {
              // If JSON parsing fails, store as string
              storageData[key] = window.localStorage.getItem(key);
            }
          }
        }
        
        setLocalStorage(storageData);
        setInitialized(true);
      } catch (error) {
        console.error('Failed to load localStorage:', error);
        setInitialized(true);
      }
    }
  }, [initialized]);

  return (
    <LocalStorageContext.Provider
      value={{
        initialized,
        localStorage,
        setLocalStorage,
      }}
    >
      {children}
    </LocalStorageContext.Provider>
  );
}

// Hook for using localStorage with reactive updates
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const { initialized, localStorage, setLocalStorage } = useLocalStorageContext();
  
  const setValue = React.useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setLocalStorage((prevStorage) => {
        const currentValue = prevStorage[key] ?? initialValue;
        const valueToStore = typeof newValue === 'function' 
          ? (newValue as (prev: T) => T)(currentValue)
          : newValue;

        // Update browser localStorage
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error(`Failed to save to localStorage key "${key}":`, error);
        }

        return {
          ...prevStorage,
          [key]: valueToStore,
        };
      });
    },
    [key, initialValue, setLocalStorage]
  );

  const value = localStorage[key] ?? initialValue;
  
  return [value, setValue];
}

// Hook for getting a localStorage value without setting up a setter
export function useLocalStorageValue<T>(key?: string): T | Record<string, any> {
  const { localStorage } = useLocalStorageContext();
  
  if (!key) {
    return localStorage;
  }
  
  return localStorage[key];
}

// Hook to check if localStorage is initialized
export function useIsLocalStorageInitialized(): boolean {
  return useLocalStorageContext().initialized;
}