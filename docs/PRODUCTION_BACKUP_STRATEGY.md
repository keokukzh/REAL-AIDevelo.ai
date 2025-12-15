# Production Backup Strategy

This document outlines the backup strategy for AIDevelo.ai production deployment.

## Supabase Database Backups

### Automatic Backups

Supabase provides automatic daily backups for all projects:

- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 7 days of daily backups
- **Format**: PostgreSQL dump files
- **Storage**: Managed by Supabase

### Manual Backups

You can create manual backups through:

1. **Supabase Dashboard**:
   - Navigate to Project Settings → Database → Backups
   - Click "Create Backup"
   - Backups are stored for 7 days

2. **Supabase CLI**:
   ```bash
   supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

### Backup Restoration

To restore from a backup:

1. **Via Supabase Dashboard**:
   - Go to Backups section
   - Select the backup to restore
   - Click "Restore" (creates a new database)

2. **Via CLI**:
   ```bash
   supabase db reset
   psql $DATABASE_URL < backup-20240115.sql
   ```

## Critical Data to Backup

### Database Tables

Priority tables that should be backed up regularly:

1. **User Data**:
   - `users`
   - `organizations`
   - `locations`

2. **Agent Configuration**:
   - `agent_configs`
   - `phone_numbers`
   - `google_calendar_integrations`

3. **Call Logs**:
   - `call_logs` (can be large, consider archiving old logs)

4. **RAG Documents**:
   - `rag_documents` (metadata)
   - Note: Actual embeddings are in Qdrant, not Supabase

### External Services

1. **Qdrant Vector Database**:
   - Collections are per-location (`location_${locationId}`)
   - Consider exporting collections periodically
   - Qdrant cloud provides automatic backups (if using cloud)

2. **Twilio**:
   - Phone number configurations are stored in Twilio
   - Webhook URLs are configured in Twilio
   - No direct backup needed (Twilio manages this)

3. **ElevenLabs**:
   - Agent configurations are stored in ElevenLabs
   - Backed up via API: `GET /v1/convai/agents/{agent_id}`

## Backup Verification

### Weekly Verification Checklist

- [ ] Verify latest backup exists in Supabase dashboard
- [ ] Test restore process on staging environment (monthly)
- [ ] Verify backup file size is reasonable (not empty)
- [ ] Check backup timestamp is recent (within 24 hours)

### Monthly Full Backup Test

1. Create a test database
2. Restore from latest backup
3. Verify data integrity:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM agent_configs;
   SELECT COUNT(*) FROM call_logs;
   ```
4. Test critical queries to ensure data is accessible

## Disaster Recovery Plan

### Recovery Time Objective (RTO)
- **Target**: < 4 hours
- **Process**: Restore from latest backup + reconfigure services

### Recovery Point Objective (RPO)
- **Target**: < 24 hours (daily backups)
- **Acceptable Data Loss**: Up to 24 hours of data

### Recovery Steps

1. **Assess Damage**: Identify what data/services are affected
2. **Restore Database**: Use latest Supabase backup
3. **Reconfigure Services**:
   - Update Twilio webhooks
   - Verify ElevenLabs agent IDs
   - Test Qdrant connectivity
4. **Verify Functionality**: Run smoke tests on critical endpoints
5. **Notify Users**: If extended downtime, notify affected users

## Backup Retention Policy

- **Daily Backups**: 7 days
- **Weekly Backups**: 4 weeks (manual)
- **Monthly Backups**: 12 months (manual, archived)

## Monitoring

Set up alerts for:
- Backup failures (Supabase will notify)
- Unusual backup sizes (may indicate data issues)
- Backup age (if backup is > 25 hours old, investigate)

## Best Practices

1. **Never delete backups manually** unless older than retention policy
2. **Test restore process** quarterly
3. **Document any manual data changes** that occur between backups
4. **Keep backup credentials secure** (separate from production credentials)
5. **Monitor backup storage costs** (Supabase includes backups in plan)

## Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
