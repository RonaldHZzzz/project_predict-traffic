export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Sistema de Monitoreo</h3>
            <p className="text-sm text-muted-foreground">
              Análisis en tiempo real del tráfico vehicular en Carretera Los Chorros, El Salvador.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Navegación</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <a href="/" className="hover:text-foreground transition">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/analytics" className="hover:text-foreground transition">
                  Análisis
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Contacto</h4>
            <p className="text-sm text-muted-foreground">Para reportes o consultas, contáctenos.</p>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Tráfico Los Chorros. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
