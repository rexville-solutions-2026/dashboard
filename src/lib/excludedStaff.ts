// Staff who are TOB or Admin, not real pickers/packers — always excluded
// from the Top 5 / Bottom 5 leaderboards even if their ID shows up in a
// raw inventory export. Edit this list directly if staff or roles change.
export interface ExcludedStaffMember {
  id: string
  name: string
  role: 'TOB' | 'Admin'
}

export const EXCLUDED_STAFF: ExcludedStaffMember[] = [
  { id: 'FOP_10032', name: 'Kwok Ho Law', role: 'TOB' },
  { id: 'FOP_10081', name: 'Abbas Zubair', role: 'TOB' },
  { id: 'FOP_10082', name: 'Scott Trueman', role: 'TOB' },
  { id: 'OP_10191', name: 'Sharjeel Imran Brhane', role: 'TOB' },
  { id: 'OP_10535', name: 'Hibaq Warsame', role: 'TOB' },
  { id: 'FOP_10095', name: 'Mandeq Ahmed', role: 'Admin' },
  { id: 'FOP_10084', name: 'Joshua Jones', role: 'Admin' },
  { id: 'FOP_10054', name: 'Nataya Marie Cumberbatch', role: 'Admin' },
  { id: 'FOP_10026', name: 'Senait Yimam Hussen', role: 'Admin' },
  { id: 'OP_10768', name: 'Jessica Ofori', role: 'Admin' },
  { id: 'FOP_10022', name: 'Zidayne Grant', role: 'Admin' },
  { id: 'FOP_10024', name: 'Muhammad Hafeez Hussain', role: 'Admin' },
  { id: 'FOP_10048', name: 'Pradeep Pradeep', role: 'Admin' },
  { id: 'OP_10448', name: 'Harpreet Singh', role: 'Admin' },
  { id: 'FOP_10094', name: 'Moise Angel', role: 'Admin' },
  { id: 'OP_10347', name: 'Mandeep Singh', role: 'Admin' },
  { id: 'FOP_10047', name: 'Sonali Sonali', role: 'Admin' },
  { id: 'FOP_10046', name: 'Abdullahi Maryamo', role: 'Admin' },
  { id: 'FOP_10104', name: 'Hasana Khan', role: 'Admin' },
]

export const EXCLUDED_STAFF_IDS: Set<string> = new Set(EXCLUDED_STAFF.map((s) => s.id.toLowerCase()))
