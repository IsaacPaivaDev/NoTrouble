"""
Painel de Roadmap — router Django Ninja.

Visao de carga semanal e frentes de trabalho sobre os MESMOS cards do kanban.
Nao existe tabela de tarefas paralela: o painel le Card, ponto.

Convencoes deste projeto que o codigo respeita:
  - IDs sao UUID (nao int)
  - Card NAO tem FK direta para Board — o caminho e stage__board
  - due_date e DateTimeField (nao DateField) — convertido para data local antes
    de qualquer agrupamento por dia
  - Ownership vem de ownership.py, nao e reescrito aqui
  - Acao especializada usa POST, nunca PATCH (conflito ja conhecido no projeto)
  - Todas as rotas com barra final, como o resto da API

Contagem de queries (constante, independente do numero de cards):
  1. board (get_board_for_user)
  2. cards do board
  3. prefetch de tags
  4. frentes do board
  5. count de concluidas (all-time, ver JANELA_CONCLUIDOS_DIAS)
"""

import uuid
from datetime import datetime, time, timedelta
from typing import Dict, List, Optional

from django.utils import timezone
from ninja import Router, Schema
from ninja.errors import HttpError

from .models import Card, Frente
from .ownership import get_board_for_user, get_card_for_user, get_frente_for_user
from .metricas import (
    LIMIAR_SOBRECARGA_PADRAO,
    data_local as _data_local,
    janela_dias_uteis,
    montar_semana,
    nome_responsavel as _nome_responsavel,
    status_card as _status_card,
)

router = Router(tags=["painel"])

# Corte do payload: cards concluidos ha mais de N dias saem da listagem.
# Os contadores continuam refletindo o total all-time.
JANELA_CONCLUIDOS_DIAS = 30

COR_SEM_FRENTE = "#8A949E"
ORDEM_SEM_FRENTE = 9999


# =============================================================================
# SCHEMAS
# =============================================================================

class CardPainelOut(Schema):
    id: uuid.UUID
    titulo: str
    descricao: str = ""
    responsavel: Optional[str] = None
    etapa: Optional[str] = None
    prazo: Optional[str] = None            # dd/mm
    prazo_iso: Optional[str] = None        # AAAA-MM-DD (data local)
    status: str                            # feito|bloqueado|vencido|sem_prazo|a_fazer
    concluido: bool
    bloqueado_por: str = ""
    dias_bloqueado: Optional[int] = None
    prioridade: Optional[str] = None
    tags: List[str] = []
    frente_id: Optional[uuid.UUID] = None


class FrentePainelOut(Schema):
    id: Optional[uuid.UUID] = None
    nome: str
    cor: str
    ordem: int
    total: int
    concluidas: int
    cards: List[CardPainelOut]


class DiaPainelOut(Schema):
    data_iso: str
    dia: str
    rotulo: str                            # dd/mm
    hoje: bool
    carga: int
    carga_maxima_responsavel: int
    responsavel_sobrecarregado: Optional[str] = None
    sobrecarga: bool
    card_ids: List[uuid.UUID]


class ContadoresOut(Schema):
    vencidos: int
    bloqueados: int
    na_janela: int
    pendentes: int
    concluidas: int


class PainelOut(Schema):
    board_id: uuid.UUID
    board_nome: str
    gerado_em: str
    limiar_sobrecarga: int
    janela_dias: int
    contadores: ContadoresOut
    semana: List[DiaPainelOut]
    frentes: List[FrentePainelOut]


class BloqueioIn(Schema):
    blocked_by: str = ""


class FrenteIn(Schema):
    nome: str
    cor: str = "#67737E"
    ordem: int = 0


class FrenteOut(Schema):
    id: uuid.UUID
    nome: str
    cor: str
    ordem: int


class FrenteReorderIn(Schema):
    frente_ids: List[uuid.UUID]


class FrenteCardIn(Schema):
    """Atribuir card a uma frente. Nulo = manda para 'Sem frente'."""
    frente_id: Optional[uuid.UUID] = None


# =============================================================================
# HELPERS
# =============================================================================

def _exigir_plano(request) -> None:
    """Painel e recurso de plano Business.

    Regra: ADMIN (dono da conta) sempre tem acesso; os demais dependem do flag
    sandbox can_view_reports, que nasce False. A regra mora no model User, para
    o backend e o frontend lerem a mesma fonte de verdade.
    """
    user = request.auth
    if not user.can_access_painel():
        raise HttpError(
            403,
            "O Painel faz parte do plano Business. "
            "Fale com o administrador da sua equipe para liberar o acesso.",
        )


def _serializar(card, hoje) -> dict:
    due_local = _data_local(card.due_date)
    bloqueado_por = (card.blocked_by or "").strip()
    desde = card.blocked_since

    return {
        "id": card.id,
        "titulo": card.title,
        "descricao": (card.description or "")[:160],
        "responsavel": _nome_responsavel(card),
        "etapa": card.stage.name if card.stage_id else None,
        "prazo": due_local.strftime("%d/%m") if due_local else None,
        "prazo_iso": due_local.isoformat() if due_local else None,
        "status": _status_card(card, due_local, hoje),
        "concluido": bool(card.is_completed),
        "bloqueado_por": bloqueado_por,
        "dias_bloqueado": (hoje - desde).days if desde else None,
        "prioridade": card.priority,
        "tags": [t.name for t in card.tags.all()],
        "frente_id": card.frente_id,
    }


def _frente_payload(frente: Frente) -> dict:
    """Model em ingles, payload em pt-BR. A traducao mora aqui, num lugar so."""
    return {
        "id": frente.id,
        "nome": frente.name,
        "cor": frente.color,
        "ordem": frente.order,
    }


# =============================================================================
# ENDPOINT PRINCIPAL
# =============================================================================

@router.get("/boards/{board_id}/painel/", response=PainelOut)
def painel(
    request,
    board_id: uuid.UUID,
    dias: int = 5,
    limiar: int = LIMIAR_SOBRECARGA_PADRAO,
):
    _exigir_plano(request)
    board = get_board_for_user(request.auth, board_id)

    hoje = timezone.localdate()
    dias = max(1, min(dias, 21))
    limiar = max(1, min(limiar, 20))

    # ---- Corte de concluidos antigos ------------------------------------
    # Concluido ha mais de JANELA_CONCLUIDOS_DIAS sai da listagem, mas continua
    # nos contadores. Card marcado como concluido sem completed_at (legado) e
    # mantido: o NULL nao casa com o __lt e nao entra no exclude.
    corte = timezone.make_aware(
        datetime.combine(hoje - timedelta(days=JANELA_CONCLUIDOS_DIAS), time.min)
    )

    # ---- UMA query de cards. Todo o resto e agrupamento em memoria. ------
    cards = list(
        Card.objects
        .filter(stage__board_id=board.id)
        .exclude(is_completed=True, completed_at__lt=corte)
        .select_related("frente", "stage", "assignee")
        .prefetch_related("tags")
        .order_by("frente__order", "frente__name", "due_date", "id")
    )

    serializados = {c.id: _serializar(c, hoje) for c in cards}
    due_por_card = {c.id: _data_local(c.due_date) for c in cards}

    # ---- Faixa da semana (logica compartilhada com o Inicio) ------------
    janela = janela_dias_uteis(hoje, dias)
    semana = montar_semana(cards, janela, hoje, limiar)

    # ---- Agrupamento por frente -----------------------------------------
    frentes_do_board = list(board.frentes.all())
    baldes: Dict[uuid.UUID, list] = {f.id: [] for f in frentes_do_board}
    sem_frente = []

    for c in cards:
        alvo = baldes.get(c.frente_id) if c.frente_id else None
        (alvo if alvo is not None else sem_frente).append(serializados[c.id])

    saida_frentes = [
        {
            "id": f.id,
            "nome": f.name,
            "cor": f.color,
            "ordem": f.order,
            "total": len(baldes[f.id]),
            "concluidas": sum(1 for x in baldes[f.id] if x["concluido"]),
            "cards": baldes[f.id],
        }
        for f in frentes_do_board
        if baldes[f.id]
    ]

    # Board sem nenhuma frente cadastrada cai inteiro aqui e renderiza normal.
    if sem_frente:
        saida_frentes.append({
            "id": None,
            "nome": "Sem frente",
            "cor": COR_SEM_FRENTE,
            "ordem": ORDEM_SEM_FRENTE,
            "total": len(sem_frente),
            "concluidas": sum(1 for x in sem_frente if x["concluido"]),
            "cards": sem_frente,
        })

    # ---- Contadores ------------------------------------------------------
    todos = list(serializados.values())
    ids_janela = {i for d in semana for i in d["card_ids"]}

    # concluidas e all-time, nao so o que sobreviveu ao corte de 30 dias.
    total_concluidas = (
        Card.objects.filter(stage__board_id=board.id, is_completed=True).count()
    )

    return {
        "board_id": board.id,
        "board_nome": board.name,
        "gerado_em": timezone.localtime().isoformat(),
        "limiar_sobrecarga": limiar,
        "janela_dias": dias,
        "contadores": {
            "vencidos":   sum(1 for c in todos if c["status"] == "vencido"),
            "bloqueados": sum(1 for c in todos if c["status"] == "bloqueado"),
            "na_janela":  len(ids_janela),
            "pendentes":  sum(1 for c in todos if not c["concluido"]),
            "concluidas": total_concluidas,
        },
        "semana": semana,
        "frentes": saida_frentes,
    }


# =============================================================================
# BLOQUEIO — POST, nao PATCH
#
# Este projeto ja teve conflito entre PATCH em URL de recurso e endpoints
# genericos (o PATCH /cards/{id}/ existente). Acao especializada usa POST.
# =============================================================================

@router.post("/cards/{card_id}/bloqueio/", response=CardPainelOut)
def definir_bloqueio(request, card_id: uuid.UUID, payload: BloqueioIn):
    _exigir_plano(request)
    card = get_card_for_user(request.auth, card_id)

    card.blocked_by = (payload.blocked_by or "").strip()[:120]
    # blocked_since e recalculado no save() do model. O override injeta o campo
    # no update_fields sozinho quando o valor muda.
    card.save(update_fields=["blocked_by"])

    return _serializar(card, timezone.localdate())


# =============================================================================
# CRUD DE FRENTES
# =============================================================================

@router.get("/boards/{board_id}/frentes/", response=List[FrenteOut])
def listar_frentes(request, board_id: uuid.UUID):
    board = get_board_for_user(request.auth, board_id)
    return [_frente_payload(f) for f in board.frentes.all()]


@router.post("/boards/{board_id}/frentes/", response=FrenteOut)
def criar_frente(request, board_id: uuid.UUID, payload: FrenteIn):
    _exigir_plano(request)
    board = get_board_for_user(request.auth, board_id)

    nome = (payload.nome or "").strip()
    if not nome:
        raise HttpError(400, "A frente precisa de um nome.")

    # O unique_together do banco e case-sensitive; aqui a checagem e mais
    # estrita de proposito, para nao conviver "Fiscal" e "fiscal".
    if board.frentes.filter(name__iexact=nome).exists():
        raise HttpError(409, f"Ja existe uma frente chamada '{nome}' neste quadro.")

    frente = Frente.objects.create(
        board=board, name=nome[:80], color=payload.cor, order=payload.ordem
    )
    return _frente_payload(frente)


@router.put("/frentes/{frente_id}/", response=FrenteOut)
def editar_frente(request, frente_id: uuid.UUID, payload: FrenteIn):
    _exigir_plano(request)
    frente = get_frente_for_user(request.auth, frente_id)

    nome = (payload.nome or "").strip()
    if nome and nome.lower() != frente.name.lower():
        if Frente.objects.filter(board_id=frente.board_id, name__iexact=nome).exists():
            raise HttpError(409, f"Ja existe uma frente chamada '{nome}' neste quadro.")

    frente.name = nome[:80] or frente.name
    frente.color = payload.cor
    frente.order = payload.ordem
    frente.save(update_fields=["name", "color", "order"])
    return _frente_payload(frente)


@router.put("/boards/{board_id}/frentes/reorder/")
def reordenar_frentes(request, board_id: uuid.UUID, payload: FrenteReorderIn):
    _exigir_plano(request)
    # Garante que o board pertence a empresa antes de mexer em qualquer frente.
    get_board_for_user(request.auth, board_id)
    for index, f_id in enumerate(payload.frente_ids):
        Frente.objects.filter(id=f_id, board_id=board_id).update(order=index)
    return {"success": True}


@router.delete("/frentes/{frente_id}/")
def excluir_frente(request, frente_id: uuid.UUID):
    """Excluir frente NAO apaga card. O SET_NULL manda para 'Sem frente'."""
    _exigir_plano(request)
    frente = get_frente_for_user(request.auth, frente_id)
    afetados = frente.cards.count()
    frente.delete()
    return {"success": True, "cards_sem_frente": afetados}


@router.post("/cards/{card_id}/frente/")
def definir_frente_do_card(request, card_id: uuid.UUID, payload: FrenteCardIn):
    """POST, nao PATCH — mesmo motivo do endpoint de bloqueio."""
    _exigir_plano(request)
    card = get_card_for_user(request.auth, card_id)

    if payload.frente_id is None:
        card.frente = None
    else:
        frente = get_frente_for_user(request.auth, payload.frente_id)
        # A frente tem que ser do MESMO board do card, nao so da mesma empresa.
        if frente.board_id != card.stage.board_id:
            raise HttpError(400, "Essa frente pertence a outro quadro.")
        card.frente = frente

    card.save(update_fields=["frente"])
    return {"success": True, "frente_id": card.frente_id}