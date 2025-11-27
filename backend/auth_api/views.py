from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import CustomTokenObtainPairSerializer, UserSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenObtainPairView

class RegisterView(APIView):
    """
    Vista para registrar un nuevo usuario.
    """
    # @swagger_auto_schema (method='post', request_body=openapi.Schema(
    #     type=openapi.TYPE_OBJECT,
    #     properties={
    #         'username': openapi.Schema(type=openapi.TYPE_STRING, description='Nombre de usuario'),
    #         'email': openapi.Schema(type=openapi.TYPE_STRING, description='Correo electrónico'),
    #         'password': openapi.Schema(type=openapi.TYPE_STRING, description='Contraseña'),
    #     },
    
    # ))    
    

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuario registrado exitosamente."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer