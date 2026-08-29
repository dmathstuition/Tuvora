/**
 * Database types.
 *
 * NOTE: In a provisioned environment these are GENERATED from the live schema:
 *   pnpm db:types   (supabase gen types typescript --local)
 *
 * Until the Supabase project is linked, this hand-authored subset mirrors the
 * generated shape (`Database['public']['Tables'][T]['Row' | 'Insert' | 'Update']`)
 * for the tables the application code references today. Regenerate to get the
 * full set — do not treat this file as the source of truth for the schema; the
 * migrations in supabase/migrations are.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          platform_role: 'none' | 'platform_support' | 'super_admin';
          last_active_organization_id: string | null;
        } & Timestamps;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          platform_role?: 'none' | 'platform_support' | 'super_admin';
          last_active_organization_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: string;
          owner_id: string;
          country: string | null;
          currency: string;
          timezone: string;
          subjects: string[];
          email: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          brand_color: string | null;
          employs_tutors: boolean;
          portal_preferences: Json;
          onboarding_completed_at: string | null;
          archived_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type?: string;
          owner_id: string;
          country?: string | null;
          currency?: string;
          timezone?: string;
          subjects?: string[];
          employs_tutors?: boolean;
          portal_preferences?: Json;
          email?: string | null;
          brand_color?: string | null;
          logo_url?: string | null;
          favicon_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']> & {
          email?: string | null;
          logo_url?: string | null;
          favicon_url?: string | null;
          brand_color?: string | null;
          onboarding_completed_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'tutor' | 'assistant' | 'accountant' | 'staff';
          status: 'active' | 'invited' | 'suspended' | 'removed';
          permission_overrides: Json;
          invited_by: string | null;
          joined_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'tutor' | 'assistant' | 'accountant' | 'staff';
          status?: 'active' | 'invited' | 'suspended' | 'removed';
          permission_overrides?: Json;
          invited_by?: string | null;
          joined_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>;
        Relationships: [];
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: 'owner' | 'admin' | 'tutor' | 'assistant' | 'accountant' | 'staff';
          token: string;
          invited_by: string | null;
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          email: string;
          role: 'owner' | 'admin' | 'tutor' | 'assistant' | 'accountant' | 'staff';
          token: string;
          invited_by?: string | null;
          expires_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          monthly_price_minor: number;
          yearly_price_minor: number;
          currency: string;
          included_learners: number;
          additional_learner_price_minor: number;
          staff_limit: number | null;
          class_limit: number | null;
          course_limit: number | null;
          storage_limit_mb: number | null;
          is_active: boolean;
          is_public: boolean;
          is_recommended: boolean;
          sort_order: number;
          trial_days: number;
        } & Timestamps;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      features: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          type: 'boolean' | 'numeric' | 'unlimited';
          default_value: Json;
        } & Timestamps;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      plan_features: {
        Row: {
          id: string;
          plan_id: string;
          feature_id: string;
          value: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: 'percent' | 'fixed';
          discount_value: number;
          currency: string | null;
          duration: string;
          max_redemptions: number | null;
          times_redeemed: number;
          is_active: boolean;
          expires_at: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          code: string;
          discount_type: 'percent' | 'fixed';
          discount_value: number;
          description?: string | null;
          currency?: string | null;
          duration?: string;
          max_redemptions?: number | null;
          is_active?: boolean;
          expires_at?: string | null;
          created_by?: string | null;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      plan_prices: {
        Row: {
          id: string;
          plan_id: string;
          currency: string;
          monthly_price_minor: number;
          yearly_price_minor: number;
          additional_learner_price_minor: number;
          per_learner_monthly_price_minor: number;
        } & Timestamps;
        Insert: {
          plan_id: string;
          currency: string;
          monthly_price_minor?: number;
          yearly_price_minor?: number;
          additional_learner_price_minor?: number;
          per_learner_monthly_price_minor?: number;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan_id: string;
          status:
            | 'trialing'
            | 'active'
            | 'past_due'
            | 'paused'
            | 'cancelled'
            | 'expired'
            | 'incomplete';
          interval: 'monthly' | 'yearly';
          provider: string | null;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          grace_period_ends_at: string | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          plan_id: string;
          status?: string;
          interval?: 'monthly' | 'yearly';
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      learners: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          first_name: string;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          avatar_url: string | null;
          country: string | null;
          timezone: string | null;
          emergency_contact: Json | null;
          notes: string | null;
          status: 'active' | 'inactive' | 'archived';
          enrolled_at: string;
          archived_at: string | null;
          avatar_key: string | null;
          theme_key: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          first_name: string;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          status?: 'active' | 'inactive' | 'archived';
        } & Record<string, unknown>;
        Update: Partial<Database['public']['Tables']['learners']['Insert']> & {
          status?: 'active' | 'inactive' | 'archived';
          archived_at?: string | null;
          avatar_key?: string | null;
          theme_key?: string | null;
        };
        Relationships: [];
      };
      learner_portal_invites: {
        Row: {
          id: string;
          organization_id: string;
          learner_id: string;
          email: string;
          token: string;
          invited_by: string | null;
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          learner_id: string;
          email: string;
          token: string;
          invited_by?: string | null;
          expires_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      reward_events: {
        Row: {
          id: string;
          organization_id: string;
          learner_id: string;
          kind: 'reward' | 'sanction';
          points: number;
          category: string | null;
          reason: string | null;
          awarded_by: string | null;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          learner_id: string;
          kind: 'reward' | 'sanction';
          points: number;
          category?: string | null;
          reason?: string | null;
          awarded_by?: string | null;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          organization_id: string;
          subject_id: string | null;
          name: string;
          description: string | null;
          status: 'draft' | 'active' | 'completed' | 'archived';
          mode: 'one_to_one' | 'group';
          tutor_id: string | null;
          capacity: number | null;
          start_date: string | null;
          end_date: string | null;
          join_code: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          name: string;
          subject_id?: string | null;
          description?: string | null;
          status?: 'draft' | 'active' | 'completed' | 'archived';
          mode?: 'one_to_one' | 'group';
          capacity?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          join_code?: string | null;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      class_members: {
        Row: {
          id: string;
          organization_id: string;
          class_id: string;
          learner_id: string;
          enrolled_at: string;
        };
        Insert: {
          organization_id: string;
          class_id: string;
          learner_id: string;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          organization_id: string;
          class_id: string;
          learner_id: string;
          session_date: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          created_at: string;
        };
        Insert: {
          organization_id: string;
          class_id: string;
          learner_id: string;
          session_date: string;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          organization_id: string;
          class_id: string | null;
          subject_id: string | null;
          title: string;
          instructions: string | null;
          status: 'draft' | 'published' | 'archived';
          max_points: number | null;
          allow_resubmission: boolean;
          due_at: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          title: string;
          class_id?: string | null;
          subject_id?: string | null;
          instructions?: string | null;
          status?: 'draft' | 'published' | 'archived';
          max_points?: number | null;
          allow_resubmission?: boolean;
          due_at?: string | null;
          created_by?: string | null;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      assignment_submissions: {
        Row: {
          id: string;
          organization_id: string;
          assignment_id: string;
          learner_id: string;
          status: 'assigned' | 'submitted' | 'late' | 'graded' | 'returned';
          content: string | null;
          submitted_at: string | null;
          score: number | null;
          feedback: string | null;
          graded_by: string | null;
          graded_at: string | null;
          returned_at: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          assignment_id: string;
          learner_id: string;
          status?: 'assigned' | 'submitted' | 'late' | 'graded' | 'returned';
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          organization_id: string;
          direction: 'platform' | 'tutor';
          status: 'pending' | 'succeeded' | 'failed' | 'refunded';
          amount_minor: number;
          currency: string;
          provider: string | null;
          provider_payment_id: string | null;
          payer_learner_id: string | null;
          payer_parent_id: string | null;
          invoice_id: string | null;
          metadata: Json;
          paid_at: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          direction: 'platform' | 'tutor';
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
          amount_minor: number;
          currency?: string;
          payer_learner_id?: string | null;
          payer_parent_id?: string | null;
          metadata?: Json;
          paid_at?: string | null;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          direction: 'platform' | 'tutor';
          number: string;
          status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
          currency: string;
          subtotal_minor: number;
          total_minor: number;
          bill_to_learner_id: string | null;
          bill_to_parent_id: string | null;
          due_at: string | null;
          issued_at: string | null;
          paid_at: string | null;
        } & Timestamps;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      learner_intake: {
        Row: {
          id: string;
          organization_id: string;
          learner_id: string;
          parent_name: string | null;
          parent_email: string | null;
          parent_phone: string | null;
          relationship: string | null;
          parent_occupation: string | null;
          date_of_birth: string | null;
          current_school: string | null;
          current_grade: string | null;
          subjects_of_interest: string[] | null;
          strengths: string | null;
          weaknesses: string | null;
          learning_goals: string | null;
          special_needs: string | null;
          preferred_mode: string | null;
          sessions_per_week: number | null;
          preferred_days: string[] | null;
          preferred_times: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          how_heard: string | null;
          extra: Json;
          submitted_at: string | null;
        } & Timestamps;
        Insert: { organization_id: string; learner_id: string } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      parents: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          first_name: string;
          last_name: string | null;
          email: string | null;
          phone: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          first_name: string;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      parent_learners: {
        Row: {
          id: string;
          organization_id: string;
          parent_id: string;
          learner_id: string;
          relationship: string | null;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          parent_id: string;
          learner_id: string;
          relationship?: string | null;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          organization_id: string | null;
          created_by: string | null;
          subject: string;
          message: string;
          status: 'open' | 'pending' | 'resolved' | 'closed';
          priority: 'low' | 'normal' | 'high';
        } & Timestamps;
        Insert: {
          organization_id: string;
          created_by: string;
          subject: string;
          message: string;
          priority?: 'low' | 'normal' | 'high';
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      learner_billing: {
        Row: {
          id: string;
          organization_id: string;
          learner_id: string;
          status: 'trialing' | 'active' | 'past_due' | 'expired';
          is_trial: boolean;
          current_period_start: string | null;
          current_period_end: string | null;
          provider: string | null;
          provider_reference: string | null;
          last_payment_id: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          learner_id: string;
          status?: 'trialing' | 'active' | 'past_due' | 'expired';
          is_trial?: boolean;
          current_period_start?: string | null;
          current_period_end?: string | null;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      subjects: {
        Row: { id: string; organization_id: string; name: string; color: string | null; created_at: string };
        Insert: { organization_id: string; name: string; color?: string | null };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          organization_id: string;
          subject_id: string | null;
          title: string;
          description: string | null;
          level: string | null;
          cover_image_url: string | null;
          status: 'draft' | 'published' | 'archived';
          created_by: string | null;
        } & Timestamps;
        Insert: { organization_id: string; title: string } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      course_modules: {
        Row: { id: string; organization_id: string; course_id: string; title: string; position: number; created_at: string };
        Insert: { organization_id: string; course_id: string; title: string; position?: number };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          organization_id: string;
          module_id: string | null;
          class_id: string | null;
          title: string;
          description: string | null;
          content: Json | null;
          video_url: string | null;
          objectives: string[] | null;
          position: number;
        } & Timestamps;
        Insert: { organization_id: string; title: string } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          kind: string;
          url: string | null;
          file_id: string | null;
          class_id: string | null;
          course_id: string | null;
          lesson_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: { organization_id: string; title: string; kind?: string } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          organization_id: string;
          class_id: string | null;
          subject_id: string | null;
          title: string;
          description: string | null;
          type: 'quiz' | 'test' | 'exam' | 'diagnostic';
          time_limit_minutes: number | null;
          attempt_limit: number | null;
          randomize: boolean;
          total_marks: number | null;
          pass_mark: number | null;
          status: 'draft' | 'published' | 'archived';
          is_placement: boolean;
          subject_label: string | null;
          grade_band: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: { organization_id: string; title: string } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      assessment_attempts: {
        Row: {
          id: string;
          organization_id: string;
          assessment_id: string;
          learner_id: string;
          status: 'assigned' | 'in_progress' | 'submitted' | 'graded';
          answers: Json;
          score: number | null;
          total: number | null;
          percentage: number | null;
          placement_level: string | null;
          placement_notes: string | null;
          assigned_by: string | null;
          assigned_at: string;
          started_at: string | null;
          submitted_at: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          assessment_id: string;
          learner_id: string;
          assigned_by?: string | null;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      assessment_questions: {
        Row: {
          id: string;
          organization_id: string;
          assessment_id: string;
          type: 'multiple_choice' | 'true_false' | 'short_answer';
          prompt: string;
          marks: number;
          position: number;
          answer_key: Json | null;
          created_at: string;
        };
        Insert: { organization_id: string; assessment_id: string; type: 'multiple_choice' | 'true_false' | 'short_answer'; prompt: string } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      assessment_options: {
        Row: { id: string; organization_id: string; question_id: string; label: string; is_correct: boolean; position: number };
        Insert: { organization_id: string; question_id: string; label: string; is_correct?: boolean; position?: number };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      message_threads: {
        Row: {
          id: string;
          organization_id: string;
          subject: string | null;
          kind: string;
          class_id: string | null;
          created_by: string | null;
          participant_ids: string[];
        } & Timestamps;
        Insert: { organization_id: string; subject?: string | null; kind?: string; created_by?: string | null } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          organization_id: string;
          thread_id: string;
          sender_id: string | null;
          body: string;
          read_by: string[];
          created_at: string;
        };
        Insert: { organization_id: string; thread_id: string; body: string; sender_id?: string | null };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          kind: string;
          class_id: string | null;
          starts_at: string;
          ends_at: string | null;
          all_day: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: { organization_id: string; title: string; starts_at: string; kind?: string } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      invoice_items: {
        Row: { id: string; invoice_id: string; description: string; quantity: number; unit_price_minor: number; amount_minor: number; created_at: string };
        Insert: { invoice_id: string; description: string; quantity?: number; unit_price_minor?: number; amount_minor?: number };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      platform_settings: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: { key: string; value?: Json; updated_at?: string };
        Update: { value?: Json; updated_at?: string };
        Relationships: [];
      };
      revision_decks: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          subject: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          title: string;
          subject?: string | null;
          created_by?: string | null;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      revision_cards: {
        Row: {
          id: string;
          organization_id: string;
          deck_id: string;
          front: string;
          back: string;
          position: number;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          deck_id: string;
          front: string;
          back: string;
          position?: number;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          organization_id: string;
          learner_id: string;
          title: string;
          type: string;
          description: string | null;
          serial: string;
          issued_by: string | null;
          issued_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          learner_id: string;
          title: string;
          serial: string;
          type?: string;
          description?: string | null;
          issued_by?: string | null;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      reward_shop_items: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          emoji: string | null;
          description: string | null;
          cost: number;
          stock: number | null;
          active: boolean;
        } & Timestamps;
        Insert: {
          organization_id: string;
          name: string;
          cost: number;
          emoji?: string | null;
          description?: string | null;
          stock?: number | null;
          active?: boolean;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      reward_redemptions: {
        Row: {
          id: string;
          organization_id: string;
          learner_id: string;
          item_id: string | null;
          item_name: string;
          points_spent: number;
          status: 'pending' | 'approved' | 'fulfilled' | 'rejected' | 'cancelled';
          decided_by: string | null;
          decided_at: string | null;
        } & Timestamps;
        Insert: {
          organization_id: string;
          learner_id: string;
          item_name: string;
          points_spent: number;
          item_id?: string | null;
          status?: string;
        } & Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string | null;
          actor_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          organization_id?: string | null;
          actor_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_active_learner_count: { Args: { org: string }; Returns: number };
      get_learner_limit: { Args: { org: string }; Returns: number | null };
      can_add_learner: { Args: { org: string }; Returns: boolean };
      org_free_trial_used: { Args: { org: string }; Returns: boolean };
      learner_account_open: { Args: { learner: string }; Returns: boolean };
      get_open_learner_count: { Args: { org: string }; Returns: number };
      learner_points: { Args: { learner: string }; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
