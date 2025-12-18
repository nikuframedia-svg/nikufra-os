"""
OpenTelemetry tracing setup.
"""
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.sdk.resources import Resource
import structlog

logger = structlog.get_logger()


def setup_tracing(app=None, db_engine=None):
    """
    Setup OpenTelemetry tracing.
    
    Args:
        app: FastAPI app (optional)
        db_engine: SQLAlchemy engine (optional)
    """
    # Create resource
    resource = Resource.create({
        "service.name": "prodplan-backend",
        "service.version": "1.0.0"
    })
    
    # Setup tracer provider
    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)
    
    # Add console exporter (for development)
    console_exporter = ConsoleSpanExporter()
    provider.add_span_processor(BatchSpanProcessor(console_exporter))
    
    # Instrument FastAPI
    if app:
        FastAPIInstrumentor.instrument_app(app)
        logger.info("fastapi_instrumented")
    
    # Instrument SQLAlchemy
    if db_engine:
        SQLAlchemyInstrumentor().instrument(engine=db_engine)
        logger.info("sqlalchemy_instrumented")
    
    logger.info("tracing_setup_complete")

