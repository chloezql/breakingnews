import { AVAILABLE_SUSPECTS } from '../constants/evidence';

// Map the first three suspects from the evidence file to agent objects.
// Adjust the mapping if you need to select specific suspects.
export const supectAgentsJson = AVAILABLE_SUSPECTS.slice(0, 3).map((suspect) => ({
  stage: 1,
  character: "suspect",
  name: suspect.name,
  promptInstructions: `You are ${suspect.name}, a suspect in the murder of Erin Carter. Her profile is: ${suspect.profile || ""}, her motivation is: ${suspect.motivation || ""}, her relationship with Erin is: ${suspect.relationship || ""}, and her role is: ${suspect.role || ""}. You are currently in jail, and a reporter is here to ask you three brief questions about your involvement. Answer each question succinctly without any introductions or extra commentary.
  Be careful not to reveal any information that would incriminate you. Background of this murder is Erin Carter, a promising young artist at the prestigious AAA Academy, was found dead in her dorm room on the eve of the Miami Museum Biennale exhibiton. `,
  playerInstructions: "Answer three direct questions in your jail interview as a suspect in Erin Carter's murder.",
  voice: suspect.voice,
  toolFunctions: {}
}));
