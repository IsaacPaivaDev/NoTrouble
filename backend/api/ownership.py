"""
Helpers de ownership — fonte unica de verdade de acesso por empresa.

Extraidos do endpoints.py sem nenhuma alteracao de comportamento, para que
endpoints.py e painel_api.py possam importar dos dois lados sem import circular.

Toda rota que recebe um ID de Card/Checklist/Comment/Attachment/Stage/Board passa
pela empresa do usuario autenticado. Sem isso, qualquer usuario logado consegue
acessar dados de qualquer empresa se souber o UUID (defesa em profundidade).

Nota: estes helpers levantam 404 (nao 403) para recurso de outra empresa. E
proposital — nao revela a existencia do recurso. O 403 fica reservado para
gating de plano/permissao.
"""

from django.shortcuts import get_object_or_404

from .models import Board, Card, ChecklistItem, Comment, Attachment, Stage, Frente


def get_card_for_user(user, card_id):
    return get_object_or_404(
        Card,
        id=card_id,
        stage__board__company=user.company,
    )


def get_checklist_for_user(user, item_id):
    return get_object_or_404(
        ChecklistItem,
        id=item_id,
        card__stage__board__company=user.company,
    )


def get_comment_for_user(user, comment_id):
    return get_object_or_404(
        Comment,
        id=comment_id,
        card__stage__board__company=user.company,
    )


def get_attachment_for_user(user, attachment_id):
    return get_object_or_404(
        Attachment,
        id=attachment_id,
        card__stage__board__company=user.company,
    )


def get_stage_for_user(user, stage_id):
    return get_object_or_404(
        Stage,
        id=stage_id,
        board__company=user.company,
    )


def get_board_for_user(user, board_id):
    return get_object_or_404(Board, id=board_id, company=user.company)


def get_frente_for_user(user, frente_id):
    """Segue o mesmo padrao dos demais: Frente -> Board -> Company."""
    return get_object_or_404(
        Frente,
        id=frente_id,
        board__company=user.company,
    )