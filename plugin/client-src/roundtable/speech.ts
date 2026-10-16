import type { StageParticipant, StageRun } from './layout';

export function latestSpeech(p: StageParticipant, run: StageRun | null): string {
  if (!run) return '';
  const bb = run.blackboard;
  const parts: string[] = [];
  for (const proposal of bb.proposals ?? []) if (proposal.profileId === p.profileId) parts.push(proposal.summary + '\n' + proposal.plan);
  for (const review of bb.reviews ?? []) if (review.reviewerProfileId === p.profileId) parts.push([...(review.pros ?? []), ...(review.cons ?? []), ...(review.suggestions ?? [])].join('\n'));
  for (const decision of bb.decisions ?? []) if (decision.decisionMakerProfileId === p.profileId) parts.push(decision.finalDirection + '\n' + decision.rationale);
  if (bb.plan?.planBuilderProfileId === p.profileId) parts.push(bb.plan.steps.map((s) => s.description).join('\n'));
  if (bb.execution?.executorProfileId === p.profileId) parts.push(bb.execution.outputs.map((o) => o.rendered || '').join('\n'));
  if (bb.verification?.verifierProfileId === p.profileId) parts.push((bb.verification as any).summary || '验证已结束');
  if (p.role === 'decisionMaker' && bb.finalAnswer) parts.push(bb.finalAnswer);
  return parts.filter(Boolean).at(-1) || '';
}
