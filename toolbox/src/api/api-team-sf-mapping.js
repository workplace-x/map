import express from 'express';
import { createClient } from '@supabase/supabase-js';
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.get('/', async (req, res) => {
  const { teamId } = req.query;
  const { data, error } = await supabase
    .from('team_salesforce_accounts')
    .select('salesforce_account_id, salesforce_account:salesforce_account_id ( * )')
    .eq('team_id', teamId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
});

router.post('/', async (req, res) => {
  const { teamId } = req.query;
  const { salesforceAccountIds } = req.body;
  if (!Array.isArray(salesforceAccountIds)) return res.status(400).json({ error: 'salesforceAccountIds must be an array' });
  const inserts = salesforceAccountIds.map((salesforceAccountId) => ({
    team_id: teamId,
    salesforce_account_id: salesforceAccountId,
  }));
  const { error } = await supabase.from('team_salesforce_accounts').upsert(inserts, { onConflict: 'team_id,salesforce_account_id' });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

router.delete('/', async (req, res) => {
  const { teamId } = req.query;
  const { salesforceAccountId } = req.body;
  if (!salesforceAccountId) return res.status(400).json({ error: 'Missing salesforceAccountId' });
  const { error } = await supabase
    .from('team_salesforce_accounts')
    .delete()
    .eq('team_id', teamId)
    .eq('salesforce_account_id', salesforceAccountId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

router.put('/', async (req, res) => {
  const { teamId } = req.query;
  const { salesforceAccountIds } = req.body;
  if (!teamId || !Array.isArray(salesforceAccountIds)) return res.status(400).json({ error: 'teamId and salesforceAccountIds required' });
  // Remove all, then add new
  const { error: delError } = await supabase.from('team_salesforce_accounts').delete().eq('team_id', teamId);
  if (delError) return res.status(500).json({ error: delError.message });
  for (const sfAccountId of salesforceAccountIds) {
    const { error: insError } = await supabase.from('team_salesforce_accounts').insert([{ team_id: teamId, salesforce_account_id: sfAccountId }]);
    if (insError) return res.status(500).json({ error: insError.message });
  }
  res.json({ success: true });
});

export default router; 