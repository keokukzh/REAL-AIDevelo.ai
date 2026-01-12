export interface TwilioCallEvent {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: TwilioCallStatus;
  Direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  ApiVersion: string;
  AccountSid: string;
  [key: string]: any;
}

export type TwilioCallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled';

export interface TwilioStreamEvent {
  event: 'connected' | 'start' | 'media' | 'stop' | 'mark' | 'clear';
  sequenceNumber?: string;
  media?: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string;
  };
  streamSid?: string;
  stop?: {
    accountSid: string;
    callSid: string;
  };
  mark?: {
    name: string;
  };
}

export interface VoiceConnectionConfig {
  voice?: string;
  language?: string;
  record?: boolean;
}
