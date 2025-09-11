#!/bin/bash
echo "🚀 Configurazione WhatsApp Bot..."

# Install Python dependencies
pip install -r requirements.txt

# Download ChromeDriver
python -c "from webdriver_manager.chrome import ChromeDriverManager; ChromeDriverManager().install()"

echo "✅ Setup completato!"
echo "📱 Ora puoi usare il bot WhatsApp"
