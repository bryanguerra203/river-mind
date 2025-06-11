-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    gameType TEXT NOT NULL,
    sessionType TEXT NOT NULL,
    locationType TEXT NOT NULL,
    location TEXT NOT NULL,
    stakes TEXT NOT NULL,
    buyIn DECIMAL(10,2) NOT NULL,
    cashOut DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    notes TEXT,
    tags TEXT[],
    status TEXT NOT NULL DEFAULT 'completed',
    startTime TIMESTAMP WITH TIME ZONE,
    endTime TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own sessions
CREATE POLICY "Users can only access their own sessions"
    ON sessions
    FOR ALL
    USING (auth.uid() = user_id);

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updatedAt
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 