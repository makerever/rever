from sentence_transformers import util

from rever.db.models import MatchResult

_model = None


def get_similarity_score(text1, text2):
    global _model
    if _model is None:
        import torch
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer("all-MiniLM-L6-v2")
        _model.to(torch.device("cpu"))

    emb1 = _model.encode(text1, convert_to_tensor=True)
    emb2 = _model.encode(text2, convert_to_tensor=True)
    return round(util.pytorch_cos_sim(emb1, emb2).item(), 4)


def match_items(bill):
    if bill.status != "in_review" or not bill.purchase_order:
        return

    po_items = list(bill.purchase_order.items.all())
    matched_po_indices = set()

    for bill_item in bill.items.all():
        best_match = None
        best_score = -1
        best_index = -1

        for idx, po_item in enumerate(po_items):
            if idx in matched_po_indices:
                continue

            score = get_similarity_score(bill_item.description, po_item.description)

            if score > best_score:
                best_score = score
                best_match = po_item
                best_index = idx

        if not best_match:
            continue

        if best_score >= 0.7:
            description_status = "matched"
        elif best_score >= 0.4:
            description_status = "partial"
        else:
            description_status = "mismatched"

        unit_price_status = bill_item.unit_price == best_match.unit_price
        quantity_status = bill_item.quantity <= best_match.quantity

        if description_status == "matched" and unit_price_status and quantity_status:
            overall_status = "matched"
        elif description_status == "matched" or (
            description_status == "partial" and (unit_price_status or quantity_status)
        ):
            overall_status = "partial"
        else:
            overall_status = "mismatched"

        MatchResult.objects.update_or_create(
            bill_item=bill_item,
            defaults={
                "bill": bill,
                "purchase_order": bill.purchase_order,
                "purchase_order_item": best_match,
                "match_type": "two_way",
                "description_score": best_score,
                "description_status": description_status,
                "unit_price_status": unit_price_status,
                "quantity_status": quantity_status,
                "overall_status": overall_status,
                "organization": bill.organization,
            },
        )

        matched_po_indices.add(best_index)


def match_single_item(bill_item):
    bill = bill_item.bill

    if bill.status != "in_review" or not bill.purchase_order:
        return

    po_items = list(bill.purchase_order.items.all())
    already_matched_po_ids = set(
        MatchResult.objects.filter(bill=bill)
        .exclude(bill_item=bill_item)
        .values_list("purchase_order_item_id", flat=True)
    )

    best_match = None
    best_score = -1

    for po_item in po_items:
        if po_item.id in already_matched_po_ids:
            continue

        score = get_similarity_score(bill_item.description, po_item.description)

        if score > best_score:
            best_score = score
            best_match = po_item

    if not best_match:
        return

    if best_score >= 0.7:
        description_status = "matched"
    elif best_score >= 0.4:
        description_status = "partial"
    else:
        description_status = "mismatched"

    unit_price_status = bill_item.unit_price == best_match.unit_price
    quantity_status = bill_item.quantity <= best_match.quantity

    if description_status == "matched" and unit_price_status and quantity_status:
        overall_status = "matched"
    elif description_status == "matched" or (
        description_status == "partial" and (unit_price_status or quantity_status)
    ):
        overall_status = "partial"
    else:
        overall_status = "mismatched"

    MatchResult.objects.update_or_create(
        bill_item=bill_item,
        defaults={
            "bill": bill,
            "purchase_order": bill.purchase_order,
            "purchase_order_item": best_match,
            "match_type": "two_way",
            "description_score": best_score,
            "description_status": description_status,
            "unit_price_status": unit_price_status,
            "quantity_status": quantity_status,
            "overall_status": overall_status,
            "organization": bill.organization,
        },
    )
