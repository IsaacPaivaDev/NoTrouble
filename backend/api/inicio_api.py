"""
Inicio — endpoint agregado da home, por EMPRESA (o Painel e por quadro).

Responde a pergunta "o que precisa de mim agora?" em vez de "quanto tem?".
Usa exatamente a mesma definicao de status do Painel (metricas.py), entao as
duas telas nunca mais discordam sobre os mesmos cards.

Sem gating de plano: Inicio e a home, todo mundo entra. O escopo (empresa
inteira ou so os proprios cards) vem de can_view_all_cards.

Contagem de queries (constante, independente do numero de cards):
  1. cards pendentes da empresa
  2. agregado por quadro (total e concluidas)
  3. quadros da empresa
  4. usuarios da empresa
"""

import uuid
from typing import List, Optional

from django.db.models import Count, Q
from django.utils import timezone
from ninja import Router, Schema

from .models import Board, Card, User
from .metricas import (
    GRAVIDADE,
    LIMIAR_SOBRECARGA_PADRAO,
    aplicar_escopo,
    data_local,
    janela_dias_uteis,
    montar_semana,
    nome_responsavel,
    pode_ver_todos_os_cards,
    status_card,
)

router = Router(tags=["inicio"])

TETO_PENDENCIAS = 20


class PendenciaOut(Schema):
    id: uuid.UUID
    titulo: str
    board_id: uuid.UUID
    board_nome: str
    etapa: Optional[str] = None
    responsavel: Optional[str] = None
    status: str
    prazo: Optional[str] = None
    detalhe: str            # "venceu ha 3 dias", "parado com Getulio ha 2 dias"


class QuadroOut(Schema):
    id: uuid.UUID
    nome: str
    total: int
    concluidas: int
    pendentes: int
    vencidos: int
    progresso: int          # 0-100


class PessoaOut(Schema):
    id: int
    nome: str
    abertos: int
    vencidos: int


class DiaOut(Schema):
    data_iso: str
    dia: str
    rotulo: str
    hoje: bool
    carga: int
    carga_maxima_responsavel: int
    responsavel_sobrecarregado: Optional[str] = None
    sobrecarga: bool
    card_ids: List[uuid.UUID]


class ContadoresOut(Schema):
    vencidos: int
    bloqueados: int
    vencem_hoje: int
    pendentes: int
    concluidas: int


class InicioOut(Schema):
    escopo: str             # 'empresa' | 'proprios'
    limiar_sobrecarga: int
    contadores: ContadoresOut
    pendencias: List[PendenciaOut]
    pendencias_ocultas: int
    semana: List[DiaOut]
    quadros: List[QuadroOut]
    equipe: List[PessoaOut]


def _detalhe(status, due_local, card, hoje):
    if status == "bloqueado":
        desde = card.blocked_since
        dias = (hoje - desde).days if desde else None
        quem = (card.blocked_by or "").strip()
        if dias is None:
            return f"parado com {quem}"
        if dias == 0:
            return f"parado com {quem} desde hoje"
        if dias == 1:
            return f"parado com {quem} ha 1 dia"
        return f"parado com {quem} ha {dias} dias"

    if status == "vencido":
        dias = (hoje - due_local).days
        if dias == 1:
            return "venceu ontem"
        return f"venceu ha {dias} dias"

    if status == "a_fazer" and due_local == hoje:
        return "vence hoje"

    return ""


@router.get("/analytics/inicio/", response=InicioOut)
def inicio(request, dias: int = 5, limiar: int = LIMIAR_SOBRECARGA_PADRAO):
    user = request.auth
    hoje = timezone.localdate()
    dias = max(1, min(dias, 21))
    limiar = max(1, min(limiar, 20))

    da_empresa = Card.objects.filter(stage__board__company=user.company)

    # 1. Pendentes — a base da tela. Concluidos nao entram aqui; eles aparecem
    #    so nos contadores e no progresso dos quadros (query 2).
    pendentes = list(
        aplicar_escopo(da_empresa.filter(is_completed=False), user)
        .select_related("stage", "stage__board", "assignee")
        .order_by("due_date", "id")
    )

    # 2. Total e concluidas por quadro, em uma agregacao.
    por_quadro = {
        linha["stage__board_id"]: linha
        for linha in aplicar_escopo(da_empresa, user)
        .values("stage__board_id")
        .annotate(total=Count("id"), concluidas=Count("id", filter=Q(is_completed=True)))
    }

    # 3. Quadros (nomes).
    quadros_db = list(Board.objects.filter(company=user.company).order_by("created_at"))

    # --- Status de cada pendente -----------------------------------------
    linhas, vencidos, bloqueados, vencem_hoje = [], 0, 0, 0
    vencidos_por_quadro, abertos_por_pessoa, vencidos_por_pessoa = {}, {}, {}

    for c in pendentes:
        due = data_local(c.due_date)
        st = status_card(c, due, hoje)
        bid = c.stage.board_id

        if st == "vencido":
            vencidos += 1
            vencidos_por_quadro[bid] = vencidos_por_quadro.get(bid, 0) + 1
        elif st == "bloqueado":
            bloqueados += 1
        if st == "a_fazer" and due == hoje:
            vencem_hoje += 1

        if c.assignee_id:
            abertos_por_pessoa[c.assignee_id] = abertos_por_pessoa.get(c.assignee_id, 0) + 1
            if st == "vencido":
                vencidos_por_pessoa[c.assignee_id] = vencidos_por_pessoa.get(c.assignee_id, 0) + 1

        # So o que pede acao entra na lista.
        if st in ("vencido", "bloqueado") or (st == "a_fazer" and due == hoje):
            linhas.append({
                "id": c.id,
                "titulo": c.title,
                "board_id": bid,
                "board_nome": c.stage.board.name,
                "etapa": c.stage.name,
                "responsavel": nome_responsavel(c),
                "status": st,
                "prazo": due.strftime("%d/%m") if due else None,
                "detalhe": _detalhe(st, due, c, hoje),
                "_ordem": (GRAVIDADE[st], due or hoje),
            })

    linhas.sort(key=lambda x: x["_ordem"])
    ocultas = max(0, len(linhas) - TETO_PENDENCIAS)
    for linha in linhas:
        linha.pop("_ordem")

    # --- Quadros ----------------------------------------------------------
    quadros = []
    for b in quadros_db:
        n = por_quadro.get(b.id, {"total": 0, "concluidas": 0})
        total, concl = n["total"], n["concluidas"]
        quadros.append({
            "id": b.id,
            "nome": b.name,
            "total": total,
            "concluidas": concl,
            "pendentes": total - concl,
            "vencidos": vencidos_por_quadro.get(b.id, 0),
            "progresso": int(round((concl / total) * 100)) if total else 0,
        })

    # --- Equipe: so quem tem card aberto, mais carregado primeiro ---------
    equipe = []
    if pode_ver_todos_os_cards(user) and abertos_por_pessoa:
        for u in User.objects.filter(company=user.company, id__in=abertos_por_pessoa.keys()):
            nome = f"{u.first_name} {u.last_name}".strip() or u.username.split("@")[0]
            equipe.append({
                "id": u.id,
                "nome": nome,
                "abertos": abertos_por_pessoa.get(u.id, 0),
                "vencidos": vencidos_por_pessoa.get(u.id, 0),
            })
        equipe.sort(key=lambda p: (-p["vencidos"], -p["abertos"]))

    total_concluidas = sum(n["concluidas"] for n in por_quadro.values())

    return {
        "escopo": "empresa" if pode_ver_todos_os_cards(user) else "proprios",
        "limiar_sobrecarga": limiar,
        "contadores": {
            "vencidos": vencidos,
            "bloqueados": bloqueados,
            "vencem_hoje": vencem_hoje,
            "pendentes": len(pendentes),
            "concluidas": total_concluidas,
        },
        "pendencias": linhas[:TETO_PENDENCIAS],
        "pendencias_ocultas": ocultas,
        "semana": montar_semana(pendentes, janela_dias_uteis(hoje, dias), hoje, limiar),
        "quadros": quadros,
        "equipe": equipe,
    }