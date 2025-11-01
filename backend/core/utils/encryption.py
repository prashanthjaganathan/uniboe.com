"""
Encryption utility for securing chat messages.

Uses Fernet symmetric encryption to encrypt/decrypt messages at rest.
"""

import base64
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from backend.config import settings


def _get_fernet_key(password: Optional[str] = None) -> bytes:
    """
    Derive a Fernet key from a password using PBKDF2.

    Uses PBKDF2 with SHA256 to derive a 32-byte key from the password.
    If no password is provided, uses the SECRET_KEY from settings.

    Args:
        password: Password to derive key from (uses SECRET_KEY if None).

    Returns:
        bytes: Derived Fernet key suitable for encryption/decryption.

    Note:
        Uses a fixed salt for consistency. In production environments,
        consider using per-conversation salts stored securely.
    """
    if password is None:
        password = settings.SECRET_KEY

    # Use a fixed salt for consistency
    # In production, consider storing this securely or using per-conversation salts
    salt = b"uniboe_chat_salt_2024"

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend(),
    )

    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key


def encrypt_message(content: str, key: Optional[str] = None) -> str:
    """
    Encrypt a message using Fernet symmetric encryption.

    Encrypts the message content using Fernet (symmetric encryption) and
    returns a base64 encoded encrypted string suitable for database storage.

    Args:
        content: Plain text message to encrypt.
        key: Optional encryption key. If None, uses SECRET_KEY from settings.

    Returns:
        str: Base64 encoded encrypted message.

    Raises:
        ValueError: If content is empty or only whitespace.
        Exception: If encryption fails for any other reason.

    Example:
        >>> encrypted = encrypt_message("Hello, World!")
        >>> print(encrypted)
        'gAAAAABl...'
        >>> decrypted = decrypt_message(encrypted)
        >>> print(decrypted)
        'Hello, World!'

    Security Notes:
        - Uses Fernet symmetric encryption (AES 128 in CBC mode)
        - Includes timestamp and HMAC for authentication
        - Messages cannot be decrypted without the correct key
    """
    if not content or not content.strip():
        raise ValueError("Cannot encrypt empty content")

    try:
        fernet_key = _get_fernet_key(key)
        f = Fernet(fernet_key)
        encrypted_bytes = f.encrypt(content.encode("utf-8"))
        return encrypted_bytes.decode("utf-8")
    except ValueError:
        raise
    except Exception as e:
        raise Exception(f"Encryption failed: {str(e)}")


def decrypt_message(encrypted_content: str, key: Optional[str] = None) -> str:
    """
    Decrypt a message encrypted with Fernet.

    Decrypts a message that was encrypted using encrypt_message().

    Args:
        encrypted_content: Base64 encoded encrypted message.
        key: Optional encryption key. If None, uses SECRET_KEY from settings.

    Returns:
        str: Decrypted plain text message.

    Raises:
        ValueError: If encrypted_content is empty or invalid format.
        Exception: If decryption fails (wrong key, corrupted data, etc.).

    Example:
        >>> encrypted = encrypt_message("Secret message")
        >>> decrypted = decrypt_message(encrypted)
        >>> print(decrypted)
        'Secret message'

    Security Notes:
        - Decryption will fail if the wrong key is used
        - Decryption will fail if the encrypted data is corrupted
        - Fernet includes timestamp validation (tokens expire after ~100 years by default)
    """
    if not encrypted_content:
        raise ValueError("Cannot decrypt empty content")

    try:
        fernet_key = _get_fernet_key(key)
        f = Fernet(fernet_key)
        decrypted_bytes = f.decrypt(encrypted_content.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except ValueError:
        raise
    except Exception as e:
        raise Exception(f"Decryption failed: {str(e)}")


def generate_encryption_key() -> str:
    """
    Generate a new random Fernet encryption key.

    Generates a cryptographically secure random key suitable for Fernet encryption.
    This can be used to create per-conversation encryption keys for enhanced security.

    Returns:
        str: Base64 encoded Fernet key (URL-safe).

    Example:
        >>> key = generate_encryption_key()
        >>> encrypted = encrypt_message("Secret", key)
        >>> decrypted = decrypt_message(encrypted, key)
        >>> print(decrypted)
        'Secret'

    Use Cases:
        - Generate per-conversation encryption keys
        - Generate per-user encryption keys
        - Key rotation for enhanced security

    Note:
        Store generated keys securely. If a key is lost, encrypted data
        cannot be recovered.
    """
    return Fernet.generate_key().decode("utf-8")


def verify_encryption_key(key: str) -> bool:
    """
    Verify that a string is a valid Fernet encryption key.

    Checks if the provided string is a valid base64-encoded Fernet key.

    Args:
        key: String to verify as a valid Fernet key.

    Returns:
        bool: True if the key is valid, False otherwise.

    Example:
        >>> key = generate_encryption_key()
        >>> verify_encryption_key(key)
        True
        >>> verify_encryption_key("invalid_key")
        False
    """
    try:
        # Try to create a Fernet instance with the key
        Fernet(key.encode("utf-8"))
        return True
    except Exception:
        return False
