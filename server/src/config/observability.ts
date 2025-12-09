import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Setup OpenTelemetry observability for the AI Agent application
 * Configures tracing to send data to OTLP collector (e.g., http://localhost:4319)
 */
export function setupObservability(otlpEndpoint: string = 'http://localhost:4319') {
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
        .catch((err) => console.error('[Observability] Error shutting down OpenTelemetry SDK:', err));
    });

    return sdk;
  } catch (error) {
    console.error('[Observability] Failed to initialize OpenTelemetry:', error);
    throw error;
  }
}

export default setupObservability;
