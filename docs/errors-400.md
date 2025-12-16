# Casos de error 400 (Validación)

La API utiliza `express-validator` + un middleware `validar` para devolver errores 400 cuando el
payload o los parámetros no cumplen con las reglas.

## Formato de respuesta

```json
{
  "errors": [
    { "field": "email", "msg": "Email inválido", "location": "body" }
  ]
}
