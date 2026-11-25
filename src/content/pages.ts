// Inner page text. Content pack sections 3 to 13, word for word, typos kept.
// Rich text parts: plain string, or { t, b (bold), i (italic), a (link) }. See components/site/Rich.astro.
// Link forms: "route:<page>", "doc:<file>", "/old-slug/", or a full address.
import type { Part } from '../components/site/Rich.astro';

type P = Part[];

export const meetingsPage = {
  h1: 'MEETINGS',
  // Content pack section 16 replaces the "Click here for ..." labels.
  printed: 'Current PRINTED meeting list',
  seventh: '7th Tradition Donation Information',
};

export const servicePage = {
  h1: 'AREA SERVICE',
  what: {
    h2: 'WHAT IS BERGEN AREA?',
    body: [
      ['The NA World Services Office defines an ', { t: 'Area Service Committee', b: true }, ' (ASC) meeting as “the primary means by which the services of a local NA community are administered”. The area committee is composed of group service representatives (GSRs), administrative officers (chairperson, vice chairperson, secretary, treasurer), subcommittee chairpersons, and the area’s regional committee members (RCMs).'],
      ['Each area committee elects its own officers, subcommittee chairpersons, and RCMs (regional committee members).'],
      ['Area service meets the 3rd Tuesday of every month at 7:30pm at the following location:'],
    ] as P[],
    place: 'Westwood United Methodist Church',
    address: '105 Fairview Ave, Westwood, NJ 07675',
  },
  policy: {
    h2: 'POLICY',
    body: [
      ['Bergen Area details its policies and procedures for in the following documents. By opening these files, you understand that they may be subject to additional updates. The attached documents detail the policies and procedures for the Bergen Area Service Committee meetings, responsibilities, and protocol for the trusted servants and guests who attend the Area meetings.'],
      ['These documents provide an updated set of guidelines intended for the operation of the Bergen Area Service Committee and its subcommittees. Please read and review this information with an open mind. Updates will be issued through the following year by the Policy Committee as Motions are passed and Policy changes. Please take the time to read this information and become familiar with it. The Bergen Area Policy is designed to assist the Area in getting on with the business of N.A. in Bergen County.'],
    ] as P[],
  },
  gsr: {
    h2: 'GSRs (Group Service Representatives)',
    intro: 'The GSR is responsible for the following activities:',
    list: [
      'Attending the area service committee (ASC) meeting regularly',
      'Serving as a member on ASC subcommittees',
      'Serving as a liaison between the group and the area',
      'Sharing responsibilities with the GSR-Alternate',
      'Keeping the group accurately registered with the World Service Office',
    ],
  },
  workshop: {
    h2: 'Area Workshop',
    body: [
      ['This committee is responsible for holding at least one open forum workshop a month during the regular BASC meeting.'],
      ['The next workshop topic is: ', { t: 'TBD', b: true }],
    ] as P[],
  },
  forms: {
    h2: 'FLYERS, FORMS & LOGOS',
    body: [
      [{ t: 'New motion', b: true }, ' form: ', { t: 'Download PDF', a: 'doc:newmotionformFILL.pdf' }, '.'],
      [{ t: 'Literature Order', b: true }, ' form: ', { t: 'Download PDF', a: 'doc:OrderForm2026.pdf' }, ' or ', { t: 'Download Excel', a: 'doc:OrderForm2026.xlsx' }, ' version.'],
      [{ t: 'GSR Report', b: true }, ' form: ', { t: 'Download PDF', a: 'doc:BASC_GSR_REPORT_FORMFILL.pdf' }, ' or ', { t: 'Google Docs version', a: 'https://docs.google.com/forms/d/1fUrncBAYCYNpRcZ4J0k9b0udqaiMVcafmAI9V4cYo_k/viewform?edit_requested=true' }, '.'],
      [{ t: 'Subcommittee Report', b: true }, ' form: ', { t: 'Download PDF', a: 'doc:subcommitteereportFILL.pdf' }, '.'],
    ] as P[],
    logosIntro: 'We are providing downloadable files containing approved NA Logo and Symbol artwork to assist groups and trusted servants in producing flyers, announcements, etc.',
    logos: [
      { t: 'The Classic NA Logo', a: 'doc:NALogo.gif' },
      { t: 'The Simple NA Logo', a: 'doc:NASymbol.gif' },
      { t: 'The ‘Sunburst’ NA Logo', a: 'doc:NALogoSunburst.gif' },
    ],
    fipt: 'NA trademarks are governed by the Fellowship Intellectual Property Trust (FIPT). These are trademarked images, and must be used with respect.',
  },
};

export const eventsPage = {
  h1: 'EVENTS & ANNOUNCEMENTS',
  h2: 'EVENTS',
  body: [
    ['If you have a Bergen County, NJ, NA-related announcement you want listed here ', { t: 'fill our this submission form here', a: 'https://www.nanj.org/events-and-activities/add-a-new-event/' }, '? Look at ', { t: 'pending events', a: 'https://www.nanj.org/events-and-activities/?status=pending' }, ' to see if its been submitted already. Want to see the ', { t: 'archive', a: '#archive' }, '?'],
    ['Note: Flyers with personal phone numbers or addresses will not allowed to be posted on this website.'],
  ] as P[],
};

export const publicPage = {
  h1: 'FOR THE PUBLIC',
  helpful: {
    h2: 'HELPFUL LINKS',
    // Visible text is the old site's. The link goes where the old link really went (content pack section 7).
    links: [
      { label: 'Title: Virtual NA Meeting Resources', text: 'https://na.org/meetingsearch/virtual-meeting-search/', href: 'https://na.org/meetingsearch/virtual-meeting-search/' },
      { label: 'Find a Meeting', text: 'https://www.na.org/meetingsearch/', href: 'https://na.org/meetingsearch/find-na/' },
      { label: 'Recovery Literature (Multiple Languages)', text: 'https://na.org/literature/', href: 'https://na.org/literature/' },
      { label: 'Information Pamphlets (English).', text: 'https://www.na.org/?ID=ips-eng-index', href: 'https://na.org/literature/recovery-literature-in-english-usa/' },
      { label: 'Resources for Professionals', text: 'https://na.org/resources-for-professionals/', href: 'https://na.org/resources-for-professionals/' },
    ],
  },
  pr: {
    h2: 'PUBLIC RELATIONS INFORMATION',
    h3: 'News for the Public.',
    intro: 'Contains links to items of interest to the general public and professionals about the Fellowship of Narcotics Anonymous',
    links: [
      { t: 'PSA about Narcotics Anonymous', a: 'https://youtu.be/cYJnZBg53vc' },
      { t: 'Information About NA', a: 'https://na.org/wp-content/uploads/2026/07/2302_InfoNA_2026.pdf' },
      { t: '2024 Membership Survey', a: 'https://na.org/wp-content/uploads/2026/07/2301_2024-MS_2026.pdf' },
      { t: 'NA: A Resource In Your Community', a: 'https://na.org/wp-content/uploads/2026/07/1604_2024-26-NARS_2026.pdf' },
    ],
    contact: ['Please contact the ', { t: 'Public Information Chair', a: '/contact-us/' }, ' if you have any comments, are not able to find something that you are looking for.'] as P,
  },
};

export const readings = {
  // If the day's reading cannot be fetched, the page links to na.org (full-site spec section 9).
  jft: { h1: 'Just For Today', fn: 'jft', fallback: 'https://na.org/' },
  spad: { h1: 'Spiritual Principle A Day', fn: 'spad', fallback: 'https://na.org/' },
};

export const cleantimePage = {
  h1: 'Cleantime Calculator',
  widget: 'NA Cleantime Calculator',
  prompt: 'Please enter your Clean Date',
};

export const startDatesPage = { h1: 'Group Start Dates' };

export const contactPage = {
  h1: 'CONTACT US',
  intro: [
    'Thank you for contacting Bergen Area Service Committee. Please fill out the form below or email us directly at info@bergenarea.org.',
    'Please tell us the best way we can contact you and explain how we can help:',
    '"*" indicates required fields',
  ],
  fields: {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    topic: 'What information are you looking for:',
    topics: [
      { value: 'general', label: 'General inquiry about NA or Bergen Area' },
      { value: 'meeting', label: 'I am a representative from a meeting looking to make a change to the meeting list' },
      { value: 'committee', label: 'Send a message to a specific subcomittee' },
      { value: 'other', label: 'Other' },
    ],
    committee: 'What committee is your message for?',
    committees: [
      'activities@bergenarea.org', 'bot@bergenarea.org', 'chairperson@bergenarea.org', 'convention@bergenarea.org',
      'hospitalsandinstitutions@bergenarea.org', 'literature@bergenarea.org', 'meetings@bergenarea.org', 'policy@bergenarea.org',
      'pr@bergenarea.org', 'rcm@bergenarea.org', 'secretary@bergenarea.org', 'treasurer@bergenarea.org', 'vicechair@bergenarea.org',
      'website@bergenarea.org', 'workshop@bergenarea.org',
    ],
    message: 'Message',
    relationship: 'What is your relationship to the meeting (check all that apply)',
    relationships: ['Trusted servant', 'GSR or alt-GSR', 'Group member'],
    day: 'What day of the week is the meeting?',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Multi-day meeting (write the specific days below)'],
    town: 'What town is your meeting in (leave blank if meeting is ONLY virtual))?',
    changes: 'What details have changed to your meeting?',
  },
  // Content pack section 16: replaces "Submit".
  button: 'SEND MESSAGE',
};

export const donationsPage = {
  h1: 'DONATIONS',
  h2: 'Donate to Bergen Area',
  body: [
    ['Bergen Area Service has recently set up a way so NA members can donate directly to Bergen Area.'],
    ['Note that our seventh tradition states that ', { t: 'we accept donations only from NA members', b: true }, ' and ', { t: 'decline outside contributions', b: true }, '. The money collected pays for area expenses. The rest is passed on through the NA service structure to help further carry the message of recovery.'],
    ['All donations sent through Venmo will be transferred ', { t: 'directly', b: true }, ' to the Bergen Area checking account. Please send any questions or comments through the ', { t: 'contact form on this page', a: '/contact-us/' }, '.'],
  ] as P[],
};

export const seventhPage = {
  h1: '7th Tradition – Donation Information',
  body: [
    ['Our seventh tradition states that every NA group should be fully self-supporting, declining outside contributions. The money collected goes to pay rent and literature the rest is passed on through the NA service structure to help further carry the message of recovery.'],
    ['Please post (copy/paste) this message in the chat box at the beginning and end of your Zoom meetings:'],
  ] as P[],
  chat: 'All donations to the area should be sent to Venmo @bergenareaNA',
};

export const carPage = {
  h1: 'CAR REPORT',
  h2: 'CAR Report',
  download: { t: 'Download the 2023 CAR report', a: 'https://www.na.org/admin/include/spaw2/uploads/pdf/conference/CAR/2023CAR_6.pdf' },
  sections: [
    { h: 'WHAT IS “THE CAR”?', body: [['It’s one of the ways Narcotics Anonymous World Services informs the fellowship of Narcotics Anonymous worldwide what is happening, what needs to be discussed , what needs to be voted on and the future direction of the NA fellowship worldwide as a whole.']] as P[] },
    {
      h: 'CAR stands for the CONFERENCE AGENDA REPORT',
      body: [
        ['It is a compilation of motions that have been brought before Narcotics Anonymous at the world level. Just as we have motions and business meetings at group levels, area levels and regional levels we also have them at the world level. They are voted on at the World Service Conference (WSC) once every two years by delegates from each region in the world.'],
        ['Motions can be made by areas, regions or the World Board. Motions made by areas and regions often involve issues important to the local areas or regions while World Board motions concern the world wide fellowship as a whole. These motions affect NA as a whole and impact NA members all around the world.'],
      ] as P[],
    },
    { h: 'HOW THE VOTING WORKS', body: [['How voting works is that each Group Service Representative (GSR) has an opportunity to learn about the motions by attending a CAR workshop. The GSR then goes to their group and has a meeting (suggested as a separate one from business or regular meeting) to explain the motions to their group and have voting. The GSR then goes to the AREA SERVICE COMMITTEE MEETING (ASC) and gives the Regional Committee Member (RCM) their tally of the votes. The RCM then compiles them and brings it to the Regional Service Committee (RSC) and the RSC compiles those tallies from all areas. Every one has an opportunity to learn about the CAR and vote on it at their group.']] as P[] },
    { h: 'WHY IT IS IMPORTANT THAT A GROUP REPRESENTATIVE ATTEND A CAR WORKSHOP?', body: [['It’s important that each group have at least one person who has a thorough understanding of the CAR before voting so that no biases are created and so that questions can be answered thoroughly and accurately. The representative does not have to be the GSR if they do not have one OR the GSR cannot attend. The workshop will provide information about the CAR report.']] as P[] },
  ],
  quote: [
    [{ t: '“There’s a sense of pride when we can see the results of discussions and decisions after reading the CAR. When we see a particular piece of literature on the rack at our meetings and we can say to ourselves, “I voted on that piece,” we feel connected to NA in a way that we may not have felt before. It’s our chance to be part of that “collective expression” our Mission Statement talks about.”', i: true }],
    [{ t: '(From pg. 2 of World Board Report)', i: true }],
  ] as P[],
};
