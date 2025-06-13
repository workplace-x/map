import express from 'express';
import { createClient } from '@supabase/supabase-js';
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.get('/', async (req, res) => {
  const { teamId } = req.query;
  const { data, error } = await supabase
    .from('team_erp_accounts')
    .select('erp_account_id, erp_account:erp_account_id ( * )')
    .eq('team_id', teamId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
});

router.post('/', async (req, res) => {
  const { teamId } = req.query;
  const { erpAccountIds } = req.body;
  if (!Array.isArray(erpAccountIds)) return res.status(400).json({ error: 'erpAccountIds must be an array' });
  const inserts = erpAccountIds.map((erpAccountId) => ({
    team_id: teamId,
    erp_account_id: erpAccountId,
  }));
  const { error } = await supabase.from('team_erp_accounts').upsert(inserts, { onConflict: 'team_id,erp_account_id' });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

router.delete('/', async (req, res) => {
  const { teamId } = req.query;
  const { erpAccountId } = req.body;
  if (!erpAccountId) return res.status(400).json({ error: 'Missing erpAccountId' });
  const { error } = await supabase
    .from('team_erp_accounts')
    .delete()
    .eq('team_id', teamId)
    .eq('erp_account_id', erpAccountId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

router.put('/', async (req, res) => {
  const { teamId } = req.query;
  const { erpAccountIds } = req.body;
  if (!teamId || !Array.isArray(erpAccountIds)) return res.status(400).json({ error: 'teamId and erpAccountIds required' });
  // Remove all, then add new
  const { error: delError } = await supabase.from('team_erp_accounts').delete().eq('team_id', teamId);
  if (delError) return res.status(500).json({ error: delError.message });
  for (const erpAccountId of erpAccountIds) {
    const { error: insError } = await supabase.from('team_erp_accounts').insert([{ team_id: teamId, erp_account_id: erpAccountId }]);
    if (insError) return res.status(500).json({ error: insError.message });
  }
  res.json({ success: true });
});

export default router; 