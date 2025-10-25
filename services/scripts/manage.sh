#!/bin/bash
# -----------------------------------------------------------------------------
# manage.sh - CoinBreakr service management script
# -----------------------------------------------------------------------------

set -euo pipefail

SERVICE_NAME="coinbreakr"
APP_DIR="/opt/coinbreakr"

show_usage() {
    echo "CoinBreakr Service Management"
    echo "============================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status    - Show service and container status"
    echo "  start     - Start the service"
    echo "  stop      - Stop the service"
    echo "  restart   - Restart the service"
    echo "  logs      - Show service logs"
    echo "  health    - Run health checks"
    echo "  ssl-renew - Renew SSL certificates"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 restart"
    echo "  $0 logs"
}

case "${1:-}" in
    "status")
        echo "🔍 Checking CoinBreakr service status..."
        "${APP_DIR}/scripts/status-check.sh"
        ;;
    "start")
        echo "🚀 Starting CoinBreakr service..."
        systemctl start ${SERVICE_NAME}.service
        echo "✅ Service started"
        ;;
    "stop")
        echo "🛑 Stopping CoinBreakr service..."
        systemctl stop ${SERVICE_NAME}.service
        echo "✅ Service stopped"
        ;;
    "restart")
        echo "🔄 Restarting CoinBreakr service..."
        systemctl restart ${SERVICE_NAME}.service
        echo "✅ Service restarted"
        ;;
    "logs")
        echo "📝 Showing CoinBreakr service logs..."
        journalctl -u ${SERVICE_NAME}.service -f
        ;;
    "health")
        echo "🏥 Running health checks..."
        "${APP_DIR}/scripts/health-check.sh"
        ;;
    "ssl-renew")
        echo "🔐 Renewing SSL certificates..."
        "${APP_DIR}/scripts/ssl-renew.sh"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac