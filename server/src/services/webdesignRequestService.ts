import { supabaseAdmin } from './supabaseDb';
import { InternalServerError } from '../utils/errors';

export interface WebdesignRequest {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company?: string;
  request_type: 'new' | 'redesign';
  current_website_url?: string;
  project_description: string;
  files: Array<{
    filename: string;
    size: number;
    mimeType: string;
    storagePath?: string;
  }>;
  status: 'pending' | 'info_requested' | 'deposit_pending' | 'deposit_paid' | 'in_progress' | 'preview_sent' | 'final_payment_pending' | 'final_payment_paid' | 'completed' | 'cancelled';
  deposit_payment_id?: string;
  deposit_payment_link?: string;
  final_payment_id?: string;
  final_payment_link?: string;
  preview_url?: string;
  login_credentials?: {
    domain?: string;
    server?: string;
    username?: string;
    password?: string;
  };
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWebdesignRequestInput {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company?: string;
  request_type: 'new' | 'redesign';
  current_website_url?: string;
  project_description: string;
  files?: Array<{
    filename: string;
    size: number;
    mimeType: string;
    storagePath?: string;
  }>;
}

/**
 * Create a new webdesign request
 */
export async function createWebdesignRequest(
  input: CreateWebdesignRequestInput
): Promise<WebdesignRequest> {
  try {
    const { data, error } = await supabaseAdmin
      .from('webdesign_requests')
      .insert({
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone || null,
        company: input.company || null,
        request_type: input.request_type,
        current_website_url: input.current_website_url || null,
        project_description: input.project_description,
        files: input.files || [],
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerError(`Failed to create webdesign request: ${error.message}`);
    }

    return mapRowToRequest(data);
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw error;
    }
    throw new InternalServerError('Failed to create webdesign request');
  }
}

/**
 * Get webdesign request by ID
 */
export async function getWebdesignRequestById(id: string): Promise<WebdesignRequest | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('webdesign_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new InternalServerError(`Failed to get webdesign request: ${error.message}`);
    }

    return data ? mapRowToRequest(data) : null;
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw error;
    }
    throw new InternalServerError('Failed to get webdesign request');
  }
}

/**
 * Update webdesign request status
 */
export async function updateWebdesignRequestStatus(
  id: string,
  status: WebdesignRequest['status'],
  updates?: Partial<{
    deposit_payment_link?: string;
    deposit_payment_id?: string;
    final_payment_link?: string;
    final_payment_id?: string;
    preview_url?: string;
    login_credentials?: WebdesignRequest['login_credentials'];
    admin_notes?: string;
  }>
): Promise<WebdesignRequest> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (updates) {
      Object.assign(updateData, updates);
    }

    const { data, error } = await supabaseAdmin
      .from('webdesign_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerError(`Failed to update webdesign request: ${error.message}`);
    }

    return mapRowToRequest(data);
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw error;
    }
    throw new InternalServerError('Failed to update webdesign request');
  }
}

/**
 * Get all webdesign requests (for admin)
 */
export async function getAllWebdesignRequests(): Promise<WebdesignRequest[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('webdesign_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerError(`Failed to get webdesign requests: ${error.message}`);
    }

    return (data || []).map(mapRowToRequest);
  } catch (error) {
    if (error instanceof InternalServerError) {
      throw error;
    }
    throw new InternalServerError('Failed to get webdesign requests');
  }
}

/**
 * Map database row to WebdesignRequest
 */
function mapRowToRequest(row: any): WebdesignRequest {
  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    company: row.company,
    request_type: row.request_type,
    current_website_url: row.current_website_url,
    project_description: row.project_description,
    files: row.files || [],
    status: row.status,
    deposit_payment_id: row.deposit_payment_id,
    deposit_payment_link: row.deposit_payment_link,
    final_payment_id: row.final_payment_id,
    final_payment_link: row.final_payment_link,
    preview_url: row.preview_url,
    login_credentials: row.login_credentials,
    admin_notes: row.admin_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

