export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '14.1';
    };
    public: {
        Tables: {
            activities: {
                Row: {
                    created_at: string | null;
                    event_type: Database['public']['Enums']['activity_type'];
                    id: string;
                    metadata: Json | null;
                    reference_id: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    event_type: Database['public']['Enums']['activity_type'];
                    id?: string;
                    metadata?: Json | null;
                    reference_id?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    event_type?: Database['public']['Enums']['activity_type'];
                    id?: string;
                    metadata?: Json | null;
                    reference_id?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'activities_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            audit_logs: {
                Row: {
                    action: string;
                    changes: Json | null;
                    created_at: string;
                    error_message: string | null;
                    id: string;
                    ip_address: string | null;
                    resource_id: string;
                    resource_type: string;
                    result: Database['public']['Enums']['audit_result'];
                    user_agent: string | null;
                    user_id: string;
                };
                Insert: {
                    action: string;
                    changes?: Json | null;
                    created_at?: string;
                    error_message?: string | null;
                    id?: string;
                    ip_address?: string | null;
                    resource_id: string;
                    resource_type: string;
                    result?: Database['public']['Enums']['audit_result'];
                    user_agent?: string | null;
                    user_id: string;
                };
                Update: {
                    action?: string;
                    changes?: Json | null;
                    created_at?: string;
                    error_message?: string | null;
                    id?: string;
                    ip_address?: string | null;
                    resource_id?: string;
                    resource_type?: string;
                    result?: Database['public']['Enums']['audit_result'];
                    user_agent?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'audit_logs_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            employer_profiles: {
                Row: {
                    company_website: string | null;
                    id: string;
                    industry: string | null;
                    organization_name: string | null;
                    total_gigs_posted: number | null;
                    total_spent: number | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    company_website?: string | null;
                    id?: string;
                    industry?: string | null;
                    organization_name?: string | null;
                    total_gigs_posted?: number | null;
                    total_spent?: number | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    company_website?: string | null;
                    id?: string;
                    industry?: string | null;
                    organization_name?: string | null;
                    total_gigs_posted?: number | null;
                    total_spent?: number | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'employer_profiles_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            gig_reminders_sent: {
                Row: {
                    gig_id: string;
                    sent_at: string;
                    user_id: string;
                    window_hours: number;
                };
                Insert: {
                    gig_id: string;
                    sent_at?: string;
                    user_id: string;
                    window_hours: number;
                };
                Update: {
                    gig_id?: string;
                    sent_at?: string;
                    user_id?: string;
                    window_hours?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'gig_reminders_sent_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'gig_reminders_sent_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            gigs: {
                Row: {
                    additional_notes: string | null;
                    budget_amount: number;
                    created_at: string | null;
                    currency: string | null;
                    description: string | null;
                    display_image: string | null;
                    dress_code: string | null;
                    duration_minutes: number | null;
                    employer_id: string;
                    gig_address: string | null;
                    gig_date: string;
                    gig_end_time: string | null;
                    gig_location: string | null;
                    gig_post_code: string | null;
                    gig_start_time: string | null;
                    gig_type: string | null;
                    id: string;
                    is_equipment_required: boolean | null;
                    is_remote: boolean | null;
                    location_latitude: number | null;
                    location_longitude: number | null;
                    location_name: string | null;
                    required_talent_count: number;
                    service_id: string | null;
                    skill_required: string[] | null;
                    status: Database['public']['Enums']['gig_status'] | null;
                    title: string;
                    updated_at: string | null;
                };
                Insert: {
                    additional_notes?: string | null;
                    budget_amount: number;
                    created_at?: string | null;
                    currency?: string | null;
                    description?: string | null;
                    display_image?: string | null;
                    dress_code?: string | null;
                    duration_minutes?: number | null;
                    employer_id: string;
                    gig_address?: string | null;
                    gig_date: string;
                    gig_end_time?: string | null;
                    gig_location?: string | null;
                    gig_post_code?: string | null;
                    gig_start_time?: string | null;
                    gig_type?: string | null;
                    id?: string;
                    is_equipment_required?: boolean | null;
                    is_remote?: boolean | null;
                    location_latitude?: number | null;
                    location_longitude?: number | null;
                    location_name?: string | null;
                    required_talent_count?: number;
                    service_id?: string | null;
                    skill_required?: string[] | null;
                    status?: Database['public']['Enums']['gig_status'] | null;
                    title: string;
                    updated_at?: string | null;
                };
                Update: {
                    additional_notes?: string | null;
                    budget_amount?: number;
                    created_at?: string | null;
                    currency?: string | null;
                    description?: string | null;
                    display_image?: string | null;
                    dress_code?: string | null;
                    duration_minutes?: number | null;
                    employer_id?: string;
                    gig_address?: string | null;
                    gig_date?: string;
                    gig_end_time?: string | null;
                    gig_location?: string | null;
                    gig_post_code?: string | null;
                    gig_start_time?: string | null;
                    gig_type?: string | null;
                    id?: string;
                    is_equipment_required?: boolean | null;
                    is_remote?: boolean | null;
                    location_latitude?: number | null;
                    location_longitude?: number | null;
                    location_name?: string | null;
                    required_talent_count?: number;
                    service_id?: string | null;
                    skill_required?: string[] | null;
                    status?: Database['public']['Enums']['gig_status'] | null;
                    title?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'gigs_employer_id_fkey';
                        columns: ['employer_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'gigs_service_id_fkey';
                        columns: ['service_id'];
                        isOneToOne: false;
                        referencedRelation: 'services_catalog';
                        referencedColumns: ['id'];
                    },
                ];
            };
            gig_applications: {
                Row: {
                    applied_at: string;
                    employer_notes: string | null;
                    gig_id: string;
                    hired_at: string | null;
                    id: string;
                    proposal_message: string | null;
                    proposed_currency: string | null;
                    proposed_rate: number | null;
                    status: Database['public']['Enums']['application_status'];
                    talent_id: string;
                    updated_at: string;
                };
                Insert: {
                    applied_at?: string;
                    employer_notes?: string | null;
                    gig_id: string;
                    hired_at?: string | null;
                    id?: string;
                    proposal_message?: string | null;
                    proposed_currency?: string | null;
                    proposed_rate?: number | null;
                    status?: Database['public']['Enums']['application_status'];
                    talent_id: string;
                    updated_at?: string;
                };
                Update: {
                    applied_at?: string;
                    employer_notes?: string | null;
                    gig_id?: string;
                    hired_at?: string | null;
                    id?: string;
                    proposal_message?: string | null;
                    proposed_currency?: string | null;
                    proposed_rate?: number | null;
                    status?: Database['public']['Enums']['application_status'];
                    talent_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'gig_applications_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'gig_applications_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            disputes: {
                Row: {
                    admin_notes: string | null;
                    created_at: string | null;
                    description: string | null;
                    gig_id: string | null;
                    id: string;
                    payment_id: string | null;
                    raised_by: string | null;
                    reason: string;
                    resolved_at: string | null;
                    resolved_by: string | null;
                    status: string;
                    updated_at: string | null;
                };
                Insert: {
                    admin_notes?: string | null;
                    created_at?: string | null;
                    description?: string | null;
                    gig_id?: string | null;
                    id?: string;
                    payment_id?: string | null;
                    raised_by?: string | null;
                    reason: string;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                    status?: string;
                    updated_at?: string | null;
                };
                Update: {
                    admin_notes?: string | null;
                    created_at?: string | null;
                    description?: string | null;
                    gig_id?: string | null;
                    id?: string;
                    payment_id?: string | null;
                    raised_by?: string | null;
                    reason?: string;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                    status?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            dispute_evidence: {
                Row: {
                    created_at: string | null;
                    dispute_id: string | null;
                    evidence_type: string | null;
                    file_url: string | null;
                    id: string;
                    notes: string | null;
                    uploaded_by: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    dispute_id?: string | null;
                    evidence_type?: string | null;
                    file_url?: string | null;
                    id?: string;
                    notes?: string | null;
                    uploaded_by?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    dispute_id?: string | null;
                    evidence_type?: string | null;
                    file_url?: string | null;
                    id?: string;
                    notes?: string | null;
                    uploaded_by?: string | null;
                };
                Relationships: [];
            };
            conversation_archives: {
                Row: {
                    archived_at: string;
                    conversation_id: string;
                    user_id: string;
                };
                Insert: {
                    archived_at?: string;
                    conversation_id: string;
                    user_id: string;
                };
                Update: {
                    archived_at?: string;
                    conversation_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'conversation_archives_conversation_id_fkey';
                        columns: ['conversation_id'];
                        isOneToOne: false;
                        referencedRelation: 'conversations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'conversation_archives_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            conversations: {
                Row: {
                    created_at: string;
                    employer_id: string;
                    gig_id: string | null;
                    id: string;
                    last_message_at: string | null;
                    talent_id: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    employer_id: string;
                    gig_id?: string | null;
                    id?: string;
                    last_message_at?: string | null;
                    talent_id: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    employer_id?: string;
                    gig_id?: string | null;
                    id?: string;
                    last_message_at?: string | null;
                    talent_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'conversations_employer_id_fkey';
                        columns: ['employer_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'conversations_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'conversations_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            gig_offers: {
                Row: {
                    accepted_at: string | null;
                    counter_amount: number | null;
                    counter_message: string | null;
                    created_at: string;
                    currency: string;
                    declined_at: string | null;
                    employer_id: string;
                    expires_at: string | null;
                    gig_id: string;
                    id: string;
                    message: string | null;
                    proposed_rate: number | null;
                    responded_at: string | null;
                    status: Database['public']['Enums']['offer_status'];
                    talent_id: string;
                    updated_at: string;
                };
                Insert: {
                    accepted_at?: string | null;
                    counter_amount?: number | null;
                    counter_message?: string | null;
                    created_at?: string;
                    currency?: string;
                    declined_at?: string | null;
                    employer_id: string;
                    expires_at?: string | null;
                    gig_id: string;
                    id?: string;
                    message?: string | null;
                    proposed_rate?: number | null;
                    responded_at?: string | null;
                    status?: Database['public']['Enums']['offer_status'];
                    talent_id: string;
                    updated_at?: string;
                };
                Update: {
                    accepted_at?: string | null;
                    counter_amount?: number | null;
                    counter_message?: string | null;
                    created_at?: string;
                    currency?: string;
                    declined_at?: string | null;
                    employer_id?: string;
                    expires_at?: string | null;
                    gig_id?: string;
                    id?: string;
                    message?: string | null;
                    proposed_rate?: number | null;
                    responded_at?: string | null;
                    status?: Database['public']['Enums']['offer_status'];
                    talent_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'gig_offers_employer_id_fkey';
                        columns: ['employer_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'gig_offers_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'gig_offers_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            identity_verifications: {
                Row: {
                    created_at: string;
                    id: string;
                    id_type: Database['public']['Enums']['identity_document_type'] | null;
                    media_url: string | null;
                    notes: string | null;
                    provider: string;
                    provider_applicant_id: string | null;
                    provider_level_name: string | null;
                    provider_payload: Json | null;
                    provider_review_result: string | null;
                    provider_review_status: string | null;
                    reviewed_at: string | null;
                    selfie_url: string | null;
                    status: Database['public']['Enums']['verification_status'];
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    id_type?: Database['public']['Enums']['identity_document_type'] | null;
                    media_url?: string | null;
                    notes?: string | null;
                    provider?: string;
                    provider_applicant_id?: string | null;
                    provider_level_name?: string | null;
                    provider_payload?: Json | null;
                    provider_review_result?: string | null;
                    provider_review_status?: string | null;
                    reviewed_at?: string | null;
                    selfie_url?: string | null;
                    status?: Database['public']['Enums']['verification_status'];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    id_type?: Database['public']['Enums']['identity_document_type'] | null;
                    media_url?: string | null;
                    notes?: string | null;
                    provider?: string;
                    provider_applicant_id?: string | null;
                    provider_level_name?: string | null;
                    provider_payload?: Json | null;
                    provider_review_result?: string | null;
                    provider_review_status?: string | null;
                    reviewed_at?: string | null;
                    selfie_url?: string | null;
                    status?: Database['public']['Enums']['verification_status'];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'identity_verifications_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            messages: {
                Row: {
                    attachment_url: string | null;
                    body: string;
                    conversation_id: string;
                    created_at: string;
                    id: string;
                    read_at: string | null;
                    sender_id: string;
                };
                Insert: {
                    attachment_url?: string | null;
                    body: string;
                    conversation_id: string;
                    created_at?: string;
                    id?: string;
                    read_at?: string | null;
                    sender_id: string;
                };
                Update: {
                    attachment_url?: string | null;
                    body?: string;
                    conversation_id?: string;
                    created_at?: string;
                    id?: string;
                    read_at?: string | null;
                    sender_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'messages_conversation_id_fkey';
                        columns: ['conversation_id'];
                        isOneToOne: false;
                        referencedRelation: 'conversations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'messages_sender_id_fkey';
                        columns: ['sender_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            message_reports: {
                Row: {
                    conversation_id: string;
                    created_at: string;
                    description: string | null;
                    id: string;
                    message_id: string;
                    reason: string;
                    reported_user_id: string;
                    reporter_id: string;
                    resolved_at: string | null;
                    resolved_by: string | null;
                    status: Database['public']['Enums']['message_report_status'];
                };
                Insert: {
                    conversation_id: string;
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    message_id: string;
                    reason: string;
                    reported_user_id: string;
                    reporter_id: string;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                    status?: Database['public']['Enums']['message_report_status'];
                };
                Update: {
                    conversation_id?: string;
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    message_id?: string;
                    reason?: string;
                    reported_user_id?: string;
                    reporter_id?: string;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                    status?: Database['public']['Enums']['message_report_status'];
                };
                Relationships: [
                    {
                        foreignKeyName: 'message_reports_conversation_id_fkey';
                        columns: ['conversation_id'];
                        isOneToOne: false;
                        referencedRelation: 'conversations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'message_reports_message_id_fkey';
                        columns: ['message_id'];
                        isOneToOne: false;
                        referencedRelation: 'messages';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'message_reports_reported_user_id_fkey';
                        columns: ['reported_user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'message_reports_reporter_id_fkey';
                        columns: ['reporter_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'message_reports_resolved_by_fkey';
                        columns: ['resolved_by'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            notification_preferences: {
                Row: {
                    created_at: string;
                    email_enabled: boolean;
                    gig_updates: boolean;
                    marketing_enabled: boolean;
                    message_updates: boolean;
                    payment_updates: boolean;
                    push_enabled: boolean;
                    push_gig_updates: boolean;
                    push_message_updates: boolean;
                    push_payment_updates: boolean;
                    push_security_alerts: boolean;
                    security_alerts: boolean;
                    sms_enabled: boolean;
                    sms_gig_updates: boolean;
                    sms_payment_updates: boolean;
                    sms_security_alerts: boolean;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    email_enabled?: boolean;
                    gig_updates?: boolean;
                    marketing_enabled?: boolean;
                    message_updates?: boolean;
                    payment_updates?: boolean;
                    push_enabled?: boolean;
                    push_gig_updates?: boolean;
                    push_message_updates?: boolean;
                    push_payment_updates?: boolean;
                    push_security_alerts?: boolean;
                    security_alerts?: boolean;
                    sms_enabled?: boolean;
                    sms_gig_updates?: boolean;
                    sms_payment_updates?: boolean;
                    sms_security_alerts?: boolean;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    email_enabled?: boolean;
                    gig_updates?: boolean;
                    marketing_enabled?: boolean;
                    message_updates?: boolean;
                    payment_updates?: boolean;
                    push_enabled?: boolean;
                    push_gig_updates?: boolean;
                    push_message_updates?: boolean;
                    push_payment_updates?: boolean;
                    push_security_alerts?: boolean;
                    security_alerts?: boolean;
                    sms_enabled?: boolean;
                    sms_gig_updates?: boolean;
                    sms_payment_updates?: boolean;
                    sms_security_alerts?: boolean;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'notification_preferences_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: true;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            notifications: {
                Row: {
                    channel: Database['public']['Enums']['notification_channel'];
                    created_at: string;
                    id: string;
                    is_read: boolean;
                    message: string | null;
                    payload: Json;
                    read_at: string | null;
                    sent_at: string | null;
                    title: string;
                    type: Database['public']['Enums']['notification_type'];
                    user_id: string;
                };
                Insert: {
                    channel?: Database['public']['Enums']['notification_channel'];
                    created_at?: string;
                    id?: string;
                    is_read?: boolean;
                    message?: string | null;
                    payload?: Json;
                    read_at?: string | null;
                    sent_at?: string | null;
                    title: string;
                    type: Database['public']['Enums']['notification_type'];
                    user_id: string;
                };
                Update: {
                    channel?: Database['public']['Enums']['notification_channel'];
                    created_at?: string;
                    id?: string;
                    is_read?: boolean;
                    message?: string | null;
                    payload?: Json;
                    read_at?: string | null;
                    sent_at?: string | null;
                    title?: string;
                    type?: Database['public']['Enums']['notification_type'];
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'notifications_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            payout_methods: {
                Row: {
                    created_at: string | null;
                    display_label: string | null;
                    external_account_id: string | null;
                    id: string;
                    is_default: boolean | null;
                    is_verified: boolean | null;
                    metadata: Json | null;
                    provider: string;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    display_label?: string | null;
                    external_account_id?: string | null;
                    id?: string;
                    is_default?: boolean | null;
                    is_verified?: boolean | null;
                    metadata?: Json | null;
                    provider: string;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    display_label?: string | null;
                    external_account_id?: string | null;
                    id?: string;
                    is_default?: boolean | null;
                    is_verified?: boolean | null;
                    metadata?: Json | null;
                    provider?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            payments: {
                Row: {
                    amount: number;
                    application_id: string | null;
                    created_at: string;
                    currency: string;
                    employer_id: string;
                    gig_id: string | null;
                    id: string;
                    metadata: Json;
                    paid_at: string | null;
                    payment_reference: string | null;
                    platform_fee: number;
                    provider: Database['public']['Enums']['payment_provider'];
                    status: Database['public']['Enums']['payment_status'];
                    talent_id: string;
                    updated_at: string;
                };
                Insert: {
                    amount: number;
                    application_id?: string | null;
                    created_at?: string;
                    currency?: string;
                    employer_id: string;
                    gig_id?: string | null;
                    id?: string;
                    metadata?: Json;
                    paid_at?: string | null;
                    payment_reference?: string | null;
                    platform_fee?: number;
                    provider?: Database['public']['Enums']['payment_provider'];
                    status?: Database['public']['Enums']['payment_status'];
                    talent_id: string;
                    updated_at?: string;
                };
                Update: {
                    amount?: number;
                    application_id?: string | null;
                    created_at?: string;
                    currency?: string;
                    employer_id?: string;
                    gig_id?: string | null;
                    id?: string;
                    metadata?: Json;
                    paid_at?: string | null;
                    payment_reference?: string | null;
                    platform_fee?: number;
                    provider?: Database['public']['Enums']['payment_provider'];
                    status?: Database['public']['Enums']['payment_status'];
                    talent_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'payments_application_id_fkey';
                        columns: ['application_id'];
                        isOneToOne: false;
                        referencedRelation: 'gig_applications';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'payments_employer_id_fkey';
                        columns: ['employer_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'payments_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'payments_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            payout_requests: {
                Row: {
                    amount: number;
                    created_at: string;
                    currency: string;
                    external_provider: string | null;
                    external_transfer_id: string | null;
                    id: string;
                    note: string | null;
                    paid_at: string | null;
                    paid_by: string | null;
                    processed_at: string | null;
                    status: Database['public']['Enums']['payout_status'];
                    talent_id: string;
                    updated_at: string;
                };
                Insert: {
                    amount: number;
                    created_at?: string;
                    currency?: string;
                    external_provider?: string | null;
                    external_transfer_id?: string | null;
                    id?: string;
                    note?: string | null;
                    paid_at?: string | null;
                    paid_by?: string | null;
                    processed_at?: string | null;
                    status?: Database['public']['Enums']['payout_status'];
                    talent_id: string;
                    updated_at?: string;
                };
                Update: {
                    amount?: number;
                    created_at?: string;
                    currency?: string;
                    external_provider?: string | null;
                    external_transfer_id?: string | null;
                    id?: string;
                    note?: string | null;
                    paid_at?: string | null;
                    paid_by?: string | null;
                    processed_at?: string | null;
                    status?: Database['public']['Enums']['payout_status'];
                    talent_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'payout_requests_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            payment_release_otps: {
                Row: {
                    attempts: number;
                    code_hash: string;
                    consumed_at: string | null;
                    created_at: string;
                    employer_id: string;
                    expires_at: string;
                    id: string;
                    last_sent_at: string;
                    payment_id: string;
                    updated_at: string;
                };
                Insert: {
                    attempts?: number;
                    code_hash: string;
                    consumed_at?: string | null;
                    created_at?: string;
                    employer_id: string;
                    expires_at: string;
                    id?: string;
                    last_sent_at?: string;
                    payment_id: string;
                    updated_at?: string;
                };
                Update: {
                    attempts?: number;
                    code_hash?: string;
                    consumed_at?: string | null;
                    created_at?: string;
                    employer_id?: string;
                    expires_at?: string;
                    id?: string;
                    last_sent_at?: string;
                    payment_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'payment_release_otps_employer_id_fkey';
                        columns: ['employer_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'payment_release_otps_payment_id_fkey';
                        columns: ['payment_id'];
                        isOneToOne: false;
                        referencedRelation: 'payments';
                        referencedColumns: ['id'];
                    },
                ];
            };
            reports: {
                Row: {
                    category: string | null;
                    created_at: string;
                    gig_id: string | null;
                    id: string;
                    reason: string;
                    reported_user_id: string;
                    reporter_id: string;
                    resolution_note: string | null;
                    reviewed_at: string | null;
                    reviewed_by: string | null;
                    status: Database['public']['Enums']['report_status'];
                    updated_at: string;
                };
                Insert: {
                    category?: string | null;
                    created_at?: string;
                    gig_id?: string | null;
                    id?: string;
                    reason: string;
                    reported_user_id: string;
                    reporter_id: string;
                    resolution_note?: string | null;
                    reviewed_at?: string | null;
                    reviewed_by?: string | null;
                    status?: Database['public']['Enums']['report_status'];
                    updated_at?: string;
                };
                Update: {
                    category?: string | null;
                    created_at?: string;
                    gig_id?: string | null;
                    id?: string;
                    reason?: string;
                    reported_user_id?: string;
                    reporter_id?: string;
                    resolution_note?: string | null;
                    reviewed_at?: string | null;
                    reviewed_by?: string | null;
                    status?: Database['public']['Enums']['report_status'];
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reports_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reports_reported_user_id_fkey';
                        columns: ['reported_user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reports_reporter_id_fkey';
                        columns: ['reporter_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reports_reviewed_by_fkey';
                        columns: ['reviewed_by'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            saved_gigs: {
                Row: {
                    created_at: string;
                    gig_id: string;
                    id: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    gig_id: string;
                    id?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    gig_id?: string;
                    id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'saved_gigs_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'saved_gigs_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            saved_talents: {
                Row: {
                    created_at: string;
                    id: string;
                    talent_id: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    talent_id: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    talent_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'saved_talents_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'saved_talents_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            role_permissions: {
                Row: {
                    created_at: string;
                    id: string;
                    permission: string;
                    role: Database['public']['Enums']['user_role'];
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    permission: string;
                    role: Database['public']['Enums']['user_role'];
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    permission?: string;
                    role?: Database['public']['Enums']['user_role'];
                    updated_at?: string;
                };
                Relationships: [];
            };
            services_catalog: {
                Row: {
                    category: string | null;
                    created_at: string | null;
                    icon_url: string | null;
                    id: string;
                    is_active: boolean | null;
                    name: string;
                };
                Insert: {
                    category?: string | null;
                    created_at?: string | null;
                    icon_url?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    name: string;
                };
                Update: {
                    category?: string | null;
                    created_at?: string | null;
                    icon_url?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    name?: string;
                };
                Relationships: [];
            };
            talent_availability: {
                Row: {
                    created_at: string;
                    gig_id: string | null;
                    id: string;
                    reason: string | null;
                    source: string;
                    talent_user_id: string;
                    unavailable_from: string;
                    unavailable_until: string;
                };
                Insert: {
                    created_at?: string;
                    gig_id?: string | null;
                    id?: string;
                    reason?: string | null;
                    source?: string;
                    talent_user_id: string;
                    unavailable_from: string;
                    unavailable_until: string;
                };
                Update: {
                    created_at?: string;
                    gig_id?: string | null;
                    id?: string;
                    reason?: string | null;
                    source?: string;
                    talent_user_id?: string;
                    unavailable_from?: string;
                    unavailable_until?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'talent_availability_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'talent_availability_talent_user_id_fkey';
                        columns: ['talent_user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            talent_portfolios: {
                Row: {
                    created_at: string;
                    deleted_at: string | null;
                    id: string;
                    portfolio_url: string;
                    talent_id: string;
                    view_count: number;
                };
                Insert: {
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    portfolio_url: string;
                    talent_id: string;
                    view_count?: number;
                };
                Update: {
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    portfolio_url?: string;
                    talent_id?: string;
                    view_count?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'talent_portfolios_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'talent_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            talent_profiles: {
                Row: {
                    account_number: string | null;
                    bank_name: string | null;
                    banner_url: string | null;
                    biography: string | null;
                    date_of_birth: string | null;
                    id: string;
                    max_rate: number | null;
                    min_rate: number;
                    primary_role: string | null;
                    rate_currency: string;
                    skills: Json[] | null;
                    stage_name: string | null;
                    updated_at: string | null;
                    user_id: string;
                    years_experience: number | null;
                };
                Insert: {
                    account_number?: string | null;
                    bank_name?: string | null;
                    banner_url?: string | null;
                    biography?: string | null;
                    date_of_birth?: string | null;
                    id?: string;
                    max_rate?: number | null;
                    min_rate?: number;
                    primary_role?: string | null;
                    rate_currency?: string;
                    skills?: Json[] | null;
                    stage_name?: string | null;
                    updated_at?: string | null;
                    user_id: string;
                    years_experience?: number | null;
                };
                Update: {
                    account_number?: string | null;
                    bank_name?: string | null;
                    banner_url?: string | null;
                    biography?: string | null;
                    date_of_birth?: string | null;
                    id?: string;
                    max_rate?: number | null;
                    min_rate?: number;
                    primary_role?: string | null;
                    rate_currency?: string;
                    skills?: Json[] | null;
                    stage_name?: string | null;
                    updated_at?: string | null;
                    user_id?: string;
                    years_experience?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'talent_profiles_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            talent_reviews: {
                Row: {
                    comment: string | null;
                    created_at: string | null;
                    gig_id: string | null;
                    id: string;
                    rating: number;
                    reviewer_id: string | null;
                    talent_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    comment?: string | null;
                    created_at?: string | null;
                    gig_id?: string | null;
                    id?: string;
                    rating: number;
                    reviewer_id?: string | null;
                    talent_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    comment?: string | null;
                    created_at?: string | null;
                    gig_id?: string | null;
                    id?: string;
                    rating?: number;
                    reviewer_id?: string | null;
                    talent_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reviews_gig_id_fkey';
                        columns: ['gig_id'];
                        isOneToOne: false;
                        referencedRelation: 'gigs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reviews_reviewer_id_fkey';
                        columns: ['reviewer_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'talent_reviews_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            talent_services: {
                Row: {
                    service_id: string;
                    talent_id: string;
                    years_experience: number | null;
                };
                Insert: {
                    service_id: string;
                    talent_id: string;
                    years_experience?: number | null;
                };
                Update: {
                    service_id?: string;
                    talent_id?: string;
                    years_experience?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'talent_services_service_id_fkey';
                        columns: ['service_id'];
                        isOneToOne: false;
                        referencedRelation: 'services_catalog';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'talent_services_talent_id_fkey';
                        columns: ['talent_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_blocks: {
                Row: {
                    blocked_id: string;
                    blocker_id: string;
                    created_at: string;
                    reason: string | null;
                };
                Insert: {
                    blocked_id: string;
                    blocker_id: string;
                    created_at?: string;
                    reason?: string | null;
                };
                Update: {
                    blocked_id?: string;
                    blocker_id?: string;
                    created_at?: string;
                    reason?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_blocks_blocked_id_fkey';
                        columns: ['blocked_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'user_blocks_blocker_id_fkey';
                        columns: ['blocker_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            users: {
                Row: {
                    acquisition_source: string | null;
                    bio: string | null;
                    created_at: string | null;
                    banner_image_url: string | null;
                    date_of_birth: string | null;
                    email: string | null;
                    first_name: string | null;
                    full_address: string | null;
                    gender: string | null;
                    id: string;
                    is_verified: boolean | null;
                    last_name: string | null;
                    location_city: string | null;
                    location_country: string | null;
                    location_latitude: number | null;
                    location_longitude: number | null;
                    onboarding_step: number | null;
                    phone_number: string | null;
                    post_code: number | null;
                    profile_image_url: string | null;
                    referral: string | null;
                    role: Database['public']['Enums']['user_role'] | null;
                    status: Database['public']['Enums']['user_status'];
                    street_address: string | null;
                    updated_at: string | null;
                    username: string | null;
                };
                Insert: {
                    acquisition_source?: string | null;
                    banner_image_url?: string | null;
                    bio?: string | null;
                    created_at?: string | null;
                    date_of_birth?: string | null;
                    email?: string | null;
                    first_name?: string | null;
                    full_address?: string | null;
                    gender?: string | null;
                    id: string;
                    is_verified?: boolean | null;
                    last_name?: string | null;
                    location_city?: string | null;
                    location_country?: string | null;
                    location_latitude?: number | null;
                    location_longitude?: number | null;
                    onboarding_step?: number | null;
                    phone_number?: string | null;
                    post_code?: number | null;
                    profile_image_url?: string | null;
                    referral?: string | null;
                    role?: Database['public']['Enums']['user_role'] | null;
                    status?: Database['public']['Enums']['user_status'];
                    street_address?: string | null;
                    updated_at?: string | null;
                    username?: string | null;
                };
                Update: {
                    acquisition_source?: string | null;
                    banner_image_url?: string | null;
                    bio?: string | null;
                    created_at?: string | null;
                    date_of_birth?: string | null;
                    email?: string | null;
                    first_name?: string | null;
                    full_address?: string | null;
                    gender?: string | null;
                    id?: string;
                    is_verified?: boolean | null;
                    last_name?: string | null;
                    location_city?: string | null;
                    location_country?: string | null;
                    location_latitude?: number | null;
                    location_longitude?: number | null;
                    onboarding_step?: number | null;
                    phone_number?: string | null;
                    post_code?: number | null;
                    profile_image_url?: string | null;
                    referral?: string | null;
                    role?: Database['public']['Enums']['user_role'] | null;
                    status?: Database['public']['Enums']['user_status'];
                    street_address?: string | null;
                    updated_at?: string | null;
                    username?: string | null;
                };
                Relationships: [];
            };
            waitlist_users: {
                Row: {
                    created_at: string;
                    email: string;
                    first_name: string | null;
                    id: number;
                    last_name: string | null;
                    location: string | null;
                };
                Insert: {
                    created_at?: string;
                    email: string;
                    first_name?: string | null;
                    id?: number;
                    last_name?: string | null;
                    location?: string | null;
                };
                Update: {
                    created_at?: string;
                    email?: string;
                    first_name?: string | null;
                    id?: number;
                    last_name?: string | null;
                    location?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_talent_avg_rating: { Args: { tid: string }; Returns: number };
            get_talent_rating_summary_full: {
                Args: { tid: string };
                Returns: {
                    count: number;
                    rating: number;
                }[];
            };
        };
        Enums: {
            application_status: 'submitted' | 'reviewing' | 'shortlisted' | 'hired' | 'rejected' | 'withdrawn';
            activity_type:
                | 'user_joined'
                | 'gig_posted'
                | 'gig_applied'
                | 'gig_started'
                | 'gig_completed'
                | 'payment_received'
                | 'payout_requested'
                | 'review_posted';
            audit_result: 'success' | 'failure';
            gig_status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'expired' | 'disputed';
            identity_document_type: 'passport' | 'drivers_license' | 'national_id' | 'selfie_video';
            message_report_status: 'pending' | 'reviewing' | 'actioned' | 'dismissed';
            notification_channel: 'in_app' | 'email' | 'push' | 'sms';
            notification_type: 'gig_update' | 'application_update' | 'payment_update' | 'message_received' | 'security_alert' | 'marketing';
            offer_status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired' | 'countered';
            payment_provider: 'manual' | 'paystack' | 'flutterwave' | 'stripe';
            payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
            payout_status: 'requested' | 'approved' | 'paid' | 'rejected';
            report_status: 'open' | 'in_review' | 'resolved' | 'dismissed';
            user_role: 'talent' | 'employer' | 'admin';
            user_status: 'active' | 'suspended';
            verification_status: 'pending' | 'approved' | 'rejected';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
          Row: infer R;
      }
        ? R
        : never
    : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
          Insert: infer I;
      }
        ? I
        : never
    : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
          Update: infer U;
      }
        ? U
        : never
    : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
    public: {
        Enums: {
            application_status: ['submitted', 'reviewing', 'shortlisted', 'hired', 'rejected', 'withdrawn'],
            activity_type: [
                'user_joined',
                'gig_posted',
                'gig_applied',
                'gig_started',
                'gig_completed',
                'payment_received',
                'payout_requested',
                'review_posted',
            ],
            audit_result: ['success', 'failure'],
            gig_status: ['draft', 'open', 'in_progress', 'completed', 'cancelled', 'expired', 'disputed'],
            identity_document_type: ['passport', 'drivers_license', 'national_id', 'selfie_video'],
            message_report_status: ['pending', 'reviewing', 'actioned', 'dismissed'],
            notification_channel: ['in_app', 'email', 'push', 'sms'],
            notification_type: ['gig_update', 'application_update', 'payment_update', 'message_received', 'security_alert', 'marketing'],
            offer_status: ['pending', 'accepted', 'declined', 'withdrawn', 'expired', 'countered'],
            payment_provider: ['manual', 'paystack', 'flutterwave', 'stripe'],
            payment_status: ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'],
            payout_status: ['requested', 'approved', 'paid', 'rejected'],
            report_status: ['open', 'in_review', 'resolved', 'dismissed'],
            user_role: ['talent', 'employer', 'admin'],
            user_status: ['active', 'suspended'],
            verification_status: ['pending', 'approved', 'rejected'],
        },
    },
} as const;
