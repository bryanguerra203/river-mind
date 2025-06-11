-- Drop existing table if it exists
DROP TABLE IF EXISTS sessions;

-- Create sessions table with lowercase column names
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    gametype TEXT NOT NULL,
    sessiontype TEXT NOT NULL,
    locationtype TEXT NOT NULL,
    location TEXT NOT NULL,
    stakes TEXT NOT NULL,
    buyin DECIMAL(10,2) NOT NULL,
    cashout DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL,
    starttime TIMESTAMP WITH TIME ZONE,
    endtime TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX sessions_user_id_idx ON sessions(user_id);

-- Create index on date for faster sorting
CREATE INDEX sessions_date_idx ON sessions(date);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own sessions
CREATE POLICY "Users can only access their own sessions"
    ON sessions
    FOR ALL
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own sessions
CREATE POLICY "Users can insert their own sessions"
    ON sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
    ON sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own sessions
CREATE POLICY "Users can delete their own sessions"
    ON sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 