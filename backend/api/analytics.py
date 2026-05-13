from datetime import date
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Sum
from django.utils import timezone
from .models import Board, Card, ActivityLog, Tag

class AnalyticsEngine:
    @staticmethod
    def get_board_health(board_id, user):
        board = get_object_or_404(Board, id=board_id, company=user.company)
        
        cards = Card.objects.filter(stage__board=board)
        
        # 🚀 FILTRO DE CARGO: Membro só conta a saúde dos próprios cards
        if user.role == 'MEMBER':
            cards = cards.filter(assignee=user)
        
        total_cards = cards.count()
        delayed_cards = cards.filter(due_date__lt=date.today()).count()
        
        last_stage = board.stages.order_by('-order').first()
        completed_cards = cards.filter(stage=last_stage).count() if last_stage else 0
        
        active_cards = total_cards - completed_cards

        health_score = 100
        if active_cards > 0:
            penalty_ratio = delayed_cards / active_cards
            health_score = max(0, int(100 - (penalty_ratio * 100)))

        return {
            "board_id": board.id,
            "board_name": board.name,
            "total_cards": total_cards,
            "active_cards": active_cards,
            "completed_cards": completed_cards,
            "delayed_cards": delayed_cards,
            "health_score": health_score
        }

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
            details=details
        )

    # 🚀 --- MOTORES DO DASHBOARD DE OKRs COM FILTRO DE CARGOS --- 🚀

    @staticmethod
    def get_financial_metrics(user):
        cards_qs = Card.objects.filter(stage__board__company=user.company)
        
        # 🚀 Filtra os dinheiros apenas para os cards atribuídos ao Membro
        if user.role == 'MEMBER':
            cards_qs = cards_qs.filter(assignee=user)

        metrics = cards_qs.aggregate(
            total_estimated=Sum('estimated_value'),
            total_invested=Sum('invested_value')
        )
        estimated = metrics['total_estimated'] or 0
        invested = metrics['total_invested'] or 0
        
        cards = cards_qs.exclude(estimated_value__isnull=True, invested_value__isnull=True)
        
        total_profit = 0
        total_loss = 0
        
        for c in cards:
            est = c.estimated_value or 0
            inv = c.invested_value or 0
            diff = est - inv
            if diff >= 0:
                total_profit += diff
            else:
                total_loss += abs(diff)

        return {
            "total_estimated": float(estimated),
            "total_invested": float(invested),
            "total_profit": float(total_profit),
            "total_loss": float(total_loss),
            "balance": float(estimated - invested)
        }

    @staticmethod
    def get_productivity_metrics(user):
        logs = ActivityLog.objects.filter(company=user.company)
        cards_qs = Card.objects.filter(stage__board__company=user.company)
        
        # 🚀 Filtro de Cargo
        if user.role == 'MEMBER':
            logs = logs.filter(user=user)
            cards_qs = cards_qs.filter(assignee=user)
        
        created = logs.filter(action='CREATED', description__icontains="criou o card").count()
        moved = logs.filter(action='MOVED').count()
        deleted = logs.filter(action='DELETED', description__icontains="excluiu o card").count()
        
        today = timezone.now().date()
        completed = 0
        delayed = 0
        
        for board in Board.objects.filter(company=user.company).prefetch_related('stages'):
            stages = list(board.stages.all().order_by('order'))
            if stages:
                last_stage = stages[-1]
                completed += cards_qs.filter(stage=last_stage).count()
                delayed += cards_qs.filter(stage__board=board, due_date__lt=today).exclude(stage=last_stage).count()
        
        total_cards = cards_qs.count()
        on_time = (total_cards - completed) - delayed

        return {
            "cards_created": created,
            "cards_moved": moved,
            "cards_deleted": deleted,
            "current_completed": completed,
            "current_delayed": max(0, delayed),
            "current_on_time": max(0, on_time)
        }

    @staticmethod
    def get_tags_distribution(user):
        if user.role == 'MEMBER':
            # Mostra as etiquetas apenas dos cards desse utilizador
            tags = Tag.objects.filter(company=user.company).annotate(
                card_count=Count('cards', filter=Q(cards__assignee=user))
            ).filter(card_count__gt=0).order_by('-card_count')
        else:
            tags = Tag.objects.filter(company=user.company).annotate(
                card_count=Count('cards')
            ).filter(card_count__gt=0).order_by('-card_count')
            
        return [{"name": t.name, "color": t.color, "value": t.card_count} for t in tags]

    @staticmethod
    def get_full_dashboard(user):
        return {
            "financial": AnalyticsEngine.get_financial_metrics(user),
            "productivity": AnalyticsEngine.get_productivity_metrics(user),
            "tags": AnalyticsEngine.get_tags_distribution(user)
        }