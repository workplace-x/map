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
  const { teamId } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('team_salesforce_accounts')
      .select('salesforce_account_id, salesforce_account:salesforce_account_id ( * )')
      .eq('team_id', teamId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { salesforceAccountIds } = req.body; // array of salesforce_user_id
    if (!Array.isArray(salesforceAccountIds)) return res.status(400).json({ error: 'salesforceAccountIds must be an array' });
    const inserts = salesforceAccountIds.map((salesforceAccountId: string) => ({
      team_id: teamId,
      salesforce_account_id: salesforceAccountId,
    }));
    const { error } = await supabase.from('team_salesforce_accounts').upsert(inserts, { onConflict: 'team_id,salesforce_account_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { salesforceAccountId } = req.body;
    if (!salesforceAccountId) return res.status(400).json({ error: 'Missing salesforceAccountId' });
    const { error } = await supabase
      .from('team_salesforce_accounts')
      .delete()
      .eq('team_id', teamId)
      .eq('salesforce_account_id', salesforceAccountId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 