import { supabaseAdmin } from '../src/db/supabase';
import { StructuredLoggingService } from '../src/services/loggingService';

async function registerDefaultNumber() {
  const phoneNumber = '+19522951346';

  // Find first user and their location
  const { data: users, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error('No users found to link the number to.');
    return;
  }

  const user = users[0];

  // Find or create organization
  let { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (!org) {
    const { data: newOrg } = await supabaseAdmin
      .from('organizations')
      .insert({
        owner_user_id: user.id,
        name: 'Default Org',
      })
      .select()
      .single();
    org = newOrg;
  }

  // Find or create location
  let { data: location } = await supabaseAdmin
    .from('locations')
    .select('id')
    .eq('organization_id', org!.id)
    .maybeSingle();

  if (!location) {
    const { data: newLoc } = await supabaseAdmin
      .from('locations')
      .insert({
        organization_id: org!.id,
        name: 'Main Location',
      })
      .select()
      .single();
    location = newLoc;
  }

  // Register number
  const { error: upsertError } = await supabaseAdmin.from('phone_numbers').upsert(
    {
      location_id: location!.id,
      e164: phoneNumber,
      status: 'active',
      twilio_number_sid: 'PN_FINALE_CONFIG',
      customer_public_number: phoneNumber,
    },
    { onConflict: 'e164' },
  );

  if (upsertError) {
    console.error('Failed to register number:', upsertError);
  } else {
    console.log(
      `Successfully registered ${phoneNumber} for user ${user.email} at location ${location!.id}`,
    );
  }
}

registerDefaultNumber().catch(console.error);
