// Utility functions for quest ID management with integer IDs

// For integer IDs, we can simply return the ID as is since they're already sequential
export function getNumericId(id: number): number {
  return id;
}

// Find quest by numeric ID (now just a direct lookup since IDs are integers)
export async function getQuestByNumericId(numericId: number, supabase: any): Promise<any | null> {
  try {
    const { data: quest, error } = await supabase
      .from('quests')
      .select('*')
      .eq('id', numericId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching quest:', error);
      return null;
    }

    return quest;
  } catch (error) {
    console.error('Error in getQuestByNumericId:', error);
    return null;
  }
}

// Check if input is a valid quest ID format
export function isValidQuestId(input: string): boolean {
  const cleaned = input.replace(/^#/, ''); // Remove # prefix if present
  return /^\d+$/.test(cleaned) && parseInt(cleaned, 10) > 0;
}

// Parse quest ID input (handles both #123 and 123 formats)
export function parseQuestId(input: string): number | null {
  const cleanInput = input.replace(/^#/, ''); // Remove # prefix if present
  
  if (/^\d+$/.test(cleanInput)) {
    const id = parseInt(cleanInput, 10);
    return id > 0 ? id : null;
  }
  
  return null;
}
