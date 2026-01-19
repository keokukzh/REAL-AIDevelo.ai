-- Add system_prompt to agent_configs if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'system_prompt') THEN 
        ALTER TABLE agent_configs ADD COLUMN system_prompt TEXT; 
    END IF; 
END $$;
