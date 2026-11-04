/**
 * Opciones de @apidevtools/swagger-parser.
 * Las referencias externas y el resolver HTTP quedan desactivados: el servidor
 * no descarga ni abre documentos fuera del archivo que se está interpretando.
 */
export const openApiParserOptions = {
  resolve: {
    external: false,
    http: false,
  },
  dereference: {
    circular: false,
  },
};
