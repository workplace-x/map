import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { azureId, teamIds } = req.body;
  if (!azureId || !Array.isArray(teamIds)) return res.status(400).json({ error: 'Missing azureId or teamIds' });
  try {
    // Remove all existing team mappings for this user
    await supabase.from('team_members').delete().eq('user_id', azureId);
    // Add new mappings
    if (teamIds.length > 0) {
      const inserts = teamIds.map((team_id: string) => ({ user_id: azureId, team_id }));
      await supabase.from('team_members').insert(inserts);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
} 