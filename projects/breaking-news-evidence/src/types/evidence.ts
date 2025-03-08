export interface Evidence {
  id: number;
  name: string;
  description: string;
  image: string;
  type: 'physical' | 'document' | 'testimony';
}

export const EVIDENCE_ITEMS: Evidence[] = [
  // General Evidence
  {
    id: 1,
    name: "Police Photographs",
    description: "Photos showing scratches and bruises on Erin's body, head injury with minor bleeding",
    image: "erin_hurt.png",
    type: "physical"
  },
  {
    id: 2,
    name: "Forensic Report",
    description: "Death occurred between 12-1 AM. Excessive alcohol, morphine, and strong sedatives in blood. Cause of death: respiratory depression from drug combination",
    image: "Tox.png",
    type: "document"
  },
  {
    id: 3,
    name: "Text Messages",
    description: "Texts between Erin and her friend revealing her relationships: contempt for Lucy, viewing boyfriend as a tool, and feeling her mentor relies on her for fame",
    image: "Erin_message1.png",
    type: "document"
  },
  {
    id: 4,
    name: "Erin's Email",
    description: "Email to biennial organizers with updated artist bio removing her mentor's name, claiming success was solely due to her talent and effort",
    image: "Erin_remove_hart_email.png",
    type: "document"
  },
  {
    id: 5,
    name: "Medical Records",
    description: "Shows Erin needed melatonin daily to sleep",
    image: "erin_eats_melatonin.png",
    type: "document"
  },
  {
    id: 6,
    name: "Melatonin Bottle",
    description: "Lab analysis shows pills in the bottle don't match melatonin ingredients",
    image: "not_melatonin.png",
    type: "physical"
  },
  {
    id: 7,
    name: "Sleep Apnea Evidence",
    description: "Documentation proving Erin suffered from sleep apnea syndrome",
    image: "erin_sleep_apnea.png",
    type: "document"
  },
  
  // Dr. Hart Evidence
  {
    id: 8,
    name: "Prescription Records",
    description: "Shows Dr. Hart visited a clinic and prescribed powerful sleeping pills",
    image: "Dr.Hart_Prescription.png",
    type: "document"
  },
  {
    id: 9,
    name: "Device Search History",
    description: "Dr. Hart's computer search history includes queries about certain medications",
    image: "Browser-medication.png",
    type: "document"
  },
  {
    id: 10,
    name: "Cafe Surveillance",
    description: "Dr. Hart met Erin at a cafe during the day, celebrating her biennial selection. They appeared happy",
    image: "hart_and_erin_meet.png",
    type: "physical"
  },
  {
    id: 11,
    name: "Phone Records",
    description: "Shows Dr. Hart had a 20-minute call with Lucy at 9:00 PM",
    image: "call.png",
    type: "document"
  },
  
  // Kevin Evidence
  {
    id: 12,
    name: "Dorm Surveillance",
    description: "Kevin was recorded waiting for Erin outside her dorm at 8:35 PM and driving away with her",
    image: "kevin_wait_for_erin.png",
    type: "physical"
  },
  {
    id: 13,
    name: "Morphine Bottle",
    description: "Half-empty morphine prescription bottle found in Kevin's bathroom, prescribed to Kevin",
    image: "morphine.png",
    type: "physical"
  },
  {
    id: 14,
    name: "Location Data",
    description: "Apple Find My Friends shows both Erin and Kevin's phones at Kevin's house from 9:00 PM until 7:30 AM the next day",
    image: "kevin_erin_same_gps.png",
    type: "document"
  },
  {
    id: 15,
    name: "Recycling Bin",
    description: "Kevin's recycling bin full of alcohol bottles with liquid not yet dry, suggesting recent disposal",
    image: "trash_alcohol.png",
    type: "physical"
  },
  
  // Lucy Evidence
  {
    id: 16,
    name: "Broken Plaster Statue",
    description: "Broken statue on Erin's floor with blood matching Erin's DNA",
    image: "sculpture_with_blood.png",
    type: "physical"
  },
  {
    id: 17,
    name: "Broken Nail Tip",
    description: "Half of a broken artificial nail matching Lucy's nail pattern found in Erin's room",
    image: "fingernail.png",
    type: "physical"
  },
  {
    id: 18,
    name: "Social Media Post",
    description: "Lucy posted hateful content about Erin at 7:30 PM, deleted three hours later. Photo shows Lucy with a broken nail",
    image: "lucy-ins-post.png",
    type: "document"
  },
  {
    id: 19,
    name: "Cleaning Supplies Receipt",
    description: "Shows Lucy purchased cleaning supplies after the incident",
    image: "walmart_purchase_cleaning_tools.png",
    type: "document"
  }
];