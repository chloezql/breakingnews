export interface Evidence {
  id: number;
  name: string;
  description: string;
  image: string;
  type: 'physical' | 'document' | 'testimony';
  hint: string;
}

export const EVIDENCE_ITEMS: Evidence[] = [
  // General Evidence
  {
    id: 1,
    name: "Police Photographs",
    description: "Photos showing scratches and bruises on Erin's body, head injury with minor bleeding.",
    image: "erin_hurt.png",
    type: "physical",
    hint: "Signs of a struggle... but when did it happen?"
  },
  {
    id: 2,
    name: "Forensic Report",
    description: "Death occurred between 12-1 AM. Excessive alcohol, morphine, and strong sedatives found in blood.",
    image: "Tox.png",
    type: "document",
    hint: "A deadly cocktail of substances... was it accidental?"
  },
  {
    id: 3,
    name: "Text Messages",
    description: "Texts between Erin and her friend revealing her relationships: contempt for Lucy, viewing boyfriend as a tool, and feeling her mentor relies on her for fame",
    image: "long-msg.png",
    type: "document",
    hint: "Erin's private messages reveal her true feelings about those close to her..."
  },
  {
    id: 4,
    name: "Erin's Email",
    description: "Email to biennial organizers with updated artist bio removing her mentor's name, claiming success was solely due to her talent and effort",
    image: "Erin_remove_hart_email.png",
    type: "document",
    hint: "What did she update?"
  },
  {
    id: 5,
    name: "Medical Records",
    description: "Erin needed melatonin daily to sleep. ",
    image: "erin_eats_melatonin.png",
    type: "document",
    hint: "She's on melatonin."
  },
  {
    id: 6,
    name: "Melatonin Bottle",
    description: "Lab analysis shows pills in the melatoninbottle don't match ingredients.",
    image: "not_melatonin.png",
    type: "physical",
    hint: "These pills aren't what the label claims..."
  },
  {
    id: 7,
    name: "Sleep Apnea Evidence",
    description: "Erin suffered from sleep apnea syndrome.",
    image: "erin_sleep_apnea.png",
    type: "document",
    hint: "What is Sleep Apnea Syndrome?"
  },
  
  // Dr. Hart Evidence
  {
    id: 8,
    name: "Prescription Records",
    description: "Dr. Hart has a prescription for a strong sleeping sedative pill.",
    image: "Dr.Hart_Prescription.png",
    type: "document",
    hint: "Why would a professor need such strong medication?"
  },
  {
    id: 9,
    name: "Hart Performance Review",
    description: "Dr.Hart performance review is not good, other professors may not like her.",
    image: "hart-perf-review.png",
    type: "document",
    hint: "Ouch, that's harsh."
  },
  {
    id: 10,
    name: "Cafe Surveillance",
    description: "Dr. Hart met Erin at a cafe during the day, they look serious.",
    image: "hart_and_erin_meet.png",
    type: "physical",
    hint: "When did they meet?"
  },
  {
    id: 11,
    name: "Hart Twitter Screenshot",
    description: "Dr.Hart kept a printed copy of a social media post criticizing her, with a sticky note",
    image: "hart-twitter.png",
    type: "document",
    hint: "What did she tweet about?"
  },
  
  // Kevin Evidence
  {
    id: 12,
    name: "Dorm Surveillance",
    description: "Kevin was recorded waiting for Erin outside her dorm at 8:35 PM and driving away with her.",
    image: "kevin_wait_for_erin.png",
    type: "physical",
    hint: "Was it Kevin?"
  },
  {
    id: 13,
    name: "Morphine Bottle",
    description: "Half-empty morphine prescription bottle found in Kevin's bathroom, prescribed to Kevin.",
    image: "morphine.png",
    type: "physical",
    hint: "Is Kevin on drugs?"
  },
  {
    id: 14,
    name: "Location Data",
    description: "Apple 'Find My' shows both Erin and Kevin's phones at Kevin's house from 9:00 PM until 7:30 AM the next day.",
    image: "kevin_erin_same_gps.png",
    type: "document",
    hint: "Together all night?"
  },
  {
    id: 15,
    name: "Recycling Bin",
    description: "Kevin's recycling bin full of alcohol bottles with liquid not yet dry.",
    image: "trash_alcohol.png",
    type: "physical",
    hint: "Someone could be really drunk. "
  },
  
  // Lucy Evidence
  {
    id: 16,
    name: "Broken Plaster Statue",
    description: "Broken statue on Erin's dorm floor with blood matching Erin's DNA.",
    image: "sculpture_with_blood.png",
    type: "physical",
    hint: "The blood matches Erin's DNA."
  },
  {
    id: 17,
    name: "Broken Nail Tip",
    description: "Half of a broken artificial nail matching Lucy's nail pattern found in Erin's room.",
    image: "fingernail.png",
    type: "physical",
    hint: "Is that ... a broken nail?"
  },
  {
    id: 18,
    name: "Social Media Post",
    description: "Lucy posted hateful content about Erin at 9:30 PM, deleted three hours later.",
    image: "lucy-ins-post.png",
    type: "document",
    hint: "What happened behind this post?"
  },
  {
    id: 19,
    name: "Cleaning Supplies Receipt",
    description: "Lucy purchased cleaning supplies after the incident.",
    image: "walmart_purchase_cleaning_tools.png",
    type: "document",
    hint: "Why did she need these?"
  }
];