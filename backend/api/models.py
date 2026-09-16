import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import JSONField
from django.utils import timezone


class ActivityLog(models.Model):
    ACTION_CHOICES = (
        ('CREATED', 'Criou'),
        ('UPDATED', 'Atualizou'),
        ('MOVED', 'Moveu'),
        ('DELETED', 'Excluiu'),
        ('COMPLETED', 'Concluiu')
    )

    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)
    board = models.ForeignKey('Board', on_delete=models.CASCADE, null=True, blank=True)
    card = models.ForeignKey('Card', on_delete=models.SET_NULL, null=True, blank=True)

    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.CharField(max_length=255)
    details = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.first_name} {self.action} - {self.created_at}"


class Company(models.Model):
    COMPANY_TYPE_CHOICES = (
        ('contabil', 'Contabilidade'),
        ('vistos', 'Assessoria de Vistos'),
        ('tech', 'Tecnologia'),
        ('juridico', 'Juridico'),
        ('consultoria', 'Consultoria'),
        ('outro', 'Outro'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    company_type = models.CharField(max_length=30, choices=COMPANY_TYPE_CHOICES, default='outro')
    theme_hex = models.CharField(max_length=7, default="#3B82F6")
    wallpaper = models.ImageField(upload_to='wallpapers/', null=True, blank=True)
    max_users = models.IntegerField(default=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrador (Dono)'),
        ('MANAGER', 'Gerente de Projeto'),
        ('MEMBER', 'Membro da Equipe')
    )
    SECTOR_CHOICES = (
        ('geral', 'Geral'),
        ('fiscal', 'Fiscal'),
        ('pessoal', 'Departamento Pessoal'),
        ('contabil', 'Contabil'),
        ('financeiro', 'Financeiro'),
        ('ti', 'Tecnologia'),
        ('comercial', 'Comercial'),
        ('juridico', 'Juridico'),
        ('administrativo', 'Administrativo'),
    )

    company = models.ForeignKey('Company', on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ADMIN')
    sector = models.CharField(max_length=30, choices=SECTOR_CHOICES, default='geral')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # Permissoes sandbox — admin configura no painel
    can_view_all_cards = models.BooleanField(default=False)
    can_view_financials = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_manage_team = models.BooleanField(default=False)

    def __str__(self):
        company_name = self.company.name if self.company else "SuperAdmin"
        return f"{self.username} ({self.get_role_display()} em {company_name})"

    def has_full_access(self):
        return self.role == 'ADMIN'

    # Gate do Painel de Roadmap (plano Business).
    # ADMIN e dono da conta: sempre tem acesso, independente do flag sandbox,
    # que nasce com default=False e travaria o proprio dono fora do recurso.
    def can_access_painel(self):
        return self.role == 'ADMIN' or self.can_view_reports


class VerificationCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_code')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Code {self.code} for {self.user.username}"


class Board(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='boards')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class Stage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} - {self.board.name}"


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#3B82F6")

    def __str__(self):
        return self.name


class Frente(models.Model):
    """Agrupador de workstream dentro de um board — usado pelo Painel de Roadmap.

    Existe porque Tag e multivalorada (um card pode ter varias) e Board no
    NoTrouble e por cliente/projeto. A frente e a fatia vertical de trabalho
    dentro de um mesmo board: 'Fiscal', 'Plataforma', 'Comercial'.

    Card.frente e nullable com SET_NULL: excluir uma frente NAO apaga card,
    so joga os cards para o balde 'Sem frente' no Painel.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='frentes')
    name = models.CharField(max_length=80)
    color = models.CharField(max_length=7, default="#67737E", help_text="Hex com #, ex: #1F5FA8")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'name']
        unique_together = [('board', 'name')]
        indexes = [models.Index(fields=['board', 'order'])]

    def __str__(self):
        return f"{self.name} - {self.board.name}"


class Card(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Baixa'),
        ('medium', 'Media'),
        ('high', 'Alta'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stage = models.ForeignKey(Stage, on_delete=models.CASCADE, related_name='cards')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='cards')
    due_date = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')

    # Financeiro
    estimated_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    invested_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_method = models.CharField(max_length=100, blank=True, null=True)
    payment_date = models.DateField(null=True, blank=True)

    # Conclusao
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    # --- Painel de Roadmap ---
    frente = models.ForeignKey(
        Frente,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='cards',
        help_text="Frente de trabalho. Nulo cai em 'Sem frente' no Painel.",
    )
    blocked_by = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="Quem esta segurando a entrega. Vazio = nao bloqueado.",
    )
    blocked_since = models.DateField(
        null=True,
        blank=True,
        help_text="Preenchido automaticamente quando blocked_by passa a ter valor.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_cards')

    class Meta:
        # Card nao tem FK direta para Board (o caminho e stage__board), entao os
        # indices do Painel sao por stage. O filtro do endpoint e stage__board=X,
        # que o planner resolve pelo stage_id ja indexado pela FK.
        indexes = [
            models.Index(fields=['stage', 'due_date']),
            models.Index(fields=['stage', 'is_completed']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Mantem blocked_since coerente com blocked_by.

        Regra: a data marca o inicio do bloqueio ATUAL. Trocar quem esta
        segurando (Getulio -> Lucas) nao reinicia a contagem, porque o card
        continua parado desde a mesma data. So desbloquear e rebloquear reinicia.

        Protecao extra: se o chamador passar update_fields sem incluir
        blocked_since, o valor recalculado seria descartado na gravacao e o card
        ficaria bloqueado com data nula. Nesse caso o campo entra no
        update_fields automaticamente.
        """
        bloqueado_agora = bool((self.blocked_by or "").strip())
        anterior = self.blocked_since

        if bloqueado_agora and self.blocked_since is None:
            self.blocked_since = timezone.localdate()
        elif not bloqueado_agora:
            self.blocked_since = None

        update_fields = kwargs.get('update_fields')
        if update_fields is not None and self.blocked_since != anterior:
            kwargs['update_fields'] = set(update_fields) | {'blocked_since'}

        super().save(*args, **kwargs)

    @property
    def is_blocked(self):
        return bool((self.blocked_by or "").strip())

    @property
    def dias_bloqueado(self):
        """Dias corridos desde o inicio do bloqueio. 0 = bloqueado hoje."""
        if not self.blocked_since:
            return None
        return (timezone.localdate() - self.blocked_since).days


class TeamInvite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invites')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES, default='MEMBER')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Convite para {self.email} ({self.company.name})"


class ChecklistItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='checklist')
    title = models.CharField(max_length=255)
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        status = "[X]" if self.is_done else "[ ]"
        return f"{status} {self.title}"


class CardLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='history')
    from_stage = models.ForeignKey(Stage, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs_left')
    to_stage = models.ForeignKey(Stage, on_delete=models.CASCADE, related_name='logs_entered')
    moved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.card.title} movido para {self.to_stage.name}"


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comentario de {self.user} em {self.card.title}"


class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/')
    filename = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename