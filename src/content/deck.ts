// THE COPY DECK. Content pack sections 1 and 2, word for word.
// Nothing in this file is rewritten, shortened or corrected. Typos stay (see typos.md).
// All three demos import it, so the Area compares design, not wording.
// This file is exempt from the kill-list scan because it is quoted source text.

export interface DeckLink { label: string; href: string }

export const deck = {
  site: {
    browserTitle: 'Bergen Area of Narcotics Anonymous | Just for Today',
    logoAlt: 'Bergen Area of Narcotics Anonymous',
    helpline: {
      // Same visible text as the old site, split so each number dials on its own.
      before: 'Narcotics Anonymous NJ Helpline: ',
      first: { label: '800.992.0401', href: 'tel:+18009920401' },
      between: ' (',
      second: { label: '732.933.0462', href: 'tel:+17329330462' },
      after: ' in NJ)',
      full: 'Narcotics Anonymous NJ Helpline: 800.992.0401 (732.933.0462 in NJ)',
    },
    headerButton: 'Find a Meeting',
    nav: [
      { label: 'Meetings' },
      {
        label: 'Service',
        children: [
          'Area Service',
          'Activities',
          'Convention',
          'Fellowship Development',
          'Hospitals & Institutions',
          'Public Relations',
          'Regional Committee Member (RCM)',
        ],
      },
      { label: 'Events' },
      { label: 'For the Public' },
      {
        label: 'Members',
        children: ['Just For Today', 'Spiritual Principle A Day', 'Cleantime Calculator', 'Group Start Dates'],
      },
      { label: 'Contact' },
    ] as { label: string; children?: string[] }[],
    footerNav: ['Meetings', 'Service', 'Events', 'For the Public', 'Members', 'Contact'],
    /** `© {year} BergenArea.org`, year rendered from the build date */
    copyright: (year: number) => `© ${year} BergenArea.org`,
    email: 'info@bergenarea.org',
  },

  hero: {
    kicker: 'WELCOME',
    h1: 'BERGEN COUNTY AREA WEBSITE',
    button: 'FIND A MEETING',
  },

  areaService: {
    heading: 'AREA SERVICE',
    paragraphs: [
      'The NA World Services Office defines an Area Service Committee (ASC) meeting as “the primary means by which the services of a local NA community are administered.”',
      'The area committee is composed of group service representatives (GSRs), administrative officers (chairperson, vice chairperson, secretary, treasurer), subcommittee chairpersons, and the area’s regional committee members (RCMs).',
    ],
    // Content pack section 16: replaces the old "LEARN MORE" label.
    button: 'AREA SERVICE',
  },

  meetings: {
    heading: 'MEETINGS',
    /** `Serving the communities of {towns}.` filled live, A to Z, comma separated */
    townsSentence: (towns: string[]) => `Serving the communities of ${towns.join(', ')}.`,
    townsFallback: [
      'Allendale', 'Bogota', 'Dumont', 'Englewood', 'Fair Lawn', 'Fort Lee', 'Hackensack', 'Hasbrouck Heights',
      'Leonia', 'Midland Park', 'Paramus', 'Ramsey', 'Ridgefield', 'Ridgewood', 'River Edge', 'Teaneck',
      'Westwood', 'Woodcliff Lake', 'Woodridge', 'Wyckoff',
    ],
    second: 'Find a meeting in the area and see what meetings are in need of support.',
    button: 'FIND A MEETING',
    app: 'Download the the NA World Board approved meeting finder:',
    badges: [
      { alt: 'Google Play', img: 'img/androidstore.png', width: 129, height: 45, href: 'https://play.google.com/store/apps/details?id=org.na.naapp' },
      { alt: 'App Store', img: 'img/appstore.png', width: 135, height: 40, href: 'https://itunes.apple.com/us/app/na-meeting-search/id627643748?mt=8' },
    ],
    /** Content pack section 3. `There are {groups} groups that make up {meetings} meetings in Bergen Area.` */
    countSentence: (groups: number, meetings: number) => `There are ${groups} groups that make up ${meetings} meetings in Bergen Area.`,
  },

  events: {
    heading: 'ANNOUNCEMENTS & EVENTS',
    // One paragraph, two links. Parts are rendered in order with no added spaces.
    paragraph: [
      { text: 'If you have a Bergen County, NJ, NA-related announcement you want listed here ' },
      { text: 'fill our this submission form here', href: 'https://www.nanj.org/events-and-activities/add-a-new-event/' },
      { text: '? Look at ' },
      { text: 'pending events', href: 'https://www.nanj.org/events-and-activities/?status=pending' },
      { text: ' to see if its been submitted already.' },
    ] as { text: string; href?: string }[],
    button: 'VIEW EVENTS',
  },

  video: {
    title: 'We do recover',
    channel: 'Narcotics Anonymous World Services',
    url: 'https://www.youtube.com/watch?v=cYJnZBg53vc',
    id: 'cYJnZBg53vc',
  },

  about: {
    // First paragraph carries one bold phrase. It stays bold.
    first: [
      { text: 'This site is hosted by the ' },
      { text: 'Narcotics Anonymous Bergen County Area Committee in New Jersey', bold: true },
      { text: '. Here you can learn information about the time and date of local meetings. You can also find news about special activities, such as fun group outings, NA conventions, or workshops.' },
    ] as { text: string; bold?: boolean }[],
    rest: [
      'Bergen Area has a monthly meeting (“Area Service”) and we’d love for you to join us.',
      'Bergen Area service committees coordinate efforts to carry the NA message on behalf of the groups they serve.',
      'Hosting panel presentations based on personal experience for addicts in treatment centers and jails, or providing the community with public information services, are just two of the ways committees reach out to help the addict who still suffers, their friends and loved ones, or healthcare providers.',
      'Your group service representative (GSR) can tell you more about how you and your group can join in the work of your area service committee.',
    ],
  },

  otherLinks: {
    heading: 'Other Links',
    links: [
      { label: 'New Year New Life (Bergen Area’s New Year’s Eve Convention)', href: 'http://www.newyearnewlife.org/' },
      { label: 'NA World Service', href: 'http://www.na.org/' },
      { label: 'Nar-Anon: Information about assistance for family members and friends of addicts', href: 'http://www.naranonofnj.org/' },
      { label: 'Northern NJ Regional NA', href: 'https://www.nanj.org/meetings/' },
    ] as DeckLink[],
  },
} as const;

export type Deck = typeof deck;

/** Approved interface words (handoff section 5.6). New words on the site come only from here. */
export const ui = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  inPerson: 'In person',
  virtual: 'Virtual',
  hybrid: 'Hybrid',
  allTowns: 'All towns',
  nextMeeting: 'Next meeting',
  happeningNow: 'Happening now',
  startsIn: (n: number) => `Starts in ${n} min`,
  startsAt: (time: string) => `Starts at ${time}`,
  directions: 'Directions',
  joinZoom: 'Join on Zoom',
  callIn: 'Call in',
  meetingDetails: 'Meeting details',
  close: 'Close',
  formats: 'Formats',
  wheelchair: 'Wheelchair accessible',
  convention: 'Convention',
  activities: 'Activities',
  upcomingMeetings: 'Upcoming meetings',
  nothingPosted: 'Nothing posted right now.',
  allEvents: 'All events',
  eventDetails: 'EVENT DETAILS',
  playVideo: 'Play video',
  menu: 'Menu',
  sample: 'SAMPLE',
  notice: 'Notice',
  // Not on the approved list. Plainest two words for an empty meeting list (logged in OPEN_QUESTIONS.md).
  noMeetings: 'No meetings',
  // MEETINGS PAGE (Phase 2). Plain interface words for the full finder, the printable list
  // and Report an Update (content pack section 13 names the page "Report an Update").
  byDay: 'By day',
  byTown: 'By town',
  nearMe: 'Near me',
  map: 'Map',
  favorites: 'Favorites',
  search: 'Search',
  allFormats: 'All formats',
  reportUpdate: 'Report an Update',
  miles: (n: number) => `${n < 10 ? n.toFixed(1) : Math.round(n)} miles`,
  findingYou: 'Finding your location',
  noLocation: 'Your location is not available. Meetings are sorted by day instead.',
  save: 'Save',
  saved: 'Saved',
  noFavorites: 'No favorites saved yet.',
  printOrSave: 'Print or save as PDF',
  printed: 'Printed',
} as const;

export const aboutFirstText = deck.about.first.map((p) => p.text).join('');
export const eventsParagraphText = deck.events.paragraph.map((p) => p.text).join('');
