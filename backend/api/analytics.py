from decimal import Decimal

from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Sum, F, Case, When, Value, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone

from .models import Board, Card, ActivityLog, Tag
from .metricas import aplicar_escopo

DEC = DecimalField(max_digits=12, decimal_places=2)


class AnalyticsEngine:
    """Metricas agregadas da empresa.

    CORRECAO IMPORTANTE (modulo Painel de Roadmap):
    ate aqui, "concluido" significava "esta na ultima etapa do quadro" e
    "atrasado" nao excluia concluidos. Isso fazia Relatorios e Inicio
    discordarem do Painel sobre os mesmos cards. A definicao agora e uma so,
    vinda de metricas.py: concluido e is_completed.

    Tambem trocado date.today() por timezone.localdate(), que respeita o
    TIME_ZONE do settings — sem isso os numeros viram de dia as 21h.
    """

    # -- Saude de um quadro ------------------------------------------------
    @staticmethod
    def get_board_health(board_id, user):
        board = get_object_or_404(Board, id=board_id, company=user.company)
        hoje = timezone.localdate()

        cards = aplicar_escopo(Card.objects.filter(stage__board=board), user)

        numeros = cards.aggregate(
            total=Count('id'),
            concluidos=Count('id', filter=Q(is_completed=True)),
            # Atrasado = prazo vencido E ainda nao concluido.
            atrasados=Count('id', filter=Q(is_completed=False, due_date__date__lt=hoje)),
        )

        total = numeros['total'] or 0
        concluidos = numeros['concluidos'] or 0
        atrasados = numeros['atrasados'] or 0
        ativos = total - concluidos

        saude = 100
        if ativos > 0:
            saude = max(0, int(100 - ((atrasados / ativos) * 100)))

        return {
            "board_id": board.id,
            "board_name": board.name,
            "total_cards": total,
            "active_cards": ativos,
            "completed_cards": concluidos,
            "delayed_cards": atrasados,
            "health_score": saude,
        }

    # -- Log ---------------------------------------------------------------
    @staticmethod
    def log_activity(user, action, description, card=None, board=None, details=None):
        if not user or not hasattr(user, 'company'):
            return

        ActivityLog.objects.create(
            company=user.company,
            user=user,
            board=board if board else (card.stage.board if card and card.stage else None),
            card=card,
            action=action,
            description=description,
            details=details,
        )

    # -- Financeiro --------------------------------------------------------
    @staticmethod
    def get_financial_metrics(user):
        cards_qs = aplicar_escopo(
            Card.objects.filter(stage__board__company=user.company), user
        )

        # Antes isto era um laco Python sobre todos os cards com valor. Agora o
        # banco resolve: uma query, com a diferenca anotada e somada em dois
        # baldes (lucro e prejuizo).
        anotado = cards_qs.annotate(
            diferenca=Coalesce(F('estimated_value'), Value(Decimal('0')), output_field=DEC)
                      - Coalesce(F('invested_value'), Value(Decimal('0')), output_field=DEC)
        )

        numeros = anotado.aggregate(
            estimado=Coalesce(Sum('estimated_value'), Value(Decimal('0')), output_field=DEC),
            investido=Coalesce(Sum('invested_value'), Value(Decimal('0')), output_field=DEC),
            lucro=Coalesce(Sum(Case(
                When(Q(diferenca__gte=0) & ~Q(estimated_value__isnull=True, invested_value__isnull=True),
                     then=F('diferenca')),
                default=Value(Decimal('0')), output_field=DEC,
            )), Value(Decimal('0')), output_field=DEC),
            prejuizo=Coalesce(Sum(Case(
                When(diferenca__lt=0, then=-F('diferenca')),
                default=Value(Decimal('0')), output_field=DEC,
            )), Value(Decimal('0')), output_field=DEC),
        )

        estimado = numeros['estimado'] or Decimal('0')
        investido = numeros['investido'] or Decimal('0')

        return {
            "total_estimated": float(estimado),
            "total_invested": float(investido),
            "total_profit": float(numeros['lucro'] or 0),
            "total_loss": float(numeros['prejuizo'] or 0),
            "balance": float(estimado - investido),
        }

    # -- Produtividade -----------------------------------------------------
    @staticmethod
    def get_productivity_metrics(user):
        hoje = timezone.localdate()

        logs = ActivityLog.objects.filter(company=user.company)
        cards_qs = aplicar_escopo(
            Card.objects.filter(stage__board__company=user.company), user
        )

        from .metricas import pode_ver_todos_os_cards
        if not pode_ver_todos_os_cards(user):
            logs = logs.filter(user=user)

        atividade = logs.aggregate(
            criados=Count('id', filter=Q(action='CREATED', description__icontains="criou o card")),
            movidos=Count('id', filter=Q(action='MOVED')),
            excluidos=Count('id', filter=Q(action='DELETED', description__icontains="excluiu o card")),
        )

        # Antes: um laco sobre os quadros com duas queries dentro (~38 queries
        # com 19 quadros). Agora: uma agregacao so.
        numeros = cards_qs.aggregate(
            total=Count('id'),
            concluidos=Count('id', filter=Q(is_completed=True)),
            atrasados=Count('id', filter=Q(is_completed=False, due_date__date__lt=hoje)),
        )

        total = numeros['total'] or 0
        concluidos = numeros['concluidos'] or 0
        atrasados = numeros['atrasados'] or 0
        no_prazo = (total - concluidos) - atrasados

        return {
            "cards_created": atividade['criados'] or 0,
            "cards_moved": atividade['movidos'] or 0,
            "cards_deleted": atividade['excluidos'] or 0,
            "current_completed": concluidos,
            "current_delayed": max(0, atrasados),
            "current_on_time": max(0, no_prazo),
        }

    # -- Etiquetas ---------------------------------------------------------
    @staticmethod
    def get_tags_distribution(user):
        from .metricas import pode_ver_todos_os_cards

        if pode_ver_todos_os_cards(user):
            tags = Tag.objects.filter(company=user.company).annotate(
                card_count=Count('cards')
            )
        else:
            tags = Tag.objects.filter(company=user.company).annotate(
                card_count=Count('cards', filter=Q(cards__assignee=user))
            )

        tags = tags.filter(card_count__gt=0).order_by('-card_count')
        return [{"name": t.name, "color": t.color, "value": t.card_count} for t in tags]

    @staticmethod
    def get_full_dashboard(user):
        return {
            "financial": AnalyticsEngine.get_financial_metrics(user),
            "productivity": AnalyticsEngine.get_productivity_metrics(user),
            "tags": AnalyticsEngine.get_tags_distribution(user),
        }