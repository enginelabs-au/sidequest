export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type IntentMode = 'friends' | 'dating' | 'networking';
export type GroupSize = '1:1' | '1:2' | '2:2' | '4:4';
export type ConnectionStatus = 'pending' | 'connected';

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  friends_interests: string[] | null;
  friends_music: string[] | null;
  friends_hobbies: string[] | null;
  friends_fun_facts: string | null;
  networking_role: string | null;
  networking_industry: string | null;
  networking_skills: string[] | null;
  dating_aesthetic: string | null;
  dating_chemistry_notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Venue = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at?: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  venue_id: string;
  mode: IntentMode;
  group_size: GroupSize;
  created_at: string;
  expires_at: string;
};

export type Connection = {
  id: string;
  venue_id: string;
  user_one: string;
  user_two: string;
  user_one_wants: boolean;
  user_two_wants: boolean;
  status: ConnectionStatus;
  created_at: string;
};

export type RoomPeer = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  mode: IntentMode;
  group_size: GroupSize;
  friends_interests: string[] | null;
  friends_music: string[] | null;
  friends_hobbies: string[] | null;
  friends_fun_facts: string | null;
  networking_role: string | null;
  networking_industry: string | null;
  networking_skills: string[] | null;
  dating_aesthetic: string | null;
  dating_chemistry_notes: string | null;
  connection_id: string | null;
  connection_status: ConnectionStatus | null;
  i_want: boolean | null;
  they_want: boolean | null;
};

export type VenueCount = {
  venue_id: string;
  active_count: number;
};

export type Message = {
  id: string;
  connection_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          friends_interests?: string[] | null;
          friends_music?: string[] | null;
          friends_hobbies?: string[] | null;
          friends_fun_facts?: string | null;
          networking_role?: string | null;
          networking_industry?: string | null;
          networking_skills?: string[] | null;
          dating_aesthetic?: string | null;
          dating_chemistry_notes?: string | null;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      venues: {
        Row: Venue;
        Insert: {
          id?: string;
          name: string;
          latitude: number;
          longitude: number;
        };
        Update: Partial<Venue>;
        Relationships: [];
      };
      check_ins: {
        Row: CheckIn;
        Insert: {
          id?: string;
          user_id: string;
          venue_id: string;
          mode: IntentMode;
          group_size: GroupSize;
          created_at?: string;
          expires_at?: string;
        };
        Update: Partial<CheckIn>;
        Relationships: [];
      };
      connections: {
        Row: Connection;
        Insert: {
          id?: string;
          venue_id: string;
          user_one: string;
          user_two: string;
          user_one_wants?: boolean;
          user_two_wants?: boolean;
          status?: ConnectionStatus;
          created_at?: string;
        };
        Update: Partial<Connection>;
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
        };
        Update: never;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: {
          id?: string;
          connection_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          connection_id: string | null;
          reason: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          connection_id?: string | null;
          reason: string;
          details?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      venue_active_check_in_counts: {
        Args: Record<PropertyKey, never>;
        Returns: VenueCount[];
      };
      get_room_peers: {
        Args: Record<PropertyKey, never>;
        Returns: RoomPeer[];
      };
      get_venue_attendees: {
        Args: { p_venue_id: string };
        Returns: {
          user_id: string;
          display_name: string | null;
          mode: string;
          group_size: string;
        }[];
      };
      request_connection: {
        Args: { target_user_id: string };
        Returns: Connection;
      };
      block_user: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
      checkout_user: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      delete_own_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      expire_stale_check_ins: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
