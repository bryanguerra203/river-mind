import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';

// Custom AsyncStorage wrapper with logging
const CustomAsyncStorage = {
  async getItem(key: string) {
    const item = await AsyncStorage.getItem(key);
    return item;
  },
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

// Replace these with your Supabase project URL and anon key
export const supabaseUrl = 'https://xbaxrjvapgfyythsaqib.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiYXhyanZhcGdmeXl0aHNhcWliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTQ1NzEsImV4cCI6MjA2NDczMDU3MX0.R6DmiLXCI3L5v1NjN0_9lnEX8TDwHpt3nVV6OfM4XuE';

// Create a custom fetch function with retry logic
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Check network connectivity before making the request
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        throw new Error('No network connection');
      }

      const response = await fetch(input, init);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Supabase request failed:', {
          status: response.status,
          statusText: response.statusText,
          error,
          attempt: retryCount + 1,
          url: input,
          method: init?.method || 'GET'
        });
        
        // If it's a server error (5xx), retry
        if (response.status >= 500) {
          retryCount++;
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error('Network error:', {
        error,
        attempt: retryCount + 1,
        url: input,
        method: init?.method || 'GET'
      });
      
      // If it's a network error, retry
      if (error instanceof TypeError && error.message === 'Network request failed') {
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts`);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CustomAsyncStorage, // Use the custom storage with logging
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
});

// Add function to verify auth state
export const verifyAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session for auth verification:", error);
      throw error;
    }
    
    return {
      isAuthenticated: !!session,
      userId: session?.user?.id,
      session
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      isAuthenticated: false,
      userId: null,
      session: null
    };
  }
}; 