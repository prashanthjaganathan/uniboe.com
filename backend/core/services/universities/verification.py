"""
University verification service.

Handles verification of university email domains using Supabase database.
"""

import re
from typing import Any, Dict, List, Optional

from backend.db import supabase


class UniversityVerificationService:
    """
    Service for verifying university email domains.

    Uses Supabase database to validate that an email domain
    belongs to a legitimate US university.
    """

    async def get_all_universities(self) -> List[Dict[str, Any]]:
        """
        Fetch all US universities from Supabase database.

        Returns:
            List[Dict[str, Any]]: List of university dictionaries

        Raises:
            Exception: If database query fails

        Example:
            >>> service = UniversityVerificationService()
            >>> universities = await service.get_all_universities()
            >>> print(len(universities))
            16
        """
        try:
            response = supabase.table("universities").select("*").execute()

            if not response.data:
                return []

            return response.data

        except Exception as e:
            raise Exception(f"Failed to fetch universities from database: {str(e)}") from e

    async def get_university_by_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Get a single university by exact domain match.

        Args:
            domain: Domain name to search for (e.g., "nyu.edu")

        Returns:
            Dict or None: University data if found, None otherwise

        Example:
            >>> service = UniversityVerificationService()
            >>> uni = await service.get_university_by_domain("nyu.edu")
            >>> print(uni["name"])
            "New York University"
        """
        try:
            response = (
                supabase.table("universities").select("*").eq("domain", domain.lower()).execute()
            )

            if response.data and len(response.data) > 0:
                return response.data[0]

            return None

        except Exception as e:
            raise Exception(f"Failed to query university by domain: {str(e)}") from e

    async def verify_email_domain(self, email: str) -> Dict[str, Any]:
        """
        Verify if an email domain belongs to a US university.

        Args:
            email: Email address to verify (e.g., "student@nyu.edu")

        Returns:
            Dict with keys:
                - is_valid: bool - Whether domain is valid
                - university: Dict or None - University details if valid
                - message: str - Additional information

        Example:
            >>> service = UniversityVerificationService()
            >>> result = await service.verify_email_domain("student@nyu.edu")
            >>> print(result["is_valid"])
            True
        """
        # Extract domain from email
        domain = self._extract_domain(email)
        if not domain:
            return {"is_valid": False, "university": None, "message": "Invalid email format"}

        try:
            # Query database for university with this domain
            university = await self.get_university_by_domain(domain)

            if university:
                return {
                    "is_valid": True,
                    "university": university,
                    "message": "Email domain verified",
                }
            else:
                return {
                    "is_valid": False,
                    "university": None,
                    "message": f"Domain '{domain}' is not a recognized US university",
                }

        except Exception as e:
            return {
                "is_valid": False,
                "university": None,
                "message": f"Error during verification: {str(e)}",
            }

    def _extract_domain(self, email: str) -> Optional[str]:
        """
        Extract domain from email address.

        Args:
            email: Email address (e.g., "student@nyu.edu")

        Returns:
            str or None: Domain name (e.g., "nyu.edu") or None if invalid

        Example:
            >>> service = UniversityVerificationService()
            >>> service._extract_domain("student@nyu.edu")
            "nyu.edu"
        """
        # Basic email validation and domain extraction
        email_pattern = r"^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$"
        match = re.match(email_pattern, email.lower())

        if match:
            return match.group(1)
        return None

    async def search_universities(self, query: str) -> List[Dict[str, Any]]:
        """
        Search universities by name (case-insensitive).

        Args:
            query: Search query string (minimum 2 characters)

        Returns:
            List[Dict[str, Any]]: List of matching universities

        Example:
            >>> service = UniversityVerificationService()
            >>> results = await service.search_universities("New York")
            >>> print(len(results))
            2
        """
        if not query or len(query) < 2:
            return []

        try:
            # Use ilike for case-insensitive search
            response = (
                supabase.table("universities").select("*").ilike("name", f"%{query}%").execute()
            )

            if not response.data:
                return []

            return response.data

        except Exception as e:
            raise Exception(f"Error searching universities: {str(e)}") from e

    async def create_university(
        self, name: str, domain: str, country: str = "USA", state: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add a new university to the database.

        Args:
            name: University name
            domain: Primary domain (e.g., "university.edu")
            country: Country (default: "USA")
            state: State or province (optional)

        Returns:
            Dict: Created university data

        Raises:
            Exception: If insert fails
        """
        try:
            response = (
                supabase.table("universities")
                .insert(
                    {"name": name, "domain": domain.lower(), "country": country, "state": state}
                )
                .execute()
            )

            if response.data and len(response.data) > 0:
                return response.data[0]

            raise Exception("Failed to create university")

        except Exception as e:
            raise Exception(f"Error creating university: {str(e)}") from e


# Global service instance
_service_instance: Optional[UniversityVerificationService] = None


def get_university_service() -> UniversityVerificationService:
    """
    Get or create the global UniversityVerificationService instance.

    Returns:
        UniversityVerificationService: The global service instance
    """
    global _service_instance
    if _service_instance is None:
        _service_instance = UniversityVerificationService()
    return _service_instance
