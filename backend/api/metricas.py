"""
Metricas — fonte UNICA da definicao de status, escopo e carga.

Existe porque o sistema tinha tres definicoes concorrentes de "vencido" e
"concluido": uma no painel_api.py, uma no analytics.py e uma no Dashboard.jsx
(em JavaScript). As duas ultimas usavam "esta na ultima etapa do quadro" como
sinonimo de concluido e nao excluiam concluidos da conta de atrasados, o que
fazia a tela de Inicio e a de Relatorios discordarem do Painel sobre os mesmos
cards.

Regra unica, agora: concluido e is_completed. Ponto.

Tudo aqui trabalha com data LOCAL (TIME_ZONE do settings). Card.due_date e
DateTimeField guardado em UTC, entao converter antes de comparar ou agrupar
nao e detalhe: sem isso, um prazo de 22h em Fortaleza cai no dia seguinte.
"""

from datetime import timedelta

from django.utils import timezone

DIAS_SEMANA = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]
LIMIAR_SOBRECARGA_PADRAO = 3
SEM_RESPONSAVEL = "Sem responsavel"

# Ordem de gravidade — usada para ordenar a lista de pendencias do Inicio.
GRAVIDADE = {"vencido": 0, "bloqueado": 1, "a_fazer": 2, "sem_prazo": 3, "feito": 4}


def pode_ver_todos_os_cards(user):
    """Escopo dos numeros: a empresa inteira ou so os cards da pessoa.

    ADMIN e MANAGER sempre veem tudo — era o comportamento anterior
    (`role == 'MEMBER'`) e mexer nisso seria tirar acesso de quem ja tem.
    Para MEMBER, quem decide passa a ser o flag can_view_all_cards, que existia
    no model e nao era consultado em lugar nenhum.
    """
    return user.role in ("ADMIN", "MANAGER") or bool(user.can_view_all_cards)


def aplicar_escopo(queryset, user):
    if pode_ver_todos_os_cards(user):
        return queryset
    return queryset.filter(assignee=user)


def data_local(valor):
    """DateTimeField (UTC no banco) -> date no fuso do settings."""
    if not valor:
        return None
    return timezone.localtime(valor).date()


def status_card(card, due_local, hoje):
    """Precedencia fixa. O servidor decide, o cliente desenha.

    feito > bloqueado > sem_prazo > vencido > a_fazer
    """
    if card.is_completed:
        return "feito"
    if (card.blocked_by or "").strip():
        return "bloqueado"
    if due_local is None:
        return "sem_prazo"
    if due_local < hoje:
        return "vencido"
    return "a_fazer"


def nome_responsavel(card):
    user = card.assignee
    if not user:
        return None
    nome = f"{user.first_name} {user.last_name}".strip()
    return nome or (user.username or "").split("@")[0] or None


def janela_dias_uteis(hoje, dias):
    """Os proximos `dias` dias uteis a partir de hoje, hoje incluido."""
    janela, cursor = [], hoje
    while len(janela) < dias:
        if cursor.weekday() < 5:
            janela.append(cursor)
        cursor += timedelta(days=1)
    return janela


def montar_semana(cards, janela, hoje, limiar):
    """Faixa de carga por dia util.

    A sobrecarga e por PESSOA, nao por dia: oito cards entre cinco pessoas nao
    e gargalo, cinco cards na mesma pessoa e. Cards concluidos nao entram.
    """
    por_dia = {d: [] for d in janela}
    for c in cards:
        if c.is_completed:
            continue
        d = data_local(c.due_date)
        if d in por_dia:
            por_dia[d].append(c)

    semana = []
    for d in janela:
        do_dia = por_dia[d]

        carga_por_pessoa = {}
        for c in do_dia:
            nome = nome_responsavel(c) or SEM_RESPONSAVEL
            carga_por_pessoa[nome] = carga_por_pessoa.get(nome, 0) + 1

        if carga_por_pessoa:
            pessoa, maior = max(carga_por_pessoa.items(), key=lambda kv: kv[1])
        else:
            pessoa, maior = None, 0

        estourou = maior >= limiar

        semana.append({
            "data_iso": d.isoformat(),
            "dia": DIAS_SEMANA[d.weekday()],
            "rotulo": d.strftime("%d/%m"),
            "hoje": d == hoje,
            "carga": len(do_dia),
            "carga_maxima_responsavel": maior,
            "responsavel_sobrecarregado": pessoa if estourou else None,
            "sobrecarga": estourou,
            "card_ids": [c.id for c in do_dia],
        })
    return semana