import random
from datetime import date, datetime
from typing import List, Optional
import uuid
from decimal import Decimal
from .analytics import AnalyticsEngine
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password
from ninja import NinjaAPI, Schema, File
from ninja.files import UploadedFile
from ninja.security import HttpBearer
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Board, Stage, Card, CardLog, ChecklistItem, Tag, User, Comment, Attachment, Company, VerificationCode, ActivityLog, TeamInvite

class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        jwt_authenticator = JWTAuthentication()
        try:
            validated_token = jwt_authenticator.get_validated_token(token)
            user = jwt_authenticator.get_user(validated_token)
            return user
        except Exception:
            return None

api = NinjaAPI(title="Notrouble API", auth=JWTAuth())

# --- SCHEMAS ---
class RegisterSchema(Schema):
    company_name: str
    first_name: str
    last_name: str
    email: str
    password: str

class VerifySchema(Schema):
    email: str
    code: str

class CompanyOutSchema(Schema):
    id: uuid.UUID
    name: str
    theme_hex: str
    wallpaper_url: Optional[str] = None

    @staticmethod
    def resolve_wallpaper_url(obj):
        return obj.wallpaper.url if obj.wallpaper else None

class UserSchema(Schema):
    id: int
    username: str
    first_name: str
    last_name: str
    role: str 
    avatar_url: Optional[str] = None 
    company: Optional[CompanyOutSchema] = None 

    @staticmethod
    def resolve_avatar_url(obj):
        return obj.avatar.url if hasattr(obj, 'avatar') and obj.avatar else None

class TagSchema(Schema):
    id: uuid.UUID
    name: str
    color: str

class TagCreateSchema(Schema):
    name: str
    color: str

class CardTagSchema(Schema):
    tag_id: uuid.UUID

class ChecklistItemSchema(Schema):
    id: uuid.UUID
    title: str
    is_done: bool

class ChecklistCreateSchema(Schema):
    title: str

class ChecklistToggleSchema(Schema):
    is_done: bool

class CommentSchema(Schema):
    id: uuid.UUID
    text: str
    created_at: datetime
    user_name: Optional[str] = None

    @staticmethod
    def resolve_user_name(obj):
        if obj.user:
            return obj.user.first_name or obj.user.username
        return "Usuário"

class CommentCreateSchema(Schema):
    text: str

class AttachmentSchema(Schema):
    id: uuid.UUID
    filename: str
    url: str

    @staticmethod
    def resolve_url(obj):
        return obj.file.url if obj.file else ""

class CardOutSchema(Schema):
    id: uuid.UUID
    title: str
    stage_id: uuid.UUID
    tags: List[TagSchema] = []
    assignee: Optional[UserSchema] = None
    due_date: Optional[date] = None
    estimated_value: Optional[Decimal] = None
    invested_value: Optional[Decimal] = None 
    payment_method: Optional[str] = None
    checklist_count: int = 0
    checklist_done: int = 0

class CardCreateSchema(Schema):
    title: str
    stage_id: uuid.UUID

class CardMoveSchema(Schema):
    stage_id: uuid.UUID

class CardUpdateSchema(Schema):
    title: str
    description: Optional[str] = None
    stage_id: uuid.UUID
    due_date: Optional[date] = None
    estimated_value: Optional[Decimal] = None
    invested_value: Optional[Decimal] = None
    payment_method: Optional[str] = None
    assignee_id: Optional[int] = None

class CardDetailSchema(Schema):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    stage_id: uuid.UUID
    due_date: Optional[date] = None
    estimated_value: Optional[Decimal] = None
    invested_value: Optional[Decimal] = None
    payment_method: Optional[str] = None
    tags: List[TagSchema] = []
    assignee: Optional[UserSchema] = None
    checklist: List[ChecklistItemSchema] = []
    comments: List[CommentSchema] = []     
    attachments: List[AttachmentSchema] = [] 

class StageSchema(Schema):
    id: uuid.UUID
    name: str
    order: int
    cards: List[CardOutSchema]

class StageCreateSchema(Schema):
    name: str
    board_id: uuid.UUID

class StageUpdateSchema(Schema):
    name: str

class StageReorderSchema(Schema):
    stage_ids: List[uuid.UUID]

class BoardSchema(Schema):
    id: uuid.UUID
    name: str
    stages: List[StageSchema]

class BoardCreateSchema(Schema):
    name: str
    stages: List[str] = ["A Fazer", "Em Andamento", "Concluído"]

class BoardHealthSchema(Schema):
    board_id: uuid.UUID
    board_name: str
    total_cards: int
    active_cards: int
    completed_cards: int
    delayed_cards: int
    health_score: int

class ActivityLogSchema(Schema):
    id: int
    action: str
    description: str
    created_at: datetime
    user_name: str
    board_name: str

    @staticmethod
    def resolve_user_name(obj):
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name if name else obj.user.username.split('@')[0]
        return "Sistema"

    @staticmethod
    def resolve_board_name(obj):
        return obj.board.name if obj.board else "Geral"


# --- ROTAS DA API ---

@api.post("/register/", auth=None)
def register_user(request, payload: RegisterSchema):
    if User.objects.filter(username=payload.email).exists():
        return api.create_response(request, {"success": False, "message": "Email já cadastrado"}, status=400)
        
    company = Company.objects.create(name=payload.company_name)
    
    user = User.objects.create(
        username=payload.email,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        password=make_password(payload.password),
        company=company,
        role='ADMIN', 
        is_active=False 
    )
    
    board = Board.objects.create(name="Meu Primeiro Quadro", company=company)
    Stage.objects.create(name="A Fazer", board=board, order=0)
    Stage.objects.create(name="Em Andamento", board=board, order=1)
    Stage.objects.create(name="Concluído", board=board, order=2)

    code = str(random.randint(100000, 999999))
    VerificationCode.objects.create(user=user, code=code)

    return {"success": True, "message": "Conta criada! Verifique seu e-mail."}

@api.post("/verify/", auth=None)
def verify_code(request, payload: VerifySchema):
    user = get_object_or_404(User, username=payload.email)
    
    if user.is_active:
        return api.create_response(request, {"success": False, "message": "Conta já ativada."}, status=400)
        
    try:
        verification = user.verification_code
        if verification.code == payload.code:
            user.is_active = True
            user.save()
            verification.delete()
            return {"success": True, "message": "Conta verificada com sucesso!"}
        else:
            return api.create_response(request, {"success": False, "message": "Código inválido!"}, status=400)
    except Exception:
        return api.create_response(request, {"success": False, "message": "Nenhum código gerado para este usuário."}, status=400)

@api.get("/users/me/", response=UserSchema)
def get_current_user(request):
    return request.auth

# 🚀 NOVA ROTA: ATUALIZAR PERFIL DO USUÁRIO
class UserUpdateSchema(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None

@api.put("/users/me/update/")
def update_profile(request, payload: UserUpdateSchema):
    user = request.auth
    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.password: # Se ele preencher uma senha nova
        user.password = make_password(payload.password)
    user.save()
    ActivityLog.objects.create(company=user.company, user=user, action='UPDATED', description="atualizou as informações do próprio perfil")
    return {"success": True, "message": "Perfil atualizado!"}

@api.post("/users/me/avatar/")
def upload_avatar(request, file: UploadedFile = File(...)):
    user = request.auth
    user.avatar = file 
    user.save()
    return {"success": True, "avatar_url": user.avatar.url}

@api.get("/users/", response=List[UserSchema])
def list_users(request):
    return User.objects.filter(company=request.auth.company)


# -----------------------------------------
# ROTAS DE EQUIPE E CONVITES (SISTEMA DE LICENÇAS)
# --------------------------------------------

class InviteCreateSchema(Schema):
    email: str
    role: str = 'MEMBER'

class InviteOutSchema(Schema):
    id: uuid.UUID
    email: str
    role: str
    is_used: bool
    created_at: datetime

class AcceptInviteSchema(Schema):
    token: str
    first_name: str
    last_name: str
    password: str

@api.post("/team/invite/")
def invite_member(request, payload: InviteCreateSchema):
    user = request.auth
    if user.role not in ['ADMIN', 'MANAGER']:
        return api.create_response(request, {"success": False, "message": "Apenas Administradores ou Gerentes podem enviar convites."}, status=403)
        
    company = user.company
    current_users_count = User.objects.filter(company=company).count()
    pending_invites_count = TeamInvite.objects.filter(company=company, is_used=False).count()
    
    if (current_users_count + pending_invites_count) >= company.max_users:
        return api.create_response(request, {"success": False, "message": f"Limite de licenças atingido ({company.max_users}). Faça upgrade do plano para adicionar mais membros."}, status=403)
    
    token = str(uuid.uuid4())
    TeamInvite.objects.create(company=company, email=payload.email, role=payload.role, token=token)
    ActivityLog.objects.create(company=company, user=user, action='CREATED', description=f"enviou convite para {payload.email} ({payload.role})")
    
    print(f"\n\n{'='*60}")
    print(f"📧 E-MAIL DE CONVITE PARA: {payload.email}")
    print(f"🔗 LINK DE ACESSO: http://localhost:5173/invite?token={token}")
    print(f"{'='*60}\n\n")
    
    return {"success": True, "message": "Convite enviado com sucesso!"}

@api.get("/team/invites/", response=List[InviteOutSchema])
def list_pending_invites(request):
    return TeamInvite.objects.filter(company=request.auth.company, is_used=False).order_by('-created_at')

@api.delete("/team/invites/{invite_id}/")
def cancel_invite(request, invite_id: uuid.UUID):
    if request.auth.role not in ['ADMIN', 'MANAGER']:
        return api.create_response(request, {"success": False, "message": "Sem permissão."}, status=403)
        
    invite = get_object_or_404(TeamInvite, id=invite_id, company=request.auth.company)
    invite_email = invite.email
    invite.delete()
    ActivityLog.objects.create(company=request.auth.company, user=request.auth, action='DELETED', description=f"cancelou o convite de {invite_email}")
    return {"success": True, "message": "Convite cancelado."}

@api.post("/team/invite/accept/", auth=None)
def accept_invite(request, payload: AcceptInviteSchema):
    try:
        invite = TeamInvite.objects.get(token=payload.token)
    except TeamInvite.DoesNotExist:
        return api.create_response(request, {"success": False, "message": "Convite inválido ou não encontrado."}, status=400)
        
    if invite.is_used:
        return api.create_response(request, {"success": False, "message": "Este convite já foi utilizado."}, status=400)
        
    if User.objects.filter(username=invite.email).exists():
        return api.create_response(request, {"success": False, "message": "O e-mail deste convite já possui cadastro."}, status=400)
        
    user = User.objects.create(
        username=invite.email,
        email=invite.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        password=make_password(payload.password),
        company=invite.company,
        role=invite.role,
        is_active=True 
    )
    invite.is_used = True
    invite.save()
    ActivityLog.objects.create(company=invite.company, user=user, action='CREATED', description="entrou na equipe através do convite")
    return {"success": True, "message": "Conta criada com sucesso! Faça login."}

@api.delete("/team/users/{user_id}/")
def remove_team_member(request, user_id: int):
    if request.auth.role != 'ADMIN':
        return api.create_response(request, {"success": False, "message": "Apenas o Administrador pode excluir membros."}, status=403)
        
    member_to_remove = get_object_or_404(User, id=user_id, company=request.auth.company)
    if member_to_remove.id == request.auth.id:
        return api.create_response(request, {"success": False, "message": "Você não pode se auto-excluir por aqui."}, status=400)
        
    member_email = member_to_remove.email
    member_to_remove.delete()
    ActivityLog.objects.create(company=request.auth.company, user=request.auth, action='DELETED', description=f"removeu o usuário {member_email} da empresa")
    return {"success": True, "message": "Membro removido da equipe."}


# --- RESTO DAS ROTAS (EMPRESA / KANBAN) ---
class CompanyUpdateSchema(Schema):
    name: Optional[str] = None
    theme_hex: Optional[str] = None

@api.put("/company/update/")
def update_company(request, payload: CompanyUpdateSchema):
    if request.auth.role != 'ADMIN':
        return api.create_response(request, {"success": False, "message": "Apenas admins alteram a empresa."}, status=403)
    
    company = request.auth.company
    if payload.name:
        company.name = payload.name
    if payload.theme_hex:
        company.theme_hex = payload.theme_hex
    company.save()
    ActivityLog.objects.create(company=company, user=request.auth, action='UPDATED', description="atualizou as configurações da empresa")
    return {"success": True, "message": "Empresa atualizada com sucesso!"}

@api.post("/company/wallpaper/")
def upload_wallpaper(request, file: UploadedFile = File(...)):
    if request.auth.role != 'ADMIN':
        return api.create_response(request, {"success": False, "message": "Acesso negado."}, status=403)
        
    company = request.auth.company
    company.wallpaper = file
    company.save()
    return {"success": True, "wallpaper_url": company.wallpaper.url}

@api.post("/boards/", response=BoardSchema)
def create_board(request, payload: BoardCreateSchema):
    user = request.auth
    board = Board.objects.create(name=payload.name, company=user.company)
    for index, stage_name in enumerate(payload.stages):
        if stage_name.strip():
            Stage.objects.create(name=stage_name.strip(), board=board, order=index)
    if not payload.stages:
        Stage.objects.create(name="Nova Etapa", board=board, order=0)
    ActivityLog.objects.create(company=user.company, user=user, board=board, action='CREATED', description=f"criou o quadro '{board.name}'")
    return Board.objects.prefetch_related('stages', 'stages__cards', 'stages__cards__tags', 'stages__cards__assignee', 'stages__cards__checklist').get(id=board.id)

@api.get("/boards/", response=List[BoardSchema])
def list_boards(request):
    user = request.auth
    boards = Board.objects.filter(company=user.company).prefetch_related('stages', 'stages__cards', 'stages__cards__tags', 'stages__cards__assignee', 'stages__cards__checklist').all()
    for board in boards:
        for stage in board.stages.all(): 
            for card in stage.cards.all(): 
                card.checklist_count = card.checklist.count()
                card.checklist_done = card.checklist.filter(is_done=True).count()
    return boards

@api.delete("/boards/{board_id}/")
def delete_board(request, board_id: uuid.UUID):
    board = get_object_or_404(Board, id=board_id, company=request.auth.company)
    board_name = board.name
    board.delete()
    ActivityLog.objects.create(company=request.auth.company, user=request.auth, action='DELETED', description=f"excluiu permanentemente o quadro '{board_name}'")
    return {"success": True, "message": "Quadro excluído!"}

@api.get("/tags/", response=List[TagSchema])
def list_tags(request):
    return Tag.objects.filter(company=request.auth.company)

@api.post("/tags/", response=TagSchema)
def create_tag(request, payload: TagCreateSchema):
    return Tag.objects.create(name=payload.name, color=payload.color, company=request.auth.company)

@api.put("/tags/{tag_id}/", response=TagSchema)
def update_tag(request, tag_id: uuid.UUID, payload: TagCreateSchema):
    tag = get_object_or_404(Tag, id=tag_id, company=request.auth.company)
    tag.name = payload.name
    tag.color = payload.color
    tag.save()
    return tag

@api.delete("/tags/{tag_id}/")
def delete_tag(request, tag_id: uuid.UUID):
    get_object_or_404(Tag, id=tag_id, company=request.auth.company).delete()
    return {"success": True}

@api.post("/cards/{card_id}/comments/", response=CommentSchema)
def add_comment(request, card_id: uuid.UUID, payload: CommentCreateSchema):
    card = get_object_or_404(Card, id=card_id)
    return Comment.objects.create(card=card, text=payload.text, user=request.auth)

@api.post("/cards/", response=CardOutSchema)
def create_card(request, payload: CardCreateSchema):
    card = Card.objects.create(title=payload.title, stage_id=payload.stage_id)
    ActivityLog.objects.create(company=request.auth.company, user=request.auth, board=card.stage.board, card=card, action='CREATED', description=f"criou o card '{card.title}'")
    return card

@api.put("/cards/{card_id}/move/")
def move_card(request, card_id: uuid.UUID, payload: CardMoveSchema):
    card = get_object_or_404(Card, id=card_id)
    if card.stage_id != payload.stage_id:
        new_stage = get_object_or_404(Stage, id=payload.stage_id)
        CardLog.objects.create(card=card, from_stage_id=card.stage_id, to_stage_id=payload.stage_id)
        ActivityLog.objects.create(company=request.auth.company, user=request.auth, board=new_stage.board, card=card, action='MOVED', description=f"moveu o card '{card.title}' para a etapa '{new_stage.name}'")
    card.stage_id = payload.stage_id
    card.save()
    return {"success": True, "message": "Card movido!"}

@api.get("/cards/{card_id}/", response=CardDetailSchema)
def get_card(request, card_id: uuid.UUID):
    return get_object_or_404(Card.objects.prefetch_related('checklist', 'tags', 'assignee'), id=card_id)

@api.put("/cards/{card_id}/", response=CardDetailSchema)
def update_card(request, card_id: uuid.UUID, payload: CardUpdateSchema):
    card = get_object_or_404(Card, id=card_id)
    if card.stage_id != payload.stage_id:
        new_stage = get_object_or_404(Stage, id=payload.stage_id)
        CardLog.objects.create(card=card, from_stage_id=card.stage_id, to_stage_id=payload.stage_id)
        ActivityLog.objects.create(company=request.auth.company, user=request.auth, board=new_stage.board, card=card, action='MOVED', description=f"moveu o card '{card.title}' para '{new_stage.name}'")

    card.title = payload.title
    card.description = payload.description
    card.stage_id = payload.stage_id
    card.due_date = payload.due_date
    card.estimated_value = payload.estimated_value
    card.invested_value = payload.invested_value
    card.payment_method = payload.payment_method
    
    if payload.assignee_id is not None:
        card.assignee_id = payload.assignee_id
    elif 'assignee_id' in payload.dict(exclude_unset=True):
        card.assignee_id = None
        
    card.save()
    ActivityLog.objects.create(company=request.auth.company, user=request.auth, board=card.stage.board, card=card, action='UPDATED', description=f"atualizou os detalhes do card '{card.title}'")
    return card

@api.delete("/cards/{card_id}/")
def delete_card(request, card_id: uuid.UUID):
    card = get_object_or_404(Card, id=card_id)
    board_ref = card.stage.board
    title_ref = card.title
    card.delete()
    ActivityLog.objects.create(company=request.auth.company, user=request.auth, board=board_ref, action='DELETED', description=f"excluiu o card '{title_ref}'")
    return {"success": True, "message": "Card excluído permanentemente"}

@api.post("/cards/{card_id}/checklist/", response=ChecklistItemSchema)
def add_checklist_item(request, card_id: uuid.UUID, payload: ChecklistCreateSchema):
    return ChecklistItem.objects.create(card=get_object_or_404(Card, id=card_id), title=payload.title)

@api.put("/checklist/{item_id}/", response=ChecklistItemSchema)
def toggle_checklist_item(request, item_id: uuid.UUID, payload: ChecklistToggleSchema):
    item = get_object_or_404(ChecklistItem, id=item_id)
    item.is_done = payload.is_done
    item.save()
    return item

@api.post("/cards/{card_id}/tags/")
def add_tag_to_card(request, card_id: uuid.UUID, payload: CardTagSchema):
    get_object_or_404(Card, id=card_id).tags.add(get_object_or_404(Tag, id=payload.tag_id))
    return {"success": True}

@api.delete("/cards/{card_id}/tags/{tag_id}/")
def remove_tag_from_card(request, card_id: uuid.UUID, tag_id: uuid.UUID):
    get_object_or_404(Card, id=card_id).tags.remove(get_object_or_404(Tag, id=tag_id))
    return {"success": True}

@api.post("/cards/{card_id}/attachments/")
def upload_attachment(request, card_id: uuid.UUID, file: UploadedFile = File(...)):
    attachment = Attachment.objects.create(card=get_object_or_404(Card, id=card_id), file=file, filename=file.name)
    return {"id": attachment.id, "filename": attachment.filename, "url": attachment.file.url}

@api.post("/stages/")
def create_stage(request, payload: StageCreateSchema):
    stage = Stage.objects.create(name=payload.name, board=get_object_or_404(Board, id=payload.board_id))
    return {"success": True, "id": stage.id, "name": stage.name}

@api.put("/stages/{stage_id}/")
def update_stage(request, stage_id: uuid.UUID, payload: StageUpdateSchema):
    stage = get_object_or_404(Stage, id=stage_id)
    stage.name = payload.name
    stage.save()
    return {"success": True}

@api.delete("/stages/{stage_id}/")
def delete_stage(request, stage_id: uuid.UUID):
    get_object_or_404(Stage, id=stage_id).delete()
    return {"success": True}

@api.put("/boards/{board_id}/stages/reorder/")
def reorder_stages(request, board_id: uuid.UUID, payload: StageReorderSchema):
    for index, s_id in enumerate(payload.stage_ids):
        Stage.objects.filter(id=s_id, board_id=board_id).update(order=index)
    return {"success": True}

@api.get("/analytics/boards/{board_id}/health/", response=BoardHealthSchema)
def board_health_metrics(request, board_id: uuid.UUID):
    return AnalyticsEngine.get_board_health(board_id, request.auth)

@api.get("/analytics/logs/", response=List[ActivityLogSchema])
def get_activity_logs(request):
    user = request.auth
    logs = ActivityLog.objects.filter(company=user.company).select_related('user', 'board')
    if getattr(user, 'role', 'ADMIN') == 'MEMBER':
        logs = logs.filter(user=user)
    return logs.order_by('-created_at')[:50]

class DashboardMetricsSchema(Schema):
    financial: dict
    productivity: dict
    tags: list

@api.get("/analytics/dashboard/", response=DashboardMetricsSchema)
def get_dashboard_metrics(request):
    return AnalyticsEngine.get_full_dashboard(request.auth)