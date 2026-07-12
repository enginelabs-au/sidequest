export const SELECTED_VENUE_KEY = 'sidequest:selectedVenueId';
export const SELECTED_MODE_KEY = 'sidequest:selectedMode';
export const INVISIBLE_PREF_KEY = 'sidequest:goInvisible';
/** When true (default), discovery/map counts only include users in the same Open To mode. */
export const SAME_MODE_ONLY_KEY = 'sidequest:sameModeOnly';
export const LOCAL_INBOX_KEY = 'sidequest:localInboxThreads';
export const LOCAL_ACTIVITY_KEY = 'sidequest:localActivityItems';
export const DELETED_INBOX_PEER_IDS_KEY = 'sidequest:deletedInboxPeerIds';
export const DELETED_ACTIVITY_IDS_KEY = 'sidequest:deletedActivityIds';
export const WAVED_USER_IDS_KEY = 'sidequest:wavedUserIds';
/** Past venue check-ins (after checkout). */
export const PAST_CHECKINS_KEY = 'sidequest:pastCheckIns';
/** Simulator-only check-in when DEV_AUTH_BYPASS has no Supabase session. */
export const DEV_LOCAL_CHECKIN_KEY = 'sidequest:devLocalCheckIn';
/** User appearance preference: `dark` (default) or `light`. */
export const APPEARANCE_KEY = 'sidequest:appearance';
/** Per-connection message read timestamps (message id → ISO read_at). */
export const CHAT_READ_STATUS_KEY = 'sidequest:chatReadStatus';
