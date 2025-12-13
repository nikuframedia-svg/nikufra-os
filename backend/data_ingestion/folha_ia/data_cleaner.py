"""Data cleaning utilities for Folha IA ingestion."""
import pandas as pd
from datetime import datetime
from typing import Any, Optional
import numpy as np


def parse_date(date_value: Any) -> Optional[datetime]:
    """
    Parse date from various formats.
    
    Args:
        date_value: Date value (string, datetime, timestamp, etc.)
    
    Returns:
        Parsed datetime or None if invalid.
    """
    if pd.isna(date_value) or date_value is None:
        return None
    
    if isinstance(date_value, datetime):
        return date_value
    
    if isinstance(date_value, pd.Timestamp):
        return date_value.to_pydatetime()
    
    # Try parsing string
    if isinstance(date_value, str):
        # Common formats
        formats = [
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%d/%m/%Y %H:%M:%S",
            "%d/%m/%Y",
            "%d-%m-%Y %H:%M:%S",
            "%d-%m-%Y",
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_value.strip(), fmt)
            except (ValueError, AttributeError):
                continue
        
        # Try pandas parsing as fallback
        try:
            return pd.to_datetime(date_value).to_pydatetime()
        except (ValueError, TypeError):
            pass
    
    return None


def parse_numeric(value: Any) -> Optional[float]:
    """
    Parse numeric value, handling various formats.
    
    Args:
        value: Numeric value (string, number, etc.)
    
    Returns:
        Parsed float or None if invalid.
    """
    if pd.isna(value) or value is None:
        return None
    
    if isinstance(value, (int, float)):
        return float(value)
    
    if isinstance(value, str):
        # Remove common formatting
        cleaned = value.replace(",", ".").replace(" ", "").replace("€", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            pass
    
    return None


def clean_string(value: Any) -> Optional[str]:
    """
    Clean string value.
    
    Args:
        value: String value.
    
    Returns:
        Cleaned string or None if empty.
    """
    if pd.isna(value) or value is None:
        return None
    
    cleaned = str(value).strip()
    return cleaned if cleaned else None


def calculate_duration_minutes(start_date: Any, end_date: Any) -> Optional[float]:
    """
    Calculate duration in minutes between two dates.
    
    Args:
        start_date: Start date.
        end_date: End date.
    
    Returns:
        Duration in minutes or None if invalid.
    """
    start = parse_date(start_date)
    end = parse_date(end_date)
    
    if start is None or end is None:
        return None
    
    if end < start:
        return None  # Invalid duration
    
    delta = end - start
    return delta.total_seconds() / 60.0


def handle_duplicates(df: pd.DataFrame, key_columns: list) -> pd.DataFrame:
    """
    Handle duplicate rows based on key columns.
    
    Args:
        df: DataFrame to deduplicate.
        key_columns: Columns to use for identifying duplicates.
    
    Returns:
        DataFrame with duplicates removed (keeps first occurrence).
    """
    if not key_columns:
        return df
    
    # Only use columns that exist
    existing_keys = [col for col in key_columns if col in df.columns]
    
    if not existing_keys:
        return df
    
    # Remove duplicates, keeping first
    return df.drop_duplicates(subset=existing_keys, keep="first")


def fill_missing_with_default(df: pd.DataFrame, column_defaults: dict) -> pd.DataFrame:
    """
    Fill missing values with defaults.
    
    Args:
        df: DataFrame to fill.
        column_defaults: Dictionary mapping column names to default values.
    
    Returns:
        DataFrame with filled values.
    """
    df = df.copy()
    
    for col, default in column_defaults.items():
        if col in df.columns:
            df[col] = df[col].fillna(default)
    
    return df


