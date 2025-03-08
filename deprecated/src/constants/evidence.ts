export const AVAILABLE_EVIDENCE = [
  { id: 'paint_bucket', name: 'Red Paint Bucket', description: 'Paint bucket with traces of blood' },
  { id: 'knife', name: 'Missing Sculpture Knife', description: 'Bloodied knife found at scene' },
  { id: 'artwork', name: 'Final Artwork', description: 'Erin\'s "Fallen Angel" piece' },
  { id: 'social_post', name: 'Last Social Media Post', description: 'Erin\'s cryptic final post: "Some people will do anything to take credit for others\' work. The truth will come out."' },
  { id: 'unsent_email', name: 'Lucy\'s Draft Email', description: 'Unsent email from Lucy expressing concerns about academic integrity and exploitation of student work' },
  { id: 'financial_records', name: 'Financial Records', description: 'Academy financial documents showing irregular payments and discrepancies in art sales' }
];

export const AVAILABLE_SUSPECTS = [
  {
    id: 1,
    name: 'Lucy Marlow',
    role: 'The Roommate and Prime Suspect',
    profile: 'A foreign exchange student, introverted yet fiercely passionate about abstract art. Lucy\'s unconventional works often explore violent imagery, which fuels public speculation about her involvement in Erin\'s death.',
    motivation: 'To clear her name and salvage her career, though her evasive personality raises doubts.',
    relationship: 'Tense, as Erin often overshadowed Lucy\'s work while ridiculing her "pretentious" style.',
    image: './suspect-lucy.png',
    voice: 'coral'
  },
  {
    id: 2,
    name: 'Kevin Ortiz',
    role: 'The Witness and Opportunist',
    profile: 'Erin\'s classmate and sometimes collaborator, Kevin is a charming yet unreliable figure who thrives on drama. His accounts of the night of Erin\'s death are inconsistent, raising questions about his credibility.',
    motivation: 'To gain fame by staying in the spotlight, regardless of the truth. Kevin has a history of fabricating events for attention.',
    relationship: 'Complicated—they worked together on several projects, but Erin\'s refusal to share credit led to frequent arguments.',
    image: './suspect-kevin.png',
    voice: 'ash'
  },
  {
    id: 3,
    name: 'Professor Eleanor Hart',
    role: 'The Mentor with Secrets',
    profile: 'A well-respected figure at Lightwell Academy, Professor Hart is known for her sharp critiques and favoritism toward Erin. Her calm demeanor hides a manipulative side.',
    motivation: 'To protect her reputation and the academy\'s prestige at all costs. Professor Hart\'s proximity to both Erin and Lucy raises questions about her involvement.',
    relationship: 'Erin was her protégé, though Hart may have exploited Erin\'s talent for her own benefit.',
    image: './suspect-eleanor.png',
    voice: 'bella'
  }
];

export const AVAILABLE_WITNESSES = [
  { 
    id: 'linda',
    name: 'Linda Ortiz',
    image: './number-linda.png',
    audio: './audio/linda.mp3',
    phone: '528-465-2107', 
    identity: 'The sister of Kevin Ortiz',
    description: 'Kevin had a normal day. He came home around 7 to 8 p.m. while I was watching The Jimmy Show. Paint on his hands? Come on, that\'s usual. He\'s an oil painting major. My son would never hurt Erin. I\'ve said all I can. Please don\'t call me again.'
  },
  { 
    id: 'miguel',
    name: 'Miguel Hernández',
    image: './number-miguel.png',
    audio: './audio/miguel.mp3',
    phone: '525-471-2519',
    identity: 'The janitor of the Academy',
    description: 'Oh, eres tu otra vez? I\'ve been here a long time, and you hear things, you know? There are whispers about Professor Eleanor, something about students\' work being used in ways they didn\'t agree to. I don\'t know if it\'s true, but it\'s not my place to ask questions. That night I saw someone leave the art studio around 8 p.m. I recognized Lucy, but the other person, it seemed like a woman, though I couldn\'t get a good look. I need to keep my job, so that\'s all I\'ll say. Adios.'
  },
  { 
    id: 'samantha',
    name: 'Dr. Samantha',
    image: './number-samantha.png',
    audio: './audio/samantha.mp3',
    phone: '817-344-8711',
    identity: 'An art professor of the Academy',
    description: 'Erin was one of my top students, but there was noticeable tension between her and Lucy, who\'s also exceptionally talented in sculpting. Their rivalry often led to arguments, and that night, I heard raised voices from the art studio. I couldn\'t make out the words, but it didn\'t sound friendly. Well, that\'s all I can tell you. Sorry, I have a class to teach. Goodbye.'
  }
]; 