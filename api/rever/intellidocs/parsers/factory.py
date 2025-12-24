"""
Document Parser Factory - Registry-based factory for document parsers
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from rever.intellidocs.parsers.base import BaseParser


class DocumentParserFactory:
    """
    Factory for creating document parsers using a registry pattern.
    Allows dynamic registration of new parser types.
    """

    _registry: dict[str, type[BaseParser]] = {}

    @classmethod
    def register(cls, document_type: str, parser_class: type[BaseParser]) -> None:
        """Register a parser class for a document type."""
        cls._registry[document_type] = parser_class

    @classmethod
    def get_parser(cls, document_type: str) -> BaseParser:
        """
        Get a parser instance for the given document type.
        Raises ValueError if document type is not registered.
        """
        if document_type not in cls._registry:
            registered = list(cls._registry.keys())
            raise ValueError(
                f"Unknown document type: {document_type}. "
                f"Registered types: {registered}"
            )
        return cls._registry[document_type]()

    @classmethod
    def get_registered_types(cls) -> list[str]:
        """Return list of registered document types."""
        return list(cls._registry.keys())


def _register_parsers() -> None:
    """Register all parsers. Called at module load time."""
    from rever.intellidocs.parsers.bill_parser import BillParser
    from rever.intellidocs.parsers.purchase_order_parser import PurchaseOrderParser

    DocumentParserFactory.register("bill", BillParser)
    DocumentParserFactory.register("purchase_order", PurchaseOrderParser)


# Auto-register parsers on import
_register_parsers()

