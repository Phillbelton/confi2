# Comando: /continuar

Continúa con la siguiente tarea del TODO UI/UX Premium.

## Instrucciones

1. Leer `ESTADO-PROYECTO-UIUX.md` para contexto
2. Consultar `TODO-COMPLETO-UIUX.md` para siguiente tarea pendiente
3. Buscar código de implementación en `ANALISIS-UIUX-Y-PROPUESTA-MEJORAS.md`
4. Mostrar al usuario:
   - Qué tarea vas a hacer
   - Tiempo estimado
   - Archivos que modificarás
   - Pedir confirmación
5. Si el usuario confirma, implementar
6. Al terminar, actualizar `ESTADO-PROYECTO-UIUX.md`

## Workflow

```
1. Identificar siguiente tarea
2. Explicar qué harás
3. Pedir confirmación
4. Implementar
5. Actualizar estado
6. Commit automático
```

## Ejemplo de uso

```
Usuario: /continuar

Claude:
📋 Siguiente tarea: #3
━━━━━━━━━━━━━━━━━━━━
Tarea: Instalar librerías de animaciones
Archivos: package.json
Tiempo: 5 minutos
Comando: npm install @formkit/auto-animate canvas-confetti react-use-gesture

¿Proceder? (sí/no)
```
