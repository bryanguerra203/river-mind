import { supabase } from './supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to get the current user (this will test authentication)
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth test:', { authData, authError });

    // Try to make a simple query to the sessions table
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log('Database connection test successful:', data);
    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Connection test error:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}; 