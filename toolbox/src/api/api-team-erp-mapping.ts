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
    // List all ERP accounts mapped to this team
    const { data, error } = await supabase
      .from('team_erp_accounts')
      .select('erp_account_id, erp_account:erp_account_id ( * )')
      .eq('team_id', teamId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    // Add one or more ERP accounts to this team
    const { erpAccountIds } = req.body; // array of salesperson_id
    if (!Array.isArray(erpAccountIds)) return res.status(400).json({ error: 'erpAccountIds must be an array' });
    const inserts = erpAccountIds.map((erpAccountId: string) => ({
      team_id: teamId,
      erp_account_id: erpAccountId,
    }));
    const { error } = await supabase.from('team_erp_accounts').upsert(inserts, { onConflict: 'team_id,erp_account_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    // Remove a mapping
    const { erpAccountId } = req.body;
    if (!erpAccountId) return res.status(400).json({ error: 'Missing erpAccountId' });
    const { error } = await supabase
      .from('team_erp_accounts')
      .delete()
      .eq('team_id', teamId)
      .eq('erp_account_id', erpAccountId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 