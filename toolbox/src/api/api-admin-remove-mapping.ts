import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const { profileId, erpSalespersonId, salesforceUserId } = req.body;
  console.log('remove-mapping request body:', req.body);
  if (!profileId) return res.status(400).json({ error: 'Missing profileId' });
  if ((erpSalespersonId && salesforceUserId) || (!erpSalespersonId && !salesforceUserId)) {
    return res.status(400).json({ error: 'Must provide exactly one of erpSalespersonId or salesforceUserId' });
  }
  try {
    if (erpSalespersonId) {
      await supabase.from('user_account_mapping')
        .delete()
        .eq('supabase_user_id', profileId)
        .eq('erp_salesperson_id', erpSalespersonId);
    } else if (salesforceUserId) {
      await supabase.from('user_account_mapping')
        .delete()
        .eq('supabase_user_id', profileId)
        .eq('salesforce_user_id', salesforceUserId);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
} 