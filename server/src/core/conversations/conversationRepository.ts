import { supabaseAdmin } from '../../services/supabaseDb';
import { logger, redact } from '../../utils/logger';

export interface Conversation {
  id: string;
  location_id: string;
  channel: 'webchat' | 'whatsapp' | 'voice';
  external_user_id: string;
  created_at: string;
  last_message_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  location_id: string;
  channel: 'webchat' | 'whatsapp' | 'voice';
  role: 'user' | 'assistant' | 'system';
  text: string;
  external_message_id: string | null;
  raw_json: Record<string, any> | null;
  created_at: string;
}

export class ConversationRepository {
  /**
   * Get or create a conversation
   */
  async getOrCreateConversation(
    locationId: string,
    channel: 'webchat' | 'whatsapp' | 'voice',
    externalUserId: string
  ): Promise<Conversation> {
    // Try to find existing conversation
    const { data: existing, error: findError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('location_id', locationId)
      .eq('channel', channel)
      .eq('external_user_id', externalUserId)
      .maybeSingle();

    if (findError) {
      logger.error('conversations.find_failed', findError, redact({
        locationId,
        channel,
        externalUserId,
      }));
      throw new Error(`Failed to find conversation: ${findError.message}`);
    }

    if (existing) {
      return existing as Conversation;
    }

    // Create new conversation
    const now = new Date().toISOString();
    const { data: created, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        location_id: locationId,
        channel,
        external_user_id: externalUserId,
        created_at: now,
        last_message_at: now,
      })
      .select()
      .single();

    if (createError) {
      logger.error('conversations.create_failed', createError, redact({
        locationId,
        channel,
        externalUserId,
      }));
      throw new Error(`Failed to create conversation: ${createError.message}`);
    }

    return created as Conversation;
  }

  /**
   * Get conversation messages (last N messages for context)
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 20
  ): Promise<ConversationMessage[]> {
    const { data: messages, error } = await supabaseAdmin
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('conversations.get_messages_failed', error, redact({
        conversationId,
      }));
      // Return empty array on error (graceful fallback)
      return [];
    }

    return (messages || []) as ConversationMessage[];
  }

  /**
   * Save a message to the conversation
   */
  async saveMessage(
    conversationId: string,
    locationId: string,
    channel: 'webchat' | 'whatsapp' | 'voice',
    role: 'user' | 'assistant' | 'system',
    text: string,
    externalMessageId?: string,
    rawJson?: Record<string, any>
  ): Promise<ConversationMessage> {
    const { data: message, error } = await supabaseAdmin
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        location_id: locationId,
        channel,
        role,
        text,
        external_message_id: externalMessageId || null,
        raw_json: rawJson || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('conversations.save_message_failed', error, redact({
        conversationId,
        locationId,
        channel,
        role,
        textLength: text.length,
      }));
      throw new Error(`Failed to save message: ${error.message}`);
    }

    // Update conversation last_message_at
    await supabaseAdmin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return message as ConversationMessage;
  }

  /**
   * Check if a message with external_message_id already exists (for idempotency)
   */
  async messageExists(
    channel: 'webchat' | 'whatsapp' | 'voice',
    externalMessageId: string
  ): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('conversation_messages')
      .select('id')
      .eq('channel', channel)
      .eq('external_message_id', externalMessageId)
      .maybeSingle();

    if (error) {
      logger.error('conversations.check_message_exists_failed', error, redact({
        channel,
        externalMessageId,
      }));
      // On error, assume it doesn't exist (safer for idempotency)
      return false;
    }

    return !!data;
  }
}

export const conversationRepository = new ConversationRepository();
