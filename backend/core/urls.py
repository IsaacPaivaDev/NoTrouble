import os

from django.contrib import admin
from django.urls import path, re_path
from django.http import JsonResponse, Http404
from django.views.static import serve
from django.conf import settings

from api.endpoints import api

# Importando as views prontas do JWT
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def servir_midia(request, path):
    """Serve arquivos enviados pelo usuario (avatar, wallpaper).

    POR QUE ISTO EXISTE:
    antes a linha era `+ static(settings.MEDIA_URL, document_root=MEDIA_ROOT)`.
    Essa funcao do Django tem uma guarda interna: `if not settings.DEBUG: return []`.
    Como o Render roda com DEBUG=False, a rota /media/ NUNCA foi registrada em
    producao — toda foto de perfil dava 404 desde sempre.

    O log abaixo diz, no log do Render, exatamente por que um arquivo nao
    apareceu: se ele sumiu do disco (deploy novo) ou se o caminho esta errado.
    """
    caminho_completo = os.path.join(settings.MEDIA_ROOT, path)

    if not os.path.exists(caminho_completo):
        try:
            pasta = os.path.dirname(caminho_completo)
            vizinhos = os.listdir(pasta)[:10] if os.path.isdir(pasta) else "(pasta nao existe)"
        except Exception as e:
            vizinhos = f"(erro ao listar: {e})"

        print(
            f"[MIDIA 404] pedido='{path}' | procurei em='{caminho_completo}' | "
            f"MEDIA_ROOT='{settings.MEDIA_ROOT}' | arquivos na pasta={vizinhos} | "
            f"CAUSA PROVAVEL: o disco do Render e efemero e foi recriado no ultimo deploy. "
            f"Correcao definitiva: mover os uploads para o Supabase Storage."
        )
        raise Http404(f"Arquivo de midia nao encontrado: {path}")

    return serve(request, path, document_root=settings.MEDIA_ROOT)


def diagnostico_midia(request):
    """GET /media-diag/ — o que existe de verdade no disco agora.

    Rota de diagnostico, sem autenticacao mas sem expor conteudo: devolve so
    nomes de arquivo e tamanhos, nunca o arquivo. Pode remover quando o
    armazenamento estiver no Supabase.
    """
    raiz = str(settings.MEDIA_ROOT)
    relatorio = {
        "media_root": raiz,
        "media_url": settings.MEDIA_URL,
        "debug": settings.DEBUG,
        "storage": settings.STORAGES.get("default", {}).get("BACKEND"),
        "raiz_existe": os.path.isdir(raiz),
        "pastas": {},
    }

    if relatorio["raiz_existe"]:
        for pasta_atual, _subpastas, arquivos in os.walk(raiz):
            relativo = os.path.relpath(pasta_atual, raiz)
            relatorio["pastas"][relativo] = [
                {"nome": a, "bytes": os.path.getsize(os.path.join(pasta_atual, a))}
                for a in arquivos[:25]
            ]

    relatorio["total_arquivos"] = sum(len(v) for v in relatorio["pastas"].values())
    if relatorio["total_arquivos"] == 0:
        relatorio["leitura"] = (
            "Nenhum arquivo no disco. Se voce acabou de enviar uma foto e ela sumiu, "
            "houve um deploy no meio; se nunca teve arquivo nenhum, o upload nao esta gravando."
        )
    return JsonResponse(relatorio, json_dumps_params={"indent": 2})


urlpatterns = [
    path('admin/', admin.site.urls),

    # 🚨 JWT ANTES DO NINJA 🚨
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # O Ninja captura todo o resto daqui pra baixo
    path('api/', api.urls),

    # Diagnostico de midia — remover quando o armazenamento for para a nuvem
    path('media-diag/', diagnostico_midia),

    # Midia enviada pelo usuario
    re_path(r'^media/(?P<path>.*)$', servir_midia),
]