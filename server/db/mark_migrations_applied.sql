-- Mark migrations as applied to prevent re-run by migration runner
-- Run this in Supabase SQL Editor after you've manually executed the SQL migration files.

INSERT INTO public.schema_migrations (name) VALUES
('001_create_users_table.sql'),
('002_create_agents_table.sql'),
('003_create_purchases_table.sql'),
('004_create_rag_documents_table.sql'),
('005_create_call_history_table.sql'),
('006_create_phone_numbers_table.sql'),
('007_add_agent_metadata.sql'),
('008_update_users_to_uuid.sql'),
('009_enhance_rag_documents_for_knowledge.sql'),
('010_add_logging_and_audit_tables.sql'),
('011_fix_agent_call_metrics_security.sql'),
('014_add_performance_indexes.sql'),
('015_add_provider_to_calendar_integrations.sql'),
('016_migrate_rag_documents_to_location.sql'),
('017_create_scheduled_reports.sql'),
('018_add_additional_performance_indexes.sql'),
('019_create_multichannel_tables.sql'),
('020_ensure_rag_documents_complete.sql'),
('021_add_voice_agent_tables.sql'),
('022_create_webdesign_requests.sql'),
('023_create_leads_table.sql'),
('20250117_add_booking_greeting_fields_to_agent_configs.sql'),
('20251213_add_business_type_to_agent_configs.sql')
ON CONFLICT (name) DO NOTHING;

-- Verify:
-- SELECT name, applied_at FROM public.schema_migrations ORDER BY applied_at;
