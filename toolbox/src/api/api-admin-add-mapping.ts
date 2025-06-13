import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
      }
    }
  }
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { profileId, erpSalespersonId, salesforceUserId } = req.body;
  console.log('add-mapping request body:', req.body);
  if (!profileId) return res.status(400).json({ error: 'Missing profileId' });
  if ((erpSalespersonId && salesforceUserId) || (!erpSalespersonId && !salesforceUserId)) {
    return res.status(400).json({ error: 'Must provide exactly one of erpSalespersonId or salesforceUserId' });
  }
  try {
    if (erpSalespersonId) {
      // Remove any existing mapping for this ERP ID
      await supabase.from('user_account_mapping').delete().eq('erp_salesperson_id', erpSalespersonId);
      // Add new mapping
      await supabase.from('user_account_mapping').insert({ supabase_user_id: profileId, erp_salesperson_id: erpSalespersonId });
    } else if (salesforceUserId) {
      // Remove any existing mapping for this Salesforce ID
      await supabase.from('user_account_mapping').delete().eq('salesforce_user_id', salesforceUserId);
      // Add new mapping
      await supabase.from('user_account_mapping').insert({ supabase_user_id: profileId, salesforce_user_id: salesforceUserId });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
} 