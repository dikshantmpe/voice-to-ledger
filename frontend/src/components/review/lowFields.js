// Which fields should be highlighted on the review card?
// (The AI gives one overall confidence, so we highlight the fields that are
//  missing / flagged, and also party + accounts when overall confidence is low.
//  If the backend later sends per-field confidence, replace this function only.)
export const LOW_CONF = 0.75;

export function lowFields(e) {
  const low = e.conf < LOW_CONF;
  return {
    date: false,
    party: !e.party || e.flags.includes('Missing customer name') || (low && !!e.party),
    debit: !e.lines.length || low,
    credit: !e.lines.length || low,
    amount: !e.amount || e.flags.includes('Missing amount'),
    narration: low,
  };
}
