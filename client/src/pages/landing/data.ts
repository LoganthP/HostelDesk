import type { Category, ComplaintStatus, Priority } from '../../lib/types';

export interface NavAnchor {
  id: string;
  label: string;
}

export const NAV_ANCHORS: NavAnchor[] = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'roles', label: 'Roles' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'faq', label: 'FAQ' },
];

export interface HeroStep {
  status: ComplaintStatus;
  actor: string;
  action: string;
}

export const HERO_JOURNEY: HeroStep[] = [
  {
    status: 'submitted',
    actor: 'Student · Arjun Nair reported the leak',
    action: 'Waiting in Needs assignment',
  },
  {
    status: 'assigned',
    actor: 'Warden · Meera Rao assigned Ravi Verma (Plumbing)',
    action: 'Priority set to High',
  },
  {
    status: 'in_progress',
    actor: 'Plumber · Ravi Verma started work',
    action: 'Checked valve in Block A washroom',
  },
  {
    status: 'resolved',
    actor: 'Plumber · Ravi Verma marked it resolved',
    action: '“Replaced worn tap washer and tested pressure.”',
  },
  {
    status: 'closed',
    actor: 'Student · Arjun Nair confirmed the repair',
    action: 'Closed with full timeline saved',
  },
];

export interface ProcessStep {
  title: string;
  description: string;
  caption: string;
  tone: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    title: 'Report an issue',
    description: 'Pick your prefilled room or choose a shared area chip like Corridor or Study hall.',
    caption: 'Student submits',
    tone: 'bg-sky-100 text-sky-600',
  },
  {
    title: 'Needs assignment',
    description: 'Matching specialists sort first by trade and fewest open jobs.',
    caption: 'Warden assigns',
    tone: 'bg-indigo-100 text-indigo-600',
  },
  {
    title: 'In progress',
    description: 'Technician starts the job, posts progress notes, and records the fix.',
    caption: 'Staff repairs',
    tone: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Confirm repair',
    description: 'Verify the problem is gone to close it, or reopen it with what’s still wrong.',
    caption: 'Student checks',
    tone: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'Timeline saved',
    description: 'Every note, reassignment, and room stay remains on record.',
    caption: 'Always traceable',
    tone: 'bg-violet-100 text-violet-600',
  },
];

export type RoleTabKey = 'student' | 'warden' | 'maintenance';

export interface RoleShowcase {
  key: RoleTabKey;
  label: string;
  headline: string;
  summary: string;
  highlights: { title: string; detail: string; category?: Category }[];
  metrics: { label: string; value: string; note: string }[];
}

export const ROLE_SHOWCASES: Record<RoleTabKey, RoleShowcase> = {
  student: {
    key: 'student',
    label: 'Student',
    headline: 'Report clearly and check every repair before it closes.',
    summary: 'See your room, roommates, and every update without chasing notice boards or office desks.',
    highlights: [
      {
        title: 'Report an issue',
        detail: 'Your room block and floor fill in automatically, or switch to Shared area with one-tap chips.',
        category: 'plumbing',
      },
      {
        title: 'My room',
        detail: 'View roommates, bed label, and your past allocation dates at a glance.',
        category: 'furniture',
      },
      {
        title: 'Confirm repair or Reopen',
        detail: 'Approve fixed jobs from your overview, or reopen with a reason if a fault returns.',
        category: 'wifi',
      },
    ],
    metrics: [
      { label: 'Category-specific fields', value: '8 trades', note: 'Fixture, appliance, network name, pest details' },
      { label: 'Confirmation gate', value: '2 choices', note: 'Confirm repair to close or Reopen with a note' },
    ],
  },
  warden: {
    key: 'warden',
    label: 'Warden',
    headline: 'Triage new issues, balance technician load, and manage beds.',
    summary: 'Spot urgent issues in Needs assignment, pick the lightest workload, and move students in one atomic step.',
    highlights: [
      {
        title: 'Needs assignment queue',
        detail: 'New and reopened issues surface right on your overview alongside Urgent counts.',
        category: 'electrical',
      },
      {
        title: 'Rooms & beds map',
        detail: 'Click free beds to allocate or occupied beds for Transfer, Room history, and Check out.',
        category: 'carpentry',
      },
      {
        title: 'Staff & Reports',
        detail: 'Track active technicians, open job counts, average fix time, and occupancy by block.',
        category: 'cleaning',
      },
    ],
    metrics: [
      { label: 'Reports view', value: '3 charts', note: 'Category × block, resolution time, block occupancy' },
      { label: 'Integrity checks', value: 'Safe moves', note: 'Failed transfers roll back with no lost bed' },
    ],
  },
  maintenance: {
    key: 'maintenance',
    label: 'Maintenance',
    headline: 'Start assigned jobs quickly and close with clear repair notes.',
    summary: 'Work from a focused queue of jobs assigned to you—never cluttered by other technicians’ work.',
    highlights: [
      {
        title: 'Up next workbench',
        detail: 'Prioritized active queue lets you start work directly from your overview.',
        category: 'wifi',
      },
      {
        title: 'Progress notes',
        detail: 'Post field updates for the student and warden while parts or tests are underway.',
        category: 'plumbing',
      },
      {
        title: 'Mark as resolved',
        detail: 'Requires a repair note describing what was fixed so students know what changed.',
        category: 'electrical',
      },
    ],
    metrics: [
      { label: 'Scoped access', value: 'Your jobs', note: 'Only complaints assigned to your account open' },
      { label: 'Resolution note', value: 'Required', note: 'At least 3 characters before marking fixed' },
    ],
  },
};

export interface DemoBed {
  label: string;
  occupant: { id: string; name: string; roll: string } | null;
}

export interface DemoRoom {
  roomNumber: string;
  block: string;
  floorLabel: string;
  beds: DemoBed[];
}

export const INITIAL_DEMO_ROOMS: DemoRoom[] = [
  {
    roomNumber: 'A101',
    block: 'Block A',
    floorLabel: '1st floor',
    beds: [
      { label: 'A', occupant: { id: 'arjun', name: 'Arjun Nair', roll: '4VV23CS011' } },
      { label: 'B', occupant: { id: 'kiran', name: 'Kiran Patil', roll: '4VV23CS024' } },
      { label: 'C', occupant: null },
    ],
  },
  {
    roomNumber: 'B201',
    block: 'Block B',
    floorLabel: '2nd floor',
    beds: [
      { label: 'A', occupant: { id: 'priya', name: 'Priya Sharma', roll: '4VV23EC019' } },
      { label: 'B', occupant: null },
      { label: 'C', occupant: null },
    ],
  },
];

export const SAMPLE_WAITLIST_STUDENTS = [
  { id: 'rahul', name: 'Rahul Verma', roll: '4VV23CS073' },
  { id: 'sneha', name: 'Sneha Reddy', roll: '4VV23CS081' },
  { id: 'ananya', name: 'Ananya Rao', roll: '4VV23EC045' },
];

export const TRACKED_BARS: { label: string; count: number; max: number; color: string }[] = [
  { label: 'Plumbing', count: 14, max: 16, color: '#38BDF8' },
  { label: 'Wi-Fi', count: 11, max: 16, color: '#8B5CF6' },
  { label: 'Electrical', count: 9, max: 16, color: '#F59E0B' },
  { label: 'Carpentry', count: 6, max: 16, color: '#FB923C' },
];

export const TRACKED_TIMELINE: { action: string; by: string; when: string; status: ComplaintStatus; note?: string }[] = [
  {
    action: 'Repair confirmed',
    by: 'Priya Sharma (Student)',
    when: 'Today, 09:40',
    status: 'closed',
  },
  {
    action: 'Marked as resolved',
    by: 'Farhan Ali (Maintenance)',
    when: 'Today, 09:15',
    status: 'resolved',
    note: '“Replaced floor 1 AP patch cable and verified throughput.”',
  },
  {
    action: 'Technician assigned',
    by: 'Meera Rao (Warden)',
    when: 'Yesterday, 21:05',
    status: 'assigned',
  },
];

export interface DemoAccountCard {
  label: string;
  email: string;
  roleSummary: string;
  tone: string;
  priority?: Priority;
}

export const DEMO_ACCOUNTS: DemoAccountCard[] = [
  { label: 'Student', email: 'arjun@student.edu', roleSummary: 'Room A101 · Report & confirm repairs', tone: 'bg-sky-100 text-sky-700' },
  { label: 'Warden', email: 'warden@hostel.edu', roleSummary: 'Manage rooms, assign staff & view reports', tone: 'bg-indigo-100 text-indigo-700' },
  { label: 'Plumber', email: 'ravi@hostel.edu', roleSummary: 'Assigned plumbing repairs workbench', tone: 'bg-cyan-100 text-cyan-700' },
  { label: 'Electrician', email: 'suresh@hostel.edu', roleSummary: 'Electrical faults & fan/light fixes', tone: 'bg-amber-100 text-amber-700' },
  { label: 'IT support', email: 'it@hostel.edu', roleSummary: 'Wi-Fi access point & network issues', tone: 'bg-violet-100 text-violet-700' },
  { label: 'Carpenter', email: 'anil@hostel.edu', roleSummary: 'Doors, windows & hostel woodwork', tone: 'bg-orange-100 text-orange-700' },
];

export const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Who creates staff accounts?',
    answer: 'Only the warden creates warden and maintenance accounts from the Staff page, choosing each technician’s trade specialization. Students create their own accounts on Create account.',
  },
  {
    question: 'What happens if a repair isn’t fixed?',
    answer: 'Once maintenance marks a job resolved, the student sees Confirm repair and Reopen. Choosing Reopen prompts for what’s still wrong and returns the complaint to Needs assignment.',
  },
  {
    question: 'Can a student without a room report issues?',
    answer: 'Yes. Before a warden allocates a bed, Report an issue defaults automatically to Shared area so you can log faults in corridors, washrooms, study halls, or the mess.',
  },
  {
    question: 'How is room history kept?',
    answer: 'Transfers and check-outs close your active allocation record with end dates inside a database transaction. Past stays remain on My room, and older complaints keep pointing to the room they were filed from.',
  },
];

