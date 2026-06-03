import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import JSONField


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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
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
    company = models.ForeignKey('Company', on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ADMIN')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        company_name = self.company.name if self.company else "SuperAdmin"
        return f"{self.username} ({self.get_role_display()} em {company_name})"


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

    # Conclusao — quando True, o card para de contar como atrasado
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_cards')

    def __str__(self):
        return self.title


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