import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';

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
      console.log('Network status:', {
        isConnected: netInfo.isConnected,
        type: netInfo.type,
        isInternetReachable: netInfo.isInternetReachable,
        details: netInfo.details
      });

      if (!netInfo.isConnected) {
        throw new Error('No network connection');
      }

      console.log('Making request to:', input);
      const response = await fetch(input, init);
      console.log('Response status:', response.status);
      
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
    storage: AsyncStorage,
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
    if (error) throw error;
    
    console.log('Auth state:', {
      isAuthenticated: !!session,
      userId: session?.user?.id,
      accessToken: session?.access_token ? 'present' : 'missing'
    });
    
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