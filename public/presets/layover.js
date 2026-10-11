// LAYOVER 2026 (TinkerSpace Calicut, 10–11 Oct 2026): the setup Mentor Desk was built for.
// 98 teams, 11 mentor-judges, travel theme. A worked example of a themed event.

const SKILLS = ['Hardware', 'Software', 'AI', 'Design', 'Idea refinement', 'Debugging'];

export default {
  event: {
    name: 'LAYOVER',                 // shown as the big outlined wordmark
    tagline: 'Mentor desk',            // small line under the name in the header
    route: 'CCJ ✈ DXB',
    hours: '6 PM – 6 AM',
    timezone: 'Asia/Kolkata',          // all times are shown in this zone
    locale: 'en-IN',
  },

  // Brand colours. primary = headings and outlines of cards, accent = buttons and highlights.
  theme: { primary: '#1E2EEA', primaryDeep: '#141E9E', accent: '#FF5B1E', accentDeep: '#DE460E' },

  // Four check-in rounds through the night. Times are labels only; organizers open rounds by hand.
  rounds: [
    { n: 1, title: 'Idea & direction', time: '8:00 PM', asks: 'What are you building? What is the travel link? What will work by 2 AM?' },
    { n: 2, title: 'Progress check', time: '11:30 PM', asks: 'Show me what you built. What is blocking you? On track?' },
    { n: 3, title: 'Progress & demo', time: '2:00 AM', asks: 'What runs? Blocked? On track? Final judging pool?' },
    { n: 4, title: 'Final review', time: '5:00 AM', asks: 'Demo-ready? Strongest and weakest part. Rate 1 to 4.' },
  ],

  skills: SKILLS,

  // "Ask for help" types, and which mentor skills each one alerts ('A|B' = either).
  helpTypes: [
    ['Technical blocker', 'Software|Debugging'],
    ['Hardware issue', 'Hardware'],
    ['Idea unclear', 'Idea refinement'],
    ['Not progressing', null],
    ['Team conflict', null],
    ['Needs specific mentor', null],
    ['Other', null],
  ],

  // Words the app uses around the theme and the night.
  copy: {
    themeName: 'travel',
    themeLinkLabel: 'Travel link',
    goalLabel: 'Goal by 2 AM',
    ideaHeading: 'What they said at 8 PM',
    waiting: 'The organizer will open check-in 1 at 8 PM. This screen updates by itself.',
    joinLead: 'One card for the whole event: you mentor tonight, and the same app becomes your judging sheet in the morning. Takes 20 seconds.',
    briefLead: "Tonight you walk the floor helping teams and logging quick check-ins. In the morning, you judge. Tonight's notes only help build the shortlist. They never count toward the judging marks, which are scored fresh in the morning.",
    rubricNote: '<b>Travel connection isn’t about usefulness.</b> It checks that travel is genuinely core to the idea, even if the build is silly or “useless”. The focus is always what they built and demoed, never business potential.',
    prizeLine: 'The panel deliberates and announces the overall winner, plus the Dubai trip.',
    collegeLabel: "College you're connected to",
  },

  // Check-in forms. Question types: text | one | many. Option colours: g y o r b.
  // The engine relies on a few ids (see docs/CONFIG.md): building, theme, goal, plan, help,
  // onTrack, whyNot, built, works, recommend, why, strengths, demoReady, strongest, weakest, rating.
  forms: {
    1: {
      title: 'Idea & direction',
      hint: "Don't score yet. Write what they tell you. About a minute.",
      questions: [
        { id: 'building', type: 'text', label: 'What are they building?', ph: 'One or two lines, in their words', req: true },
        { id: 'buildType', type: 'many', label: 'Build type', options: ['Hardware', 'Software', 'AI', 'Other'] },
        { id: 'theme', type: 'text', label: "What's the travel connection?", ph: 'One sentence. Later mentors see this, and it goes into the judge brief.', req: true },
        { id: 'goal', type: 'text', label: 'What should be working by 2 AM?', ph: 'Their own goal', req: true },
        { section: 'Your read' },
        { id: 'clarity', type: 'one', label: 'Is the idea clear?', req: true, options: [['Very clear', 'g'], ['Somewhat clear', 'y'], ['Still figuring it out', 'r']] },
        { id: 'themeRead', type: 'one', label: 'Travel connection', req: true, options: [['Strong', 'g'], ['Could be stronger', 'y'], ['Not clear yet', 'r']] },
        { id: 'plan', type: 'one', label: 'Their plan', req: true, options: [['Clear and achievable', 'g'], ['Ambitious', 'y'], ['Unclear or unrealistic', 'r']] },
        { id: 'help', type: 'many', label: 'Do they need help? (optional)', hint: 'Picking a skill sends a help request to mentors who have it.', options: SKILLS },
      ],
    },
    2: {
      title: 'Progress check',
      hint: 'Ask them to show you what they built.',
      questions: [
        { id: 'built', type: 'text', label: 'What have they built since 8 PM?', ph: 'Short answer', req: true },
        { id: 'state', type: 'one', label: 'Where are they now?', req: true, options: [['Idea only', 'r'], ['Early prototype', 'o'], ['Partially working', 'y'], ['Working prototype', 'g'], ['Almost complete', 'b']] },
        { id: 'blocking', type: 'text', label: "What's blocking them? (optional)", ph: 'Short note' },
        { id: 'onTrack', type: 'one', inline: true, label: 'On track for 6 AM?', req: true, options: [['Yes', 'g'], ['Maybe', 'y'], ['No', 'r']] },
        { id: 'whyNot', type: 'text', label: 'Why not, and what would help?', ph: 'e.g. GPS module not talking to the board. Needs an electronics mentor.', req: true, showIf: ['onTrack', 'No'], hint: 'This goes straight to the organizers.' },
      ],
    },
    3: {
      // Also carries check-in 2's questions, so check-in 2 can be skipped without losing anything.
      title: 'Progress & demo',
      hint: 'Ask them to show what runs. Not slides, not Figma.',
      questions: [
        { id: 'built', type: 'text', label: 'What have they built since 8 PM?', ph: 'Short answer', req: true },
        { id: 'works', type: 'one', label: 'What works right now?', req: true, options: [['Nothing yet', 'r'], ['Small part works', 'o'], ['Core functionality works', 'y'], ['Almost complete', 'g'], ['Complete prototype', 'b']] },
        { id: 'changed', type: 'one', label: 'Changed from the 8 PM idea?', req: true, options: [['Mostly the same'], ['Improved'], ['Changed a lot'], ['Completely different']] },
        { id: 'blocking', type: 'text', label: "What's blocking them? (optional)", ph: 'Short note' },
        { id: 'onTrack', type: 'one', inline: true, label: 'On track for 6 AM?', req: true, options: [['Yes', 'g'], ['Maybe', 'y'], ['No', 'r']] },
        { id: 'whyNot', type: 'text', label: 'Why not, and what would help?', ph: 'Short note', req: true, showIf: ['onTrack', 'No'], hint: 'This goes straight to the organizers.' },
        { section: 'Your call' },
        { id: 'recommend', type: 'one', inline: true, label: 'Send them to the final judging pool?', req: true, options: [['Yes', 'g'], ['Maybe', 'y'], ['No', 'r']] },
        { id: 'why', type: 'text', label: 'Why? (max 2 sentences)', ph: 'What makes them stand out', req: true, showIf: ['recommend', 'Yes'] },
        { id: 'strengths', type: 'many', label: 'Strengths (optional)', options: ['Creative idea', 'Strong technical execution', 'Strong travel connection', 'Interesting AI use', 'Interesting hardware', 'Great user experience', 'Weird, unexpected, fun', 'Social or accessibility impact', 'Something special'] },
      ],
    },
    4: {
      title: 'Final review',
      hint: 'Last look before morning judging. Be honest, the whole panel reads this.',
      questions: [
        { id: 'demoReady', type: 'one', inline: true, label: 'Demo-ready?', req: true, options: [['Yes', 'g'], ['Partially', 'y'], ['No', 'r']] },
        { id: 'built', type: 'text', label: 'What did they actually build?', ph: 'Short description, goes into the judge brief', req: true },
        { id: 'strongest', type: 'text', label: 'Strongest part', ph: 'e.g. the demo is very easy to understand', req: true },
        { id: 'weakest', type: 'text', label: 'Weakest part', ph: 'Be honest', req: true },
        { id: 'rating', type: 'one', label: 'Recommend for the finalist round?', req: true, options: [['4', 'Strongly recommend'], ['3', 'Recommend'], ['2', 'Consider'], ['1', 'Do not recommend']], numbered: true },
        { id: 'why', type: 'text', label: 'Why?', ph: 'One or two lines', req: true, showIf: ['rating', ['3', '4']] },
      ],
    },
  },

  // Which earlier answers later mentors see at the top of their form (facts only, never ratings).
  noteKeys: { 1: ['building', 'theme', 'goal'], 2: ['built', 'state', 'blocking', 'whyNot'], 3: ['built', 'works', 'changed', 'blocking', 'whyNot'] },
  noteLabels: { building: 'Building', theme: 'Travel link', goal: 'Goal by 2 AM', built: 'Built since 8 PM', state: 'Where they were', blocking: 'Blocking', whyNot: 'Needs', works: 'What worked', changed: 'Changed from 8 PM idea' },

  // Morning judging rubric. Judges tap one of six levels per criterion. Total = sum of max.
  rubric: [
    { id: 'built', label: 'What was built', max: 20 },
    { id: 'creativity', label: 'Creativity & idea', max: 10 },
    { id: 'theme', label: 'Travel connection', max: 10, hint: 'Is travel genuinely core to the idea? Not about usefulness: a silly build can score high.' },
    { id: 'execution', label: 'Execution', max: 5 },
    { id: 'demo', label: 'Demo & experience', max: 5 },
  ],

  judging: {
    shortlistSize: 20,
    picksLockAt: '6:15 AM',
    stages: {
      booths: { time: '7:00–8:00 AM', title: 'Demo booths', text: 'Science-fair style. Walk the floor, see every project, and tap <b>Nominate</b> for the ones the panel must see.' },
      shortlist: { time: '8:00–8:15 AM', title: 'Shortlist', text: 'About 20 finalists announced.' },
      finals: { time: '8:15–9:00 AM', title: 'Finalist presentations', text: 'About 2 minutes each to pitch and demo. Score every finalist in the app.' },
      done: { time: '9:00 AM', title: 'Final call', text: 'The panel deliberates and announces the overall winner, plus the Dubai trip.' },
    },
  },

  // Table labels: false = show as typed ("Table 15"); true = "UPPER 4" / "15" become "Upper · Table 4" / "Lower · Table 15".
  floorTables: true,

  // Dummy teams for Setup → "Load practice data".
  practiceTeams: ['Bus Stop Buzz', 'Omnibus', 'Busan Express', 'Busy Bees', 'Gate Change Alarm', 'Luggage Buddy', 'Sleeper Berth Bot',
    'Window Seat Wars', 'Chai at 3 AM', 'Platform 9¾', 'Lost & Found AI', 'Jet Lag Coach', 'Boarding Pass Poet', 'Auto Fare Fair',
    'Kochi Metro Mate', 'Transit Tamagotchi', 'Seat Swap', 'Ferry Tales', 'Visa Vibes', 'Duty Free Dash', 'Layover Lounge',
    'Toll Booth Tunes', 'Map My Snacks', 'Overnight Owl', 'Passport Pal', 'Rail Rhythm', 'Cab Split', 'Delay Detective',
    'Red Eye Radio', 'Baggage Claim Bingo', 'Pit Stop Pal', 'Night Bus Diaries', 'Terminal Talk', 'Last Mile Link'],
};
