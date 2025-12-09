// Observability is optional for local development. Attempt to dynamically require
// OpenTelemetry packages so the application can still run if the packages are
// not installed (for example in constrained CI environments or when building
// only supporting services locally).

let NodeSDK: any = null;
let getNodeAutoInstrumentations: any = null;
let OTLPTraceExporter: any = null;
let PeriodicExportingMetricReader: any = null;
let Resource: any = null;
let SemanticResourceAttributes: any = null;

try {
  // Require at runtime so missing packages don't blow up dev startup.
  // Keep types as `any` to avoid compile errors if @types/* aren't present.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NodeSDK = require('@opentelemetry/sdk-node').NodeSDK;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  getNodeAutoInstrumentations = require('@opentelemetry/auto-instrumentations-node').getNodeAutoInstrumentations;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  OTLPTraceExporter = require('@opentelemetry/exporter-trace-otlp-http').OTLPTraceExporter;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PeriodicExportingMetricReader = require('@opentelemetry/sdk-metrics').PeriodicExportingMetricReader;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Resource = require('@opentelemetry/resources').Resource;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SemanticResourceAttributes = require('@opentelemetry/semantic-conventions').SemanticResourceAttributes;
} catch (err) {
  // If packages are missing, fall back to a no-op observability setup for local dev.
  // This keeps the developer experience smooth when optional telemetry packages
  // aren't installed or can't be resolved during builds.
  // We intentionally swallow the error here and handle it in setupObservability().
}

/**
 * Setup OpenTelemetry observability for the AI Agent application
 * Configures tracing to send data to OTLP collector (e.g., http://localhost:4319)
 */
export function setupObservability(otlpEndpoint: string = 'http://localhost:4319') {
  // If OpenTelemetry runtime libs are not available, make this function a no-op
  // and return gracefully so the rest of the application can run.
  if (!NodeSDK || !getNodeAutoInstrumentations || !OTLPTraceExporter || !Resource || !SemanticResourceAttributes) {
    console.warn('[Observability] OpenTelemetry packages are not installed or could not be loaded — tracing disabled.');
    return null;
  }

  try {
    const traceExporter = new OTLPTraceExporter({
      url: otlpEndpoint,
      headers: {},
    });

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'aidevelo-agent-api',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      }),
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    console.log(`[Observability] OpenTelemetry tracing initialized with OTLP endpoint: ${otlpEndpoint}`);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('[Observability] OpenTelemetry SDK shut down gracefully'))
        .catch((e: any) => console.error('[Observability] Error shutting down OpenTelemetry SDK:', e));
    });

    return sdk;
  } catch (error) {
    console.error('[Observability] Failed to initialize OpenTelemetry:', error);
    throw error;
  }
}

export default setupObservability;
